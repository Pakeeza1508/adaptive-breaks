param(
    [string]$Username = "pakeezakhalid",
    [string]$DatasetSlug = "kya-scene-hai-reviewed-data",
    [string]$KernelSlug = "kya-scene-hai-benchmark",
    [string]$MachineShape = "NvidiaTeslaT4",
    [int]$PollSeconds = 20,
    [int]$TimeoutMinutes = 60
)

$ErrorActionPreference = "Stop"

# ============================================================
# Kya Scene Hai - Kaggle Runner (UTF-8 safe)
# ============================================================

# Force UTF-8 for Kaggle CLI / Python output on Windows.
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
} catch {}

try {
    chcp 65001 | Out-Null
} catch {}

# -----------------------------
# Resolve paths
# -----------------------------
$RepoRoot = (Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath "..")).Path
$KernelDir = Join-Path -Path $RepoRoot -ChildPath "kaggle"
$MetadataPath = Join-Path -Path $KernelDir -ChildPath "kernel-metadata.json"

$KernelId = "$Username/$KernelSlug"
$DatasetId = "$Username/$DatasetSlug"
$CodePath = Join-Path -Path $KernelDir -ChildPath "train_and_compare.py"

if (-not (Test-Path $CodePath)) {
    throw "Missing Kaggle training script: $CodePath"
}

# -----------------------------
# Verify auth
# -----------------------------
Write-Host "Checking Kaggle authentication..."
& kaggle datasets list --mine | Out-Null

if ($LASTEXITCODE -ne 0) {
    throw "Kaggle authentication failed. Run: kaggle auth login --force"
}

Write-Host "Kaggle authentication OK."
Write-Host "Dataset:      $DatasetId"
Write-Host "Kernel:       $KernelId"
Write-Host "MachineShape: $MachineShape"
Write-Host ""

# -----------------------------
# Kernel metadata
# -----------------------------
$MetadataObject = @{
    id                  = $KernelId
    title               = "Kya Scene Hai Benchmark"
    code_file           = "train_and_compare.py"
    language            = "python"
    kernel_type         = "script"
    is_private          = $true
    enable_gpu          = $true
    enable_internet     = $true
    machine_shape       = $MachineShape
    dataset_sources     = @($DatasetId)
    competition_sources = @()
    kernel_sources      = @()
    model_sources       = @()
}

$MetadataJson = $MetadataObject | ConvertTo-Json -Depth 8
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($MetadataPath, $MetadataJson, $Utf8NoBom)

Write-Host "Kernel metadata written to:"
Write-Host $MetadataPath
Write-Host ""

# -----------------------------
# Submit
# -----------------------------
Write-Host "Submitting Kaggle kernel..."
& kaggle kernels push -p $KernelDir

if ($LASTEXITCODE -ne 0) {
    throw "Kaggle kernel submission failed."
}

Write-Host ""
Write-Host "Kernel submitted successfully."
Write-Host "Waiting for Kaggle run to finish..."
Write-Host ""

# -----------------------------
# Poll
# -----------------------------
$Deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$Completed = $false

while ((Get-Date) -lt $Deadline) {
    Start-Sleep -Seconds $PollSeconds

    $Status = (& kaggle kernels status $KernelId 2>&1 | Out-String).Trim()
    Write-Host $Status

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Status check failed once; retrying..."
        continue
    }

    if ($Status -match "(?i)\bcomplete(d)?\b") {
        $Completed = $true
        break
    }

    if ($Status -match "(?i)\b(error|failed|failure|cancelled|canceled)\b") {
        throw "Kaggle run failed. Inspect logs at: https://www.kaggle.com/code/$KernelId"
    }
}

if (-not $Completed) {
    throw "Timed out waiting for Kaggle run: $KernelId"
}

# -----------------------------
# Download outputs
# -----------------------------
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputDir = Join-Path -Path $RepoRoot -ChildPath ("artifacts\kaggle\" + $Stamp)
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host ""
Write-Host "Downloading Kaggle outputs..."
Write-Host "Destination: $OutputDir"
Write-Host ""

# Use UTF-8 environment for Kaggle CLI.
& kaggle kernels output $KernelId -p $OutputDir --force
$DownloadExitCode = $LASTEXITCODE

# Kaggle CLI on Windows can occasionally return non-zero only because its
# progress-bar Unicode cannot be printed, even though files were downloaded.
$Summary = Get-ChildItem -Path $OutputDir -Recurse -Filter "experiment_summary.md" -ErrorAction SilentlyContinue | Select-Object -First 1
$Ranking = Get-ChildItem -Path $OutputDir -Recurse -Filter "primary_state_ranking.csv" -ErrorAction SilentlyContinue | Select-Object -First 1
$Metrics = Get-ChildItem -Path $OutputDir -Recurse -Filter "metrics_summary.csv" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($DownloadExitCode -ne 0) {
    if (($null -ne $Summary) -and ($null -ne $Ranking) -and ($null -ne $Metrics)) {
        Write-Host ""
        Write-Warning "Kaggle CLI returned a non-zero exit code, but all required result files exist."
        Write-Warning "Treating the download as successful."
    }
    else {
        throw "Kaggle output download failed and required result files are missing."
    }
}

Write-Host ""
Write-Host "======================================"
Write-Host "KAGGLE EXPERIMENT COMPLETE"
Write-Host "======================================"
Write-Host "Local results: $OutputDir"

if ($null -ne $Summary) {
    Write-Host "Summary: $($Summary.FullName)"
}
if ($null -ne $Ranking) {
    Write-Host "Ranking: $($Ranking.FullName)"
}
if ($null -ne $Metrics) {
    Write-Host "Metrics: $($Metrics.FullName)"
}

$Environment = Get-ChildItem -Path $OutputDir -Recurse -Filter "environment.json" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $Environment) {
    Write-Host "Environment: $($Environment.FullName)"
}
