Set-Location (Split-Path $MyInvocation.MyCommand.Path)
$r = Get-Content ".\quest_tb_v4.csv" -Encoding UTF8
Write-Host "lines: $($r.Count)"
Write-Host "first: $($r[0].Substring(0, [Math]::Min(50, $r[0].Length)))"
