from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List, Optional

from ..core.database import get_db
from ..models.user import User
from ..models.watchlist import Watchlist
from ..schemas.watchlist import (
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistResponse
)

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

@router.get("/", response_model=List[WatchlistResponse])
async def get_user_watchlist(
    user_id: int = 1,  # Default to demo user for now
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get user's watchlist"""
    query = select(Watchlist).where(Watchlist.user_id == user_id)
    
    if active_only:
        query = query.where(Watchlist.is_active == True)
    
    result = await db.execute(query.order_by(Watchlist.added_at.desc()))
    watchlist = result.scalars().all()
    
    return watchlist

@router.get("/{watchlist_id}", response_model=WatchlistResponse)
async def get_watchlist_item(
    watchlist_id: int,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Get specific watchlist item"""
    stmt = select(Watchlist).where(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == user_id
    )
    result = await db.execute(stmt)
    watchlist_item = result.scalar_one_or_none()
    
    if not watchlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found"
        )
    
    return watchlist_item

@router.post("/", response_model=WatchlistResponse)
async def add_to_watchlist(
    watchlist_data: WatchlistCreate,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Add stock to watchlist"""
    # Check if user exists
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if stock already in watchlist
    existing_stmt = select(Watchlist).where(
        Watchlist.user_id == user_id,
        Watchlist.symbol == watchlist_data.symbol
    )
    existing_result = await db.execute(existing_stmt)
    existing_item = existing_result.scalar_one_or_none()
    
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Stock {watchlist_data.symbol} already in watchlist"
        )
    
    # Create new watchlist item
    new_watchlist_item = Watchlist(
        user_id=user_id,
        **watchlist_data.dict()
    )
    
    db.add(new_watchlist_item)
    await db.commit()
    await db.refresh(new_watchlist_item)
    
    return new_watchlist_item

@router.put("/{watchlist_id}", response_model=WatchlistResponse)
async def update_watchlist_item(
    watchlist_id: int,
    watchlist_data: WatchlistUpdate,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Update watchlist item"""
    # Check if item exists
    stmt = select(Watchlist).where(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == user_id
    )
    result = await db.execute(stmt)
    watchlist_item = result.scalar_one_or_none()
    
    if not watchlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found"
        )
    
    # Update item
    update_data = watchlist_data.dict(exclude_unset=True)
    if update_data:
        stmt = (
            update(Watchlist)
            .where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id)
            .values(**update_data)
        )
        await db.execute(stmt)
        await db.commit()
        await db.refresh(watchlist_item)
    
    return watchlist_item

@router.delete("/{watchlist_id}")
async def remove_from_watchlist(
    watchlist_id: int,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Remove stock from watchlist"""
    stmt = select(Watchlist).where(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == user_id
    )
    result = await db.execute(stmt)
    watchlist_item = result.scalar_one_or_none()
    
    if not watchlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found"
        )
    
    await db.delete(watchlist_item)
    await db.commit()
    
    return {"message": f"Stock {watchlist_item.symbol} removed from watchlist"}

@router.get("/symbol/{symbol}", response_model=Optional[WatchlistResponse])
async def get_watchlist_by_symbol(
    symbol: str,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Get watchlist item by symbol"""
    stmt = select(Watchlist).where(
        Watchlist.symbol == symbol.upper(),
        Watchlist.user_id == user_id
    )
    result = await db.execute(stmt)
    watchlist_item = result.scalar_one_or_none()
    
    return watchlist_item 