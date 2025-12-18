import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast"; // Kita pindah Toaster ke sini biar lebih aman

// --- Import Tema PrismJS (Wajib ada untuk warna kode) ---
import "prismjs/themes/prism-tomorrow.css";
// -------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
