# watch_csv.ps1
# 이 스크립트를 실행해두면 CSV 파일이 변경될 때마다 gen_data_js4.ps1이 자동 실행됩니다.

$Path = Get-Location
$Filter = "*.csv"

$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = $Path
$Watcher.Filter = $Filter
$Watcher.IncludeSubdirectories = $false
$Watcher.EnableRaisingEvents = $true

$Action = {
    $Name = $Event.SourceEventArgs.Name
    $ChangeType = $Event.SourceEventArgs.ChangeType
    $Timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$Timestamp] Change detected: $Name ($ChangeType)" -ForegroundColor Cyan
    
    # 0.5초 대기 (파일 쓰기 완료 대기)
    Start-Sleep -Milliseconds 500
    
    powershell -ExecutionPolicy Bypass -File ".\gen_data_js4.ps1"
}

Register-ObjectEvent $Watcher "Changed" -Action $Action
Register-ObjectEvent $Watcher "Created" -Action $Action

Write-Host "Watching for CSV changes in $Path ..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor White

while ($true) { Start-Sleep 1 }
