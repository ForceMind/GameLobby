import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { businessPages, headerBack, installNavigation, internalDestination, pageFromUrl } from './navigation.js'
import { profileSecurity } from './data.js'
import { englishMessages } from './i18n.js'

test('全部业务页都有返回：子页回大厅，大厅关闭宿主或回说明入口', () => {
  for (const page of businessPages) {
    for (const hasHost of [false, true]) {
      const back = headerBack(page, hasHost)
      assert.equal(back.href, page === 'lobby' ? hasHost ? null : 'index.html' : 'lobby.html')
      assert.ok(back.label)
    }
  }
})

test('六页内部导航无需文档重载，强制保持当前语言和布局，保留筛选和锚点', () => {
  for (const mode of ['half', 'full']) {
    for (const page of businessPages) {
      const url = new URL(internalDestination(`https://example.com/profile.html?mode=${mode}&lang=en`, `${page}.html?mode=full&category=slots#games`))
      assert.equal(pageFromUrl(url), page)
      assert.equal(url.searchParams.get('mode'), mode)
      assert.equal(url.searchParams.get('lang'), 'en')
      assert.equal(url.searchParams.get('category'), 'slots')
      assert.equal(url.hash, '#games')
    }
  }
  assert.equal(pageFromUrl('https://example.com/profile'), 'profile')
  assert.equal(pageFromUrl('https://example.com/'), 'welcome')
})

test('入口、外链、下载、新窗口与组合键点击不被内部路由劫持', () => {
  const current = 'https://example.com/lobby.html?mode=half'
  for (const target of ['index.html', 'https://other.example/games.html', 'mailto:help@example.com', 'unknown.html']) assert.equal(internalDestination(current, target), null)
  for (const click of [{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { download: true }, { target: '_blank' }, { defaultPrevented: true }]) assert.equal(internalDestination(current, 'profile.html', click), null)
  assert.equal(internalDestination('https://example.com/', 'lobby.html'), null)
})

test('旧安全数据保持兼容，当前个人页不显示账号安全、编辑资料或旧安全功能', async () => {
  assert.deepEqual(profileSecurity.map((item) => item.label), ['异常登录检测'])
  const profile = await readFile(new URL('pages/ProfilePage.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(profile, /autoplay|自动旋转|手机号绑定|登录保护|支付密码|异常登录检测|账号安全|编辑资料/)
  for (const key of ['手机号绑定', '登录保护', '支付密码', '自动旋转']) assert.equal(Object.hasOwn(englishMessages, key), false)
})

test('实际点击阻止整页导航，前进后退更新路由；监听器可清理', () => {
  const win = new EventTarget()
  const doc = new EventTarget()
  let reloads = 0
  let pushes = 0
  let overlayClears = 0
  const routes = []
  win.location = { href: 'https://example.com/profile.html?lang=zh&mode=half', reload: () => reloads++ }
  win.history = { pushState: (_state, _title, url) => { pushes++; win.location.href = url } }
  doc.closest = () => ({ href: 'https://example.com/store.html?mode=full', hasAttribute: () => false, target: '' })
  win.addEventListener('joyloop:navigate', () => overlayClears++)
  const cleanup = installNavigation(win, doc, win.location.href, (route) => routes.push(route))
  const click = new Event('click', { cancelable: true })
  doc.dispatchEvent(click)
  assert.equal(click.defaultPrevented, true)
  assert.equal(pushes, 1)
  assert.equal(reloads, 0)
  assert.equal(overlayClears, 1)
  assert.equal(new URL(routes[0].url).searchParams.get('mode'), 'half')
  for (const page of ['profile', 'store']) {
    win.location.href = `https://example.com/${page}.html?lang=zh&mode=half`
    win.dispatchEvent(new Event('popstate'))
    assert.equal(routes.at(-1).action, 'pop')
    assert.equal(pageFromUrl(routes.at(-1).url), page)
  }
  assert.equal(reloads, 0)
  const count = routes.length
  cleanup()
  win.dispatchEvent(new Event('popstate'))
  assert.equal(routes.length, count)
})

test('全屏无 mode 参数的历史入口仍可无重载返回；说明入口保持独立', () => {
  const win = new EventTarget()
  const doc = new EventTarget()
  let reloads = 0
  const routes = []
  win.location = { href: 'https://example.com/lobby.html', reload: () => reloads++ }
  const cleanup = installNavigation(win, doc, 'https://example.com/store.html?mode=full', (route) => routes.push(route))
  win.dispatchEvent(new Event('popstate'))
  assert.equal(reloads, 0)
  assert.equal(routes.length, 1)
  win.location.href = 'https://example.com/'
  win.dispatchEvent(new Event('popstate'))
  assert.equal(reloads, 1)
  cleanup()
})
