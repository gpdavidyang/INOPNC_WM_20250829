# Windows Surfer Cache Clearing Script
# This script clears Vite cache, dist directories, and other build artifacts

Write-Host "=== Windows Surfer Cache Clearing Script ===" -ForegroundColor Green
Write-Host "Clearing all build cache and temporary files..." -ForegroundColor Yellow

# Clear Vite cache directories
Write-Host "`n[1/3] Clearing Vite cache directories..." -ForegroundColor Cyan
$viteDirs = @(
    "doc\node_modules\.vite",
    "inopnc-navi\node_modules\.vite", 
    "main\node_modules\.vite",
    "money\node_modules\.vite",
    "site\node_modules\.vite",
    "worklog\node_modules\.vite"
)

$viteCleared = 0
foreach ($dir in $viteDirs) {
    $fullPath = Join-Path $PSScriptRoot $dir
    if (Test-Path $fullPath) {
        Write-Host "  Removing: $dir"
        Remove-Item -Path $fullPath -Recurse -Force
        $viteCleared++
    } else {
        Write-Host "  Already cleared: $dir" -ForegroundColor Gray
    }
}
Write-Host "  Vite cache cleared: $viteCleared directories" -ForegroundColor Green

# Clear dist directories
Write-Host "`n[2/3] Clearing dist directories..." -ForegroundColor Cyan
$distDirs = @(
    "doc\dist",
    "main\dist", 
    "money\dist",
    "site\dist",
    "worklog\dist"
)

$distCleared = 0
foreach ($dir in $distDirs) {
    $fullPath = Join-Path $PSScriptRoot $dir
    if (Test-Path $fullPath) {
        Write-Host "  Removing: $dir"
        Remove-Item -Path $fullPath -Recurse -Force
        $distCleared++
    } else {
        Write-Host "  Already cleared: $dir" -ForegroundColor Gray
    }
}
Write-Host "  Dist directories cleared: $distCleared directories" -ForegroundColor Green

# Clear any temporary files
Write-Host "`n[3/3] Clearing temporary files..." -ForegroundColor Cyan
$tempFiles = @(
    "*.log",
    "*.tmp",
    ".DS_Store",
    "Thumbs.db"
)

$tempCleared = 0
foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path $PSScriptRoot -Recurse -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $fullPath = Join-Path $PSScriptRoot $file
        if (Test-Path $fullPath) {
            Write-Host "  Removing: $file"
            Remove-Item -Path $fullPath -Force
            $tempCleared++
        }
    }
}
Write-Host "  Temporary files cleared: $tempCleared files" -ForegroundColor Green

Write-Host "`n=== Cache Clearing Complete! ===" -ForegroundColor Green
Write-Host "Total cleared: $viteCleared Vite caches, $distCleared dist directories, $tempCleared temp files" -ForegroundColor Yellow
Write-Host "You can now rebuild your projects with fresh cache." -ForegroundColor White
