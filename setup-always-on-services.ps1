# Run this as Administrator: right-click the file -> "Run with PowerShell",
# or open PowerShell as Administrator and run:  .\setup-always-on-services.ps1
#
# Registers MySQL, the backend, and the frontend as real Windows Services so
# they auto-start on boot and auto-restart if they ever crash — no more
# manually starting three things after every reboot/sleep.

$ErrorActionPreference = "Stop"

$ProjectRoot = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System"
$ServerDir   = "$ProjectRoot\server"
$FrontendDir = "$ProjectRoot\front-end"
$NodePath    = "C:\Program Files\nodejs\node.exe"
$VitePath    = "$FrontendDir\node_modules\vite\bin\vite.js"
$MysqldPath  = "C:\xampp2.0\mysql\bin\mysqld.exe"
$MysqlIni    = "C:\xampp2.0\mysql\bin\my.ini"
$Nssm        = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "This script must be run as Administrator. Right-click it and choose 'Run with PowerShell' after launching PowerShell as Administrator, or see the instructions you were given." -ForegroundColor Red
    exit 1
}

Write-Host "=== Registering MySQL as a Windows service (MySQL_SDS) ===" -ForegroundColor Cyan
& $MysqldPath --install MySQL_SDS --defaults-file="$MysqlIni"
Set-Service -Name MySQL_SDS -StartupType Automatic
Start-Service -Name MySQL_SDS

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
