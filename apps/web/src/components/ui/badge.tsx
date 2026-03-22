import type { PropsWithChildren } from 'react'

import { cn } from '../../lib/utils'

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <span className={cn('inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground', className)}>{children}</span>
}
