from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from . import crud, models, database

# 1. Load Config dari .env
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "rahasia_default_kalau_env_gagal") # Backup key
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 2. Setup skema token (Bearer Token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- FUNGSI BIKIN TOKEN ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Masukkan waktu expired ke dalam token
    to_encode.update({"exp": expire})
    
    # Enkripsi data jadi string token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- FUNGSI CEK USER SAAT INI (DEPENDENCY) ---
# Fungsi ini akan dipasang di endpoint yang butuh login
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Dekode Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Cari user di database berdasarkan token tadi
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user