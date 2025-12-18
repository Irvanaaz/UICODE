from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware # <--- IMPORT PENTING
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from fastapi.security import OAuth2PasswordRequestForm

from .database import get_db, engine
from . import models, schemas, crud, auth
from .models import Role, Status

# Buat tabel database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="UICODE API")

# --- KONFIGURASI CORS (AGAR FRONTEND BISA AKSES) ---
origins = [
    "http://localhost:5173",      # Alamat Frontend React kamu
    "http://127.0.0.1:5173",      # Alternatif alamat lokal
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Izinkan alamat di atas
    allow_credentials=True,       # Izinkan kirim cookie/token
    allow_methods=["*"],          # Izinkan semua method (GET, POST, DELETE, dll)
    allow_headers=["*"],          # Izinkan semua header
)

@app.get("/")
def read_root():
    return {"message": "Welcome to UICODE API!"}

# Endpoint untuk cek koneksi database
@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Coba jalankan query simpel "SELECT 1"
        db.execute(text("SELECT 1"))
        return {"status": "Database Connected! 🟢"}
    except Exception as e:
        return {"status": "Connection Failed 🔴", "error": str(e)}
    
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Cari user berdasarkan EMAIL (karena kita sepakat login pakai email)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", 
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Simpan EMAIL ke dalam token sebagai identitas (sub)
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- ENDPOINT USER ---

@app.post("/users/", response_model=schemas.UserDisplay)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.UserDisplay)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- ENDPOINT COMPONENT ---

@app.get("/components/", response_model=List[schemas.ComponentDisplay])
def read_components(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Ambil data mentah dari database
    comps = crud.get_public_components(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        category=category
    )
    
    # 2. Loop setiap komponen untuk menyuntikkan data rating
    results = []
    for c in comps:
        # Hitung rating pakai fungsi yang sudah kita buat di crud
        avg, count = crud.get_average_rating(db, c.id)
        
        # Ubah object database ke format Dictionary
        c_dict = schemas.ComponentDisplay.from_orm(c).dict()
        
        # Masukkan data rating manual ke dictionary
        c_dict['rating'] = avg
        c_dict['review_count'] = count
        
        results.append(c_dict)

    return results

@app.post("/components/", response_model=schemas.ComponentDisplay)
def create_component(
    component: schemas.ComponentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_component(db=db, component=component, user_id=current_user.id)

# --- 1. USER: LIHAT HISTORY SENDIRI (My Profile) ---
@app.get("/users/me/components", response_model=List[schemas.ComponentDisplay])
def read_own_components(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_components_by_user(db, user_id=current_user.id)

# --- 2. ADMIN: LIHAT ANTRIAN REVIEW (Dashboard) ---
@app.get("/admin/pending", response_model=List[schemas.ComponentDisplay])
def read_pending_components(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized. Admin only.")
        
    return crud.get_pending_components(db)

# --- 3. ADMIN: UPDATE STATUS (Accept/Reject) ---
@app.patch("/admin/components/{component_id}/status")
def update_status(
    component_id: int,
    status: Status, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updated_comp = crud.update_component_status(db, component_id, status)
    if not updated_comp:
        raise HTTPException(status_code=404, detail="Component not found")
        
    return {"message": "Status updated successfully", "status": updated_comp.status}

# --- 4. ADMIN: DELETE COMPONENT ---
@app.delete("/admin/components/{component_id}")
def delete_component(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    deleted = crud.delete_component(db, component_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Component not found")
        
    return {"message": "Component deleted successfully"}

# --- ENDPOINT COMPONENT DETAIL (BARU) ---
@app.get("/components/{id}", response_model=schemas.ComponentDisplay)
def read_component(id: int, db: Session = Depends(get_db)):
    # 1. Ambil data komponen dari database
    comp = crud.get_component(db, component_id=id)
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # 2. HITUNG RATING RATA-RATA (Ini yang sebelumnya kurang)
    avg, count = crud.get_average_rating(db, id)
    
    # 3. Ubah objek database ke Dictionary agar bisa kita edit isinya
    # Menggunakan from_orm karena kita pakai Pydantic
    comp_dict = schemas.ComponentDisplay.from_orm(comp).dict()
    
    # 4. Masukkan hasil hitungan rating ke dalam data yang mau dikirim
    comp_dict['rating'] = avg
    comp_dict['review_count'] = count
    
    return comp_dict

# --- ADMIN: LIHAT SEMUA USER ---
@app.get("/admin/users", response_model=List[schemas.UserDisplay])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_all_users(db)

# --- ADMIN: HAPUS USER ---
@app.delete("/admin/users/{user_id}")
def delete_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# --- ADMIN: LIHAT KARYA USER TERTENTU ---
@app.get("/admin/users/{user_id}/components", response_model=List[schemas.ComponentDisplay])
def get_specific_user_components(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_components_by_user_id(db, user_id)

# --- ENDPOINT RATING ---
@app.post("/components/{id}/rate")
def rate_component(
    id: int,
    rating: schemas.RatingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.vote_component(db, user_id=current_user.id, component_id=id, score=rating.score)
    return {"message": "Rating submitted"}

# UPDATE ENDPOINT GET SINGLE COMPONENT (Agar return rating asli)
@app.get("/components/{id}")
def read_component(id: int, db: Session = Depends(get_db)):
    comp = crud.get_component(db, component_id=id)
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Hitung rating rata-rata saat diambil
    avg, count = crud.get_average_rating(db, id)
    
    # Kita inject data rating ke response JSON manual
    response_data = schemas.ComponentDisplay.from_orm(comp)
    # Karena schema ComponentDisplay kita belum ada field rating, 
    # Frontend nanti akan kita akali supaya fetch terpisah atau kita update schema.
    # Cara paling gampang: return dict saja
    
    result = {
        "id": comp.id,
        "category": comp.category,
        "html_code": comp.html_code,
        "css_code": comp.css_code,
        "owner": comp.owner,
        "created_at": comp.created_at,
        "status": comp.status,
        "rating": avg,      # <--- Rating Asli
        "review_count": count # <--- Jumlah Review Asli
    }
    return result