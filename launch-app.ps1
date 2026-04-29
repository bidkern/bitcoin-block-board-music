param(
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
      "Bitcoin Block Music",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  } catch {
    Write-Error $Message
  }
}

function Test-AppReady {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method Head -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

try {
  $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  $serverScript = Join-Path $projectRoot "server.js"
  $url = "http://127.0.0.1:4173/"
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue

  if (-not $nodeCommand) {
    throw "Node.js was not found on PATH. Install Node.js first, then launch the app again."
  }

  if (-not (Test-AppReady -Url $url)) {
    Start-Process -FilePath $nodeCommand.Source -ArgumentList @($serverScript) -WorkingDirectory $projectRoot -WindowStyle Hidden | Out-Null

    $deadline = (Get-Date).AddSeconds(20)
    do {
      Start-Sleep -Milliseconds 400
    } until ((Get-Date) -ge $deadline -or (Test-AppReady -Url $url))
  }

  if (-not (Test-AppReady -Url $url)) {
    throw "The local app did not finish starting. Try again in a moment, or run node server.js manually in the project folder."
  }

  if (-not $NoBrowser) {
    Start-Process $url | Out-Null
  }
} catch {
  Show-LauncherError -Message $_.Exception.Message
  exit 1
}
