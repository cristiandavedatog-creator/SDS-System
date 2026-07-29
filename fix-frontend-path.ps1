# Run in the same Administrator PowerShell window.
# The vite.js path has spaces in it (Jayser Tan, SDO Projects, SDS System),
# and NSSM stored it unquoted — Windows then split the launch command on
# the first space, so Node only ever saw "c:\Users\Jayser" as the path.
# Re-setting AppParameters with explicit quotes fixes that.

$Nssm     = "C:\Users\Jayser Tan\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
$VitePath = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\front-end\node_modules\vite\bin\vite.js"
$LogDir   = "c:\Users\Jayser Tan\Downloads\SDO Projects\SDS System\service-logs"

$QuotedVitePath = '"' + $VitePath + '"'
& $Nssm set SDS-Frontend AppParameters $QuotedVitePath

# Clear old error output so the check below reflects this run, not the
# previous failure.
Remove-Item "$LogDir\frontend-err.log" -ErrorAction SilentlyContinue
Remove-Item "$LogDir\frontend-out.log" -ErrorAction SilentlyContinue

Write-Host "=== Restarting SDS-Frontend ===" -ForegroundColor Cyan
& $Nssm restart SDS-Frontend

Start-Sleep -Seconds 4
Write-Host "`n=== Status ===" -ForegroundColor Green
Get-Service MySQL_SDS, SDS-Backend, SDS-Frontend | Format-Table Name, Status, StartType

Write-Host "`n=== stderr (should be empty now) ===" -ForegroundColor Yellow
Get-Content "$LogDir\frontend-err.log" -Tail 20 -ErrorAction SilentlyContinue

Write-Host "`n=== stdout ===" -ForegroundColor Yellow
Get-Content "$LogDir\frontend-out.log" -Tail 20 -ErrorAction SilentlyContinue
