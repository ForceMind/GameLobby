# Joyloop 部署到 Cloudflare Pages

本项目是静态 React/Vite 站点，不需要 Pages Functions 才能展示页面。当前未代为创建 Cloudflare 项目或执行线上部署。

## v0.3.1 中奖列表、直播入口与白屏修正包

1. 将新 ZIP **完整上传为一次新部署**，不要只替换 HTML 或混用旧版 assets。
2. 部署成功后从本次 ZIP 的文件列表复制 `start-v0.3.1-<随机后缀>.html` 打开；不要手输旧入口。这个 URL 和资源目录每次构建都会变化，不复用旧首页缓存。
3. Network 中应请求 `/assets/release-0.3.1-<同一随机后缀>/main-*.js`，状态 200、Content-Type 为 JavaScript，响应不是 HTML。样式同目录且为 `text/css`。
4. 新包的所有响应应带 `Cache-Control: no-store`。如果自定义域名有强制缓存、Worker 或重写规则，检查它们是否覆盖 Pages 行为；必要时针对该站点旧缓存 URL 清除缓存，避免影响其他站点。
5. 请求一个确定不存在的脚本，例如 `/assets/release-0.3.1/not-present.js`，应得到 404，而不是首页 200。404 的 HTML 内容是正常错误页，不能将它伪装为 JavaScript。

根目录 `404.html` 用于关闭 Pages 默认的 SPA 首页回退；业务页均有真实 HTML 文件，原有前端 History 导航不受影响。参见 [Pages 路由与缓存说明](https://developers.cloudflare.com/pages/configuration/serving-pages/)。新包无法清除手机此前已经缓存的响应，也无法修改账号级缓存规则；若新入口仍失败，记录失败请求的完整 URL、状态码与响应类型。

## 直接上传 ZIP

在 `client` 目录执行：

```bash
npm ci
npm run package:pages
```

脚本会在仓库根目录生成 `artifacts/joyloop-cf-pages-<date>-<gitshort>.zip`、SHA-256 文件和 manifest。ZIP 顶层直接包含七个页面 HTML、当前版本的新入口、`404.html`、`assets/` 和 `_headers`，没有多余的 `dist/` 外壳。

在 Cloudflare 控制台进入 **Workers & Pages → 创建 Pages 应用 → Direct Upload / 直接上传**，上传 ZIP 并确认部署。已有 Git 集成项目不能用控制台拖拽覆盖，应使用 Git 构建流程，或另建 Direct Upload 项目。[Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

```bash
cd ../artifacts
shasum -a 256 -c joyloop-cf-pages-<date>-<gitshort>.zip.sha256
unzip -l joyloop-cf-pages-<date>-<gitshort>.zip
```

把占位文件名替换为本次交付的文件名。manifest 中应确认 `dirty: false`，并核对 `sourceCommit`。

## Git 集成

| 设置                   | 值                |
| ---------------------- | ----------------- |
| Root directory         | `client`          |
| Build command          | `npm run build`   |
| Build output directory | `dist`            |
| Node.js                | 22（见 `.nvmrc`） |

官方说明：[Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)。本项目脚本不会修改 Cloudflare 账号、域名或分支设置。

## 本地预览

```bash
npm run build
npm run preview
```

也可以使用任意静态 HTTP 服务提供 `dist/`。不要直接双击 HTML；`file://` 可能阻止模块脚本和相对入口正常加载。

## 响应头和宿主尺寸

`public/_headers` 会复制到 `dist/_headers`。当前策略允许顶层原生 WebView 和同源 iframe（`X-Frame-Options: SAMEORIGIN`）；跨源 iframe 需明确允许域名并同步调整 CSP、宿主 App 和安全策略。格式见 [Headers](https://developers.cloudflare.com/pages/configuration/headers/)。

原生 WebView 的半屏/全屏尺寸不是 Pages 能决定的：CSS 只能使用 WebView 已分配的视口。需要真实容器扩展时，原生 App 必须响应 `setDisplayMode`，详见 [HOST-INTEGRATION.md](HOST-INTEGRATION.md)。

## 上线前

- 先通过 `npm run verify` 和 `npm run package:pages`。
- 确认宿主注入账号、余额和请求桥接；没有桥接时购买保持失败/不可用。
- 确认服务端按 SKU 重算价格和到账，宿主对 `requestId` 去重。
- 不要把静态前端显示的余额、价格或状态当作账本事实。
