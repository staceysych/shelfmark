import type { Book, SearchResult } from '@/lib/books'

function isGoogleCoverUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return host === 'books.google.com' || host.endsWith('.googleusercontent.com') || host === 'books.googleusercontent.com'
  } catch {
    return url.includes('books.google.com')
  }
}

export function needsOpenLibraryCover(book: Book) {
  return book.olKey.startsWith('gb:') || isGoogleCoverUrl(book.coverUrl)
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickMatch(book: Book, results: SearchResult[]) {
  const want = normalizeTitle(book.title)
  const scored = results
    .map((result) => {
      const got = normalizeTitle(result.title)
      let score = 0
      if (got === want) score += 5
      else if (got.includes(want) || want.includes(got)) score += 3
      if (result.coverId) score += 2
      if (book.author && result.author.toLowerCase().includes(book.author.split(',')[0]!.trim().toLowerCase())) {
        score += 1
      }
      return { result, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.result.coverId)) - Number(Boolean(a.result.coverId)))

  return scored.find((row) => row.result.coverId)?.result ?? scored[0]?.result ?? null
}

async function lookupOpenLibrary(book: Book): Promise<SearchResult | null> {
  const query = `${book.title} ${book.author}`.trim()
  if (query.length < 2) return null
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return null
  const data = (await res.json()) as { results?: SearchResult[] }
  return pickMatch(book, data.results ?? [])
}

/** Replace Google Books covers/keys with Open Library matches. Returns null if nothing changed. */
export async function migrateGoogleCovers(books: Book[]): Promise<Book[] | null> {
  const targets = books.filter(needsOpenLibraryCover)
  if (targets.length === 0) return null

  let changed = false
  const updates = new Map<string, Book>()

  for (const book of targets) {
    try {
      const match = await lookupOpenLibrary(book)
      if (!match?.coverId) continue
      changed = true
      updates.set(book.id, {
        ...book,
        coverId: match.coverId,
        coverUrl: null,
        olKey: book.olKey.startsWith('gb:') ? match.olKey : book.olKey,
      })
    } catch {
      // Keep the original Google cover if lookup fails.
    }
  }

  if (!changed) return null
  return books.map((book) => updates.get(book.id) ?? book)
}
