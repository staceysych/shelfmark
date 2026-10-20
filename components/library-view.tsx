'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Star } from 'lucide-react'
import type { Book, Genre } from '@/lib/books'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookCover } from '@/components/book-cover'
import { StarRating } from '@/components/star-rating'
import { cn } from '@/lib/utils'

type SortKey = 'recent' | 'rating' | 'title'
const sortItems = [
  { value: 'recent', label: 'Recently finished' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'title', label: 'Title A–Z' },
]

type LibraryViewProps = {
  books: Book[]
  onAdd: () => void
  onSelect: (book: Book) => void
}

export function LibraryView({ books, onAdd, onSelect }: LibraryViewProps) {
  const [genre, setGenre] = useState<Genre | 'all'>('all')
  const [minRating, setMinRating] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')

  const genreCounts = useMemo(() => {
    const counts = new Map<Genre, number>()
    books.forEach((b) => counts.set(b.genre, (counts.get(b.genre) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [books])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books
      .filter((b) => genre === 'all' || b.genre === genre)
      .filter((b) => b.rating >= minRating)
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'rating') return b.rating - a.rating || b.finishedAt.localeCompare(a.finishedAt)
        if (sort === 'title') return a.title.localeCompare(b.title)
        return b.finishedAt.localeCompare(a.finishedAt)
      })
  }, [books, genre, minRating, search, sort])

  const shelves = useMemo(() => {
    if (sort !== 'recent') return [{ label: null, books: filtered }]
    const byYear = new Map<string, Book[]>()
    filtered.forEach((b) => {
      const year = b.finishedAt.slice(0, 4)
      byYear.set(year, [...(byYear.get(year) ?? []), b])
    })
    return [...byYear.entries()].map(([label, books]) => ({ label, books }))
  }, [filtered, sort])

  if (books.length === 0) return <EmptyShelf onAdd={onAdd} />

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your shelf"
              aria-label="Search your shelf"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border p-0.5" role="group" aria-label="Minimum rating">
              {[0, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={minRating === r}
                  onClick={() => setMinRating(r)}
                  aria-label={r === 0 ? 'Any rating' : r === 5 ? '5 stars only' : `${r} stars or more`}
                  className={cn(
                    'flex h-7 items-center gap-0.5 rounded-md px-2.5 text-xs transition-colors',
                    minRating === r ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r === 0 ? (
                    'Any'
                  ) : (
                    <>
                      {r}
                      <Star className="size-3 fill-current" aria-hidden />
                      {r < 5 && '+'}
                    </>
                  )}
                </button>
              ))}
            </div>
            <Select items={sortItems} value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
              <SelectTrigger className="w-44" aria-label="Sort books">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortItems.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-1.5" role="group" aria-label="Filter by genre">
            <GenreChip active={genre === 'all'} onClick={() => setGenre('all')} label="All" count={books.length} />
            {genreCounts.map(([g, count]) => (
              <GenreChip key={g} active={genre === g} onClick={() => setGenre(g)} label={g} count={count} />
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No books match these filters.</p>
      ) : (
        shelves.map((shelf) => (
          <section key={shelf.label ?? 'all'} className="flex flex-col gap-5" aria-label={shelf.label ?? 'Books'}>
            {shelf.label && (
              <h2 className="flex items-baseline gap-3">
                <span className="font-serif text-3xl">{shelf.label}</span>
                <span className="text-sm text-muted-foreground">
                  {shelf.books.length} {shelf.books.length === 1 ? 'book' : 'books'}
                </span>
              </h2>
            )}
            <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {shelf.books.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(book)}
                    className="group flex w-full flex-col gap-2.5 text-left focus-visible:outline-none"
                  >
                    <BookCover
                      coverId={book.coverId}
                      coverUrl={book.coverUrl}
                      title={book.title}
                      author={book.author}
                      className="w-full transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-1 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="line-clamp-1 text-sm font-medium">{book.title}</span>
                      {book.rating > 0 ? (
                        <StarRating value={book.rating} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Unrated</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function GenreChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('tabular-nums', active ? 'text-primary-foreground/70' : 'text-muted-foreground/60')}>{count}</span>
    </button>
  )
}

function EmptyShelf({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex items-end gap-2" aria-hidden>
        {[28, 36, 24, 32, 20].map((h, i) => (
          <span
            key={i}
            className="w-6 rounded-sm border border-border bg-secondary"
            style={{ height: `${h * 4}px`, transform: i === 4 ? 'rotate(8deg) translateX(-2px)' : undefined }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl text-balance">Your shelf is waiting</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
          Add the last book you finished. Type a title, pick it from the list, and give it a rating.
        </p>
      </div>
      <Button size="lg" onClick={onAdd} className="px-5">
        <Plus aria-hidden />
        Add your first book
      </Button>
    </div>
  )
}
