from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_executor import Executor
from werkzeug.utils import secure_filename
import time
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re
from pypdf import PdfReader
from email_validator import validate_email, EmailNotValidError

import random
import smtplib
import dns.resolver
from models import db, User, UserProfile, Document, Event, EmailVerification
from storage import storage
from ai_util import analyze_rental_listing, scan_lease_agreement, analyze_bank_loan_terms, generate_loan_recommendations
from loan_calculator import calculate_loan

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Basic CORS configuration
CORS(app, supports_credentials=True)

bcrypt = Bcrypt(app)
executor = Executor(app)

# Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
db_url = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'truecost.db'))
# SQLAlchemy 1.4+ requires 'postgresql://' prefix instead of 'postgres://'
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
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

@app.before_request
def log_request():
    print(f"🔍 Incoming: {request.method} {request.path}")

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

def send_real_email(to_email, otp):
    smtp_email = os.getenv('SMTP_EMAIL')
    smtp_password = os.getenv('SMTP_PASSWORD')
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    
    if not smtp_email or not smtp_password:
        print(f"📧 [SMTP MOCK] To: {to_email} | OTP: {otp}")
        return False
        
    try:
        msg = f"Subject: TrueCost Verification Code\n\nYour verification code is: {otp}\n\nThis code expires in 10 minutes."
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(smtp_email, to_email, msg)
        server.quit()
        print(f"✅ email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required"}), 400
        
    # 1. DNS Check
    try:
        validate_email(email, check_deliverability=True)
    except EmailNotValidError as e:
        return jsonify({"message": f"Invalid email: {str(e)}"}), 400
        
    # 2. SMTP Ping (Mailbox Check)
    if not verify_mailbox_smtp(email):
        return jsonify({"message": "Email address does not exist"}), 400
        
    # 3. Generate OTP
    otp = str(random.randint(100000, 999999))
    
    # 4. Save to DB
    storage.save_otp(email, otp)
    
    # 5. Send Email (Real or Mock)
    sent = send_real_email(email, otp)
    
    if sent:
        return jsonify({"message": f"Verification code sent to {email}"})
    else:
        # If mock, tell user to check console (usually dev mode)
        # Or just say sent if we want to simulate success
        return jsonify({"message": f"Code generated (Check Server Logs)"})

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    user_otp = data.get('otp')
    
    record = storage.get_otp(email)
    if not record:
        return jsonify({"message": "No valid code found. Please request a new one."}), 400
        
    if datetime.utcnow() > record.expires_at:
        storage.delete_otp(email)
        return jsonify({"message": "Code expired."}), 400
        
    if record.otp != user_otp:
        return jsonify({"message": "Invalid code."}), 400
        
    # Success
    storage.delete_otp(email)
    return jsonify({"message": "Email verified successfully."})

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        name = data.get('name', username)
        email = data.get('email')

        if not username or not password:
            return jsonify({"message": "Username and password required"}), 400

        if email:
            # 1. DNS Check (Syntax + Domain)
            try:
                emailinfo = validate_email(email, check_deliverability=True)
                email = emailinfo.normalized
            except EmailNotValidError as e:
                return jsonify({"message": f"Invalid email format: {str(e)}"}), 400

            # 2. SMTP Ping (Mailbox Existence)
            # Verify if mailbox actually exists on server
            if not verify_mailbox_smtp(email):
                 return jsonify({"message": "Email address does not exist (SMTP Check failed)"}), 400

            if storage.get_profile_by_email(email):
                return jsonify({"message": "Email already registered"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = storage.create_user(username, hashed_password)
        
        # Create default profile
        storage.create_user_profile(user.id, {
            "name": name,
            "email": email
        })

        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify(error=str(e)), 500

def verify_mailbox_smtp(email):
    # Extract domain
    domain = email.split('@')[1]
    try:
        # Get MX record
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(records[0].exchange)
        
        # Connect
        server = smtplib.SMTP(timeout=5)
        server.set_debuglevel(0)
        
        # Identify
        server.connect(mx_record)
        server.helo(server.local_hostname)
        server.mail('verify@truecost.ai')
        code, message = server.rcpt(email)
        server.quit()
        
        # 250 = OK
        if code == 250:
            return True
        return False
    except Exception as e:
        print(f"SMTP Check Failed for {email}: {e}")
        # Default to True if we cannot check (avoid blocking valid emails due to network/spam filter issues)
        # BUT user wanted Strict. So maybe False? 
        # Risky. I'll return False if user insists on Blocking "Unregistered".
        # But this might block everyone if my IP is blocked.
        # I'll log warning and return False to satisfy user constraint.
        return False

@app.route('/api/auth/delete-account', methods=['POST'])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    success = storage.delete_user_account(user_id)
    if success:
        return jsonify({"message": "Account and all associated data deleted successfully."}), 200
    return jsonify({"message": "User not found."}), 404

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
            "message": "AI Analysis failed. Please ensure the GROQ_API_KEY is configured in the backend environment.",
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
    text_content = ""
    filename = "agreement.pdf"
    state_law = "Maharashtra"

    # Handle File Upload (Multipart)
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(user_id))
            os.makedirs(user_upload_dir, exist_ok=True)
            
            file_path = os.path.join(user_upload_dir, filename)
            file.save(file_path)
            
            # Extract Text from PDF
            try:
                reader = PdfReader(file_path)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text_content += extracted + "\n"
            except Exception as e:
                print(f"Error extracting PDF text: {e}")
                return jsonify({"message": "Failed to extract text from PDF. Ensure it is a valid text-based PDF."}), 400
        
        state_law = request.form.get("state", "Maharashtra")
        
    # Handle JSON Payload (Copy-Paste Text)
    elif request.is_json:
        data = request.json or {}
        text_content = data.get("leaseText", "")
        filename = data.get("filename", "pasted_agreement.txt")
        state_law = data.get("state", "Maharashtra")

    if not text_content or len(text_content.strip()) < 50:
        return jsonify({
            "message": "Insufficient text content. Please upload a text-based PDF or paste the lease text."
        }), 400

    # Truncate if too long to avoid token limits (approx 15k chars)
    if len(text_content) > 30000:
        text_content = text_content[:30000] + "...(truncated)"

    ai_result = scan_lease_agreement(text_content)
    if not ai_result:
        return jsonify({
            "message": "AI Lease Scanning failed. Please ensure the GROQ_API_KEY is configured in the backend environment.",
            "error": "API_KEY_MISSING"
        }), 503
    
    # Handle non-lease documents rejected by AI
    if ai_result.get("is_valid_lease") is False:
        return jsonify({
            "message": ai_result.get("message", "The uploaded document does not appear to be a valid lease agreement.")
        }), 400
    
    scan = storage.create_lease_scan(user_id, {
        "filename": filename,
        "state": state_law,
        "red_flags": ", ".join(ai_result.get("red_flags", [])),
        "law_name": ai_result.get("law_name", "Unknown Law"),
        "key_protection": ai_result.get("key_protection", "No specific protection identified")
    })
    
    return jsonify(scan)

# ============= LOAN CALCULATOR API =============

@app.route('/api/loan/calculate', methods=['POST'])
def calculate_loan_api():
    """
    Calculate comprehensive loan details with amortization schedule
    Supports multiple payment frequencies, extra payments, and payment holidays
    """
    try:
        data = request.json or {}
        
        # Validate required fields
        required_fields = ['principal', 'annual_rate', 'tenure_months']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Calculate loan details
        result = calculate_loan(data)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/loan/analyze-bank', methods=['POST'])
def analyze_bank():
    """
    Analyze bank-specific loan terms and conditions using Groq AI
    """
    try:
        data = request.json or {}
        bank_name = data.get('bank_name')
        loan_type = data.get('loan_type', 'home loan')
        
        if not bank_name:
            return jsonify({"error": "bank_name is required"}), 400
        
        # Analyze bank terms using Groq AI
        analysis = analyze_bank_loan_terms(bank_name, loan_type)
        
        if not analysis:
            return jsonify({
                "error": "Bank analysis failed. Please ensure GROQ_API_KEY is configured.",
                "code": "API_KEY_MISSING"
            }), 503
        
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/loan/recommendations', methods=['POST'])
def get_loan_recommendations():
    """
    Generate personalized loan recommendations using Groq AI
    Combines loan calculation results with bank analysis for tailored advice
    """
    try:
        data = request.json or {}
        
        loan_params = data.get('loan_params', {})
        bank_analysis = data.get('bank_analysis')
        user_profile = data.get('user_profile')
        
        if not loan_params:
            return jsonify({"error": "loan_params is required"}), 400
        
        # Generate recommendations using Groq AI
        recommendations = generate_loan_recommendations(
            loan_params,
            bank_analysis,
            user_profile
        )
        
        if not recommendations:
            return jsonify({
                "error": "Recommendation generation failed. Please ensure GROQ_API_KEY is configured.",
                "code": "API_KEY_MISSING"
            }), 503
        
        return jsonify(recommendations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/loan/history', methods=['GET'])
@jwt_required()
def get_loan_history():
    """Get user's loan calculation history"""
    user_id = get_jwt_identity()
    return jsonify(storage.get_loan_calculations(user_id))

@app.route('/api/loan/save', methods=['POST'])
@jwt_required()
def save_loan_calculation():
    """Save a loan calculation to user's history"""
    user_id = get_jwt_identity()
    data = request.json or {}
    calculation = storage.create_loan_calculation(user_id, data)
    return jsonify(calculation)

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

# ============= PROFILE API =============
@app.route('/api/profile/verify-email', methods=['POST'])
@jwt_required()
def verify_email_real():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required"}), 400
        
    try:
        # Check syntax and DNS deliverability (MX records)
        emailinfo = validate_email(email, check_deliverability=True)
        normalized_email = emailinfo.normalized
        
        # Log to console
        print(f"✅ Real Email Verification Passed for: {normalized_email}")
        print(f"📧 Sending verification email to {normalized_email} (Stubbed)")
        
        return jsonify({
            "valid": True, 
            "message": f"Verified! Application domain for {normalized_email} accepts email."
        })
        
    except EmailNotValidError as e:
        return jsonify({"valid": False, "message": str(e)}), 400

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
