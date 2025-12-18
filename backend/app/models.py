from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from .database import Base
import datetime
import enum

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class Status(str, enum.Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String, default=Role.USER)
    
    components = relationship("Component", back_populates="owner")

class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    html_code = Column(Text)
    css_code = Column(Text)
    status = Column(String, default=Status.IN_REVIEW)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="components")
    
    # Relasi ke Rating
    ratings = relationship("Rating", back_populates="component")

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    score = Column(Integer) # 1 sampai 5
    
    user_id = Column(Integer, ForeignKey("users.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    
    component = relationship("Component", back_populates="ratings")