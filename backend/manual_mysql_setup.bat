@echo off
echo 🐬 MySQL 手动安装指南
echo.
echo 1. 下载MySQL Community Server:
echo    https://dev.mysql.com/downloads/mysql/
echo.
echo 2. 安装MySQL并记住root密码
echo.
echo 3. 打开MySQL命令行工具:
echo    mysql -u root -p
echo.
echo 4. 创建数据库和用户:
echo    CREATE DATABASE financial_alarm;
echo    CREATE USER 'financial_user'@'localhost' IDENTIFIED BY 'financial_password';
echo    GRANT ALL PRIVILEGES ON financial_alarm.* TO 'financial_user'@'localhost';
echo    FLUSH PRIVILEGES;
echo    exit;
echo.
echo 5. 测试连接:
echo    cd backend
echo    python test_database.py
echo.
pause 