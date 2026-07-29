# Run in the same Administrator PowerShell window.
# Adds stdout/stderr log capture to SDS-Frontend so we can see why it's
# exiting immediately, then restarts it and shows the log.

$Nssm    = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
$LogDir  = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\service-logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

& $Nssm set SDS-Frontend AppStdout "$LogDir\frontend-out.log"
& $Nssm set SDS-Frontend AppStderr "$LogDir\frontend-err.log"
& $Nssm set SDS-Frontend AppThrottle 1500

Write-Host "=== Restarting SDS-Frontend with logging enabled ===" -ForegroundColor Cyan
& $Nssm restart SDS-Frontend

Start-Sleep -Seconds 3
Write-Host "`n=== Status ===" -ForegroundColor Green
Get-Service SDS-Frontend | Format-Table Name, Status, StartType

Write-Host "`n=== stderr log ===" -ForegroundColor Yellow
if (Test-Path "$LogDir\frontend-err.log") {
    Get-Content "$LogDir\frontend-err.log" -Tail 40
} else {
    Write-Host "(no stderr log written yet)"
}

Write-Host "`n=== stdout log ===" -ForegroundColor Yellow
if (Test-Path "$LogDir\frontend-out.log") {
    Get-Content "$LogDir\frontend-out.log" -Tail 40
} else {
    Write-Host "(no stdout log written yet)"
}
