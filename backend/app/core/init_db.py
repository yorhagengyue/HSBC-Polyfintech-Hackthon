import asyncio
from sqlalchemy import text
from .database import engine, create_tables
from ..models import User, Watchlist, Alert, UserPreferences

async def create_default_user():
    """Create a default user for development"""
    async with engine.begin() as conn:
        # Check if default user exists
        result = await conn.execute(
            text("SELECT id FROM users WHERE username = :username"),
            {"username": "demo_user"}
        )
        user_exists = result.fetchone()
        
        if not user_exists:
            # Create default user
            await conn.execute(
                text("""
                    INSERT INTO users (username, email, is_active) 
                    VALUES (:username, :email, :is_active)
                """),
                {
                    "username": "demo_user",
                    "email": "demo@financialalarmclock.com",
                    "is_active": True
                }
            )
            
            # Get the user ID using LAST_INSERT_ID() for MySQL
            result = await conn.execute(text("SELECT LAST_INSERT_ID()"))
            user_id = result.fetchone()[0]
            
            # Create default preferences
            await conn.execute(
                text("""
                    INSERT INTO user_preferences (
                        user_id, alert_threshold, information_density, 
                        theme, low_risk_mode, email_notifications, push_notifications
                    ) VALUES (
                        :user_id, :threshold, :density, 
                        :theme, :low_risk, :email, :push
                    )
                """),
                {
                    "user_id": user_id,
                    "threshold": 3.0,
                    "density": "detailed",
                    "theme": "dark",
                    "low_risk": False,
                    "email": True,
                    "push": True
                }
            )
            
            # Create sample watchlist items
            sample_stocks = [
                {"symbol": "AAPL", "name": "Apple Inc."},
                {"symbol": "GOOGL", "name": "Alphabet Inc."},
                {"symbol": "MSFT", "name": "Microsoft Corporation"},
                {"symbol": "TSLA", "name": "Tesla, Inc."},
                {"symbol": "AMZN", "name": "Amazon.com, Inc."}
            ]
            
            for stock in sample_stocks:
                await conn.execute(
                    text("""
                        INSERT INTO watchlists (user_id, symbol, name, is_active)
                        VALUES (:user_id, :symbol, :name, :is_active)
                    """),
                    {
                        "user_id": user_id,
                        "symbol": stock["symbol"],
                        "name": stock["name"],
                        "is_active": True
                    }
                )
            
            print("✅ Default user and sample data created successfully")
        else:
            print("✅ Default user already exists")

async def init_database():
    """Initialize database with tables and sample data"""
    try:
        print("🔄 Creating database tables...")
        await create_tables()
        print("✅ Database tables created successfully")
        
        print("🔄 Creating default user...")
        await create_default_user()
        
        print("🎉 Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_database()) 