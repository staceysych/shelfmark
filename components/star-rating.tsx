'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'lg'
  className?: string
}

export function StarRating({ value, onChange, size = 'sm', className }: StarRatingProps) {
  const iconSize = size === 'lg' ? 'size-7' : 'size-3.5'

  if (!onChange) {
    return (
      <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={cn(iconSize, n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/40')}
          />
        ))}
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label="Rating" className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Star
            aria-hidden
            className={cn(
              iconSize,
              'transition-colors',
              n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/50 hover:text-primary/70',
            )}
          />
        </button>
      ))}
    </div>
  )
}
