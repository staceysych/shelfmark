import { bookStatus, type Book, type Genre, type Mood } from '@/lib/books'

/** Typical reader age associated with each shelf genre. */
const GENRE_READER_AGE: Record<Genre, number> = {
  'Young Adult': 17,
  'Comics & Graphic': 22,
  Fantasy: 26,
  Romance: 28,
  Horror: 27,
  'Science Fiction': 29,
  'Psychology & Self-help': 32,
  'Science & Tech': 34,
  'Mystery & Thriller': 36,
  Business: 36,
  'Non-fiction': 38,
  'Historical Fiction': 38,
  Poetry: 40,
  'Biography & Memoir': 41,
  'Literary Fiction': 42,
  Philosophy: 43,
  Classics: 44,
  History: 45,
}

const MOOD_AGE_NUDGE: Partial<Record<Mood, number>> = {
  Funny: -1,
  Comforting: -1,
  'Couldn’t put it down': -1,
  'Slow burn': 1,
  Dark: 2,
  'Mind-bending': 2,
  'Eye-opening': 1,
}

export type ReadingAge = {
  age: number
  bookCount: number
  topGenre: string | null
  topMood: string | null
  covers: Book[]
  subtitle: string
  bandLabel: string
}

function ageBand(age: number) {
  if (age < 20) return 'Late teens'
  if (age < 25) return 'Early twenties'
  if (age < 30) return 'Mid twenties'
  if (age < 35) return 'Early thirties'
  if (age < 40) return 'Mid thirties'
  if (age < 45) return 'Early forties'
  if (age < 50) return 'Mid forties'
  if (age < 60) return 'Fifties'
  return 'Sixties+'
}

function bookWeight(book: Book) {
  // Prefer books you rated higher — stronger signal of taste.
  if (book.rating > 0) return 0.5 + book.rating / 5
  return 1
}

export function getReadingAge(books: Book[]): ReadingAge | null {
  const finished = books.filter((b) => bookStatus(b) === 'finished')
  if (finished.length === 0) return null

  let ageSum = 0
  let weightSum = 0
  const genres = new Map<string, number>()
  const moods = new Map<string, number>()

  finished.forEach((book) => {
    const weight = bookWeight(book)
    const base = GENRE_READER_AGE[book.genre] ?? 32
    const moodNudge =
      (book.moods?.reduce((sum, mood) => sum + (MOOD_AGE_NUDGE[mood] ?? 0), 0) ?? 0) /
      Math.max(1, book.moods?.length ?? 1)

    ageSum += (base + moodNudge) * weight
    weightSum += weight
    genres.set(book.genre, (genres.get(book.genre) ?? 0) + weight)
    book.moods?.forEach((mood) => moods.set(mood, (moods.get(mood) ?? 0) + weight))
  })

  if (weightSum === 0) return null

  const age = Math.min(65, Math.max(14, Math.round(ageSum / weightSum)))
  const topGenre = [...genres.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const topMood = [...moods.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const bandLabel = ageBand(age)

  const rated = finished.filter((b) => b.rating > 0)
  const coverPool = (rated.length >= 3 ? rated : finished)
    .slice()
    .sort((a, b) => b.rating - a.rating || b.finishedAt.localeCompare(a.finishedAt))
  const covers = coverPool.filter((b) => b.coverId || b.coverUrl).slice(0, 6)
  if (covers.length < 3) {
    for (const book of coverPool) {
      if (covers.length >= 6) break
      if (!covers.includes(book)) covers.push(book)
    }
  }

  const parts = [bandLabel, topGenre, topMood].filter(Boolean)
  return {
    age,
    bookCount: finished.length,
    topGenre,
    topMood,
    covers: covers.slice(0, 6),
    subtitle: parts.join(' · '),
    bandLabel,
  }
}
