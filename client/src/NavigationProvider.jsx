import { useEffect, useState } from 'react'
import { NavigationContext } from './useNavigation.js'
import { installNavigation, pageFromUrl } from './navigation.js'

export default function NavigationProvider({ children }) {
  const [route, setRoute] = useState(() => ({
    url: window.location.href,
    action: 'load',
  }))
  useEffect(
    () => installNavigation(window, document, route.url, setRoute),
    [route.url],
  )
  return (
    <NavigationContext.Provider value={{
      ...route,
      page: pageFromUrl(route.url) ?? document.body.dataset.page,
    }}>
      {children}
    </NavigationContext.Provider>
  )
}
