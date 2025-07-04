# 🔧 Financial Alarm Clock - 故障排除指南

## 🐛 当前已知问题

### 1. **"依然无法添加已有的到watch list"**

#### 症状：
- 点击搜索结果的加号按钮后，股票没有出现在Legacy Watchlist中
- Console显示状态已更新，但UI没有变化

#### 调试步骤：

1. **打开浏览器控制台** (F12) 并清空日志

2. **执行添加操作**，应该看到：
```javascript
// 搜索并点击加号后的日志
"StockSearch: handleSelectStock called with: {symbol: 'MSFT', ...}"
"StockSearch: calling onSelect with: MSFT"
"handleStockSelect called with: MSFT"
"Current watchlist: ['AAPL', 'GOOGL', 'TSLA']"
"Adding to watchlist, new list: ['AAPL', 'GOOGL', 'TSLA', 'MSFT']"
"Watchlist updated: ['AAPL', 'GOOGL', 'TSLA', 'MSFT']"  // 新增的调试日志
```

3. **检查React DevTools**
   - 安装React Developer Tools浏览器扩展
   - 在Components标签中搜索"Dashboard"
   - 查看`watchlist`状态是否包含新股票

4. **强制刷新测试**
   - 硬刷新页面 (Ctrl+F5)
   - 检查watchlist是否重置为初始值

### 2. **"No stocks found for 'amd'"**

#### 原因：
- ~~搜索使用的是mock数据，只包含预定义的股票~~
- 已修复：现在使用真实API，但后端API可能只返回部分股票

#### 解决方案：
- 确保后端服务在运行：http://localhost:8000
- 尝试搜索完整的股票代码（大写）：AMD
- 使用StockManager添加自定义股票

### 3. **WebSocket连接错误**

#### 症状：
```
WebSocket error: Event {isTrusted: true, type: 'error'...}
WebSocket disconnected
```

#### 解决方案：
- 这是正常的，WebSocket会自动重连
- 不影响股票搜索和添加功能

### 4. **DOM嵌套警告**

#### 症状：
```
Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>
```

#### 影响：
- 仅是警告，不影响功能
- 在MarketOverview组件中的布局问题

## 🔍 诊断检查清单

### 前端检查：
- [ ] 前端运行在 http://localhost:5173
- [ ] 控制台无红色错误（除了WebSocket重连）
- [ ] 网络标签显示API请求成功（200状态码）

### 后端检查：
- [ ] 后端运行在 http://localhost:8000
- [ ] API文档可访问：http://localhost:8000/docs
- [ ] `/api/v1/search?query=AAPL` 返回结果

### 状态检查：
- [ ] watchlist初始值：['AAPL', 'GOOGL', 'TSLA']
- [ ] 添加新股票后，日志显示数组长度增加
- [ ] React DevTools显示状态已更新

## 💡 临时解决方案

如果Header搜索仍有问题：

### 使用StockManager（推荐）
1. 点击蓝色的"Manage Stocks"按钮
2. 在模态框内搜索股票
3. 点击"+"添加
4. 这些股票保存在localStorage，刷新后保持

### 手动刷新
如果状态更新但UI没变化：
1. 切换主题（强制重新渲染）
2. 点击"Edit Watchlist"再点击"Done"
3. 最后手段：刷新页面

## 🚀 完整修复步骤

1. **停止所有服务** (Ctrl+C)

2. **清理并重启**
```bash
# 前端
cd financial-alarm-clock/frontend
npm run dev

# 后端（新终端）
cd financial-alarm-clock/backend
python -m uvicorn app.main:app --reload
```

3. **清除浏览器缓存**
   - Chrome: Ctrl+Shift+Delete
   - 选择"缓存的图片和文件"
   - 清除最近1小时

4. **测试流程**
   - 打开 http://localhost:5173
   - 打开开发者工具Console
   - 搜索"NVDA"（不在初始列表中）
   - 点击加号
   - 检查是否出现在Legacy Watchlist

## 📞 需要更多帮助？

如果问题仍然存在，请提供：
1. 完整的Console日志
2. Network标签中失败的请求（如果有）
3. React DevTools中的Dashboard组件状态截图

---

**最后更新**: 2025-01-03
**版本**: 1.0.0 