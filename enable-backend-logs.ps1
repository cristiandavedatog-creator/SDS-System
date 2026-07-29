$nssm = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
$logDir = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\service-logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

& $nssm set SDS-Backend AppStdout "$logDir\backend-out.log"
& $nssm set SDS-Backend AppStderr "$logDir\backend-err.log"
& $nssm set SDS-Backend AppRotateFiles 1
& $nssm set SDS-Backend AppRotateOnline 1

Restart-Service -Name "SDS-Backend" -Force
Start-Sleep -Seconds 2
Get-Service -Name "SDS-Backend" | Select-Object Name, Status
Write-Output "Logging enabled. Logs will appear at: $logDir\backend-out.log and backend-err.log"
