'use client'

import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface CustomToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function CustomToggle({ checked, onChange, className }: CustomToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none',
        checked ? 'bg-[#7CB3D9]' : 'bg-[#B8B4AC]',
        className
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-6 h-6 rounded-full bg-[#3E3A39] flex items-center justify-center transition-all duration-300',
          checked ? 'left-7' : 'left-1'
        )}
      >
        {checked ? (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}
      </span>
    </button>
  )
}
