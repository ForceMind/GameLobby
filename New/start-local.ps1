param(
  [ValidateSet("dev", "prod", "")]
  [string]$Mode = "",

  [ValidateSet("local", "real", "")]
  [string]$DataMode = "",

  [string]$ApiBaseUrl = "",
  [string]$Uid = "",
  [string]$Room = "",
  [string]$RoomType = "",
  [string]$Ig = "",
  [int]$Port = 8787,
  [switch]$NoPause,
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SafeRoot = $Root.Replace("'", "''")
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
  Write-Host "启动失败：$Message" -ForegroundColor Red
  Pause-End
  exit 1
}

trap {
  Write-Host ""
  Write-Host "启动失败：$($_.Exception.Message)" -ForegroundColor Red
  Write-Host "请把上面的错误截图或复制给开发人员。" -ForegroundColor Yellow
  Pause-End
  exit 1
}

function Test-LocalPort($Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(500, $false)
    if ($ok) {
      $client.EndConnect($async)
      return $true
    }
    return $false
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Test-CocogamesService($Port) {
  try {
    $base = "http://127.0.0.1:$Port"
    $health = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/health" -TimeoutSec 2
    $admin = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/admin/snapshot" -TimeoutSec 2
    $jackpot = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/jackpot/slots" -TimeoutSec 2
    $daily = Invoke-RestMethod -Uri "$base/api/daily-rewards" -TimeoutSec 2
    return ($health.StatusCode -eq 200 -and $admin.StatusCode -eq 200 -and $jackpot.StatusCode -eq 200 -and $daily.dailyRewards.Count -eq 7)
  } catch {
    return $false
  }
}

function Stop-PortProcess($Port) {
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    $processId = $conn.OwningProcess
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    Write-Host "关闭端口 $Port 占用进程：PID=$processId $($processInfo.CommandLine)" -ForegroundColor Yellow
    Stop-Process -Id $processId -Force
  }
  Start-Sleep -Seconds 1
}

function Ensure-CocogamesPort($Port) {
  if (-not (Test-LocalPort $Port)) { return }

  if (Test-CocogamesService $Port) {
    Write-Host "端口 $Port 已经运行当前 cocogames 服务，将复用该服务。" -ForegroundColor Yellow
    return
  }

  Write-Host "端口 $Port 已被旧服务或其它程序占用，当前项目接口不完整。" -ForegroundColor Yellow
  if ($NoPause) {
    Write-Host "当前是无人值守模式，将关闭旧服务并重新启动当前项目。" -ForegroundColor Yellow
    Stop-PortProcess $Port
    return
  }

  $answer = Read-Host "是否关闭占用 $Port 的旧服务并重新启动？输入 Y 确认，直接回车取消"
  if ($answer -eq "Y" -or $answer -eq "y") {
    Stop-PortProcess $Port
  } else {
    Fail "端口 $Port 被占用，无法启动当前后端。"
  }
}

function Quote-Ps($Value) {
  return "'" + (($Value -as [string]).Replace("'", "''")) + "'"
}

function Add-QueryParam($Pairs, $Name, $Value) {
  if ($null -ne $Value -and "$Value" -ne "") {
    $Pairs.Add("$Name=$([Uri]::EscapeDataString($Value))") | Out-Null
  }
}

function Build-OpenUrl($BaseUrl) {
  $pairs = New-Object System.Collections.Generic.List[string]
  if ($DataMode -eq "real") {
    Add-QueryParam $pairs "server" "real"
    Add-QueryParam $pairs "preferRemote" "1"
    Add-QueryParam $pairs "apiBaseUrl" $ApiBaseUrl
    Add-QueryParam $pairs "uid" $Uid
    Add-QueryParam $pairs "room" $Room
    Add-QueryParam $pairs "roomType" $RoomType
    Add-QueryParam $pairs "ig" $Ig
  } else {
    Add-QueryParam $pairs "server" "local"
  }

  if ($pairs.Count -eq 0) { return $BaseUrl }
  return "$BaseUrl/?$($pairs -join '&')"
}

function Build-EnvCommand($Command, [bool]$IncludeServerPort = $true) {
  $prefix = ""
  if ($IncludeServerPort) {
    $prefix += "`$env:PORT='$Port'; "
  }
  if ($DataMode -eq "real") {
    $prefix += "`$env:VITE_PREFER_REMOTE='1'; "
    $prefix += "`$env:VITE_API_BASE_URL=$(Quote-Ps $ApiBaseUrl); "
    $prefix += "`$env:VITE_TEST_UID=$(Quote-Ps $Uid); "
    $prefix += "`$env:VITE_ROOM=$(Quote-Ps $Room); "
    $prefix += "`$env:VITE_ROOM_TYPE=$(Quote-Ps $RoomType); "
    $prefix += "`$env:VITE_IG=$(Quote-Ps $Ig); "
  }
  return "Set-Location '$SafeRoot'; $prefix$Command"
}

Write-Step "cocogames 本地启动脚本"
Write-Host "项目目录：$Root"
if ($Mode -eq "") {
  Write-Host ""
  Write-Host "请选择启动模式："
  Write-Host "1. 开发模式（前端 5173 + 后端 8787，推荐开发调试）"
  Write-Host "2. 生产模式（一体化 8787，推荐验收部署）"
  $modeChoice = Read-Host "请输入 1 或 2，直接回车默认 1"
  if ($modeChoice -eq "2") { $Mode = "prod" } else { $Mode = "dev" }
}
Write-Host "启动模式：$Mode"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail "没有找到 Node.js，请先安装 Node.js 20.19 或更高版本。"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Fail "没有找到 npm，请确认 Node.js 安装完整。"
}

if ($DataMode -eq "") {
  Write-Host ""
  Write-Host "请选择数据模式："
  Write-Host "1. 本地模拟数据（推荐给 UI 调试）"
  Write-Host "2. 真实服务器账号（使用现有服务器接口）"
  $choice = Read-Host "请输入 1 或 2，直接回车默认 1"
  if ($choice -eq "2") { $DataMode = "real" } else { $DataMode = "local" }
}

if ($DataMode -eq "real") {
  if ($ApiBaseUrl -eq "") {
    $inputValue = Read-Host "请输入真实服务器 API 地址"
    if ($inputValue -eq "") { throw "真实服务器模式必须填写 API 地址。" } else { $ApiBaseUrl = $inputValue }
  }
  if ($Uid -eq "") {
    $inputValue = Read-Host "请输入真实账号 uid"
    if ($inputValue -eq "") { Fail "真实服务器模式必须填写 uid。" }
    $Uid = $inputValue
  }
  if ($Room -eq "") { $Room = Read-Host "请输入 room，可直接回车为空" }
  if ($RoomType -eq "") { $RoomType = Read-Host "请输入 roomType/type，可直接回车为空" }
  if ($Ig -eq "") {
    $inputValue = Read-Host "请输入 ig，若服务器不需要可直接回车为空"
    $Ig = $inputValue
  }

  Write-Step "真实服务器参数"
  Write-Host "API 地址：$ApiBaseUrl"
  Write-Host "账号 uid：$Uid"
  Write-Host "room：$Room"
  Write-Host "roomType/type：$RoomType"
  Write-Host "ig：$Ig"
} else {
  Write-Step "本地模拟数据模式"
  Write-Host "使用本地 Node 后端和 server/mockData.js 数据。"
}

if (-not (Test-Path "$Root\node_modules")) {
  Write-Step "首次启动，正在安装依赖"
  npm install
  if ($LASTEXITCODE -ne 0) { Fail "npm install 失败。" }
}

if ($Mode -eq "prod") {
  Write-Step "生产模式：构建前端并启动一体化服务"
  Invoke-Expression (Build-EnvCommand "npm run build" $false)
  if ($LASTEXITCODE -ne 0) { Fail "npm run build 失败。" }

  Ensure-CocogamesPort $Port
  if (Test-LocalPort $Port) {
    Write-Host "服务已经在运行，不重复启动。" -ForegroundColor Yellow
  } else {
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", (Build-EnvCommand "npm start")
    Start-Sleep -Seconds 2
  }

  $openUrl = Build-OpenUrl "http://127.0.0.1:$Port"
  if (-not $NoOpen) {
    Start-Process $openUrl
    Write-Host "已打开生产地址：$openUrl" -ForegroundColor Green
  } else {
    Write-Host "生产访问地址：$openUrl" -ForegroundColor Green
  }
  Pause-End
  exit 0
}

Write-Step "开发模式：分别启动后端和前端"

Ensure-CocogamesPort $Port
if (Test-LocalPort $Port) {
  Write-Host "后端端口 $Port 已经运行当前服务，跳过后端启动。" -ForegroundColor Yellow
} else {
  Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", (Build-EnvCommand "npm run dev:server")
  Write-Host "已启动后端窗口：http://127.0.0.1:$Port" -ForegroundColor Green
}

if (Test-LocalPort 5173) {
  Write-Host "前端端口 5173 已经在运行，跳过前端启动。" -ForegroundColor Yellow
} else {
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", (Build-EnvCommand "npm run dev" $false)
  Write-Host "已启动前端窗口：http://localhost:5173" -ForegroundColor Green
}

Start-Sleep -Seconds 3
$devUrl = Build-OpenUrl "http://localhost:5173"
if (-not $NoOpen) { Start-Process $devUrl }

Write-Step "启动完成"
Write-Host "前端地址：$devUrl"
Write-Host "后端地址：http://127.0.0.1:$Port"
Write-Host "接口健康检查：http://127.0.0.1:$Port/api/health"
Write-Host "真实账号地址格式：http://localhost:5173/?server=real&preferRemote=1&apiBaseUrl=服务器地址&uid=真实UID&room=房间&roomType=类型&ig=你的IG"
Write-Host "如果需要一体化生产启动，请运行：.\一键启动.ps1 -Mode prod"
Pause-End
