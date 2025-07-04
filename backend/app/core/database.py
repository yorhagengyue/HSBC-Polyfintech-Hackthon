from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from .config import settings

# Force MySQL database URL (override any cached settings)
MYSQL_DATABASE_URL = "mysql+aiomysql://root:526811@localhost:3306/hsbc"

# Database engine
engine = create_async_engine(
    MYSQL_DATABASE_URL,  # Use MySQL directly
    echo=True,  # Set to False in production
    future=True
)

# Session maker
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Create tables function
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Close database
async def close_db():
    await engine.dispose() 