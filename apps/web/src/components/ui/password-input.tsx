import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

import { useI18n } from '../../i18n/use-i18n'
import { cn } from '../../lib/utils'
import { Input } from './input'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn('pr-12', className)}
        type={visible ? 'text' : 'password'}
      />
      <button
        aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
        className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  )
}
