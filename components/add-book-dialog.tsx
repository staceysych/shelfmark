'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Check, Loader2, Search } from 'lucide-react'
import type { Genre, SearchResult } from '@/lib/books'
import { normalizeCoverImageUrl } from '@/lib/cover-url'
import { useLibrary } from '@/lib/use-library'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

type ManualDraft = {
  title: string
  author: string
  year: string
  pages: string
  coverUrl: string
}

type AddBookDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBookDialog({ open, onOpenChange }: AddBookDialogProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [mode, setMode] = useState<'search' | 'manual' | 'details'>('search')
  const [manual, setManual] = useState<ManualDraft>({
    title: '',
    author: '',
    year: '',
    pages: '',
    coverUrl: '',
  })
  const [manualError, setManualError] = useState<string | null>(null)
  const { addBook, hasBook } = useLibrary()
  const debouncedQuery = useDebounced(query.trim())

  const { data, isLoading, error } = useSWR<{ results: SearchResult[] }>(
    open && mode === 'search' && debouncedQuery.length >= 2
      ? `/api/search?q=${encodeURIComponent(debouncedQuery)}`
      : null,
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
        setMode('search')
        setManual({ title: '', author: '', year: '', pages: '', coverUrl: '' })
        setManualError(null)
      }, 150)
    }
  }

  const startManual = (prefillTitle = '') => {
    setSelected(null)
    setManual({
      title: prefillTitle,
      author: '',
      year: '',
      pages: '',
      coverUrl: '',
    })
    setManualError(null)
    setMode('manual')
  }

  const continueFromManual = () => {
    const title = manual.title.trim()
    const author = manual.author.trim()
    if (!title || !author) {
      setManualError('Title and author are required.')
      return
    }
    if (manual.coverUrl.trim() && !normalizeCoverImageUrl(manual.coverUrl)) {
      setManualError('Cover must be an https:// link to an image.')
      return
    }
    setManualError(null)
    setMode('details')
  }

  const manualCover = normalizeCoverImageUrl(manual.coverUrl)
  const manualYear = manual.year.trim() ? Number.parseInt(manual.year, 10) : null
  const manualPages = manual.pages.trim() ? Number.parseInt(manual.pages, 10) : null

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
            <div className="flex items-start gap-4">
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
                status: 'reading',
                finishedAt: '',
              }}
              catalogGenre={selected.catalogGenre}
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
        ) : mode === 'details' ? (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to book info
              </button>
              <DialogTitle className="sr-only">Add {manual.title.trim()}</DialogTitle>
              <DialogDescription className="sr-only">Rate the book and add your thoughts.</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-4">
              <BookCover
                coverId={null}
                coverUrl={manualCover}
                title={manual.title.trim() || 'Untitled'}
                author={manual.author.trim() || undefined}
                size="M"
                className="w-24 shrink-0"
              />
              <div className="flex min-w-0 flex-col justify-end gap-1">
                <h3 className="font-serif text-2xl leading-tight text-balance">{manual.title.trim()}</h3>
                <p className="text-sm text-muted-foreground">
                  {manual.author.trim()}
                  {Number.isFinite(manualYear) && manualYear ? ` · ${manualYear}` : ''}
                </p>
              </div>
            </div>
            <BookDetailsForm
              initial={{
                genre: 'Non-fiction' satisfies Genre,
                rating: 0,
                note: '',
                moods: [],
                status: 'reading',
                finishedAt: '',
              }}
              submitLabel="Add to shelf"
              onSubmit={(details) => {
                addBook({
                  olKey: `manual:${crypto.randomUUID()}`,
                  title: manual.title.trim(),
                  author: manual.author.trim(),
                  coverId: null,
                  coverUrl: manualCover,
                  year: Number.isFinite(manualYear) && manualYear && manualYear > 0 ? manualYear : null,
                  pages: Number.isFinite(manualPages) && manualPages && manualPages > 0 ? manualPages : null,
                  ...details,
                })
                handleOpenChange(false)
              }}
            />
          </>
        ) : mode === 'manual' ? (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setMode('search')}
                className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to search
              </button>
              <DialogTitle className="font-serif text-2xl font-normal">Add manually</DialogTitle>
              <DialogDescription>Enter the book details and an optional cover image link.</DialogDescription>
            </DialogHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                continueFromManual()
              }}
            >
              <div className="flex items-start gap-4">
                <BookCover
                  coverId={null}
                  coverUrl={manualCover}
                  title={manual.title.trim() || 'Cover preview'}
                  author={manual.author.trim() || undefined}
                  size="M"
                  className="w-24 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Title</span>
                    <Input
                      autoFocus
                      value={manual.title}
                      onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
                      placeholder="Book title"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Author</span>
                    <Input
                      value={manual.author}
                      onChange={(e) => setManual((m) => ({ ...m, author: e.target.value }))}
                      placeholder="Author name"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Year</span>
                  <Input
                    inputMode="numeric"
                    value={manual.year}
                    onChange={(e) => setManual((m) => ({ ...m, year: e.target.value }))}
                    placeholder="e.g. 2014"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Pages</span>
                  <Input
                    inputMode="numeric"
                    value={manual.pages}
                    onChange={(e) => setManual((m) => ({ ...m, pages: e.target.value }))}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cover image URL</span>
                <Input
                  type="url"
                  value={manual.coverUrl}
                  onChange={(e) => setManual((m) => ({ ...m, coverUrl: e.target.value }))}
                  placeholder="https://… (link to an image)"
                />
                <span className="text-[11px] text-muted-foreground">
                  Paste any https link that opens an image. Leave blank to use a text cover.
                </span>
              </label>

              {manualError ? <p className="text-sm text-destructive">{manualError}</p> : null}

              <div className="flex justify-end">
                <Button type="submit" size="lg" className="px-5">
                  Continue
                </Button>
              </div>
            </form>
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
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {error.message || 'Search is unavailable right now. Try again in a moment.'}
                  </p>
                  <Button type="button" variant="secondary" onClick={() => startManual(typedQuery)}>
                    Add manually instead
                  </Button>
                </div>
              ) : typedQuery.length < 2 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Start typing to search by title or author.</p>
                  <button
                    type="button"
                    onClick={() => startManual()}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Can’t find it? Add manually
                  </button>
                </div>
              ) : searching && results.length === 0 ? null : results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No matches in Open Library.</p>
                  <Button type="button" variant="secondary" onClick={() => startManual(typedQuery)}>
                    Add “{typedQuery}” manually
                  </Button>
                </div>
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

            {results.length > 0 ? (
              <button
                type="button"
                onClick={() => startManual(typedQuery)}
                className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Can’t find the right edition? Add manually
              </button>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
