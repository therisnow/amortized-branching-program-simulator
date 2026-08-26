$nodeBin = 'C:\Users\DaiY0\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$bundledPnpm = 'C:\Users\DaiY0\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'

Set-Location -LiteralPath $PSScriptRoot

if ((Test-Path -LiteralPath $nodeBin) -and (Test-Path -LiteralPath $bundledPnpm)) {
    $env:Path = "$nodeBin;$env:Path"
    & $bundledPnpm run dev
} elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run dev
} else {
    throw 'pnpm was not found. Open this project in Codex once to use its bundled runtime.'
}
