import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { currentLocale } from '../i18n/use-i18n'
import { useUiStore } from '../store/ui-store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  const language = useUiStore.getState().language
  return new Intl.DateTimeFormat(currentLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}
