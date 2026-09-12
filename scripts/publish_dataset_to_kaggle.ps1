param(
    [string]$DatasetSlug = "kya-scene-hai-reviewed-data",
    [string]$ReviewedFile = ""
)

$ErrorActionPreference = "Stop"

if (-not $env:KAGGLE_USERNAME) {
    throw "KAGGLE_USERNAME is not set."
}

if (-not $env:KAGGLE_KEY) {
    throw "KAGGLE_KEY is not set. Use a Kaggle legacy API key for CLI auth."
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DataDir = Join-Path $RepoRoot "dataset\data"
$Stage = Join-Path $RepoRoot ".kaggle_staging\dataset"

if (Test-Path $Stage) {
    Remove-Item $Stage -Recurse -Force
}
New-Item -ItemType Directory -Path $Stage -Force | Out-Null

$Seeds = Join-Path $DataDir "seeds.jsonl"
if (-not (Test-Path $Seeds)) {
    throw "Missing dataset\data\seeds.jsonl"
}
Copy-Item $Seeds $Stage

if (-not $ReviewedFile) {
    $Candidate1 = Join-Path $DataDir "review_queue_reviewed.csv"
    $Candidate2 = Join-Path $DataDir "review_queue.csv"
    $Candidate3 = Join-Path $DataDir "clean_generated.jsonl"

    if (Test-Path $Candidate1) {
        $ReviewedFile = $Candidate1
    }
    elseif (Test-Path $Candidate2) {
        $ReviewedFile = $Candidate2
    }
    elseif (Test-Path $Candidate3) {
        $ReviewedFile = $Candidate3
    }
    else {
        throw "No reviewed dataset found."
    }
}

$ReviewedFile = (Resolve-Path $ReviewedFile).Path
Copy-Item $ReviewedFile $Stage

$DatasetId = "$($env:KAGGLE_USERNAME)/$DatasetSlug"

$Metadata = @{
    title = "Kya Scene Hai Reviewed Cognitive State Dataset"
    id = $DatasetId
    licenses = @(@{ name = "CC-BY-4.0" })
} | ConvertTo-Json -Depth 6

Set-Content `
    -Path (Join-Path $Stage "dataset-metadata.json") `
    -Value $Metadata `
    -Encoding UTF8

Write-Host "Staging dataset:"
Get-ChildItem $Stage | Format-Table Name, Length

Write-Host ""
Write-Host "Trying to create Kaggle dataset: $DatasetId"

& kaggle datasets create -p $Stage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Create failed (often means dataset already exists). Trying new version..."
    & kaggle datasets version -p $Stage -m "Updated reviewed dataset"
    if ($LASTEXITCODE -ne 0) {
        throw "Kaggle dataset create/version failed."
    }
}

Write-Host ""
Write-Host "Dataset is ready: $DatasetId"
