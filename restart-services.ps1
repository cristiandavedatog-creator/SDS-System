# Run in the same Administrator PowerShell window.
# Restarts both services now that the leftover manual processes holding
# ports 3000/5000 have been cleared out.

$Nssm = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"

Write-Host "=== Restarting SDS-Backend ===" -ForegroundColor Cyan
& $Nssm restart SDS-Backend

Write-Host "=== Restarting SDS-Frontend ===" -ForegroundColor Cyan
& $Nssm restart SDS-Frontend

Start-Sleep -Seconds 3
Write-Host "`n=== Status ===" -ForegroundColor Green
Get-Service MySQL_SDS, SDS-Backend, SDS-Frontend | Format-Table Name, Status, StartType
