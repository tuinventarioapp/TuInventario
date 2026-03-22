import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppLanguage = 'es' | 'en' | 'pt'

interface UiState {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'tuinventario-ui',
    },
  ),
)
