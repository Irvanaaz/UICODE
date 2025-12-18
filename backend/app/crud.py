from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas
from passlib.context import CryptContext

# --- 1. SETUP KEAMANAN (HASHING) ---
# Ini alat untuk mengubah password "rahasia123" menjadi kode acak panjang
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# --- 2. LOGIC USER ---

# Fungsi untuk mencari user berdasarkan email (Cek duplikat saat register)
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# Fungsi untuk membuat user baru
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    # Membuat object User baru
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=models.Role.USER # Default role adalah USER
    )
    db.add(db_user)      # Tambah ke session
    db.commit()          # Simpan ke database
    db.refresh(db_user)  # Refresh untuk dapatkan ID yang baru dibuat
    return db_user

# --- 3. LOGIC COMPONENT ---

# Ambil semua komponen yang statusnya ACCEPTED (Untuk Halaman Home Public)
def get_public_components(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None,   # Parameter Baru
    category: str = None  # Parameter Baru
):
    # Mulai query dasar (Hanya yang ACCEPTED)
    query = db.query(models.Component).filter(models.Component.status == models.Status.ACCEPTED)

    # 1. Filter Kategori (Jika ada)
    if category and category != "All":
        query = query.filter(models.Component.category == category)

    # 2. Filter Search Keyword (Jika ada)
    if search:
        search_fmt = f"%{search}%"
        # Cari di dalam Category ATAU di dalam kodingan HTML-nya
        query = query.filter(
            or_(
                models.Component.category.ilike(search_fmt),
                models.Component.html_code.ilike(search_fmt)
            )
        )

    return query.offset(skip).limit(limit).all()

# Buat komponen baru (Otomatis status IN_REVIEW)
def create_component(db: Session, component: schemas.ComponentCreate, user_id: int):
    db_component = models.Component(
        category=component.category,
        html_code=component.html_code,
        css_code=component.css_code,
        user_id=user_id, # <--- Pastikan ini user_id, BUKAN owner_id
        status=models.Status.IN_REVIEW 
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component

# (Khusus Admin) Hapus komponen
def delete_component(db: Session, component_id: int):
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if component:
        db.delete(component)
        db.commit()
    return component

def update_component_status(db: Session, component_id: int, new_status: models.Status):
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if component:
        component.status = new_status
        db.commit()
        db.refresh(component)
    return component

# --- AMBIL KOMPONEN MILIK USER TERTENTU (Untuk Profile) ---
def get_components_by_user(db: Session, user_id: int):
    return db.query(models.Component).filter(models.Component.user_id == user_id).all()

# --- AMBIL SEMUA REQUEST PENDING (Untuk Dashboard Admin) ---
def get_pending_components(db: Session):
    return db.query(models.Component).filter(models.Component.status == models.Status.IN_REVIEW).all()
# --- AMBIL SATU KOMPONEN BERDASARKAN ID ---
def get_component(db: Session, component_id: int):
    return db.query(models.Component).filter(models.Component.id == component_id).first()

# --- ADMIN: GET ALL USERS ---
def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# --- ADMIN: DELETE USER ---
def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # 1. HAPUS DULU: Rating yang pernah dibuat oleh user ini
        # Kalau tidak dihapus, database akan menolak delete user (Foreign Key Error)
        db.query(models.Rating).filter(models.Rating.user_id == user_id).delete()

        # 2. HAPUS DULU: Komponen milik user ini
        # (Sebenarnya biasanya otomatis, tapi kita paksa hapus manual biar aman & bersih)
        # Sebelum hapus komponen, hapus juga rating yang nempel di komponen user ini
        user_components = db.query(models.Component).filter(models.Component.user_id == user_id).all()
        for comp in user_components:
            # Hapus rating yang ada di komponen milik user ini
            db.query(models.Rating).filter(models.Rating.component_id == comp.id).delete()
            # Hapus komponennya
            db.delete(comp)

        # 3. TERAKHIR: Baru hapus User-nya
        db.delete(user)
        
        db.commit()
        return True
    return False

# --- ADMIN: GET COMPONENTS BY SPECIFIC USER ID (Untuk melihat karya user lain) ---
def get_components_by_user_id(db: Session, user_id: int):
    return db.query(models.Component).filter(models.Component.user_id == user_id).all()

# rating sistem
def vote_component(db: Session, user_id: int, component_id: int, score: int):
    # Cek apakah user sudah pernah vote komponen ini?
    existing_vote = db.query(models.Rating).filter(
        models.Rating.user_id == user_id,
        models.Rating.component_id == component_id
    ).first()

    if existing_vote:
        existing_vote.score = score # Update nilai lama
    else:
        new_vote = models.Rating(user_id=user_id, component_id=component_id, score=score)
        db.add(new_vote)
    
    db.commit()
    return True

def get_average_rating(db: Session, component_id: int):
    # Hitung rata-rata manual
    ratings = db.query(models.Rating).filter(models.Rating.component_id == component_id).all()
    if not ratings:
        return 0, 0 # Rating 0, Jumlah 0
    
    total_score = sum(r.score for r in ratings)
    count = len(ratings)
    return round(total_score / count, 1), count