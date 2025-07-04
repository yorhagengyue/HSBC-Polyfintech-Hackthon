# 🧪 Financial Alarm Clock - 功能测试指南

## ✅ 已修复的问题

### 1. **StockSearch组件错误修复**
- **问题**: `onAddStock is not a function`
- **原因**: StockSearch期望`onAddStock` prop，但Dashboard传递的是`onSelect`
- **修复**: 将StockSearch的prop从`onAddStock`改为`onSelect`

### 2. **搜索下拉框层级问题**
- **问题**: 搜索结果被其他元素遮挡
- **修复**: 
  - 搜索容器添加`z-50`
  - 下拉框使用`z-[100]`和内联`style={{ zIndex: 9999 }}`
  - Header设置为`z-40`

### 3. **StockManager Portal简化**
- **问题**: 过度复杂的pointer events控制导致交互问题
- **修复**: 移除自定义Portal容器，直接渲染到document.body

## 🔍 功能测试步骤

### 测试1：Header搜索功能
1. **打开应用**: http://localhost:5173
2. **使用搜索框**:
   - 在Header右侧的搜索框输入"AAPL"
   - ✅ 应该看到下拉列表显示"Apple Inc."
   - ✅ 下拉列表应该显示在所有元素之上
   - 点击搜索结果
   - ✅ 股票应该被添加到Legacy Watchlist

### 测试2：StockManager功能
1. **点击"Manage Stocks"按钮**:
   - ✅ 模态框应该正常弹出
   - ✅ 背景应该变暗且可点击关闭

2. **搜索功能**:
   - 在模态框内的搜索框输入"MSFT"
   - ✅ 应该显示"Microsoft Corporation"
   - 点击"+"按钮添加
   - ✅ 股票应该出现在下方的Your Watchlist中

3. **交互测试**:
   - ✅ 所有按钮应该可以点击
   - ✅ 刷新按钮应该旋转并更新数据
   - ✅ 删除按钮应该移除股票
   - ✅ X按钮或背景点击应该关闭模态框

### 测试3：数据流测试
1. **添加股票后**:
   - ✅ 关闭StockManager
   - ✅ Dashboard应该显示"User Custom Stocks"部分
   - ✅ 应该显示刚添加的股票及实时价格

2. **持久化测试**:
   - 刷新页面（F5）
   - ✅ StockManager中的股票应该保持
   - ✅ User Custom Stocks应该重新加载

## 🎯 两个股票列表的区别

1. **Legacy Watchlist** (传统观察列表)
   - 通过Header搜索框添加
   - 存储在组件state中
   - 刷新页面后会丢失

2. **User Custom Stocks** (用户自定义股票)
   - 通过StockManager添加
   - 存储在localStorage中
   - 刷新页面后保持

## ⚠️ 已知限制

1. **模拟数据**: 当前搜索只返回预定义的股票列表
2. **实时价格**: 需要后端服务运行才能获取真实价格
3. **两个列表独立**: Legacy Watchlist和User Custom Stocks互不影响

## 🔧 故障排除

### 如果搜索下拉框仍被遮挡：
1. 检查浏览器开发者工具
2. 确认搜索下拉框的z-index为9999
3. 确认Header的z-index为40

### 如果StockManager无法交互：
1. 检查控制台是否有错误
2. 确认模态框的z-index为9999
3. 尝试硬刷新（Ctrl+F5）

### 如果数据不更新：
1. 确认后端服务在运行：http://localhost:8000
2. 检查网络请求是否成功
3. 查看控制台错误信息

## 📝 测试检查清单

- [ ] Header搜索框能正常显示下拉列表
- [ ] 搜索结果不被其他元素遮挡
- [ ] 点击搜索结果能添加到watchlist
- [ ] StockManager按钮能打开模态框
- [ ] 模态框内所有交互正常
- [ ] 添加的股票显示在User Custom Stocks
- [ ] 刷新页面后StockManager的股票保持
- [ ] 关闭模态框的所有方式都正常

---

**最后更新**: 2025-01-03
**测试环境**: Chrome/Firefox/Edge最新版本 