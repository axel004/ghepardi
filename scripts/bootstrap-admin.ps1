param(
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$ProjectRef
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
Write-Host 'Scegli la password per il tuo account admin. Usa almeno 12 caratteri.'
$secure = Read-Host 'Password (non viene mostrata)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:GHEPARDI_BOOTSTRAP_EMAIL = $Email
  $env:GHEPARDI_PROJECT_REF = $ProjectRef
  $env:GHEPARDI_BOOTSTRAP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  node scripts/bootstrap-admin.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Creazione dell’account non riuscita.' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  Remove-Item Env:GHEPARDI_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:GHEPARDI_BOOTSTRAP_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:GHEPARDI_PROJECT_REF -ErrorAction SilentlyContinue
}
