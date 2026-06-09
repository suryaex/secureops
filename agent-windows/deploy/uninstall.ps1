# SecureOps Windows Agent — uninstaller  (Run as Administrator)
#   powershell -ExecutionPolicy Bypass -File uninstall.ps1
#   powershell -ExecutionPolicy Bypass -File uninstall.ps1 -Purge
param([switch]$Purge)

$ErrorActionPreference = "Continue"
$svc     = "SecureOps-Agent"
$instDir = "C:\Program Files\SecureOps-Agent"
$dataDir = Join-Path $env:PROGRAMDATA "SecureOps-Agent"
$nssm    = Join-Path $instDir "nssm\win64\nssm.exe"

Write-Host "==> Removing SecureOps Windows agent..." -ForegroundColor Green

# Stop + remove the service (NSSM first, then fall back to sc.exe)
if (Test-Path $nssm) {
    & $nssm stop $svc 2>$null
    & $nssm remove $svc confirm 2>$null
} else {
    sc.exe stop $svc 2>$null | Out-Null
    sc.exe delete $svc 2>$null | Out-Null
}

# Firewall rule
Remove-NetFirewallRule -DisplayName "SecureOps-Agent Port 8001" -ErrorAction SilentlyContinue
Get-NetFirewallRule -DisplayName "SecureOps*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue

# Files
if (Test-Path $instDir) { Remove-Item $instDir -Recurse -Force -ErrorAction SilentlyContinue }

if ($Purge) {
    if (Test-Path $dataDir) { Remove-Item $dataDir -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "   Purged agent data ($dataDir)." -ForegroundColor Yellow
} else {
    Write-Host "   Agent data kept ($dataDir). Re-run with -Purge to delete it." -ForegroundColor Yellow
}

Write-Host "==> SecureOps Windows agent removed." -ForegroundColor Green
