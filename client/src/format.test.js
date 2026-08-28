import assert from 'node:assert/strict'
import test from 'node:test'
import { formatNumber, formatWalletLabel } from './format.js'

test('半屏货币栏从千位开始使用 K/M 短格式', () => {
  assert.equal(formatWalletLabel(84, true), '84')
  assert.equal(formatWalletLabel(999, true), '999')
  assert.equal(formatWalletLabel(1000, true), '1K')
  assert.equal(formatWalletLabel(5700, true), '5.7K')
  assert.equal(formatWalletLabel(52860, true), '52.9K')
  assert.equal(formatWalletLabel(5700000, true), '5.7M')
})

test('全屏保留常规余额，大数值及九位数不挤占货币栏', () => {
  assert.equal(formatWalletLabel(52860), '52,860')
  assert.equal(formatWalletLabel(100000), '100K')
  assert.equal(formatWalletLabel(567000000), '567M')
  assert.equal(formatWalletLabel(999999999), '1B')
})

test('资产浮窗及无障碍标签可显示完整九位数', () => {
  assert.equal(formatNumber(567000000), '567,000,000')
  assert.equal(formatNumber(999999999), '999,999,999')
})
