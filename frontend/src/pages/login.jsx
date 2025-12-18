import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"; // PENTING: Untuk baca URL
import api from "../services/api";
import ComponentCard from "../components/ComponentCard";
import { Loader, Search, Filter } from "lucide-react";

const Home = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Baca Kategori dari URL (misal: /?category=Button)
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "All";

  // State untuk Search Text
  const [searchTerm, setSearchTerm] = useState("");

  // Efek berjalan saat URL (kategori) berubah ATAU Search diketik
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchComponents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory]); // Trigger jika kategori di URL berubah

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const params = {};
      // Kirim parameter ke backend
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== "All") params.category = selectedCategory;

      const { data } = await api.get("/components/", { params });
      setComponents(data);
    } catch (error) {
      console.error("Gagal mengambil komponen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      {/* --- HERO & SEARCH SECTION --- */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6">
          Find the perfect UI Element
        </h1>

        {/* Search Bar Saja (Tombol Kategori SUDAH DIHAPUS) */}
        <div className="max-w-2xl mx-auto relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="w-full bg-dark-800 border border-dark-700 text-white rounded-full pl-12 pr-4 py-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-lg"
            placeholder={`Search in ${
              selectedCategory === "All" ? "all components" : selectedCategory
            }...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      {/* Menampilkan judul kategori yang sedang aktif */}
      <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm font-medium">
        <Filter size={16} /> Showing:{" "}
        <span className="text-white">{selectedCategory}</span>
        {searchTerm && (
          <span className="text-gray-500"> — matching "{searchTerm}"</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader className="animate-spin text-primary-500 w-10 h-10 mb-4" />
          <p>Searching components...</p>
        </div>
      ) : components.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((comp) => (
            <ComponentCard key={comp.id} component={comp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl bg-dark-800/30">
          <Filter className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white">
            No components found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
