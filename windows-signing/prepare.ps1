$ErrorActionPreference = 'Stop'
$required = @('ATE_ARTIFACT_ENDPOINT','ATE_ARTIFACT_ACCOUNT','ATE_ARTIFACT_PROFILE','ATE_EXPECTED_PUBLISHER')
foreach ($name in $required) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($value) -or $value.Contains("`n") -or $value.Contains("`r")) { throw "Missing or invalid setting: $name" }
}
$endpoint = [Uri]$env:ATE_ARTIFACT_ENDPOINT
if ($endpoint.Scheme -ne 'https' -or $endpoint.Host -notmatch '^[a-z0-9]+\.codesigning\.azure\.net$' -or $endpoint.UserInfo -or $endpoint.Query -or $endpoint.Fragment) { throw 'Use the public Artifact Signing regional HTTPS endpoint' }
foreach ($name in @('ATE_ARTIFACT_ACCOUNT','ATE_ARTIFACT_PROFILE')) {
  if ([Environment]::GetEnvironmentVariable($name) -notmatch '^[A-Za-z0-9-]+$') { throw "Invalid signing resource name: $name" }
}
$tools = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" | Sort-Object { [version]$_.Directory.Parent.Name } -Descending
$signTool = $tools | Where-Object { [version]$_.Directory.Parent.Name -ge [version]'10.0.26100.0' } | Select-Object -First 1
if (!$signTool) { throw 'A supported Windows SDK x64 SignTool was not found' }
$dlibs = Get-ChildItem $env:ProgramFiles,${env:ProgramFiles(x86)} -Filter '*Signing.Dlib.dll' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match '[\\/](x64|win-x64)[\\/]' }
$dlib = $dlibs | Select-Object -First 1
if (!$dlib) { throw 'Artifact Signing x64 client Dlib was not found' }
$task = Join-Path $env:RUNNER_TEMP 'ate-windows-signing'
New-Item -ItemType Directory -Force $task | Out-Null
$metadata = Join-Path $task 'metadata.json'
@{ Endpoint=$env:ATE_ARTIFACT_ENDPOINT; CodeSigningAccountName=$env:ATE_ARTIFACT_ACCOUNT; CertificateProfileName=$env:ATE_ARTIFACT_PROFILE } | ConvertTo-Json | Set-Content -Encoding utf8 $metadata
$config = Join-Path $task 'tauri-signing.json'
$wrapper = (Resolve-Path 'windows-signing/sign.ps1').Path
@{ bundle=@{windows=@{signCommand=@{cmd='pwsh';args=@('-NoProfile','-File',$wrapper,'%1')}}} } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $config
@("ATE_SIGNTOOL=$($signTool.FullName)","ATE_SIGN_DLIB=$($dlib.FullName)","ATE_SIGN_METADATA=$metadata","ATE_SIGN_CONFIG=$config") | Add-Content $env:GITHUB_ENV
Write-Host 'Prepared cloud signing configuration. No certificates or private keys are exported.'
