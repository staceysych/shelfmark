'use client'

import { useState } from 'react'
import { GENRES, MOODS, type Genre, type Mood } from '@/lib/books'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/star-rating'
import { cn } from '@/lib/utils'

export type BookDetails = {
  genre: Genre
  rating: number
  note: string
  moods: Mood[]
  finishedAt: string
}

type BookDetailsFormProps = {
  initial: BookDetails
  submitLabel: string
  onSubmit: (details: BookDetails) => void
  secondaryAction?: React.ReactNode
}

const genreItems = GENRES.map((g) => ({ value: g, label: g }))

export function BookDetailsForm({ initial, submitLabel, onSubmit, secondaryAction }: BookDetailsFormProps) {
  const [details, setDetails] = useState<BookDetails>(initial)
  const set = <K extends keyof BookDetails>(key: K, value: BookDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value }))

  const toggleMood = (mood: Mood) =>
    set('moods', details.moods.includes(mood) ? details.moods.filter((m) => m !== mood) : [...details.moods, mood])

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ ...details, note: details.note.trim() })
      }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Your rating</span>
        <StarRating value={details.rating} onChange={(v) => set('rating', v)} size="lg" className="-ml-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Genre</span>
          <Select items={genreItems} value={details.genre} onValueChange={(v) => v && set('genre', v as Genre)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Finished on</span>
          <Input
            type="date"
            value={details.finishedAt}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set('finishedAt', e.target.value)}
            required
            className="[color-scheme:dark]"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How did it feel?
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((mood) => {
            const active = details.moods.includes(mood)
            return (
              <button
                key={mood}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMood(mood)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                )}
              >
                {mood}
              </button>
            )
          })}
        </div>
        <Textarea
          value={details.note}
          onChange={(e) => set('note', e.target.value)}
          maxLength={280}
          placeholder="A few words, just for you…"
          aria-label="Your thoughts"
          className="mt-1 min-h-20 resize-none leading-relaxed"
        />
        <span className="self-end text-[11px] text-muted-foreground">{details.note.length}/280</span>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        {secondaryAction ?? <span />}
        <Button type="submit" size="lg" className="px-5">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
