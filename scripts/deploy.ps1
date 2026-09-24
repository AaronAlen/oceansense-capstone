# ==============================================================================
# OceanSense — Windows PowerShell Production Deployment & Verification Script
# ==============================================================================

param (
    [string]$Target = "compose"
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  OCEANSENSE DIGITAL TWIN — WINDOWS DEPLOYMENT SCRIPT                 " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

if ($Target -eq "compose") {
    Write-Host "[1/3] Building production Docker containers..." -ForegroundColor Yellow
    docker compose build

    Write-Host "[2/3] Starting container cluster in background..." -ForegroundColor Yellow
    docker compose up -d

    Write-Host "[3/3] Checking service status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 4
    docker compose ps

    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host "✓ OceanSense Full-Stack Successfully Running!" -ForegroundColor Green
    Write-Host "  Frontend & 3D Twin: http://localhost:3000" -ForegroundColor Green
    Write-Host "  Backend Core API:   http://localhost:5000/health" -ForegroundColor Green
    Write-Host "  WebSocket Stream:   ws://localhost:3000/ws" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
}
elseif ($Target -eq "down") {
    Write-Host "Stopping and cleaning up containers..." -ForegroundColor Yellow
    docker compose down
    Write-Host "Containers stopped." -ForegroundColor Green
}
else {
    Write-Host "Usage: .\scripts\deploy.ps1 [-Target compose|down]" -ForegroundColor Red
}
