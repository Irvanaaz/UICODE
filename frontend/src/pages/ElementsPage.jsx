import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ComponentCard from "../components/ComponentCard";
import {
  LayoutGrid,
  MousePointer2,
  CreditCard,
  FormInput,
  Loader,
  ToggleLeft,
  AlignJustify,
  CheckSquare,
  CircleDot,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";

// Daftar Kategori
const CATEGORIES = [
  { id: "All", label: "All Elements", icon: LayoutGrid },
  { id: "Button", label: "Buttons", icon: MousePointer2 },
  { id: "Checkboxes", label: "Checkboxes", icon: CheckSquare },
  { id: "ToggleSwitch", label: "Toggle switches", icon: ToggleLeft },
  { id: "Card", label: "Cards", icon: CreditCard },
  { id: "Loader", label: "Loaders", icon: Loader },
  { id: "Input", label: "Inputs", icon: FormInput },
  { id: "RadioButton", label: "Radio buttons", icon: CircleDot },
  { id: "Forms", label: "Forms", icon: AlignJustify },
  { id: "Tooltips", label: "Tooltips", icon: MessageSquare },
];

const ElementsPage = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";
  const [searchTerm, setSearchTerm] = useState("");

  const handleCategoryChange = (catId) => {
    setSearchParams({ category: catId });
    setSearchTerm("");
  };

  useEffect(() => {
    const fetchComponents = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;

        // Jika bukan All, ambil spesifik kategori
        if (activeCategory !== "All") {
          params.category = activeCategory;
        }

        const { data } = await api.get("/components/", { params });

        // --- FILTER LOGIC ---
        // Jika sedang di "All Elements", KITA BUANG Forms dan Card
        // Supaya grid tetap rapi dengan item-item kecil
        let filteredData = data;

        if (activeCategory === "All") {
          filteredData = data.filter(
            (comp) => comp.category !== "Card" && comp.category !== "Forms"
          );
        }

        setComponents(filteredData);
      } catch (error) {
        console.error("Error fetching components:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchComponents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeCategory]);

  const handleRemoveCard = (deletedId) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== deletedId));
  };

  // Cek apakah layout butuh lebar (Forms/Card)
  const isWideLayout = ["Forms", "Card"].includes(activeCategory);

  return (
    <div className="flex min-h-screen bg-dark-900 pt-0">
      {/* SIDEBAR */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 hidden md:flex flex-col fixed h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
            Categories
          </h2>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "text-gray-400 hover:bg-dark-700 hover:text-white"
                }`}
              >
                <cat.icon size={18} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {activeCategory === "All"
                ? "Browse All Elements"
                : `${activeCategory}s`}
            </h1>
            <p className="text-gray-400 text-sm">
              {activeCategory === "All"
                ? "Showing collection of Buttons, Inputs, Toggles, etc."
                : `Open-Source ${activeCategory} elements`}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              className="w-full bg-dark-800 border border-dark-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm transition-all"
              placeholder={`Search ${activeCategory}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dropdown Mobile */}
        <div className="md:hidden mb-6">
          <select
            value={activeCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full bg-dark-800 text-white p-3 rounded-lg border border-dark-700 focus:outline-none focus:border-primary-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Grid Components */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <Loader className="animate-spin w-8 h-8 mx-auto mb-2 text-primary-500" />
            Loading elements...
          </div>
        ) : components.length > 0 ? (
          // Grid System: 2 Kolom kalau Card/Form, 3 Kolom kalau All/Button
          <div
            className={`grid gap-6 ${
              isWideLayout
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {components.map((comp) => (
              <ComponentCard
                key={comp.id}
                component={comp}
                onDelete={handleRemoveCard}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl bg-dark-800/30">
            <Filter className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white">
              No elements found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or category.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ElementsPage;
