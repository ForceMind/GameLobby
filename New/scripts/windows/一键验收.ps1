param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ScriptArgs
)

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
& (Join-Path $Root '一键验收.ps1') @ScriptArgs
exit $LASTEXITCODE
