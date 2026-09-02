import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { defaultPreferences, readPreferences, writePreferences } from './preferences.js'
import { normalizeLedger, filterLedger } from './ledger.js'
import { createPreviewService } from './service.js'

const memory = () => { const map=new Map();return {getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)} }

test('中奖弹幕默认开启，保存关闭后重新读取仍关闭且不同账号隔离', () => {
  const storage=memory()
  assert.equal(readPreferences(storage,'a').receiveWinNotifications,true)
  writePreferences(storage,'a',{...defaultPreferences,receiveWinNotifications:false,extra:'ignore'})
  assert.deepEqual(readPreferences(storage,'a'),{...defaultPreferences,receiveWinNotifications:false})
  assert.deepEqual(readPreferences(storage,'b'),defaultPreferences)
  assert.equal(readPreferences(storage,'a').allowSendWins,true)
})

test('流水保留资产明细并支持币种与收支筛选，缺失余额不伪造', () => {
  const entries=normalizeLedger([
    {id:'a',currency:'coins',amount:-500,source:'chest_purchase',createdAt:2},
    {id:'b',currency:'gems',amount:2,source:'task',createdAt:1},
    {id:'reward-old',coins:2400,at:3},
  ])
  assert.deepEqual(filterLedger(entries,'coins','income').map(row=>row.id),['reward-old'])
  assert.deepEqual(filterLedger(entries,'coins','expense').map(row=>row.id),['a'])
  assert.equal(entries[0].balanceBefore,null)
  assert.equal(entries[0].source,'chest_reward')
  assert.equal(filterLedger(entries,'gems','expense').length,0)
})

test('宝箱购买和开启使用同一钱包流水且返回变动前后余额', async () => {
  let now=Date.parse('2026-09-02T12:00:00+08:00')
  const service=createPreviewService({storage:memory(),now:()=>now})
  const before=await service.ledger('a')
  assert.equal(before.entries.length,5)
  await service.completeRound('a')
  const state=await service.chest('a')
  const purchased=await service.buy('a',{day:state.offer.day,offerVersion:state.offer.version})
  const debit=(await service.ledger('a')).entries.find(row=>row.source==='chest_purchase')
  assert.equal(debit.amount,-500)
  assert.equal(debit.balanceBefore - debit.balanceAfter,500)
  now=purchased.chests[0].unlockAt
  await service.open('a',purchased.chests[0].id)
  const credit=(await service.ledger('a')).entries.find(row=>row.source==='chest_reward')
  assert.equal(credit.amount,2400)
  assert.equal(credit.balanceAfter - credit.balanceBefore,2400)
})

test('半屏个人页保留独立流水和设置入口，资产浮窗不再挪用战绩', async () => {
  const profile=await readFile(new URL('../pages/ProfilePage.jsx',import.meta.url),'utf8')
  const wallet=await readFile(new URL('../h5/WalletDetails.jsx',import.meta.url),'utf8')
  const feed=await readFile(new URL('../components/WinnerFeed.jsx',import.meta.url),'utf8')
  assert.match(profile,/<WalletLedger onShowAll=/)
  assert.match(profile,/<ProfileSettings \/>/)
  assert.match(profile,/profile-settings-entry/)
  assert.doesNotMatch(wallet,/recentRecords/)
  assert.match(feed,/rowsRef.current = \[\]/)
  assert.match(feed,/seen.current.add\(item.id\)/)
  assert.doesNotMatch(profile,/formatWalletLabel\(balances\.(coins|gems), true\)/)
  assert.match(profile,/balances\.coinsLabel/)
  assert.match(profile,/balances\.gemsLabel/)
})
