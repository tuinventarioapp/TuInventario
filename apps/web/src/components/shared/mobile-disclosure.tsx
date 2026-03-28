import { ChevronDown, ChevronUp } from 'lucide-react'
import { type PropsWithChildren, type ReactNode, useState } from 'react'

import { useI18n } from '../../i18n/use-i18n'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

export function MobileDisclosure({
  title,
  description,
  isMobile,
  defaultOpen = false,
  actions,
  className,
  children,
}: PropsWithChildren<{
  title: string
  description?: string
  isMobile: boolean
  defaultOpen?: boolean
  actions?: ReactNode
  className?: string
}>) {
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(defaultOpen)
  const open = isMobile ? mobileOpen : true

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {isMobile && (
            <Button
              aria-expanded={open}
              className="bg-secondary text-secondary-foreground"
              onClick={() => setMobileOpen((current) => !current)}
              type="button"
            >
              {open ? t('common.hide') : t('common.show')}
              {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      {(!isMobile || open) && children}
    </div>
  )
}
