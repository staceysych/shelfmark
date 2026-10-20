'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Check, Loader2, Search } from 'lucide-react'
import type { SearchResult } from '@/lib/books'
import { useLibrary } from '@/lib/use-library'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BookCover } from '@/components/book-cover'
import { BookDetailsForm } from '@/components/book-details-form'

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = (await res.json()) as { results?: SearchResult[]; error?: string }
  if (!res.ok || json.error) throw new Error(json.error || 'Search is unavailable right now.')
  return json
}

function useDebounced<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

type AddBookDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBookDialog({ open, onOpenChange }: AddBookDialogProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const { addBook, hasBook } = useLibrary()
  const debouncedQuery = useDebounced(query.trim())

  const { data, isLoading, error } = useSWR<{ results: SearchResult[] }>(
    open && debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const typedQuery = query.trim()
  const queryPending = typedQuery !== debouncedQuery
  const results = queryPending ? [] : (data?.results ?? [])
  const searching = queryPending || isLoading

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setQuery('')
        setSelected(null)
      }, 150)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] min-w-0 gap-5 overflow-x-hidden overflow-y-auto p-5 sm:max-w-xl">
        {selected ? (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to results
              </button>
              <DialogTitle className="sr-only">Add {selected.title}</DialogTitle>
              <DialogDescription className="sr-only">Rate the book and add your thoughts.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              <BookCover
                coverId={selected.coverId}
                coverUrl={selected.coverUrl}
                title={selected.title}
                author={selected.author}
                size="M"
                className="w-24 shrink-0"
              />
              <div className="flex min-w-0 flex-col justify-end gap-1">
                <h3 className="font-serif text-2xl leading-tight text-balance">{selected.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selected.author}
                  {selected.year ? ` · ${selected.year}` : ''}
                </p>
              </div>
            </div>
            <BookDetailsForm
              initial={{
                genre: selected.suggestedGenre,
                rating: 0,
                note: '',
                moods: [],
                finishedAt: new Date().toISOString().slice(0, 10),
              }}
              submitLabel="Add to shelf"
              onSubmit={(details) => {
                addBook({
                  olKey: selected.olKey,
                  title: selected.title,
                  author: selected.author,
                  coverId: selected.coverId,
                  coverUrl: selected.coverUrl,
                  year: selected.year,
                  pages: selected.pages,
                  ...details,
                })
                handleOpenChange(false)
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-normal">Add a book</DialogTitle>
              <DialogDescription>Search by title or author, then pick the right edition.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. The Left Hand of Darkness"
                aria-label="Search books"
                className="h-11 pl-9 text-base"
              />
              {searching && typedQuery.length >= 2 && (
                <Loader2
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                  aria-label="Searching"
                />
              )}
            </div>

            <div className="min-h-48 min-w-0 overflow-x-hidden" aria-live="polite">
              {error && results.length === 0 && !searching ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {error.message || 'Search is unavailable right now. Try again in a moment.'}
                </p>
              ) : typedQuery.length < 2 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Start typing to search by title or author.
                </p>
              ) : searching && results.length === 0 ? null : results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No matches. Try the author’s name too.
                </p>
              ) : (
                <ul className="flex min-w-0 flex-col gap-1">
                  {results.map((r) => {
                    const owned = hasBook(r.olKey)
                    return (
                      <li key={r.olKey} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        >
                          <BookCover
                            coverId={r.coverId}
                            coverUrl={r.coverUrl}
                            title={r.title}
                            size="M"
                            className="w-10 shrink-0 shadow-none"
                          />
                          <span className="flex min-w-0 flex-1 flex-col overflow-hidden">
                            <span className="block truncate font-medium">{r.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.author}
                              {r.year ? ` · ${r.year}` : ''}
                            </span>
                          </span>
                          {owned ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                              <Check className="size-3.5" aria-hidden /> On shelf
                            </span>
                          ) : (
                            <span className="hidden max-w-28 shrink-0 truncate text-xs text-muted-foreground sm:inline">
                              {r.suggestedGenre}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
