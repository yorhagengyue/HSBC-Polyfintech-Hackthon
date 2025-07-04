#!/bin/bash

# HSBC Open Banking API Certificate Generation Script
# This script generates Transport and Signing certificates for HSBC Sandbox

echo "🔐 HSBC Open Banking Certificate Generation Script"
echo "=================================================="

# Create certificates directory
mkdir -p ../certs
cd ../certs

echo "📁 Created certificates directory: $(pwd)"

# Create eidas.conf
cat > eidas.conf << 'EOF'
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
EOF

echo "✅ Created eidas.conf configuration file"

# Generate Transport Certificate
echo ""
echo "🚀 Generating Transport Certificate..."
echo "======================================="

# Generate Transport private key
openssl genpkey -algorithm RSA \
  -pkeyopt rsa_keygen_bits:2048 \
  -out transport_private.key

echo "✅ Generated transport_private.key"

# Generate Transport CSR
openssl req -new \
  -config eidas.conf \
  -key transport_private.key \
  -out transport.csr \
  -nodes

echo "✅ Generated transport.csr"

# Generate Transport public key
openssl pkey -in transport_private.key -pubout \
  -out transport_public.pem

echo "✅ Generated transport_public.pem"

# Generate Signing Certificate
echo ""
echo "🔐 Generating Signing Certificate..."
echo "===================================="

# Generate Signing private key
openssl genpkey -algorithm RSA \
  -pkeyopt rsa_keygen_bits:2048 \
  -out signing_private.key

echo "✅ Generated signing_private.key"

# Generate Signing CSR
openssl req -new \
  -config eidas.conf \
  -key signing_private.key \
  -out signing.csr \
  -nodes

echo "✅ Generated signing.csr"

# Generate Signing public key
openssl pkey -in signing_private.key -pubout \
  -out signing_public.pem

echo "✅ Generated signing_public.pem"

# Display summary
echo ""
echo "🎉 Certificate Generation Complete!"
echo "==================================="
echo ""
echo "Generated files:"
echo "├── eidas.conf              (Configuration file)"
echo "├── transport_private.key   (Transport private key)"
echo "├── transport.csr          (Transport certificate request)"
echo "├── transport_public.pem   (Transport public key)"
echo "├── signing_private.key    (Signing private key)"
echo "├── signing.csr           (Signing certificate request)"
echo "└── signing_public.pem    (Signing public key)"
echo ""
echo "📋 Next steps:"
echo "1. Upload transport.csr and signing.csr to HSBC Dev Hub"
echo "2. Download the signed certificates from HSBC"
echo "3. Update your .env file with certificate paths"
echo ""
echo "🔗 HSBC Dev Hub: https://developer.hsbc.com/"
echo ""

# Display CSR content
echo "📄 Transport CSR Content:"
echo "========================="
openssl req -in transport.csr -noout -text | head -20

echo ""
echo "📄 Signing CSR Content:"
echo "======================="
openssl req -in signing.csr -noout -text | head -20 