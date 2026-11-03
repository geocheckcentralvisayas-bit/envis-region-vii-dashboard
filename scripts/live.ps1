<#
.SYNOPSIS
    Keeps the ENVIS dashboard live, and optionally starts it automatically at every logon.

.DESCRIPTION
    -Action run        Start the supervisor in this console (foreground; Ctrl+C stops it).
    -Action install    Register the "ENVIS Dashboard Live" logon task and start it now.
    -Action uninstall  Stop everything and delete the logon task.
    -Action restart    Stop the running server and start it again.
    -Action status     Show whether the site answers and what the logon task is doing.

    The site is served by Vite at http://127.0.0.1:5173 (dev server, live reload).
    Logs go to logs\live.log. Set ENVIS_HOST / ENVIS_PORT to change the binding.
#>
[CmdletBinding()]
param(
    [ValidateSet('run', 'install', 'uninstall', 'restart', 'status')]
    [string]$Action = 'status',

    [string]$TaskName = 'ENVIS Dashboard Live'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:ENVIS_PORT) { [int]$env:ENVIS_PORT } else { 5173 }
$hostName = if ($env:ENVIS_HOST) { $env:ENVIS_HOST } else { '127.0.0.1' }
$url = "http://${hostName}:$port"
$logFile = Join-Path $root 'logs\live.log'

function Resolve-Node {
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($node) { return $node.Source }
    foreach ($candidate in @(
            "$env:ProgramFiles\nodejs\node.exe",
            "${env:ProgramFiles(x86)}\nodejs\node.exe",
            "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
        )) {
        if (Test-Path $candidate) { return $candidate }
    }
    throw 'node.exe was not found. Install Node.js or add it to PATH.'
}

function Get-LiveProcess {
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -like '*scripts\serve-live.mjs*' }
}

function Stop-Live {
    foreach ($proc in Get-LiveProcess) {
        Write-Host "Stopping supervisor pid $($proc.ProcessId)..." -ForegroundColor DarkYellow
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }

    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        Write-Host "Stopping process on port $port (pid $($listener.OwningProcess))..." -ForegroundColor DarkYellow
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

function Test-Live {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Invoke-Run {
    $node = Resolve-Node
    Set-Location $root
    & $node (Join-Path $root 'scripts\serve-live.mjs')
}

function Install-Task {
    $node = Resolve-Node
    $script = Join-Path $root 'scripts\live.ps1'

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "Replacing existing task '$TaskName'..." -ForegroundColor DarkYellow
    }

    $action = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -Action run" `
        -WorkingDirectory $root

    $trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew `
        -RestartCount 999 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero)

    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
        -Principal $principal -Force `
        -Description 'Serves the ENVIS Region VII dashboard on http://127.0.0.1:5173 and keeps it running.' | Out-Null

    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Logon task '$TaskName' registered and started." -ForegroundColor Green
    Start-Sleep -Seconds 2
    Show-Status
}

function Uninstall-Task {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Logon task '$TaskName' removed." -ForegroundColor Green
    } else {
        Write-Host "No logon task named '$TaskName' to remove." -ForegroundColor DarkGray
    }
    Stop-Live
}

function Show-Status {
    $live = Test-Live

    if ($live) {
        Write-Host "Site      : $url  [LIVE]" -ForegroundColor Green
    } else {
        Write-Host "Site      : $url  [DOWN]" -ForegroundColor Red
    }

    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) {
        $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
        $state = (Get-ScheduledTask -TaskName $TaskName).State
        Write-Host "Logon task: '$TaskName' state=$state lastRun=$($info.LastRunTime) nextRun=$($info.NextRunTime)" -ForegroundColor DarkGray
    } else {
        Write-Host "Logon task: not installed (run: .\scripts\live.ps1 -Action install)" -ForegroundColor DarkYellow
    }

    $procs = Get-LiveProcess
    if ($procs) {
        foreach ($proc in $procs) { Write-Host "Supervisor: pid $($proc.ProcessId)" -ForegroundColor DarkGray }
    } else {
        Write-Host 'Supervisor: not running' -ForegroundColor DarkYellow
    }

    if (Test-Path $logFile) {
        Write-Host "Log       : $logFile" -ForegroundColor DarkGray
    }
}

switch ($Action) {
    'run' { Invoke-Run }
    'install' { Install-Task }
    'uninstall' { Uninstall-Task }
    'restart' {
        Stop-Live
        Start-Sleep -Milliseconds 800
        if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
            Start-ScheduledTask -TaskName $TaskName
            Start-Sleep -Seconds 2
            Show-Status
        } else {
            Invoke-Run
        }
    }
    'status' { Show-Status }
}
