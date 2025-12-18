from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# --- ENUM SAMA KAYAK MODEL ---
class Role(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class Status(str, Enum):
    IN_REVIEW = "IN_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

# --- USER SCHEMAS ---

# Ini dipakai saat user mau Register (Input)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str 

# Ini dipakai saat API mengirim data User ke Frontend (Output)
# Password TIDAK dimasukkan di sini biar aman
class UserDisplay(BaseModel):
    id: int
    username: str
    email: str
    role: Role
    
    class Config:
        from_attributes = True # Dulu namanya orm_mode

# --- COMPONENT SCHEMAS ---

# Input saat user bikin komponen baru
class ComponentCreate(BaseModel):
    # title: str
    category: str
    html_code: str
    css_code: str

# Output komponen lengkap
class ComponentDisplay(BaseModel):
    id: int
    category: str
    html_code: str
    css_code: str
    status: str
    created_at: datetime
    owner: UserDisplay
    
    rating: float = 0.0
    review_count: int = 0

    class Config:
        # GANTI INI: dari orm_mode menjadi from_attributes
        from_attributes = True
class RatingCreate(BaseModel):
    score: int