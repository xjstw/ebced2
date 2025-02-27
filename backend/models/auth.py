from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timedelta

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_expired(self):
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    @property
    def days_remaining(self):
        if self.expires_at is None:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_name = Column(String)
    device_id = Column(String, unique=True)
    last_login = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
    user_agent = Column(String)
    os_info = Column(String)
    browser_info = Column(String)
    device_type = Column(String)
    screen_resolution = Column(String)
    
    user = relationship("User", back_populates="devices")

    @property
    def formatted_last_login(self):
        return self.last_login.strftime("%d-%m-%Y %H:%M:%S") 