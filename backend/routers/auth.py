from fastapi import APIRouter, Depends, HTTPException, Request, Form, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
from user_agents import parse
from fastapi.responses import JSONResponse
from sqlalchemy import or_

from database import SessionLocal
from models.auth import User, Device

router = APIRouter(prefix="/auth", tags=["authentication"])

# Güvenlik ayarları
SECRET_KEY = "your-super-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Database bağlantısı
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT token oluşturma
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Kullanıcı doğrulama
def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not pwd_context.verify(password, user.password):
        return False
    if user.is_expired:
        raise HTTPException(
            status_code=401,
            detail="Hesap süresi dolmuştur. Lütfen yönetici ile iletişime geçin."
        )
    return user

# Admin kontrolü
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    if user.is_expired:
        raise HTTPException(
            status_code=401,
            detail="Hesap süresi dolmuştur. Lütfen yönetici ile iletişime geçin."
        )
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.post("/token")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            return JSONResponse(
                status_code=401,
                content={"detail": "Incorrect username or password"}
            )

        # User-Agent bilgisini parse edelim
        user_agent_string = request.headers.get("user-agent")
        user_agent = parse(user_agent_string)
        
        # Gerçek IP adresini almak için
        forwarded_for = request.headers.get("X-Forwarded-For")
        client_ip = forwarded_for.split(",")[0] if forwarded_for else request.client.host

        # Cihaz tipini belirle
        if user_agent.is_mobile:
            device_type = "Mobile"
        elif user_agent.is_tablet:
            device_type = "Tablet"
        else:
            device_type = "Desktop"

        # İşletim sistemi bilgisini daha detaylı al
        os_name = user_agent.os.family
        os_version = user_agent.os.version_string
        full_os_name = f"{os_name} {os_version}".strip()

        # Eğer aynı işletim sisteminden giriş varsa, eski girişi güncelle
        existing_device = db.query(Device)\
            .filter(Device.user_id == user.id, 
                   Device.os_info == full_os_name)\
            .first()
        
        if not existing_device:
            # Yeni cihaz kaydı
            device_id = str(uuid.uuid4())
            new_device = Device(
                user_id=user.id,
                device_name=full_os_name,
                device_id=device_id,
                ip_address=client_ip,
                user_agent=user_agent_string,
                os_info=full_os_name,
                browser_info=f"{user_agent.browser.family} {user_agent.browser.version_string}",
                device_type=device_type,
                screen_resolution=request.headers.get("sec-ch-viewport-width", "Unknown") + "x" + 
                                request.headers.get("sec-ch-viewport-height", "Unknown")
            )
            db.add(new_device)
            db.commit()
        else:
            existing_device.last_login = datetime.utcnow()
            existing_device.ip_address = client_ip
            existing_device.user_agent = user_agent_string
            db.commit()
            device_id = existing_device.device_id

        access_token = create_access_token(
            data={"sub": user.username, "is_admin": user.is_admin, "device_id": device_id}
        )

        return JSONResponse(
            content={
                "access_token": access_token,
                "token_type": "bearer",
                "is_admin": user.is_admin
            }
        )

    except Exception as e:
        print(f"Login error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

@router.post("/initial-setup")
async def create_initial_admin(db: Session = Depends(get_db)):
    # Veritabanında hiç kullanıcı yoksa ilk admin kullanıcısını oluştur
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Initial setup has already been completed")
    
    admin_password = pwd_context.hash("admin123")  # Varsayılan şifre
    admin_user = User(
        username="admin",
        email="admin@example.com",  # Varsayılan admin email
        password=admin_password,
        is_admin=True
    )
    db.add(admin_user)
    db.commit()
    return {
        "message": "Initial admin user created",
        "username": "admin",
        "email": "admin@example.com",
        "password": "admin123"
    }

@router.post("/users/create")
async def create_user(
    username: str,
    email: str,
    password: str,
    days_valid: Optional[int] = None,
    is_admin: bool = False,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Check if username exists
    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kayıtlı")
    
    # Check if email exists
    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayıtlı")
    
    # Validate email format
    if not "@" in email or not "." in email:
        raise HTTPException(status_code=400, detail="Geçersiz email formatı")
    
    hashed_password = pwd_context.hash(password)
    expires_at = None
    if days_valid is not None and days_valid > 0:
        expires_at = datetime.utcnow() + timedelta(days=days_valid)
    
    new_user = User(
        username=username,
        email=email,
        password=hashed_password, 
        is_admin=is_admin,
        expires_at=expires_at
    )
    db.add(new_user)
    db.commit()
    return {
        "message": "Kullanıcı başarıyla oluşturuldu",
        "username": username,
        "email": email,
        "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S") if expires_at else None,
        "days_valid": days_valid
    }

@router.get("/users")
async def get_users(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "expires_at": user.expires_at.strftime("%Y-%m-%d %H:%M:%S") if user.expires_at else None,
        "days_remaining": user.days_remaining,
        "is_expired": user.is_expired,
        "devices": [{
            "device_name": device.device_name,
            "last_login": device.formatted_last_login,
            "ip_address": device.ip_address,
            "os_info": device.os_info,
            "browser_info": device.browser_info,
            "device_type": device.device_type,
            "user_agent": device.user_agent
        } for device in user.devices]
    } for user in users]

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/validate-token")
async def validate_token(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin
    }

# Süresi dolmuş hesapları temizleme görevi
@router.delete("/cleanup-expired")
async def cleanup_expired_users(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    expired_users = db.query(User).filter(
        User.expires_at.isnot(None),
        User.expires_at < datetime.utcnow(),
        User.is_admin == False  # Admin hesapları silinmez
    ).all()
    
    deleted_count = len(expired_users)
    for user in expired_users:
        db.delete(user)
    
    db.commit()
    return {
        "message": f"{deleted_count} expired user(s) have been deleted",
        "deleted_users": [user.username for user in expired_users]
    } 