Restart-Service -Name "SDS-Backend" -Force
Start-Sleep -Seconds 2
Get-Service -Name "SDS-Backend" | Select-Object Name, Status
