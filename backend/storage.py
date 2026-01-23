from models import db, User, UserProfile, Document, Event, LeaseScan, LoanCalculation, EmailVerification, ChatConversation, ChatMessage
import uuid
from datetime import datetime, timedelta

class DBStorage:
    def __init__(self):
        pass

    # User methods
    def get_user_by_id(self, user_id):
        return User.query.get(user_id)

    def get_user_by_username(self, username):
        return User.query.filter_by(username=username).first()

    def create_user(self, username, password_hash):
        user = User(username=username, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()
        return user

    # Document methods
    def get_documents(self, user_id):
        docs = Document.query.filter_by(user_id=user_id).all()
        return [self._doc_to_dict(d) for d in docs]

    def create_document(self, user_id, doc_data):
        doc = Document(
            user_id=user_id,
            name=doc_data.get('name'),
            type=doc_data.get('type'),
            date=doc_data.get('date', datetime.now().strftime("%d %b %Y")),
            size=doc_data.get('size', '0 KB'),
            url=doc_data.get('url', '#'),
            file_path=doc_data.get('file_path')
        )
        db.session.add(doc)
        db.session.commit()
        return self._doc_to_dict(doc)
    
    def delete_document(self, user_id, doc_id):
        doc = Document.query.filter_by(id=doc_id, user_id=user_id).first()
        if doc:
            db.session.delete(doc)
            db.session.commit()
            return True
        return False

    # Event methods
    def get_events(self, user_id):
        events = Event.query.filter_by(user_id=user_id).all()
        return [self._event_to_dict(e) for e in events]

    def create_event(self, user_id, event_data):
        event = Event(
            user_id=user_id,
            title=event_data.get('title'),
            date=event_data.get('date'),
            type=event_data.get('type'),
            status=event_data.get('status'),
            isoDate=event_data.get('isoDate'),
            description=event_data.get('description'),
            reminder=event_data.get('reminder')
        )
        db.session.add(event)
        db.session.commit()
        return self._event_to_dict(event)
    
    def update_event(self, user_id, event_id, event_data):
        event = Event.query.filter_by(id=event_id, user_id=user_id).first()
        if event:
            if 'status' in event_data: event.status = event_data['status']
            if 'title' in event_data: event.title = event_data['title']
            if 'date' in event_data: event.date = event_data['date']
            if 'isoDate' in event_data: event.isoDate = event_data['isoDate']
            if 'description' in event_data: event.description = event_data['description']
            if 'reminder' in event_data: event.reminder = event_data['reminder']
            db.session.commit()
            return self._event_to_dict(event)
        return None

    def delete_event(self, user_id, event_id):
        event = Event.query.filter_by(id=event_id, user_id=user_id).first()
        if event:
            db.session.delete(event)
            db.session.commit()
            return True
        return False

    # Lease Scan methods
    def create_lease_scan(self, user_id, scan_data):
        scan = LeaseScan(
            user_id=user_id,
            filename=scan_data.get('filename'),
            state=scan_data.get('state', 'Maharashtra'),
            red_flags=scan_data.get('red_flags', "Excessive security deposit, Lack of maintenance clauses, Vague notice period"),
            law_name=scan_data.get('law_name', "Rent Control Act 1999"),
            key_protection=scan_data.get('key_protection', "Standard rent fixation")
        )
        db.session.add(scan)
        db.session.commit()
        return self._scan_to_dict(scan)

    # Loan calculation methods
    def create_loan_calculation(self, user_id, calc_data):
        amount = calc_data.get("amount", 500000)
        rate = calc_data.get("rate", 10)
        tenure = calc_data.get("tenure", 24)
        
        monthly_rate = rate / (12 * 100)
        emi = round(
            (amount * monthly_rate * pow(1 + monthly_rate, tenure)) /
            (pow(1 + monthly_rate, tenure) - 1)
        )
        total_payable = emi * tenure
        total_interest = total_payable - amount
        
        calc = LoanCalculation(
            user_id=user_id,
            amount=amount,
            rate=rate,
            tenure=tenure,
            emi=emi,
            total_payable=total_payable,
            total_interest=total_interest
        )
        db.session.add(calc)
        db.session.commit()
        return self._loan_to_dict(calc)

    def get_loan_calculations(self, user_id):
        calcs = LoanCalculation.query.filter_by(user_id=user_id).all()
        return [self._loan_to_dict(c) for c in calcs]

    # Profile methods
    def get_user_profile(self, user_id):
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if profile:
            return self._profile_to_dict(profile)
        return None
    
    def get_profile_by_email(self, email):
        profile = UserProfile.query.filter_by(email=email).first()
        return self._profile_to_dict(profile) if profile else None

    def delete_user_account(self, user_id):
        # 1. Get User
        user = User.query.get(user_id)
        if not user:
            return False

        profile = UserProfile.query.filter_by(user_id=user_id).first()
        email = profile.email if profile else None

        # 2. Delete related records
        Document.query.filter_by(user_id=user_id).delete()
        Event.query.filter_by(user_id=user_id).delete()
        LeaseScan.query.filter_by(user_id=user_id).delete()
        LoanCalculation.query.filter_by(user_id=user_id).delete()
        
        if profile:
            db.session.delete(profile)
            
        if email:
            EmailVerification.query.filter_by(email=email).delete()

        # 3. Delete User
        db.session.delete(user)
        db.session.commit()
        return True

    # OTP methods
    def save_otp(self, email, otp, expiry_minutes=10):
        # Remove existing OTP for this email
        existing = EmailVerification.query.filter_by(email=email).first()
        if existing:
            db.session.delete(existing)
        
        expires = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        ver = EmailVerification(email=email, otp=otp, expires_at=expires)
        db.session.add(ver)
        db.session.commit()
        return ver

    def get_otp(self, email):
        return EmailVerification.query.filter_by(email=email).first()

    def delete_otp(self, email):
        otp_rec = EmailVerification.query.filter_by(email=email).first()
        if otp_rec:
            db.session.delete(otp_rec)
            db.session.commit()

    def create_user_profile(self, user_id, profile_data):
        profile = UserProfile(
            user_id=user_id,
            name=profile_data.get('name'),
            email=profile_data.get('email'),
            language=profile_data.get('language', 'English'),
            notifications=profile_data.get('notifications', 'On'),
            privacy=profile_data.get('privacy', 'High'),
            subscription=profile_data.get('subscription', 'Free'),
            account_id=f"TC-{user_id[:4].upper()}"
        )
        db.session.add(profile)
        db.session.commit()
        return self._profile_to_dict(profile)

    def update_user_profile(self, user_id, profile_data):
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if profile:
            for key, value in profile_data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            db.session.commit()
            return self._profile_to_dict(profile)
        return None

    # Helper methods to convert models to dicts
    def _doc_to_dict(self, doc):
        return {
            "id": doc.id,
            "name": doc.name,
            "type": doc.type,
            "date": doc.date,
            "size": doc.size,
            "url": doc.url,
            "file_path": doc.file_path
        }

    def _event_to_dict(self, e):
        return {
            "id": e.id,
            "title": e.title,
            "date": e.date,
            "isoDate": e.isoDate,
            "type": e.type,
            "status": e.status,
            "description": e.description,
            "reminder": e.reminder
        }

    def _loan_to_dict(self, c):
        return {
            "id": c.id,
            "amount": c.amount,
            "rate": c.rate,
            "tenure": c.tenure,
            "emi": c.emi,
            "total_payable": c.total_payable,
            "total_interest": c.total_interest,
            "calculated_at": c.calculated_at.isoformat()
        }

    def _scan_to_dict(self, s):
        return {
            "id": s.id,
            "filename": s.filename,
            "state": s.state,
            "scanned_at": s.scanned_at.isoformat(),
            "red_flags": s.red_flags.split(", "),
            "state_rights": {
                "state": s.state,
                "law": s.law_name,
                "key_protection": s.key_protection
            }
        }

    def _profile_to_dict(self, p):
        # Auto-populate account_id for legacy users if missing
        if not p.account_id and p.user_id:
            p.account_id = f"TC-{p.user_id[:4].upper()}"
            db.session.commit()

        return {
            "id": p.id,
            "account_id": p.account_id,
            "name": p.name,
            "email": p.email,
            "language": p.language,
            "notifications": p.notifications,
            "privacy": p.privacy,
            "subscription": p.subscription
        }

    # Chat methods
    def create_conversation(self, user_id, title="New Chat"):
        """Create a new chat conversation"""
        conversation = ChatConversation(
            user_id=user_id,
            title=title
        )
        db.session.add(conversation)
        db.session.commit()
        return self._conversation_to_dict(conversation)

    def get_user_conversations(self, user_id):
        """Get all conversations for a user, ordered by most recent"""
        conversations = ChatConversation.query.filter_by(user_id=user_id).order_by(
            ChatConversation.updated_at.desc()
        ).all()
        return [self._conversation_to_dict(c) for c in conversations]

    def get_conversation(self, conversation_id, user_id):
        """Get a specific conversation with messages"""
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).first()
        if not conversation:
            return None
        
        conv_dict = self._conversation_to_dict(conversation)
        messages = ChatMessage.query.filter_by(
            conversation_id=conversation_id
        ).order_by(ChatMessage.created_at.asc()).all()
        conv_dict['messages'] = [self._message_to_dict(m) for m in messages]
        return conv_dict

    def add_chat_message(self, conversation_id, role, content):
        """Add a message to a conversation"""
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.session.add(message)
        
        # Update conversation timestamp
        conversation = ChatConversation.query.get(conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        db.session.commit()
        return self._message_to_dict(message)

    def update_conversation_title(self, conversation_id, user_id, title):
        """Update conversation title"""
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).first()
        if conversation:
            conversation.title = title
            db.session.commit()
            return self._conversation_to_dict(conversation)
        return None

    def delete_conversation(self, conversation_id, user_id):
        """Delete a conversation and all its messages"""
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).first()
        if conversation:
            ChatMessage.query.filter_by(conversation_id=conversation_id).delete()
            db.session.delete(conversation)
            db.session.commit()
            return True
        return False

    def get_conversation_messages(self, conversation_id):
        """Get all messages in a conversation"""
        messages = ChatMessage.query.filter_by(
            conversation_id=conversation_id
        ).order_by(ChatMessage.created_at.asc()).all()
        return [self._message_to_dict(m) for m in messages]

    def get_daily_message_count(self, user_id):
        """Count user messages sent in the last 24 hours"""
        cutoff = datetime.utcnow() - timedelta(days=1)
        # Join Conversation to filter by user_id
        count = ChatMessage.query.join(ChatConversation).filter(
            ChatConversation.user_id == user_id,
            ChatMessage.role == 'user',
            ChatMessage.created_at >= cutoff
        ).count()
        return count

    def _conversation_to_dict(self, c):
        """Convert conversation to dict"""
        return {
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else datetime.utcnow().isoformat(),
            "updated_at": c.updated_at.isoformat() if c.updated_at else datetime.utcnow().isoformat()
        }

    def _message_to_dict(self, m):
        """Convert message to dict"""
        return {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else datetime.utcnow().isoformat()
        }

storage = DBStorage()
