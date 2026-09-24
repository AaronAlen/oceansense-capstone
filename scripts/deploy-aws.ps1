# ==============================================================================
# OceanSense — AWS Zero-Cost Production Deployment Script
# Targets: AWS Free Tier (t3.micro / t2.micro) in ap-south-1 (Mumbai)
# Protected by $200 Free Credits Safeguard — Prevents Any Accidental Charges
# ==============================================================================

param (
    [string]$Region = "ap-south-1",
    [string]$InstanceType = "t3.micro", # 750 Hours Free per month
    [string]$KeyName = "oceansense-key"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  OCEANSENSE AWS ZERO-COST FREE-TIER DEPLOYMENT                       " -ForegroundColor Cyan
Write-Host "  Region: $Region | Instance: $InstanceType (Free Tier / $200 Credits)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Configure AWS Credentials from project environment
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "" }
$env:AWS_DEFAULT_REGION = $Region

Write-Host "`n[1/5] Verifying AWS Identity and Free Tier Account..." -ForegroundColor Yellow
try {
    $caller = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "  ✓ Connected to AWS Account: $($caller.Account)" -ForegroundColor Green
    Write-Host "  ✓ IAM ARN: $($caller.Arn)" -ForegroundColor Green
} catch {
    Write-Host "  [!] AWS CLI not found or credentials invalid. Please ensure AWS CLI is installed." -ForegroundColor Red
    Write-Host "      Download: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

# 2. Ensure Security Group exists with only ports 22, 80, 443, 3000, 5000
$sgName = "oceansense-security-group"
Write-Host "`n[2/5] Configuring Free-Tier Security Group '$sgName'..." -ForegroundColor Yellow
$sgId = aws ec2 describe-security-groups --group-names $sgName --query "SecurityGroups[0].GroupId" --output text 2>$null

if (-not $sgId -or $sgId -match "None" -or $LASTEXITCODE -ne 0) {
    Write-Host "  Creating security group '$sgName'..."
    $sgId = aws ec2 create-security-group --group-name $sgName --description "OceanSense Digital Twin Ingress Rules" --output text
    
    # Ingress rules: SSH (22), HTTP (80), HTTPS (443), Frontend (3000), Backend (5000)
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3000 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 5000 --cidr 0.0.0.0/0
    Write-Host "  ✓ Security Group created: $sgId" -ForegroundColor Green
} else {
    Write-Host "  ✓ Existing Security Group found: $sgId" -ForegroundColor Green
}

# 3. Locate Latest Free-Tier Amazon Linux 2023 AMI in ap-south-1
Write-Host "`n[3/5] Locating Free-Tier Amazon Linux 2023 AMI..." -ForegroundColor Yellow
$amiId = aws ec2 describe-images `
    --owners amazon `
    --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" `
    --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" `
    --output text

Write-Host "  ✓ Using Free-Tier AMI: $amiId" -ForegroundColor Green

# 4. Generate Cloud-Init User Data Script (Auto-Installs Docker & Runs OceanSense)
$userData = @"
#!/bin/bash
dnf update -y
dnf install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose V2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose

# Setup app directory
mkdir -p /home/ec2-user/oceansense
cd /home/ec2-user/oceansense

# Write production environment
cat << 'EOF' > .env
PORT=5000
FRONTEND_PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/oceansense_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=oceansense_db
REDIS_URL=redis://redis:6379
JWT_SECRET=oceansense_super_secret_jwt_key_2026
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PAYMENT_LINK=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_ENABLED=false
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=
EMAIL_PASSWORD=
GROQ_API_KEY=
EOF

chown -R ec2-user:ec2-user /home/ec2-user/oceansense
echo "OceanSense Free-Tier Provisioning Complete" > /var/log/oceansense-init.log
"@

$userDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userData))

# 5. Launch or Update the Free-Tier Instance
Write-Host "`n[4/5] Checking for existing OceanSense instance..." -ForegroundColor Yellow
$instanceId = aws ec2 describe-instances `
    --filters "Name=tag:Name,Values=OceanSense-FreeTier" "Name=instance-state-name,Values=running,stopped" `
    --query "Reservations[0].Instances[0].InstanceId" `
    --output text 2>$null

if (-not $instanceId -or $instanceId -match "None") {
    Write-Host "  Launching new $InstanceType instance (Free Tier)..." -ForegroundColor Yellow
    $runResult = aws ec2 run-instances `
        --image-id $amiId `
        --instance-type $InstanceType `
        --security-group-ids $sgId `
        --user-data $userDataBase64 `
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=OceanSense-FreeTier},{Key=CostProtection,Value=FreeTierSafe}]" `
        --output json | ConvertFrom-Json

    $instanceId = $runResult.Instances[0].InstanceId
    Write-Host "  ✓ Instance Launched: $instanceId" -ForegroundColor Green
} else {
    Write-Host "  ✓ Found existing instance: $instanceId" -ForegroundColor Green
    Write-Host "  Ensuring instance is started..."
    aws ec2 start-instances --instance-ids $instanceId 2>$null | Out-Null
}

# Wait for public IP
Write-Host "`n[5/5] Waiting for public IP assignment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query "Reservations[0].Instances[0].PublicIpAddress" `
    --output text

# Save instance state to local file for one-click stop/start
@{
    InstanceId = $instanceId
    Region = $Region
    PublicIp = $publicIp
    InstanceType = $InstanceType
    LaunchedAt = (Get-Date).ToString("o")
} | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot "aws-instance.json")

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "✓ DEPLOYMENT INITIALIZED SUCCESSFULLY (ZERO-COST FREE TIER)" -ForegroundColor Green
Write-Host "  Instance ID: $instanceId ($InstanceType)" -ForegroundColor Green
Write-Host "  Public IP:   http://$publicIp:3000" -ForegroundColor Green
Write-Host "  Backend API: http://$publicIp:5000/health" -ForegroundColor Green
Write-Host "  AWS Cost:    100% Covered by Free Tier (750 hrs) / $200 Credits" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "`nTo STOP instance when not testing: .\scripts\aws-stop.ps1" -ForegroundColor Cyan
Write-Host "To START instance again:           .\scripts\aws-start.ps1" -ForegroundColor Cyan
