-- 1. Buat Custom Types (ENUM) untuk menjaga konsistensi data
-- Ini memastikan role hanya bisa 'USER' atau 'ADMIN'
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Ini memastikan status komponen hanya bisa 3 opsi ini
CREATE TYPE component_status AS ENUM ('IN_REVIEW', 'ACCEPTED', 'REJECTED');

-- 2. Buat Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buat Tabel Components
CREATE TABLE components (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    html_code TEXT NOT NULL,
    css_code TEXT NOT NULL,
    status component_status DEFAULT 'IN_REVIEW',
    rating INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. (Opsional) Masukkan Data Dummy untuk Pengetesan Awal
-- Insert Admin User (Password ini cuma contoh string, nanti di app harus di-hash)
INSERT INTO users (username, email, hashed_password, role)
VALUES ('adminirvan', 'irvan1212@uicode.com', '$2b$12$kd/w826bYVExKgNNFl5q8.RWFgoCUcqcYskaSaAwdWft1HL6hIVrS', 'ADMIN');

-- Insert Normal User
INSERT INTO users (username, email, hashed_password, role)
VALUES ('dev_budi', 'budi@gmail.com', '$2b$12$RVRzTDgV0ZagOGuEZxbpCupRbrNtGKbzJCCMgMz2tK1QZP6/fteWm', 'USER');

-- Insert Contoh Komponen (Sudah Accepted)
INSERT INTO components (title, category, html_code, css_code, status, rating, user_id)
VALUES (
    'Neon Button', 
    'Button', 
    '<button class="neon-btn">Click Me</button>', 
    '.neon-btn { background: #000; color: #0f0; border: 2px solid #0f0; padding: 10px 20px; box-shadow: 0 0 10px #0f0; }',
    'ACCEPTED',
    5,
    2 -- Milik User ID 2 (dev_budi)
);

-- Insert Contoh Komponen (Masih Review)
INSERT INTO components (title, category, html_code, css_code, status, rating, user_id)
VALUES (
    'Simple Card', 
    'Card', 
    '<div class="card">Hello World</div>', 
    '.card { background: white; padding: 20px; border-radius: 8px; }',
    'IN_REVIEW',
    0,
    2 -- Milik User ID 2 (dev_budi)
);