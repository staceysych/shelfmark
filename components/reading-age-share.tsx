'use client'

import { useState } from 'react'
import { BookMarked, Download, Info, Share2 } from 'lucide-react'
import { coverSrc, type Book } from '@/lib/books'
import { getReadingAge, type ReadingAge } from '@/lib/reading-age'
import { renderReadingAgePng } from '@/lib/share-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type ReadingAgeShareProps = {
  books: Book[]
}

export function ReadingAgeShare({ books }: ReadingAgeShareProps) {
  const readingAge = getReadingAge(books)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!readingAge) return null

  async function downloadCard() {
    setSaving(true)
    setError(null)
    try {
      // Give webfonts a tick to settle before measuring text on canvas.
      if (document.fonts?.ready) await document.fonts.ready
      const blob = await renderReadingAgePng(readingAge!)
      const filename = `shelfmark-reading-age-${readingAge!.age}.png`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Share card export failed', err)
      setError('Couldn’t create the image. Try again in a moment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(232, 176, 74, 0.14), transparent 55%), radial-gradient(ellipse at bottom left, rgba(58, 66, 92, 0.45), transparent 50%)',
          }}
        />
        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">Reader age</span>
              <TooltipProvider delay={200}>
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                    aria-label="How reading age is calculated"
                  >
                    <Info className="size-3.5" aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-[16rem] text-left leading-relaxed">
                    Approximate age of a typical reader for your finished genres and moods. Higher-rated books count
                    more.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-serif text-6xl leading-none tabular-nums sm:text-7xl">{readingAge.age}</span>
              <span className="pb-1.5 text-sm text-muted-foreground">years old</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">{readingAge.subtitle}</p>
          </div>
          <Button onClick={() => setOpen(true)} className="self-start sm:self-auto">
            <Share2 aria-hidden />
            Share card
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Share your reader age</DialogTitle>
            <DialogDescription>Save a poster of the age your shelf sounds like to share anywhere.</DialogDescription>
          </DialogHeader>

          <div className="mx-auto w-full max-w-[340px]">
            <ShareCardPreview readingAge={readingAge} />
          </div>

          {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="sm:justify-stretch">
            <Button onClick={downloadCard} disabled={saving} className="w-full sm:w-full">
              <Download aria-hidden />
              {saving ? 'Preparing…' : 'Download image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ShareCardPreview({ readingAge }: { readingAge: ReadingAge }) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-xl text-[#f3eee3]"
      style={{
        background:
          'radial-gradient(ellipse at 80% 0%, rgba(232, 176, 74, 0.18), transparent 45%), radial-gradient(ellipse at 10% 90%, rgba(40, 48, 72, 0.9), transparent 50%), #16181f',
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        <div className="flex items-center gap-2">
          <BookMarked className="size-4 text-[#e8b04a]" aria-hidden />
          <span className="font-serif text-sm tracking-wide">Shelfmark</span>
        </div>

        <div className="flex flex-col gap-3 pt-6">
          <span className="text-[11px] tracking-[0.18em] text-[#a8b0c0] uppercase">Your shelf reads like you’re</span>
          <div className="flex items-end gap-3">
            <span className="font-serif text-[7rem] leading-none tracking-tight tabular-nums">{readingAge.age}</span>
            <span className="pb-3 text-sm text-[#a8b0c0]">years old</span>
          </div>
          <p className="max-w-[16rem] text-sm leading-snug text-[#a8b0c0]">{readingAge.subtitle}</p>
        </div>

        <div className="flex flex-col gap-4">
          {readingAge.covers.length > 0 ? (
            <div className="relative -mx-6 flex h-36 items-end overflow-hidden">
              <div className="flex w-full items-end justify-between gap-1 px-3">
                {readingAge.covers.map((book) => (
                  <ShareCover key={book.id} book={book} />
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
                style={{ background: 'linear-gradient(to top, #16181f, transparent)' }}
              />
            </div>
          ) : null}
          <p className="text-[11px] text-[#a8b0c0]">
            Based on {readingAge.bookCount} finished {readingAge.bookCount === 1 ? 'book' : 'books'}
          </p>
        </div>
      </div>
    </div>
  )
}

function shareCoverSrc(book: Book) {
  const remote = coverSrc(book, 'M')
  if (!remote) return null
  if (remote.startsWith('/')) return remote
  if (remote.startsWith('https://')) return `/api/cover?url=${encodeURIComponent(remote)}`
  return null
}

function ShareCover({ book }: { book: Book }) {
  const src = shareCoverSrc(book)
  return (
    <div
      className="relative aspect-[2/3] w-full max-w-[52px] overflow-hidden rounded-sm"
      style={{
        background: '#2a2f3c',
        boxShadow: '0 10px 20px -8px rgba(0,0,0,0.7)',
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover object-top" />
      ) : (
        <div className="flex size-full items-end p-1.5">
          <span className="line-clamp-3 font-serif text-[8px] leading-tight text-[#f3eee3]">{book.title}</span>
        </div>
      )}
    </div>
  )
}
