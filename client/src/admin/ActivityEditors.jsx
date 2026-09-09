import { Icon } from '../icons.jsx'
import { missionEventOptions } from './adminSchema.js'
import { formatReward, prizeLabel, wheelBalanced, WHEEL_SLOTS } from './adminRules.js'

const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const statusClass = (value) => {
  if (['进行中', '已完成', '正常', '生效中', '已发布', '启用', '成功', '已解决', '测试通过', '校验通过', '已展示', '已结算', '正常可玩', '已支付', '已领取', '已发放', '已开启', '已生成版本'].includes(value)) return 'success'
  if (['维护中', '待审核', '退款处理中', '候补开放', '待复核', '草稿', '待处理', '处理中', '结算待开始', '灰度 20%', '测试中', '检查中', '待激活', '待支付', '即将上线', '今日可领', '活动限制', '已暂停', '发放中', '待开启', '已提交生产'].includes(value)) return 'warning'
  if (['已下架', '已封禁', '支付失败', '异常', '已作废', '上传失败', '失败', '漏签', '暂不可用', '已驳回', '已回滚', '发放失败', '测试失败', '已过期'].includes(value)) return 'danger'
  return 'neutral'
}

function Status({ children }) {
  return <span className={`admin-status ${statusClass(children)}`}><i />{children}</span>
}

const checkinStateLabel = { claimed: '已领取', missed: '漏签', today: '今日可领', locked: '未解锁' }
const checkinStepClass = { claimed: 'done', today: 'active', missed: 'missed', locked: '' }

export function CheckinLadderEditor({ days, onChange }) {
  const updateDay = (index, patch) => onChange(days.map((day, dayIndex) => (
    dayIndex === index ? { ...day, ...patch, reward: formatReward(patch.coins ?? day.coins, patch.gems ?? day.gems) } : day
  )))
  const steps = []
  days.forEach((day, index) => {
    if (index > 0) steps.push(<i key={`line-${index}`} />)
    steps.push(<div key={day.day} className={`workflow-step ${checkinStepClass[day.state]}`}><b>{index + 1}</b><span>{day.day.split(' ')[0]}{day.grand ? ' · 大奖' : ''}</span></div>)
  })

  return <>
    <div className="workflow-strip">{steps}</div>
    <div className="table-wrap"><table><thead><tr><th>天数</th><th>金币</th><th>宝石</th><th>大奖</th><th>示例玩家进度（非配置）</th></tr></thead><tbody>{days.map((day, index) => <tr key={day.day}>
      <td>{day.day}</td>
      <td><input className="ladder-input" type="number" min="0" aria-label={`签到${day.day}金币奖励`} value={day.coins} onChange={(event) => updateDay(index, { coins: Number(event.target.value) || 0 })} /></td>
      <td><input className="ladder-input" type="number" min="0" aria-label={`签到${day.day}宝石奖励`} value={day.gems} onChange={(event) => updateDay(index, { gems: Number(event.target.value) || 0 })} /></td>
      <td><button type="button" className={`toggle-switch ${day.grand ? 'is-on' : ''}`} onClick={() => updateDay(index, { grand: !day.grand })} aria-pressed={!!day.grand} aria-label={`签到${day.day}设为大奖`}><i /></button></td>
      <td><Status>{checkinStateLabel[day.state] ?? day.state}</Status></td>
    </tr>)}</tbody></table></div>
  </>
}

export function WheelPrizeEditor({ prizes, freeSpins, onChange, section = 'all' }) {
  const emit = (patch) => onChange({ prizes, freeSpins, ...patch })
  const updatePrize = (id, patch) => emit({ prizes: prizes.map((prize) => (
    prize.id === id ? { ...prize, ...patch, label: prizeLabel(patch.kind ?? prize.kind, patch.amount ?? prize.amount) } : prize
  )) })
  const total = prizes.reduce((sum, prize) => sum + (Number(prize.probability) || 0), 0)
  const addPrize = () => emit({ prizes: [...prizes, { id: `prize-${stamp()}`, label: '100 金币', kind: 'coins', amount: 100, probability: 0 }] })

  if (section === 'prizes') return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>奖项格数：{prizes.length} / {WHEEL_SLOTS}</strong><span>前台固定 {WHEEL_SLOTS} 格。请在「概率与次数」中配置每一格的中奖概率。</span></div></div>
    <div className="table-wrap"><table><thead><tr><th>格位</th><th>奖项类型</th><th>奖励数量</th><th>操作</th></tr></thead><tbody>{prizes.map((prize, index) => <tr key={prize.id}>
      <td>第 {index + 1} 格</td>
      <td><select className="ladder-input" aria-label={`转盘第${index + 1}格奖项类型`} value={prize.kind} onChange={(event) => updatePrize(prize.id, { kind: event.target.value })}><option value="coins">金币</option><option value="gems">宝石</option><option value="freeSpin">免费旋转</option></select></td>
      <td><input className="ladder-input" type="number" min="1" aria-label={`转盘第${index + 1}格奖励数量`} value={prize.amount} onChange={(event) => updatePrize(prize.id, { amount: Number(event.target.value) || 0 })} /></td>
      <td><button type="button" className="admin-btn subtle" aria-label={`删除转盘第${index + 1}格奖项`} onClick={() => emit({ prizes: prizes.filter((item) => item.id !== prize.id) })}>删除</button></td>
    </tr>)}</tbody></table></div>
    <div className="editor-actions"><button type="button" className="admin-btn subtle" aria-label="新增转盘奖项" disabled={prizes.length >= WHEEL_SLOTS} onClick={addPrize}><Icon name="gift" />新增奖项（上限 {WHEEL_SLOTS} 格）</button></div>
  </>

  if (section === 'rules') return <>
    <div className={`admin-config-note ${wheelBalanced(prizes) ? '' : 'danger'}`}><Icon name={wheelBalanced(prizes) ? 'shield' : 'bolt'} /><div><strong>概率总和：{total}%{wheelBalanced(prizes) ? '' : '（必须为 100%）'}</strong><span>每个概率必须是 0–100 的整数；奖项类型和数量在「奖项配置」中维护。</span></div></div>
    <div className="table-wrap"><table><thead><tr><th>格位</th><th>奖项</th><th>中奖概率</th></tr></thead><tbody>{prizes.map((prize, index) => <tr key={prize.id}>
      <td>第 {index + 1} 格</td><td>{prize.label || prizeLabel(prize.kind, prize.amount)}</td>
      <td><label className="inline-field"><input className="ladder-input" type="number" min="0" max="100" step="1" aria-label={`转盘第${index + 1}格概率`} value={prize.probability} onChange={(event) => updatePrize(prize.id, { probability: Math.max(0, Math.min(100, Math.round(Number(event.target.value) || 0))) })} /> <span className="pct">%</span></label></td>
    </tr>)}</tbody></table></div>
    <div className="editor-actions"><label className="inline-field">每日免费次数<input className="ladder-input" type="number" min="0" step="1" aria-label="转盘每日免费次数" value={freeSpins} onChange={(event) => emit({ freeSpins: Math.max(0, Math.round(Number(event.target.value) || 0)) })} /></label></div>
  </>

  return <>
    <div className={`admin-config-note ${wheelBalanced(prizes) ? '' : 'danger'}`}><Icon name={wheelBalanced(prizes) ? 'shield' : 'bolt'} /><div><strong>概率总和：{total}%{wheelBalanced(prizes) ? '' : '（必须为 100%）'}</strong><span>前台固定 {WHEEL_SLOTS} 格，当前 {prizes.length} 格；概率必须是 0–100 的整数。</span></div></div>
    <div className="prize-list">{prizes.map((prize, index) => <div className="prize-row wide" key={prize.id}>
      <span className="prize-index">第 {index + 1} 格</span>
      <select className="ladder-input" aria-label={`转盘第${index + 1}格奖项类型`} value={prize.kind} onChange={(event) => updatePrize(prize.id, { kind: event.target.value })}><option value="coins">金币</option><option value="gems">宝石</option><option value="freeSpin">免费旋转</option></select>
      <input className="ladder-input" type="number" min="1" aria-label={`转盘第${index + 1}格奖励数量`} value={prize.amount} onChange={(event) => updatePrize(prize.id, { amount: Number(event.target.value) || 0 })} />
      <input type="number" min="0" max="100" step="1" aria-label={`转盘第${index + 1}格概率`} value={prize.probability} onChange={(event) => updatePrize(prize.id, { probability: Math.max(0, Math.min(100, Math.round(Number(event.target.value) || 0))) })} />
      <span className="pct">概率 %</span>
      <button type="button" className="admin-btn subtle" aria-label={`删除转盘第${index + 1}格奖项`} onClick={() => emit({ prizes: prizes.filter((item) => item.id !== prize.id) })}>删除</button>
    </div>)}</div>
    <div className="editor-actions"><button type="button" className="admin-btn subtle" aria-label="新增转盘奖项" disabled={prizes.length >= WHEEL_SLOTS} onClick={addPrize}><Icon name="gift" />新增奖项（上限 {WHEEL_SLOTS} 格）</button><label className="inline-field">每日免费次数<input className="ladder-input" type="number" min="0" step="1" aria-label="转盘每日免费次数" value={freeSpins} onChange={(event) => emit({ freeSpins: Math.max(0, Math.round(Number(event.target.value) || 0)) })} /></label></div>
  </>
}

export function MissionListEditor({ missions, removableIds = [], onChange, section = 'all' }) {
  const showDetails = section === 'all' || section === 'details'
  const showRewards = section === 'all' || section === 'rewards'
  const updateMission = (id, patch) => onChange(missions.map((mission) => (mission.id === id ? { ...mission, ...patch } : mission)))
  const isLiveTask = (mission) => removableIds.includes(mission.id)
  const addMission = () => onChange([{ id: `mission-${stamp()}`, name: '', event: missionEventOptions[0], target: 1, coinReward: 500, gemReward: 1, cycle: '每日', status: '生效中', expired: false }, ...missions])

  if (section === 'all') return <>
    <div className="editor-actions"><button type="button" className="admin-btn subtle" aria-label="新建每日任务" onClick={addMission}><Icon name="flag" />新建任务</button></div>
    <div className="table-wrap"><table><thead><tr><th>任务名称</th><th>目标事件</th><th>目标值</th><th>状态</th><th>金币奖励</th><th>宝石奖励</th><th>刷新周期</th><th>操作</th></tr></thead><tbody>{missions.map((mission) => <tr key={mission.id}>{mission.expired
      ? <><td>{mission.name}</td><td>{mission.event}</td><td>{mission.target}</td><td><Status>{mission.status}</Status></td><td>{mission.coinReward}</td><td>{mission.gemReward}</td><td>{mission.cycle}</td><td>—</td></>
      : <>
        <td><input className="ladder-input" aria-label={`${mission.id}任务名称`} value={mission.name} placeholder="任务名称（必填）" onChange={(event) => updateMission(mission.id, { name: event.target.value })} /></td>
        <td><select className="ladder-input" aria-label={`${mission.id}目标事件`} value={mission.event} onChange={(event) => updateMission(mission.id, { event: event.target.value })}>{missionEventOptions.map((option) => <option key={option}>{option}</option>)}</select></td>
        <td><input className="ladder-input" type="number" min="1" step="1" aria-label={`${mission.id}目标值`} value={mission.target} onChange={(event) => updateMission(mission.id, { target: Math.max(1, Math.round(Number(event.target.value) || 1)) })} /></td>
        <td><Status>{mission.status}</Status></td>
        <td><input className="ladder-input" type="number" min="0" aria-label={`${mission.id}金币奖励`} value={mission.coinReward} onChange={(event) => updateMission(mission.id, { coinReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td><input className="ladder-input" type="number" min="0" aria-label={`${mission.id}宝石奖励`} value={mission.gemReward} onChange={(event) => updateMission(mission.id, { gemReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td>每日</td>
        <td><button type="button" className="row-action" aria-label={`${mission.status === '生效中' ? '下线' : '上线'}任务${mission.name || mission.id}`} onClick={() => updateMission(mission.id, { status: mission.status === '生效中' ? '已下线' : '生效中' })}>{mission.status === '生效中' ? '下线' : '上线'}</button>{!isLiveTask(mission) && <button type="button" className="row-action" aria-label={`移除任务${mission.name || mission.id}`} onClick={() => onChange(missions.filter((item) => item.id !== mission.id))}>移除</button>}</td>
      </>}</tr>)}</tbody></table></div>
  </>

  return <>
    {showDetails && <>
      <div className="editor-actions"><button type="button" className="admin-btn subtle" aria-label="新建每日任务" onClick={addMission}><Icon name="flag" />新建任务</button></div>
      <div className="table-wrap"><table><thead><tr><th>任务名称</th><th>目标事件</th><th>目标值</th><th>刷新周期</th></tr></thead><tbody>{missions.map((mission) => <tr key={mission.id}>{mission.expired
        ? <><td>{mission.name}</td><td>{mission.event}</td><td>{mission.target}</td><td>{mission.cycle}</td></>
        : <>
          <td><input className="ladder-input" aria-label={`${mission.id}任务名称`} value={mission.name} placeholder="任务名称（必填）" onChange={(event) => updateMission(mission.id, { name: event.target.value })} /></td>
          <td><select className="ladder-input" aria-label={`${mission.id}目标事件`} value={mission.event} onChange={(event) => updateMission(mission.id, { event: event.target.value })}>{missionEventOptions.map((option) => <option key={option}>{option}</option>)}</select></td>
          <td><input className="ladder-input" type="number" min="1" step="1" aria-label={`${mission.id}目标值`} value={mission.target} onChange={(event) => updateMission(mission.id, { target: Math.max(1, Math.round(Number(event.target.value) || 1)) })} /></td>
          <td>每日</td>
        </>}</tr>)}</tbody></table></div>
    </>}
    {showRewards && <div className="table-wrap"><table><thead><tr><th>任务名称</th><th>状态</th><th>金币奖励</th><th>宝石奖励</th><th>操作</th></tr></thead><tbody>{missions.map((mission) => <tr key={mission.id}>{mission.expired
      ? <><td>{mission.name}</td><td><Status>{mission.status}</Status></td><td>{mission.coinReward}</td><td>{mission.gemReward}</td><td>—</td></>
      : <>
        <td>{mission.name || '（未命名任务）'}</td>
        <td><Status>{mission.status}</Status></td>
        <td><input className="ladder-input" type="number" min="0" aria-label={`${mission.id}金币奖励`} value={mission.coinReward} onChange={(event) => updateMission(mission.id, { coinReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td><input className="ladder-input" type="number" min="0" aria-label={`${mission.id}宝石奖励`} value={mission.gemReward} onChange={(event) => updateMission(mission.id, { gemReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td><button type="button" className="row-action" aria-label={`${mission.status === '生效中' ? '下线' : '上线'}任务${mission.name || mission.id}`} onClick={() => updateMission(mission.id, { status: mission.status === '生效中' ? '已下线' : '生效中' })}>{mission.status === '生效中' ? '下线' : '上线'}</button>{!isLiveTask(mission) && <button type="button" className="row-action" aria-label={`移除任务${mission.name || mission.id}`} onClick={() => onChange(missions.filter((item) => item.id !== mission.id))}>移除</button>}</td>
      </>}</tr>)}</tbody></table></div>}
  </>
}

const WHEEL_SEGMENT_COLORS = ['#eef3ff', '#dfe8ff', '#eef3ff', '#dfe8ff', '#eef3ff', '#dfe8ff', '#eef3ff', '#dfe8ff']

function PreviewFrame({ title, hint, children, note }) {
  return <div className="preview-frame">
    <div className="preview-head"><span className="preview-badge"><Icon name="eye" />玩家看到的样子</span><strong>{title}</strong>{hint && <small>{hint}</small>}</div>
    <div className="preview-body">{children}</div>
    {note && <p className="preview-note">{note}</p>}
  </div>
}

export function WheelPreview({ prizes, freeSpins }) {
  const label = (prize) => (prize.kind === 'freeSpin' ? `×${prize.amount}` : Number(prize.amount).toLocaleString('en-US'))
  const unit = (prize) => (prize.kind === 'freeSpin' ? '免费旋转' : prize.kind === 'gems' ? '宝石' : '金币')
  const slice = prizes.length ? 360 / prizes.length : 360
  const gradient = prizes.map((prize, index) => `${WHEEL_SEGMENT_COLORS[index % WHEEL_SEGMENT_COLORS.length]} ${index * slice}deg ${(index + 1) * slice}deg`).join(', ')
  return <PreviewFrame title="幸运转盘" hint={`每日 ${freeSpins} 次免费`} note="扇区顺序即玩家看到的顺序（从正上方顺时针）。概率不显示给玩家，但决定实际中奖分布。">
    <div className="wheel-preview"><div className="wheel-disc" style={{ background: `conic-gradient(${gradient})` }}>
      {prizes.map((prize, index) => <span key={prize.id ?? index} className="wheel-slot" style={{ transform: `rotate(${index * slice + slice / 2}deg) translateY(-64px) rotate(${-(index * slice + slice / 2)}deg)` }}><b>{label(prize)}</b><small>{unit(prize)}</small></span>)}
      <span className="wheel-hub">{freeSpins}</span>
    </div><ol className="wheel-legend">{prizes.map((prize, index) => <li key={prize.id ?? index}><span className="wheel-legend-index">{index + 1}</span><span>{label(prize)} {unit(prize)}</span><b>{prize.probability}%</b></li>)}</ol></div>
  </PreviewFrame>
}

export function CheckinPreview({ days }) {
  const stateText = { claimed: '已领取', missed: '漏签', today: '今日可领', locked: '尚未解锁' }
  return <PreviewFrame title="七日签到" hint={`满签 ${days.reduce((sum, day) => sum + Number(day.coins || 0), 0).toLocaleString('en-US')} 金币 / ${days.reduce((sum, day) => sum + Number(day.gems || 0), 0)} 宝石`} note="玩家按自然日领取，漏签不可补。大奖日会有额外的视觉强调。">
    <div className="checkin-preview">{days.map((day) => <div className={`checkin-cell state-${day.state}${day.grand ? ' is-grand' : ''}`} key={day.day}><strong>{day.day}{day.state === 'today' && ' · 今日'}{day.grand && ' · 大奖'}</strong><span>{Number(day.coins || 0).toLocaleString('en-US')} 金币{day.gems ? ` · ${day.gems} 宝石` : ''}</span><small>{stateText[day.state] ?? day.state}</small></div>)}</div>
  </PreviewFrame>
}

export function MissionsPreview({ missions }) {
  const live = missions.filter((mission) => mission.status === '生效中')
  return <PreviewFrame title="每日任务" hint={`${live.length} 个任务对玩家可见`} note="已下线与已过期的任务不出现在玩家侧。进度由服务端按事件累计，这里显示的是达成后的样子。">
    <div className="missions-preview">{live.length ? live.map((mission) => <div className="mission-cell" key={mission.id}><div><strong>{mission.name || '（未命名任务）'}</strong><small>{mission.event} · 目标 {mission.target}</small></div><span className="mission-bar"><i style={{ width: '45%' }} /></span><b>{Number(mission.coinReward || 0).toLocaleString('en-US')} 金币{mission.gemReward ? ` + ${mission.gemReward} 宝石` : ''}</b></div>) : <p className="audit-item"><Icon name="eye" /><span>没有生效中的任务，玩家侧的任务区块会是空的</span></p>}</div>
  </PreviewFrame>
}
