# 后台第三轮 + 个人页合并 任务清单

状态：未开始 / 进行中 / 待验证 / 审查未通过 / 已完成

## 1. 待处理事项：让"处理"可执行 —— 已完成（浏览器验证通过）
- [x] todo 记录增加 link、claimedBy、resolution
- [x] 种子待办与 journal.addTodo/queuePublish 补 link
- [x] 独立 TodoPage：状态含义说明 + 6 个筛选 + 优先级排序 + 行内"去处理"
- [x] 抽屉：认领 / 去处理 / 标记已解决(需填结论) / 转交他人
- [x] 游戏脱离维护态时自动解决对应待办
- [x] 顺带修复：抽屉打开后不随 store 刷新的缺陷（认领后仍显示旧状态）；只读字段改为直接读数据源

## 2. 发布审核：查看具体配置 —— 已完成（浏览器验证通过）
- [x] adminRules 增加 snapshotDiff + 3 项单测（含改名按 gameId 归位、新增/移除标记）
- [x] 发布任务详情渲染逐字段差异，改动项高亮，无快照任务显示明确说明
- [x] "查看来源配置"跳转按钮（需给所有页面包装组件透传 navigate）

## 3. 游戏管理：抽屉改弹窗 + 全字段
- [ ] 游戏记录补 sortWeight/maintenanceNote/launchAt/cover/minBet/paylines/volatility
- [ ] GameEditModal 分组：基础/运行状态/大厅展示/老虎机参数/操作记录
- [ ] 前台未接入字段明确标注，不编造数值

## 4. 活动管理：按类型区分弹窗
- [ ] 抽取 CheckinLadderEditor / WheelPrizeEditor / MissionListEditor 共用组件
- [ ] 子页面改用共用组件
- [ ] ActivityModal 按 type 内嵌对应编辑器 + 共通字段

## 5. 个人页：战绩与流水合并
- [ ] 流水条目补游戏名（game_reward/game_cost）
- [ ] WalletLedger 增加类型筛选（全部/游戏/奖励）
- [ ] 最近战绩卡片改读流水的游戏类记录
- [ ] 删除 data.js recentRecords
- [ ] 补 i18n 英文翻译

## 收尾
- [ ] lint + test + build + check:dist
- [ ] 浏览器逐条走查并截图
- [ ] 更新 plans/lobby-admin-lite-v1.md
