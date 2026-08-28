# Joyloop H5 宿主接入契约

本文面向内置 Joyloop H5 的原生 App 工程。静态页面可以独立预览，但真实的容器尺寸、账号身份、余额、支付和到账必须由宿主与服务端提供。

## 1. 注入公共上下文

页面打开即显示产品界面，不需要 H5 说明页或同意门槛。页面加载前，宿主可注入：

```js
window.JoyloopHost = {
  context: {
    account: {
      id: 'account-id',
      name: 'Player',
      avatar: 'https://cdn.example/avatar.png',
      level: 11,
    },
    wallet: {
      coins: 68000,
      gems: 84,
    },
  },
  // 接入时替换为原生适配器；未接入不可返回虚假的成功状态。
  request: async () => ({ status: 'unavailable' }),
}
```

公共字段只接受：

- `account.id/name/avatar`：非空字符串，最长 240 字符；`avatar` 可省略。
- `account.level`：1–999 的整数。
- `wallet.coins/gems`：非负安全整数。

页面会清理其他字段，不接收或传递 token。页面跳转后每个新文档都必须重新注入 `JoyloopHost`；余额或身份变化可发送：

```js
window.dispatchEvent(
  new CustomEvent('joyloop:context', {
    detail: {
      account: { id: 'account-id', name: 'New name' },
      wallet: { coins: 70000, gems: 90 },
    },
  }),
)
```

页面会把事件中的有效字段与当前公共上下文合并。App 负责登录、注销、身份切换和最终账本；H5 不提供独立退出登录。

## 2. 请求格式与状态

所有桥接请求都使用：

```js
{
  version: 1,
  requestId: 'unique-id',
  action: 'setDisplayMode' | 'closeLobby' | 'purchase',
  payload: { /* action-specific */ }
}
```

`requestId` 用于去重、日志和跟踪，不用于排序。宿主必须幂等处理重复请求，并只返回以下状态：`completed`、`cancelled`、`failed`、`unavailable`。H5 端等待最长 12 秒；超时只表示前端未得到结果，不取消底层操作，也不会自动重试或把购买显示为成功。宿主和服务端应通过 `requestId` 对账处理迟到结果；旧文档或已关闭 WebView 的回调必须丢弃。

浏览器或未接入宿主时，页面只发出本地 `joyloop:request` 事件；购买显示失败，窗口模式仅在当前浏览器视口内切换，不会使用通配符 `postMessage` 或网络请求冒充桥接。这个事件只用于观察请求，监听事件不能代替提供 `JoyloopHost.request()` 的结果回传。

## 3. 窗口模式

高保真原型没有进入说明、同意门槛或界面缩放按钮。默认填满当前视口；宿主/评审环境可通过 `mode=half` 指定 1:1 形态，`mode=full` 指定完整视口。该配置随本次会话导航保留，不是用户设置。资产按钮只打开原地浮窗，不请求窗口切换。

`setDisplayMode` 的 payload：

```js
{
  mode: 'half' | 'full',
  aspectRatio: 1 | null, // half 为 1；full 时为 null 或省略
  reason: 'lobby' | 'game' | 'return-to-lobby',
  revision: 1, // 正整数，单一 H5 文档内单调递增
  gameId: 'golden-pharaoh' // 仅 reason=game 时附带所选游戏 ID
}
```

- `half`：大厅使用 1:1 方形容器；前端目标边长为 `min(viewportWidth, viewportHeight, 640px)`。
- `full`：大厅或游戏使用宿主可提供的完整视口。
- 进入游戏发送 `full`；游戏关闭后按进入前模式发送 `half` 或 `full`。
- 模式请求由前端 dispatcher 串行发送，并且只保留最新的排队请求，避免快速切换产生过期窗口命令。
- 宿主在真正应用窗口状态前必须检查最新 `revision`；旧 revision 不得覆盖新状态。revision 只在同一 WebView 文档内有序，不能替代跨文档会话或 requestId。
- 宿主调整完原生容器后返回 `completed`；如果无法调整，返回 `failed` 或 `unavailable`。
- CSS 不能越出宿主已经分配的小 WebView。要实现真正半屏或全屏，原生 App 必须改变 WebView 容器的尺寸/约束。

示意适配器（生产环境仍需接入原生窗口 API）：

```js
let latestRevision = 0

window.JoyloopHost.request = async ({
  version,
  requestId,
  action,
  payload,
}) => {
  if (version !== 1) return { status: 'failed', code: 'unsupported-version' }
  if (action !== 'setDisplayMode') return { status: 'unavailable' }
  if (
    !Number.isSafeInteger(payload.revision) ||
    payload.revision <= latestRevision
  )
    return { status: 'cancelled', code: 'stale-revision' }
  latestRevision = payload.revision
  const layout = await prepareNativeLayout(payload.mode, payload.aspectRatio)
  return runOnNativeUiThread(() => {
    // 校验与最终尺寸写入必须在同一次原生 UI 操作内完成。
    if (!isCurrentWebViewDocument() || payload.revision !== latestRevision)
      return { status: 'cancelled', code: 'stale-revision' }
    applyPreparedLayout(layout)
    return { status: 'completed', requestId }
  })
}
```

以上为宿主适配伪代码：`prepareNativeLayout` 只准备布局，不修改窗口；`runOnNativeUiThread`、`isCurrentWebViewDocument` 和 `applyPreparedLayout` 由原生侧实现。真正写入尺寸前必须在原生 UI 线程检查当前文档和 revision，不能先调整窗口再在返回时检查。原生侧应把最新 revision 与对应 WebView 文档绑定，关闭或导航后作废旧文档。

## 4. 关闭大厅

```js
{ version: 1, requestId, action: 'closeLobby', payload: {} }
```

宿主收到后关闭当前 H5 容器或返回 App。大厅的返回 App/关闭控件只在宿主可用时提供；浏览器预览不应提供无效的退出动作。页面跳转到新的入口文档后，宿主必须重新注入 bridge/context。

## 5. 购买

```js
{
  version: 1,
  requestId,
  action: 'purchase',
  payload: {
    sku: 'coin-6',
    currency: 'USD',
    priceCents: 55,
    coins: 6000,
    gems: 2
  }
}
```

前端显示的价格只用于界面和请求提示，不是权威报价。宿主必须：

1. 按服务端 SKU 重新查询价格、活动资格和可购买数量，不信任前端 `priceCents/coins/gems`。
2. 在 App 的支付渠道完成授权，服务端以幂等的 `requestId` 创建/确认订单。
3. 只有确认扣款并完成服务端账本到账后，才返回 `completed`；用户取消返回 `cancelled`，风控、报价变化或其他错误返回 `failed`，暂不可用返回 `unavailable`。
4. 对超时、重复请求和迟到回调进行对账；H5 不会自动重试，也不应把前端 receipt 当作账本。

当前静态商品配置为 1 USD = 10,000 金币，四档折扣率 8%/18%/28%/40%，对应原价 $0.60/$3.00/$6.80/$12.80、折后 $0.55/$2.46/$4.90/$7.68。折扣率属于业务最终确认前的静态配置，不能替代服务端商品配置；折扣不增加金币百分比。

## 6. 资源与安全

原生 App 只能向受信任的大厅域名/文档注入桥接，并限制 WebView 导航目标。外部页面不得继承购买或窗口控制能力。公共账号上下文不构成鉴权证明，真实身份和操作权限必须由宿主与服务端校验。

Pages 输出的 `_headers` 使用 `X-Frame-Options: SAMEORIGIN`。顶层原生 WebView 可加载，同源 iframe 可加载；跨源 iframe 需要明确允许域名、CSP、WebView 导航和安全评审后再开放。不要以通配符允许任意来源。

完整部署步骤见 [DEPLOY-CF-PAGES.md](DEPLOY-CF-PAGES.md)；代码级验收和限制见 [QA.md](QA.md)。
