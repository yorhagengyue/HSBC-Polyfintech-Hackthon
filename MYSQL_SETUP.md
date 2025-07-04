# 🐬 MySQL 数据库设置指南

## 快速开始 (推荐使用Docker)

### 1. 启动MySQL服务
```bash
# 在项目根目录运行
docker-compose -f docker-compose.mysql.yml up -d
```

### 2. 验证MySQL连接
```bash
# 进入backend目录
cd financial-alarm-clock/backend

# 运行数据库测试
python test_database.py
```

### 3. 访问数据库管理界面
- **phpMyAdmin**: http://localhost:8080
- **用户名**: root
- **密码**: password

---

## 手动安装MySQL (可选)

### Windows
1. 下载MySQL Community Server: https://dev.mysql.com/downloads/mysql/
2. 安装并设置root密码为 `password`
3. 创建数据库:
```sql
CREATE DATABASE financial_alarm;
CREATE USER 'financial_user'@'localhost' IDENTIFIED BY 'financial_password';
GRANT ALL PRIVILEGES ON financial_alarm.* TO 'financial_user'@'localhost';
FLUSH PRIVILEGES;
```

### macOS (使用Homebrew)
```bash
brew install mysql
brew services start mysql
mysql -u root -p
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

---

## 🔧 数据库配置

### 当前配置 (config.py)
```python
DATABASE_URL = "mysql+aiomysql://root:password@localhost:3306/financial_alarm"
```

### 自定义配置
您可以通过环境变量自定义数据库连接：

```bash
# .env 文件
DATABASE_URL=mysql+aiomysql://用户名:密码@主机:端口/数据库名
```

---

## 🧪 测试连接

```bash
# 测试数据库连接和初始化
python test_database.py
```

预期输出：
```
🧪 Testing Database Setup...
✅ Database tables created successfully
✅ Default user and sample data created successfully
✅ Found user: demo_user (ID: 1)
✅ Found preferences: threshold=3.0%, density=detailed
✅ Found 5 watchlist items: AAPL, GOOGL, MSFT, TSLA, AMZN
🎉 Database test completed successfully!
```

---

## 🚨 故障排除

### 连接被拒绝
```
pymysql.err.OperationalError: (2003, "Can't connect to MySQL server...")
```
**解决方案**:
1. 确保MySQL服务正在运行
2. 检查端口3306是否开放
3. 验证用户名密码是否正确

### 数据库不存在
```
pymysql.err.OperationalError: (1049, "Unknown database 'financial_alarm'")
```
**解决方案**:
```sql
CREATE DATABASE financial_alarm;
```

### 权限被拒绝
```
pymysql.err.OperationalError: (1045, "Access denied for user...")
```
**解决方案**:
1. 检查用户名密码
2. 确保用户有数据库权限
3. 使用GRANT命令分配权限

---

## 📊 数据库结构

MySQL数据库将包含以下表：
- `users` - 用户信息
- `user_preferences` - 用户偏好设置
- `watchlists` - 股票观察列表
- `alerts` - 价格警报记录

所有表将自动创建并填充示例数据。 