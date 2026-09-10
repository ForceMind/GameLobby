import { useMemo } from 'react'
import { categoryText } from './catalogConfig.js'
import { useLocale } from './useLocale.js'
import { usePublishedCatalog } from './usePublishedCatalog.js'

// Categories are operator-managed. Keep the game's tag IDs as the stable link
// and resolve their player-facing labels from the currently published catalogue.
export function useCategoryLabel() {
  const { t, locale } = useLocale()
  const { categories = [] } = usePublishedCatalog()
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  return (game) => (game.tags ?? [])
    .map((tag) => categoryText(categoryById.get(tag), locale, t) || tag)
    .join(' · ')
}
