import type { NextRequest } from 'next/server'
import { suggestGenre, type SearchResult } from '@/lib/books'

type ImageLinks = {
  thumbnail?: string
  smallThumbnail?: string
}

type GoogleBook = {
  id?: string
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publishedDate?: string
    pageCount?: number
    mainCategory?: string
    categories?: string[]
    description?: string
    imageLinks?: ImageLinks
  }
}

function catalogSubjects(info: NonNullable<GoogleBook['volumeInfo']>) {
  const categories = [...(info.categories ?? []), info.mainCategory].filter((value): value is string => Boolean(value))
  if (categories.length > 0) return categories
  return [info.subtitle, info.description?.slice(0, 400)].filter((value): value is string => Boolean(value))
}

function coverFromGoogle(links?: ImageLinks) {
  const raw = links?.thumbnail || links?.smallThumbnail
  if (!raw) return null
  return raw.replace(/^http:\/\//, 'https://').replace('zoom=1', 'zoom=2')
}

async function fetchGoogleBooks(url: URL, tries = 3) {
  let lastError = 'Search is unavailable right now.'
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { cache: 'no-store' })
    if (res.ok) return res
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    lastError = body?.error?.message || `Google Books responded ${res.status}`
    const transient = res.status === 503 || res.status === 429
    if (!transient || attempt === tries) throw new Error(lastError)
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
  }
  throw new Error(lastError)
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 200) {
    return Response.json({ results: [] })
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', '10')
  if (apiKey) url.searchParams.set('key', apiKey)

  try {
    const res = await fetchGoogleBooks(url)
    const data = (await res.json()) as { items?: GoogleBook[] }

    const results: SearchResult[] = (data.items ?? [])
      .filter((item) => item.id && item.volumeInfo?.title)
      .map((item) => {
        const info = item.volumeInfo!
        const year = info.publishedDate ? Number.parseInt(info.publishedDate.slice(0, 4), 10) : null
        const subjects = catalogSubjects(info)
        return {
          olKey: `gb:${item.id}`,
          title: info.title!,
          author: info.authors?.slice(0, 2).join(', ') ?? 'Unknown author',
          coverId: null,
          coverUrl: coverFromGoogle(info.imageLinks),
          year: Number.isFinite(year) ? year : null,
          pages: info.pageCount ?? null,
          suggestedGenre: suggestGenre(subjects),
          catalogGenre: info.categories?.[0] ?? info.mainCategory ?? null,
        }
      })
      .sort((a, b) => Number(Boolean(b.coverUrl)) - Number(Boolean(a.coverUrl)))
      .slice(0, 10)

    return Response.json({ results })
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Search is unavailable right now.'
    return Response.json({ results: [], error: message }, { status: 502 })
  }
}
