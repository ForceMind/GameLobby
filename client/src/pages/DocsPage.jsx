import { useEffect, useState } from 'react'
import { Icon } from '../icons.jsx'
import { appVersion } from '../version.js'
import './docs.css'

const toc = [
  ['overview', '文档说明'],
  ['pages', '页面与功能地图'],
  ['global', '全局交互规范'],
  ['development', '开发实现说明'],
  ['games', '游戏中心'],
  ['events', '签到、转盘与任务'],
  ['store', '商城与明日宝箱'],
  ['admin', '后台管理与运营配置'],
  ['backend', '后台与运营操作说明'],
  ['data', '数据、逻辑与状态'],
  ['ops', '运营流程与风险'],
  ['qa', '验收清单'],
]

function SectionTitle({ id, eyebrow, title, description }) {
  return <div className="docs-section-title" id={id}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
}

function StatusChip({ children, tone = 'current' }) {
  return <span className={`docs-chip docs-chip-${tone}`}>{children}</span>
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
            <span className="eyebrow">PRODUCT · OPS</span>
            <strong>目录</strong>
            <nav aria-label="文档目录">{toc.map(([id, label]) => <a className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => handleSectionNav(event, id)} key={id}>{label}</a>)}</nav>
          </div>
        </aside>
        <article className="docs-content">
          <section className="docs-hero">
            <StatusChip>{appVersion} 当前基线</StatusChip>
            <h1>游戏大厅产品与运营文档</h1>
            <p>面向产品、设计、研发、测试和运营的统一说明。当前文档对应 lobby-admin-lite-v1：游戏、签到、转盘、任务、月卡、明日宝箱和我的页面；赛事、直播、家族/派对不在本版本；恢复今日赢家榜、最近中奖和中奖弹幕。</p>
            <div className="docs-hero-meta"><span><Icon name="calendar" />更新于 2026-09-01</span><span><Icon name="users" />适用角色：产品 / 研发 / 运营</span><span><Icon name="shield" />当前版本：前台 + 后台静态原型</span></div>
          </section>

          <section className="docs-section" aria-labelledby="overview-title">
            <SectionTitle id="overview" eyebrow="01 · READ FIRST" title="文档说明" description="先确认哪些是当前原型，哪些需要后台或服务端接入。" />
            <div className="docs-callout"><Icon name="eye" /><div><strong>状态标记</strong><p><StatusChip>当前原型</StatusChip> 已在 v{appVersion} 页面中可操作；<StatusChip tone="planned">后台配置</StatusChip> 描述目标管理能力；<StatusChip tone="server">待接入</StatusChip> 需要 App、API、实时数据或结算服务支持。</p><p><a className="docs-inline-link" href="admin.html"><Icon name="gauge" />打开运营后台原型 <Icon name="chevronRight" /></a></p></div></div>
            <div className="docs-grid docs-grid-3"><div><strong>当前事实</strong><p>React + Vite 静态前端，支持中文/英文、full/half 两种展示模式。</p></div><div><strong>数据边界</strong><p>基础展示内容从 JSON 导入；账号、余额、活动进度、订单、奖励和游戏实时状态由服务端替换。</p></div><div><strong>待接入</strong><p>真实概率、扣款、金币返还、游戏引擎、持久化和后台权限需要 API / App 接入。</p></div></div>
          </section>

          <section className="docs-section" aria-labelledby="pages-title">
            <SectionTitle id="pages" eyebrow="02 · INFORMATION ARCHITECTURE" title="页面与功能地图" description="页面职责和入口边界必须保持稳定。" />
            <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>页面</th><th>用户功能</th><th>运营关注点</th><th>half 行为</th></tr></thead><tbody>
              <tr><td><strong>首页 index</strong></td><td>原型说明、full/half 选择、文档入口</td><td>版本号、评审范围</td><td>不进入业务内容</td></tr>
              <tr><td><strong>大厅 lobby</strong></td><td>最近在玩、热门游戏、今日赢家榜、最近中奖；Banner 隐藏</td><td>游戏曝光、活动入口、推荐排序</td><td>游戏优先，隐藏次要入口</td></tr>
              <tr><td><strong>游戏中心 games</strong></td><td>游戏筛选、游戏启动、维护/地区状态</td><td>游戏上下架、版本、推荐排序</td><td>保留游戏目录</td></tr>
              <tr><td><strong>活动 events</strong></td><td>七日签到、幸运转盘、每日任务、奖励记录</td><td>周期、奖励、概率、任务目标</td><td>显示三项核心活动</td></tr>
              <tr><td><strong>商城 store</strong></td><td>金币礼包、明日宝箱、月度特权卡</td><td>价格、规则、结算、订单</td><td>保留权益和金币礼包</td></tr>
              <tr><td><strong>个人 profile</strong></td><td>资料、资产、战绩、隐私设置</td><td>账号安全、通知和展示范围</td><td>更多内容收起</td></tr>
            </tbody></table></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="global" eyebrow="03 · GLOBAL UI" title="全局交互规范" description="所有业务页共享同一套外框、状态和导航。" />
            <div className="docs-grid docs-grid-2"><div><h3>品牌与导航</h3><ul><li>顶部显示 Joyloop、当前版本号、返回入口、主导航和金币/宝石余额。</li><li>业务页通过 History API 切换，保持语言、full/half 和滚动位置。</li><li>文档页独立返回首页，不进入业务导航。</li></ul></div><div><h3>活动与权益</h3><ul><li>活动页统一展示签到、转盘、任务和奖励记录。</li><li>商城展示月卡、明日宝箱和必要的金币礼包。</li><li>购买、领取和结算结果由服务端或宿主返回，前端不伪造成功。</li></ul></div></div>
            <div className="docs-rule-list"><div><span>加载</span><strong>骨架 / 进度 / 可取消</strong></div><div><span>空数据</span><strong>说明原因 + 下一步操作</strong></div><div><span>失败</span><strong>保留原页并给出重试</strong></div><div><span>权限</span><strong>地区、游戏、房间状态前置过滤</strong></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="development" eyebrow="04 · DEVELOPMENT" title="开发实现说明" description="这一节用自然语言说明开发时各层分别负责什么，以及功能如何从入口走到结果。" />
            <div className="docs-prose"><p>前端的第一责任是把用户当前能做什么说清楚。页面负责布局、按钮、筛选、弹窗和状态反馈，不能把本地静态数据当成账户事实。账号、余额、游戏可用性、直播房间、活动资格和最终结算都应由宿主或服务端提供，前端只负责按照契约渲染。</p><p>页面之间的跳转由统一导航层处理。普通业务页通过 History API 切换内容，并保留当前语言、展示模式和滚动位置；游戏和直播间属于需要宿主接管的动作，必须经过桥接层生成请求。桥接层负责补齐来源、房间和游戏标识，处理宿主不存在、宿主拒绝、超时和异常，不允许前端直接把“请求已发送”显示成“已经成功”。</p><p>每个高风险功能都需要有明确的状态机。以直播间为例，房间会经历加载、直播中、已结束、游戏维护、麦位已满和无权限；以商城活动为例，会经历未购买、已生效、等待结算、结算完成和失败。状态变化应由服务端事件或明确的响应推动，页面刷新后不应凭空恢复成功状态。</p><p>开发实现还要为后续真实数据留下替换点：列表字段使用稳定 ID，展示文案通过翻译键，金额使用数值字段而不是拼接后的字符串，时间带上时区或服务端时间，操作请求带 requestId 或业务唯一键。这样静态原型可以直接替换为 API，而不需要重写页面结构。</p></div>
            <div className="docs-rule-list docs-rule-list-wide"><div><span>组件边界</span><strong>展示组件不直接修改钱包、订单或结算事实</strong></div><div><span>接口边界</span><strong>前端只依赖已定义字段和明确错误码</strong></div><div><span>状态边界</span><strong>加载、成功、失败、过期和未授权都可恢复</strong></div><div><span>数据边界</span><strong>金额、时间、ID 和状态分开传递</strong></div><div><span>可观测性</span><strong>曝光、点击、跳转、结果和异常可关联</strong></div><div><span>测试边界</span><strong>正常路径与失败路径同等验收</strong></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="games" eyebrow="04 · GAME CENTER" title="游戏中心" description="游戏列表是 Lite v1 的核心入口，所有可用性由服务端状态决定。" />
            <div className="docs-grid docs-grid-3"><div><h3>游戏目录</h3><p>支持全部、Slots、休闲、实时筛选；卡片展示封面、分类、在线人数、热度和状态。</p></div><div><h3>启动流程</h3><p>点击后进入加载状态，服务端确认可用后才允许启动；维护、地区不可用和失败均提供解释与重试。</p></div><div><h3>推荐 Banner</h3><p>Banner 只推荐已发布的游戏或活动，目标地址携带稳定的游戏 ID 和来源标识。</p></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="events" eyebrow="05 · EVENTS" title="签到、转盘与任务" description="Lite v1 活动页只承载三类可核对、可领取的核心权益。" />
            <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>模块</th><th>前台展示</th><th>核心规则</th><th>后台配置</th></tr></thead><tbody>
              <tr><td>七日签到</td><td>每日奖励、连续天数、领取状态</td><td>按服务端时区每日刷新，不支持补签</td><td>周期、奖励、资格和预算</td></tr>
              <tr><td>幸运转盘</td><td>剩余次数、奖项、旋转结果</td><td>服务端开奖，概率版本可追溯</td><td>次数、奖项、概率、库存</td></tr>
              <tr><td>每日任务</td><td>目标、进度、奖励、领取按钮</td><td>事件进度由服务端累计，领取接口幂等</td><td>事件、目标值、奖励、有效期</td></tr>
            </tbody></table></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="store" eyebrow="06 · STORE" title="商城与明日宝箱" description="商城必须拆开购买、资格、结算和到账状态。" />
            <div className="docs-flow"><div><b>1</b><strong>未开启</strong><span>今天完成有效游戏后，解锁购买资格</span></div><i>→</i><div><b>2</b><strong>确认开启</strong><span>500 金币购买一个次日宝箱，每日限购一次</span></div><i>→</i><div><b>3</b><strong>等待结算</strong><span>明天开启宝箱，结果与钱包流水同步确认</span></div></div>
            <div className="docs-grid docs-grid-2"><div><h3>用户侧状态</h3><ul><li>未游戏：去玩游戏；符合资格：展示可能获得的金币与购买按钮。</li><li>已购买：显示次日开启时间、截止时间和倒计时。</li><li>次日可开、已开启、0 奖励、过期、确认中分别展示，不重复开奖。</li></ul></div><div><h3>后台规则</h3><ul><li>购买价格、开奖上限、有效游戏资格和开启窗口按版本配置。</li><li>不自动续费；旧宝箱与今日新购买分开管理。</li><li>内部依据仅在受权后台可查；玩家接口不得包含内部计算字段。</li></ul></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="admin" eyebrow="07 · ADMIN CONSOLE" title="后台管理与运营配置" description="后台是游戏、活动和商品权益的唯一配置源。" />
            <div className="docs-callout docs-callout-success"><Icon name="play" /><div><strong>后台原型已可操作</strong><p>Lite v1 的 <code>admin.html</code> 覆盖运营概览、游戏管理、签到/转盘/任务、商品与权益、订单、钱包流水、玩家、发布审核和操作日志。页面使用带来源标识的 Mock 数据，支持搜索、状态筛选、详情抽屉、新建草稿和提交审核演示。</p></div></div>
            <div className="docs-grid docs-grid-2"><div><h3>游戏版本发布</h3><p>游戏版本发布菜单下按标签切换版本记录、上传记录、测试环境和生产环境，避免侧边栏被同一功能拆成多个入口。上传版本支持文件选择、版本号、构建号、自动检查、测试发布、审核、灰度、生产发布和回滚的流程预览。</p></div><div><h3>目录与后台用户</h3><p>游戏目录提供表格/卡片双视图、拖拽排序草稿和大厅热门推荐开关；后台用户与玩家管理分离，支持角色、数据范围、环境权限和账号状态的原型展示。</p></div></div>
            <div className="docs-admin-grid"><article><span className="docs-admin-icon"><Icon name="calendar" /></span><h3>活动配置</h3><dl><dt>签到</dt><dd>七日奖励梯度、领取状态和预算</dd><dt>转盘</dt><dd>免费次数、奖项、概率配置（需校验总和为 100%）和版本</dd><dt>任务</dt><dd>事件、目标值、奖励、有效期和幂等领取</dd><dt>发布</dt><dd>草稿 → 审核 → 发布 → 暂停 → 归档，记录操作人</dd></dl></article><article><span className="docs-admin-icon"><Icon name="gamepad" /></span><h3>游戏管理</h3><dl><dt>目录</dt><dd>游戏 ID、名称、分类、封面和地区白名单</dd><dt>状态</dt><dd>即将上线、可进入、维护中、暂不可用；前台按钮随状态变化</dd><dt>排序</dt><dd>拖拽排序与大厅热门推荐位配置</dd><dt>发布</dt><dd>版本检查、测试验证、审核、灰度和回滚</dd></dl></article><article><span className="docs-admin-icon"><Icon name="coin" /></span><h3>商品与权益</h3><dl><dt>金币礼包</dt><dd>SKU、金币、折扣、赠送宝石和展示状态</dd><dt>月卡</dt><dd>价格、有效期、每日奖励和到期提醒</dd><dt>明日宝箱</dt><dd>报价版本、购买价格、奖励上限、解锁与截止时间和每日限购</dd><dt>审计</dt><dd>价格、规则、人工补发和撤销全量留痕</dd></dl></article></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="backend" eyebrow="08 · BACK OFFICE OPERATIONS" title="后台与运营操作说明" description="后台不是简单的开关集合，而是从配置、审核、发布到结算复盘的一条责任链。" />
            <div className="docs-prose"><p>运营创建活动时，先填写活动目标和适用人群，再配置入口、任务、奖励、展示时间和结束条件。草稿阶段允许反复修改；进入审核后，价格、概率、库存、地区和结算字段应被锁定，任何修改都产生新版本并重新审核。发布时优先使用小流量或地区灰度，确认数据和文案正确后再扩大范围。</p><p>游戏上下架要从目录、活动、Banner 和任务四个方向联动处理。游戏下架或进入维护时，列表要停止推荐，相关活动入口要同步隐藏，已进入的用户要得到可解释的提示。恢复上架后，排序、封面和权限需要重新校验，不能只恢复一个“可见”开关。</p><p>活动结束后，运营要先冻结数据快照，再核对参与人数、任务完成、奖励发放、退款/撤销、异常账号和客服申诉。只有完成复盘，活动才进入归档状态。任何人工补发、规则调整或结算修正都应记录原因、操作者、审批人和影响范围。</p></div>
            <ol className="docs-steps"><li><b>配置</b><span>建立草稿并填写完整字段，禁止直接改线上生效版本。</span></li><li><b>审核</b><span>产品核对流程，运营核对资源，风控/财务核对价格和结算。</span></li><li><b>灰度</b><span>限制地区或用户组，观察曝光、点击、完成和异常。</span></li><li><b>发布</b><span>扩大范围并持续监控，出现异常时按维度暂停。</span></li><li><b>归档</b><span>冻结快照、完成结算复核，保留版本和审计记录。</span></li></ol>
          </section>

          <section className="docs-section">
            <SectionTitle id="data" eyebrow="08 · DATA CONTRACT" title="数据、逻辑与状态" description="前端只负责展示和交互，最终事实由服务端返回。" />
            <div className="docs-rule-list docs-rule-list-wide"><div><span>数据来源</span><strong>基础内容从 JSON 导入，余额、进度、订单和结算由 API 返回</strong></div><div><span>幂等</span><strong>购买、领取、结算和补发请求使用 requestId 或业务唯一键</strong></div><div><span>时效</span><strong>实时人数、活动进度和订单状态标明更新时间和延迟</strong></div><div><span>失败恢复</span><strong>桥接或 API 失败不伪造成功，前端回到原页并显示重试</strong></div><div><span>权限</span><strong>地区白名单和游戏状态在列表、详情、启动三层一致</strong></div><div><span>审计</span><strong>运营配置、价格、概率、上下架和人工操作均可追溯</strong></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="ops" eyebrow="09 · OPERATIONS" title="运营流程与风险" description="所有高风险活动先灰度、可暂停、可回滚。" />
            <ol className="docs-steps"><li><b>需求</b><span>明确人群、入口、目标、预算、口径和结束条件。</span></li><li><b>配置</b><span>后台创建草稿，填写活动、游戏和定价字段。</span></li><li><b>审核</b><span>产品、运营、风控/财务分别核对规则和文案。</span></li><li><b>灰度</b><span>按地区、用户组或流量比例发布，观察漏斗和异常。</span></li><li><b>复盘</b><span>结束后锁定数据快照，核对结算、投诉和收益归因。</span></li></ol>
            <div className="docs-callout docs-callout-warning"><Icon name="shield" /><div><strong>必须规避</strong><p>不得向用户承诺赔率、保底、返还必得或主播固定收益；不得把后台调控字段、概率细节和风控分级写入用户侧材料。</p></div></div>
          </section>

          <section className="docs-section">
            <SectionTitle id="qa" eyebrow="10 · ACCEPTANCE" title="验收清单" description="发布前至少完成以下检查。" />
            <div className="docs-checklist"><label><input type="checkbox" />页面入口、返回和版本号正确</label><label><input type="checkbox" />full / half、中文 / 英文无布局回归</label><label><input type="checkbox" />活动、游戏、直播房间状态可解释</label><label><input type="checkbox" />价格、资格、结算时间和归因字段一致</label><label><input type="checkbox" />空数据、失败、维护、权限和下架状态已验证</label><label><input type="checkbox" />桌面、移动、半屏实际视觉检查完成</label><label><input type="checkbox" />lint、测试、构建、dist 和 ZIP 校验通过</label><label><input type="checkbox" />线上部署后检查响应头、资源类型和新入口</label></div>
            <div className="docs-footer-note"><Icon name="calendar" /><span>本文档入口位于原型首页；点击页首“返回首页”可回到首页。实现与规则发生变化时，先更新本文档再发布。</span></div>
          </section>
        </article>
      </div>
    </main>
  )
}
