from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional

from ..core.database import get_db
from ..models.user import User
from ..models.preferences import UserPreferences
from ..schemas.preferences import (
    UserPreferencesCreate,
    UserPreferencesUpdate,
    UserPreferencesResponse
)

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.get("/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Get user preferences"""
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db.execute(stmt)
    preferences = result.scalar_one_or_none()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found"
        )
    
    return preferences

@router.post("/", response_model=UserPreferencesResponse)
async def create_user_preferences(
    preferences_data: UserPreferencesCreate,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Create new user preferences"""
    # Check if user exists
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if preferences already exist
    prefs_stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    prefs_result = await db.execute(prefs_stmt)
    existing_prefs = prefs_result.scalar_one_or_none()
    
    if existing_prefs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User preferences already exist"
        )
    
    # Create new preferences
    new_preferences = UserPreferences(
        user_id=user_id,
        **preferences_data.dict()
    )
    
    db.add(new_preferences)
    await db.commit()
    await db.refresh(new_preferences)
    
    return new_preferences

@router.put("/", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_data: UserPreferencesUpdate,
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Update user preferences"""
    # Check if preferences exist
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db.execute(stmt)
    preferences = result.scalar_one_or_none()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found"
        )
    
    # Update preferences
    update_data = preferences_data.dict(exclude_unset=True)
    if update_data:
        stmt = (
            update(UserPreferences)
            .where(UserPreferences.user_id == user_id)
            .values(**update_data)
        )
        await db.execute(stmt)
        await db.commit()
        await db.refresh(preferences)
    
    return preferences

@router.delete("/")
async def delete_user_preferences(
    user_id: int = 1,  # Default to demo user for now
    db: AsyncSession = Depends(get_db)
):
    """Delete user preferences"""
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db.execute(stmt)
    preferences = result.scalar_one_or_none()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found"
        )
    
    await db.delete(preferences)
    await db.commit()
    
    return {"message": "User preferences deleted successfully"} 