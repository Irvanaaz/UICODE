import React, { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Check, X, Trash2, ShieldAlert, Code } from "lucide-react";

const AdminDashboard = () => {
  const [pendingComponents, setPendingComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Ambil data komponen yang statusnya IN_REVIEW
  const fetchPending = async () => {
    try {
      const { data } = await api.get("/admin/pending");
      setPendingComponents(data);
    } catch (error) {
      console.error("Error fetching pending:", error);
      toast.error("Gagal mengambil data pending.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // 2. Logic Approve / Reject
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/admin/components/${id}/status?status=${newStatus}`);
      toast.success(`Component ${newStatus}!`);
      fetchPending(); // Refresh list setelah update
    } catch (error) {
      toast.error("Gagal update status.");
    }
  };

  // 3. Logic Delete Permanen
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin mau hapus permanen?")) return;

    try {
      await api.delete(`/admin/components/${id}`);
      toast.success("Component deleted.");
      fetchPending();
    } catch (error) {
      toast.error("Gagal menghapus component.");
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="text-red-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Admin Moderation</h1>
      </div>

      {pendingComponents.length === 0 ? (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-10 text-center text-gray-400">
          <p>🎉 Tidak ada antrean review. Semua aman!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingComponents.map((comp) => (
            <div
              key={comp.id}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start"
            >
              {/* --- PREVIEW MINI --- */}
              <div className="w-full md:w-1/3 h-40 bg-dark-900 rounded-lg border border-dark-700 overflow-hidden relative group">
                <iframe
                  title="preview"
                  srcDoc={`<style>${comp.css_code} body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:transparent;color:white;}</style>${comp.html_code}`}
                  className="w-full h-full pointer-events-none scale-75"
                />
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-gray-300">
                  <Code size={14} className="mr-1" /> Preview Mode
                </div>
              </div>

              {/* --- INFO & ACTIONS --- */}
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {comp.category} Component
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      By:{" "}
                      <span className="text-primary-500">
                        @{comp.owner.email}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ID: {comp.id} • Created at:{" "}
                      {new Date(comp.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20">
                    IN_REVIEW
                  </div>
                </div>

                {/* CODE SNIPPET (Opsional, biar admin bisa intip kodenya dikit) */}
                <div className="mt-4 bg-dark-900 p-3 rounded text-xs font-mono text-gray-400 overflow-hidden h-16 relative">
                  {comp.html_code}
                  <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-dark-900 to-transparent"></div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleStatusUpdate(comp.id, "ACCEPTED")}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check size={18} /> Approve
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(comp.id, "REJECTED")}
                    className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <X size={18} /> Reject
                  </button>

                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="px-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg flex items-center justify-center transition"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
