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
$StartScript = Join-Path $Root "start-local.ps1"

if (-not (Test-Path $StartScript)) {
  Write-Host "启动失败：没有找到 start-local.ps1" -ForegroundColor Red
  if (-not $NoPause) { Read-Host "按回车键关闭窗口" }
  exit 1
}

Write-Host "cocogames 一键启动" -ForegroundColor Cyan
Write-Host "此脚本会调用 start-local.ps1，包含端口检查、UID/IG 填写、真实服务器和本地数据模式。"

$argsList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $StartScript, '-Port', "$Port")
if ($Mode -ne '') { $argsList += @('-Mode', $Mode) }
if ($DataMode -ne '') { $argsList += @('-DataMode', $DataMode) }
if ($ApiBaseUrl -ne '') { $argsList += @('-ApiBaseUrl', $ApiBaseUrl) }
if ($Uid -ne '') { $argsList += @('-Uid', $Uid) }
if ($Room -ne '') { $argsList += @('-Room', $Room) }
if ($RoomType -ne '') { $argsList += @('-RoomType', $RoomType) }
if ($Ig -ne '') { $argsList += @('-Ig', $Ig) }
if ($NoPause) { $argsList += '-NoPause' }
if ($NoOpen) { $argsList += '-NoOpen' }

& powershell @argsList
exit $LASTEXITCODE
