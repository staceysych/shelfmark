'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Book } from '@/lib/books'
import { useLibrary } from '@/lib/use-library'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookCover } from '@/components/book-cover'
import { StarRating } from '@/components/star-rating'
import { BookDetailsForm } from '@/components/book-details-form'

type BookDetailDialogProps = {
  book: Book | null
  onOpenChange: (open: boolean) => void
}

const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' })

export function BookDetailDialog({ book, onOpenChange }: BookDetailDialogProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { updateBook, removeBook } = useLibrary()

  const close = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setEditing(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={Boolean(book)} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-2xl">
        {book && (
          <div className="flex flex-col gap-6 sm:flex-row">
            <BookCover
              coverId={book.coverId}
              coverUrl={book.coverUrl}
              title={book.title}
              author={book.author}
              size="L"
              className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-48"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <DialogHeader className="gap-1 pr-6">
                <span className="text-xs font-medium tracking-wide text-primary uppercase">{book.genre}</span>
                <DialogTitle className="font-serif text-3xl leading-tight font-normal text-balance">
                  {book.title}
                </DialogTitle>
                <DialogDescription>
                  {book.author}
                  {book.year ? ` · ${book.year}` : ''}
                  {book.pages ? ` · ${book.pages} pages` : ''}
                </DialogDescription>
              </DialogHeader>

              {editing ? (
                <BookDetailsForm
                  initial={{
                    genre: book.genre,
                    rating: book.rating,
                    note: book.note,
                    moods: book.moods ?? [],
                    finishedAt: book.finishedAt,
                  }}
                  submitLabel="Save changes"
                  secondaryAction={
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  }
                  onSubmit={(details) => {
                    updateBook(book.id, details)
                    onOpenChange(false)
                    setEditing(false)
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <StarRating value={book.rating} size="lg" className="-ml-0.5" />
                    <span className="text-xs text-muted-foreground">
                      Finished {dateFormat.format(new Date(book.finishedAt))}
                    </span>
                  </div>

                  {book.moods?.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Moods">
                      {book.moods.map((m) => (
                        <li key={m} className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs text-primary">
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}

                  {book.note ? (
                    <blockquote className="border-l-2 border-primary/50 pl-4 font-serif text-lg leading-relaxed text-pretty italic">
                      {book.note}
                    </blockquote>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            removeBook(book.id)
                            close(false)
                          }}
                        >
                          Remove from shelf
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirmDelete(true)}>
                        <Trash2 aria-hidden />
                        Remove
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
