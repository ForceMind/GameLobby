import { createContext, useContext } from 'react'

export const LocaleContext = createContext(null)

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}
