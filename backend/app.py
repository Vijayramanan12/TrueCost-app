from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_executor import Executor
from werkzeug.utils import secure_filename
import time
import os
from datetime import timedelta
from dotenv import load_dotenv

from models import db, User, UserProfile, Document, Event
from storage import storage
from gemini_util import analyze_rental_listing, scan_lease_agreement

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Basic CORS configuration
CORS(app)

bcrypt = Bcrypt(app)
executor = Executor(app)

# Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'truecost.db'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)
jwt = JWTManager(app)

# ============= ERROR HANDLING =============

@app.errorhandler(400)
def bad_request(e):
    return jsonify(error=str(e), message="Bad Request"), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify(error=str(e), message="Resource Not Found"), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal Server Error", message="Something went wrong on our end"), 500

# ============= AUTH API =============

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        name = data.get('name', username)
        email = data.get('email', f"{username}@example.com")

        if not username or not password:
            return jsonify({"message": "Username and password required"}), 400

        if storage.get_user_by_username(username):
            return jsonify({"message": "Username already exists"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = storage.create_user(username, hashed_password)
        
        # Create default profile
        storage.create_user_profile(user.id, {
            "name": name,
            "email": email
        })

        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = storage.get_user_by_username(username)
    if user and bcrypt.check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token, user={"id": user.id, "username": user.username}), 200

    return jsonify({"message": "Invalid credentials"}), 401

# ============= DOCUMENTS & UPLOADS API =============

@app.route('/api/documents', methods=['GET'])
@jwt_required()
def get_documents():
    user_id = get_jwt_identity()
    return jsonify(storage.get_documents(user_id))

@app.route('/api/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        # Create user-specific subfolder
        user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, filename)
        file.save(file_path)
        
        # Store metadata
        doc_data = {
            "name": filename,
            "type": request.form.get("type", "other"),
            "size": f"{os.path.getsize(file_path) // 1024} KB",
            "file_path": file_path,
            "url": f"/api/documents/view/{filename}"
        }
        doc = storage.create_document(user_id, doc_data)
        
        # Background task: analyze the file if it's a lease (demo of executor)
        if doc_data['type'] == 'legal':
            executor.submit(process_uploaded_lease, user_id, file_path)
            
        return jsonify(doc), 201

@app.route('/api/documents/view/<filename>', methods=['GET'])
@jwt_required()
def view_document(filename):
    user_id = get_jwt_identity()
    user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(user_id))
    return send_from_directory(user_upload_dir, filename)

@app.route('/api/documents/<doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    user_id = get_jwt_identity()
    success = storage.delete_document(user_id, doc_id)
    if success:
        return jsonify({"message": "Document deleted"}), 200
    return jsonify({"message": "Document not found or unauthorized"}), 404

def process_uploaded_lease(user_id, file_path):
    """Background task to process lease (stub for real OCR)"""
    print(f"📄 Background processing for user {user_id}: {file_path}")
    # In a real app, extract text from PDF/Image here
    pass

# ============= PROTECTED EVENTS/TIMELINE API =============

@app.route('/api/events', methods=['GET'])
@jwt_required()
def get_events():
    user_id = get_jwt_identity()
    return jsonify(storage.get_events(user_id))

@app.route('/api/events', methods=['POST'])
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
    data = request.json
    event = storage.create_event(user_id, data)
    return jsonify(event)

@app.route('/api/events/<event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    data = request.json
    event = storage.update_event(user_id, event_id, data)
    if event:
        return jsonify(event)
    return jsonify({"message": "Event not found or unauthorized"}), 404

@app.route('/api/events/<event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    success = storage.delete_event(user_id, event_id)
    if success:
        return jsonify({"message": "Event deleted"}), 200
    return jsonify({"message": "Event not found or unauthorized"}), 404

# ============= CALCULATOR API =============

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Analyze rental listing and calculate true cost"""
    input_data = request.json or {}
    text_content = input_data.get("listingText", "")
    
    # If text is provided, attempt AI analysis
    if text_content:
        result = analyze_rental_listing(text_content)
        if result:
            return jsonify(result)
        # If AI is attempted but fails (e.g. key missing), return error
        return jsonify({
            "message": "AI Analysis failed. Please ensure the GEMINI_API_KEY is configured in the backend environment.",
            "error": "API_KEY_MISSING"
        }), 503

    # Basic manual calculation fallback
    manual_rent = input_data.get("manualRent", 45000)
    one_time = input_data.get("oneTime", {})
    
    # Simple logic to return a structure the frontend expects
    return jsonify({
        "baseRent": manual_rent,
        "parking": 2000,
        "petFee": 500,
        "utilities": {"water": 400, "electricity": 3500, "internet": 800, "trash": 200},
        "oneTime": {
            "deposit": one_time.get("deposit", manual_rent * 2),
            "appFee": 0,
            "adminFee": one_time.get("adminFee", 2500),
            "moveIn": 0
        }
    })

# ============= LEASE SCANNER API =============

@app.route('/api/lease/scan', methods=['POST'])
@jwt_required()
def scan_lease():
    user_id = get_jwt_identity()
    data = request.json or {}
    text_content = data.get("leaseText", "")
    
    ai_result = scan_lease_agreement(text_content)
    if not ai_result:
        return jsonify({
            "message": "AI Lease Scanning failed. Please ensure the GEMINI_API_KEY is configured in the backend environment.",
            "error": "API_KEY_MISSING"
        }), 503
    
    scan = storage.create_lease_scan(user_id, {
        "filename": data.get("filename", "agreement.pdf"),
        "state": data.get("state", "Maharashtra"),
        "red_flags": ", ".join(ai_result["red_flags"]),
        "law_name": ai_result["law_name"],
        "key_protection": ai_result["key_protection"]
    })
    
    return jsonify(scan)

# ============= LOAN CALCULATOR API =============

@app.route('/api/loan/calculate', methods=['POST'])
@jwt_required()
def calculate_loan():
    """Calculate EMI for asset-backed loans and store for user"""
    user_id = get_jwt_identity()
    data = request.json or {}
    calculation = storage.create_loan_calculation(user_id, data)
    return jsonify(calculation)

@app.route('/api/loan/history', methods=['GET'])
@jwt_required()
def get_loan_history():
    """Get user's loan calculation history"""
    user_id = get_jwt_identity()
    return jsonify(storage.get_loan_calculations(user_id))

@app.route('/api/loan/eligibility', methods=['POST'])
def check_eligibility():
    """Check loan eligibility (public info)"""
    data = request.json or {}
    amount = data.get("amount", 500000)
    
    # Mock eligibility check logic
    eligible = amount <= 2000000
    max_amount = 2000000
    
    result = {
        "eligible": eligible,
        "max_amount": max_amount,
        "recommended_amount": min(amount, max_amount),
        "message": "Eligible for asset-backed loan" if eligible else "Amount exceeds maximum limit"
    }
    
    return jsonify(result)

# ============= PROFILE API =============

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    profile = storage.get_user_profile(user_id)
    if profile:
        return jsonify(profile)
    return jsonify({"message": "Profile not found"}), 404

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    profile = storage.update_user_profile(user_id, data)
    if profile:
        return jsonify(profile)
    return jsonify({"message": "Profile not found"}), 404

# ============= HEALTH CHECK =============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify(status="healthy", timestamp=time.time())

# ============= SEEDING =============

def seed_data():
    if User.query.first() is None:
        print("🌱 Seeding demo data...")
        hashed_password = bcrypt.generate_password_hash("password123").decode('utf-8')
        user = User(username="demo", password_hash=hashed_password)
        db.session.add(user)
        db.session.commit()
        
        storage.create_user_profile(user.id, {"name": "Arjun Kumar", "email": "arjun.k@example.com"})
        storage.create_document(user.id, {"name": "Lease Agreement 2024.pdf", "type": "legal", "date": "28 Jan 2024", "size": "2.4 MB"})
        storage.create_event(user.id, {"title": "Rent Due", "date": "2024-03-01", "type": "payment", "status": "upcoming"})
        print("✅ Seeding complete.")

with app.app_context():
    db.create_all()
    seed_data()

if __name__ == '__main__':
    port = int(os.getenv("PORT", 9002))
    app.run(host='0.0.0.0', port=port, debug=True)
