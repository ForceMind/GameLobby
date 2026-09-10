// 后台功能的交付分期。后台侧边栏、页头和说明文档都从这里读，避免三处各写
// 一份而慢慢对不上。
//
// 分期的依据是依赖关系，不是页面数量：一期只需要后台自己就能跑通；二期要接
// 支付与活动结算；三期要接财务对账和客户端构建/分发，依赖最重，所以排最后。
export const PHASES = {
  1: {
    label: '一期',
    name: '基础大厅运营',
    summary: '把玩家在大厅里看到的东西管起来：游戏目录、文案、赢家展示、玩家与后台权限。游戏配置与文案在原型中仍走草稿审核，运行状态和维护公告单独即时生效。最小审核、权限与审计是否作为一期前置依赖待评审；当前分期标签不代表生产能力已经接入。',
  },
  2: {
    label: '二期',
    name: '活动与商业化',
    summary: '接上会花钱和发奖励的部分：签到、转盘、任务三类活动，以及商品、权益与订单，依赖支付通道和活动结算服务。同时把待处理事项和发布审核这套完整的流转系统补上——状态多、涉及草稿/灰度/回滚，是最复杂的一块，跟活动一起统一验证更划算。',
  },
  3: {
    label: '三期',
    name: '资金流水与版本发布',
    summary: '依赖外部系统的重能力：钱包流水要和财务对账系统打通，游戏版本发布要接包上传、校验与灰度分发。',
  },
}

export const modulePhase = {
  dashboard: 1,
  audit: 1,
  games: 1,
  categories: 1,
  wins: 1,
  players: 1,
  translations: 1,
  adminUsers: 1,
  // 待处理事项和发布审核合在一起是一套完整的草稿/灰度/回滚流转系统，比其余
  // 一期模块重得多，挪到二期跟活动一起做。
  todo: 2,
  publish: 2,
  activities: 2,
  checkin: 2,
  wheel: 2,
  missions: 2,
  store: 2,
  orders: 2,
  ledger: 3,
  versions: 3,
  // 版本发布内部的四个标签页，与 versions 同期
  uploads: 3,
  test: 3,
  production: 3,
}

// 没登记的模块按一期处理：新增页面默认属于当前正在交付的这一期，
// 漏登记时不会被误标成"以后才做"。
export function phaseOf(moduleId) {
  return modulePhase[moduleId] ?? 1
}
