import {useEffect, useRef} from 'react'

import {useUnreadNotifications} from '#/state/queries/notifications/unread'

/**
 * GHOST: Draws a small glowy purple dot on the browser-tab favicon whenever
 * there are unread notifications, and removes it when there are none.
 *
 * Web-only (this file is .web.tsx; the native build gets FaviconBadge.tsx,
 * which is a no-op). Renders nothing itself — it's pure side-effect logic.
 *
 * How it works: we load the site's real favicon into an offscreen canvas,
 * paint a dot in the corner, and point <link rel="icon"> at the canvas image.
 * When notifications clear, we restore the original favicon href.
 */
export function FaviconBadge() {
  const numUnread = useUnreadNotifications()
  const hasUnread = !!numUnread // '' = none; any non-empty string = something
  // Remember the original favicon href so we can restore it.
  const originalHrefRef = useRef<string | null>(null)

  useEffect(() => {
    const head = document.head
    if (!head) return

    // Find (or create) the favicon link element.
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      head.appendChild(link)
    }

    // Capture the original favicon href once.
    if (originalHrefRef.current === null) {
      originalHrefRef.current = link.getAttribute('href') || '/favicon.png'
    }
    const originalHref = originalHrefRef.current

    if (!hasUnread) {
      // Restore the plain favicon.
      link.href = originalHref
      return
    }

    // Draw the badge. Load the base favicon into a canvas first.
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled || !link) return
      const size = 64
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Base favicon.
      ctx.drawImage(img, 0, 0, size, size)

      // Glowy purple badge in the top-right corner. A radial gradient halo
      // (bright center fading to transparent) gives a real glow at favicon
      // size, with a small bright core and thin white ring for definition.
      const cx = size - 20
      const cy = 20

      // Soft glow halo — large radial gradient, purple center to transparent.
      const glowR = 22
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
      glow.addColorStop(0, 'rgba(201, 190, 255, 0.95)')
      glow.addColorStop(0.35, 'rgba(139, 127, 214, 0.75)')
      glow.addColorStop(1, 'rgba(139, 127, 214, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Thin white ring for definition against the ghost.
      ctx.beginPath()
      ctx.arc(cx, cy, 13, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.fill()

      // Purple body.
      ctx.beginPath()
      ctx.arc(cx, cy, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#8B7FD6'
      ctx.fill()

      // Bright core highlight.
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#E4DEFF'
      ctx.fill()

      link.href = canvas.toDataURL('image/png')
    }
    img.onerror = () => {
      // If the favicon can't be loaded into the canvas, leave it untouched.
    }
    img.src = originalHref

    return () => {
      cancelled = true
    }
  }, [hasUnread])

  return null
}
