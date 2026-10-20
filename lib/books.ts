export type Book = {
  id: string
  olKey: string
  title: string
  author: string
  coverId: number | null
  year: number | null
  pages: number | null
  genre: Genre
  rating: number
  note: string
  moods: Mood[]
  finishedAt: string
  addedAt: string
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
  year: number | null
  pages: number | null
  suggestedGenre: Genre
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
  ['Comics & Graphic', ['comic', 'graphic novel', 'manga']],
  ['Young Adult', ['young adult', 'juvenile fiction', 'teen']],
  ['Poetry', ['poetry', 'poems']],
  ['Horror', ['horror', 'ghost', 'vampire', 'supernatural']],
  ['Science Fiction', ['science fiction', 'dystopia', 'space opera', 'cyberpunk', 'time travel']],
  ['Fantasy', ['fantasy', 'magic', 'dragons', 'wizards']],
  ['Mystery & Thriller', ['mystery', 'thriller', 'detective', 'crime', 'suspense']],
  ['Romance', ['romance', 'love stories']],
  ['Historical Fiction', ['historical fiction']],
  ['Biography & Memoir', ['biography', 'autobiography', 'memoir']],
  ['Psychology & Self-help', ['self-help', 'psychology', 'personal development', 'success', 'habits']],
  ['Business', ['business', 'economics', 'management', 'finance', 'entrepreneur']],
  ['Philosophy', ['philosophy', 'ethics', 'stoic']],
  ['Science & Tech', ['science', 'physics', 'biology', 'technology', 'computer', 'mathematics']],
  ['History', ['history']],
  ['Classics', ['classic literature', 'classics']],
  ['Literary Fiction', ['fiction', 'novel']],
]

export function suggestGenre(subjects: string[] = []): Genre {
  const haystack = subjects.slice(0, 40).join(' | ').toLowerCase()
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k))) return genre
  }
  return 'Non-fiction'
}

export function coverUrl(coverId: number | null, size: 'S' | 'M' | 'L' = 'M') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null
}
