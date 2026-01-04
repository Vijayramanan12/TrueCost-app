from models import db, User, UserProfile, Document, Event, LeaseScan, LoanCalculation
import uuid
from datetime import datetime

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
            status=event_data.get('status')
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
    
    def create_user_profile(self, user_id, profile_data):
        profile = UserProfile(
            user_id=user_id,
            name=profile_data.get('name'),
            email=profile_data.get('email'),
            language=profile_data.get('language', 'English'),
            notifications=profile_data.get('notifications', 'On'),
            privacy=profile_data.get('privacy', 'High'),
            subscription=profile_data.get('subscription', 'Free')
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
            "type": e.type,
            "status": e.status
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
        return {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "language": p.language,
            "notifications": p.notifications,
            "privacy": p.privacy,
            "subscription": p.subscription
        }

storage = DBStorage()
