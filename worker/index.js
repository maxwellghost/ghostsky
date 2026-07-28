// Ghostsky's Worker entry point. Handles one job: generate real Open Graph
// meta tags for post/profile links so Discord/Slack/iMessage/etc. show a
// rich preview instead of a bare URL. Every other request just falls
// through to the static site (env.ASSETS) untouched.
//
// Why this exists: this is a pure static SPA — every URL normally serves
// the same generic index.html, so a crawler bot reading raw HTML never
// sees per-post data. Real Bluesky solves this with their own Go server;
// this is the Worker-native equivalent for a Cloudflare Workers deployment.

const BOT_UA_PATTERNS = [
  'discordbot',
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'telegrambot',
  'whatsapp',
  'skypeuripreview',
  'redditbot',
  'pinterest',
  'embedly',
  'quora link preview',
  'outbrain',
  'vkshare',
  'facebot',
  'bot',
]

// In-memory rate limiter — limits per IP within a single Worker instance.
// Workers are stateless and multi-instance, so this won't stop a fully
// distributed attack, but it will catch a single abusive crawler effectively.
const RATE_LIMIT_WINDOW_MS = 10_000 // 10 seconds
const RATE_LIMIT_MAX = 60            // max requests per IP per window
const rateLimitMap = new Map()

function isRateLimited(ip) {
  if (!ip) return false
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, {windowStart: now, count: 1})
    return false
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

function isBot(ua) {
  if (!ua) return false
  const lower = ua.toLowerCase()
  return BOT_UA_PATTERNS.some(p => lower.includes(p))
}

function esc(str) {
  return String(str || '').replace(
    /[&<>"']/g,
    c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c],
  )
}

function ogPage({title, description, images, url, type, publishedTime}) {
  const oembedUrl = `https://ghostsky.app/oembed?url=${encodeURIComponent(url)}&format=json`
  // Normalize: accept either a single string or an array; drop empties.
  const imageList = (Array.isArray(images) ? images : [images]).filter(Boolean)
  const hasImage = imageList.length > 0
  // Discord renders multiple same-URL embeds as a gallery when a page exposes
  // multiple og:image tags. Emit one per image.
  const ogImageTags = imageList
    .map(img => `<meta property="og:image" content="${esc(img)}">`)
    .join('\n')
  // twitter:image only takes one; use the first.
  const twitterImageTag = hasImage
    ? `<meta name="twitter:image" content="${esc(imageList[0])}">`
    : ''
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="https://ghostsky.app/favicon.png">
<link rel="alternate" type="application/json+oembed" href="${esc(oembedUrl)}" title="${esc(title)}">
<meta name="theme-color" content="#8B7FD6">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${ogImageTags}
<meta property="og:type" content="${type}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Ghostsky">
${publishedTime ? `<meta property="article:published_time" content="${esc(publishedTime)}">` : ''}
<meta name="twitter:card" content="${hasImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${twitterImageTag}
</head>
<body>
<p><a href="${esc(url)}">${esc(title)}</a>: ${esc(description)}</p>
</body>
</html>`
}

function ogResponse(html) {
  // GHOST: Vary: User-Agent is the important part here — without it,
  // Cloudflare's edge cache stores one response per URL regardless of who's
  // asking. The first bot to hit a profile/post link would get its OG-only
  // HTML cached, and a real human clicking that same link afterward could
  // then be served that same cached bot response instead of the real app.
  // This tells Cloudflare to cache bot and non-bot responses separately.
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=300',
      'vary': 'User-Agent',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  })
}

async function handlePost(handle, rkey, requestUrl) {
  const profileRes = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`,
    {signal: AbortSignal.timeout(5000)},
  )
  if (!profileRes.ok) return null
  const profile = await profileRes.json()

  const postUri = `at://${profile.did}/app.bsky.feed.post/${rkey}`
  const postRes = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(postUri)}&depth=0`,
    {signal: AbortSignal.timeout(5000)},
  )
  if (!postRes.ok) return null
  const threadData = await postRes.json()
  const post = threadData.thread && threadData.thread.post
  if (!post) return null

  const text = (post.record && post.record.text) || ''
  const authorName = profile.displayName || profile.handle
  // Collect every image from the post embed. Shapes that carry visuals:
  //   app.bsky.embed.images#view          -> embed.images[]
  //   app.bsky.embed.video#view           -> embed.thumbnail (poster frame)
  //   app.bsky.embed.recordWithMedia#view -> embed.media.images[] or
  //                                          embed.media.thumbnail (video)
  let imageArr = []
  if (post.embed) {
    if (Array.isArray(post.embed.images)) {
      imageArr = post.embed.images
    } else if (post.embed.thumbnail) {
      // Video post — use the poster frame as a static image. (We deliberately
      // do NOT emit og:video tags: a type:video embed hides the caption text
      // in Discord, and the caption matters more than inline playback.)
      imageArr = [{fullsize: post.embed.thumbnail}]
    } else if (post.embed.media && Array.isArray(post.embed.media.images)) {
      imageArr = post.embed.media.images
    } else if (post.embed.media && post.embed.media.thumbnail) {
      imageArr = [{fullsize: post.embed.media.thumbnail}]
    }
  }
  const images = imageArr
    .map(img => img && img.fullsize)
    .filter(Boolean)

  return ogPage({
    title: `${authorName} (@${profile.handle})`,
    description: text.slice(0, 300),
    images,
    url: requestUrl,
    type: 'link',
    publishedTime: (post.record && post.record.createdAt) || '',
  })
}

async function handleProfile(handle, requestUrl) {
  const profileRes = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`,
    {signal: AbortSignal.timeout(5000)},
  )
  if (!profileRes.ok) return null
  const profile = await profileRes.json()

  return ogPage({
    title: `${profile.displayName || profile.handle} (@${profile.handle})`,
    description: profile.description || '',
    images: profile.avatar ? [profile.avatar] : [],
    url: requestUrl,
    type: 'profile',
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const ua = request.headers.get('user-agent') || ''
    const ip = request.headers.get('cf-connecting-ip') || ''

    // Rate limit bot traffic on profile/post paths
    if (isBot(ua) && (url.pathname.startsWith('/profile/') || url.pathname === '/oembed')) {
      if (isRateLimited(ip)) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'retry-after': '10',
            'x-content-type-options': 'nosniff',
          },
        })
      }
    }

    // oEmbed endpoint — used by Discord/Slack to show provider name + icon
    if (url.pathname === '/oembed') {
      const targetUrl = url.searchParams.get('url') || ''
      const postMatch = targetUrl.match(/\/profile\/([^/]+)\/post\/([^/]+)/)
      const profileMatch = targetUrl.match(/\/profile\/([^/]+)/)

      let authorName = 'Ghostsky'
      let authorUrl = 'https://ghostsky.app'

      try {
        if (postMatch) {
          const profileRes = await fetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(postMatch[1])}`,
          )
          if (profileRes.ok) {
            const profile = await profileRes.json()
            authorName = `${profile.displayName || profile.handle} (@${profile.handle})`
            authorUrl = `https://ghostsky.app/profile/${profile.handle}`
          }
        } else if (profileMatch) {
          const profileRes = await fetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(profileMatch[1])}`,
          )
          if (profileRes.ok) {
            const profile = await profileRes.json()
            authorName = `${profile.displayName || profile.handle} (@${profile.handle})`
            authorUrl = `https://ghostsky.app/profile/${profile.handle}`
          }
        }
      } catch (e) {
        // fall through with defaults
      }

      const oembed = {
        type: 'rich',
        version: '1.0',
        provider_name: 'Ghostsky',
        provider_url: 'https://ghostsky.app',
        author_name: authorName,
        author_url: authorUrl,
      }

      return new Response(JSON.stringify(oembed), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300',
          'access-control-allow-origin': '*',
          'x-content-type-options': 'nosniff',
        },
      })
    }

    if (isBot(ua)) {
      // /profile/{handle}/post/{rkey}
      const postMatch = url.pathname.match(/^\/profile\/([^/]+)\/post\/([^/]+)\/?$/)
      // /profile/{handle}
      const profileMatch = url.pathname.match(/^\/profile\/([^/]+)\/?$/)

      if (postMatch || profileMatch) {
        // Synthetic cache key — never collides with real asset URLs, so a
        // cached OG page can never be served to a human and vice versa.
        const cacheKey = new Request(
          `${url.origin}${url.pathname}?__og_bot=1`,
        )
        const cached = await caches.default.match(cacheKey)
        if (cached) return cached

        try {
          const html = postMatch
            ? await handlePost(postMatch[1], postMatch[2], request.url)
            : await handleProfile(profileMatch[1], request.url)
          if (html) {
            const response = ogResponse(html)
            ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
            return response
          }
        } catch (e) {
          // fall through to static assets on any error — never break the real site
        }
      }
    }

    // Everyone else (real browsers, or bot requests that didn't match/failed
    // above) gets the normal static site. Also mark this response as varying
    // by User-Agent, for the same cache-correctness reason as ogResponse()
    // above — otherwise a bot's cached OG response could get served to a
    // real browser hitting the same URL, or vice versa.
    const assetResponse = await env.ASSETS.fetch(request)
    const response = new Response(assetResponse.body, assetResponse)
    response.headers.set('vary', 'User-Agent')
    return response
  },
}
