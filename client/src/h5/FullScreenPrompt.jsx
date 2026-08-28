import { useLocale } from '../useLocale.js'
import { Icon } from '../icons.jsx'
import './fullScreenPrompt.css'

const modules = {
  tournaments: { title: '赛事', icon: 'trophy' },
  events: { title: '活动中心', icon: 'gift' },
  store: { title: '金币商城', icon: 'store' },
  profile: { title: '我的', icon: 'user' },
}

export default function FullScreenPrompt({ page }) {
  const { t, href } = useLocale()
  const item = modules[page]
  return (
    <section className="full-screen-prompt card">
      <div className="full-screen-prompt-title">
        <span className="feature-icon">
          <Icon name={item.icon} />
        </span>
        <h1>{t(item.title)}</h1>
      </div>
      <p>{t('半屏优先展示游戏，此内容请在全屏查看。')}</p>
      <div className="full-screen-prompt-actions">
        <a className="btn btn-secondary" href={href('lobby.html?mode=half')}>
          {t('返回游戏列表')}
        </a>
        <a className="btn btn-primary" href={href(page + '.html?mode=full')}>
          {t('全屏查看')}
        </a>
      </div>
    </section>
  )
}
