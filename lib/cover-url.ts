/** Client-side check for user-supplied cover links. */
export function isValidCoverImageUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false
    if (host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return false
    return true
  } catch {
    return false
  }
}

export function normalizeCoverImageUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  if (!isValidCoverImageUrl(value)) return null
  return value
}
