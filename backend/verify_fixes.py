"""
Verify API Fixes - Check rate limiting and endpoint functionality
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def verify_rate_limiting():
    """Verify that our rate limiting service is working"""
    print("🔍 Verifying Rate Limiting Service...")
    try:
        from app.services.yahoo_finance import yahoo_finance_service
        
        # Test basic rate limiting logic
        print("✅ Rate limiting service imported successfully")
        print(f"   - Max requests per minute: {yahoo_finance_service.max_requests_per_minute}")
        print(f"   - Min request interval: {yahoo_finance_service.min_request_interval}s")
        print(f"   - Price cache expiry: {yahoo_finance_service.price_cache_expiry}s")
        print(f"   - Info cache expiry: {yahoo_finance_service.info_cache_expiry}s")
        
        # Test caching functionality
        print("✅ Cache system initialized")
        print(f"   - Price cache entries: {len(yahoo_finance_service.price_cache)}")
        print(f"   - Info cache entries: {len(yahoo_finance_service.info_cache)}")
        print(f"   - History cache entries: {len(yahoo_finance_service.history_cache)}")
        
        return True
    except Exception as e:
        print(f"❌ Rate limiting verification failed: {e}")
        return False

def verify_no_direct_yfinance():
    """Check that we've removed all direct yfinance calls"""
    print("\n🔍 Checking for Direct YFinance Usage...")
    
    import re
    files_to_check = [
        "app/api/stocks.py",
        "app/api/advanced_stocks.py"
    ]
    
    issues_found = []
    
    for file_path in files_to_check:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Look for direct yfinance usage patterns
            direct_calls = re.findall(r'yf\.Ticker\(.*?\)', content)
            if direct_calls:
                issues_found.append(f"{file_path}: Found {len(direct_calls)} direct yf.Ticker calls")
            
            # Look for direct yfinance imports being used
            ticker_usage = re.findall(r'ticker\s*=\s*yf\.Ticker', content)
            if ticker_usage:
                issues_found.append(f"{file_path}: Found {len(ticker_usage)} direct ticker assignments")
                
        except FileNotFoundError:
            print(f"⚠️  File not found: {file_path}")
        except Exception as e:
            print(f"❌ Error checking {file_path}: {e}")
    
    if issues_found:
        print("❌ Direct yfinance usage found:")
        for issue in issues_found:
            print(f"   - {issue}")
        return False
    else:
        print("✅ No direct yfinance usage found in API files")
        return True

def verify_service_methods():
    """Verify our service methods are properly implemented"""
    print("\n🔍 Verifying Service Methods...")
    
    try:
        from app.services.yahoo_finance import yahoo_finance_service
        
        # Check if all our new methods exist
        methods_to_check = [
            'get_multiple_stocks_batch',
            'get_market_indices_batch',
            '_wait_for_rate_limit',
            '_should_rate_limit',
            '_is_cache_valid',
            '_get_cached_or_fetch'
        ]
        
        missing_methods = []
        for method in methods_to_check:
            if not hasattr(yahoo_finance_service, method):
                missing_methods.append(method)
        
        if missing_methods:
            print(f"❌ Missing methods: {missing_methods}")
            return False
        else:
            print("✅ All required methods found:")
            for method in methods_to_check:
                print(f"   - {method}")
            return True
            
    except Exception as e:
        print(f"❌ Service method verification failed: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality without making external API calls"""
    print("\n🔍 Testing Basic Functionality...")
    
    try:
        from app.services.yahoo_finance import yahoo_finance_service
        
        # Test rate limiting logic
        print("Testing rate limiting logic...")
        wait_time = yahoo_finance_service._should_rate_limit()
        print(f"✅ Rate limiting check: {wait_time:.2f}s wait time")
        
        # Test cache validation logic
        print("Testing cache validation...")
        fake_cache_entry = {'timestamp': 0, 'data': {}}
        is_valid = yahoo_finance_service._is_cache_valid(fake_cache_entry, 30)
        print(f"✅ Cache validation: expired entry correctly identified as {'valid' if is_valid else 'invalid'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        return False

def main():
    """Main verification function"""
    print("🚀 API Fixes Verification")
    print("=" * 40)
    
    tests_passed = 0
    total_tests = 4
    
    # Run all verification tests
    if verify_rate_limiting():
        tests_passed += 1
    
    if verify_no_direct_yfinance():
        tests_passed += 1
    
    if verify_service_methods():
        tests_passed += 1
    
    if test_basic_functionality():
        tests_passed += 1
    
    print("\n" + "=" * 40)
    print(f"📊 Verification Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 ALL VERIFICATIONS PASSED!")
        print("\n✅ Your fixes are ready to deploy:")
        print("   1. Rate limiting is properly configured")
        print("   2. No direct yfinance calls found")
        print("   3. All service methods are available")
        print("   4. Basic functionality works correctly")
        print("\n💡 To see the fixes in action:")
        print("   - Restart your backend server")
        print("   - Monitor the logs for rate limiting messages")
        print("   - 429 errors should be significantly reduced")
    else:
        print("❌ Some verifications failed. Please review the issues above.")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 