"""
HSBC API Mock Simulator
When network issues prevent connection to real API, provides mock data for development testing
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class HSBCMockClient:
    """HSBC API mock client for development testing"""
    
    def __init__(self):
        self.is_connected = True
        logger.info("🎭 HSBC mock simulator enabled - for development testing")
    
    async def health_check(self) -> bool:
        """Mock health check - always returns True"""
        await asyncio.sleep(0.1)  # Simulate network delay
        return True
    
    async def get_accounts(self) -> List[Dict[str, Any]]:
        """Mock get accounts list"""
        # Enhanced mock account data (5 accounts for better demo)
        mock_accounts = [
            {
                "AccountId": "acc-001-current",
                "Status": "Active",
                "StatusUpdateDateTime": datetime.now().isoformat(),
                "Currency": "SGD",
                "AccountType": "Personal",
                "AccountSubType": "CurrentAccount",
                "Nickname": "HSBC Advance Current",
                "OpeningDate": "2020-01-15",
                "Account": [{
                    "SchemeName": "HSBC.SGD.Current",
                    "Identification": "****-****-****-0001",
                    "Name": "HSBC Advance Current Account"
                }]
            },
            {
                "AccountId": "acc-002-savings",
                "Status": "Active", 
                "StatusUpdateDateTime": datetime.now().isoformat(),
                "Currency": "SGD",
                "AccountType": "Personal",
                "AccountSubType": "Savings",
                "Nickname": "HSBC Premier Savings",
                "OpeningDate": "2020-01-15",
                "Account": [{
                    "SchemeName": "HSBC.SGD.Savings",
                    "Identification": "****-****-****-0002",
                    "Name": "HSBC Premier Savings Account"
                }]
            },
            {
                "AccountId": "acc-003-business",
                "Status": "Active",
                "StatusUpdateDateTime": datetime.now().isoformat(), 
                "Currency": "USD",
                "AccountType": "Business",
                "AccountSubType": "CurrentAccount",
                "Nickname": "Business USD Current",
                "OpeningDate": "2021-06-01",
                "Account": [{
                    "SchemeName": "HSBC.USD.Business",
                    "Identification": "****-****-****-0003",
                    "Name": "HSBC Business USD Current Account"
                }]
            },
            {
                "AccountId": "acc-004-investment",
                "Status": "Active",
                "StatusUpdateDateTime": datetime.now().isoformat(),
                "Currency": "SGD",
                "AccountType": "Investment",
                "AccountSubType": "Investment",
                "Nickname": "HSBC Investment Account",
                "OpeningDate": "2022-03-10",
                "Account": [{
                    "SchemeName": "HSBC.SGD.Investment",
                    "Identification": "****-****-****-0004",
                    "Name": "HSBC Investment Portfolio Account"
                }]
            },
            {
                "AccountId": "acc-005-credit",
                "Status": "Active",
                "StatusUpdateDateTime": datetime.now().isoformat(),
                "Currency": "SGD",
                "AccountType": "Credit",
                "AccountSubType": "CreditCard",
                "Nickname": "HSBC Premier Credit Card",
                "OpeningDate": "2021-11-20",
                "Account": [{
                    "SchemeName": "HSBC.SGD.Credit",
                    "Identification": "****-****-****-0005",
                    "Name": "HSBC Premier Credit Card Account"
                }]
            }
        ]
        
        logger.info(f"🎭 Mock returned {len(mock_accounts)} accounts")
        return mock_accounts
    
    async def get_account_balances(self, account_id: str) -> Dict[str, Any]:
        """Mock get account balance"""
        await asyncio.sleep(0.1)
        
        # Generate realistic balances based on account ID
        if account_id == "acc-001-current":
            # HSBC Advance Current Account
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "25847.63",
                        "Currency": "SGD"
                    }
                }, {
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit", 
                    "Type": "Current",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "25847.63",
                        "Currency": "SGD"
                    }
                }]
            }
        elif account_id == "acc-002-savings":
            # HSBC Premier Savings Account
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available", 
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "184529.88",
                        "Currency": "SGD"
                    }
                }]
            }
        elif account_id == "acc-003-business":
            # Business USD Current Account
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "45230.25",
                        "Currency": "USD"
                    }
                }]
            }
        elif account_id == "acc-004-investment":
            # HSBC Investment Portfolio Account
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "298750.44",
                        "Currency": "SGD"
                    }
                }, {
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "InterimAvailable",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "298750.44",
                        "Currency": "SGD"
                    }
                }]
            }
        elif account_id == "acc-005-credit":
            # HSBC Premier Credit Card Account
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "18750.00",
                        "Currency": "SGD"
                    }
                }, {
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Debit",
                    "Type": "Current",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "3247.85",
                        "Currency": "SGD"
                    }
                }]
            }
        else:
            # Default balance for unknown accounts
            balance_data = {
                "Balance": [{
                    "AccountId": account_id,
                    "CreditDebitIndicator": "Credit",
                    "Type": "Available",
                    "DateTime": datetime.now().isoformat(),
                    "Amount": {
                        "Amount": "10000.00",
                        "Currency": "SGD"
                    }
                }]
            }
        
        logger.info(f"🎭 Mock returned balance for account {account_id}")
        return balance_data
    
    async def get_transactions(self, account_id: str, from_date: datetime, to_date: datetime) -> List[Dict[str, Any]]:
        """Mock get transaction history"""
        await asyncio.sleep(0.2)
        
        mock_transactions = []
        
        # Generate realistic transaction data based on account type
        base_date = from_date
        
        # Define transaction templates based on account type
        if account_id == "acc-001-current":
            # Current account - daily spending
            transaction_templates = [
                {"type": "debit", "desc": "Starbucks Coffee", "amount": 6.50, "category": "5814"},
                {"type": "debit", "desc": "Grab Food Delivery", "amount": 23.80, "category": "5812"},
                {"type": "debit", "desc": "NTUC FairPrice", "amount": 156.45, "category": "5411"},
                {"type": "debit", "desc": "Shell Petrol Station", "amount": 78.90, "category": "5541"},
                {"type": "credit", "desc": "Salary Deposit", "amount": 5500.00, "category": "0000"},
                {"type": "debit", "desc": "Netflix Subscription", "amount": 16.98, "category": "5815"},
                {"type": "debit", "desc": "Uber Ride", "amount": 12.30, "category": "4121"},
                {"type": "credit", "desc": "Cashback Reward", "amount": 45.20, "category": "0000"}
            ]
        elif account_id == "acc-002-savings":
            # Savings account - fewer, larger transactions
            transaction_templates = [
                {"type": "credit", "desc": "Monthly Savings Transfer", "amount": 2000.00, "category": "0000"},
                {"type": "credit", "desc": "Bonus Deposit", "amount": 8500.00, "category": "0000"},
                {"type": "credit", "desc": "Investment Dividend", "amount": 325.50, "category": "0000"},
                {"type": "debit", "desc": "Transfer to Investment", "amount": 5000.00, "category": "0000"},
                {"type": "credit", "desc": "Interest Earned", "amount": 28.75, "category": "0000"}
            ]
        elif account_id == "acc-003-business":
            # Business account - business transactions
            transaction_templates = [
                {"type": "credit", "desc": "Client Payment - ABC Corp", "amount": 12500.00, "category": "0000"},
                {"type": "debit", "desc": "Office Supplies", "amount": 245.80, "category": "5943"},
                {"type": "debit", "desc": "AWS Cloud Services", "amount": 186.50, "category": "5734"},
                {"type": "credit", "desc": "Freelance Project", "amount": 3200.00, "category": "0000"},
                {"type": "debit", "desc": "Business Insurance", "amount": 450.00, "category": "6300"},
                {"type": "debit", "desc": "Software License", "amount": 299.99, "category": "5734"}
            ]
        elif account_id == "acc-004-investment":
            # Investment account - investment transactions
            transaction_templates = [
                {"type": "credit", "desc": "Stock Dividend - Apple Inc", "amount": 1250.00, "category": "0000"},
                {"type": "debit", "desc": "Stock Purchase - Tesla", "amount": 8500.00, "category": "0000"},
                {"type": "credit", "desc": "Bond Interest Payment", "amount": 425.75, "category": "0000"},
                {"type": "debit", "desc": "Investment Management Fee", "amount": 125.00, "category": "6012"},
                {"type": "credit", "desc": "Mutual Fund Distribution", "amount": 675.30, "category": "0000"}
            ]
        elif account_id == "acc-005-credit":
            # Credit card - spending transactions
            transaction_templates = [
                {"type": "debit", "desc": "Zalora Online Shopping", "amount": 189.90, "category": "5651"},
                {"type": "debit", "desc": "Din Tai Fung", "amount": 98.50, "category": "5812"},
                {"type": "credit", "desc": "Payment Received", "amount": 1500.00, "category": "0000"},
                {"type": "debit", "desc": "Apple App Store", "amount": 4.98, "category": "5815"},
                {"type": "debit", "desc": "Sephora Beauty", "amount": 145.60, "category": "5977"}
            ]
        else:
            # Default transactions
            transaction_templates = [
                {"type": "debit", "desc": "General Purchase", "amount": 50.00, "category": "0000"},
                {"type": "credit", "desc": "Deposit", "amount": 200.00, "category": "0000"}
            ]
        
        # Generate transactions for recent days
        for i in range(min(15, len(transaction_templates))):
            template = transaction_templates[i % len(transaction_templates)]
            days_back = i
            trans_date = base_date + timedelta(days=days_back)
            
            # Get currency based on account
            currency = "USD" if account_id == "acc-003-business" else "SGD"
            
            transaction = {
                "TransactionId": f"txn-{account_id}-{i+1:05d}",
                "TransactionReference": f"TXN{datetime.now().strftime('%Y%m%d')}{i+1:03d}",
                "Amount": {
                    "Amount": f"{template['amount']:.2f}",
                    "Currency": currency
                },
                "CreditDebitIndicator": "Credit" if template['type'] == 'credit' else "Debit",
                "Status": "Booked",
                "BookingDateTime": trans_date.isoformat(),
                "ValueDateTime": trans_date.isoformat(),
                "TransactionInformation": template['desc'],
                "MerchantDetails": {
                    "MerchantName": template['desc'],
                    "MerchantCategoryCode": template['category']
                },
                "ProprietaryBankTransactionCode": {
                    "Code": "TRF" if template['type'] == 'credit' else "POS",
                    "Issuer": "HSBC"
                }
            }
            
            mock_transactions.append(transaction)
        
        logger.info(f"🎭 Mock returned {len(mock_transactions)} transactions for account {account_id}")
        return mock_transactions
    
    async def close(self):
        """Mock close connection"""
        logger.info("🎭 HSBC mock simulator connection closed")

# Global mock instance
hsbc_mock_client = HSBCMockClient() 