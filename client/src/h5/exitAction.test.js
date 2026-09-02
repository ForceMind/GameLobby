import test from 'node:test'
import assert from 'node:assert/strict'
import { createExitAction } from './exitAction.js'
import { readFile } from 'node:fs/promises'

test('退出动作只在确认后执行；宿主关闭与预览返回不交叉调用', async () => {
  let hostCalls=0, navigations=0
  const confirmExit=createExitAction({hasHost:()=>true,closeHost:async()=>{hostCalls++;return {status:'completed'}},navigate:()=>navigations++})
  assert.equal(hostCalls,0)
  assert.equal(navigations,0)
  await confirmExit()
  assert.equal(hostCalls,1)
  assert.equal(navigations,0)
  const confirmPreview=createExitAction({hasHost:()=>false,closeHost:async()=>hostCalls++,navigate:()=>navigations++})
  await confirmPreview()
  assert.equal(hostCalls,1)
  assert.equal(navigations,1)
})

test('退出确认连续点击不会重复请求；失败后允许显式重试', async () => {
  let resolve, calls=0
  const confirmed=createExitAction({hasHost:()=>true,closeHost:()=>{calls++;return new Promise(done=>{resolve=done})},navigate:()=>{}})
  const first=confirmed()
  assert.deepEqual(await confirmed(),{status:'pending'})
  assert.equal(calls,1)
  resolve({status:'failed'})
  assert.deepEqual(await first,{status:'failed'})
  const retry=confirmed()
  assert.equal(calls,2)
  resolve({status:'completed'})
  assert.deepEqual(await retry,{status:'completed'})
})

test('复用历史 openExit 与现有 Modal，页面按钮不再直接退出', async () => {
  const app=await readFile(new URL('../App.jsx',import.meta.url),'utf8')
  assert.match(app,/50c8b32/)
  assert.match(app,/const openExit = \(\) => setModal\(/)
  assert.match(app,/onExit=\{openExit\}/)
  assert.doesNotMatch(app,/onClick=\{closeLobby\}/)
  assert.match(app,/joyloop:request-close/)
  assert.match(app,/cancelLabel: t\('exit.stay'\)/)
})
