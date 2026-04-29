param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ScriptArgs
)

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
& (Join-Path $Root 'start-local.ps1') @ScriptArgs
exit $LASTEXITCODE
