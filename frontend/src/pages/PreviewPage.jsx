import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext"; // PENTING: Untuk cek status login
import { Copy, Check, ArrowLeft, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import Prism from "prismjs";

const PreviewPage = () => {
  const { id } = useParams();
  const { user } = useAuth(); // Ambil data user yang sedang login
  const [component, setComponent] = useState(null);
  const [activeTab, setActiveTab] = useState("html");
  const [copied, setCopied] = useState(false);

  // State untuk Rating
  const [hoverRating, setHoverRating] = useState(0); // Untuk efek hover mouse

  // Fetch Data Komponen
  const fetchComponent = async () => {
    try {
      const { data } = await api.get(`/components/${id}`);
      setComponent(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat komponen");
    }
  };

  useEffect(() => {
    fetchComponent();
  }, [id]);

  useEffect(() => {
    if (component) Prism.highlightAll();
  }, [component, activeTab]);

  // --- FUNGSI MEMBERIKAN RATING ---
  const handleRate = async (score) => {
    // 1. Cek apakah user login?
    if (!user) {
      toast.error("Please login to rate components!");
      return;
    }

    // 2. Kirim ke Backend
    try {
      await api.post(`/components/${id}/rate`, { score: score });
      toast.success(`You rated this ${score} stars!`);

      // 3. Refresh data agar rata-rata berubah
      fetchComponent();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit rating.");
    }
  };

  const handleCopy = () => {
    const textToCopy =
      activeTab === "html" ? component.html_code : component.css_code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!component)
    return <div className="text-center p-10 text-gray-500">Loading...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d1117] text-gray-300">
      {/* --- HEADER --- */}
      <div className="h-16 border-b border-dark-700 px-6 flex justify-between items-center bg-dark-900 shrink-0">
        {/* Kiri: Back & Title */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">
              {component.category} Component
            </h1>
            <p className="text-xs text-gray-500 mt-1">Free to use</p>
          </div>
        </div>

        {/* Kanan: Rating & User Info */}
        <div className="flex items-center gap-6">
          {/* --- INTERACTIVE RATING SECTION --- */}
          <div className="flex items-center gap-3 bg-dark-800 px-4 py-1.5 rounded-full border border-dark-700">
            {/* Bintang-bintang (Bisa Diklik) */}
            <div
              className="flex gap-1 cursor-pointer"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  // Logic Warna: Kuning jika mouse sedang hover di atasnya ATAU rating asli komponen >= bintang ini
                  className={`transition-colors duration-200 ${
                    (hoverRating || Math.round(component.rating || 0)) >= star
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleRate(star)}
                />
              ))}
            </div>

            {/* Angka Rata-rata & Jumlah Review */}
            <div className="flex items-center gap-2 border-l border-dark-600 pl-3 ml-1">
              <span className="text-sm font-bold text-white">
                {component.rating ? component.rating.toFixed(1) : "0.0"}
              </span>
              <span className="text-xs text-gray-500">
                ({component.review_count || 0} reviews)
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-dark-700"></div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Created by</p>
              <p className="text-sm font-bold text-white leading-none">
                @
                {component.owner?.email
                  ? component.owner.email.split("@")[0]
                  : "User"}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
              {component.owner?.email
                ? component.owner.email[0].toUpperCase()
                : "U"}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT: SPLIT VIEW 50:50 --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* KIRI: LIVE PREVIEW (50%) */}
        <div className="w-full lg:w-1/2 bg-black relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-dark-700 bg-grid-pattern min-h-[300px] lg:min-h-auto">
          <div className="absolute top-4 left-4 bg-dark-800/80 px-2 py-1 rounded text-xs text-gray-400 border border-dark-700 z-10">
            Live Preview
          </div>
          <iframe
            title="Live Preview"
            srcDoc={`<style>${component.css_code} body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:transparent;color:white;font-family:sans-serif;}</style>${component.html_code}`}
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        </div>

        {/* KANAN: CODE EDITOR (50%) */}
        <div className="w-full lg:w-1/2 bg-[#1e1e1e] flex flex-col">
          {/* Tabs */}
          <div className="flex bg-[#252526] border-b border-black">
            <button
              onClick={() => setActiveTab("html")}
              className={`px-6 py-3 text-xs font-bold border-t-2 transition-colors flex items-center gap-2 ${
                activeTab === "html"
                  ? "border-orange-500 bg-[#1e1e1e] text-gray-200"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-orange-500 font-mono">{"<>"}</span> HTML
            </button>
            <button
              onClick={() => setActiveTab("css")}
              className={`px-6 py-3 text-xs font-bold border-t-2 transition-colors flex items-center gap-2 ${
                activeTab === "css"
                  ? "border-blue-500 bg-[#1e1e1e] text-gray-200"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-blue-500 font-mono">#</span> CSS
            </button>
            <div className="flex-1"></div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 text-xs font-medium text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Code Area */}
          <div className="flex-1 relative overflow-auto custom-scrollbar group bg-[#1e1e1e]">
            <pre className="!m-0 !bg-transparent !p-6 !text-sm !font-mono h-full">
              <code className={`language-${activeTab}`}>
                {activeTab === "html"
                  ? component.html_code
                  : component.css_code}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
