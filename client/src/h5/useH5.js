import { createContext, useContext } from 'react'

export const H5Context = createContext(null)

export function useH5() {
  const value = useContext(H5Context)
  if (!value) throw new Error('useH5 must be inside H5Provider')
  return value
}
