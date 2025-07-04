"""
Banking API Schemas for request/response validation
"""

from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class BankAccountResponse(BaseModel):
    """Bank account response schema"""
    id: int
    account_id: str
    account_number: Optional[str] = None
    sort_code: Optional[str] = None
    account_type: Optional[str] = None
    account_subtype: Optional[str] = None
    currency: str = "SGD"
    nickname: Optional[str] = None
    status: str = "Active"
    opening_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_synced_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class BankAccountListResponse(BaseModel):
    """Response for account list endpoint"""
    accounts: List[BankAccountResponse]
    total_count: int
    last_updated: Optional[datetime] = None
    warning: Optional[str] = None

class AccountBalanceResponse(BaseModel):
    """Account balance response schema"""
    id: int
    balance_type: str
    amount: float
    currency: str = "SGD"
    datetime: datetime
    credit_debit_indicator: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class TransactionResponse(BaseModel):
    """Transaction response schema"""
    id: int
    transaction_id: Optional[str] = None
    transaction_reference: Optional[str] = None
    amount: float
    currency: str = "SGD"
    credit_debit_indicator: str
    status: str = "Booked"
    booking_datetime: datetime
    value_datetime: Optional[datetime] = None
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    merchant_category_code: Optional[str] = None
    balance_after: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields for frontend compatibility
    is_credit: bool = Field(default=False, description="Whether this is a credit transaction")
    is_debit: bool = Field(default=False, description="Whether this is a debit transaction")
    signed_amount: float = Field(default=0.0, description="Amount with sign based on credit/debit")
    
    @model_validator(mode='before')
    @classmethod
    def compute_fields(cls, values):
        """Compute derived fields"""
        if isinstance(values, dict):
            credit_debit = values.get('credit_debit_indicator', '')
            amount = values.get('amount', 0)
            
            values['is_credit'] = credit_debit == "Credit"
            values['is_debit'] = credit_debit == "Debit"
            values['signed_amount'] = abs(amount) if values['is_credit'] else -abs(amount)
        else:
            # Handle SQLAlchemy object
            credit_debit = getattr(values, 'credit_debit_indicator', '')
            amount = getattr(values, 'amount', 0)
            
            values.is_credit = credit_debit == "Credit"
            values.is_debit = credit_debit == "Debit" 
            values.signed_amount = abs(amount) if values.is_credit else -abs(amount)
        
        return values
    
    model_config = {"from_attributes": True}

class TransactionListResponse(BaseModel):
    """Response for transaction list endpoint"""
    transactions: List[TransactionResponse]
    total_count: int
    from_date: datetime
    to_date: datetime
    warning: Optional[str] = None

class BankingSummaryResponse(BaseModel):
    """Banking summary for dashboard"""
    total_accounts: int
    total_balance: float
    currency: str = "SGD"
    last_updated: datetime
    accounts: List[BankAccountResponse]

class TransactionCategoryBredown(BaseModel):
    """Transaction category breakdown"""
    category: str
    total_amount: float
    transaction_count: int
    percentage: float

class SpendingAnalysisResponse(BaseModel):
    """Spending analysis response"""
    period: str  # "last_30_days", "last_week", etc.
    total_spending: float
    total_income: float
    net_flow: float
    currency: str = "SGD"
    categories: List[TransactionCategoryBredown]
    daily_breakdown: List[Dict[str, Any]]
    
class AccountPerformanceResponse(BaseModel):
    """Account performance metrics"""
    account_id: str
    account_type: str
    current_balance: float
    balance_change_7d: float
    balance_change_30d: float
    transaction_count_7d: int
    transaction_count_30d: int
    average_transaction_amount: float
    largest_transaction: float
    currency: str = "SGD"

# Request schemas

class SyncRequest(BaseModel):
    """Request to sync banking data"""
    account_ids: Optional[List[str]] = None  # If None, sync all accounts
    include_transactions: bool = True
    include_balances: bool = True
    transaction_days: int = Field(default=30, ge=1, le=365)

class TransactionSearchRequest(BaseModel):
    """Request for transaction search"""
    query: str = Field(..., min_length=1)
    account_ids: Optional[List[str]] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    transaction_type: Optional[str] = None  # "Credit", "Debit"
    categories: Optional[List[str]] = None
    limit: int = Field(default=50, ge=1, le=500)

class TransactionSearchResponse(BaseModel):
    """Response for transaction search"""
    transactions: List[TransactionResponse]
    total_count: int
    query: str
    filters_applied: Dict[str, Any]

class BudgetAlert(BaseModel):
    """Budget alert configuration"""
    category: str
    monthly_limit: float
    current_spending: float
    percentage_used: float
    days_remaining: int
    alert_threshold: float = 80.0  # Alert when 80% of budget is used
    
class BudgetAnalysisResponse(BaseModel):
    """Budget analysis response"""
    month: str
    alerts: List[BudgetAlert]
    total_budget: float
    total_spending: float
    budget_utilization: float
    projected_month_end_spending: float 