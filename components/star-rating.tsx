'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'lg'
  className?: string
}

type Fill = 'full' | 'half' | 'empty'

function starFill(n: number, shown: number): Fill {
  if (shown >= n) return 'full'
  if (shown >= n - 0.5) return 'half'
  return 'empty'
}

function valueFromClick(n: number, clientX: number, target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  return clientX < rect.left + rect.width / 2 ? n - 0.5 : n
}

export function StarRating({ value, onChange, size = 'sm', className }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  const iconSize = size === 'lg' ? 'size-7' : 'size-3.5'

  if (!onChange) {
    return (
      <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarGlyph key={n} fill={starFill(n, value)} className={iconSize} />
        ))}
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n || value === n - 0.5}
          aria-label={`${n} stars, left half for ${n - 0.5}`}
          onMouseMove={(e) => setHover(valueFromClick(n, e.clientX, e.currentTarget))}
          onClick={(e) => {
            const next = valueFromClick(n, e.clientX, e.currentTarget)
            onChange(value === next ? 0 : next)
          }}
          className="rounded-sm p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <StarGlyph fill={starFill(n, shown)} className={iconSize} />
        </button>
      ))}
    </div>
  )
}

function StarGlyph({ fill, className }: { fill: Fill; className?: string }) {
  return (
    <span className={cn('relative block', className)}>
      <Star aria-hidden className={cn('block', className, 'text-muted-foreground/40')} />
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: fill === 'full' ? '100%' : fill === 'half' ? '50%' : '0%' }}
      >
        <Star aria-hidden className={cn('block', className, 'fill-primary text-primary')} />
      </span>
    </span>
  )
}
