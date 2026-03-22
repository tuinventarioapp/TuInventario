import type { PropsWithChildren, ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
  children,
}: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {action}
      {children}
    </div>
  )
}
