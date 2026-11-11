param([Parameter(Mandatory=$true)][string]$FilePath)
$ErrorActionPreference = 'Stop'
foreach ($name in @('ATE_SIGNTOOL','ATE_SIGN_DLIB','ATE_SIGN_METADATA','ATE_EXPECTED_PUBLISHER')) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) { throw "Signing is not configured: $name" }
}
$file = (Resolve-Path -LiteralPath $FilePath).Path
if ([IO.Path]::GetExtension($file) -notin @('.exe','.dll','.msi')) { throw 'Unexpected signing file type' }
& $env:ATE_SIGNTOOL sign /fd SHA256 /tr http://timestamp.acs.microsoft.com /td SHA256 /dlib $env:ATE_SIGN_DLIB /dmdf $env:ATE_SIGN_METADATA $file
if ($LASTEXITCODE -ne 0) { throw "Artifact Signing failed: $LASTEXITCODE" }
& $env:ATE_SIGNTOOL verify /pa /all $file
if ($LASTEXITCODE -ne 0) { throw 'Windows signature verification failed' }
$signature = Get-AuthenticodeSignature -LiteralPath $file
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -ne $env:ATE_EXPECTED_PUBLISHER -or !$signature.TimeStamperCertificate) { throw 'Expected trusted publisher and timestamp were not verified' }
Write-Host "PASS: trusted, timestamped signature verified for $([IO.Path]::GetFileName($file))"
