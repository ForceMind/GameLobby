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

## 3. 游戏管理：抽屉改弹窗 + 全字段 —— 已完成（浏览器验证通过）
- [x] 游戏记录补 cover/sortWeight/maintenanceNote/launchAt/minBet/paylines/volatility
- [x] GameEditModal 宽弹窗，5 个分组共 21 个字段；非 slots 游戏自动隐藏 Slots 分组
- [x] 前台未接入字段标注「前台未接入」并留空，不编造数值
- [x] 校验：维护中必须填公告、即将上线必须填时间、热度 0–100、排序权重 >0
- [x] 保存路径分离：状态/公告立即生效并建待办，其余字段进草稿走审核
- [x] 顺带修复：发布差异对游戏目录只比对汇总串，改为逐字段（161 项）并折叠未改动项

## 4. 活动管理：按类型区分弹窗 —— 已完成（浏览器验证通过）
- [x] 抽取 CheckinLadderEditor / WheelPrizeEditor / MissionListEditor 三个共用组件
- [x] 签到/转盘/任务三个子页面改用共用组件，与弹窗共享同一份草稿
- [x] ActivityModal 按 type 切换编辑器：转盘=8 格奖项概率、签到=7 天梯度、任务=任务表
- [x] 活动信息共通字段：名称/类型(只读)/周期/适用人群/预算/负责人/状态(只读)/参与人数(只读)
- [x] 弹窗内保存才写入草稿并提交审核，取消真正丢弃；活动页加类型说明卡

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
