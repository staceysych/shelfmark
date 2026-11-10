import type { NextRequest } from 'next/server'
import { suggestGenre, type SearchResult } from '@/lib/books'

type OpenLibraryDoc = {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  number_of_pages_median?: number
  subject?: string[]
}

async function fetchOpenLibrary(url: URL, tries = 3) {
  let lastError = 'Search is unavailable right now.'
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Shelfmark/1.0 (personal reading journal)' },
      cache: 'no-store',
    })
    if (res.ok) return res
    lastError = `Open Library responded ${res.status}`
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

  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', query)
  url.searchParams.set(
    'fields',
    'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject',
  )
  url.searchParams.set('limit', '16')

  try {
    const res = await fetchOpenLibrary(url)
    const data = (await res.json()) as { docs?: OpenLibraryDoc[] }

    const results: SearchResult[] = (data.docs ?? [])
      .filter((doc) => doc.key && doc.title)
      .map((doc) => ({
        olKey: doc.key,
        title: doc.title,
        author: doc.author_name?.slice(0, 2).join(', ') ?? 'Unknown author',
        coverId: doc.cover_i ?? null,
        coverUrl: null,
        year: doc.first_publish_year ?? null,
        pages: doc.number_of_pages_median ?? null,
        suggestedGenre: suggestGenre(doc.subject),
        catalogGenre: doc.subject?.[0] ?? null,
      }))
      .sort((a, b) => Number(Boolean(b.coverId)) - Number(Boolean(a.coverId)))
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
