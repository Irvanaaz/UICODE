// Buat AuthContext: Tempat menyimpan data user yang sedang login.

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Import axios yang tadi kita buat
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Cek loading saat refresh halaman

  // 1. Cek User saat aplikasi pertama kali dibuka (Refresh)
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Tembak endpoint /users/me yang kemarin kita buat
          const { data } = await api.get('/users/me');
          setUser(data);
        } catch (error) {
          // Kalau token expired/salah, logout paksa
          console.error("Session expired");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // 2. Fungsi Login
  const login = async (email, password) => {
    // Ingat: Backend kita minta format Form Data untuk login
    const formData = new FormData();
    formData.append('username', email); // Walaupun labelnya username, isinya email
    formData.append('password', password);

    try {
      const { data } = await api.post('/token', formData);
      
      // Simpan token di storage browser
      localStorage.setItem('token', data.access_token);
      
      // Ambil data user yang baru login
      const userResponse = await api.get('/users/me');
      setUser(userResponse.data);
      
      toast.success('Login successful! 🚀');
      return true; // Berhasil
    } catch (error) {
      console.error(error);
      toast.error('Login failed! Check email or password.');
      return false; // Gagal
    }
  };

  // 3. Fungsi Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('See you later! 👋');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children} {/* Tunggu loading selesai baru tampilkan app */}
    </AuthContext.Provider>
  );
};

// Custom hook biar gampang dipanggil di file lain
export const useAuth = () => useContext(AuthContext);