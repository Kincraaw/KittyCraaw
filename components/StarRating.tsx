'use client'

interface StarRatingProps {
  value: number | null
  onChange?: (v: number) => void
  readonly?: boolean
}

export default function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none transition-transform ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${n <= (value ?? 0) ? 'text-amber-400' : 'text-white/20'}`}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
