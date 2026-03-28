import type { PropsWithChildren } from 'react'

import { cn } from '../../lib/utils'

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('rounded-3xl border border-border bg-card p-4 shadow-panel sm:p-6', className)}>{children}</section>
}
