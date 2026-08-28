# Joyloop 游戏大厅

Joyloop 是一个可部署到 Cloudflare Pages 的 React + Vite 内嵌 H5 游戏大厅，当前维护版本为 **v0.2.1 高保真原型**。支持简体中文与英文，包含大厅、全部游戏、赛事、活动、商城和个人中心六个页面；加上首页别名，共七个静态 HTML 入口。

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

直接打开任意入口即可查看完整产品界面，没有说明页、同意门槛或缩放按钮。1:1 半屏是展示容器配置，不是用户界面上的开关。金币和宝石点击打开原地资产浮窗，不加“+”号，不跳转商城或首页；关闭后保留原页和滚动位置。可进入的游戏经历全屏加载后进入游戏；加载页左上角返回，游戏页右上角关闭并恢复原大厅形态。

本仓库实现静态前端交互和宿主桥接边界。没有宿主桥时，购买不会伪造成功；账号、余额、真实订单、扣款、游戏引擎、赛事结算和持久化仍由 App / 服务端接入。身份由内置 App 管理，页面不提供独立退出登录。

## 旧文件

`index_old.html`、`css_old/`、`js_old/`、`client/src/components/` 与 `client/src/legacy/` 属于早期资料，不是当前页面入口；旧资料中的文案和语种不代表当前发布版本。
