import type { PropsWithChildren, ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
  children,
}: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-[1.7rem] font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        <p className="max-w-[32rem] text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="w-full md:w-auto">{action}</div> : null}
      {children ? <div className="w-full md:w-auto">{children}</div> : null}
    </div>
  )
}
