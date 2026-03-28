import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border bg-white px-3 text-base text-foreground outline-none ring-offset-white transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm',
        props.className,
      )}
    />
  )
}
