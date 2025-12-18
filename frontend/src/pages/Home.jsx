import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // PENTING: Import Link & useNavigate
import api from "../services/api";
import ComponentCard from "../components/ComponentCard";
import { Loader, Search, ArrowRight, LayoutGrid } from "lucide-react";

const Home = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Hook untuk pindah halaman

  // Kategori yang mau ditampilkan di Home (Featured)
  const FEATURED_CATEGORIES = ["Button", "Loader", "ToggleSwitch"];

  // 1. Fetch Data Khusus Home (Hanya Button, Loader, ToggleSwitch & Max 10)
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        // Ambil cukup banyak data dulu (limit 50), nanti kita filter di JS
        // Ini cara aman tanpa ubah backend yang rumit
        const { data } = await api.get("/components/?limit=50");

        // Filter Frontend: Hanya kategori tertentu
        const filtered = data.filter((item) =>
          FEATURED_CATEGORIES.includes(item.category)
        );

        // Ambil 10 teratas saja
        setComponents(filtered.slice(0, 9));
      } catch (error) {
        console.error("Gagal mengambil komponen featured:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // 2. Handle Search: Kalau user tekan Enter, pindah ke halaman Elements
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      // Redirect ke halaman elements dengan query search
      navigate(`/elements?search=${searchTerm}`);
    }
  };

  // Handle delete (Admin) - Menghapus kartu dari tampilan local
  const handleRemoveCard = (deletedId) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== deletedId));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 min-h-screen flex flex-col">
      {/* --- HERO SECTION --- */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-6 tracking-tight">
          Find the perfect UI Element
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Explore our curated collection of buttons, loaders, and toggles ready
          to copy-paste into your project.
        </p>

        {/* Search Bar (Redirects to Elements Page) */}
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full bg-dark-800 border border-dark-700 text-white rounded-full pl-12 pr-4 py-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-xl text-lg placeholder-gray-500"
            placeholder="Search for components... (Press Enter)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* --- FEATURED GRID HEADER --- */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-600/20 p-2 rounded-lg">
          <LayoutGrid size={20} className="text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Featured Elements</h2>
      </div>

      {/* --- CONTENT GRID (Max 10 Items) --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader className="animate-spin text-primary-500 w-10 h-10 mb-4" />
          <p>Loading curated elements...</p>
        </div>
      ) : components.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {components.map((comp) => (
            <ComponentCard
              key={comp.id}
              component={comp}
              onDelete={handleRemoveCard}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl bg-dark-800/30 mb-12">
          <p className="text-gray-500">
            No featured components found right now.
          </p>
        </div>
      )}

      {/* --- TOMBOL BROWSE ALL --- */}
      <div className="flex justify-center pb-10">
        <Link
          to="/elements"
          className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 hover:scale-105 transition-all shadow-xl shadow-white/10"
        >
          Browse All Elements
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
};

export default Home;
