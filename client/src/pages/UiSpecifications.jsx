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
  return <>
    <p>面向玩家游戏大厅的 UI 设计、前端开发和评审。规范按大厅、游戏、活动、商城、个人中心分模块，说明视觉层级、布局、交互状态、功能规则及全屏/半屏适配；下载为 Markdown 可独立交接。</p>
    <div className="docs-ui-files">{files.map((file)=><a key={file.name} href={`data:text/markdown;charset=utf-8,${encodeURIComponent(file.content)}`} download={`joyloop-ui-${file.name}.md`}><strong>{file.title}</strong><span>UI 规范 · 功能说明 · 状态与验收</span><small>下载 Markdown</small></a>)}</div>
  </>
}
