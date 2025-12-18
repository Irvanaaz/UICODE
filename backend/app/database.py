from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Load data dari file .env
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Buat "Mesin" koneksi ke Postgres
# Jika ada error koneksi, biasanya karena URL di .env salah
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Buat sesi database (SessionLocal)
# Ini yang akan kita pakai setiap kali mau simpan/ambil data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base class untuk membuat Model (Tabel) nanti
Base = declarative_base()

# 5. Helper function untuk mengambil koneksi DB di setiap request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()