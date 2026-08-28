# Joyloop 部署到 Cloudflare Pages

## 直接上传压缩包

使用 Node.js 22.12 或更新版本、系统 `zip` / `unzip`，在 `client` 目录执行：

```bash
npm ci
npm run package:pages
```

脚本会在仓库根生成 `artifacts/joyloop-cf-pages-<date>-<gitshort>.zip`，以及 SHA-256 和 manifest 清单。ZIP 通过完整性测试，解压后逐文件哈希与构建输出比对；源代码、依赖、旧版页面和本机配置不会进入压缩包。

在 Cloudflare 控制台进入 **Workers & Pages → 创建 Pages 应用 → Direct Upload / 直接上传**，填写站点名并上传 ZIP，最后确认部署。已有 Direct Upload 项目可创建新部署上传。ZIP 顶层就是 `index.html`，没有多余的 `dist` 外壳；控制台也支持上传解压后的整个目录。[官方直接上传说明](https://developers.cloudflare.com/pages/get-started/direct-upload/)

注意：已有 Git 集成项目不提供控制台拖拽上传；应使用下方 Git 构建流程，或另建 Direct Upload 项目。不要为上传本包切换或覆盖已有生产项目。

结构示例（哈希文件名每次构建可能不同）：

```text
index.html
lobby.html
games.html
tournaments.html
events.html
store.html
profile.html
_headers
assets/
  main-<hash>.js
  main-<hash>.css
  joyloop.svg
```

可使用同目录的 `.sha256` 文件核对 ZIP 完整性；manifest 中 `sourceCommit` 应与交付提交一致，`dirty: false` 表示包来自干净的已提交源码。

## Git 集成部署

项目根目录选择 `client`，配置如下：

| 项目 | 值 |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Build output directory | `dist` |

`.nvmrc` 选择 Node 22。当前交付分支为 `joyloop`；选择生产分支还是预览分支由站点负责人决定，本项目脚本不会修改 Cloudflare 账号或域名设置。

## 本地预览

生产构建后运行 `npm run preview`，或使用任意静态 HTTP 服务提供 `client/dist`。不要直接双击 HTML；`file://` 会限制模块脚本加载。

## 范围与边界

这是纯静态演示，提供简体中文和英文。除了语言偏好，交互状态只保存在当前页面内存中，不是真实支付、鉴权、订单或服务端账本。响应头默认禁止 iframe 嵌入；如需宿主嵌入，须先明确允许域名再调整安全策略。正式接入仍需后端、身份认证、支付风控、持久化和错误恢复。
