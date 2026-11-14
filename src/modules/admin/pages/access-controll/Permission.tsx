
import {
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  X,
  Search,
  KeyRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface Module {
  id: number;
  name: string;
}

interface Menu {
  id: number;
  module_id: number;
  name: string;
}

interface ChildMenu {
  id: number;
  menu_id: number;
  name: string;
}

interface Permission {
  id: number;
  name: string;
  key: string;
  module_id: number;
  menu_id: number | null;
  child_menu_id: number | null;
  description: string | null;
  is_active: boolean;
  module_name?: string;
  menu_name?: string;
  child_menu_name?: string;
}

export default function PermissionPage() {
  const [openSidebar, setOpenSidebar] = useState(false);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [childMenus, setChildMenus] = useState<ChildMenu[]>([]);

  const [name, setName] = useState("");
  const [permissionKey, setPermissionKey] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [childMenuId, setChildMenuId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  // Load all permissions and dropdown data
  const loadPermission = async () => {
    try {
      setLoading(true);

      const [permissionRes, moduleRes, menuRes, childMenuRes] =
        await Promise.all([
          api.get("/admin/permissions"),
          api.get("/admin/modules"),
          api.get("/admin/menus"),
          api.get("/admin/child-menus"),
        ]);

      setPermissions(
        permissionRes.data.data?.permissions ??
        permissionRes.data.data ??
        []
      );

      setModules(
        moduleRes.data.data ?? []
      );

      setMenus(
        menuRes.data.data ?? []
      );

      setChildMenus(
        childMenuRes.data.data ?? []
      );
    } catch (error) {
      console.error("Failed to load permission data:", error);
      window.alert("Failed to load permission data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermission();
  }, []);

  // Generate permission key from name
  const generateKey = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setPermissionKey("");
    setModuleId("");
    setMenuId("");
    setChildMenuId("");
    setDescription("");
    setIsActive(true);
    setEditId(null);
    setKeyManuallyEdited(false);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item: Permission) => {
    setEditId(item.id);
    setName(item.name);
    setPermissionKey(item.key);
    setModuleId(String(item.module_id));
    setMenuId(item.menu_id ? String(item.menu_id) : "");
    setChildMenuId(
      item.child_menu_id ? String(item.child_menu_id) : ""
    );
    setDescription(item.description ?? "");
    setIsActive(Boolean(item.is_active));
    setKeyManuallyEdited(true);

    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  // Handle name change
  const handleNameChange = (value: string) => {
    setName(value);

    if (!keyManuallyEdited) {
      setPermissionKey(generateKey(value));
    }
  };

  // Handle module change
  const handleModuleChange = (value: string) => {
    setModuleId(value);
    setMenuId("");
    setChildMenuId("");
  };

  // Handle menu change
  const handleMenuChange = (value: string) => {
    setMenuId(value);
    setChildMenuId("");
  };

  // Create / Update permission
  const savePermission = async () => {
    if (!name.trim() || !permissionKey.trim() || !moduleId) {
      window.alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      key: permissionKey.trim(),
      module_id: Number(moduleId),
      menu_id: menuId ? Number(menuId) : null,
      child_menu_id: childMenuId ? Number(childMenuId) : null,
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      setSaving(true);

      if (editId) {
        await api.put(`/admin/permissions/${editId}`, payload);
      } else {
        await api.post("/admin/permissions", payload);
      }

      setModalOpen(false);
      resetForm();

      await loadPermission();
    } catch (error: any) {
      console.error("Failed to save permission:", error);

      const errors = error.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        window.alert(String(firstError));
      } else {
        window.alert(
          error.response?.data?.message ??
          "Failed to save permission."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete permission
  const deletePermission = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this permission?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      await api.delete(`/admin/permissions/${id}`);

      await loadPermission();
    } catch (error: any) {
      console.error("Failed to delete permission:", error);

      window.alert(
        error.response?.data?.message ??
        "Failed to delete permission."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search filter
  const filteredPermissions = permissions.filter((item) => {
    const searchText = search.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchText) ||
      item.key.toLowerCase().includes(searchText) ||
      (item.module_name ?? "").toLowerCase().includes(searchText) ||
      (item.menu_name ?? "").toLowerCase().includes(searchText) ||
      (item.child_menu_name ?? "").toLowerCase().includes(searchText)
    );
  });

  // Dependent dropdown data
  const filteredMenus = menus.filter(
    (menu) => String(menu.module_id) === moduleId
  );

  const filteredChildMenus = childMenus.filter(
    (child) => String(child.menu_id) === menuId
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />

      <main className="flex-1">
        <TopNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />

        <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Permission Management
              </h2>

              <p className="text-gray-500 mt-1">
                Create and manage system permissions
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              <Plus size={19} />
              Create Permission
            </button>
          </div>

          {/* Permission List */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Permission List
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Total {permissions.length} permissions
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
                  placeholder="Search permission..."
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Loading permissions...
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck
                  size={38}
                  className="mx-auto text-gray-300"
                />

                <p className="text-gray-500 mt-3">
                  No permissions found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="py-4 px-3 font-semibold">#</th>
                      <th className="py-4 px-3 font-semibold">
                        Permission
                      </th>
                      <th className="py-4 px-3 font-semibold">
                        Location
                      </th>
                      <th className="py-4 px-3 font-semibold">
                        Status
                      </th>
                      <th className="py-4 px-3 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPermissions.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-3 text-gray-500">
                          {index + 1}
                        </td>

                        <td className="py-4 px-3">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>

                            <code className="text-xs text-indigo-600 mt-1 block">
                              {item.key}
                            </code>
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <div className="text-sm text-gray-600">
                            <p>{item.module_name ?? "—"}</p>

                            {item.menu_name && (
                              <p className="text-xs text-gray-400 mt-1">
                                {item.menu_name}
                                {item.child_menu_name
                                  ? ` / ${item.child_menu_name}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="py-4 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="bg-blue-100 p-2 rounded-lg text-blue-600 hover:bg-blue-200 transition"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deletePermission(item.id)}
                              disabled={deletingId === item.id}
                              className="bg-red-100 p-2 rounded-lg text-red-600 hover:bg-red-200 disabled:opacity-50 transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create / Update Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <ShieldCheck
                    size={22}
                    className="text-indigo-600"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {editId
                      ? "Update Permission"
                      : "Create Permission"}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Manage permission information
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={21} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Permission Name *
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Approve Gate Pass"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Permission Key *
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={permissionKey}
                      onChange={(e) => {
                        setPermissionKey(e.target.value);
                        setKeyManuallyEdited(true);
                      }}
                      placeholder="gate_pass.approve"
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Module */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Module *
                </label>

                <select
                  value={moduleId}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Module</option>

                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu and Child Menu */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Menu
                  </label>

                  <select
                    value={menuId}
                    onChange={(e) => handleMenuChange(e.target.value)}
                    disabled={!moduleId}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Menu (Optional)</option>

                    {filteredMenus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Child Menu
                  </label>

                  <select
                    value={childMenuId}
                    onChange={(e) => setChildMenuId(e.target.value)}
                    disabled={!menuId}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      Select Child Menu (Optional)
                    </option>

                    {filteredChildMenus.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what this permission allows..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-gray-700">
                    Permission Status
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Enable or disable this permission
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    isActive ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                      isActive ? "left-7" : "left-1"
                    }`}
                  />
                </button>

                <span
                  className={`text-sm font-semibold ${
                    isActive ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePermission}
                disabled={
                  saving ||
                  !name.trim() ||
                  !permissionKey.trim() ||
                  !moduleId
                }
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving
                  ? "Saving..."
                  : editId
                    ? "Update Permission"
                    : "Create Permission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
