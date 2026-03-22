import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold">{title || t('placeholder.title')}</h1>
        <p className="mt-3 text-sm text-slate-600">{description || t('placeholder.description')}</p>
      </Card>
    </div>
  )
}
