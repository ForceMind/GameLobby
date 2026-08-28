import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeHostContext } from './hostContext.js'

test('规范化合法宿主数据并生成英文千分位余额', () => {
  assert.deepEqual(
    normalizeHostContext({
      account: {
        id: 'u-1',
        name: '  Alex ',
        avatar: 'https://example.com/a.png',
        level: 12,
      },
      wallet: { coins: 1234567, gems: 8901 },
    }),
    {
      account: {
        id: 'u-1',
        name: 'Alex',
        avatar: 'https://example.com/a.png',
        level: 12,
      },
      wallet: {
        coins: 1234567,
        gems: 8901,
        coinsLabel: '1,234,567',
        gemsLabel: '8,901',
      },
    },
  )
})

test('部分更新沿用 fallback 中的合法值', () => {
  const fallback = normalizeHostContext({
    account: { id: 'u-1', name: 'Alex', avatar: 'avatar', level: 77 },
    wallet: { coins: 10000, gems: 20 },
  })
  assert.deepEqual(
    normalizeHostContext(
      { account: { name: 'Bea' }, wallet: { coins: 25000 } },
      fallback,
    ),
    {
      account: { id: 'u-1', name: 'Bea', avatar: 'avatar', level: 77 },
      wallet: { coins: 25000, gems: 20, coinsLabel: '25,000', gemsLabel: '20' },
    },
  )
})

test('拒绝错误值、秘密字段和任意嵌套对象', () => {
  const result = normalizeHostContext(
    {
      token: 'secret',
      level: 999,
      account: {
        id: { value: 'bad' },
        name: '',
        avatar: 'x'.repeat(241),
        token: 'secret',
      },
      wallet: { coins: -1, gems: Infinity, token: 'secret' },
    },
    {
      account: { id: 'safe-id', name: 'Safe', level: 4, token: 'old-secret' },
      wallet: { coins: 9, gems: 3, token: 'old-secret' },
    },
  )
  assert.deepEqual(result, {
    account: { id: 'safe-id', name: 'Safe', level: 4 },
    wallet: { coins: 9, gems: 3, coinsLabel: '9', gemsLabel: '3' },
  })
})

test('等级只接受1到999的整数，并从 fallback 补齐', () => {
  assert.equal(normalizeHostContext({ account: { level: 1 } }).account.level, 1)
  assert.equal(
    normalizeHostContext({ account: { level: 999 } }).account.level,
    999,
  )
  assert.equal(
    normalizeHostContext({ account: { level: 0 } }, { account: { level: 8 } })
      .account.level,
    8,
  )
  assert.equal(
    normalizeHostContext(
      { account: { level: 1000 } },
      { account: { level: 8 } },
    ).account.level,
    8,
  )
  assert.equal(
    normalizeHostContext({ account: { level: 1.5 } }, { account: { level: 8 } })
      .account.level,
    8,
  )
  assert.equal(
    normalizeHostContext({ account: { level: '8' } }, { account: { level: 8 } })
      .account.level,
    8,
  )
})

test('没有可用余额时使用安全的零值', () => {
  assert.deepEqual(normalizeHostContext(null, null), {
    account: {},
    wallet: { coins: 0, gems: 0, coinsLabel: '0', gemsLabel: '0' },
  })
})
