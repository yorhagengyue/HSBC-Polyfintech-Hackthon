"""
Banking API endpoints for HSBC integration - Fixed for async/await
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Header
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from ..core.database import get_db
from ..core.hsbc_client import hsbc_client, HSBCAPIError
from ..models.bank_account import BankAccount, AccountBalance, Transaction
from ..schemas.banking import (
    BankAccountResponse, 
    AccountBalanceResponse, 
    TransactionResponse,
    BankAccountListResponse,
    TransactionListResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Simple user authentication (header-based for now)
async def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Get current user ID from header (simplified auth for demo)"""
    if not x_user_id:
        # For demo purposes, use a default user
        return "demo_user"
    return x_user_id

@router.get("/banking/health", tags=["banking"])
async def banking_health_check():
    """Check HSBC API connectivity"""
    try:
        is_healthy = await hsbc_client.health_check()
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "hsbc_api": "connected" if is_healthy else "disconnected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Banking health check failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/banking/accounts", response_model=BankAccountListResponse, tags=["banking"])
async def get_accounts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    force_refresh: bool = Query(False, description="Force refresh from HSBC API")
):
    """Get user's bank accounts"""
    try:
        # Check if we have cached accounts (unless force refresh)
        if not force_refresh:
            result = await db.execute(select(BankAccount).where(
                BankAccount.user_id == user_id
            ))
            cached_accounts = result.scalars().all()
            
            if cached_accounts:
                logger.info(f"Returning {len(cached_accounts)} cached accounts for user {user_id}")
                return BankAccountListResponse(
                    accounts=[BankAccountResponse.model_validate(acc) for acc in cached_accounts],
                    total_count=len(cached_accounts),
                    last_updated=max(acc.updated_at for acc in cached_accounts) if cached_accounts else None
                )
        
        # Fetch from HSBC API
        try:
            hsbc_accounts = await hsbc_client.get_accounts()
            logger.info(f"Fetched {len(hsbc_accounts)} accounts from HSBC API")
        except HSBCAPIError as e:
            logger.warning(f"HSBC API error: {e.message}")
            # Fallback to cached data if available
            result = await db.execute(select(BankAccount).where(
                BankAccount.user_id == user_id
            ))
            cached_accounts = result.scalars().all()
            
            if cached_accounts:
                return BankAccountListResponse(
                    accounts=[BankAccountResponse.model_validate(acc) for acc in cached_accounts],
                    total_count=len(cached_accounts),
                    last_updated=max(acc.updated_at for acc in cached_accounts),
                    warning="Using cached data due to API error"
                )
            else:
                raise HTTPException(
                    status_code=503, 
                    detail=f"HSBC API unavailable and no cached data: {e.message}"
                )
        
        # Update database with fresh data
        db_accounts = []
        for hsbc_account in hsbc_accounts:
            # Check if account already exists
            result = await db.execute(select(BankAccount).where(
                BankAccount.account_id == hsbc_account.get('AccountId'),
                BankAccount.user_id == user_id
            ))
            existing_account = result.scalar_one_or_none()
            
            if existing_account:
                # Update existing account
                existing_account.account_number = hsbc_account.get('Account', [{}])[0].get('Identification')
                existing_account.account_type = hsbc_account.get('AccountType')
                existing_account.account_subtype = hsbc_account.get('AccountSubType')
                existing_account.currency = hsbc_account.get('Currency', 'SGD')
                existing_account.nickname = hsbc_account.get('Nickname')
                existing_account.status = hsbc_account.get('Status', 'Active')
                existing_account.hsbc_metadata = hsbc_account
                existing_account.last_synced_at = datetime.now()
                db_account = existing_account
            else:
                # Create new account
                db_account = BankAccount(
                    account_id=hsbc_account.get('AccountId'),
                    account_number=hsbc_account.get('Account', [{}])[0].get('Identification'),
                    account_type=hsbc_account.get('AccountType'),
                    account_subtype=hsbc_account.get('AccountSubType'),
                    currency=hsbc_account.get('Currency', 'SGD'),
                    nickname=hsbc_account.get('Nickname'),
                    status=hsbc_account.get('Status', 'Active'),
                    user_id=user_id,
                    hsbc_metadata=hsbc_account,
                    last_synced_at=datetime.now()
                )
                db.add(db_account)
            
            db_accounts.append(db_account)
        
        await db.commit()
        
        # Refresh objects to get updated data
        for account in db_accounts:
            await db.refresh(account)
        
        return BankAccountListResponse(
            accounts=[BankAccountResponse.model_validate(acc) for acc in db_accounts],
            total_count=len(db_accounts),
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error fetching accounts: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/banking/accounts/{account_id}/balances", response_model=List[AccountBalanceResponse], tags=["banking"])
async def get_account_balances(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    force_refresh: bool = Query(False, description="Force refresh from HSBC API")
):
    """Get balances for a specific account"""
    try:
        # Verify account ownership
        result = await db.execute(select(BankAccount).where(
            BankAccount.account_id == account_id,
            BankAccount.user_id == user_id
        ))
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Check cached balances (unless force refresh)
        if not force_refresh:
            result = await db.execute(select(AccountBalance).where(
                AccountBalance.account_id == account.id,
                AccountBalance.created_at > datetime.now() - timedelta(minutes=15)  # 15-minute cache
            ))
            recent_balances = result.scalars().all()
            
            if recent_balances:
                logger.info(f"Returning {len(recent_balances)} cached balances for account {account_id}")
                return [AccountBalanceResponse.model_validate(balance) for balance in recent_balances]
        
        # Fetch fresh data from HSBC
        try:
            hsbc_balances = await hsbc_client.get_account_balances(account_id)
            balance_data = hsbc_balances.get('Balance', [])
            logger.info(f"Fetched {len(balance_data)} balances from HSBC API")
        except HSBCAPIError as e:
            logger.warning(f"HSBC API error for balances: {e.message}")
            # Return cached data if available
            result = await db.execute(select(AccountBalance)
                                    .where(AccountBalance.account_id == account.id)
                                    .order_by(AccountBalance.created_at.desc())
                                    .limit(10))
            cached_balances = result.scalars().all()
            
            if cached_balances:
                return [AccountBalanceResponse.model_validate(balance) for balance in cached_balances]
            else:
                raise HTTPException(
                    status_code=503, 
                    detail=f"HSBC API unavailable and no cached balance data: {e.message}"
                )
        
        # Save fresh balances to database
        db_balances = []
        for balance_item in balance_data:
            db_balance = AccountBalance(
                account_id=account.id,
                balance_type=balance_item.get('Type'),
                amount=float(balance_item.get('Amount', {}).get('Amount', 0)),
                currency=balance_item.get('Amount', {}).get('Currency', 'SGD'),
                datetime=datetime.fromisoformat(
                    balance_item.get('DateTime', datetime.now().isoformat()).replace('Z', '+00:00')
                ),
                credit_debit_indicator=balance_item.get('CreditDebitIndicator'),
                hsbc_metadata=balance_item
            )
            db.add(db_balance)
            db_balances.append(db_balance)
        
        await db.commit()
        
        # Refresh objects
        for balance in db_balances:
            await db.refresh(balance)
        
        return [AccountBalanceResponse.model_validate(balance) for balance in db_balances]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching balances: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/banking/accounts/{account_id}/transactions", response_model=TransactionListResponse, tags=["banking"])
async def get_account_transactions(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    from_date: Optional[datetime] = Query(None, description="Start date for transactions"),
    to_date: Optional[datetime] = Query(None, description="End date for transactions"),
    limit: int = Query(50, description="Maximum number of transactions to return"),
    force_refresh: bool = Query(False, description="Force refresh from HSBC API")
):
    """Get transactions for a specific account"""
    try:
        # Verify account ownership
        result = await db.execute(select(BankAccount).where(
            BankAccount.account_id == account_id,
            BankAccount.user_id == user_id
        ))
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Set default date range if not provided
        if not from_date:
            from_date = datetime.now() - timedelta(days=30)  # Last 30 days
        if not to_date:
            to_date = datetime.now()
        
        # Check cached transactions (unless force refresh)
        if not force_refresh:
            result = await db.execute(
                select(Transaction)
                .where(
                    Transaction.account_id == account.id,
                    Transaction.booking_datetime >= from_date,
                    Transaction.booking_datetime <= to_date
                )
                .order_by(Transaction.booking_datetime.desc())
                .limit(limit)
            )
            cached_transactions = result.scalars().all()
            
            if cached_transactions:
                logger.info(f"Returning {len(cached_transactions)} cached transactions for account {account_id}")
                return TransactionListResponse(
                    transactions=[TransactionResponse.model_validate(txn) for txn in cached_transactions],
                    total_count=len(cached_transactions),
                    from_date=from_date,
                    to_date=to_date
                )
        
        # Fetch fresh data from HSBC
        try:
            hsbc_transactions = await hsbc_client.get_transactions(account_id, from_date, to_date)
            logger.info(f"Fetched {len(hsbc_transactions)} transactions from HSBC API")
        except HSBCAPIError as e:
            logger.warning(f"HSBC API error for transactions: {e.message}")
            # Return cached data if available
            result = await db.execute(
                select(Transaction)
                .where(
                    Transaction.account_id == account.id,
                    Transaction.booking_datetime >= from_date,
                    Transaction.booking_datetime <= to_date
                )
                .order_by(Transaction.booking_datetime.desc())
                .limit(limit)
            )
            cached_transactions = result.scalars().all()
            
            if cached_transactions:
                return TransactionListResponse(
                    transactions=[TransactionResponse.model_validate(txn) for txn in cached_transactions],
                    total_count=len(cached_transactions),
                    from_date=from_date,
                    to_date=to_date,
                    warning="Using cached data due to API error"
                )
            else:
                raise HTTPException(
                    status_code=503, 
                    detail=f"HSBC API unavailable and no cached transaction data: {e.message}"
                )
        
        # Save fresh transactions to database
        db_transactions = []
        for txn_data in hsbc_transactions[:limit]:  # Respect limit
            # Check if transaction already exists
            result = await db.execute(select(Transaction).where(
                Transaction.transaction_id == txn_data.get('TransactionId'),
                Transaction.account_id == account.id
            ))
            existing_txn = result.scalar_one_or_none()
            
            if not existing_txn:
                db_transaction = Transaction(
                    account_id=account.id,
                    transaction_id=txn_data.get('TransactionId'),
                    transaction_reference=txn_data.get('TransactionReference'),
                    amount=float(txn_data.get('Amount', {}).get('Amount', 0)),
                    currency=txn_data.get('Amount', {}).get('Currency', 'SGD'),
                    credit_debit_indicator=txn_data.get('CreditDebitIndicator'),
                    status=txn_data.get('Status', 'Booked'),
                    booking_datetime=datetime.fromisoformat(
                        txn_data.get('BookingDateTime', datetime.now().isoformat()).replace('Z', '+00:00')
                    ),
                    value_datetime=datetime.fromisoformat(
                        txn_data.get('ValueDateTime', datetime.now().isoformat()).replace('Z', '+00:00')
                    ) if txn_data.get('ValueDateTime') else None,
                    description=txn_data.get('TransactionInformation'),
                    merchant_name=txn_data.get('MerchantDetails', {}).get('MerchantName'),
                    hsbc_metadata=txn_data
                )
                db.add(db_transaction)
                db_transactions.append(db_transaction)
        
        await db.commit()
        
        # Refresh objects and get all transactions for response
        for txn in db_transactions:
            await db.refresh(txn)
        
        # Get all transactions in date range for response
        result = await db.execute(
            select(Transaction)
            .where(
                Transaction.account_id == account.id,
                Transaction.booking_datetime >= from_date,
                Transaction.booking_datetime <= to_date
            )
            .order_by(Transaction.booking_datetime.desc())
            .limit(limit)
        )
        all_transactions = result.scalars().all()
        
        return TransactionListResponse(
            transactions=[TransactionResponse.model_validate(txn) for txn in all_transactions],
            total_count=len(all_transactions),
            from_date=from_date,
            to_date=to_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/banking/sync", tags=["banking"])
async def sync_all_banking_data(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Sync all banking data from HSBC API"""
    try:
        # Get accounts first
        accounts_response = await get_accounts(user_id=user_id, db=db, force_refresh=True)
        
        sync_results = {
            "accounts_synced": len(accounts_response.accounts),
            "balances_synced": 0,
            "transactions_synced": 0,
            "errors": []
        }
        
        # Sync balances and recent transactions for each account
        for account in accounts_response.accounts:
            try:
                # Sync balances
                balances = await get_account_balances(
                    account_id=account.account_id,
                    user_id=user_id,
                    db=db,
                    force_refresh=True
                )
                sync_results["balances_synced"] += len(balances)
                
                # Sync recent transactions (last 7 days)
                from_date = datetime.now() - timedelta(days=7)
                transactions_response = await get_account_transactions(
                    account_id=account.account_id,
                    user_id=user_id,
                    db=db,
                    from_date=from_date,
                    force_refresh=True
                )
                sync_results["transactions_synced"] += len(transactions_response.transactions)
                
            except Exception as e:
                error_msg = f"Failed to sync data for account {account.account_id}: {str(e)}"
                sync_results["errors"].append(error_msg)
                logger.error(error_msg)
        
        return {
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "results": sync_results
        }
        
    except Exception as e:
        logger.error(f"Error during full sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}") 