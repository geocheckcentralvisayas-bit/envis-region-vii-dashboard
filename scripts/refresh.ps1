param(
  [string]$Action = 'run'
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir 'refresh.log'

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $logFile -Value $line
  Write-Host $line
}

switch ($Action) {
  'run' {
    Log 'Starting data refresh (fetch + build).'
    try {
      Log 'Fetching Google Sheets...'
      & npm run data:fetch 2>&1 | ForEach-Object { Add-Content -Path $logFile -Value $_ }
      if ($LASTEXITCODE -ne 0) { Log "fetch failed (exit $LASTEXITCODE)"; exit 1 }
      Log 'Building dataset...'
      & npm run data:build 2>&1 | ForEach-Object { Add-Content -Path $logFile -Value $_ }
      if ($LASTEXITCODE -ne 0) { Log "build failed (exit $LASTEXITCODE)"; exit 1 }
      Log 'Refresh complete.'
    } catch {
      Log "ERROR: $($_.Exception.Message)"
      exit 1
    }
  }
  'install' {
    $taskName = 'ENVIS Dashboard Data Refresh'
    $ps = (Get-Command powershell).Source
    $script = Join-Path $root 'scripts\refresh.ps1'
    $taskAction = New-ScheduledTaskAction -Execute $ps -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Action run" -WorkingDirectory $root
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650)
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Log "Installed scheduled task '$taskName' (every 30 minutes)."
  }
  'uninstall' {
    $taskName = 'ENVIS Dashboard Data Refresh'
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Log "Removed scheduled task '$taskName'."
  }
  'status' {
    $taskName = 'ENVIS Dashboard Data Refresh'
    $t = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($t) { Write-Host "$taskName : $($t.State)"; $t.Triggers | ForEach-Object { Write-Host "  trigger: $($_.Repetition.Interval) repeating" } }
    else { Write-Host "$taskName : not installed" }
  }
  default { Write-Host "Unknown action: $Action"; exit 1 }
}
