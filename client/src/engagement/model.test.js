import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessDay, nextOpening, chestState, buyChest, openChest, rankings, chestOpeningRankings } from './model.js'
import { createPreviewService, createEngagementService } from './service.js'
import { createTranslator } from '../i18n.js'

const now = Date.parse('2026-09-02T15:00:00+08:00')
const offer = { version: 'v1', priceCoins: 500, maxRewardCoins: 7000 }
const initial = () => ({ walletCoins: 10000, completedDays: ['2026-09-02'], chests: [], ledger: [] })
const quote = { day: '2026-09-02', offerVersion: 'v1' }

test('宝箱资格来自有效游戏，当日限购一次且重复请求不重复扣费', () => {
  assert.throws(() => buyChest({...initial(),completedDays:[]}, now, offer, quote), /ineligible/)
  const state = buyChest(initial(), now, offer, quote)
  assert.equal(state.walletCoins, 9500)
  assert.equal(state.chests.length, 1)
  assert.equal(state.ledger.length, 1)
  assert.deepEqual(buyChest(state, now, offer, quote), state)
  assert.throws(() => buyChest({...initial(),walletCoins:499},now,offer,quote), /balance/)
  assert.throws(() => buyChest(initial(),now,offer,{...quote,offerVersion:'old'}), /stale/)
})

test('购买次日才能开启，截止时间严格生效，刷新不会重开或重复发奖', () => {
  const state = buyChest(initial(),now,offer,quote)
  const chest = state.chests[0]
  assert.equal(chest.unlockAt, Date.parse('2026-09-03T00:00:00+08:00'))
  assert.equal(chestState(chest,chest.unlockAt - 1),'waiting')
  assert.throws(() => openChest(state,now,chest.id,2400), /not-ready/)
  assert.throws(() => openChest(state,chest.unlockAt,chest.id,7001), /invalid-reward/)
  const opened = openChest(state,chest.unlockAt,chest.id,2400)
  assert.equal(opened.walletCoins,11900)
  assert.equal(opened.ledger.length,2)
  assert.deepEqual(openChest(opened,chest.unlockAt,chest.id,4000),opened)
  assert.throws(() => openChest(state,chest.expiresAt,chest.id,2400),/not-ready/)
  const zero = openChest(state,chest.unlockAt,chest.id,0)
  assert.equal(zero.walletCoins,9500)
  assert.equal(zero.chests[0].status,'opened')
})

test('昨天待开宝箱和今天新购买可以并存，按业务日判断而非设备时区', () => {
  assert.equal(businessDay(Date.parse('2026-09-02T16:00:00Z')),'2026-09-03')
  const state = buyChest(initial(),now,offer,quote)
  const tomorrow = nextOpening(now)
  const next = buyChest({...state,completedDays:[...state.completedDays,'2026-09-03']},tomorrow,offer,{...quote,day:'2026-09-03'})
  assert.equal(next.chests.length,2)
  assert.equal(next.walletCoins,9000)
  assert.equal(chestState(next.chests[0],tomorrow),'ready')
  assert.equal(chestState(next.chests[1],tomorrow),'waiting')
})

test('预览状态跨页面持久化且账号隔离；只完成游戏才获得资格', async () => {
  const map = new Map()
  const storage = {getItem:key => map.get(key),setItem:(key,value) => map.set(key,value)}
  const service = createPreviewService({storage,now:()=>now})
  assert.equal((await service.chest('a')).eligible,false)
  await service.completeRound('a')
  const data = await service.chest('a')
  await service.buy('a',{day:data.offer.day,offerVersion:data.offer.version})
  const nextService = createPreviewService({storage,now:()=>nextOpening(now)})
  assert.equal((await nextService.chest('a')).chests[0].state,'ready')
  assert.equal((await nextService.chest('b')).chests.length,0)
})

test('榜单按同源事件聚合且去重，最近记录与弹幕使用相同事件 ID', () => {
  const events=[{id:'1',playerId:'a',coins:10},{id:'1',playerId:'a',coins:10},{id:'2',playerId:'b',coins:30},{id:'3',playerId:'a',coins:25}]
  assert.deepEqual(rankings(events).map(row=>[row.playerId,row.coins,row.rank]),[['a',35,1],['b',30,2]])
})

test('服务器模式故障不回退预览，写请求沿用业务幂等键而不传入价格或奖励', async t => {
  const previous = globalThis.window
  globalThis.window = { JoyloopHost: { request() {} } }
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous })
  const calls = []
  t.mock.method(globalThis,'fetch',async (path,options) => {
    calls.push([path,options])
    throw new Error('offline')
  })
  const service = createEngagementService()
  assert.equal(service.source,'server')
  await assert.rejects(service.chest(),/offline/)
  await assert.rejects(service.winners(),/offline/)
  await assert.rejects(service.chestLeaderboard(),/offline/)
  for(let i=0;i<2;i++) await assert.rejects(service.buy('a',quote),/confirming/)
  const writes = calls.filter(([,options])=>options.method === 'POST').map(([,options])=>JSON.parse(options.body))
  assert.equal(writes[0].idempotencyKey,writes[1].idempotencyKey)
  assert.equal(Object.hasOwn(writes[0],'priceCoins'),false)
  assert.equal(Object.hasOwn(writes[0],'rewardCoins'),false)
  const before = calls.length
  await service.completeRound('a')
  assert.equal(calls.length,before)
})

test('开启排行只收录今日有效宝箱奖励，去重、稳定排序并限制前五', () => {
  const entry = (id, rewardCoins, openedAt = now - 1000) => ({ id, name: id, rewardCoins, openedAt })
  const rows = [entry('a', 2000), entry('a', 2000), entry('b', 6000), entry('c', 4000),
    entry('d', 3000), entry('e', 1000), entry('f', 500), entry('zero', 0), entry('future', 7000, now + 1),
    entry('old', 7000, now - 86400000), entry('invalid', -10), {id:'game-win',coins:268800,occurredAt:now}]
  assert.deepEqual(chestOpeningRankings(rows, now).map(row => [row.id, row.rank]), [['b',1],['c',2],['d',3],['a',4],['e',5]])
  assert.deepEqual(chestOpeningRankings([entry('z',3000),entry('x',3000)],now).map(row=>row.id),['x','z'])
  assert.deepEqual(chestOpeningRankings([],now),[])
})

test('宝箱开启后刷新开启排行，个人奖励不混用游戏中奖金额', async () => {
  const map = new Map()
  const storage = { getItem: key => map.get(key), setItem: (key,value) => map.set(key,value) }
  const service = createPreviewService({storage,now:()=>now,scenario:'ready'})
  const before = await service.chestLeaderboard('a')
  assert.equal(before.entries.length,5)
  assert.ok(before.entries.every(row=>row.rewardCoins <= 7000))
  const chest = await service.chest('a')
  await service.open('a',chest.chests[0].id)
  const after = await service.chestLeaderboard('a')
  assert.equal(after.entries.find(row=>row.isSelf).rewardCoins,2400)
  assert.equal(after.entries.find(row=>row.isSelf).rank,4)
  await service.open('a',chest.chests[0].id)
  assert.equal((await service.chestLeaderboard('a')).entries.filter(row=>row.isSelf).length,1)
  const empty = createPreviewService({storage,now:()=>now,scenario:'empty'})
  assert.deepEqual((await empty.chestLeaderboard('a')).entries,[])
})

test('宝箱卡片底部为开启排行，个人记录和说明仅在同一双标签浮窗', async () => {
  const card = await readFile(new URL('../components/TomorrowChest.jsx',import.meta.url),'utf8')
  const help = await readFile(new URL('../components/ChestHelpDialog.jsx',import.meta.url),'utf8')
  assert.match(card,/<ChestLeaderboard engagement=/)
  assert.match(card,/<ChestHelpDialog \/>/)
  assert.match(card,/onClick=\{openRecords\}/)
  assert.doesNotMatch(card,/<details|chest-history/)
  assert.match(help,/useState\('records'\)/)
  assert.match(help,/\['records', 'instructions'\]/)
  assert.match(help,/role="tabpanel"/)
  assert.match(help,/ArrowLeft/)
  assert.match(help,/chestState\(item, now\)/)
})

test('稳定消息 key 的中英文及占位符一致；面向玩家的宝箱不暴露内部规则', async () => {
  const messages=JSON.parse(await readFile(new URL('../data/engagementMessages.json',import.meta.url),'utf8'))
  assert.deepEqual(Object.keys(messages.zh).sort(),Object.keys(messages.en).sort())
  const params=s=>[...s.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort()
  for(const key of Object.keys(messages.zh)) {
    assert.deepEqual(params(messages.zh[key]),params(messages.en[key]),key)
    assert.notEqual(createTranslator('zh')(key),key)
    assert.notEqual(createTranslator('en')(key),key)
  }
  const chestCopy=Object.entries(messages.zh).filter(([key])=>key.startsWith('chest.')).map(([,value])=>value).join(' ')
  assert.doesNotMatch(chestCopy,/净损|亏损|返还比例|统计时间|本月有效/)
  const store=await readFile(new URL('../pages/StorePage.jsx',import.meta.url),'utf8')
  assert.doesNotMatch(store,/vaultPurchased|vaultRefresh|昨日净损/)
})

test('开启排行为默认收起的箭头折叠入口，收起后隐藏列表，展开刷新数据', async () => {
  const component = await readFile(new URL('../components/ChestLeaderboard.jsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../styles/chestRecords.css', import.meta.url), 'utf8')
  assert.match(component, /useState\(false\)/)
  assert.doesNotMatch(component, /role="switch"|aria-checked/)
  assert.match(component, /aria-expanded=\{expanded\}/)
  assert.match(component, /name="chevronRight"/)
  assert.match(component, /aria-controls=/)
  assert.match(component, /hidden=\{!expanded\}/)
  assert.match(component, /expanded &&/)
  assert.match(component, /if \(!expanded\) refresh\('chestLeaderboard'\)/)
  assert.match(styles, /\.chest-ranking-panel\[hidden\]\s*\{\s*display: none/)
})
