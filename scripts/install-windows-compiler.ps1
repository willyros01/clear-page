param([string]$Destination,[string]$StatusPath,[string]$CancelPath)
$ErrorActionPreference = 'Stop'
$CompilerRelease = '20261104'
$CompilerRoot = 'llvm-mingw-20261104-ucrt-x86_64'
$CompilerUrl = 'https://github.com/mstorsjo/llvm-mingw/releases/download/20261104/llvm-mingw-20261104-ucrt-x86_64.zip'
$CompilerSha256 = '552191b5754c49a5a20723276a6fc56541ea1922c4c50b7b669022333fc1b40f'
$CompilerBytes = 191037046
function Assert-NotCancelled {
    if ($CancelPath -and (Test-Path -LiteralPath $CancelPath)) { throw 'Setup cancelled. Your document is kept.' }
}
function Write-SetupStatus([string]$Message) {
    if ($StatusPath) { [IO.File]::WriteAllText($StatusPath,$Message) }
    [Console]::WriteLine($Message)
}
function Wait-SetupTask($Task) {
    $clock=[Diagnostics.Stopwatch]::StartNew()
    while (!$Task.IsCompleted) { Assert-NotCancelled; if ($clock.Elapsed.TotalSeconds -gt 30) { throw 'The download connection timed out. Please retry.' }; Start-Sleep -Milliseconds 100 }
    Assert-NotCancelled
    return $Task.GetAwaiter().GetResult()
}
function Assert-Archive([string]$Path,[string]$ExpectedSha,[long]$ExpectedBytes) {
    if ((Get-Item -LiteralPath $Path).Length -ne $ExpectedBytes) { throw 'Download incomplete. Please retry.' }
    if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedSha) { throw 'Compiler checksum did not match. Nothing was installed. Please retry.' }
}
function Receive-Compiler([string]$Url,[string]$Path,[long]$ExpectedBytes) {
    Add-Type -AssemblyName System.Net.Http
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $client = New-Object Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromMinutes(15)
    $client.DefaultRequestHeaders.UserAgent.ParseAdd('ATE-Compiler-Setup/0.5.1')
    $response = $null; $stream = $null; $file = $null
    try {
        $response = Wait-SetupTask ($client.GetAsync($Url,[Net.Http.HttpCompletionOption]::ResponseHeadersRead))
        $response.EnsureSuccessStatusCode() | Out-Null
        if ($response.Content.Headers.ContentLength -and $response.Content.Headers.ContentLength -ne $ExpectedBytes) { throw 'Unexpected compiler download size. Please retry.' }
        $stream = Wait-SetupTask ($response.Content.ReadAsStreamAsync())
        $file = [IO.File]::Create($Path)
        # Let .NET stream the archive without a PowerShell call for every network packet.
        $copy=$stream.CopyToAsync($file,262144)
        [long]$lastBytes=0; $lastPercent=-1
        $clock=[Diagnostics.Stopwatch]::StartNew()
        while (!$copy.IsCompleted) {
            Assert-NotCancelled
            [long]$received=$file.Length
            if ($received -gt $ExpectedBytes) { throw 'Unexpected compiler download size.' }
            if ($received -ne $lastBytes) { $clock.Restart(); $lastBytes=$received }
            if ($clock.Elapsed.TotalSeconds -gt 30) { throw 'Download interrupted. Please retry when connected.' }
            $percent=[int][Math]::Floor(100*$received/$ExpectedBytes)
            if ($percent -ne $lastPercent) { Write-SetupStatus "Downloading C compiler: $percent%"; $lastPercent=$percent }
            Start-Sleep -Milliseconds 100
        }
        $copy.GetAwaiter().GetResult()
        Assert-NotCancelled
    } finally {
        if ($file) { $file.Dispose() }; if ($stream) { $stream.Dispose() }; if ($response) { $response.Dispose() }; $client.Dispose()
    }
}
function Expand-VerifiedCompiler([string]$Archive,[string]$Root) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($Archive)
    try {
        [long]$total=0; $index=0
        if ($zip.Entries.Count -gt 100000) { throw 'Compiler archive contains too many files.' }
        $prefix=[IO.Path]::GetFullPath($Root).TrimEnd('\')+'\'
        $buffer=New-Object byte[] 262144
        foreach ($entry in $zip.Entries) {
            Assert-NotCancelled
            $target=[IO.Path]::GetFullPath([IO.Path]::Combine($Root,$entry.FullName))
            if (!$target.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Compiler archive contains an unsafe path.' }
            if ((($entry.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000) { throw 'Compiler archive contains an unsupported symbolic link.' }
            $total += $entry.Length
            if ($total -gt 3GB) { throw 'Compiler archive is larger than expected.' }
            if ($entry.FullName.EndsWith('/')) { [IO.Directory]::CreateDirectory($target) | Out-Null; continue }
            [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
            $entryStream=$entry.Open(); $output=[IO.File]::Create($target)
            try { while (($count=$entryStream.Read($buffer,0,$buffer.Length)) -gt 0) { Assert-NotCancelled; $output.Write($buffer,0,$count) } }
            finally { $entryStream.Dispose(); $output.Dispose() }
            $index++
            if ($index % 50 -eq 0) { Write-SetupStatus ('Installing verified compiler: '+[int](100*$index/$zip.Entries.Count)+'%') }
        }
    } finally { $zip.Dispose() }
}
function Invoke-CompilerProbe([string]$Compiler,[string]$Arguments,[string]$Source) {
    $info=New-Object Diagnostics.ProcessStartInfo
    $info.FileName=$Compiler; $info.Arguments=$Arguments
    $info.UseShellExecute=$false; $info.CreateNoWindow=$true
    $info.RedirectStandardInput=$true; $info.RedirectStandardOutput=$true; $info.RedirectStandardError=$true
    $process=New-Object Diagnostics.Process; $process.StartInfo=$info
    try {
        $process.Start() | Out-Null
        $stdout=$process.StandardOutput.ReadToEndAsync(); $stderr=$process.StandardError.ReadToEndAsync()
        $process.StandardInput.Write($Source); $process.StandardInput.Close()
        $clock=[Diagnostics.Stopwatch]::StartNew()
        while (!$process.WaitForExit(100)) { Assert-NotCancelled; if ($clock.Elapsed.TotalSeconds -gt 15) { throw 'Compiler verification timed out.' } }
        $text=$stdout.GetAwaiter().GetResult()+$stderr.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0) { throw 'The downloaded compiler could not check standard C headers.' }
        return $text
    } finally { if ($process.Id -and !$process.HasExited) { $process.Kill() }; $process.Dispose() }
}
function Assert-CompilerSpace([long]$AvailableBytes) {
    if ($AvailableBytes -lt 3GB) { throw 'C compiler setup needs 3 GB of free disk space. Free some space and retry.' }
}
function Install-ATECompiler {
    if (!$Destination -or !$StatusPath -or !$CancelPath) { throw 'Missing setup paths.' }
    $stage=Join-Path $Destination '.compiler-setup'
    $final=Join-Path $Destination $CompilerRoot
    [IO.Directory]::CreateDirectory($Destination) | Out-Null
    $drive=New-Object IO.DriveInfo ([IO.Path]::GetPathRoot([IO.Path]::GetFullPath($Destination)))
    Assert-CompilerSpace $drive.AvailableFreeSpace
    if (Test-Path -LiteralPath $final) { throw 'A compiler folder already exists. Choose its bin\clang.exe in C settings, or remove that toolchain folder before retrying.' }
    try {
        if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
        [IO.Directory]::CreateDirectory($stage) | Out-Null
        $archive=Join-Path $stage 'compiler.zip'
        Write-SetupStatus 'Connecting to the official LLVM-MinGW download...'
        Receive-Compiler $CompilerUrl $archive $CompilerBytes
        Assert-NotCancelled
        Write-SetupStatus 'Verifying the compiler SHA-256 checksum...'
        Assert-Archive $archive $CompilerSha256 $CompilerBytes
        Assert-NotCancelled
        $extracted=Join-Path $stage 'extracted'
        [IO.Directory]::CreateDirectory($extracted) | Out-Null
        Expand-VerifiedCompiler $archive $extracted
        $toolchain=Join-Path $extracted $CompilerRoot
        $compiler=Join-Path $toolchain 'bin\clang.exe'
        if (!(Test-Path -LiteralPath $compiler)) { throw 'The compiler archive layout was not recognized.' }
        Write-SetupStatus 'Checking the compiler and standard C headers...'
        $version=Invoke-CompilerProbe $compiler '--version' ''
        if ($version -notmatch 'clang version') { throw 'The downloaded program is not a Clang compiler.' }
        Invoke-CompilerProbe $compiler '-x c -std=c17 -fsyntax-only -' "#include <stdio.h>`n#include <stdlib.h>`n#include <stdint.h>`nint main(void) { uint32_t x = 1; return (int)x; }`n" | Out-Null
        Assert-NotCancelled
        [IO.File]::WriteAllText((Join-Path $toolchain 'ate-verified.txt'),$CompilerSha256)
        Move-Item -LiteralPath $toolchain -Destination $final
        Write-SetupStatus 'C compiler ready. Standard headers verified.'
    } finally { if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue } }
}
# Dot-sourcing exposes the same checksum/extraction/cancellation functions to CI tests.
if ($MyInvocation.InvocationName -ne '.') {
    try { Install-ATECompiler; exit 0 }
    catch { Write-SetupStatus $_.Exception.Message; [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
}
