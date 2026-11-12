$ErrorActionPreference='Stop'
. "$PSScriptRoot/../scripts/install-windows-compiler.ps1"
$testRoot=Join-Path $env:RUNNER_TEMP 'compiler-negative-tests'
[IO.Directory]::CreateDirectory($testRoot) | Out-Null
function Must-Fail([scriptblock]$Action,[string]$Match) {
    $caught=$null
    try { & $Action } catch { $caught=$_.Exception.Message }
    if (!$caught -or $caught -notmatch $Match) { throw "Expected failure '$Match', got '$caught'" }
    Write-Output "PASS: $Match"
}
Must-Fail { Assert-CompilerSpace 1MB } 'free disk space'
$fixture=Join-Path $testRoot 'partial.zip'
[IO.File]::WriteAllText($fixture,'partial')
Must-Fail { Assert-Archive $fixture ('0'*64) 100 } 'incomplete'
Must-Fail { Assert-Archive $fixture ('0'*64) (Get-Item $fixture).Length } 'checksum'
$CancelPath=Join-Path $testRoot 'cancel'
[IO.File]::WriteAllText($CancelPath,'cancel')
Must-Fail { Assert-NotCancelled } 'cancelled'
Remove-Item -LiteralPath $CancelPath
Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
$unsafe=Join-Path $testRoot 'unsafe.zip'
$zip=[IO.Compression.ZipFile]::Open($unsafe,[IO.Compression.ZipArchiveMode]::Create)
$entry=$zip.CreateEntry('../escape.exe');$writer=New-Object IO.StreamWriter ($entry.Open());$writer.Write('never execute');$writer.Dispose();$zip.Dispose()
Must-Fail { Expand-VerifiedCompiler $unsafe (Join-Path $testRoot 'extract') } 'unsafe path'
if (Test-Path (Join-Path $testRoot 'escape.exe')) { throw 'Archive escaped extraction folder' }
Must-Fail { Receive-Compiler 'http://127.0.0.1:1/unavailable' (Join-Path $testRoot 'network.zip') 100 } '.'
Write-Output 'PASS: interrupted/network-failed download never reaches extraction or execution'
Remove-Item -LiteralPath $testRoot -Recurse -Force
