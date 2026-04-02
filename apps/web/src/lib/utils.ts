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

function triggerDownload(href: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  window.setTimeout(() => {
    anchor.remove()
  }, 0)
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  triggerDownload(objectUrl, filename)
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 1_000)
}

export function downloadUrl(url: string, filename: string) {
  triggerDownload(url, filename)
}
