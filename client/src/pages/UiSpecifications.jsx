import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const sources = import.meta.glob('../../../docs/ui/**/*.md', { query: '?raw', import: 'default', eager: true })
const titles = {
  README: '游戏大厅规范阅读入口',
  'player-foundations': '通用布局、交互与适配规范',
  'player-lobby': '大厅', 'player-games': '游戏目录与游戏过程',
  'player-events': '活动中心', 'player-store': '商城', 'player-profile': '个人中心',
}

export default function UiSpecifications() {
  const files = Object.entries(sources).map(([path, content]) => {
    const name = path.split('/').pop().replace(/\.md$/, '')
    return { name, content, title: titles[name] || name }
  }).sort((a, b) => Object.keys(titles).indexOf(a.name) - Object.keys(titles).indexOf(b.name))
  const [selected, setSelected] = useState('README')
  const active = files.find((file) => file.name === selected) || files[0]
  function navigate(event) {
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')]
    const index = tabs.indexOf(document.activeElement)
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    setSelected(files[next].name)
    tabs[next].focus()
  }
  return <>
    <p>直接选择下方页签，阅读玩家游戏大厅的 UI 规范与功能说明。覆盖布局、交互状态、功能规则及全屏/半屏适配。</p>
    <div className="docs-ui-tabs" role="tablist" aria-label="游戏大厅 UI 规范模块" onKeyDown={navigate}>
      {files.map((file) => <button key={file.name} id={`ui-tab-${file.name}`} role="tab" aria-selected={active.name === file.name} aria-controls="ui-spec-panel" tabIndex={active.name === file.name ? 0 : -1} onClick={() => setSelected(file.name)}>{file.title}</button>)}
    </div>
    <section id="ui-spec-panel" className="docs-ui-reader" role="tabpanel" aria-labelledby={`ui-tab-${active.name}`} tabIndex={0}>
      <div className="docs-ui-reader-tools"><span>当前模块：{active.title}</span><a href={`data:text/markdown;charset=utf-8,${encodeURIComponent(active.content)}`} download={`joyloop-ui-${active.name}.md`}>下载本模块 Markdown</a></div>
      <Markdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h3>{children}</h3>,
        h2: ({ children }) => <h4>{children}</h4>,
        h3: ({ children }) => <h5>{children}</h5>,
        table: ({ children }) => <div className="docs-ui-table"><table>{children}</table></div>,
        a: ({ href, children }) => {
          const name = href?.split('/').pop()?.replace(/\.md(?:#.*)?$/, '')
          const target = files.find((file) => file.name === name)
          return target ? <button className="docs-ui-module-link" onClick={() => { setSelected(target.name); document.getElementById(`ui-tab-${target.name}`)?.focus() }}>{children}</button> : <a href={href}>{children}</a>
        },
      }}>{active.content}</Markdown>
    </section>
  </>
}
