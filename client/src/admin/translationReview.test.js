import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createTranslationReviews, needsTranslationReview, translationReviewBasis,
  translationReviewErrors, updateTranslationReviews,
} from './translationReview.js'

const initialEntries = () => ({
  'lobby.welcome': { 'zh-Hans': '欢迎回来', en: 'Welcome back', ja: 'おかえりなさい', de: 'Willkommen zurück' },
})

test('复核基准只包含该语言依赖的原文，简体中文不需要复核', () => {
  const entry = initialEntries()['lobby.welcome']
  assert.equal(translationReviewBasis(entry, 'zh-Hans'), '{}')
  assert.equal(translationReviewBasis(entry, 'en'), '{"zh-Hans":"欢迎回来"}')
  assert.equal(translationReviewBasis(entry, 'ja'), '{"zh-Hans":"欢迎回来","en":"Welcome back"}')
})

test('初始化只为现有的非空非中文译文建立独立复核元数据', () => {
  const entries = { 'a.b': { 'zh-Hans': '你好', en: 'Hello', ja: 'こんにちは', de: '  ' } }
  const reviews = createTranslationReviews(entries)
  assert.deepEqual(reviews, {
    'a.b': { en: '{"zh-Hans":"你好"}', ja: '{"zh-Hans":"你好","en":"Hello"}' },
  })
  assert.equal(Object.hasOwn(entries['a.b'], 'reviews'), false)
})

test('原文改变使已有译文待复核，英文改变只影响依赖英文的其他语言', () => {
  const before = initialEntries()
  const reviews = createTranslationReviews(before)
  const zhChanged = { 'lobby.welcome': { ...before['lobby.welcome'], 'zh-Hans': '欢迎您回来' } }
  assert.equal(needsTranslationReview(zhChanged['lobby.welcome'], reviews['lobby.welcome'], 'en'), true)
  assert.equal(needsTranslationReview(zhChanged['lobby.welcome'], reviews['lobby.welcome'], 'ja'), true)
  assert.equal(translationReviewErrors(zhChanged, reviews).length, 3)

  const enChanged = { 'lobby.welcome': { ...before['lobby.welcome'], en: 'Welcome home' } }
  assert.equal(needsTranslationReview(enChanged['lobby.welcome'], reviews['lobby.welcome'], 'en'), false)
  assert.equal(needsTranslationReview(enChanged['lobby.welcome'], reviews['lobby.welcome'], 'ja'), true)
  assert.equal(needsTranslationReview(enChanged['lobby.welcome'], reviews['lobby.welcome'], 'de'), true)
})

test('仅改原文不会自动复核其他语言；编辑或清空译文才更新对应记录', () => {
  const before = initialEntries()
  const reviews = createTranslationReviews(before)
  const sourceChanged = { 'lobby.welcome': { ...before['lobby.welcome'], 'zh-Hans': '欢迎您回来' } }
  const afterSource = updateTranslationReviews(reviews, before, sourceChanged)
  assert.deepEqual(afterSource, reviews)

  const translated = { 'lobby.welcome': { ...sourceChanged['lobby.welcome'], ja: 'お帰りなさいませ' } }
  const afterTranslation = updateTranslationReviews(afterSource, sourceChanged, translated)
  assert.equal(needsTranslationReview(translated['lobby.welcome'], afterTranslation['lobby.welcome'], 'ja'), false)
  assert.equal(needsTranslationReview(translated['lobby.welcome'], afterTranslation['lobby.welcome'], 'de'), true)

  const cleared = { 'lobby.welcome': { ...translated['lobby.welcome'], de: '' } }
  const afterClear = updateTranslationReviews(afterTranslation, translated, cleared)
  assert.equal(Object.hasOwn(afterClear['lobby.welcome'], 'de'), false)
  assert.equal(needsTranslationReview(cleared['lobby.welcome'], afterClear['lobby.welcome'], 'de'), false)
})

test('明确确认可刷新未编辑译文的复核基准，未确认译文仍保持待复核', () => {
  const before = initialEntries()
  const reviews = createTranslationReviews(before)
  const changed = { 'lobby.welcome': { ...before['lobby.welcome'], 'zh-Hans': '欢迎您回来' } }
  const next = updateTranslationReviews(reviews, before, changed, { 'lobby.welcome': ['ja'] })
  assert.equal(needsTranslationReview(changed['lobby.welcome'], next['lobby.welcome'], 'ja'), false)
  assert.equal(needsTranslationReview(changed['lobby.welcome'], next['lobby.welcome'], 'de'), true)
})

test('所有函数均不修改调用方提供的目录或复核元数据', () => {
  const before = initialEntries()
  const reviews = createTranslationReviews(before)
  const beforeCopy = structuredClone(before)
  const reviewsCopy = structuredClone(reviews)
  const after = { 'lobby.welcome': { ...before['lobby.welcome'], ja: '' } }
  updateTranslationReviews(reviews, before, after, { 'lobby.welcome': ['de'] })
  translationReviewErrors(before, reviews)
  assert.deepEqual(before, beforeCopy)
  assert.deepEqual(reviews, reviewsCopy)
})
