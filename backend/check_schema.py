import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('DATABASE_URL')
if url and url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url)
with engine.connect() as conn:
    print(f"Checking columns for table 'user_profile' in database: {url.split('@')[-1]}")
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profile'"))
    cols = [r[0] for r in res]
    print(f"Columns: {cols}")
    
    if 'account_id' not in cols:
        print("❌ 'account_id' is missing! Attempting to add it...")
        try:
            conn.execute(text("ALTER TABLE user_profile ADD COLUMN account_id VARCHAR(20) UNIQUE"))
            conn.commit()
            print("✅ Column added successfully.")
        except Exception as e:
            print(f"❌ Failed to add column: {e}")
    else:
        print("✅ 'account_id' column exists.")
