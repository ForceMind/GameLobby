# Joyloop 游戏大厅

Joyloop 是一个可部署到 Cloudflare Pages 的 React + Vite 内嵌 H5 游戏大厅，当前维护版本为 **v0.2.0**。支持简体中文与英文，包含大厅、全部游戏、赛事、活动、商城和个人中心六个页面；加上首页别名，共七个静态 HTML 入口。

```bash
cd client
npm ci
npm run dev
npm run verify
npm run package:pages
```

部署包、SHA-256 和 manifest 会生成在仓库根目录 `artifacts/`（该目录不提交 Git）。

## 阅读路径

- 页面结构、运行与维护：[client/README.md](client/README.md)
- Cloudflare Pages 上传与 Git 构建：[部署指南](client/DEPLOY-CF-PAGES.md)
- 宿主 App 身份、容器尺寸与购买回调：[宿主接入契约](client/HOST-INTEGRATION.md)
- 交互验收、测试和已知边界：[client/QA.md](client/QA.md)
- 原型吸收与待确认规则：[原型评审](plans/joyloop_static_review.md)

## 当前交付边界

首次进入会展示说明与同意入口，默认进入 1:1 半屏大厅；也可选择全屏。金币、宝石、导航、筛选、弹窗和商城购买按钮均可交互。可进入的游戏会经历加载页面，再进入全屏游戏界面；加载页左上角返回大厅，游戏页右上角关闭并恢复进入前模式。

本仓库实现静态前端交互和宿主桥接边界。没有宿主桥时，购买不会伪造成功；账号、余额、真实订单、扣款、游戏引擎、赛事结算和持久化仍由 App / 服务端接入。身份由内置 App 管理，页面不提供独立退出登录。

## 旧文件

`index_old.html`、`css_old/`、`js_old/`、`client/src/components/` 与 `client/src/legacy/` 属于早期资料，不是当前页面入口；旧资料中的文案和语种不代表当前发布版本。
