from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .db import get_db
from .models import User
from .security import decode_token

oauth2=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
def current_user(token:str=Depends(oauth2),db:Session=Depends(get_db)):
    try: uid=int(decode_token(token)['sub'])
    except Exception: raise HTTPException(status_code=401,detail='Invalid or expired token')
    user=db.get(User,uid)
    if not user: raise HTTPException(status_code=401,detail='User not found')
    return user
def admin_only(user=Depends(current_user)):
    if user.role!='ADMIN': raise HTTPException(status_code=403,detail='Admin access required')
    return user
