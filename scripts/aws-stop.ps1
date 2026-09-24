# ==============================================================================
# OceanSense — AWS One-Click Cost Protection Stop Script
# Stops the running AWS EC2 instance immediately to freeze all credit consumption
# ==============================================================================

$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "" }
$env:AWS_DEFAULT_REGION = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "ap-south-1" }

$infoFile = Join-Path $PSScriptRoot "aws-instance.json"

if (Test-Path $infoFile) {
    $info = Get-Content $infoFile | ConvertFrom-Json
    $instanceId = $info.InstanceId
} else {
    $instanceId = aws ec2 describe-instances `
        --filters "Name=tag:Name,Values=OceanSense-FreeTier" "Name=instance-state-name,Values=running" `
        --query "Reservations[0].Instances[0].InstanceId" `
        --output text
}

if ($instanceId -and $instanceId -notmatch "None") {
    Write-Host "Stopping AWS Instance $instanceId to conserve credits..." -ForegroundColor Yellow
    aws ec2 stop-instances --instance-ids $instanceId
    Write-Host "`n✓ AWS Instance $instanceId is now STOPPED." -ForegroundColor Green
    Write-Host "  Compute hours are paused. Zero credit usage while stopped." -ForegroundColor Green
    Write-Host "  Run .\scripts\aws-start.ps1 whenever you want to resume." -ForegroundColor Cyan
} else {
    Write-Host "No active running OceanSense instances found." -ForegroundColor Green
}
