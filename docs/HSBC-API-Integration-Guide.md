# HSBC Open Banking API Integration Guide

## 📋 Required API List

### 1. Required APIs

#### 🏦 HSBC Open Banking API (Required)
- **Purpose**: Get HSBC banking product information, recommend hedging products for users
- **Importance**: ⭐⭐⭐⭐⭐ (Competition hard requirement)
- **Application URL**: https://developer.hsbc.com/
- **Required Certificates**: Transport + Signing certificates

#### 📈 Yahoo Finance API (Free)
- **Purpose**: Get real-time stock prices and market data
- **Importance**: ⭐⭐⭐⭐⭐ (Core data source)
- **Access Method**: Use `yfinance` Python library, no API Key needed

#### 🤖 Ollama (Local)
- **Purpose**: Run Mistral-7B model for AI analysis
- **Importance**: ⭐⭐⭐⭐⭐ (AI functionality core)
- **Installation**: Download Ollama and pull mistral:7b model

### 2. Optional APIs

#### 📰 News API (Recommended)
- **Purpose**: Get financial news, detect market events
- **Importance**: ⭐⭐⭐⭐ (Enhanced functionality)
- **Application URL**: https://newsapi.org/ (Free 1000 calls/day)

## 🔐 HSBC API Certificate Generation Process

### Step 1: Check OpenSSL Installation

```powershell
# Check if OpenSSL is installed
openssl version

# If not installed, download from:
# https://slproweb.com/products/Win32OpenSSL.html
```

### Step 2: Run Certificate Generation Script

```powershell
# Run in project root directory
cd financial-alarm-clock
.\scripts\generate-hsbc-certificates.ps1
```

### Step 3: Submit CSR to HSBC

1. Visit [HSBC Developer Portal](https://developer.hsbc.com/)
2. Register developer account
3. Create new application
4. Upload generated CSR files:
   - `certs/transport.csr`
   - `certs/signing.csr`

### Step 4: Download Signed Certificates

1. Wait for HSBC to process CSR (usually 1-3 business days)
2. Download signed certificates
3. Rename and place certificates in `certs/` directory:
   - `transport_certificate.pem`
   - `signing_certificate.pem`

### Step 5: Configure Environment Variables

Copy and edit environment variables file:

```bash
cp backend/example.env backend/.env
```

Update HSBC configuration in `.env` file:

```env
# HSBC API Configuration
HSBC_API_KEY=your_actual_api_key_from_hsbc_dev_portal
HSBC_API_BASE_URL=https://sandbox.hsbc.com/open-banking/v1

# HSBC Certificate Paths
HSBC_TRANSPORT_CERT_PATH=../certs/transport_certificate.pem
HSBC_TRANSPORT_KEY_PATH=../certs/transport_private.key
HSBC_SIGNING_CERT_PATH=../certs/signing_certificate.pem
HSBC_SIGNING_KEY_PATH=../certs/signing_private.key
```

## 🚀 API Application Priority

### Immediately Available (Start Development)
1. **Yahoo Finance** - No application needed, immediately available
2. **Ollama** - Local installation, no API Key needed

### Apply ASAP (1-3 days)
3. **News API** - Free registration, instant activation
4. **HSBC API** - Requires review, prepare certificates

### Development Strategy

#### Phase 1: MVP Development (Now)
- ✅ Use Yahoo Finance to implement market monitoring
- ✅ Install Ollama for local AI analysis
- ✅ Create mock HSBC product recommendation interface

#### Phase 2: API Integration (After getting APIs)
- 🔄 Integrate real HSBC API
- 🔄 Add news monitoring functionality
- 🔄 Enhance AI analysis capabilities

## 📁 Generated File Structure

```
financial-alarm-clock/
├── certs/                          # Certificate directory
│   ├── eidas.conf                  # eIDAS configuration file
│   ├── transport_private.key       # Transport private key (confidential)
│   ├── transport.csr              # Transport certificate request
│   ├── transport_certificate.pem   # Transport certificate (download from HSBC)
│   ├── transport_public.pem       # Transport public key
│   ├── signing_private.key        # Signing private key (confidential)
│   ├── signing.csr               # Signing certificate request
│   ├── signing_certificate.pem    # Signing certificate (download from HSBC)
│   └── signing_public.pem        # Signing public key
├── scripts/
│   ├── generate-hsbc-certificates.sh   # Linux/Mac script
│   └── generate-hsbc-certificates.ps1  # Windows script
└── backend/
    └── .env                        # Environment variable configuration
```

## ⚠️ Security Considerations

1. **Private Key Protection**: 
   - Private key files (`*_private.key`) must never be committed to version control
   - Ensure `.gitignore` includes `certs/` directory

2. **Certificate Management**:
   - Regularly check certificate validity period
   - Backup certificates and private keys to secure location

3. **Environment Variables**:
   - Use different certificates and keys for production environment
   - Don't hardcode sensitive information in code

## 🔗 Useful Links

- [HSBC Developer Portal](https://developer.hsbc.com/)
- [HSBC Open Banking API Documentation](https://developer.hsbc.com/open-banking)
- [News API Official Website](https://newsapi.org/)
- [Ollama Official Website](https://ollama.ai/)
- [Yahoo Finance Python Library](https://pypi.org/project/yfinance/)

## 📞 Support

If you encounter problems during API application or integration:

1. Check HSBC Developer Portal documentation and FAQ
2. Contact HSBC developer support team
3. Refer to project Issues and documentation

## 📋 Registration Success ✅

**App successfully registered on HSBC Developer Portal!**

### 🔑 API Credentials
- **Client ID**: `xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4`
- **KID String**: `1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5`
- **Organization ID**: `temasek_po_11529`
- **Brand**: HSBC Malta Personal
- **Country**: Singapore
- **Client URL**: https://localhost:3000
- **Redirect URL**: https://tpms-website.onrender.com/

### 🏆 Competition Details
- **Event**: PolyFintech100 Hackathon — Intelligent Banking by HSBC
- **Institution**: Temasek Polytechnic
- **Registration Date**: 02 Jul 2025

## 🚀 Next Steps

### 1. Download Test Certificates
**IMPORTANT**: You need to download the test certificates from the HSBC Developer Portal:

1. Go to your HSBC Developer Portal dashboard
2. Find the "Test certificates" section
3. Download:
   - **Transport Certificate** → Save as `certs/transport_certificate.pem`
   - **Signing Certificate** → Save as `certs/signing_certificate.pem`

### 2. Certificate File Structure
```
certs/
├── eidas.conf (✅ Generated)
├── transport_private.key (✅ Generated)
├── transport.csr (✅ Generated) 
├── transport_public.pem (✅ Generated)
├── transport_certificate.pem (✅ Downloaded & Configured)
├── signing_private.key (✅ Generated)
├── signing.csr (✅ Generated)
├── signing_public.pem (✅ Generated)
└── signing_certificate.pem (✅ Downloaded & Configured)
```

### 3. Available APIs
- Uses `private_key_jwt` authentication method
- Sandbox environment ready for testing
- Full API documentation available in developer portal

## 🔧 Technical Implementation

### Environment Configuration
All credentials are pre-configured in `backend/.env`:

```env
HSBC_CLIENT_ID=xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4
HSBC_KID=1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5
HSBC_ORG_ID=temasek_po_11529
HSBC_API_BASE_URL=https://sandbox.hsbc.com/open-banking/v1
HSBC_BRAND=HSBC Malta Personal
```

### Authentication Flow
1. Generate JWT using `private_key_jwt` method
2. Sign with your private signing key
3. Include KID in JWT header
4. Use transport certificate for mTLS

## 📚 Development Resources

- **HSBC Developer Portal**: Access your dashboard for API docs
- **Postman Collection**: Available for download from portal
- **Sandbox Testing**: Fully functional test environment
- **API Documentation**: Comprehensive guides in developer portal

## ⚠️ Security Notes

- Never commit `.env` file to version control
- Keep private keys secure and never share them
- Use only sandbox URLs during development
- Rotate certificates before production deployment

---

**Status**: 🟢 **READY FOR DEVELOPMENT** - All certificates configured! 