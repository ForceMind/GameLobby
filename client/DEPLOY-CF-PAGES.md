# Joyloop 部署到 Cloudflare Pages

本项目是静态 React/Vite 站点，不需要 Pages Functions 才能展示页面。

## 待部署：2026-09-09 · v0.3.6

- 仓库提交 `a1837123ef8ed3775b7818ca60d7c62ad43626cf` 已推送并回读一致。
- 目标为既有 `joyloop / lobby-admin-lite-v1` 分支预览。
- ZIP：`artifacts/joyloop-cf-pages-2026-09-09-a183712.zip`；19文件，SHA-256 `b98e91cb72ab9a03de79afb8659407dc8ea6b131e9a229d6bd5b059c924ec3c8`。
- 新入口：`start-v0.3.6-e30875f30b9c8712.html`；117项测试及产物校验通过。
- **尚未上传**：上传命令被自动审批拒绝，要求用户明确授权该具体外部目的地。线上版本保持原状。获准后使用此完整产物部署，再进行线上资源与浏览器回读。
- 部署前最新记录为 `e5a07981`（源码 `2c63152`），是此前的v0.3.5分支预览；下方v0.3.4及更早记录为历史记录。


## 历史部署：2026-09-09 · v0.3.4

- 源码：`9d46fa797b9359cee487c556efdb6df0bc737d11`，包含后台编辑改造提交`3caeee2`及玩家游戏大厅UI规范。
- 项目/分支：`joyloop` / `lobby-admin-lite-v1`；main生产不改动。Wrangler版本4.130.0。
- 唯一部署：https://6af785d5.joyloop.pages.dev
- 新入口：https://lobby-admin-lite-v1.joyloop.pages.dev/start-v0.3.4-aede0233d2155e4b.html
- 游戏大厅UI规范：https://lobby-admin-lite-v1.joyloop.pages.dev/docs.html#ui-spec ，仅含通用规范、五个玩家模块和阅读入口，共7份Markdown。
- 产物：`artifacts/joyloop-cf-pages-2026-09-09-9d46fa7.zip`，19文件，SHA-256 `b3e5f0b0c87d052ffbf5619f57b6ee0b26c167ae703ef9d6cfdc5bf2475394c6`。
- 验证：99/99测试、lint/build/check:dist通过。线上18个可访问文件哈希一致，no-store、JS/CSS MIME和缺失脚本404通过；证据为`artifacts/pages-v0.3.4-online-verification.json`。
- 线上实际检查：游戏编辑按钮在可见操作列；签到页无直接数字编辑，编辑打开奖励/规则/预览标签弹窗；文档展示7份玩家大厅规范。
- UI交接包：本地`artifacts/joyloop-game-lobby-ui-v0.3.4.zip`，保留7份规范的目录结构，逐文件解压核对通过。
- manifest如实为dirty：仅保留的未跟踪交接文件未提交，它未被打包或上传。后续发布记录只改仓库Markdown，不改变部署源码或规范内容。
- 回退参考：上一部署 https://472bcf1e.joyloop.pages.dev 。

## 上一部署：2026-09-08 · v0.3.3

- 源码：`4c302eb75a55626c9cf8a63d137d1e9aa796b25a`。修复说明首页默认中文、固定比例变窄、游戏脱离设备框及圆角/安全区。
- 项目与分支：`joyloop` / `lobby-admin-lite-v1`，保持现有分支预览发布，不改main生产。
- 唯一部署：https://472bcf1e.joyloop.pages.dev
- 分支入口：https://lobby-admin-lite-v1.joyloop.pages.dev/start-v0.3.3-7c1915c7e8589465.html
- ZIP：`artifacts/joyloop-cf-pages-2026-09-08-4c302eb.zip`，18文件，SHA-256 `c3e325ba6f5df669ee1350ec3b5903b4a826bccc3dafe204d40da4d6571f1825`。
- 验证：98项测试、lint、build、check:dist及ZIP校验通过；线上17个可访问文件的哈希、no-store、JS/CSS MIME与缺失脚本404通过，记录在 `artifacts/pages-v0.3.3-online-verification.json`。
- 线上浏览器实测：无lang新入口为中文；1440×800下18:9为368×736、21:9为315.42×736；圆角16px；加载/游玩的四边与手机框一致，关闭按钮顶部24px、右侧12px，关闭后比例保持。
- manifest仍如实标为dirty，因为原交接文件未跟踪且保留；文件不在部署目录中。部署后的Markdown记录不改变已发布静态产物。
- 回退参考：上一版 https://72e250f9.joyloop.pages.dev 。需回退时重发对应旧产物到同一分支，不能仅更换提交标签。

## 上一部署：2026-09-08 · v0.3.2

- 发布范围：现有 `joyloop` 项目的 `lobby-admin-lite-v1` 分支预览，未改动 `main` 生产部署。
- 源码提交：`26815bd8d118add3cd861f441dd9b07c9385881a`，包含游戏进入门槛、运营标签、宿主缺字段拦截和紧急运行状态保护。
- 分支地址：https://lobby-admin-lite-v1.joyloop.pages.dev
- 本次唯一地址：https://72e250f9.joyloop.pages.dev
- 新入口：https://lobby-admin-lite-v1.joyloop.pages.dev/start-v0.3.2-aff142a9edf57080.html
- 上一部署：https://3eaaf1c2.joyloop.pages.dev ，对应 `09a180d`，保留作回退参考。
- 发布工具：Wrangler 4.129.1；已确认本项目没有 Git 自动构建，GitHub 同步与 Pages 上传分别执行。
- 校验包：`artifacts/joyloop-cf-pages-2026-09-08-26815bd.zip`，SHA-256 为 `8a2ffb252c0a40b4d8a5643c82807bf7045e43a8b9833da8cde77c07b576fd8b`。
- 包含 18 个文件。manifest 的 `dirty: true` 来自保留的未跟踪交接文件，全部受版本管理的源码已提交；交接文件未进入 ZIP 或部署目录。

本次部署复用已通过 lint、97 项测试、build 的产物，并再次执行 `check:dist` 和 ZIP 文件级校验。线上浏览器已核对 v0.3.2、财富门槛禁用开始、家族游戏进入、后台两列与示例值、文档第一期已实现状态。部署后的文档提交仅更新仓库 Markdown 发布记录，不改变本次静态产物的源码提交。

线上 HTTP 校验：除由 Pages 解析的 `_headers` 外，17 个文件的 SHA-256 与 manifest 一致；页面、脚本、样式均带 `Cache-Control: no-store`，JS/CSS MIME 正确；不存在的脚本返回 404。明细保存在本地 `artifacts/pages-v0.3.2-online-verification.json`。Pages 会将 `.html` 重定向到无扩展名地址，校验已跟随重定向。

```bash
cd client
npx --yes wrangler pages deploy dist --project-name=joyloop --branch=lobby-admin-lite-v1 --commit-hash=26815bd8d118add3cd861f441dd9b07c9385881a --commit-dirty=true --commit-message="v0.3.2: enforce game entry gates and preserve emergency controls"
```

上面的命令记录本次发布，重发其他版本时必须重新核对源码、dist 和提交号，不应沿用旧哈希给新产物做标记。回退时使用旧版本产物重新部署到同一分支，保留生产分支边界。

## 实际部署方式：本机 wrangler 命令行

**这是本项目实际在用的部署方式**，不是下文的 Git 集成（未配置）。Cloudflare Pages 项目名为 `joyloop`，账号为 `wxx110007@gmail.com`（本机已通过 `wrangler login` 存有 OAuth Token，见 `~/Library/Preferences/.wrangler/config/default.toml`）。每个分支部署后可通过分支别名 `https://<分支名>.joyloop.pages.dev` 访问，`main` 对应生产环境。

```bash
cd client
npm run build
npx wrangler pages deploy dist --project-name=joyloop --branch=<分支名> --commit-dirty=true --commit-message="<说明本次改动>"
```

- `--branch` 必须显式指定为当前 git 分支名，否则 wrangler 会用它自己检测到的分支名，可能与预期的预览别名不一致。
- `--commit-dirty=true` 允许在本地有未提交改动时也能部署；分支本身已提交时也可以保留这个参数，不影响结果。
- 部署完成后终端会打印两个地址：`https://<随机 ID>.joyloop.pages.dev`（这次部署的唯一地址）和 `Deployment alias URL: https://<分支名>.joyloop.pages.dev`（该分支当前生效的预览地址，同一分支重复部署会覆盖别名指向的内容）。
- 排查"部署了但预览没变"时，先跑 `npx wrangler whoami` 确认还在登录状态，再用 `npx wrangler pages deployment list --project-name=joyloop` 看最近部署记录（含对应的 git commit、时间、部署地址），不要假设走的是 Git 自动构建。
- `npx wrangler` 首次调用会现下载 wrangler 包（无全局安装），需要网络可达 registry。

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

脚本会在仓库根目录生成 `artifacts/joyloop-cf-pages-<date>-<gitshort>.zip`、SHA-256 文件和 manifest。ZIP 顶层直接包含八个页面 HTML、当前版本的新入口、`404.html`、`assets/` 和 `_headers`，没有多余的 `dist/` 外壳。

在 Cloudflare 控制台进入 **Workers & Pages → 创建 Pages 应用 → Direct Upload / 直接上传**，上传 ZIP 并确认部署。已有 Git 集成项目不能用控制台拖拽覆盖，应使用 Git 构建流程，或另建 Direct Upload 项目。[Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

```bash
cd ../artifacts
shasum -a 256 -c joyloop-cf-pages-<date>-<gitshort>.zip.sha256
unzip -l joyloop-cf-pages-<date>-<gitshort>.zip
```

把占位文件名替换为本次交付的文件名。manifest 中应确认 `dirty: false`，并核对 `sourceCommit`。

## Git 集成（未启用，仅作参考）

`joyloop` 项目当前**没有**配置 Cloudflare Pages 的 Git 集成——推送到 GitHub 不会触发自动构建，实际部署方式见上一节的 wrangler 命令行。以下设置是若未来要切换成 Git 集成时的参考值，不代表当前状态。

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
