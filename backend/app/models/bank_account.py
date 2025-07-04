"""
Bank Account Models for HSBC API Integration
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any

from ..core.database import Base

class BankAccount(Base):
    """Bank account information from HSBC API"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # HSBC account identifiers
    account_id = Column(String(100), unique=True, index=True, nullable=False)
    account_number = Column(String(50), nullable=True)
    sort_code = Column(String(20), nullable=True)
    
    # Account details
    account_type = Column(String(50), nullable=True)  # Current, Savings, etc.
    account_subtype = Column(String(50), nullable=True)
    currency = Column(String(10), default="SGD")
    nickname = Column(String(100), nullable=True)
    
    # Account status
    status = Column(String(20), default="Active")
    opening_date = Column(DateTime, nullable=True)
    
    # Additional metadata from HSBC
    hsbc_metadata = Column(JSON, nullable=True)  # Store raw HSBC response
    
    # User association (for multi-user support)
    user_id = Column(String(100), nullable=True, index=True)  # Will be set from auth context
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    balances = relationship("AccountBalance", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BankAccount(id={self.id}, account_id={self.account_id}, type={self.account_type})>"

class AccountBalance(Base):
    """Account balance information"""
    __tablename__ = "account_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to account
    account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    
    # Balance details
    balance_type = Column(String(50), nullable=False)  # Available, Current, etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="SGD")
    
    # Balance date/time
    datetime = Column(DateTime, nullable=False)
    
    # Credit/Debit information
    credit_debit_indicator = Column(String(10), nullable=True)  # Credit, Debit
    
    # Additional metadata
    hsbc_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("BankAccount", back_populates="balances")
    
    def __repr__(self):
        return f"<AccountBalance(account_id={self.account_id}, type={self.balance_type}, amount={self.amount})>"

class Transaction(Base):
    """Transaction record from HSBC API"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to account
    account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    
    # HSBC transaction identifiers
    transaction_id = Column(String(100), nullable=True, index=True)
    transaction_reference = Column(String(100), nullable=True)
    
    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="SGD")
    credit_debit_indicator = Column(String(10), nullable=False)  # Credit, Debit
    
    # Transaction status and type
    status = Column(String(50), default="Booked")
    transaction_code = Column(String(50), nullable=True)
    transaction_subcode = Column(String(50), nullable=True)
    
    # Dates
    booking_datetime = Column(DateTime, nullable=False)
    value_datetime = Column(DateTime, nullable=True)
    
    # Transaction description and details
    description = Column(Text, nullable=True)
    merchant_name = Column(String(200), nullable=True)
    merchant_category_code = Column(String(10), nullable=True)
    
    # Additional transaction information
    balance_after = Column(Float, nullable=True)
    exchange_rate = Column(Float, nullable=True)
    
    # Categorization (for financial analysis)
    category = Column(String(100), nullable=True)  # Food, Transport, etc.
    subcategory = Column(String(100), nullable=True)
    
    # Additional metadata from HSBC
    hsbc_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("BankAccount", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, description={self.description})>"
    
    @property
    def is_credit(self) -> bool:
        """Check if transaction is a credit (money in)"""
        return self.credit_debit_indicator == "Credit"
    
    @property
    def is_debit(self) -> bool:
        """Check if transaction is a debit (money out)"""
        return self.credit_debit_indicator == "Debit"
    
    @property
    def signed_amount(self) -> float:
        """Get amount with proper sign (positive for credit, negative for debit)"""
        if self.is_credit:
            return abs(self.amount)
        else:
            return -abs(self.amount) 