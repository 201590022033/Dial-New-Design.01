[CmdletBinding()]
param(
    [string]$BlenderExe,
    [Parameter(Mandatory=$true)][string]$Generator,
    [Parameter(Mandatory=$true)][string]$ParamsFile,
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9][a-z0-9-]*$')][string]$AssetName,
    [string]$AssetLabel = 'Dial Designer component review'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$artifactDir = Join-Path $repoRoot ('.artifacts\blender-review\' + $AssetName)
$logPath = Join-Path $artifactDir 'review.log'
$script:reviewWriter = $null

function Find-Blender {
    if ($BlenderExe) {
        if (-not (Test-Path -LiteralPath $BlenderExe -PathType Leaf)) {
            throw "Blender executable does not exist: $BlenderExe"
        }
        return (Resolve-Path -LiteralPath $BlenderExe).Path
    }
    $preferred = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
    if (Test-Path -LiteralPath $preferred -PathType Leaf) { return $preferred }
    $command = Get-Command blender.exe -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($command) { return $command.Source }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)) {
        if (-not $base) { continue }
        $foundation = Join-Path $base 'Blender Foundation'
        if (-not (Test-Path -LiteralPath $foundation -PathType Container)) { continue }
        $candidates = Get-ChildItem -LiteralPath $foundation -Directory -Filter 'Blender*' |
            Sort-Object Name -Descending
        foreach ($candidate in $candidates) {
            $executable = Join-Path $candidate.FullName 'blender.exe'
            if (Test-Path -LiteralPath $executable -PathType Leaf) { return $executable }
        }
    }
    throw 'Blender not found. Supply -BlenderExe with the full path to blender.exe.'
}

function Write-ReviewLog([string]$Message) {
    $script:reviewWriter.WriteLine($Message)
    $script:reviewWriter.Flush()
    Write-Host $Message
}

function Invoke-Blender([string]$Step, [string[]]$BlenderArguments) {
    Write-ReviewLog "`n=== $Step ==="
    Write-ReviewLog ($script:blender + ' ' + ($BlenderArguments | ConvertTo-Json -Compress))
    # Windows PowerShell represents native stderr as ErrorRecord objects. Treat it
    # as log data; the process exit code, not stderr presence, determines failure.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $script:blender @BlenderArguments 2>&1 | ForEach-Object {
            Write-ReviewLog $_.ToString()
        }
        $code = $LASTEXITCODE
    }
    finally { $ErrorActionPreference = $previousPreference }
    Write-ReviewLog "Exit code: $code"
    if ($code -ne 0) { throw "$Step failed with exit code $code. See $logPath" }
}

try {
    New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
    # One writer avoids repeated Windows file-open races while Blender emits logs.
    $script:reviewWriter = [System.IO.StreamWriter]::new($logPath, $false, [System.Text.UTF8Encoding]::new($false))
    Write-ReviewLog $AssetLabel
    # Remove only this harness's known outputs, so stale artifacts cannot pass checks.
    foreach ($name in @(($AssetName + '.glb'), 'manifest.json', 'top.png', 'front.png', 'side.png', 'three-quarter.png')) {
        $oldOutput = Join-Path $artifactDir $name
        if (Test-Path -LiteralPath $oldOutput -PathType Leaf) { Remove-Item -LiteralPath $oldOutput }
    }
    $script:blender = Find-Blender
    Write-ReviewLog "Blender: $script:blender"
    Invoke-Blender -Step 'Version' -BlenderArguments @('--version')
    $glb = Join-Path $artifactDir ($AssetName + '.glb')
    $common = @('--background', '--factory-startup', '--python-exit-code', '1')
    Invoke-Blender -Step 'Generate component' -BlenderArguments ($common + @(
        '--python', $Generator, '--',
        '--params', $ParamsFile, '--quality', 'normal', '--output', $glb))
    if (-not (Test-Path -LiteralPath $glb -PathType Leaf) -or (Get-Item -LiteralPath $glb).Length -eq 0) {
        throw "Generator did not create a non-empty GLB: $glb"
    }
    Invoke-Blender -Step 'Validate GLB' -BlenderArguments ($common + @(
        '--python', (Join-Path $PSScriptRoot 'validate_glb.py'), '--', '--input', $glb))
    Invoke-Blender -Step 'Render review' -BlenderArguments ($common + @(
        '--python', (Join-Path $PSScriptRoot 'render_review.py'), '--', '--input', $glb,
        '--output-dir', $artifactDir, '--asset-label', $AssetLabel))
    $manifestPath = Join-Path $artifactDir 'manifest.json'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.mesh_count -lt 1 -or $manifest.vertex_count -lt 1 -or $manifest.views.Count -ne 4) {
        throw 'Review manifest has invalid mesh, vertex or view counts'
    }
    foreach ($name in @('top', 'front', 'side', 'three-quarter')) {
        $png = Join-Path $artifactDir ($name + '.png')
        if (-not (Test-Path -LiteralPath $png -PathType Leaf) -or (Get-Item -LiteralPath $png).Length -eq 0) {
            throw "Missing or empty review image: $png"
        }
        Write-ReviewLog "PNG: $png ($((Get-Item -LiteralPath $png).Length) bytes)"
    }
    Write-ReviewLog "GLB: $glb ($((Get-Item -LiteralPath $glb).Length) bytes)"
    Write-ReviewLog "Manifest: $manifestPath"
    Write-ReviewLog "Log: $logPath"
    exit 0
}
catch {
    $failure = "FAILED: $($_.Exception.Message)"
    if ($script:reviewWriter) {
        Write-ReviewLog $failure
    }
    [Console]::Error.WriteLine($failure)
    exit 1
}
finally {
    if ($script:reviewWriter) { $script:reviewWriter.Dispose() }
}
