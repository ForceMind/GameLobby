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
        gender: 'male',
        wealthLevel: 3,
        charmLevel: 2,
        familyId: 'family-nova',
      },
      wallet: { coins: 1234567, gems: 8901 },
    }),
    {
      account: {
        id: 'u-1',
        name: 'Alex',
        avatar: 'https://example.com/a.png',
        level: 12,
        gender: 'male',
        wealthLevel: 3,
        charmLevel: 2,
        familyId: 'family-nova',
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
    account: {
      id: 'u-1',
      name: 'Alex',
      avatar: 'avatar',
      level: 77,
      gender: 'female',
      wealthLevel: 4,
      charmLevel: 5,
      familyId: 'family-alpha',
    },
    wallet: { coins: 10000, gems: 20 },
  })
  assert.deepEqual(
    normalizeHostContext(
      { account: { name: 'Bea' }, wallet: { coins: 25000 } },
      fallback,
    ),
    {
      account: {
        id: 'u-1',
        name: 'Bea',
        avatar: 'avatar',
        level: 77,
        gender: 'female',
        wealthLevel: 4,
        charmLevel: 5,
        familyId: 'family-alpha',
      },
      wallet: { coins: 25000, gems: 20, coinsLabel: '25,000', gemsLabel: '20' },
    },
  )
})

test('拒绝错误值、秘密字段和任意嵌套对象；非法准入等级和余额按加强安全语义清除', () => {
  const result = normalizeHostContext(
    {
      token: 'secret',
      level: 999,
      account: {
        id: { value: 'bad' },
        name: '',
        avatar: 'x'.repeat(241),
        level: 0,
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
    account: { id: 'safe-id', name: 'Safe' },
    wallet: { coins: 0, gems: 3, coinsLabel: '0', gemsLabel: '3' },
  })
})

test('等级只接受1到999的整数；新准入规则下显式非法值不能沿用旧资格', () => {
  assert.equal(normalizeHostContext({ account: { level: 1 } }).account.level, 1)
  assert.equal(
    normalizeHostContext({ account: { level: 999 } }).account.level,
    999,
  )
  assert.equal(
    normalizeHostContext({ account: { level: 0 } }, { account: { level: 8 } })
      .account.level,
    undefined,
  )
  assert.equal(
    normalizeHostContext(
      { account: { level: 1000 } },
      { account: { level: 8 } },
    ).account.level,
    undefined,
  )
  assert.equal(
    normalizeHostContext({ account: { level: 1.5 } }, { account: { level: 8 } })
      .account.level,
    undefined,
  )
  assert.equal(
    normalizeHostContext({ account: { level: '8' } }, { account: { level: 8 } })
      .account.level,
    undefined,
  )
})

test('没有可用余额时使用安全的零值', () => {
  assert.deepEqual(normalizeHostContext(null, null), {
    account: {},
    wallet: { coins: 0, gems: 0, coinsLabel: '0', gemsLabel: '0' },
  })
})

test('仅接受合法的准入字段，显式非法值不会沿用旧值', () => {
  const fallback = normalizeHostContext({
    account: {
      id: 'u-1',
      gender: 'male',
      wealthLevel: 3,
      charmLevel: 2,
      familyId: 'family-nova',
    },
  })
  const result = normalizeHostContext({
    account: {
      gender: 'other',
      wealthLevel: -1,
      charmLevel: 1.5,
      familyId: ' ',
    },
  }, fallback)
  assert.deepEqual(result.account, { id: 'u-1' })
  assert.deepEqual(
    normalizeHostContext({ account: { familyId: null } }, fallback).account,
    { id: 'u-1', gender: 'male', wealthLevel: 3, charmLevel: 2 },
  )
})

test('准入字段在同账号部分更新时保留，余额和资料也保持原有语义', () => {
  const fallback = normalizeHostContext({
    account: {
      id: 'u-1', name: 'Alex', level: 10, gender: 'female', wealthLevel: 2,
      charmLevel: 3, familyId: 'family-alpha',
    },
    wallet: { coins: 500, gems: 8 },
  })
  const result = normalizeHostContext({ account: { charmLevel: 4 }, wallet: { coins: 700 } }, fallback)
  assert.deepEqual(result.account, {
    id: 'u-1', name: 'Alex', level: 10, gender: 'female', wealthLevel: 2,
    charmLevel: 4, familyId: 'family-alpha',
  })
  assert.deepEqual(result.wallet, { coins: 700, gems: 8, coinsLabel: '700', gemsLabel: '8' })
})

test('同账号增量省略准入值会保留，显式撤销等级或余额会清除旧资格', () => {
  const fallback = normalizeHostContext({
    account: { id: 'u-1', level: 10, wealthLevel: 2 },
    wallet: { coins: 500, gems: 8 },
  })
  const retained = normalizeHostContext({ account: { wealthLevel: 3 }, wallet: { gems: 9 } }, fallback)
  assert.deepEqual(retained, {
    account: { id: 'u-1', level: 10, wealthLevel: 3 },
    wallet: { coins: 500, gems: 9, coinsLabel: '500', gemsLabel: '9' },
  })
  const cleared = normalizeHostContext({ account: { level: null }, wallet: { coins: '500' } }, fallback)
  assert.deepEqual(cleared, {
    account: { id: 'u-1', wealthLevel: 2 },
    wallet: { coins: 0, gems: 8, coinsLabel: '0', gemsLabel: '8' },
  })
})

test('账号切换不会复用上一位玩家的资料、门槛或钱包数据', () => {
  const fallback = normalizeHostContext({
    account: {
      id: 'u-1', name: 'Alex', avatar: 'avatar', level: 10, gender: 'female',
      wealthLevel: 2, charmLevel: 3, familyId: 'family-alpha',
    },
    wallet: { coins: 500, gems: 8 },
  })
  assert.deepEqual(normalizeHostContext({ account: { id: 'u-2' } }, fallback), {
    account: { id: 'u-2' },
    wallet: { coins: 0, gems: 0, coinsLabel: '0', gemsLabel: '0' },
  })
})

test('首次收到合法账号 ID 时不会继承未知身份的准入资格', () => {
  const unknownIdentity = normalizeHostContext({
    account: { name: 'Unknown', level: 10, wealthLevel: 2, familyId: 'family-alpha' },
    wallet: { coins: 500, gems: 8 },
  })
  assert.deepEqual(normalizeHostContext({ account: { id: 'u-1' } }, unknownIdentity), {
    account: { id: 'u-1' },
    wallet: { coins: 0, gems: 0, coinsLabel: '0', gemsLabel: '0' },
  })
})
