# ==============================================================================
# OceanSense — AWS One-Click Resume / Start Script
# Starts the stopped AWS EC2 instance back up when ready to test or present
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
        --filters "Name=tag:Name,Values=OceanSense-FreeTier" "Name=instance-state-name,Values=stopped" `
        --query "Reservations[0].Instances[0].InstanceId" `
        --output text
}

if ($instanceId -and $instanceId -notmatch "None") {
    Write-Host "Starting AWS Instance $instanceId..." -ForegroundColor Yellow
    aws ec2 start-instances --instance-ids $instanceId
    Write-Host "Waiting for public IP..." -ForegroundColor Yellow
    Start-Sleep -Seconds 6
    $publicIp = aws ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text

    Write-Host "`n✓ AWS Instance $instanceId is RUNNING!" -ForegroundColor Green
    Write-Host "  URL:         http://$publicIp:3000" -ForegroundColor Green
    Write-Host "  Backend API: http://$publicIp:5000/health" -ForegroundColor Green
} else {
    Write-Host "No stopped OceanSense instances found to resume." -ForegroundColor Yellow
    Write-Host "Run .\scripts\deploy-aws.ps1 to launch." -ForegroundColor Cyan
}
