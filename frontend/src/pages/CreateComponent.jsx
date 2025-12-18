import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Code, Eye, Save, Layout } from "lucide-react";

// DAFTAR KATEGORI LENGKAP (Agar konsisten dengan Navbar & Home)
const CATEGORIES = [
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

const CreateComponent = () => {
  const navigate = useNavigate();

  // State untuk form
  const [category, setCategory] = useState("Button");
  const [htmlCode, setHtmlCode] = useState(
    '<button class="my-btn">Hello World</button>'
  );
  const [cssCode, setCssCode] = useState(
    ".my-btn { background: blue; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; border: none; }"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic Live Preview (Gabungin HTML + CSS)
  const srcDoc = `
    <html>
      <head>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: transparent; color: white; font-family: sans-serif; }
          /* CSS User */
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
    </html>
  `;

  // Fungsi Submit ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Kirim data ke endpoint POST /components/
      await api.post("/components/", {
        category,
        html_code: htmlCode,
        css_code: cssCode,
      });

      toast.success("Component created successfully!");
      navigate("/"); // Balik ke Home setelah sukses
    } catch (error) {
      console.error(error);
      toast.error("Failed to create component.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {" "}
      {/* Full height minus navbar */}
      {/* --- HEADER EDITOR --- */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layout size={20} className="text-primary-500" /> Create New Component
        </h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} /> {isSubmitting ? "Saving..." : "Publish Component"}
        </button>
      </div>
      {/* --- MAIN CONTENT (SPLIT VIEW) --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* --- KIRI: CODE EDITOR --- */}
        <div className="w-full lg:w-1/2 bg-dark-900 flex flex-col border-r border-dark-700">
          {/* Input Kategori (UPDATED) */}
          <div className="p-4 border-b border-dark-700">
            <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">
              Category
            </label>
            <div className="relative mt-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-800 text-white p-3 rounded-lg border border-dark-600 focus:border-primary-500 outline-none appearance-none cursor-pointer hover:border-dark-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {/* Panah Dropdown Custom */}
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* HTML Editor */}
          <div className="flex-1 flex flex-col min-h-[200px]">
            <div className="bg-dark-800 px-4 py-2 text-xs text-gray-400 flex items-center gap-2 border-y border-dark-700">
              <Code size={12} className="text-orange-500" /> HTML Structure
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="flex-1 w-full bg-[#0d1117] text-gray-300 p-4 font-mono text-sm outline-none resize-none custom-scrollbar focus:bg-[#161b22] transition-colors"
              spellCheck="false"
              placeholder="Type your HTML here..."
            />
          </div>

          {/* CSS Editor */}
          <div className="flex-1 flex flex-col min-h-[200px]">
            <div className="bg-dark-800 px-4 py-2 text-xs text-gray-400 flex items-center gap-2 border-y border-dark-700">
              <Code size={12} className="text-blue-500" /> CSS Styles
            </div>
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              className="flex-1 w-full bg-[#0d1117] text-gray-300 p-4 font-mono text-sm outline-none resize-none custom-scrollbar focus:bg-[#161b22] transition-colors"
              spellCheck="false"
              placeholder="Type your CSS here..."
            />
          </div>
        </div>

        {/* --- KANAN: LIVE PREVIEW --- */}
        <div className="w-full lg:w-1/2 bg-black flex flex-col relative border-t lg:border-t-0">
          <div className="absolute top-4 right-4 bg-dark-800/80 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-2 z-10 border border-dark-700 shadow-xl">
            <Eye size={14} /> Live Preview
          </div>

          {/* Canvas Preview */}
          <div className="flex-1 flex items-center justify-center bg-grid-pattern">
            <iframe
              title="Preview"
              srcDoc={srcDoc}
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateComponent;
