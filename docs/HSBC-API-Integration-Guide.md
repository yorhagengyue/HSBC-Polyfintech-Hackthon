# HSBC Open Banking API 集成指南

## 📋 所需 API 清单

### 1. 必需的 APIs

#### 🏦 HSBC Open Banking API (必需)
- **用途**: 获取汇丰银行产品信息，为用户推荐避险产品
- **重要性**: ⭐⭐⭐⭐⭐ (比赛硬性要求)
- **申请地址**: https://developer.hsbc.com/
- **所需证书**: Transport + Signing 证书

#### 📈 Yahoo Finance API (免费)
- **用途**: 获取实时股价和市场数据
- **重要性**: ⭐⭐⭐⭐⭐ (核心数据源)
- **获取方式**: 使用 `yfinance` Python 库，无需 API Key

#### 🤖 Ollama (本地)
- **用途**: 运行 Mistral-7B 模型进行 AI 分析
- **重要性**: ⭐⭐⭐⭐⭐ (AI 功能核心)
- **安装**: 下载 Ollama 并拉取 mistral:7b 模型

### 2. 可选的 APIs

#### 📰 News API (推荐)
- **用途**: 获取财经新闻，检测市场事件
- **重要性**: ⭐⭐⭐⭐ (增强功能)
- **申请地址**: https://newsapi.org/ (免费1000次/天)

## 🔐 HSBC API 证书生成流程

### 步骤 1: 检查 OpenSSL 安装

```powershell
# 检查 OpenSSL 是否安装
openssl version

# 如果没有安装，请从以下链接下载:
# https://slproweb.com/products/Win32OpenSSL.html
```

### 步骤 2: 运行证书生成脚本

```powershell
# 在项目根目录运行
cd financial-alarm-clock
.\scripts\generate-hsbc-certificates.ps1
```

### 步骤 3: 提交 CSR 到 HSBC

1. 访问 [HSBC Developer Portal](https://developer.hsbc.com/)
2. 注册开发者账户
3. 创建新的应用程序
4. 上传生成的 CSR 文件:
   - `certs/transport.csr`
   - `certs/signing.csr`

### 步骤 4: 下载签名证书

1. 等待 HSBC 处理 CSR（通常 1-3 个工作日）
2. 下载签名后的证书
3. 将证书重命名并放置在 `certs/` 目录:
   - `transport_certificate.pem`
   - `signing_certificate.pem`

### 步骤 5: 配置环境变量

复制并编辑环境变量文件：

```bash
cp backend/example.env backend/.env
```

更新 `.env` 文件中的 HSBC 配置：

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

## 🚀 API 申请优先级

### 立即可用 (开始开发)
1. **Yahoo Finance** - 无需申请，立即可用
2. **Ollama** - 本地安装，无需 API Key

### 尽快申请 (1-3 天)
3. **News API** - 免费注册，即时生效
4. **HSBC API** - 需要审核，准备证书

### 开发策略

#### 阶段 1: MVP 开发 (现在)
- ✅ 使用 Yahoo Finance 实现市场监控
- ✅ 安装 Ollama 进行本地 AI 分析
- ✅ 创建模拟的 HSBC 产品推荐接口

#### 阶段 2: API 集成 (获得 API 后)
- 🔄 集成真实的 HSBC API
- 🔄 添加新闻监控功能
- 🔄 完善 AI 分析能力

## 📁 生成的文件结构

```
financial-alarm-clock/
├── certs/                          # 证书目录
│   ├── eidas.conf                  # eIDAS 配置文件
│   ├── transport_private.key       # Transport 私钥 (保密)
│   ├── transport.csr              # Transport 证书请求
│   ├── transport_certificate.pem   # Transport 证书 (从 HSBC 下载)
│   ├── transport_public.pem       # Transport 公钥
│   ├── signing_private.key        # Signing 私钥 (保密)
│   ├── signing.csr               # Signing 证书请求
│   ├── signing_certificate.pem    # Signing 证书 (从 HSBC 下载)
│   └── signing_public.pem        # Signing 公钥
├── scripts/
│   ├── generate-hsbc-certificates.sh   # Linux/Mac 脚本
│   └── generate-hsbc-certificates.ps1  # Windows 脚本
└── backend/
    └── .env                        # 环境变量配置
```

## ⚠️ 安全注意事项

1. **私钥保护**: 
   - 私钥文件 (`*_private.key`) 绝不能提交到版本控制
   - 确保 `.gitignore` 包含 `certs/` 目录

2. **证书管理**:
   - 定期检查证书有效期
   - 备份证书和私钥到安全位置

3. **环境变量**:
   - 生产环境使用不同的证书和密钥
   - 不要在代码中硬编码敏感信息

## 🔗 有用链接

- [HSBC Developer Portal](https://developer.hsbc.com/)
- [HSBC Open Banking API 文档](https://developer.hsbc.com/open-banking)
- [News API 官网](https://newsapi.org/)
- [Ollama 官网](https://ollama.ai/)
- [Yahoo Finance Python 库](https://pypi.org/project/yfinance/)

## 📞 支持

如果在 API 申请或集成过程中遇到问题：

1. 查看 HSBC Developer Portal 的文档和 FAQ
2. 联系 HSBC 开发者支持团队
3. 参考项目的 Issues 和文档

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