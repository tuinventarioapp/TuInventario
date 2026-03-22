import { useMemo } from 'react'

import { enumDictionaries, dictionaries, languageLabels } from './translations'
import { type AppLanguage, useUiStore } from '../store/ui-store'

function interpolate(template: string, variables?: Record<string, string | number>) {
  if (!variables) return template
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

export function useI18n() {
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  const dictionary = dictionaries[language]
  const enumDictionary = enumDictionaries[language]

  return useMemo(() => {
    const t = (key: string, variables?: Record<string, string | number>) =>
      interpolate(dictionary[key] ?? dictionaries.es[key] ?? key, variables)

    const enumLabel = (group: keyof typeof enumDictionary, value?: string | null) => {
      if (!value) return t('common.notAvailable')
      return enumDictionary[group]?.[value] ?? enumDictionaries.es[group]?.[value] ?? value
    }

    return {
      language,
      setLanguage,
      languageLabels,
      t,
      enumLabel,
      locale: language === 'es' ? 'es-CO' : language === 'pt' ? 'pt-BR' : 'en-US',
    }
  }, [dictionary, enumDictionary, language, setLanguage])
}

export function currentLocale(language: AppLanguage) {
  if (language === 'pt') return 'pt-BR'
  if (language === 'en') return 'en-US'
  return 'es-CO'
}
