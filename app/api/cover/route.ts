import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { NextRequest } from 'next/server'

const MAX_BYTES = 5 * 1024 * 1024

function isPrivateIp(address: string) {
  const version = isIP(address)
  if (version === 4) {
    const parts = address.split('.').map(Number)
    const [a, b] = parts
    if (a === undefined || b === undefined) return true
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    return false
  }
  if (version === 6) {
    const normalized = address.toLowerCase()
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('::ffff:') // mapped IPv4 — treat as blocked unless parsed further
    )
  }
  return true
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase()
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  if (host === 'metadata.google.internal' || host.endsWith('.metadata.google.internal')) return true
  const ipVersion = isIP(host)
  if (ipVersion) return isPrivateIp(host)
  return false
}

async function assertSafeHttpsImageUrl(raw: string) {
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    throw new Response('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'https:') {
    throw new Response('Only https image URLs are allowed', { status: 400 })
  }
  if (target.username || target.password) {
    throw new Response('Credentials in URL are not allowed', { status: 400 })
  }
  if (isBlockedHostname(target.hostname)) {
    throw new Response('Host not allowed', { status: 400 })
  }

  try {
    const records = await lookup(target.hostname, { all: true })
    if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
      throw new Response('Host not allowed', { status: 400 })
    }
  } catch (error) {
    if (error instanceof Response) throw error
    throw new Response('Could not resolve host', { status: 400 })
  }

  return target
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!raw) return new Response('Missing url', { status: 400 })

  try {
    const target = await assertSafeHttpsImageUrl(raw)

    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Shelfmark/1.0 (personal reading journal)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    })

    if (!upstream.ok) {
      return new Response('Cover unavailable', { status: upstream.status })
    }

    // Re-check the final URL after redirects.
    await assertSafeHttpsImageUrl(upstream.url)

    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400 })
    }

    const lengthHeader = upstream.headers.get('content-length')
    if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
      return new Response('Image too large', { status: 400 })
    }

    const bytes = Buffer.from(await upstream.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) {
      return new Response('Image too large', { status: 400 })
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    if (error instanceof Response) return error
    return new Response('Cover unavailable', { status: 502 })
  }
}
