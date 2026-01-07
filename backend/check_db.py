import os
from flask import Flask
from models import db, UserProfile
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
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    columns = inspector.get_columns('user_profile')
    print("Columns in 'user_profile':")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

    # Check for missing account_ids
    profiles = UserProfile.query.all()
    missing_count = sum(1 for p in profiles if not getattr(p, 'account_id', None))
    print(f"\nTotal profiles: {len(profiles)}")
    print(f"Profiles missing account_id: {missing_count}")
