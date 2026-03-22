import { useQuery } from '@tanstack/react-query'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'

export function SettingsPage() {
  const { t, language, setLanguage, languageLabels, enumLabel } = useI18n()
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: api.settings })

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <Card>
        <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">{t('common.organization')}</dt>
            <dd>{settingsQuery.data?.organizationName}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">{t('settings.currentRole')}</dt>
            <dd>{enumLabel('role', settingsQuery.data?.role)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">{t('common.timezone')}</dt>
            <dd>{settingsQuery.data?.timezone}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">{t('items.location')}</dt>
            <dd>{settingsQuery.data?.assignedLocationName || t('users.globalScope')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">ID</dt>
            <dd className="break-all">{settingsQuery.data?.organizationId}</dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('settings.availableLanguages')}</h2>
          <p className="text-sm text-slate-500">{t('settings.languageHelp')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(languageLabels).map(([code, label]) => (
            <Button
              key={code}
              className={language === code ? '' : 'bg-secondary text-secondary-foreground'}
              onClick={() => setLanguage(code as keyof typeof languageLabels)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <Notice>
        <p className="font-medium">{t('manual.title')}</p>
        <p className="mt-1">{t('manual.description')}</p>
        <p className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-700">docs/09-manual-usuario/01-manual-de-uso.md</p>
      </Notice>
    </div>
  )
}
