export type ReadingStatus = 'reading' | 'finished'

export type Book = {
  id: string
  olKey: string
  title: string
  author: string
  coverId: number | null
  coverUrl?: string | null
  year: number | null
  pages: number | null
  genre: Genre
  rating: number
  note: string
  moods: Mood[]
  status?: ReadingStatus
  finishedAt: string
  addedAt: string
}

export function bookStatus(book: Pick<Book, 'status' | 'finishedAt'>): ReadingStatus {
  if (book.status === 'reading' || book.status === 'finished') return book.status
  return book.finishedAt ? 'finished' : 'reading'
}

export const MOODS = [
  'Couldn’t put it down',
  'Slow burn',
  'Emotional',
  'Mind-bending',
  'Comforting',
  'Dark',
  'Funny',
  'Eye-opening',
] as const

export type Mood = (typeof MOODS)[number]

export type SearchResult = {
  olKey: string
  title: string
  author: string
  coverId: number | null
  coverUrl: string | null
  year: number | null
  pages: number | null
  suggestedGenre: Genre
  catalogGenre: string | null
}

export const GENRES = [
  'Literary Fiction',
  'Fantasy',
  'Science Fiction',
  'Mystery & Thriller',
  'Romance',
  'Historical Fiction',
  'Horror',
  'Classics',
  'Young Adult',
  'Comics & Graphic',
  'Poetry',
  'Biography & Memoir',
  'History',
  'Science & Tech',
  'Philosophy',
  'Psychology & Self-help',
  'Business',
  'Non-fiction',
] as const

export type Genre = (typeof GENRES)[number]

const GENRE_KEYWORDS: [Genre, string[]][] = [
  ['Comics & Graphic', ['comic', 'graphic novel', 'graphic novels', 'manga']],
  ['Young Adult', ['young adult', 'juvenile fiction', 'juvenile', 'teen']],
  ['Poetry', ['poetry', 'poems']],
  ['Horror', ['horror', 'ghost', 'vampire', 'supernatural']],
  ['Science Fiction', ['science fiction', 'sci-fi', 'sci fi', 'dystopia', 'space opera', 'cyberpunk', 'time travel']],
  ['Fantasy', ['fantasy', 'magic', 'dragons', 'wizards']],
  ['Mystery & Thriller', ['mystery', 'thriller', 'detective', 'crime', 'suspense', 'true crime']],
  ['Romance', ['romance', 'love stories']],
  ['Historical Fiction', ['historical fiction']],
  ['Biography & Memoir', ['biography', 'autobiography', 'memoir']],
  ['Psychology & Self-help', ['self-help', 'self help', 'psychology', 'personal development', 'success', 'habits']],
  ['Business', ['business', 'economics', 'management', 'finance', 'entrepreneur']],
  ['Philosophy', ['philosophy', 'ethics', 'stoic']],
  ['Science & Tech', ['computers', 'computer', 'technology', 'physics', 'biology', 'mathematics', 'science']],
  ['History', ['history']],
  ['Classics', ['classic literature', 'classics']],
  ['Literary Fiction', ['literary', 'fiction', 'novel']],
]

export function suggestGenre(subjects: string[] = []): Genre {
  const haystack = subjects.filter(Boolean).slice(0, 40).join(' | ').toLowerCase()
  if (!haystack) return 'Non-fiction'
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k))) return genre
  }
  return 'Non-fiction'
}

export function coverSrc(
  book: { coverId: number | null; coverUrl?: string | null },
  size: 'S' | 'M' | 'L' = 'M',
) {
  if (book.coverUrl) return book.coverUrl
  return book.coverId ? `https://covers.openlibrary.org/b/id/${book.coverId}-${size}.jpg` : null
}
