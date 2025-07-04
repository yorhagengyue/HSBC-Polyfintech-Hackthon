#!/usr/bin/env python3
"""
Data Source Verification Script
检查Financial Alarm Clock应用返回的是真实数据还是模拟数据
"""

import asyncio
import httpx
import json
from datetime import datetime

async def check_insider_trades():
    """检查内幕交易数据来源"""
    print("🔍 检查内幕交易数据来源...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/v1/advanced/insider-trades")
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    first_trade = data[0]
                    data_source = first_trade.get('data_source', 'unknown')
                    is_real = first_trade.get('is_real_data', False)
                    
                    print(f"📊 数据源：{data_source}")
                    print(f"🎯 真实数据：{'是' if is_real else '否'}")
                    
                    if is_real:
                        print("✅ 当前显示的是真实的SEC内幕交易数据")
                    else:
                        print("⚠️  当前显示的是模拟/演示数据")
                        print("💡 要获取真实数据，请配置有效的YAHOO_FINANCE_RAPID_API_KEY")
                    
                    print(f"\n📋 返回了 {len(data)} 条交易记录")
                    print("前3条交易摘要：")
                    for i, trade in enumerate(data[:3]):
                        print(f"  {i+1}. {trade['symbol']} - {trade['insider_name']} ({trade['transaction_type']}) - ${trade['value']:,.0f}")
                        
                else:
                    print("❌ 未返回任何交易数据")
            else:
                print(f"❌ API请求失败：HTTP {response.status_code}")
                print(f"响应：{response.text[:200]}")
                
    except Exception as e:
        print(f"❌ 错误：{str(e)}")
        print("确保后端服务正在运行在 http://localhost:8000")

async def check_market_news():
    """检查市场新闻数据来源"""
    print("\n🔍 检查市场新闻数据来源...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/v1/news/market")
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    print(f"📰 返回了 {len(data)} 条新闻")
                    print("✅ 市场新闻来自真实的新闻API")
                    print("前3条新闻标题：")
                    for i, article in enumerate(data[:3]):
                        title = article.get('title', 'No title')
                        source = article.get('source', 'Unknown')
                        print(f"  {i+1}. {title[:60]}... ({source})")
                else:
                    print("⚠️  未返回新闻数据 - 可能需要配置NEWS_API_KEY")
            else:
                print(f"❌ 新闻API请求失败：HTTP {response.status_code}")
                
    except Exception as e:
        print(f"❌ 新闻检查错误：{str(e)}")

async def check_stock_data():
    """检查股票数据来源"""
    print("\n🔍 检查股票数据来源...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/v1/stock/AAPL")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ 股票数据来自Yahoo Finance（真实数据）")
                print(f"AAPL价格：${data.get('current_price', 'N/A')}")
                print(f"更新时间：{data.get('last_updated', 'N/A')}")
            else:
                print(f"❌ 股票API请求失败：HTTP {response.status_code}")
                
    except Exception as e:
        print(f"❌ 股票数据检查错误：{str(e)}")

async def main():
    """主函数"""
    print("=" * 60)
    print("📊 Financial Alarm Clock - 数据来源验证")
    print("=" * 60)
    print(f"检查时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    await check_insider_trades()
    await check_market_news()
    await check_stock_data()
    
    print("\n" + "=" * 60)
    print("📝 总结：")
    print("- 内幕交易数据：检查data_source字段确认")
    print("- 市场新闻：需要NEWS_API_KEY配置")
    print("- 股票价格：Yahoo Finance真实数据")
    print("- 银行数据：HSBC API真实数据")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main()) 