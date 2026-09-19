#!/bin/bash
set -e

echo "=============================="
echo "1. Building Frontend"
echo "=============================="
cd frontend
npm install
npm run build
cd ..

echo "=============================="
echo "2. Deploying Backend & Frontend via CDK"
echo "=============================="
cd backend
# Create and activate virtual environment if not exists
if [ ! -d ".venv" ]; then
    python -m venv .venv
fi
# On Windows, activate scripts are in Scripts
if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi
pip install -r requirements.txt
npx cdk deploy --require-approval never
cd ..

echo "=============================="
echo "Deployment Complete!"
echo "=============================="
