
import {
  Plus,
  Edit,
  Trash2,
  Users,
  X,
  Search,
  UserRound,
  KeyRound,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  created_at?: string;
}

export default function UserPage() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/users");

      setUsers(
        response.data.data?.users ??
        response.data.data ??
        []
      );
    } catch (error) {
      console.error("Failed to load users:", error);
      window.alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setStatus("Active");
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (item: User) => {
    setEditId(item.id);
    setName(item.name);
    setEmail(item.email);
    setPassword("");
    setStatus(item.status);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const saveUser = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      (!editId && !password.trim())
    ) {
      window.alert("Please fill in all required fields.");
      return;
    }

    const payload: {
      name: string;
      email: string;
      password?: string;
      status: "Active" | "Inactive";
    } = {
      name: name.trim(),
      email: email.trim(),
      status,
    };

    if (password.trim()) {
      payload.password = password;
    }

    try {
      setSaving(true);

      if (editId) {
        await api.put(`/admin/users/${editId}`, payload);
      } else {
        await api.post("/admin/users", payload);
      }

      setModalOpen(false);
      resetForm();

      await loadUsers();
    } catch (error: any) {
      console.error("Failed to save user:", error);

      const errors = error.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        window.alert(String(firstError));
      } else {
        window.alert(
          error.response?.data?.message ??
          "Failed to save user."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      await api.delete(`/admin/users/${id}`);

      await loadUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);

      window.alert(
        error.response?.data?.message ??
        "Failed to delete user."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((item) => {
    const searchText = search.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchText) ||
      item.email.toLowerCase().includes(searchText) ||
      item.status.toLowerCase().includes(searchText)
    );
  });

  const activeUsers = users.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveUsers = users.length - activeUsers;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SideNav
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />

      <main className="flex-1 min-w-0">
        <TopNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />

        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto h-[calc(100vh-64px)]">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span>Administration</span>
                <span>/</span>
                <span className="text-indigo-600 font-medium">
                  Users
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                User Management
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage system users and their account access.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition"
            >
              <Plus size={18} />
              Create User
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Users
                  </p>

                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {users.length}
                  </h3>
                </div>

                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users size={22} className="text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Active Users
                  </p>

                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {activeUsers}
                  </h3>
                </div>

                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <UserRound size={22} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Inactive Users
                  </p>

                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {inactiveUsers}
                  </h3>
                </div>

                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <UserRound size={22} className="text-gray-500" />
                </div>
              </div>
            </div>

          </div>

          {/* User List */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

            {/* List Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    User List
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    View and manage all registered users.
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email or status..."
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />

                <p className="text-sm text-gray-500 mt-4">
                  Loading users...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Users size={30} className="text-gray-300" />
                </div>

                <h3 className="text-base font-semibold text-gray-700 mt-4">
                  No users found
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  {search
                    ? "Try searching with a different keyword."
                    : "Create your first user to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">

                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        #
                      </th>

                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        User Information
                      </th>

                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>

                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-slate-50/70 transition"
                      >
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {item.name}
                              </p>

                              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                <Mail size={13} />
                                {item.email}
                              </div>
                            </div>

                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              item.status === "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "Active"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {item.status}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex justify-end items-center gap-2">

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Edit User"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteUser(item.id)}
                              disabled={deletingId === item.id}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                              title="Delete User"
                            >
                              {deletingId === item.id ? (
                                <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

            {/* Table Footer */}
            {!loading && filteredUsers.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {users.length}
                  </span>{" "}
                  users
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Create / Update Modal */}
      {modalOpen && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                closeModal();
                }
            }}
            >
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <UserRound size={21} className="text-indigo-600" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {editId ? "Update User" : "Create User"}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {editId
                      ? "Update the user's account information."
                      : "Add a new user to your system."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter user name"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password{" "}
                  {!editId && <span className="text-red-500">*</span>}

                  {editId && (
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  )}
                </label>

                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      editId
                        ? "Leave empty to keep current password"
                        : "Enter password (Minimum 8 characters)"
                    }
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                {editId && (
                  <p className="text-xs text-gray-400 mt-2">
                    Only enter a password if you want to change it.
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4">

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Account Status
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Enable or disable this user account.
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`text-xs font-semibold ${
                      status === "Active"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {status}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={status === "Active"}
                    onClick={() =>
                      setStatus(
                        status === "Active" ? "Inactive" : "Active"
                      )
                    }
                    className={`relative w-11 h-6 rounded-full transition ${
                      status === "Active"
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        status === "Active"
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-5 sm:px-6 sm:py-4 bg-gray-50 border-t border-gray-100">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveUser}
                disabled={
                  saving ||
                  !name.trim() ||
                  !email.trim() ||
                  (!editId && !password.trim())
                }
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    {editId ? "Update User" : "Create User"}
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
