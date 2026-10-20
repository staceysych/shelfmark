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
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Shelfmark/1.0 (personal reading journal)' },
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) throw new Error(`Open Library responded ${res.status}`)
    const data: { docs: OpenLibraryDoc[] } = await res.json()

    const results: SearchResult[] = data.docs
      .map((doc) => ({
        olKey: doc.key,
        title: doc.title,
        author: doc.author_name?.slice(0, 2).join(', ') ?? 'Unknown author',
        coverId: doc.cover_i ?? null,
        year: doc.first_publish_year ?? null,
        pages: doc.number_of_pages_median ?? null,
        suggestedGenre: suggestGenre(doc.subject),
      }))
      .sort((a, b) => Number(Boolean(b.coverId)) - Number(Boolean(a.coverId)))
      .slice(0, 10)

    return Response.json({ results })
  } catch {
    return Response.json({ results: [], error: 'Search is unavailable right now.' }, { status: 502 })
  }
}
