import os
from flask import Flask
from models import db, UserProfile
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # 1. Add the column if it doesn't exist
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS account_id VARCHAR(20) UNIQUE"))
            conn.commit()
            print("Successfully added 'account_id' column (or it already existed).")
    except Exception as e:
        print(f"Error adding column: {e}")

    # 2. Populate missing account_ids
    profiles = UserProfile.query.filter(UserProfile.account_id == None).all()
    if profiles:
        print(f"Found {len(profiles)} profiles missing account_id. Populating...")
        for p in profiles:
            if p.user_id:
                p.account_id = f"TC-{p.user_id[:4].upper()}"
        db.session.commit()
        print("Successfully populated account_ids.")
    else:
        print("No profiles missing account_id.")

    # 3. Final Check
    profiles = UserProfile.query.all()
    print("\nCurrent User IDs and Account IDs:")
    for p in profiles:
        print(f"User: {p.name} | ID: {p.user_id} | Account ID: {p.account_id}")
