'use client'

import { useState } from 'react'
import { coverSrc } from '@/lib/books'
import { cn } from '@/lib/utils'

type BookCoverProps = {
  coverId: number | null
  coverUrl?: string | null
  title: string
  author?: string
  size?: 'S' | 'M' | 'L'
  className?: string
}

export function BookCover({ coverId, coverUrl, title, author, size = 'M', className }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const src = coverSrc({ coverId, coverUrl }, size)

  return (
    <div
      className={cn(
        'relative aspect-[2/3] h-auto w-full shrink-0 self-start overflow-hidden rounded-sm bg-secondary shadow-[0_12px_24px_-8px_oklch(0_0_0/0.6)]',
        className,
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <div className="flex size-full flex-col justify-between bg-secondary p-3">
          <span className="font-serif text-sm leading-tight text-balance text-foreground">{title}</span>
          {author && <span className="text-[11px] leading-snug text-muted-foreground">{author}</span>}
        </div>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-foreground/15 via-foreground/5 to-transparent"
      />
    </div>
  )
}
