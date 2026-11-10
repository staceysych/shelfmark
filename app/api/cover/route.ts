import type { NextRequest } from 'next/server'

function isAllowedCoverHost(hostname: string) {
  return (
    hostname === 'covers.openlibrary.org' ||
    hostname === 'archive.org' ||
    hostname.endsWith('.archive.org') ||
    hostname === 'books.google.com' ||
    hostname.endsWith('.googleusercontent.com') ||
    hostname === 'books.googleusercontent.com'
  )
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!raw) return new Response('Missing url', { status: 400 })

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'https:' || !isAllowedCoverHost(target.hostname)) {
    return new Response('Host not allowed', { status: 400 })
  }

  const upstream = await fetch(target, {
    headers: { 'User-Agent': 'Shelfmark/1.0 (personal reading journal)' },
    next: { revalidate: 86400 },
    redirect: 'follow',
  })

  if (!upstream.ok) {
    return new Response('Cover unavailable', { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    return new Response('Not an image', { status: 400 })
  }

  const bytes = await upstream.arrayBuffer()
  return new Response(bytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
