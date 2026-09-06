# 第四轮复核问题修复任务清单（2026-09-06）—— 已完成

## 决策（已定并实施）
- [x] 未知国家改为 fail-closed：`demoModel.js: regionAllows`，未知国家 + 白名单模式一律不可见；
      `data.js`/`admin/adminRules.test.js` 中依赖旧行为的用例已同步更新；`DocsPage.jsx` 矛盾表述已改正
- [x] 语言选择器加入 `ProfileSettings.jsx` 作为正式入口（浮层原型开关继续保留）
- [x] `publishedConfig.js` 补注释，说明对应后端"已发布配置"接口契约
- [x] 24 语打包方式不动（已有 512KB 守卫，当前打包体积远低于阈值）

## 必须处理（blocker）—— 全部完成并复测通过
- [x] 1. 游戏说明/中奖区间迁入多语言目录（`games.desc.<id>` / `games.winRangeValue`），
      `liteContent.json` 只存键与数值；后台游戏弹窗改为只读预览 + 跳转多语言内容编辑
- [x] 2. 商城购买文案（成功/取消/失败/确认中/回执标题详情）+ 钱包 aria-label 迁入既有/新增稳定键
- [x] 3. 地区白名单补齐三处漏检：`App.jsx: playWin`、`H5Provider.jsx: openGame`（兜底）、
      `GameCatalog.jsx: RecentGames`
- [x] 4. 活动地区在前台生效：`EventsPage.jsx` 按 `activityRegions` 隐藏对应区块（含 half/full 两种模式），
      三者全不可用时显示空状态

## 建议处理 —— 全部完成并复测通过
- [x] 5. 活动地区改为模块快照的一部分（`wheelRegion`/`checkinRegion`/`missionsRegion`），
      随奖励配置一起走草稿 → 审核 → 发布，不再是独立的"活动信息"即时字段
- [x] 6. `ActivityModal` 内嵌 `PreviewEditSwitch` + 对应类型的预览组件，默认打开预览
- [x] 7. 5 处硬编码英文装饰文案（STORE·SECURE CHECKOUT / MONTHLY PASS / REWARDS·DAILY PLAY /
      GAME LIBRARY / WELCOME BACK）+ 品牌 slogan 迁入目录
- [x] 9. CSV 导入改为「解析预览 → 语言不一致强提示 + 勾选确认 → 提交」，不再选完文件即刻覆盖
- [x] 10. 翻译页加"只看已改动"过滤，逐行标记"已改动"

## 验证
- [x] lint + test（79/79）+ build 全过
- [x] 逐条用复核时的同一方法重新验证：
  - 游戏说明/中奖区间：`translate()` 直接调用复测，ja/ar/es 回退英文，非中文键消失
  - 商城/钱包文案、硬编码英文：`translate()` 复测
  - 地区白名单：`games.html` 实测 US/JP/无国家三种场景，`events.html` 实测 fail-closed +
    全部限制时的空状态（临时改配置验证后已还原默认值）
  - 活动地区治理与预览：后台实测编辑→审核通过→生效版本更新的完整链路
  - CSV 导入：用 `DataTransfer` 模拟文件选择，验证语言不一致拦截、勾选解锁、匹配时正确导入
  - 语言入口：`profile.html` 设置弹窗内实测切换语言生效
- [x] 浏览器全程无控制台报错

## 明确记录、不在本轮处理的既有限制
- "新用户首周礼"与"七日签到·秋日版"两个活动记录共享同一个 `checkin` 模块配置
  （包括地区），编辑其中一个会影响另一个——这是本轮之前就存在的设计（多个同类型活动共用
  一份奖励配置），本轮新增的地区字段延续了同样的共享方式，没有让它变得更差，但也没有修复。
  如需要每个活动独立配置，需要把 `moduleKeys`/`getSlice` 从"按类型"改为"按活动实例"，
  属于更大的架构调整，未包含在本轮范围内。
- winner feed/最近在玩里被地区屏蔽的游戏，"玩"按钮仍会展示（点击后被 `playWin`/`openGame`
  拦截并提示"暂不可玩"），未做成按钮本身消失——发生频率低（默认数据里没有命中场景），
  且拦截已经生效，未进一步打磨。
