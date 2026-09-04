import { useEffect, useState } from 'react'
import { Icon } from '../icons.jsx'
import { appVersion } from '../version.js'
import './docs.css'

const toc = [
  ['overview', '文档说明'],
  ['architecture', '系统结构与职责边界'],
  ['pages', '页面与功能地图'],
  ['global', '全局规范'],
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
    const top = target.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - 20
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
        const top = target.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - 20
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
            <div className="docs-hero-meta"><span><Icon name="calendar" />更新于 2026-09-04</span><span><Icon name="users" />适用角色：产品 / 前端 / 后端 / 测试 / 运营</span><span><Icon name="shield" />当前形态：静态前端原型 + 后台原型</span></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="overview" eyebrow="01 · READ FIRST" title="文档说明" description="先分清哪些已经做出来了，哪些是给服务端的实现要求。" />
            <div className="docs-callout"><Icon name="eye" /><div><strong>三种状态标记</strong><p><StatusChip>已实现</StatusChip> 在当前原型里可以点、可以操作；<StatusChip tone="planned">后台配置</StatusChip> 由运营后台产生，前台只消费结果；<StatusChip tone="server">待接入</StatusChip> 需要真实服务端、宿主 App 或支付通道，原型里是本地模拟。</p><p><a className="docs-inline-link" href="admin.html"><Icon name="gauge" />打开运营后台原型 <Icon name="chevronRight" /></a></p></div></div>
            <Logic title="这份文档怎么读">
              <p>如果你是产品或运营，只读每一节开头的「功能逻辑」段落就够了，它用大白话把一件事从用户点第一下到最终结果讲完，不涉及任何技术名词。</p>
              <p>如果你是前端，除了功能逻辑，重点看「职责划分」里属于前端的那一列、字段表里的展示字段，以及状态机——页面需要为每一个状态准备一种画面，包括加载、空、失败和过期。</p>
              <p>如果你是后端，重点看职责划分里服务端那一列、接口契约一节，以及每个功能中标注了「由服务端决定」的规则。凡是涉及钱、概率、资格和结算的判断，一律由服务端做，前端不参与计算，也不允许前端把「请求已发出」显示成「已经成功」。</p>
              <p>原型里所有数据都保存在浏览器内存或本地存储中，刷新即重置。这是刻意的：它用来对齐产品形态和交互，不承担任何真实资产。凡是文档里写着「服务端」的地方，都是需要真正实现的部分。</p>
            </Logic>
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
            <SectionTitle id="games" eyebrow="05 · GAMES" title="游戏中心" description="游戏能不能玩，由状态决定；状态由后台配置和服务端可用性共同决定。" />
            <Logic>
              <p>游戏目录是大厅最核心的东西。玩家进来看到一格一格的游戏卡片，可以按全部、Slots、休闲、实时来筛。每张卡片上有封面、名字、分类、当前在线人数和热度，右上角可能有角标，比如 JACKPOT。点开一张卡片，会弹出这个游戏的说明：一段介绍文字，如果是老虎机类还会显示中奖率、RTP、中奖金额范围和最大赔率这四个参数。说明弹窗底部是开始游戏按钮。</p>
              <p>但不是每个游戏都能点。一款游戏有四种状态：正常可玩、维护中、即将上线、暂不可用。维护中通常是临时的，运营会在后台填一段维护公告，玩家点进去看到的就是这段话，而不是一个干巴巴的"不可用"。即将上线的游戏会显示预计上线时间。暂不可用一般用于地区限制或长期下架。只有正常可玩的游戏，开始按钮才是可点的。</p>
              <p>玩家点了开始游戏之后，前端并不自己启动任何东西，而是通过宿主把请求递出去。这期间界面显示加载，按钮锁住，防止连点。宿主确认可以启动，画面才切走；宿主拒绝或超时，玩家会看到失败原因和重试按钮，人还停在原来的位置。这个流程的关键是：前端不能因为"我把请求发出去了"就认为游戏启动成功了。</p>
              <p>游戏在大厅里的排列顺序和哪几款出现在热门推荐，都是运营在后台拖出来的，不是前端写死的。运营改完排序属于配置变更，要走审核发布；但把一款游戏切成维护中属于紧急操作，保存后立刻生效，因为线上出问题时没有时间等审核。</p>
            </Logic>
            <Roles
              front="渲染目录与筛选、按状态决定按钮是否可点、展示游戏说明、发起启动请求并处理加载与失败、把维护公告展示给玩家。"
              server="返回每款游戏当前是否真的可启动、实时在线人数、地区是否允许，以及启动会话本身。"
              admin="维护游戏目录、名称、分类、角标、封面、简介、排序权重、热门推荐、运行状态与维护公告、老虎机参数。"
            />
            <SubHead>游戏字段</SubHead>
            <Fields caption="前四项老虎机参数只在标签含 slots 的游戏上显示。最小投注、赔付线数、波动性三个字段后台已预留但前台尚未接入。" rows={[
              ['id', 'string', '游戏唯一标识，跳转、埋点和启动都用它，接入后不可更改。'],
              ['name', 'string', '游戏显示名。'],
              ['tags', "('slots' | 'casual' | 'realtime')[]", '分类标签，决定筛选归属，含 slots 时才展示老虎机参数。'],
              ['status', "'ready' | 'maintenance' | 'upcoming' | 'unavailable'", '运行状态，决定开始按钮是否可点。'],
              ['maintenanceNote', 'string', '维护公告文案，仅在维护中状态展示；后台校验为维护中时必填。'],
              ['launchAt', 'string', '预计上线时间，仅在即将上线状态展示；后台校验为该状态时必填。'],
              ['players', 'string', '在线人数，实时数据；无数据时显示"暂无数据"，不得用静态数字冒充。'],
              ['heat', 'number 0–100', '热度值，用于排序参考与卡片展示。'],
              ['popular', 'boolean', '是否进入大厅热门推荐位。'],
              ['sortWeight', 'number 大于 0', '排序权重，数值越小越靠前；后台拖拽排序会覆盖该顺序。'],
              ['badges', 'string[]', '卡片角标，例如 JACKPOT。'],
              ['cover', 'string', '封面资源文件名；资源上传服务待接入。'],
              ['winRate / rtp / winRange / maxMultiplier', 'string', '老虎机四项参数，展示在游戏说明弹窗。'],
            ]} />
            <SubHead>游戏状态机</SubHead>
            <States items={[
              ['正常可玩', '目录可见，开始按钮可点。', '可切到维护中、即将上线、暂不可用'],
              ['维护中', '目录可见但不可进入，展示维护公告。', '恢复运行后回到正常可玩，并自动关闭对应待办'],
              ['即将上线', '目录可见，展示预计上线时间，不可进入。', '到期后由运营切到正常可玩'],
              ['暂不可用', '地区限制或长期下架，不可进入。', '由运营恢复'],
            ]} />
          </section>

          <section className="docs-section">
            <SectionTitle id="events" eyebrow="06 · EVENTS" title="活动中心" description="三个活动：七日签到、幸运转盘、每日任务。" />
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
            <SectionTitle id="store" eyebrow="07 · STORE" title="商城与明日宝箱" description="三类商品，三条不同的支付与结算路径。" />
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
            <SectionTitle id="wallet" eyebrow="08 · WALLET" title="钱包、流水与战绩" description="所有资产变化只有一份记录，战绩是它的一个视图。" />
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
            <SectionTitle id="social" eyebrow="09 · WINNERS" title="赢家榜与中奖弹幕" description="榜单、最近中奖和弹幕共用同一份中奖事件。" />
            <Logic>
              <p>大厅里有三个地方会展示别人中奖：今日赢家榜、最近中奖列表，还有偶尔飘过的中奖弹幕。这三处看起来是三个功能，实际上背后是同一份中奖事件数据，只是聚合方式不同。榜单按玩家把当天的中奖金额累加起来排名，最近中奖按时间倒序列出单条事件，弹幕挑其中一部分推给玩家看。</p>
              <p>之所以强调这一点，是因为它们必须保持一致。如果运营在后台隐藏了某一条中奖事件——比如那是个异常账号——那么它必须同时从榜单的累加里消失、从最近中奖里消失、也不再出现在弹幕里。做不到这一点，就会出现"榜单上有这个人，但列表里找不到对应记录"的矛盾。所以实现上必须共用同一个事件源和同一个事件编号，去重也按这个编号来。</p>
              <p>公开展示的金额是累计中奖金额，不是净收益，也就是说不减去玩家的投入。这一点要在产品文案上明确，避免玩家误解成"这个人今天净赚这么多"。榜单最多展示十条，宝箱幸运榜最多五条。</p>
              <p>玩家可以自己关掉中奖弹幕，也可以选择不让自己的中奖被分享出去，这两个开关在个人页的隐私偏好里，默认都是开启。前端必须尊重这两个开关：关掉接收就不再弹，关掉分享则该玩家的中奖不进入公开列表。</p>
            </Logic>
            <Roles
              front="按同一事件源渲染榜单、最近中奖与弹幕；按玩家偏好决定是否弹出；去重按事件编号。"
              server="产生并存储中奖事件、按业务日聚合排名、执行玩家的分享偏好过滤。"
              admin="隐藏或恢复单条事件；隐藏后同时影响榜单聚合与前台弹幕；被隐藏的事件仍保留在后台列表中可恢复。"
            />
          </section>

          <section className="docs-section">
            <SectionTitle id="profile" eyebrow="10 · PROFILE" title="我的与隐私偏好" description="资料、资产、记录与三个隐私开关。" />
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
            <SectionTitle id="admin-core" eyebrow="11 · ADMIN CORE" title="后台核心机制" description="草稿与生效版本、发布审核、待办工作台、操作留痕。" />
            <Logic title="草稿与生效版本 · 功能逻辑">
              <p>后台里所有配置都存在两份：一份是运营正在编辑的草稿，一份是线上正在执行的生效版本。运营在页面上改数字，改的永远是草稿，线上完全不受影响。每个配置页顶部有一个明确的提示条，告诉你现在处于哪种情况：和生效版本一致、草稿有未保存的改动、还是已经提交等待审核。</p>
              <p>改完点保存，草稿会被打包成一个快照挂到一条发布审核任务上。审核人打开这条任务，能看到生效版本和这份快照的逐字段对比：哪一格的概率从 22% 改成了 25%，哪一天的签到奖励从 800 改成了 150，改动的行会高亮出来。审核人据此决定通过、灰度还是驳回。</p>
              <p>三种决定的后果不同。通过意味着用快照覆盖生效版本，同时把旧的生效版本压进回滚栈；驳回意味着丢弃来源模块的草稿，让它退回和生效版本一致；回滚意味着从回滚栈里取出上一个生效版本恢复回去。还有一个细节：通过的那一刻会再校验一次快照，如果这期间数据变得不合法，会拒绝发布并留下失败记录，而不是把坏配置推上线。</p>
              <p>有一个例外需要说清楚：游戏的运行状态和维护公告不走这套流程，保存后立刻生效。因为线上游戏出问题时，运营需要能立刻把它切成维护中，等不了审核。这个例外在界面上有明确标注。</p>
            </Logic>
            <div className="docs-flow">
              <div><b>1</b><strong>编辑草稿</strong><span>只改草稿，线上不受影响</span></div><i>→</i>
              <div><b>2</b><strong>保存并提交</strong><span>草稿打包成快照挂到审核任务</span></div><i>→</i>
              <div><b>3</b><strong>审核判定</strong><span>看逐字段差异，决定通过 / 灰度 / 驳回</span></div><i>→</i>
              <div><b>4</b><strong>生效或回滚</strong><span>通过则覆盖生效版本并可回滚</span></div>
            </div>
            <Fields caption="配置模块共八个：幸运转盘、签到奖励梯度、每日任务、金币礼包、月度特权卡、明日宝箱报价，以及按环境分开的游戏目录（测试 / 生产）。" rows={[
              ['通过并发布', 'approve', '用快照覆盖生效版本，旧版本进入回滚栈；发布前再校验一次。'],
              ['灰度发布', 'gray', '同上，但状态标为灰度，可继续扩大到全量或回滚。'],
              ['驳回', 'reject', '丢弃来源模块草稿，退回与生效版本一致；必须填写原因。'],
              ['回滚', 'rollback', '从回滚栈恢复上一个生效版本；必须填写原因；无历史版本时拒绝并留失败记录。'],
              ['暂停 / 恢复', 'pause / resume', '只改任务状态，不改生效配置。'],
              ['重新提交', 'resubmit', '把被驳回的任务重新放回待审核。'],
            ]} />
            <Logic title="待处理事项 · 功能逻辑">
              <p>待办列表解决的问题是"运营知道有事要做，但不知道去哪做"。所以这里每一条待办都绑定了它要处理的那个对象，点"去处理"会直接跳到那个游戏的配置弹窗、那条发布审核任务、筛选好的订单列表，或者那个玩家的档案，并且自动打开它。</p>
              <p>状态只有三种，含义写在页面顶部：待处理表示还没有人认领；处理中表示已经有人认领，认领人显示在负责人列；已解决表示处理完并且填了处理结论。认领这一步是有意保留的，它让多人协作时不会两个人同时处理同一件事。</p>
              <p>有些事项会自动关闭，不需要人去点。关联的发布任务被通过或驳回，对应的待办自动解决；游戏从维护中恢复运行，那条维护待办自动解决并写明原因。这样列表里剩下的都是真正还需要人处理的事。</p>
            </Logic>
            <Logic title="操作留痕 · 功能逻辑">
              <p>后台里每一个改动都会写一条操作日志，记录谁在什么时候对哪个对象做了什么，以及改动前后分别是什么值。配置类的改动会记到字段级别，例如"概率从 22 改为 25"，而不是笼统的"修改了转盘"。</p>
              <p>凡是有风险的操作都必须填写原因才能执行：驳回、回滚、退款、封禁玩家、解除限制、人工调整流水。原因会一起写进日志。每个对象的详情页都能看到它自己的历史操作，不需要去日志页大海捞针。</p>
            </Logic>
          </section>

          <section className="docs-section">
            <SectionTitle id="admin-modules" eyebrow="12 · ADMIN MODULES" title="后台模块清单" description="每个菜单负责什么，改动走哪条路径。" />
            <div className="docs-table-wrap"><table className="docs-table">
              <thead><tr><th>模块</th><th>能做什么</th><th>改动路径</th></tr></thead>
              <tbody>
                <tr><td><strong>运营概览</strong></td><td>按当前环境的生效版本统计游戏可玩情况、待处理事项数量、最近发布</td><td>只读</td></tr>
                <tr><td><strong>待处理事项</strong></td><td>认领、跳转到对象处理、填结论关闭、转交他人</td><td>直接生效</td></tr>
                <tr><td><strong>发布审核</strong></td><td>查看逐字段配置差异、通过 / 灰度 / 驳回 / 暂停 / 回滚、跳转来源配置</td><td>决定生效版本</td></tr>
                <tr><td><strong>操作日志</strong></td><td>全量操作留痕，含对象模块与变更前后值</td><td>只读</td></tr>
                <tr><td><strong>游戏管理</strong></td><td>目录排序、热门推荐、游戏配置弹窗（基础信息 / 运行状态 / 大厅展示 / Slots 参数）</td><td>运行状态与维护公告立即生效，其余走草稿审核</td></tr>
                <tr><td><strong>游戏版本发布</strong></td><td>版本记录、上传记录、测试环境、生产环境四个标签的流转</td><td>提交生产发布进入审核</td></tr>
                <tr><td><strong>赢家与动态</strong></td><td>隐藏或恢复中奖事件与开箱事件，调整展示上限</td><td>直接生效</td></tr>
                <tr><td><strong>活动管理</strong></td><td>按活动类型打开不同的配置弹窗：转盘配奖项概率、签到配奖励梯度、任务配任务列表；共通字段含周期、人群、预算</td><td>活动信息立即生效，奖励配置走草稿审核</td></tr>
                <tr><td><strong>签到 / 转盘 / 任务</strong></td><td>与活动弹窗共用同一份草稿的独立配置页</td><td>草稿审核</td></tr>
                <tr><td><strong>商品与权益</strong></td><td>金币礼包、月度特权卡、明日宝箱报价</td><td>草稿审核</td></tr>
                <tr><td><strong>订单管理</strong></td><td>查询与人工处置：取消、退款、标记异常、人工确认</td><td>直接生效，需填原因</td></tr>
                <tr><td><strong>钱包流水</strong></td><td>查询、对账、导出；人工调整追加一条处理中流水待财务确认</td><td>既有流水只读</td></tr>
                <tr><td><strong>玩家管理</strong></td><td>玩家列表、奖励领取记录、月卡权益、宝箱记录四个标签；状态处置需填原因</td><td>直接生效，隐私偏好只读</td></tr>
                <tr><td><strong>权限与账号</strong></td><td>后台账号与角色的菜单范围、操作权限、生产环境权限</td><td>直接生效（权限拦截待接入）</td></tr>
              </tbody>
            </table></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="api" eyebrow="13 · CONTRACT" title="接口与数据契约" description="服务端需要提供的接口，以及所有写操作的统一约定。" />
            <SubHead note="以下为玩家侧接口，前缀 /api/v1。">玩家侧接口</SubHead>
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
              ['幂等键', 'idempotencyKey', '所有改变资产的写请求必带；同键重复提交只处理一次并返回相同结果。'],
              ['请求追踪', 'requestId', '每次请求唯一，用于把日志、响应和异常串起来。'],
              ['响应基础字段', 'serverTime', '服务端时间戳，前端据此判断业务日与倒计时，不使用设备时间。'],
              ['报价冲突', 'HTTP 409', '宝箱报价版本过期，前端需刷新报价重新确认，不得按旧价成交。'],
              ['资格不足', "错误码 ineligible", '今天未完成有效游戏，不能购买宝箱。'],
              ['余额不足', "错误码 balance", '金币不足以完成购买。'],
              ['结果未确定', "错误码 confirming", '请求已发出但结果未确认，前端显示确认中并允许查询，不得显示成功或失败。'],
            ]} />
            <SubHead note="这几条是最容易被实现错、且后果最严重的地方。">实现红线</SubHead>
            <div className="docs-rule-list docs-rule-list-wide">
              <div><span>不许前端随机</span><strong>转盘、宝箱开奖结果一律由服务端产生并记录</strong></div>
              <div><span>不许伪造成功</span><strong>宿主或接口未确认前，不显示到账、已支付或已领取</strong></div>
              <div><span>不许覆盖生效版本</span><strong>已发布配置只能生成新版本，并保留回滚能力</strong></div>
              <div><span>不许拼接金额字符串</span><strong>服务端返回数值与币种，格式化交给前端按语言处理</strong></div>
              <div><span>不许用设备时间判业务日</span><strong>业务日、解锁与截止一律以服务端时区计算</strong></div>
              <div><span>不许泄露内部字段</span><strong>概率细节、风控分级、调控参数不进入玩家侧响应</strong></div>
            </div>
          </section>

          <section className="docs-section">
            <SectionTitle id="qa" eyebrow="14 · ACCEPTANCE" title="验收清单" description="发布前逐项确认。" />
            <div className="docs-checklist">
              <label><input type="checkbox" />五个主导航齐全，页面切换保留语言、展示模式与滚动位置</label>
              <label><input type="checkbox" />中英文键成对存在，插值参数一致，无未翻译文案</label>
              <label><input type="checkbox" />游戏四种状态各有画面，维护公告与上线时间正确展示</label>
              <label><input type="checkbox" />签到不可补签、转盘概率和为 100%、任务领取幂等</label>
              <label><input type="checkbox" />宝箱四种状态齐全，零金币结果正常展示，跨日多宝箱并存</label>
              <label><input type="checkbox" />钱包流水余额链连续，战绩与奖励两张卡不重复</label>
              <label><input type="checkbox" />榜单、最近中奖与弹幕共用事件源，隐藏后三处同步消失</label>
              <label><input type="checkbox" />后台草稿不影响生效版本，驳回丢弃、通过生效、回滚可恢复</label>
              <label><input type="checkbox" />待办可跳转到对象，关联对象终态时自动关闭</label>
              <label><input type="checkbox" />高风险操作均需填写原因并写入操作日志</label>
              <label><input type="checkbox" />空数据、失败、超时、无权限画面均已验证</label>
              <label><input type="checkbox" />lint、单元测试、构建与产物校验通过</label>
            </div>
            <div className="docs-footer-note"><Icon name="calendar" /><span>实现或规则发生变化时，先更新本文档再发布。本文档入口在原型首页，也可以从任意页面顶部返回。</span></div>
          </section>
        </article>
      </div>
    </main>
  )
}
