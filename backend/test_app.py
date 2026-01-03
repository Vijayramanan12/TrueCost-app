import pytest
from app import app, db
from models import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_health_check(client):
    """Test the health check endpoint."""
    rv = client.get('/api/health')
    assert rv.status_code == 200
    assert b'healthy' in rv.data

def test_registration(client):
    """Test user registration."""
    rv = client.post('/api/auth/register', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    assert rv.status_code == 201
    assert b'User registered successfully' in rv.data

def test_login(client):
    """Test user login."""
    # First register
    client.post('/api/auth/register', json={
        'username': 'loginuser',
        'password': 'password123'
    })
    
    # Then login
    rv = client.post('/api/auth/login', json={
        'username': 'loginuser',
        'password': 'password123'
    })
    assert rv.status_code == 200
    assert 'access_token' in rv.get_json()
