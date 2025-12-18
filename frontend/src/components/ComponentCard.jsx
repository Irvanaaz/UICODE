import React from "react";
import { Code, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";

const ComponentCard = ({ component, onDelete }) => {
  const { user } = useAuth();

  // --- LOGIC BARU: CEK KATEGORI UNTUK TINGGI KARTU ---
  // Jika kategori Card atau Forms, kita buat kartunya tinggi agar muat
  const isTall = ["Forms", "Card"].includes(component.category);

  // Fungsi Delete (Khusus Admin)
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Admin Action: Yakin mau menghapus komponen ini secara permanen?"
      )
    )
      return;

    try {
      await api.delete(`/admin/components/${component.id}`);
      toast.success("Component deleted by Admin");
      if (onDelete) onDelete(component.id);
    } catch (error) {
      toast.error("Gagal menghapus component");
    }
  };

  const srcDoc = `
    <html>
      <head>
        <style>
          body { 
            margin: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            /* Agar konten form selalu di tengah vertikal */
            height: 100%;
            background-color: transparent; 
            color: white; 
            font-family: sans-serif; 
            overflow: hidden; 
          }
          /* CSS User */
          ${component.css_code}
        </style>
      </head>
      <body>
        ${component.html_code}
      </body>
    </html>
  `;

  return (
    // Class h-64 diganti logic dinamis
    <div
      className={`group relative bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 ${
        isTall ? "h-[500px]" : "h-64"
      }`}
    >
      {/* TOMBOL DELETE ADMIN */}
      {user && user.role === "ADMIN" && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 z-50 bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Admin Delete"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* IFRAME */}
      <iframe
        title={component.category}
        srcDoc={srcDoc}
        className="w-full h-full"
        sandbox="allow-scripts"
      />

      {/* TOMBOL GET CODE */}
      <Link
        to={`/preview/${component.id}`}
        className="absolute bottom-3 right-3 z-40 flex items-center gap-2 bg-dark-900/90 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg border border-dark-600 shadow-lg text-xs font-bold transition-all transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <Code size={14} /> Get Code
      </Link>
    </div>
  );
};

export default ComponentCard;
