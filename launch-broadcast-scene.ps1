param(
  [int]$Port = 4174,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-LauncherError {
  param(
    [string]$Message
  )

  try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    [System.Windows.Forms.MessageBox]::Show(
      $Message,
      "Bitcoin Block Music Broadcast",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  } catch {
    Write-Error $Message
  }
}

function Test-BroadcastReady {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    if ($response.StatusCode -ne 200 -or $response.Content -notmatch "Bitcoin Block Music Broadcast Scene") {
      return $false
    }

    $commandUrl = $Url -replace "/stream\.html.*$", "/api/broadcast-command"
    $commandResponse = Invoke-WebRequest -UseBasicParsing -Uri $commandUrl -TimeoutSec 2
    return $commandResponse.StatusCode -eq 200 -and $commandResponse.Content -match '"revision"'
  } catch {
    return $false
  }
}

try {
  $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  $serverScript = Join-Path $projectRoot "server.js"
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $broadcastUrl = "http://127.0.0.1:$Port/stream.html?obs=1"

  if (-not $nodeCommand) {
    throw "Node.js was not found on PATH. Install Node.js first, then launch the broadcast scene again."
  }

  if (-not (Test-BroadcastReady -Url $broadcastUrl)) {
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $nodeCommand.Source
    $startInfo.WorkingDirectory = $projectRoot
    $startInfo.Arguments = "`"$serverScript`""
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.EnvironmentVariables["PORT"] = [string]$Port
    [void][System.Diagnostics.Process]::Start($startInfo)

    $deadline = (Get-Date).AddSeconds(20)
    do {
      Start-Sleep -Milliseconds 400
    } until ((Get-Date) -ge $deadline -or (Test-BroadcastReady -Url $broadcastUrl))
  }

  if (-not (Test-BroadcastReady -Url $broadcastUrl)) {
    throw "The broadcast scene did not finish starting on port $Port. Try a different port with -Port 4175 or run node server.js manually in the project folder."
  }

  try {
    Set-Clipboard -Value $broadcastUrl
  } catch {
  }

  if (-not $NoBrowser) {
    Start-Process $broadcastUrl | Out-Null
  }
} catch {
  Show-LauncherError -Message $_.Exception.Message
  exit 1
}
