# Joyloop 静态游戏大厅

当前维护版本为 `client/` 中的 **v0.1.0 静态交互演示**。支持简体中文与英文，包含大厅、全部游戏、赛事、活动、商城、个人中心六个页面，可独立部署到 Cloudflare Pages。

```bash
cd client
npm ci
npm run dev
```

验收与打包：

```bash
npm run verify
npm run package:pages
```

部署 ZIP、SHA-256 和文件清单生成在仓库根目录 `artifacts/`。该目录不提交 Git；包内只有预构建网站文件，顶层直接包含 `index.html`。

## 阅读路径

- 使用、语言与代码结构：[client/README.md](client/README.md)
- 直接上传 ZIP / Git 集成：[部署指南](client/DEPLOY-CF-PAGES.md)
- 操作契约、测试与限制：[验收报告](client/QA.md)
- 两版原型差异及待确认产品规则：[原型评审](plans/joyloop_static_review.md)

## 交付边界

按钮具备页面跳转、筛选、对话框、表单或本地状态反馈；已领取、已报名、过期和次数耗尽等操作明确禁用。游戏详情不启动游戏引擎；支付、账号、资产和赛事结算不连接真实服务。所有数字均为演示数据。

`index_old.html`、`css_old/`、`js_old/`、`client/src/components/` 和 `client/src/legacy/` 属于早期实现，不进入当前页面入口。不要将旧翻译文件中的语种误认为当前发布版本已支持的语言。
