param(
  [string]$BaseUrl = "http://127.0.0.1:8787",
  [int]$Port = 0,
  [switch]$SkipScreenshots,
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==== $Message ====" -ForegroundColor Cyan
}

function Pause-End() {
  if (-not $NoPause) {
    Write-Host ""
    Read-Host "按回车键关闭窗口"
  }
}

function Fail($Message) {
  Write-Host ""
  Write-Host "验收失败：$Message" -ForegroundColor Red
  Pause-End
  exit 1
}

function Invoke-Check($Name, $ScriptBlock) {
  Write-Host "检查：$Name" -ForegroundColor Yellow
  & $ScriptBlock
  Write-Host "通过：$Name" -ForegroundColor Green
}

trap {
  Write-Host ""
  Write-Host "验收失败：$($_.Exception.Message)" -ForegroundColor Red
  Pause-End
  exit 1
}

Write-Step "cocogames 一键验收"
Write-Host "项目目录：$Root"
Write-Host "验收地址：$BaseUrl"

if ($Port -le 0) {
  try {
    $uri = [Uri]$BaseUrl
    $Port = $uri.Port
  } catch {
    $Port = 8787
  }
}

Invoke-Check "Node.js" {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "没有找到 Node.js。" }
  node --version
}

Invoke-Check "npm" {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail "没有找到 npm。" }
  npm --version
}

if (-not (Test-Path "$Root\node_modules")) {
  Write-Step "安装依赖"
  npm install
  if ($LASTEXITCODE -ne 0) { Fail "npm install 失败。" }
}

Write-Step "代码检查"
npm run lint
if ($LASTEXITCODE -ne 0) { Fail "npm run lint 失败。" }

Write-Step "构建检查"
npm run build
if ($LASTEXITCODE -ne 0) { Fail "npm run build 失败。" }

Write-Step "启动或复用本地服务"
powershell -NoProfile -ExecutionPolicy Bypass -File "$Root\start-local.ps1" -Mode prod -DataMode local -Port $Port -NoPause -NoOpen
if ($LASTEXITCODE -ne 0) { Fail "本地服务启动失败。" }

Write-Step "接口检查"
$apiPaths = @(
  "/api/health",
  "/api/lobby/bootstrap",
  "/api/games",
  "/api/tournaments?status=upcoming",
  "/api/tournaments/mega-ways",
  "/api/events/summer-splash",
  "/api/events/summer-splash/ranking",
  "/api/shop/products/c3",
  "/api/jackpot/slots",
  "/api/daily-rewards",
  "/api/profile/vip",
  "/api/profile/history",
  "/api/profile/achievements",
  "/api/profile/wallet",
  "/api/admin/snapshot"
)

foreach ($path in $apiPaths) {
  Invoke-Check $path {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl$path" -TimeoutSec 8
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
      Fail "$path 返回状态码 $($response.StatusCode)"
    }
  }
}

if (-not $SkipScreenshots) {
  Write-Step "截图检查"
  node "$Root\scripts\capture-screenshots.mjs" --base=$BaseUrl --out="$Root\qa-screens"
  if ($LASTEXITCODE -ne 0) { Fail "截图检查失败。" }
  Write-Host "截图目录：$Root\qa-screens" -ForegroundColor Green
} else {
  Write-Host "已跳过截图检查。" -ForegroundColor Yellow
}

Write-Step "验收完成"
Write-Host "页面地址：$BaseUrl/?server=local"
Write-Host "后台地址：$BaseUrl/?admin=1"
Write-Host "真实账号地址示例：$BaseUrl/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=真实UID&ig=你的IG"
Pause-End
