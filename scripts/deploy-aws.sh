#!/usr/bin/env bash
# ==============================================================================
# OceanSense — AWS Zero-Cost Production Deployment (Bash)
# Region: ap-south-1 (Mumbai) | Free Tier Eligible (t3.micro)
# ==============================================================================

set -e

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-south-1}"

echo "======================================================================"
echo "  OCEANSENSE AWS ZERO-COST FREE-TIER DEPLOYMENT                       "
echo "======================================================================"

echo "[1/4] Checking AWS Caller Identity..."
aws sts get-caller-identity

echo "[2/4] Verifying Security Group 'oceansense-security-group'..."
SG_ID=$(aws ec2 describe-security-groups --group-names oceansense-security-group --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || true)

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    echo "Creating security group..."
    SG_ID=$(aws ec2 create-security-group --group-name oceansense-security-group --description "OceanSense Digital Twin Ingress" --output text)
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5000 --cidr 0.0.0.0/0
fi

echo "[3/4] Finding Free-Tier Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" --output text)

echo "[4/4] Launching or Checking Instance..."
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=OceanSense-FreeTier" "Name=instance-state-name,Values=running,stopped" --query "Reservations[0].Instances[0].InstanceId" --output text 2>/dev/null || true)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    echo "Launching t3.micro Free-Tier instance..."
    INSTANCE_ID=$(aws ec2 run-instances --image-id "$AMI_ID" --instance-type t3.micro --security-group-ids "$SG_ID" --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=OceanSense-FreeTier},{Key=CostProtection,Value=FreeTierSafe}]" --query "Instances[0].InstanceId" --output text)
    echo "Instance Launched: $INSTANCE_ID"
else
    echo "Found existing instance: $INSTANCE_ID. Ensuring it is started..."
    aws ec2 start-instances --instance-ids "$INSTANCE_ID" || true
fi

sleep 5
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
echo "======================================================================"
echo "✓ DEPLOYMENT READY: http://$PUBLIC_IP:3000"
echo "  Backend API:      http://$PUBLIC_IP:5000/health"
echo "======================================================================"
