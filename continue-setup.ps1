# Continuation after the MySQL port conflict was resolved.
# Run this in the same Administrator PowerShell window.

$ErrorActionPreference = "Stop"

$ProjectRoot = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System"
$ServerDir   = "$ProjectRoot\server"
$FrontendDir = "$ProjectRoot\front-end"
$NodePath    = "C:\Program Files\nodejs\node.exe"
$VitePath    = "$FrontendDir\node_modules\vite\bin\vite.js"
$Nssm        = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"

Write-Host "=== Starting MySQL_SDS ===" -ForegroundColor Cyan
Start-Service -Name MySQL_SDS
Get-Service MySQL_SDS | Format-Table Name, Status, StartType

Write-Host "=== Registering backend as a Windows service (SDS-Backend) ===" -ForegroundColor Cyan
& $Nssm install SDS-Backend $NodePath "server.js"
& $Nssm set SDS-Backend AppDirectory $ServerDir
& $Nssm set SDS-Backend Start SERVICE_AUTO_START
& $Nssm set SDS-Backend AppExit Default Restart
& $Nssm set SDS-Backend AppRestartDelay 3000
& $Nssm start SDS-Backend

Write-Host "=== Registering frontend as a Windows service (SDS-Frontend) ===" -ForegroundColor Cyan
& $Nssm install SDS-Frontend $NodePath $VitePath
& $Nssm set SDS-Frontend AppDirectory $FrontendDir
& $Nssm set SDS-Frontend Start SERVICE_AUTO_START
& $Nssm set SDS-Frontend AppExit Default Restart
& $Nssm set SDS-Frontend AppRestartDelay 3000
& $Nssm start SDS-Frontend

Write-Host "`n=== Done. Current status: ===" -ForegroundColor Green
Get-Service MySQL_SDS, SDS-Backend, SDS-Frontend | Format-Table Name, Status, StartType
