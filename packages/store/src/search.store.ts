import { create } from 'zustand'

/** Фильтры экрана поиска. Живут в сторе, чтобы переживать переходы. */
interface SearchState {
  query: string
  city: string | null
  cemeteryId: string | null
  setQuery: (query: string) => void
  setCity: (city: string | null) => void
  setCemetery: (cemeteryId: string | null) => void
  clearFilters: () => void
}

export const useSearchStore = create<SearchState>(set => ({
  query: '',
  city: null,
  cemeteryId: null,
  setQuery: query => set({ query }),
  setCity: city => set({ city }),
  setCemetery: cemeteryId => set({ cemeteryId }),
  clearFilters: () => set({ city: null, cemeteryId: null }),
}))
