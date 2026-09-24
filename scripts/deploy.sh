#!/usr/bin/env bash
# ==============================================================================
# OceanSense — Production Cloud Deployment Automation Script
# Supports: GCP Cloud Run, AWS ECS/App Runner, or Docker Compose VM Deployment
# ==============================================================================

set -e

# ANSI Color formatting
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  OCEANSENSE DIGITAL TWIN — PRODUCTION DEPLOYMENT ENGINE             ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# Check deployment mode
DEPLOY_TARGET="${1:-compose}" # 'compose', 'gcp', or 'aws'

echo -e "${GREEN}Target Deployment Mode:${NC} ${DEPLOY_TARGET}"

if [ "$DEPLOY_TARGET" == "compose" ]; then
    echo -e "${YELLOW}[1/4] Checking Docker and Docker Compose environment...${NC}"
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}[Error] Docker is not installed or not in PATH.${NC}" >&2; exit 1; }

    echo -e "${YELLOW}[2/4] Building production container images...${NC}"
    docker compose build --parallel

    echo -e "${YELLOW}[3/4] Launching services in background (PostgreSQL, Redis, Backend, Frontend)...${NC}"
    docker compose up -d

    echo -e "${YELLOW}[4/4] Verifying stack health...${NC}"
    sleep 5
    docker compose ps

    echo -e "${GREEN}======================================================================${NC}"
    echo -e "${GREEN}✓ OceanSense Stack Successfully Deployed!                            ${NC}"
    echo -e "${GREEN}  Frontend & Digital Twin: http://localhost:3000                     ${NC}"
    echo -e "${GREEN}  Backend Core API:        http://localhost:5000/health              ${NC}"
    echo -e "${GREEN}  WebSocket Bus:           ws://localhost:3000/ws                    ${NC}"
    echo -e "${GREEN}======================================================================${NC}"

elif [ "$DEPLOY_TARGET" == "gcp" ]; then
    echo -e "${YELLOW}[GCP] Deploying to Google Cloud Run & Artifact Registry...${NC}"
    
    if [ -z "$GCP_PROJECT_ID" ]; then
        echo -e "${RED}[Error] GCP_PROJECT_ID environment variable is required.${NC}"
        exit 1
    fi

    REGION="${GCP_REGION:-asia-south1}"
    BACKEND_IMAGE="gcr.io/${GCP_PROJECT_ID}/oceansense-backend:latest"
    FRONTEND_IMAGE="gcr.io/${GCP_PROJECT_ID}/oceansense-frontend:latest"

    echo -e "${CYAN}Building & Pushing Backend Image to GCP Container Registry...${NC}"
    docker build -t "$BACKEND_IMAGE" ./backend
    docker push "$BACKEND_IMAGE"

    echo -e "${CYAN}Building & Pushing Frontend Image to GCP Container Registry...${NC}"
    docker build -t "$FRONTEND_IMAGE" ./frontend
    docker push "$FRONTEND_IMAGE"

    echo -e "${CYAN}Deploying Backend to Google Cloud Run...${NC}"
    gcloud run deploy oceansense-backend \
        --image "$BACKEND_IMAGE" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 5000 \
        --set-env-vars NODE_ENV=production,PORT=5000

    echo -e "${CYAN}Deploying Frontend to Google Cloud Run...${NC}"
    gcloud run deploy oceansense-frontend \
        --image "$FRONTEND_IMAGE" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 80

    echo -e "${GREEN}✓ GCP Cloud Run Deployment Complete!${NC}"

elif [ "$DEPLOY_TARGET" == "aws" ]; then
    echo -e "${YELLOW}[AWS] Deploying to AWS ECR & App Runner / ECS...${NC}"
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo -e "${RED}[Error] AWS_ACCOUNT_ID environment variable is required.${NC}"
        exit 1
    fi

    REGION="${AWS_REGION:-ap-south-1}"
    ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

    echo -e "${CYAN}Authenticating Docker with AWS ECR...${NC}"
    aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_URL"

    echo -e "${CYAN}Building & Tagging Containers...${NC}"
    docker build -t "${ECR_URL}/oceansense-backend:latest" ./backend
    docker build -t "${ECR_URL}/oceansense-frontend:latest" ./frontend

    echo -e "${CYAN}Pushing images to AWS ECR...${NC}"
    docker push "${ECR_URL}/oceansense-backend:latest"
    docker push "${ECR_URL}/oceansense-frontend:latest"

    echo -e "${GREEN}✓ AWS ECR Push Complete! Trigger ECS service update or App Runner deploy.${NC}"
else
    echo -e "${RED}Unknown deployment target: ${DEPLOY_TARGET}. Use 'compose', 'gcp', or 'aws'.${NC}"
    exit 1
fi
