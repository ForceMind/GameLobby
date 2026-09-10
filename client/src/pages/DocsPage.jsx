import { lazy, Suspense, useEffect, useState } from 'react'
import { Icon } from '../icons.jsx'
import { appVersion } from '../version.js'
import { PHASES, phaseOf } from '../data/phases.js'
import './docs.css'

const UiSpecifications = lazy(() => import('./UiSpecifications.jsx'))

const toc = [
  ['overview', '文档说明'],
  ['ui-spec', '游戏大厅 UI规范'],
  ['architecture', '系统结构与职责边界'],
  ['pages', '页面与功能地图'],
  ['global', '全局规范'],
  ['i18n', '多语言与地区'],
  ['games', '游戏中心'],
  ['events', '活动中心'],
  ['store', '商城与明日宝箱'],
  ['wallet', '钱包、流水与战绩'],
  ['social', '赢家榜与中奖弹幕'],
  ['profile', '我的与隐私偏好'],
  ['admin-core', '后台核心机制'],
  ['admin-modules', '后台模块清单'],
  ['api', '接口与数据契约'],
  ['qa', '验收清单'],
]

// 第一列是后台的模块 id，分期一栏由它查 phases.js 得出，文档不再自己记一份期号。
const adminModules = [
  ['dashboard', '运营概览', '按当前环境的生效版本统计游戏可玩情况、待处理事项数量、最近发布', '只读'],
  ['todo', '待处理事项', '认领、跳转到对象处理、填结论关闭、转交他人', '直接生效'],
  ['publish', '发布审核', '查看逐字段配置差异、通过 / 灰度 / 驳回 / 暂停 / 回滚、跳转来源配置', '原型中仅当前生效任务可回滚；灰度为模拟状态'],
  ['audit', '操作日志', '全量操作留痕，含对象模块与变更前后值', '只读'],
  ['games', '游戏管理', '维护全局游戏分类、游戏类型、展示字段、按游戏说明和运行操作；分类通过审核后才可用于游戏编辑', '运行状态、维护公告立即生效；分类、展示字段与游戏说明保存草稿并走审核。分类一期为标签能力，审核依赖仍待定'],
  ['wins', '赢家与动态', '只读核对今日赢家榜、最近中奖与宝箱幸运榜', '不可编辑，管理在风控与内容审核系统'],
  ['players', '玩家管理', '玩家列表、奖励领取记录、月卡权益、宝箱记录四个标签；状态处置需填原因', '直接生效，隐私偏好只读'],
  ['translations', '多语言内容', '按语言维护玩家侧通用文案与游戏说明键，查看覆盖率、待复核和缺失清单，CSV 导入导出', '草稿审核；游戏说明草稿从游戏管理入口保存后，在此提交审核'],
  ['adminUsers', '权限与账号', '后台账号与角色的菜单范围、操作权限、生产环境权限', '直接生效（权限拦截待接入）'],
  ['activities', '活动管理', '按活动类型打开不同的配置弹窗：转盘配奖项概率、签到配奖励梯度、任务配任务列表；共通字段含周期、人群、预算、投放地区', '活动信息立即生效，奖励配置与投放地区走草稿审核'],
  ['checkin', '签到 / 转盘 / 任务', '页面保持只读预览，点「编辑」打开分组标签弹窗；与活动弹窗共享奖励模块', '草稿审核'],
  ['store', '商品与权益', '金币礼包、月度特权卡、明日宝箱报价', '草稿审核'],
  ['orders', '订单管理', '查询与人工处置：取消、退款、标记异常、人工确认', '直接生效，需填原因'],
  ['ledger', '钱包流水', '查询、对账、导出；人工调整以 manual_adjust 记录待财务确认', '仅人工调整可模拟复核；待办关联流水，不改余额'],
  ['versions', '游戏版本发布', '版本记录、上传记录、测试环境、生产环境四个标签的流转', '原型来源状态随审核同步；模拟，无真实部署'],
]

function SectionTitle({ id, eyebrow, title, description }) {
  return <div className="docs-section-title" id={id}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
}

function StatusChip({ children, tone = 'current' }) {
  return <span className={`docs-chip docs-chip-${tone}`}>{children}</span>
}

// 自然语言的功能逻辑：不写字段、不写接口，只讲这件事是怎么运转的。
function Logic({ title = '功能逻辑（自然语言）', children }) {
  return <div className="docs-logic"><span className="docs-logic-tag"><Icon name="eye" />{title}</span><div className="docs-prose">{children}</div></div>
}

function SubHead({ children, note }) {
  return <div className="docs-subhead"><h3>{children}</h3>{note && <p>{note}</p>}</div>
}

// 同一件事在三层各自负责什么，避免"前端自己算了"这类越界。
function Roles({ front, server, admin }) {
  return <div className="docs-roles">
    <div><span>前端负责</span><p>{front}</p></div>
    <div><span>服务端负责</span><p>{server}</p></div>
    <div><span>后台负责</span><p>{admin}</p></div>
  </div>
}

function Fields({ caption, rows }) {
  return <div className="docs-table-wrap"><table className="docs-table">
    <thead><tr><th>字段</th><th>类型 / 取值</th><th>含义与约束</th></tr></thead>
    <tbody>{rows.map(([name, type, meaning]) => <tr key={name}><td><strong>{name}</strong></td><td><code>{type}</code></td><td>{meaning}</td></tr>)}</tbody>
  </table>{caption && <p className="docs-table-caption">{caption}</p>}</div>
}

function States({ items }) {
  return <div className="docs-states">{items.map(([state, meaning, next]) => <div key={state}>
    <strong>{state}</strong><p>{meaning}</p><span>{next}</span>
  </div>)}</div>
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const handleSectionNav = (event, id) => {
    event.preventDefault()
    const page = document.querySelector('.docs-page')
    const target = document.getElementById(id)
    if (!page || !target) return
    const top = target.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - (page.querySelector('.docs-header')?.offsetHeight || 0) - 20
    page.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
    setActiveSection(id)
  }
  useEffect(() => {
    const page = document.querySelector('.docs-page')
    if (!page) return undefined
    const updateActiveSection = () => {
      const marker = page.getBoundingClientRect().top + 130
      let current = toc[0][0]
      toc.forEach(([id]) => {
        const target = document.getElementById(id)
        if (target && target.getBoundingClientRect().top <= marker) current = id
      })
      setActiveSection(current)
    }
    const initialHash = decodeURIComponent(window.location.hash.slice(1))
    const frame = window.requestAnimationFrame(() => {
      if (initialHash && toc.some(([id]) => id === initialHash)) {
        const target = document.getElementById(initialHash)
        const top = target.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - (page.querySelector('.docs-header')?.offsetHeight || 0) - 20
        page.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
        setActiveSection(initialHash)
      } else updateActiveSection()
    })
    page.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.cancelAnimationFrame(frame)
      page.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])
  return (
    <main className="docs-page">
      <header className="docs-header">
        <div className="docs-header-inner">
          <a className="docs-brand" href="index.html" aria-label="返回 Joyloop 首页"><span className="brand-mark" aria-hidden="true"><span /></span><span><strong>Joyloop</strong><small>v{appVersion}</small></span></a>
          <a className="btn btn-secondary docs-home-link" href="index.html"><Icon name="chevronLeft" />返回首页</a>
        </div>
      </header>
      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="文档目录">
          <div className="docs-sidebar-card">
            <span className="eyebrow">PRODUCT · ENGINEERING</span>
            <strong>目录</strong>
            <nav aria-label="文档目录">{toc.map(([id, label]) => <a className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => handleSectionNav(event, id)} key={id}>{label}</a>)}</nav>
          </div>
        </aside>
        <article className="docs-content">
          <section className="docs-hero">
            <StatusChip>{appVersion} 当前基线</StatusChip>
            <h1>游戏大厅产品与技术说明</h1>
            <p>面向产品、前端、后端、测试和运营的同一份说明。每个功能先用自然语言讲清楚它是怎么运转的，再给出字段、状态和接口约定，前后端可以据此各自实现而不必互相猜。当前版本为 lobby-admin-lite-v1：前台五页（大厅、游戏、活动、商城、我的）加运营后台；赛事、直播、家族与派对不在本版本范围。</p>
            <div className="docs-hero-meta"><span><Icon name="calendar" />更新于 2026-09-10</span><span><Icon name="users" />适用角色：UI / 产品 / 前端 / 后端 / 测试 / 运营</span><span><Icon name="shield" />当前形态：静态前端原型 + 后台原型</span></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="overview" eyebrow="01 · READ FIRST" title="文档说明" description="先分清哪些已经做出来了，哪些是给服务端的实现要求。" />
            <div className="docs-callout"><Icon name="eye" /><div><strong>三种状态标记</strong><p><StatusChip>已实现</StatusChip> 在当前原型里可以点、可以操作；<StatusChip tone="planned">后台配置</StatusChip> 由运营后台产生，前台只消费结果；<StatusChip tone="server">待接入</StatusChip> 需要真实服务端、宿主 App 或支付通道，原型里是本地模拟。</p><p><a className="docs-inline-link" href="admin.html"><Icon name="gauge" />打开运营后台原型 <Icon name="chevronRight" /></a></p></div></div>
            <Logic title="这份文档怎么读">
              <p>如果你是产品或运营，只读每一节开头的「功能逻辑」段落就够了，其中说明用户操作、业务规则和处理结果。</p>
              <p>如果你是前端，除了功能逻辑，重点看「职责划分」里属于前端的那一列、字段表里的展示字段，以及状态机——页面需要为每一个状态准备一种画面，包括加载、空、失败和过期。</p>
              <p>如果你是后端，重点看职责划分里服务端那一列、接口契约一节，以及每个功能中标注了「由服务端决定」的规则。凡是涉及钱、概率、资格和结算的判断，一律由服务端做，前端不参与计算，也不允许前端把「请求已发出」显示成「已经成功」。</p>
              <p>后台草稿、审核与回滚历史刷新即重置。分类、游戏展示字段和游戏说明翻译的已发布内容是例外：仅在 catalogPreview=1 的浏览器预览中可从本地存储恢复；真实宿主和服务端忽略。玩家语言等偏好也可保存在本地存储。当前原型不处理真实资产，服务端能力尚未接入。</p>
            </Logic>
          </section>

          <section className="docs-section">
            <SectionTitle id="ui-spec" eyebrow="UI · MODULE SPECIFICATIONS" title="游戏大厅 UI规范与功能说明" description="面向玩家界面，按五个业务模块交接设计与功能规则。" />
            <Suspense fallback={<p>正在加载规范文件…</p>}><UiSpecifications /></Suspense>
          </section>

          <section className="docs-section">
            <SectionTitle id="architecture" eyebrow="02 · ARCHITECTURE" title="系统结构与职责边界" description="宿主 App、前端页面、服务端和运营后台各自管什么。" />
            <Logic>
              <p>这套大厅由四个部分组成。最外层是宿主 App，也就是把大厅嵌进去的那个应用，它掌握用户身份、真实钱包和支付能力，也负责真正把游戏拉起来。中间是这套前端页面，它是一个独立的网页应用，负责所有画面、交互和状态提示。再往后是服务端，它是所有事实的唯一来源：余额是多少、今天还能转几次、这一把中了多少、宝箱能不能买，全部由它说了算。最后是运营后台，它不直接服务玩家，而是生产配置——奖励发多少、概率怎么分、游戏上不上架，这些配置经过审核发布后，才会被服务端拿去执行。</p>
              <p>四者之间有一条不能越过的线：前端永远不生产事实。前端可以展示"正在处理"，但不能自己判定"已经到账"；可以展示奖励数字，但那个数字必须是服务端返回的。如果宿主或服务端没有响应，前端要如实显示未连接或失败，并给出重试，而不是假装成功。这条线看起来严格，但它决定了这套产品能不能接真钱。</p>
              <p>运营后台和服务端之间也有一条线：后台里改的是草稿，草稿必须经过发布审核才会变成生效版本，生效版本才是服务端执行的依据。这意味着运营在后台点错一个数字，不会立刻影响线上，要等有人审核通过；而一旦发现发布后有问题，可以回滚到上一个生效版本。</p>
            </Logic>
            <SubHead note="每一层的边界，实现时按这个划分对齐。">四层职责</SubHead>
            <div className="docs-table-wrap"><table className="docs-table">
              <thead><tr><th>层</th><th>负责</th><th>不负责</th><th>失联时的表现</th></tr></thead>
              <tbody>
                <tr><td><strong>宿主 App</strong></td><td>用户身份、真实钱包、应用内支付、拉起游戏、控制大厅全屏或半屏</td><td>业务规则、活动配置、奖励计算</td><td>前端显示"原型预览 / 宿主未连接"，购买类按钮不显示成功</td></tr>
                <tr><td><strong>前端页面</strong></td><td>布局、筛选、弹窗、加载与失败提示、把服务端结果翻译成画面、多语言</td><td>余额、概率、开奖、扣款、资格判断</td><td>—</td></tr>
                <tr><td><strong>服务端</strong></td><td>账号、余额、钱包流水、活动进度与资格、开奖、结算、订单、幂等</td><td>页面布局与文案排版</td><td>前端保留当前页面并提供重试，不回退到本地假数据</td></tr>
                <tr><td><strong>运营后台</strong></td><td>生产配置草稿、审核发布、回滚、玩家与订单的人工处置、全量操作留痕</td><td>直接改写线上生效配置（必须经审核）</td><td>—</td></tr>
              </tbody>
            </table></div>
            <SubHead>数据来源边界</SubHead>
            <div className="docs-rule-list docs-rule-list-wide">
              <div><span>随版本发布的静态内容</span><strong>页面文案、导航、游戏基础信息与封面、游戏说明参数，来自打包进前端的 JSON</strong></div>
              <div><span>随时间变化的动态内容</span><strong>余额、在线人数、活动进度、剩余次数、订单、流水、宝箱状态，来自服务端接口</strong></div>
              <div><span>运营可改的配置</span><strong>奖励数值、概率、价格、上下架、推荐位，来自后台已发布的生效版本</strong></div>
            </div>
          </section>

          <section className="docs-section">
            <SectionTitle id="pages" eyebrow="03 · SITE MAP" title="页面与功能地图" description="前台固定五个主导航，页面职责不重叠。" />
            <div className="docs-table-wrap"><table className="docs-table">
              <thead><tr><th>页面</th><th>玩家在这里做什么</th><th>关键数据来源</th><th>半屏模式</th></tr></thead>
              <tbody>
                <tr><td><strong>大厅 lobby</strong></td><td>看最近在玩、热门游戏、今日赢家榜和最近中奖，进入各功能入口</td><td>游戏目录（静态）+ 赢家事件（服务端）</td><td>游戏优先，次要入口收起</td></tr>
                <tr><td><strong>游戏 games</strong></td><td>按分类筛选游戏、查看游戏说明、启动游戏</td><td>游戏目录与状态（后台配置 + 服务端可用性）</td><td>保留完整目录</td></tr>
                <tr><td><strong>活动 events</strong></td><td>七日签到、幸运转盘、每日任务</td><td>活动配置（后台）+ 进度与领取（服务端）</td><td>展示三项核心活动</td></tr>
                <tr><td><strong>商城 store</strong></td><td>买金币礼包、开通月度特权卡、买明日宝箱</td><td>商品配置（后台）+ 订单与结算（服务端 + 宿主支付）</td><td>保留权益与礼包</td></tr>
                <tr><td><strong>我的 profile</strong></td><td>看资料与资产、查奖励与消费、查最近战绩、设置隐私偏好</td><td>账号与钱包流水（服务端）</td><td>次要内容收起</td></tr>
                <tr><td><strong>说明 docs</strong></td><td>本文档，独立于业务导航</td><td>随版本发布</td><td>不进入业务内容</td></tr>
                <tr><td><strong>后台 admin</strong></td><td>运营配置、审核发布、玩家与订单处置</td><td>后台自身数据（原型为内存态）</td><td>不适用</td></tr>
              </tbody>
            </table></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="global" eyebrow="04 · GLOBAL RULES" title="全局规范" description="所有页面共享的导航、语言、状态与幂等约定。" />
            <Logic>
              <p>五个业务页共用同一个外框：顶部是品牌、余额和主导航，页面之间切换时不整页刷新，语言、全屏或半屏的选择以及滚动位置都会保留。这样玩家在活动页看到一半跳去商城再回来，不会发现自己回到了顶部或者语言变了。</p>
              <p>语言不是玩家在设置里选的，而是由宿主或链接参数决定的，默认中文。所有给玩家看的文字都必须有对应的翻译键，中英文必须成对存在，缺一个在开发环境就会报错。金额、日期和数字由前端按当前语言格式化，服务端只返回数值和时间戳，不返回拼好的字符串，更不返回 HTML。</p>
              <p>任何会改变资产的操作——买东西、领奖励、开宝箱——都必须带一个业务唯一键。同一个键重复提交，服务端只处理一次，返回同样的结果。这样网络抖动导致的重复点击不会重复扣钱或重复发奖。前端在等待响应期间必须锁住按钮并显示处理中，响应回来之前不允许显示任何成功文案。</p>
              <p>每个页面都要为五种情况准备画面：正在加载、加载成功但没有数据、加载失败、没有权限或不在开放地区、以及数据已过期需要刷新。失败时保留玩家当前所在的位置并给出重试，不要把人踢回首页。</p>
            </Logic>
            <div className="docs-rule-list">
              <div><span>加载</span><strong>骨架屏或进度，按钮锁定防重复</strong></div>
              <div><span>空数据</span><strong>说明原因并给出下一步动作</strong></div>
              <div><span>失败</span><strong>停留原页 + 明确原因 + 重试</strong></div>
              <div><span>过期</span><strong>提示刷新，不展示陈旧结果</strong></div>
            </div>
            <SubHead note="宿主未接入时，这些动作会返回未连接，前端据此显示原型预览而不是成功。">宿主桥接约定</SubHead>
            <Fields rows={[
              ['action', "'setDisplayMode' | 'closeLobby' | 'purchase'", '当前仅支持这三种动作，其他动作直接返回失败并带 unsupported-action。'],
              ['requestId', 'string', '每次请求唯一，用于把响应和请求对上；未指定时前端自动生成。'],
              ['payload.sku', 'string', '购买动作必填，商品唯一标识。'],
              ['payload.priceCents', 'integer 大于 0', '购买动作必填，以美分为单位的整数，避免浮点误差。'],
              ['payload.currency', "'USD'", '购买动作必填，当前仅支持美元。'],
              ['返回 status', "'completed' | 'cancelled' | 'failed' | 'unavailable'", '只有 completed 才算成功；unavailable 表示宿主不存在，按原型预览处理。'],
              ['超时', '12 秒', '超时按失败处理并返回 timeout，不得当作成功。'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="i18n" eyebrow="05 · LANGUAGES & REGIONS" title="多语言与地区" description="玩家看到什么语言、能看到哪些内容，由这两套机制决定。" />
            <Logic title="多语言 · 功能逻辑">
              <p>玩家端注册 24 个语种。玩家看到哪一种，按这个顺序决定：链接里带的语言参数最优先，其次是宿主 App 告诉我们的语言，再次是玩家上次自己选的，然后是浏览器语言，都没有就用简体中文。玩家可在个人页「设置」中选择语言；宿主传入的语言须属于支持的语种。每种语言都用它自己的文字列出。</p>
              <p>简体中文是默认原文，英文是完整兜底基线；其余注册语种的实际可用文案取决于目录覆盖率，注册不等于已完成翻译。所有给玩家看的文字都放在按语言分开的文案表里，每条文案有稳定标识；中文原文更新后，已有的其他语言译文进入待复核状态。</p>
              <p>某种语言缺翻译时，玩家看到英文，而不是空白或一串技术标识；每一次这样的回退都会被记录下来，开发环境直接报警告，生产环境可以接到监控。这意味着"某个语言少了一句"是能被发现的问题，而不是悄悄上线的缺陷。</p>
              <p>带变量的文案有一条硬规则：比如"购买 {'{coins}'} 金币"里的那个变量，每种语言的译文都必须保留它。译文里少了或写错了，后台保存时直接拦下——否则玩家会看到一句缺了数字的话。</p>
              <p>阿拉伯语和波斯语是从右往左书写的，整个页面布局会随之镜像。数字和日期按各语言的习惯格式化，但金额固定用拉丁数字，因为它要和宿主 App 显示的余额对得上。</p>
              <p>需要说明的是：运营后台本身是中文界面，不做多语言。后台里管理的是玩家看到的文字，不是后台自己的按钮。</p>
            </Logic>
            <Roles
              front="按解析出的语言渲染全部文案；缺翻译时回退英文并上报；RTL 语言镜像布局；数字与日期按语言格式化。"
              server="通过宿主上下文提供玩家的语言与所在国家；返回文案标识和数值，不返回拼好的句子。"
              admin="按语言维护玩家侧文案，显示每种语言的覆盖率与缺失清单，支持 CSV 批量导入导出；改动走草稿与发布审核。"
            />
            <Logic title="地区范围 · 功能逻辑">
              <p>一款游戏或一个活动，可以选择全球开放，也可以指定在哪些国家和地区开放。选择方式是先选大洲、再细选国家——想开放整个亚洲就勾选亚洲，想"整个亚洲除了某两个市场"，就先勾选亚洲再取消那两个国家。</p>
              <p>这是白名单不是黑名单：没有被勾选的国家一律不开放。这个方向很重要——如果用黑名单，一个没人想到过的新市场会默认开放，而在受监管的产品里，默认应该是关闭。所以后台会拦截"选了指定国家但一个都没勾"这种配置，因为那等于所有玩家都看不到。</p>
              <p>玩家所在的国家由宿主 App 告知，大厅不自己猜。不在开放范围内的游戏，直接不出现在列表里，而不是显示成灰色的不可点——一款不能提供给这个玩家的游戏，不应该先展示给他看。如果宿主没有告知国家，被限定了地区的游戏和活动一律按不开放处理（fail-closed）：未知位置不能当作默认放行，否则白名单形同虚设；没有设地区限制的内容不受影响，正常展示。</p>
              <p>国家名字不需要翻译：系统里只存两位国家代码和它属于哪个洲，名字由浏览器按当前语言生成，所以新增一种语言不需要补 233 个国家的译名。</p>
            </Logic>
            <Fields caption="地区与「适用人群」是两个独立维度：前者决定谁能看到，后者决定给谁投放。" rows={[
              ['mode', "'all' | 'custom'", "all 为全球开放；custom 为白名单，只有 countries 里的国家可见。"],
              ['countries', 'string[]', 'ISO 3166-1 alpha-2 代码列表，去重并排序。mode 为 custom 时不能为空。'],
              ['玩家国家来源', '宿主上下文', '两位国家代码，由宿主 App 决定；大厅不猜测玩家位置。缺失时，设了地区限制的内容按不开放处理。'],
              ['不可见时的表现', '不出现在列表', '不展示为「不可用」，避免推荐一款无法提供的游戏。'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="games" eyebrow="06 · GAMES" title="游戏中心" description="游戏能不能玩，由状态决定；状态由后台配置和服务端可用性共同决定。" />
            <Logic>
              <p>游戏目录由全局分类菜单和游戏自身类型共同组成。分类是可运营的标签，字段为 id、24 语标签、启用状态和排序权重；玩家端固定保留“全部”和“热门”，两者不是可编辑分类。游戏类型固定为 slots、fishing、casual、other，决定详情展示属性，不控制游戏会话，不会因分类调整而改变。玩家可按已发布且启用的分类筛选；每张卡片显示封面、名称、分类、在线人数、热度和角标。点开卡片显示按当前语言回退英文的简介、可选玩法和可选规则；内容只按纯文本渲染。</p>
              <p>但不是每个游戏都能点。一款游戏有四种状态：正常可玩、维护中、即将上线、暂不可用。维护中通常是临时的，运营会在后台填一段维护公告，玩家点进去看到的就是这段话，而不是一个干巴巴的"不可用"。即将上线的游戏会显示预计上线时间。暂不可用一般用于地区限制或长期下架。只有正常可玩的游戏，开始按钮才是可点的。</p>
              <p>玩家点了开始游戏之后，前端并不自己启动任何东西，而是通过宿主把请求递出去。这期间界面显示加载，按钮锁住，防止连点。宿主确认可以启动，画面才切走；宿主拒绝或超时，玩家会看到失败原因和重试按钮，人还停在原来的位置。这个流程的关键是：前端不能因为"我把请求发出去了"就认为游戏启动成功了。</p>
              <p>桌面原型的加载和游玩页面始终留在模拟手机内，不覆盖电脑整个窗口。18:9 与 21:9 档位共用可用高度，较长比例显示得更窄；自动档按内容适配。当前16px小圆角是通用示意，不代表iPhone或其他具体机型。页头、底栏、弹窗和游戏控件共用安全区，短窗口中游戏内容可滚动，关闭按钮保持可见。真实设备继续使用宿主视口和系统安全区。</p>
              <p>分类定义、游戏展示字段和游戏说明均为草稿审核内容。新分类审核通过后，游戏编辑才可选择；已被游戏关联的分类，须先迁移这些游戏的关联并完成对应审核，之后才可停用或删除。分类一期仅覆盖标签，分类审核依赖仍待定。游戏排序和热门推荐同样走审核；但切换维护状态属于紧急操作，保存后立即生效。游戏字段、状态、地区和门槛使用同一套校验入口；缺必填项、非法范围或空白名单不能保存。</p>
            </Logic>
            <Roles
              front="按已发布分类和游戏类型渲染目录与筛选，按状态决定按钮是否可点，展示纯文本游戏说明，发起启动请求并处理加载、失败与维护公告。"
              server="返回每款游戏当前是否真的可启动、实时在线人数、地区是否允许，以及启动会话本身；忽略浏览器预览参数和本地草稿。"
              admin="维护全局分类、游戏类型、角标、封面、排序、热门推荐、运行状态与维护公告、详情展示属性、地区白名单和进入门槛；从游戏说明入口维护简介、玩法、规则的 24 语草稿，再到多语言内容提交审核。"
            />
            <SubHead>游戏字段</SubHead>
            <Fields caption="分类、游戏类型和展示属性互不替代。Slots 的四项属性只用于详情说明；minBet、paylines、volatility 尚未接入，不提供编辑入口，也不控制游戏引擎。" rows={[
              ['id', 'string', '游戏唯一标识，跳转、埋点和启动都用它，接入后不可更改。'],
              ['name', 'string', '游戏显示名。'],
              ['tags', 'string[]', '已审核且启用的全局分类 id；用于玩家筛选与卡片分类显示。all、popular 是系统固定筛选，不得写入此字段。'],
              ['gameType', "'slots' | 'fishing' | 'casual' | 'other'", '独立游戏类型；不随 tags 改动，决定详情展示属性，不控制游戏会话。'],
              ['status', "'ready' | 'maintenance' | 'upcoming' | 'unavailable'", '运行状态，决定开始按钮是否可点。'],
              ['maintenanceNote', 'string', '维护公告文案，仅在维护中状态展示；后台校验为维护中时必填。'],
              ['launchAt', 'string', '预计上线时间，仅在即将上线状态展示；后台校验为该状态时必填。'],
              ['descriptionKey', 'string', '简介键；默认 games.desc.{gameId}。简介必须有简体中文和英文。'],
              ['games.instructions.{gameId}', 'translation entry', '玩法键；允许整段缺省，任一语言有内容时必须有简体中文和英文。'],
              ['games.rules.{gameId}', 'translation entry', '规则键；允许整段缺省，任一语言有内容时必须有简体中文和英文。'],
              ['region', "{ mode: 'all' | 'custom', countries: string[] }", '地理范围。白名单：mode 为 custom 时，只有 countries 里的 ISO 3166-1 alpha-2 代码能看到这款游戏；没列出的一律关闭。空的 custom 列表会被后台拦截。'],
              ['players', 'string', '在线人数，实时数据；无数据时显示“暂无数据”，不得用静态数字冒充。'],
              ['heat', 'number 0–100', '热度值，用于排序参考与卡片展示。'],
              ['popular', 'boolean', '是否进入大厅热门推荐位；不是分类。'],
              ['sortWeight', 'number 大于 0', '排序权重，数值越小越靠前；后台拖拽排序会覆盖该顺序。'],
              ['badges', 'string[]', '卡片角标，例如 JACKPOT。'],
              ['cover', 'string', '封面资源文件名；资源上传服务待接入。'],
              ['winRate / rtp / maxMultiplier', 'string', 'Slots 详情展示属性；不参与引擎参数或结算控制。'],
              ['winRangeMin / winRangeMax', 'number 不小于 0', '中奖金额展示区间，下限不大于上限；按当前语言格式化数值。'],
            ]} />
            <SubHead>游戏状态机</SubHead>
            <States items={[
              ['正常可玩', '目录可见，开始按钮可点。', '可切到维护中、即将上线、暂不可用'],
              ['维护中', '目录可见但不可进入，展示维护公告。', '恢复运行后回到正常可玩，并自动关闭对应待办'],
              ['即将上线', '目录可见，展示预计上线时间，不可进入。', '到期后由运营切到正常可玩'],
              ['暂不可用', '地区限制或长期下架，不可进入。', '由运营恢复'],
            ]} />

            <SubHead note="第一期已实现；第二、三期保留为设计约定，见本节末尾的分期。">准入规则与进入门槛</SubHead>
            <Logic title="门槛怎么运转">
              <p>同一款游戏不是对所有人一样开放的。运营需要能说"这款只给财富等级 5 以上的人玩""这款只给家族成员玩""这款要账户里至少有一千金币才能进"。这些条件挂在游戏本身上，不额外做一层"规则"记录——后台里每款游戏已经有自己的配置、草稿和审核流程，门槛就是这份配置里的几个字段，跟着同一次审核一起生效、一起回滚。</p>
              <p>门槛有两类，前台表现必须不一样，这是关键的一条。地区不满足的游戏直接不出现在列表里，因为那是合规问题——一款在这个国家不能提供的游戏，连看到都不应该。而等级、余额、家族这类门槛不满足时，游戏仍然出现在列表里，只是卡片显示为锁定并写清楚差什么（"需要财富等级 5，当前 3"）。因为这类门槛的目的是引导玩家去达成，藏起来就失去了意义。</p>
              <p>判断门槛需要知道玩家的等级、余额、性别、家族这些信息，这些一律由宿主 App 通过上下文告知，大厅不自己推断。宿主没有告知的字段按不满足处理，和地区一致：未知不能当作放行，否则门槛形同虚设。后台进入门槛分组会提示：启用的门槛会拦住未提供对应字段的玩家；若宿主全部尚未接入，这条配置就会挡住所有人。当前原型不自动探测各宿主的接入能力。</p>
              <p>第二期计划加入白名单作为门槛的例外通道，用于内部测试和 VIP 放行：名单里的玩家 ID 跳过全部等级与家族门槛。但白名单不能跳过地区限制——地区是合规边界，不接受例外。第一期尚未启用白名单。</p>
              <p>当前静态原型的草稿、审核和回滚历史刷新即重置。分类、游戏展示字段和游戏说明翻译的已发布内容是例外：仅在 catalogPreview=1 的浏览器预览中可从本地存储恢复；门槛、运行状态及其他配置不通过此机制跨页同步，真实宿主和服务端也不读取这些本地数据。示例中 Golden Pharaoh 需要财富等级 5，演示账号为 3，因此锁定；Fish Hunter 为家族专属，演示账号有家族，可以进入。</p>
            </Logic>
            <Fields caption="门槛字段填 0 或留空即为不限。性别两项都勾选等同于不限。" rows={[
              ['wealthLevel', 'number ≥ 0', '财富等级门槛，玩家的财富等级需大于等于该值。'],
              ['charmLevel', 'number ≥ 0', '魅力等级门槛，规则同上。'],
              ['minBalance', 'number ≥ 0', '账户余额门槛，单位金币，玩家余额需大于等于该值。'],
              ['playLevel', 'number ≥ 0', '可玩等级门槛，对应玩家账号等级。'],
              ['genders', "('male' | 'female')[]", '允许的性别；空数组视为配置错误，后台拦截。'],
              ['familyOnly', 'boolean', '是否家族专属；为真时只有有家族归属的玩家可进入。'],
              ['whitelist', 'string[]', '白名单玩家 ID，跳过以上全部门槛，但不跳过地区限制。'],
              ['promoTag', "'none' | 'club' | 'hot' | 'new'", '运营标签，卡片上的运营位标记。与「分类标签」（决定筛选归属）和「角标」（自由文本，如 JACKPOT）是三个不同的东西。'],
              ['gameLocales', 'string[]', '这款游戏本身支持的语言，与大厅的 24 语言文案目录无关——大厅界面翻译齐全不代表游戏内也有该语言。玩家语言不在其中时，游戏按其默认语言启动。'],
              ['scenes', 'string[]', '允许展示这款游戏的宿主场景：游戏中心、家族厅、家族群、家族主页、私聊、视频派对、单人直播间。'],
              ['launchHalfUrl / launchFullUrl', 'string', '半屏与全屏两种展示模式各自的启动地址，交给宿主拉起。'],
              ['preDelistAt', 'string', '预下架时间；到点自动切为暂不可用。对应后台列表里的「开启预下架 / 取消预下架」。'],
            ]} />
            <SubHead>宿主上下文需要补充的字段</SubHead>
            <Fields caption="现有契约已包含 account.id / name / avatar / level、wallet.coins / gems、locale、country。第一期新增下列账号字段；scene 待第二期。准入字段显式非法时清除旧资格，同账号省略时保留；familyId: null 用于退出家族，账号 ID 改变时清空旧账号及余额。" rows={[
              ['account.gender', "'male' | 'female'", '玩家性别，用于性别门槛。'],
              ['account.wealthLevel', 'integer ≥ 0', '玩家财富等级。'],
              ['account.charmLevel', 'integer ≥ 0', '玩家魅力等级。'],
              ['account.familyId', 'string', '玩家所属家族标识；无家族时不传。'],
              ['scene', 'string', '大厅当前被嵌在宿主的哪个场景，用于展示场景过滤；缺失时按「游戏中心」处理。'],
            ]} />
            <SubHead>实现分期</SubHead>
            <States items={[
              ['第一期', '财富等级、魅力等级、账户余额、可玩等级、性别、是否家族专属、运营标签，以及卡片锁定态与启动拦截。', '已实现 · v0.3.2'],
              ['第二期', '游戏支持语言、展示场景、白名单。', '依赖宿主补齐场景与家族字段'],
              ['第三期', '半屏／全屏启动地址、预下架时间。', '依赖宿主启动协议与定时任务'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="events" eyebrow="07 · EVENTS" title="活动中心" description="三个活动：七日签到、幸运转盘、每日任务。" />
            <Logic title="七日签到 · 功能逻辑">
              <p>签到是最简单的一档福利。一个周期七天，每天有一份奖励，通常是金币，有时带宝石，最后一天是明显更大的一份大奖。玩家每天进来点一次领取，就拿走当天那份。</p>
              <p>关键规则有三条。第一，按服务端所在时区的自然日刷新，不看玩家手机的时区，这样跨时区的玩家不会因为改设备时间多领一次。第二，不支持补签——漏掉的那天就是漏掉了，界面上会标成漏签，但不提供任何补领入口。第三，领取接口是幂等的，同一天重复提交只发一次奖。</p>
              <p>七天的奖励数值由运营在后台配，可以每期不一样。后台会强制校验：必须且只能有一天标记为大奖，而且必须是最后一天；任何一天的奖励都不能是负数。改完的数值先进草稿，要审核通过才会替换线上生效的那一版。</p>
            </Logic>
            <Fields rows={[
              ['day', 'string', '第几天的标签，例如 D1。'],
              ['coins / gems', 'number 不小于 0', '当天发放的金币与宝石数量。'],
              ['grand', 'boolean', '是否为大奖日；后台校验必须且只能最后一天为 true。'],
              ['state', "'claimed' | 'missed' | 'today' | 'locked'", '玩家在当前周期的进度，由服务端返回，不是配置。'],
            ]} />
            <Logic title="幸运转盘 · 功能逻辑">
              <p>转盘固定八格，每格是一份奖励，可能是金币、宝石，也可能是一次额外的免费旋转。玩家每天有固定次数的免费机会，默认三次，用完就没有了，第二天恢复。</p>
              <p>最重要的一点：开奖结果由服务端决定，浏览器不做任何随机。前端点下去之后是把请求发出去，服务端算出中了哪一格并记录下来，前端再把这个结果转成转盘停在哪一格的动画。这么做的原因是，如果让前端随机，任何人打开开发者工具都能改结果。也正因如此，如果玩家在转盘转到一半时断网或退出，结果并不会丢——它已经被服务端记下来了，玩家可以在钱包流水里查到。</p>
              <p>八格的奖励和概率由运营在后台配。后台强制校验概率必须是 0 到 100 的整数，且八格加起来正好等于 100%，差一个百分点都不给保存。每次保存会在生效版本号上加一，形成一个新的待审核版本，审核通过后才替换线上；出问题可以回滚到上一版。</p>
            </Logic>
            <Fields rows={[
              ['kind', "'coins' | 'gems' | 'freeSpin'", '奖励类型。'],
              ['amount', 'number 大于 0', '奖励数量；freeSpin 时表示额外赠送的旋转次数。'],
              ['probability', 'integer 0–100', '中奖概率，八格之和必须等于 100。'],
              ['freeSpins', 'integer 不小于 0', '每日免费次数，默认 3。'],
              ['version', 'number', '配置版本号，保存草稿时在生效版本上加一，用于追溯与回滚。'],
            ]} />
            <Logic title="每日任务 · 功能逻辑">
              <p>任务是"做某件事达到多少次，就能领一份奖励"。默认三个任务，比如累计旋转一百次、完成五局休闲游戏。每个任务显示当前进度和目标，达成后领取按钮才可点。</p>
              <p>进度不是前端数的，而是服务端根据玩家产生的事件累计的。这点很重要：玩家可能在别的设备上玩，也可能在宿主 App 的其他地方玩，只有服务端能汇总完整。前端拿到的是一个当前进度数字，负责画进度条。</p>
              <p>领取同样要幂等键，避免重复发奖。任务过期之后只能查看，不能再改目标或奖励，也不能补领。运营可以在后台新增、下线任务，改目标值和奖励，同样走草稿和审核。后台还会对照一个基线数字提醒：如果生效中的任务数量和前台预期的数量不一致，会显示警告，避免线上多出或少掉一个任务格子。</p>
            </Logic>
            <Fields rows={[
              ['id', 'string', '任务唯一标识，领取幂等键的一部分。'],
              ['name', 'string', '任务名称，后台校验不能为空。'],
              ['event', 'string', '统计哪种事件，例如旋转次数、休闲游戏局数。'],
              ['target', 'integer 不小于 1', '目标值。'],
              ['current', 'number', '当前进度，由服务端累计。'],
              ['coinReward / gemReward', 'number 不小于 0', '完成后的奖励。'],
              ['status', "'生效中' | '已下线' | '已过期'", '任务定义的状态；已过期不可编辑。'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="store" eyebrow="08 · STORE" title="商城与明日宝箱" description="三类商品，三条不同的支付与结算路径。" />
            <Logic title="金币礼包与月度特权卡 · 功能逻辑">
              <p>金币礼包是最直接的商品：花真钱买一笔金币，有几档可选，某些档位带折扣和赠送宝石，其中一档会被标为推荐。价格按固定汇率从金币数量换算，一美元对应一万金币，再乘上折扣，所以运营只需要配金币数和折扣，售价自动算出来，不会出现两处数字对不上的情况。</p>
              <p>月度特权卡不是一次性到账，而是买了之后三十天内每天可以领一份奖励，默认每天两千金币加一颗宝石。有两个容易被忽略的规则：它不自动续费，到期就结束；当天没领就是没领，不补发。所以界面上必须清楚显示今天领没领、还剩多少天。</p>
              <p>这两类商品都走宿主的支付通道。前端把商品标识和以美分为单位的价格递给宿主，宿主唤起真实支付，然后返回成功、取消或失败。宿主没接入的时候，前端只能走到确认预览这一步，绝对不能显示支付成功。订单状态从待支付开始，经过处理中到已支付；已支付之后还可能进入退款处理中直至已退款；任何一步出错都会落到异常状态，需要后台人工介入并留下记录。</p>
            </Logic>
            <Fields rows={[
              ['coins', 'integer 大于 0', '礼包金币数量。'],
              ['discountPercent', 'number 0–90', '折扣百分比，后台校验不得超过 90。'],
              ['gemBonus', 'number 不小于 0', '额外赠送的宝石。'],
              ['售价', '自动计算', '按 1 美元 = 10,000 金币换算后再打折，不单独配置。'],
              ['monthlyPass.priceUsdCents', 'integer 大于 0', '月卡价格，美分。'],
              ['monthlyPass.validDays', 'integer 大于 0', '有效天数，默认 30。'],
              ['monthlyPass.dailyCoins / dailyGems', 'integer 大于 0', '每日可领取的奖励，需玩家主动领取，当日不领不补。'],
            ]} />
            <Logic title="明日宝箱 · 功能逻辑">
              <p>明日宝箱是这一版里规则最绕的一个，值得完整讲一遍。它的设计意图是给玩家一个"今天玩过、明天有惊喜"的回访理由。</p>
              <p>流程是这样的：玩家今天必须先完成至少一局有效游戏，才获得购买资格。有了资格，就可以花五百金币买一个宝箱，每个业务日只能买一个。买下来之后宝箱不能马上开，要等到第二天零点才解锁，解锁后有二十四小时的时间去开，过了就作废。开箱时服务端算出这次给多少金币，可能很多，也可能是零——零金币是合法结果，不是错误，界面要能正常表达而不是显示异常。</p>
              <p>这里有两个技术上必须做对的地方。一是幂等：购买用"业务日"作为唯一键，开箱用"宝箱编号"作为唯一键，重复提交不会重复扣钱或重复发奖。二是报价版本：宝箱的价格和奖励上限带一个版本号，如果运营在后台改了价格，旧版本号就失效了；玩家如果开着老页面去买，服务端会拒绝并要求刷新，而不是按旧价格成交。</p>
              <p>还有一个容易被忽略的点：昨天买的还没开的宝箱，和今天新买的宝箱，是可以同时存在的。所以界面要能同时展示多个宝箱，各自处于不同状态。业务日的判断以服务端时区为准，不看设备时间。</p>
            </Logic>
            <div className="docs-flow">
              <div><b>1</b><strong>未获得资格</strong><span>今天还没完成有效游戏，引导去玩一局</span></div><i>→</i>
              <div><b>2</b><strong>可购买</strong><span>展示价格、奖励上限，每业务日限购一个</span></div><i>→</i>
              <div><b>3</b><strong>等待解锁</strong><span>次日零点解锁，展示倒计时</span></div><i>→</i>
              <div><b>4</b><strong>可开启</strong><span>解锁后 24 小时内开箱，结果由服务端给出</span></div>
            </div>
            <SubHead>宝箱状态机</SubHead>
            <States items={[
              ['waiting 等待解锁', '已购买，尚未到次日零点。', '到达 unlockAt 后变为 ready'],
              ['ready 可开启', '已解锁，可以开箱。', '开箱后变为 opened；超过 expiresAt 未开变为 expired'],
              ['opened 已开启', '已开箱并记录奖励金额，奖励可能为 0。', '终态，不可重复开启'],
              ['expired 已过期', '解锁后 24 小时内未开启，作废。', '终态，不退还购买金币'],
            ]} />
            <Fields rows={[
              ['offer.version', 'string', '报价版本号；与服务端不一致时购买返回 409，前端需刷新报价而不是按旧价成交。'],
              ['offer.priceCoins', 'number 大于 0', '购买价格，默认 500 金币。'],
              ['offer.maxRewardCoins', 'number 大于 0', '可能获得的奖励上限；实际开奖结果由服务端决定，可能为 0。'],
              ['unlockAt / expiresAt', 'timestamp', '解锁时间为次日零点，截止时间为解锁后 24 小时。'],
              ['eligible', 'boolean', '今天是否已完成有效游戏，决定能否购买。'],
              ['购买幂等键', 'chest-purchase-业务日', '每业务日限购一个，重复提交不重复扣费。'],
              ['开启幂等键', 'chest-open-宝箱ID', '重复提交不重复发奖。'],
            ]} />
            <div className="docs-callout docs-callout-warning"><Icon name="shield" /><div><strong>不要向玩家暴露的内容</strong><p>奖励的内部计算依据、概率分级、风控标记和后台调控字段一律不进入玩家侧接口与文案。玩家侧只返回：能不能买、买了多少钱、什么时候能开、开出了多少。</p></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="wallet" eyebrow="09 · WALLET" title="钱包、流水与战绩" description="所有资产变化只有一份记录，战绩是它的一个视图。" />
            <Logic>
              <p>玩家的每一次资产变化都要在钱包流水里留一条记录，没有例外。买宝箱扣的钱、开箱得的钱、玩游戏赢的和输的、签到领的、任务领的，全都在同一份流水里，用来源字段区分是哪一类。每条记录都带变动前和变动后的余额，这样对账时可以一条一条串起来验证，中间少一条就会对不上。</p>
              <p>这里要特别说明一个已经修正的设计问题。早期版本里，个人页有两个列表：一个叫"最近战绩"，一个叫"钱包流水"。结果是同一局游戏在两个地方各出现一次——战绩里写着"某某游戏 +3600"，流水里写着"游戏奖励 +3600"，是同一件事，但流水那条还看不出是哪个游戏。同时战绩里永远没有签到、任务和宝箱。这是典型的两份数据源描述同一件事，既冗余又容易对不上。</p>
              <p>现在的做法是：流水是唯一的数据源，游戏类的流水额外带上游戏标识，因此可以显示出是哪个游戏。个人页仍然保留两张卡片，但它们是互补的切分而不是重复——一张叫"奖励与消费"，只显示签到、任务和宝箱；另一张叫"最近战绩"，只显示游戏输赢。同一条记录不会同时出现在两张卡里。点开全部记录，可以按类型在全部、游戏战绩、奖励与消费之间切换，看到完整的合并列表。</p>
            </Logic>
            <SubHead>流水来源</SubHead>
            <Fields caption="人工调整（manual_adjust）目前仅存在于后台，前台流水枚举需在联调时补充该来源。" rows={[
              ['game_reward', '游戏派奖', '玩游戏赢得的金币或宝石，带 gameId。'],
              ['game_cost', '游戏消耗', '玩游戏消耗的金币，带 gameId。'],
              ['checkin', '签到奖励', '每日签到领取。'],
              ['task', '任务奖励', '每日任务领取。'],
              ['chest_purchase', '购买明日宝箱', '购买时扣除的金币。'],
              ['chest_reward', '明日宝箱开奖', '开箱获得的金币，可能为 0。'],
            ]} />
            <SubHead>流水记录字段</SubHead>
            <Fields rows={[
              ['id', 'string', '流水唯一编号。'],
              ['currency', "'coins' | 'gems'", '币种。'],
              ['amount', 'integer', '变动金额，正数为收入，负数为支出。'],
              ['source', '见上表', '来源分类，决定展示文案与归类。'],
              ['gameId', 'string | null', '游戏类流水携带，用于显示游戏名。'],
              ['createdAt', 'timestamp', '发生时间，按服务端时区格式化。'],
              ['status', "'completed' | 'processing' | 'failed'", '处理状态；处理中的记录不计入余额展示。'],
              ['balanceBefore / balanceAfter', 'integer | null', '变动前后余额，用于对账；无数据时显示"暂无数据"而不是 0。'],
            ]} />
            <Roles
              front="按来源分类展示、游戏类补上游戏名、提供币种与收支与类型筛选、分页、展示变动前后余额。"
              server="写入每一条流水并保证与资产变更原子提交、返回连续的余额链、保证幂等不产生重复记录。"
              admin="只读查询与对账；人工调整以追加一条处理中流水的方式写入，财务确认后才变为成功，既有流水永不可编辑。"
            />
          </section>

          <section className="docs-section">
            <SectionTitle id="social" eyebrow="10 · WINNERS" title="赢家榜与中奖弹幕" description="榜单、最近中奖和弹幕共用同一份中奖事件。" />
            <Logic>
              <p>大厅里有三个地方会展示别人中奖：今日赢家榜、最近中奖列表，还有偶尔飘过的中奖弹幕。这三处看起来是三个功能，实际上背后是同一份中奖事件数据，只是聚合方式不同。榜单按玩家把当天的中奖金额累加起来排名，最近中奖按时间倒序列出单条事件，弹幕挑其中一部分推给玩家看。</p>
              <p>之所以强调这一点，是因为它们必须保持一致。如果运营在后台隐藏了某一条中奖事件——比如那是个异常账号——那么它必须同时从榜单的累加里消失、从最近中奖里消失、也不再出现在弹幕里。做不到这一点，就会出现"榜单上有这个人，但列表里找不到对应记录"的矛盾。所以实现上必须共用同一个事件源和同一个事件编号，去重也按这个编号来。</p>
              <p>公开展示的金额是累计中奖金额，不是净收益，也就是说不减去玩家的投入。这一点要在产品文案上明确，避免玩家误解成"这个人今天净赚这么多"。榜单最多展示十条，宝箱幸运榜最多五条。</p>
              <p>玩家可以自己关掉中奖弹幕，也可以选择不让自己的中奖被分享出去，这两个开关在个人页的隐私偏好里，默认都是开启。前端必须尊重这两个开关：关掉接收就不再弹，关掉分享则该玩家的中奖不进入公开列表。</p>
            </Logic>
            <Roles
              front="按同一事件源渲染榜单、最近中奖与弹幕；按玩家偏好决定是否弹出；去重按事件编号。"
              server="产生并存储中奖事件、按业务日聚合排名、执行玩家的分享偏好过滤。"
              admin="只读核对。中奖事件的隐藏、撤销与隐私处理属于风控与内容审核系统，运营后台不提供增删改，也不配置展示条数（前台固定 10 / 5）。"
            />
          </section>

          <section className="docs-section">
            <SectionTitle id="profile" eyebrow="11 · PROFILE" title="我的与隐私偏好" description="资料、资产、记录与三个隐私开关。" />
            <Logic>
              <p>个人页汇总玩家的基本信息和资产：昵称、玩家编号、等级、金币和宝石余额，以及月卡和宝箱的权益状态。下面是两张互补的记录卡片，前面钱包那一节已经说过。</p>
              <p>隐私偏好有三个开关，默认都是开启：是否接收别人的中奖弹幕、是否允许自己的中奖被公开分享、是否让好友看到自己最近玩过的游戏。这三个开关由玩家自己控制，后台只能查看不能替玩家修改——这是合规要求，不是技术限制。</p>
              <p>本版本个人页不提供语言、声音、震动这类设置。语言由宿主或链接决定，不作为玩家可编辑的资料。</p>
            </Logic>
            <Fields rows={[
              ['receiveWinNotifications', 'boolean 默认 true', '是否接收中奖弹幕。'],
              ['allowSendWins', 'boolean 默认 true', '是否允许自己的中奖出现在公开榜单与弹幕中。'],
              ['shareRecentGames', 'boolean 默认 true', '是否让好友看到最近玩过的游戏。'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="admin-core" eyebrow="12 · ADMIN CORE" title="后台核心机制" description="草稿与生效版本、发布审核、待办工作台、操作留痕。" />
            <Logic title="草稿与生效版本 · 功能逻辑">
              <p>后台将生效版本、已保存草稿和弹窗中尚未保存的编辑分开。页面和详情始终只读；点击明确的编辑按钮，才在带分类子标签的弹窗中修改。切换标签保留输入，取消不写入草稿；存在未保存修改时，关闭会要求确认放弃。页面可切换生效预览与明确标记的草稿预览，保存不等于上线。</p>
              <p>改完点保存，草稿会被打包成一个快照挂到一条发布审核任务上。审核人打开这条任务，能看到生效版本和这份快照的逐字段对比：哪一格的概率从 22% 改成了 25%，哪一天的签到奖励从 800 改成了 150，改动的行会高亮出来。审核人据此决定通过、灰度还是驳回。</p>
              <p>三种决定的后果不同。通过意味着用快照覆盖生效版本，同时把旧的生效版本压进回滚栈；通用配置驳回时会重置来源草稿到生效版本；分类、游戏目录和翻译任务会保留较新的草稿。回滚只允许对当前生效任务执行，旧任务不可回滚；回滚后旧基线的待审草稿须重新提交。通过时会再次校验快照，数据不合法则拒绝发布并留失败记录。灰度、版本审核同步与生产状态均是原型模拟，不代表真实部署。</p>
              <p>有一个例外需要说清楚：游戏的运行状态和维护公告不走这套流程，保存后立刻生效。因为线上游戏出问题时，运营需要能立刻把它切成维护中，等不了审核。这两项通过独立运行操作弹窗立即生效，不与普通配置保存混用。</p>
            </Logic>
            <div className="docs-flow">
              <div><b>1</b><strong>编辑草稿</strong><span>只改草稿，线上不受影响</span></div><i>→</i>
              <div><b>2</b><strong>保存并提交</strong><span>草稿打包成快照挂到审核任务</span></div><i>→</i>
              <div><b>3</b><strong>审核判定</strong><span>看逐字段差异，决定通过 / 灰度 / 驳回</span></div><i>→</i>
              <div><b>4</b><strong>生效或回滚</strong><span>通过则覆盖生效版本并可回滚</span></div>
            </div>
            <Fields caption="配置包括游戏分类、幸运转盘、签到奖励、每日任务、金币礼包、月卡、宝箱报价、多语言文案，以及按环境区分的游戏目录和按记录区分的活动地区。活动奖励仍按类型共享。" rows={[
              ['通过并发布', 'approve', '用快照覆盖生效版本，旧版本进入回滚栈；发布前再校验一次。'],
              ['灰度发布', 'gray', '仅供其他模块模拟；分类、游戏目录和文案预览不提供灰度，不创建真实流量分组。'],
              ['驳回', 'reject', '通用配置重置草稿；分类、游戏目录、翻译保留较新草稿；必须填写原因。'],
              ['回滚', 'rollback', '仅当前生效任务可执行；恢复上一个生效版本，须填写原因；无历史版本时拒绝并留失败记录。'],
              ['暂停 / 恢复', 'pause / resume', '仅供其他模块模拟；分类、游戏目录和文案预览不提供此操作。'],
              ['重新提交', 'resubmit', '把被驳回的任务重新放回待审核。'],
            ]} />
            <Logic title="待处理事项 · 功能逻辑">
              <p>待办列表解决的问题是"运营知道有事要做，但不知道去哪做"。已关联对象的待办（含人工调整）可以点"去处理"会直接跳到那个游戏的配置弹窗、那条发布审核任务、筛选好的订单列表，或者那个玩家的档案，并且自动打开它。</p>
              <p>待办状态包括待处理、待审核、处理中、已解决。待处理表示尚未认领；待审核表示关联发布等待审核；处理中显示认领人；已解决保留处理结论。人工调整待办可直接打开对应流水，模拟确认或驳回后自动关闭。没有关联对象的事项仍需人工判断与转交。真实待办、权限和审计接口待接入。</p>
              <p>有些事项会自动关闭，不需要人去点。关联的发布任务被通过或驳回，对应的待办自动解决；游戏从维护中恢复运行，那条维护待办自动解决并写明原因。这样列表里剩下的都是真正还需要人处理的事。</p>
            </Logic>
            <Logic title="操作留痕 · 功能逻辑">
              <p>后台里每一个改动都会写一条操作日志，记录谁在什么时候对哪个对象做了什么，以及改动前后分别是什么值。配置类的改动会记到字段级别，例如"概率从 22 改为 25"，而不是笼统的"修改了转盘"。</p>
              <p>凡是有风险的操作都必须填写原因才能执行：驳回、回滚、退款、封禁玩家、解除限制、人工调整流水。原因会一起写进日志。每个对象的详情页都能看到它自己的历史操作，不需要去日志页大海捞针。</p>
            </Logic>
          </section>

          <section className="docs-section">
            <SectionTitle id="admin-modules" eyebrow="13 · ADMIN MODULES" title="后台模块清单" description="每个菜单负责什么，改动走哪条路径，排在哪一期交付。" />
            <Logic title="分期怎么划的">
              <p>后台按功能依赖分三期：基础运营、活动与商业化、资金流水与版本发布。最小发布审核、权限与审计是否纳入一期前置能力尚待确认。原型中的可操作菜单不等于对应服务已交付。</p>
              <p>后台侧边栏的每个菜单和每页标题旁边都有同一个分期标签，运营概览页顶部也有一张分期总览卡片，和这里说的是同一份划分。</p>
            </Logic>
            <States items={[1, 2, 3].map((phase) => [
              `${PHASES[phase].label} · ${PHASES[phase].name}`,
              PHASES[phase].summary,
              adminModules.filter(([id]) => phaseOf(id) === phase).map(([, name]) => name).join('、'),
            ])} />
            <div className="docs-table-wrap"><table className="docs-table">
              <thead><tr><th>模块</th><th className="docs-phase-cell">交付分期</th><th>能做什么</th><th>改动路径</th></tr></thead>
              <tbody>
                {adminModules.map(([id, name, ability, path]) => <tr key={id}>
                  <td><strong>{name}</strong></td>
                  <td className="docs-phase-cell"><StatusChip tone={phaseOf(id) === 1 ? 'current' : 'planned'}>{PHASES[phaseOf(id)].label}</StatusChip></td>
                  <td>{ability}</td>
                  <td>{path}</td>
                </tr>)}
              </tbody>
            </table></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="api" eyebrow="14 · CONTRACT" title="接口与数据契约" description="服务端需要提供的接口，以及所有写操作的统一约定。" />
            <SubHead note="以下为玩家侧接口约定，前缀 /api/v1；不是已部署接口清单。">玩家侧接口</SubHead>
            <div className="docs-code"><code>{`GET   /api/v1/preferences          读取隐私偏好
POST  /api/v1/preferences          保存隐私偏好（三个布尔值）
GET   /api/v1/wallet/ledger        钱包流水，含来源、余额前后与 gameId
GET   /api/v1/chest/status         宝箱状态：报价、资格、我的宝箱列表
POST  /api/v1/chest/purchases      购买宝箱，幂等键 chest-purchase-业务日
POST  /api/v1/chest/open           开启宝箱，幂等键 chest-open-宝箱ID
GET   /api/v1/chest/leaderboard    宝箱幸运榜，最多 5 条
GET   /api/v1/winners/today        今日赢家榜与最近中奖，榜单最多 10 条`}</code></div>
            <SubHead>写操作统一约定</SubHead>
            <Fields rows={[
              ['命名协议', '待评审', '计划使用 snake_case，阅读页原型使用 camelCase；字段命名及两者的映射关系尚未确定。'],
              ['幂等键', 'idempotencyKey', '玩家侧原型字段；后台计划中的 idempotency_key 与其关系待评审。所有改变资产的写请求必带。'],
              ['请求追踪', 'requestId', '每次请求唯一，用于把日志、响应和异常串起来。'],
              ['响应基础字段', 'serverTime', '服务端时间戳，前端据此判断业务日与倒计时，不使用设备时间。'],
              ['报价冲突', 'HTTP 409', '宝箱报价版本过期，前端需刷新报价重新确认，不得按旧价成交。'],
              ['资格不足', "错误码 ineligible", '今天未完成有效游戏，不能购买宝箱。'],
              ['余额不足', "错误码 balance", '金币不足以完成购买。'],
              ['结果未确定', "错误码 confirming", '请求已发出但结果未确认，前端显示确认中并允许查询，不得显示成功或失败。'],
            ]} />
            <Logic title="后台技术评审 · 待定契约与边界"><p>后台发布任务、审批/驳回/仅当前生效任务回滚、账号角色、翻译导入复核、退款与人工调整复核、版本上传验证的真实接口尚未补齐。人工调整来源为 manual_adjust，内部状态为 processing / completed / failed；仅模拟复核，不改真实余额；版本审核只同步原型来源状态，生产部署仍为模拟。最低审核权限是否属于一期依赖、以及 snake_case 与 camelCase 的映射，均为待确认项。</p></Logic>
            <SubHead>目录与预览存储边界</SubHead>
            <Fields rows={[
              ['category', '{ id, labels, enabled, sortWeight }', '全局分类定义。labels 覆盖注册的 24 语；已关联游戏的分类先迁移关联并审核后，才允许停用或删除。'],
              ['游戏展示字段', 'tags / gameType / sortWeight / popular / badges / cover / detail attributes', '与分类定义分开保存；分类审核成功后，游戏编辑才可选择该分类。'],
              ['游戏说明翻译', 'descriptionKey / games.instructions.{gameId} / games.rules.{gameId}', '复用多语言目录键及复核元数据；简介 zh/en 必填，玩法和规则整段可缺省。'],
              ['浏览器存储', 'localStorage', '仅 categories、游戏展示字段和游戏说明翻译可写入本地预览存储。'],
              ['预览开关', 'catalogPreview=1', '只有显式链接参数时读取本地已发布内容；真实宿主和服务端必须忽略。'],
              ['刷新边界', 'published only', '已发布展示内容可在刷新后保留；草稿、审核和回滚历史刷新后重置。余额、门槛、运行状态、支付、活动及一般文案不通过此机制跨页同步。'],
            ]} />
            <SubHead note="这几条是最容易被实现错、且后果最严重的地方。">实现红线</SubHead>
            <div className="docs-rule-list docs-rule-list-wide">
              <div><span>不许前端随机</span><strong>转盘、宝箱开奖结果一律由服务端产生并记录</strong></div>
              <div><span>不许伪造成功</span><strong>宿主或接口未确认前，不显示到账、已支付或已领取</strong></div>
              <div><span>不许覆盖生效版本</span><strong>已发布配置只能生成新版本，并保留回滚能力</strong></div>
              <div><span>不许拼接金额字符串</span><strong>服务端返回数值与币种，格式化交给前端按语言处理</strong></div>
              <div><span>不许用设备时间判业务日</span><strong>业务日、解锁与截止一律以服务端时区计算；七日签到须校验完整七日序列，月卡天数与奖励使用整数</strong></div>
              <div><span>不许泄露内部字段</span><strong>概率细节、风控分级、调控参数不进入玩家侧响应</strong></div>
            </div>
          </section>

          <section className="docs-section">
            <SectionTitle id="qa" eyebrow="15 · ACCEPTANCE" title="验收清单" description="发布前逐项确认。" />
            <div className="docs-checklist">
              <label><input type="checkbox" />五个主导航齐全，页面切换保留语言、展示模式与滚动位置</label>
              <label><input type="checkbox" />通用文案与游戏简介的简体中文、英文均成对存在，插值参数一致；玩法和规则为空时不生成空键，有内容时同样满足 zh/en</label>
              <label><input type="checkbox" />游戏四种状态各有画面，维护公告与上线时间正确展示</label>
              <label><input type="checkbox" />签到不可补签、转盘概率和为 100%、任务领取幂等</label>
              <label><input type="checkbox" />宝箱四种状态齐全，零金币结果正常展示，跨日多宝箱并存</label>
              <label><input type="checkbox" />钱包流水余额链连续，战绩与奖励两张卡不重复</label>
              <label><input type="checkbox" />榜单、最近中奖与弹幕共用事件源，隐藏后三处同步消失</label>
              <label><input type="checkbox" />后台草稿不影响生效版本，驳回丢弃、通过生效、回滚可恢复</label>
              <label><input type="checkbox" />待办可跳转到对象，关联对象终态时自动关闭</label>
              <label><input type="checkbox" />高风险操作均需填写原因并写入操作日志</label>
              <label><input type="checkbox" />空数据、失败、超时、无权限画面均已验证</label>
              <label><input type="checkbox" />切换到未翻译的语言时回退英文，不出现空白或原始键名</label>
              <label><input type="checkbox" />不在开放地区的游戏不出现在列表，宿主未告知国家时受限游戏 fail-closed</label>
              <label><input type="checkbox" />all、popular 不可作为分类编辑；分类停用或删除前已关联游戏完成迁移及审核，新分类审核成功后才可在游戏编辑中选择</label>
              <label><input type="checkbox" />gameType 与分类独立；Slots 四项属性只在详情展示，minBet、paylines、volatility 无编辑入口且不影响游戏引擎</label>
              <label><input type="checkbox" />只有 catalogPreview=1 读取本地已发布分类、游戏展示和游戏说明；刷新不保留草稿、审核或回滚历史，宿主和服务端不读取此预览数据</label>
              <label><input type="checkbox" />lint、单元测试、构建与产物校验通过</label>
            </div>
            <div className="docs-footer-note"><Icon name="calendar" /><span>实现或规则发生变化时，先更新本文档再发布。本文档入口在原型首页，也可以从任意页面顶部返回。</span></div>
          </section>
        </article>
      </div>
    </main>
  )
}
