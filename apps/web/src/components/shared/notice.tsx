import type { PropsWithChildren } from 'react'

import { cn } from '../../lib/utils'

const variants = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function Notice({
  children,
  className,
  variant = 'info',
}: PropsWithChildren<{ className?: string; variant?: keyof typeof variants }>) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-sm', variants[variant], className)}>
      {children}
    </div>
  )
}
