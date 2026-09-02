export const businessPages = ['lobby', 'games', 'events', 'store', 'profile']

export function pageFromUrl(value) {
  const url = new URL(value, 'https://joyloop.invalid/')
  const name = url.pathname.split('/').filter(Boolean).at(-1)?.replace(/\.html$/, '')
  if (name === 'docs') return 'docs'
  return businessPages.includes(name) ? name : name === 'index' || !name ? 'welcome' : null
}

export function internalDestination(current, target, click = {}) {
  if (click.defaultPrevented || (click.button ?? 0) !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || click.download || (click.target && click.target !== '_self')) return null
  const from = new URL(current)
  const to = new URL(target, from)
  if (from.origin !== to.origin || !businessPages.includes(pageFromUrl(from)) || !businessPages.includes(pageFromUrl(to))) return null
  // Entry/exit is a separate screen. Business navigation cannot change layout.
  to.searchParams.set('mode', from.searchParams.get('mode') === 'half' ? 'half' : 'full')
  if (from.searchParams.has('lang')) to.searchParams.set('lang', from.searchParams.get('lang'))
  return to.href
}

export function headerBack(page, hasHost) {
  if (page !== 'lobby') return { href: 'lobby.html', label: '返回大厅' }
  return { href: hasHost ? null : 'index.html', label: '退出大厅' }
}

export function installNavigation(win, doc, currentUrl, onNavigate) {
  const update = (action) => {
    win.dispatchEvent(new Event('joyloop:navigate'))
    onNavigate({ url: win.location.href, action })
  }
  const click = (event) => {
    const link = event.target.closest?.('a[href]')
    if (!link) return
    const destination = internalDestination(win.location.href, link.href, {
      defaultPrevented: event.defaultPrevented,
      button: event.button,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      download: link.hasAttribute('download'),
      target: link.target,
    })
    if (!destination) return
    event.preventDefault()
    if (destination !== win.location.href) {
      win.history.pushState(null, '', destination)
    }
    update('push')
  }
  const pop = () => {
    const destination = internalDestination(currentUrl, win.location.href)
    const currentMode =
      new URL(win.location.href).searchParams.get('mode') === 'half'
        ? 'half' : 'full'
    if (!destination || new URL(destination).searchParams.get('mode') !== currentMode) {
      win.location.reload()
      return
    }
    update('pop')
  }
  doc.addEventListener('click', click)
  win.addEventListener('popstate', pop)
  return () => {
    doc.removeEventListener('click', click)
    win.removeEventListener('popstate', pop)
  }
}
