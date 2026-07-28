/**
 * GHOST: Native no-op. The favicon badge is a web-only concept (browser tab),
 * so on iOS/Android this renders nothing. The real implementation lives in
 * FaviconBadge.web.tsx.
 */
export function FaviconBadge() {
  return null
}
