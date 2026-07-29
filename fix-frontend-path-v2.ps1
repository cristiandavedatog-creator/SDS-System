# Run in the same Administrator PowerShell window.
# The previous quoting attempt didn't survive PowerShell's own argument
# passing to nssm.exe. Using the Windows short (8.3) path instead sidesteps
# the whole quoting problem, since short paths never contain spaces.

$Nssm     = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
$VitePath = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\front-end\node_modules\vite\bin\vite.js"
$LogDir   = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\service-logs"

$fso = New-Object -ComObject Scripting.FileSystemObject
$ShortVitePath = $fso.GetFile($VitePath).ShortPath
Write-Host "Short path (no spaces): $ShortVitePath" -ForegroundColor Cyan

& $Nssm set SDS-Frontend AppParameters $ShortVitePath

Remove-Item "$LogDir\frontend-err.log" -ErrorAction SilentlyContinue
Remove-Item "$LogDir\frontend-out.log" -ErrorAction SilentlyContinue

Write-Host "=== Restarting SDS-Frontend ===" -ForegroundColor Cyan
& $Nssm restart SDS-Frontend

Start-Sleep -Seconds 4
Write-Host "`n=== Status ===" -ForegroundColor Green
Get-Service MySQL_SDS, SDS-Backend, SDS-Frontend | Format-Table Name, Status, StartType

Write-Host "`n=== stderr ===" -ForegroundColor Yellow
Get-Content "$LogDir\frontend-err.log" -Tail 20 -ErrorAction SilentlyContinue

Write-Host "`n=== stdout ===" -ForegroundColor Yellow
Get-Content "$LogDir\frontend-out.log" -Tail 20 -ErrorAction SilentlyContinue
