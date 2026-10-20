'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { Book } from '@/lib/books'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BookCover } from '@/components/book-cover'
import { StarRating } from '@/components/star-rating'

const genreConfig = { count: { label: 'Books', color: 'var(--chart-1)' } } satisfies ChartConfig
const monthConfig = { count: { label: 'Books', color: 'var(--chart-2)' } } satisfies ChartConfig

type DashboardViewProps = {
  books: Book[]
  onSelect: (book: Book) => void
}

export function DashboardView({ books, onSelect }: DashboardViewProps) {
  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear().toString()
    const rated = books.filter((b) => b.rating > 0)
    const genres = new Map<string, { count: number; ratingSum: number; rated: number }>()
    const authors = new Map<string, number>()
    const moods = new Map<string, number>()

    books.forEach((b) => {
      const g = genres.get(b.genre) ?? { count: 0, ratingSum: 0, rated: 0 }
      g.count++
      if (b.rating > 0) {
        g.ratingSum += b.rating
        g.rated++
      }
      genres.set(b.genre, g)
      authors.set(b.author, (authors.get(b.author) ?? 0) + 1)
      b.moods?.forEach((m) => moods.set(m, (moods.get(m) ?? 0) + 1))
    })

    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        month: d.toLocaleString('en', { month: 'short' }),
        count: books.filter((b) => b.finishedAt.startsWith(key)).length,
      }
    })

    const genreList = [...genres.entries()]
      .map(([genre, g]) => ({ genre, count: g.count, avg: g.rated ? g.ratingSum / g.rated : 0 }))
      .sort((a, b) => b.count - a.count)

    return {
      total: books.length,
      thisYear: books.filter((b) => b.finishedAt.startsWith(thisYear)).length,
      avgRating: rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0,
      pages: books.reduce((s, b) => s + (b.pages ?? 0), 0),
      genres: genreList.slice(0, 8),
      bestGenre: genreList.filter((g) => g.avg > 0).sort((a, b) => b.avg - a.avg || b.count - a.count)[0],
      months,
      topAuthors: [...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      topMoods: [...moods.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      favorites: [...rated].sort((a, b) => b.rating - a.rating || b.finishedAt.localeCompare(a.finishedAt)).slice(0, 6),
    }
  }, [books])

  if (books.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-muted-foreground">
        Add a few books and your reading insights will appear here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        <Stat label="Books read" value={stats.total.toString()} />
        <Stat label={`In ${new Date().getFullYear()}`} value={stats.thisYear.toString()} />
        <Stat label="Average rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} suffix="/ 5" />
        <Stat label="Pages turned" value={stats.pages ? stats.pages.toLocaleString('en') : '—'} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="What you read most" className="lg:col-span-3">
          <ChartContainer config={genreConfig} className="aspect-auto w-full" style={{ height: stats.genres.length * 40 + 16 }}>
            <BarChart data={stats.genres} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="genre"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent hideLabel={false} />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={20} />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title="Your taste" className="lg:col-span-2">
          <div className="flex flex-col gap-5">
            {stats.bestGenre && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Highest-rated genre</span>
                <span className="font-serif text-2xl">{stats.bestGenre.genre}</span>
                <span className="text-xs text-muted-foreground">
                  {stats.bestGenre.avg.toFixed(1)} avg across {stats.bestGenre.count}{' '}
                  {stats.bestGenre.count === 1 ? 'book' : 'books'}
                </span>
              </div>
            )}
            <RankedList title="Most-read authors" items={stats.topAuthors} />
            {stats.topMoods.length > 0 && <RankedList title="How books made you feel" items={stats.topMoods} />}
          </div>
        </Panel>
      </div>

      <Panel title="Last 12 months">
        <ChartContainer config={monthConfig} className="aspect-auto h-48 w-full">
          <BarChart data={stats.months} margin={{ left: -24, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Panel>

      {stats.favorites.length > 0 && (
        <Panel title="Top rated">
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {stats.favorites.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => onSelect(b)} className="flex w-full flex-col gap-2 text-left">
                  <BookCover coverId={b.coverId} coverUrl={b.coverUrl} title={b.title} author={b.author} className="w-full" />
                  <StarRating value={b.rating} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1 bg-card p-5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="font-serif text-4xl tabular-nums">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  )
}

function Panel({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`flex flex-col gap-4 rounded-xl border border-border bg-card p-5 ${className ?? ''}`}>
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  )
}

function RankedList({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{title}</span>
      <ol className="flex flex-col gap-1.5">
        {items.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
