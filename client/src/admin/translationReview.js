// Translation review metadata stays outside the translation catalogue. A stored
// basis records the source copy a non-Chinese translation was reviewed against.

const nonEmpty = (value) => String(value ?? '').trim() !== ''
const isReviewableLocale = (locale) => locale !== 'zh-Hans'
const entriesOf = (entries) => (entries && typeof entries === 'object' ? entries : {})
const localesOf = (entry) => (entry && typeof entry === 'object' ? entry : {})

export function translationReviewBasis(entry, locale) {
  if (locale === 'zh-Hans') return '{}'
  const source = localesOf(entry)
  if (locale === 'en') return JSON.stringify({ 'zh-Hans': source['zh-Hans'] ?? '' })
  return JSON.stringify({ 'zh-Hans': source['zh-Hans'] ?? '', en: source.en ?? '' })
}

export function createTranslationReviews(entries) {
  const reviews = {}
  Object.entries(entriesOf(entries)).forEach(([key, entry]) => {
    Object.entries(localesOf(entry)).forEach(([locale, text]) => {
      if (!isReviewableLocale(locale) || !nonEmpty(text)) return
      if (!reviews[key]) reviews[key] = {}
      reviews[key][locale] = translationReviewBasis(entry, locale)
    })
  })
  return reviews
}

export function needsTranslationReview(entry, reviewByLocale, locale) {
  if (!isReviewableLocale(locale) || !nonEmpty(localesOf(entry)[locale])) return false
  return reviewByLocale?.[locale] !== translationReviewBasis(entry, locale)
}

const copyReviews = (reviews) => Object.fromEntries(
  Object.entries(entriesOf(reviews)).map(([key, byLocale]) => [key, { ...localesOf(byLocale) }]),
)

const removeReview = (reviews, key, locale) => {
  if (!reviews[key]) return
  delete reviews[key][locale]
  if (Object.keys(reviews[key]).length === 0) delete reviews[key]
}

// Only an edit to the translation itself, or an explicit reviewer confirmation,
// refreshes its review basis. Source-copy edits deliberately leave old reviews
// stale so they remain visible to the reviewer.
export function updateTranslationReviews(reviews, beforeEntries, afterEntries, confirmed = {}) {
  const next = copyReviews(reviews)
  const before = entriesOf(beforeEntries)
  const after = entriesOf(afterEntries)
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])

  keys.forEach((key) => {
    const oldEntry = localesOf(before[key])
    const newEntry = localesOf(after[key])
    const locales = new Set([...Object.keys(oldEntry), ...Object.keys(newEntry)])
    locales.forEach((locale) => {
      if (!isReviewableLocale(locale) || oldEntry[locale] === newEntry[locale]) return
      if (!nonEmpty(newEntry[locale])) removeReview(next, key, locale)
      else {
        if (!next[key]) next[key] = {}
        next[key][locale] = translationReviewBasis(newEntry, locale)
      }
    })
  })

  Object.entries(entriesOf(confirmed)).forEach(([key, locales]) => {
    if (!Array.isArray(locales)) return
    const entry = localesOf(after[key])
    locales.forEach((locale) => {
      if (!isReviewableLocale(locale) || !nonEmpty(entry[locale])) return
      if (!next[key]) next[key] = {}
      next[key][locale] = translationReviewBasis(entry, locale)
    })
  })

  return next
}

export function translationReviewErrors(entries, reviews) {
  return Object.entries(entriesOf(entries)).flatMap(([key, entry]) =>
    Object.keys(localesOf(entry))
      .filter((locale) => needsTranslationReview(entry, entriesOf(reviews)[key], locale))
      .map((locale) => `「${key}」的 ${locale} 译文需要复核`),
  )
}
