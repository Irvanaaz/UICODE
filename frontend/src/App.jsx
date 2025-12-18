import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChevronDown, Box, LayoutGrid } from "lucide-react";

// --- IMPORT HALAMAN ---
// PENTING: Kita import dari file "login" (kecil) tapi kita namakan "Login" (Besar)
// supaya React mau menampilkannya sebagai halaman.
import Login from "./pages/login";
import Home from "./pages/Home";
import CreateComponent from "./pages/CreateComponent";
import AdminDashboard from "./pages/AdminDashboard";
import PreviewPage from "./pages/PreviewPage";
import UserProfile from "./pages/UserProfile";
import Register from "./pages/Register";
import ElementsPage from "./pages/ElementsPage";

// --- DATA KATEGORI UNTUK NAVBAR (10 Item) ---
const CATEGORIES = [
  "All",
  "Button",
  "Card",
  "Input",
  "Loader",
  "ToggleSwitch",
  "Forms",
  "RadioButton",
  "Checkboxes",
  "Tooltips",
];

// Bagi jadi 2 kolom (5 kiri, 5 kanan)
const leftCategories = CATEGORIES.slice(0, 5);
const rightCategories = CATEGORIES.slice(5, 10);

// --- KOMPONEN NAVBAR ---
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 px-6 border-b border-dark-700 flex justify-between items-center bg-dark-800 sticky top-0 z-50">
      {/* BAGIAN KIRI: LOGO & ELEMENTS DROPDOWN */}
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="font-bold text-xl text-primary-500 tracking-tight hover:opacity-80 transition-opacity"
        >
          UICODE
        </Link>

        {/* --- DROPDOWN ELEMENTS (MODEL 5-5) --- */}
        <div className="relative group h-16 flex items-center">
          {/* Tombol Pemicu Dropdown */}
          <Link
            to="/elements"
            className="flex items-center gap-1 text-sm font-medium text-gray-300 group-hover:text-white transition-colors focus:outline-none"
          >
            Elements{" "}
            <ChevronDown
              size={14}
              className="group-hover:rotate-180 transition-transform duration-300"
            />
          </Link>

          {/* Isi Dropdown (Mega Menu 2 Kolom) */}
          <div className="absolute top-[90%] left-0 w-[400px] bg-dark-800 border border-dark-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50 overflow-hidden p-4">
            <div className="flex gap-4">
              {/* Kolom Kiri (5 Item) */}
              <div className="flex-1 flex flex-col gap-1">
                {leftCategories.map((cat) => (
                  <Link
                    key={cat}
                    to={
                      cat === "All" ? "/elements" : `/elements?category=${cat}`
                    }
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                  >
                    <Box size={14} className="text-primary-500" />
                    {cat}
                  </Link>
                ))}
              </div>

              {/* Garis Tengah */}
              <div className="w-[1px] bg-dark-700"></div>

              {/* Kolom Kanan (5 Item) */}
              <div className="flex-1 flex flex-col gap-1">
                {rightCategories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/elements?category=${cat}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                  >
                    <LayoutGrid size={14} className="text-purple-500" />
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN: USER MENU */}
      <div className="flex items-center gap-6">
        {user && (
          <Link
            to="/create"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            + Create New
          </Link>
        )}

        {user ? (
          <div className="flex gap-4 items-center pl-6 border-l border-dark-700">
            <Link
              to="/profile"
              className="text-right hidden sm:block hover:opacity-80 group"
            >
              <p className="text-sm text-white font-medium group-hover:text-primary-400 transition-colors">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {user.role}
              </p>
            </Link>
            <button
              onClick={logout}
              className="bg-dark-700 hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

// --- LOGIC PROTEKSI ---
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" />;
  return children;
};

// --- APP UTAMA ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-dark-900 text-white font-sans">
          <Toaster
            position="top-center"
            toastOptions={{ style: { background: "#333", color: "#fff" } }}
          />

          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/elements" element={<ElementsPage />} />

            {/* DI SINI KUNCINYA:
                path="/login" -> Alamat URL di browser
                element={<Login />} -> Komponen yang ditampilkan (HARUS Huruf Besar)
            */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/preview/:id" element={<PreviewPage />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateComponent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roleRequired="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
