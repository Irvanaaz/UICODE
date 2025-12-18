import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Trash2,
  Check,
  X,
  User,
  Users,
  FileCode,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const UserProfile = () => {
  const { user } = useAuth();

  // Jika Admin, kita pakai tampilan Dashboard. Jika User, tampilan profile biasa.
  if (user?.role === "ADMIN") {
    return <AdminDashboardPanel user={user} />;
  } else {
    return <RegularUserProfile user={user} />;
  }
};

// ==========================================
// 1. KOMPONEN TAMPILAN ADMIN (DASHBOARD)
// ==========================================
const AdminDashboardPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' | 'users'
  const [pendingComponents, setPendingComponents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedUserComponents, setSelectedUserComponents] = useState(null); // Untuk melihat karya user
  const [selectedUserInfo, setSelectedUserInfo] = useState(null); // Info user yg sedang dilihat

  // --- FETCH DATA ---
  const fetchPending = async () => {
    try {
      const { data } = await api.get("/admin/pending");
      setPendingComponents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") fetchPending();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  // --- ACTIONS REQUEST ---
  const handleReview = async (id, status) => {
    try {
      await api.patch(`/admin/components/${id}/status?status=${status}`);
      toast.success(`Component ${status}`);
      fetchPending();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // --- ACTIONS USER ---
  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "⚠️ DANGER: Menghapus user akan menghapus semua karya mereka juga. Lanjut?"
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted permanently.");
      fetchUsers();
      setSelectedUserComponents(null); // Tutup panel detail jika user dihapus
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleViewUserWork = async (targetUser) => {
    try {
      // Ambil karya user tersebut
      const { data } = await api.get(
        `/admin/users/${targetUser.id}/components`
      );
      setSelectedUserComponents(data);
      setSelectedUserInfo(targetUser);
    } catch (error) {
      toast.error("Gagal mengambil data karya user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 min-h-screen">
      {/* Header Dashboard */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back, admin {user.email.split("@")[0]}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-dark-800 p-1 rounded-lg border border-dark-700">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "requests"
                ? "bg-primary-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileCode size={16} /> Review Code ({pendingComponents.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-primary-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} /> User Management
          </button>
        </div>
      </div>

      {/* === TAB 1: REQUESTS REVIEW === */}
      {activeTab === "requests" && (
        <div className="grid gap-6">
          {pendingComponents.length === 0 ? (
            <div className="text-center py-20 bg-dark-800 rounded-xl border border-dashed border-dark-700 text-gray-500">
              All clean! No pending components to review.
            </div>
          ) : (
            pendingComponents.map((comp) => (
              <div
                key={comp.id}
                className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden flex flex-col md:flex-row"
              >
                {/* Live Preview Kecil */}
                <div className="w-full md:w-1/3 bg-black border-r border-dark-700 relative h-64 md:h-auto">
                  <iframe
                    title="Preview"
                    srcDoc={`<style>${comp.css_code} body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:transparent;color:white;zoom:0.7;}</style>${comp.html_code}`}
                    className="w-full h-full pointer-events-none"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-gray-300">
                    Live Preview
                  </div>
                </div>

                {/* Code & Actions */}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {comp.category}
                      </h3>
                      <p className="text-sm text-gray-400">
                        by{" "}
                        <span className="text-primary-400">
                          @{comp.owner.email}
                        </span>
                      </p>
                    </div>
                    <Link
                      to={`/preview/${comp.id}`}
                      target="_blank"
                      className="text-xs bg-dark-700 px-2 py-1 rounded hover:bg-dark-600 transition"
                    >
                      View Full Screen
                    </Link>
                  </div>

                  {/* Code Snippet Preview */}
                  <div className="flex-1 bg-dark-900 p-4 rounded-lg font-mono text-xs text-gray-300 overflow-hidden relative mb-4">
                    <div className="absolute top-0 right-0 p-2 bg-dark-900/80 text-gray-500">
                      HTML
                    </div>
                    {comp.html_code.substring(0, 300)}...
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview(comp.id, "ACCEPTED")}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2"
                    >
                      <Check size={18} /> Accept
                    </button>
                    <button
                      onClick={() => handleReview(comp.id, "REJECTED")}
                      className="flex-1 bg-red-600/20 hover:bg-red-600 hover:text-white text-red-500 border border-red-600/50 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-all"
                    >
                      <X size={18} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === TAB 2: USER MANAGEMENT === */}
      {activeTab === "users" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* List User */}
          <div
            className={`${
              selectedUserComponents ? "lg:w-1/3" : "w-full"
            } transition-all`}
          >
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-700 bg-dark-900/50 font-bold text-white">
                Registered Users ({usersList.length})
              </div>
              <div className="divide-y divide-dark-700 max-h-[600px] overflow-y-auto">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className={`p-4 hover:bg-dark-700/50 transition flex items-center justify-between ${
                      selectedUserInfo?.id === u.id ? "bg-dark-700" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium truncate max-w-[150px]">
                          {u.email}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase">
                          {u.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewUserWork(u)}
                        className="p-2 bg-primary-600/10 text-primary-500 hover:bg-primary-600 hover:text-white rounded-lg transition"
                        title="View Profile & Works"
                      >
                        <Search size={16} />
                      </button>
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Karya User (Muncul jika tombol search diklik) */}
          {selectedUserComponents && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 min-h-[600px]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-700">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Karya:{" "}
                      <span className="text-primary-500">
                        @{selectedUserInfo.email}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedUserComponents.length} Components uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUserComponents(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUserComponents.length === 0 ? (
                    <p className="text-gray-500 col-span-2 text-center py-10">
                      User ini belum upload apapun.
                    </p>
                  ) : (
                    selectedUserComponents.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-dark-900 border border-dark-700 rounded-lg p-3"
                      >
                        <div className="h-24 bg-black/50 rounded border border-dark-700 mb-3 relative overflow-hidden">
                          <iframe
                            title="mini"
                            srcDoc={`<style>${comp.css_code} body{zoom:0.5;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:transparent;color:white;}</style>${comp.html_code}`}
                            className="w-full h-full pointer-events-none"
                          />
                          <div
                            className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              comp.status === "ACCEPTED"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {comp.status}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white font-medium">
                            {comp.category}
                          </span>
                          <Link
                            to={`/preview/${comp.id}`}
                            target="_blank"
                            className="text-xs text-primary-500 hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. KOMPONEN TAMPILAN USER BIASA (PROFILE LAMA)
// ==========================================
const RegularUserProfile = ({ user }) => {
  const [myComponents, setMyComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyComponents = async () => {
      try {
        const { data } = await api.get("/users/me/components");
        setMyComponents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyComponents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this component?")) return;
    try {
      // Kita asumsikan user boleh delete, atau admin endpoint digunakan jika backend mengizinkan
      // Jika backend strict admin only, user biasa belum bisa delete kecuali endpoint diubah.
      // Di MVP ini kita pakai endpoint admin sebagai proxy atau endpoint khusus user (lihat update backend user delete sendiri di chat sebelumnya).
      await api.delete(`/admin/components/${id}`);
      toast.success("Component deleted.");
      setMyComponents((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "REJECTED":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 min-h-screen">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-dark-800 p-8 rounded-2xl border border-dark-700">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl">
          {user?.email[0].toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">
            @{user?.email.split("@")[0]}
          </h1>
          <p className="text-gray-400">{user?.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
            <span className="bg-dark-900 px-3 py-1 rounded text-xs border border-dark-600 text-gray-300">
              {user?.role} Account
            </span>
          </div>
        </div>
        <Link
          to="/create"
          className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          Create New
        </Link>
      </div>

      <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
        My Contributions
      </h2>
      {loading ? (
        <div>Loading...</div>
      ) : myComponents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl text-gray-500">
          No components yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myComponents.map((comp) => (
            <div
              key={comp.id}
              className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden"
            >
              <div className="h-40 bg-black/50 relative border-b border-dark-700">
                <iframe
                  title="mini"
                  srcDoc={`<style>${comp.css_code} body{zoom:0.6;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:transparent;color:white;}</style>${comp.html_code}`}
                  className="w-full h-full pointer-events-none"
                />
                <div
                  className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(
                    comp.status
                  )}`}
                >
                  {comp.status}
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-white">{comp.category}</h3>
                <div className="flex gap-2">
                  <Link
                    to={`/preview/${comp.id}`}
                    className="p-2 bg-dark-700 rounded hover:text-white text-gray-400"
                  >
                    <Search size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40"
                  >
                    <Trash2 size={14} />
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

export default UserProfile;
