import { useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { CheckinLadderEditor, CheckinPreview, MissionListEditor, MissionsPreview, WheelPreview, WheelPrizeEditor } from './ActivityEditors.jsx'
import { getSlice, validateCheckin, validateMissions, validateWheel } from './adminRules.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

function checkinTabs(draft, onChange, errors) {
  return [
    { id: 'rewards', label: '奖励梯度', errors, content: <CheckinLadderEditor days={draft.checkinDays} onChange={(checkinDays) => onChange({ ...draft, checkinDays })} /> },
    { id: 'rules', label: '规则说明', content: <div className="admin-config-note"><div><strong>签到规则</strong><span>玩家按自然日领取，漏签不可补；必须且只能有一天为大奖，且大奖应位于最后一天。示例玩家进度只用于展示，不能在此修改。</span></div></div> },
    { id: 'preview', label: '效果预览', content: <CheckinPreview days={draft.checkinDays} /> },
  ]
}

function wheelTabs(draft, onChange, errors) {
  const prizeErrors = errors.filter((error) => error.includes('固定') || error.includes('奖励数量'))
  const ruleErrors = errors.filter((error) => !prizeErrors.includes(error))
  return [
    { id: 'prizes', label: '奖项配置', errors: prizeErrors, content: <WheelPrizeEditor prizes={draft.wheelPrizes} freeSpins={draft.wheelFreeSpins} section="prizes" onChange={({ prizes, freeSpins }) => onChange({ ...draft, wheelPrizes: prizes, wheelFreeSpins: freeSpins })} /> },
    { id: 'rules', label: '概率与次数', errors: ruleErrors, content: <WheelPrizeEditor prizes={draft.wheelPrizes} freeSpins={draft.wheelFreeSpins} section="rules" onChange={({ prizes, freeSpins }) => onChange({ ...draft, wheelPrizes: prizes, wheelFreeSpins: freeSpins })} /> },
    { id: 'preview', label: '效果预览', content: <WheelPreview prizes={draft.wheelPrizes} freeSpins={draft.wheelFreeSpins} /> },
  ]
}

function missionTabs(draft, onChange, removableIds, errors) {
  const detailsErrors = errors.filter((error) => error.includes('名称') || error.includes('目标值'))
  const rewardErrors = errors.filter((error) => error.includes('奖励'))
  return [
    { id: 'details', label: '任务信息', errors: detailsErrors, content: <MissionListEditor missions={draft.missions} removableIds={removableIds} section="details" onChange={(missions) => onChange({ ...draft, missions })} /> },
    { id: 'rewards', label: '奖励与状态', errors: rewardErrors, content: <MissionListEditor missions={draft.missions} removableIds={removableIds} section="rewards" onChange={(missions) => onChange({ ...draft, missions })} /> },
    { id: 'preview', label: '效果预览', content: <MissionsPreview missions={draft.missions} /> },
  ]
}

export default function ActivityRewardDialog({ moduleId, store, onSave, onClose }) {
  const [initialSavedDraft] = useState(() => clone(getSlice(store, moduleId)))
  const [draft, setDraft] = useState(() => clone(initialSavedDraft))
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialSavedDraft)
  const errors = moduleId === 'checkin'
    ? validateCheckin(draft.checkinDays)
    : moduleId === 'wheel'
      ? validateWheel({ prizes: draft.wheelPrizes, freeSpins: draft.wheelFreeSpins })
      : validateMissions(draft.missions)
  const tabs = moduleId === 'checkin'
    ? checkinTabs(draft, setDraft, errors)
    : moduleId === 'wheel'
      ? wheelTabs(draft, setDraft, errors)
      : missionTabs(draft, setDraft, store.live.missions.map((mission) => mission.id), errors)
  const title = moduleId === 'checkin' ? '编辑签到奖励' : moduleId === 'wheel' ? '编辑幸运转盘' : '编辑每日任务'
  const subtitle = moduleId === 'wheel' ? `保存后将创建 v${store.live.wheelVersion + 1} 草稿，等待审核发布。` : '保存后才会更新活动草稿，页面生效版本保持不变。'
  const pending = store.publish.find((entry) => entry.sourceModule === moduleId && entry.status === '待审核')
  const footNote = pending
    ? `保存会替换旧待审核任务「${pending.name}」，新待审核任务包含整个活动模块草稿。`
    : '切换标签会保留当前未保存修改；关闭或取消不会写入活动草稿。'

  const save = () => {
    if (!dirty || errors.length > 0) return
    const snapshot = clone(draft)
    if (moduleId === 'wheel') snapshot.wheelVersion = store.live.wheelVersion + 1
    onSave?.(snapshot)
  }

  return <EditDialog
    eyebrow="活动中心 · 奖励配置"
    title={title}
    subtitle={subtitle}
    tabs={tabs}
    errors={errors}
    dirty={dirty}
    onClose={onClose}
    onSave={save}
    saveLabel="保存草稿并提交审核"
    footNote={footNote}
  />
}
