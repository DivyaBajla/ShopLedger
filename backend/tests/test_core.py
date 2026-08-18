import os
os.environ['DATABASE_URL']='sqlite:///./test_shopledger.db'
from fastapi.testclient import TestClient
from app.main import app

def test_health():
    with TestClient(app) as c: assert c.get('/api/health').json()['status']=='ok'

def test_login():
    with TestClient(app) as c:
        r=c.post('/api/auth/login',json={'email':'admin@shopledger.local','password':'Admin@123'})
        assert r.status_code==200
