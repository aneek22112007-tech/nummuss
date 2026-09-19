Write-Host "=============================="
Write-Host "1. Building Frontend"
Write-Host "=============================="
Set-Location -Path frontend
npm install
npm run build
Set-Location -Path ..

Write-Host "=============================="
Write-Host "2. Deploying Backend & Frontend via CDK"
Write-Host "=============================="
Set-Location -Path backend
if (-not (Test-Path -Path ".venv")) {
    python -m venv .venv
}
if (Test-Path -Path ".venv\Scripts\activate.ps1") {
    . .venv\Scripts\activate.ps1
} else {
    . .venv\bin\activate.ps1
}
pip install -r requirements.txt
npx cdk deploy --require-approval never
Set-Location -Path ..

Write-Host "=============================="
Write-Host "Deployment Complete!"
Write-Host "=============================="
