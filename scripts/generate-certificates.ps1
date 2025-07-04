# HSBC Open Banking API Certificate Generation Script (Fixed for FireDaemon OpenSSL)
# This script generates Transport and Signing certificates for HSBC Sandbox

Write-Host "🔐 HSBC Open Banking Certificate Generation Script" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# OpenSSL executable path
$OpenSSLPath = "C:\Program Files\FireDaemon OpenSSL 3\bin\openssl.exe"

# Check if OpenSSL exists
if (-not (Test-Path $OpenSSLPath)) {
    Write-Host "❌ OpenSSL not found at: $OpenSSLPath" -ForegroundColor Red
    Write-Host "Please install OpenSSL or update the path in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Using OpenSSL at: $OpenSSLPath" -ForegroundColor Green

# Create certificates directory
$certsDir = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Force -Path $certsDir | Out-Null
Set-Location $certsDir

Write-Host "📁 Created certificates directory: $(Get-Location)" -ForegroundColor Yellow

# Create eidas.conf
$eidasConfig = @"
# eidas.conf for HSBC Open Banking API
[ req ]
distinguished_name = dn
prompt = no

[ OIDs ]
organizationIdentifier=2.5.4.97

[ dn ]
O=Financial Alarm Clock Pte Ltd
L=Singapore
C=SG
organizationIdentifier=PSDSG-SGFIN-202501001
CN=financial-alarm-clock.sg
"@

$eidasConfig | Out-File -FilePath "eidas.conf" -Encoding ASCII
Write-Host "✅ Created eidas.conf configuration file" -ForegroundColor Green

# Generate Transport Certificate
Write-Host ""
Write-Host "🚀 Generating Transport Certificate..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Generate Transport private key
& $OpenSSLPath genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out transport_private.key
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated transport_private.key" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate transport private key" -ForegroundColor Red
    exit 1
}

# Generate Transport CSR
& $OpenSSLPath req -new -config eidas.conf -key transport_private.key -out transport.csr -nodes
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated transport.csr" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate transport CSR" -ForegroundColor Red
    exit 1
}

# Generate Transport public key
& $OpenSSLPath pkey -in transport_private.key -pubout -out transport_public.pem
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated transport_public.pem" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate transport public key" -ForegroundColor Red
    exit 1
}

# Generate Signing Certificate
Write-Host ""
Write-Host "🔐 Generating Signing Certificate..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Generate Signing private key
& $OpenSSLPath genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out signing_private.key
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated signing_private.key" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate signing private key" -ForegroundColor Red
    exit 1
}

# Generate Signing CSR
& $OpenSSLPath req -new -config eidas.conf -key signing_private.key -out signing.csr -nodes
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated signing.csr" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate signing CSR" -ForegroundColor Red
    exit 1
}

# Generate Signing public key
& $OpenSSLPath pkey -in signing_private.key -pubout -out signing_public.pem
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Generated signing_public.pem" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate signing public key" -ForegroundColor Red
    exit 1
}

# Display summary
Write-Host ""
Write-Host "🎉 Certificate Generation Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Yellow
Write-Host "├── eidas.conf              (Configuration file)"
Write-Host "├── transport_private.key   (Transport private key)"
Write-Host "├── transport.csr          (Transport certificate request)"
Write-Host "├── transport_public.pem   (Transport public key)"
Write-Host "├── signing_private.key    (Signing private key)"
Write-Host "├── signing.csr           (Signing certificate request)"
Write-Host "└── signing_public.pem    (Signing public key)"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload transport.csr and signing.csr to HSBC Dev Hub"
Write-Host "2. Download the signed certificates from HSBC"
Write-Host "3. Update your .env file with certificate paths"
Write-Host ""
Write-Host "🔗 HSBC Dev Hub: https://developer.hsbc.com/" -ForegroundColor Blue
Write-Host ""

# Display file list
Write-Host "📁 Generated files in $(Get-Location):" -ForegroundColor Yellow
Get-ChildItem -Name | ForEach-Object { Write-Host "   $_" }

Write-Host ""
Write-Host "📄 Transport CSR Preview:" -ForegroundColor Cyan
& $OpenSSLPath req -in transport.csr -noout -text | Select-Object -First 10

Write-Host ""
Write-Host "📄 Signing CSR Preview:" -ForegroundColor Cyan
& $OpenSSLPath req -in signing.csr -noout -text | Select-Object -First 10

Write-Host ""
Write-Host "⚠️  Important: Keep private keys secure and never commit them to version control!" -ForegroundColor Red 