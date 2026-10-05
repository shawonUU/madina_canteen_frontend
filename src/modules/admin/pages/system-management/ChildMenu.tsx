import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    ListTree,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface ModuleData {
    id: number;
    name: string;
}

interface MenuData {
    id: number;
    module_id: number;
    name: string;
}

interface ChildMenuData {
    id: number;
    menu_id: number;
    name: string;
    slug: string;
    route: string | null;
    permission: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    menu?: {
        id: number;
        name: string;
        module_id: number;
        module?: {
            id: number;
            name: string;
        };
    };
}

interface ChildMenuForm {
    module_id: string;
    menu_id: string;
    name: string;
    slug: string;
    route: string;
    permission: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

const initialForm: ChildMenuForm = {
    module_id: "",
    menu_id: "",
    name: "",
    slug: "",
    route: "",
    permission: "",
    icon: "",
    sort_order: 0,
    is_active: true,
};

export default function ChildMenu() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [childMenus, setChildMenus] = useState<ChildMenuData[]>([]);
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [menus, setMenus] = useState<MenuData[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<ChildMenuForm>(initialForm);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [childMenuResponse, moduleResponse] =
                await Promise.all([
                    api.get("/admin/child-menus"),
                    api.get("/admin/modules"),
                ]);

            if (childMenuResponse.data.success) {
                setChildMenus(childMenuResponse.data.data);
            }

            if (moduleResponse.data.success) {
                setModules(moduleResponse.data.data);
            }
        } catch (error) {
            console.error("Failed to load child menus:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchMenus = async (moduleId: string) => {
        if (!moduleId) {
            setMenus([]);
            return;
        }

        try {
            const response = await api.get(
                `/admin/menus?module_id=${moduleId}`
            );

            if (response.data.success) {
                setMenus(response.data.data);
            } else {
                setMenus([]);
            }
        } catch (error) {
            console.error("Failed to load menus:", error);
            setMenus([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ ...initialForm });
        setMenus([]);
        setModalOpen(true);
    };

    const openEditModal = async (childMenu: ChildMenuData) => {
        const moduleId = childMenu.menu?.module_id
            ? String(childMenu.menu.module_id)
            : "";

        const menuId = String(childMenu.menu_id);

        setEditingId(childMenu.id);

        setForm({
            module_id: moduleId,
            menu_id: menuId,
            name: childMenu.name,
            slug: childMenu.slug,
            route: childMenu.route || "",
            permission: childMenu.permission || "",
            icon: childMenu.icon || "",
            sort_order: childMenu.sort_order,
            is_active: childMenu.is_active,
        });

        setModalOpen(true);

        if (moduleId) {
            await fetchMenus(moduleId);
        } else {
            setMenus([]);
        }
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingId(null);
        setForm({ ...initialForm });
        setMenus([]);
    };

    const handleModuleChange = async (moduleId: string) => {
        setForm((prev) => ({
            ...prev,
            module_id: moduleId,
            menu_id: "",
        }));

        await fetchMenus(moduleId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.module_id) {
            alert("Please select a module.");
            return;
        }

        if (!form.menu_id) {
            alert("Please select a menu.");
            return;
        }

        if (!form.name.trim()) {
            alert("Please enter child menu name.");
            return;
        }

        if (!form.slug.trim()) {
            alert("Please enter child menu slug.");
            return;
        }

        setSaving(true);

        try {
            const { module_id, ...payload } = form;

            const data = {
                ...payload,
                menu_id: Number(payload.menu_id),
                name: payload.name.trim(),
                slug: payload.slug.trim(),
                route: payload.route.trim() || null,
                permission: payload.permission.trim() || null,
                icon: payload.icon.trim() || null,
                sort_order: Number(payload.sort_order),
            };

            if (editingId) {
                await api.put(
                    `/admin/child-menus/${editingId}`,
                    data
                );
            } else {
                await api.post(
                    "/admin/child-menus",
                    data
                );
            }

            setModalOpen(false);
            setEditingId(null);
            setForm({ ...initialForm });
            setMenus([]);

            await fetchData(true);
        } catch (error: any) {
            console.error(
                "Failed to save child menu:",
                error
            );

            alert(
                error?.response?.data?.message ||
                    "Failed to save child menu."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this child menu?"
            )
        ) {
            return;
        }

        try {
            await api.delete(`/admin/child-menus/${id}`);

            await fetchData(true);
        } catch (error: any) {
            console.error(
                "Failed to delete child menu:",
                error
            );

            alert(
                error?.response?.data?.message ||
                    "Failed to delete child menu."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <main className="flex-1 min-w-0">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
                        <div>
                            <div className="flex items-center gap-2">
                                <ListTree
                                    size={20}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-indigo-600">
                                    System Management
                                </span>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Child Menus
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Manage child menus under each system menu.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                            </button>

                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition"
                            >
                                <Plus size={18} />
                                Add Child Menu
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                Child Menu List
                            </h3>

                            <p className="text-sm text-gray-400 mt-1">
                                All available child menus
                            </p>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center">
                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading child menus...
                                </p>
                            </div>
                        ) : childMenus.length === 0 ? (
                            <div className="py-16 text-center">
                                <ListTree
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 font-semibold text-gray-600">
                                    No child menus found
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                #
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Module
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Menu
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Child Menu
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Route
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Permission
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {childMenus.map(
                                            (childMenu, index) => (
                                                <tr
                                                    key={
                                                        childMenu.id
                                                    }
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-indigo-600">
                                                            {childMenu
                                                                .menu
                                                                ?.module
                                                                ?.name ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {childMenu
                                                                .menu
                                                                ?.name ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {
                                                                    childMenu.name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    childMenu.slug
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">
                                                            {childMenu.route ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">
                                                            {childMenu.permission ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${
                                                                childMenu.is_active
                                                                    ? "bg-green-50 text-green-700 border-green-100"
                                                                    : "bg-red-50 text-red-700 border-red-100"
                                                            }`}
                                                        >
                                                            {childMenu.is_active
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        childMenu
                                                                    )
                                                                }
                                                                className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition"
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        childMenu.id
                                                                    )
                                                                }
                                                                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50  flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ListTree
                                        size={20}
                                        className="text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {editingId
                                            ? "Update Child Menu"
                                            : "Create Child Menu"}
                                    </h3>

                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {editingId
                                            ? "Update child menu information"
                                            : "Add a new child menu"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col min-h-0"
                        >
                            {/* Body */}
                            <div className="p-6 overflow-y-auto space-y-5">

                                {/* Module + Menu */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Module
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={form.module_id}
                                            onChange={(e) =>
                                                handleModuleChange(
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        >
                                            <option value="">
                                                Select Module
                                            </option>

                                            {modules.map(
                                                (module) => (
                                                    <option
                                                        key={
                                                            module.id
                                                        }
                                                        value={
                                                            module.id
                                                        }
                                                    >
                                                        {
                                                            module.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Menu
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={form.menu_id}
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        menu_id:
                                                            e.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            required
                                            disabled={
                                                !form.module_id
                                            }
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                Select Menu
                                            </option>

                                            {menus.map(
                                                (menu) => (
                                                    <option
                                                        key={
                                                            menu.id
                                                        }
                                                        value={
                                                            menu.id
                                                        }
                                                    >
                                                        {
                                                            menu.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Name + Slug */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Name
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        name: e
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            required
                                            placeholder="Child Menu Name"
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Slug
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        slug: e
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            required
                                            placeholder="child-menu"
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                {/* Route */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Route
                                    </label>

                                    <input
                                        type="text"
                                        value={form.route}
                                        onChange={(e) =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    route: e.target
                                                        .value,
                                                })
                                            )
                                        }
                                        placeholder="/admin/system-management/modules"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition hidden"
                                    />
                                </div>

                                {/* Permission + Icon */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Permission
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.permission
                                            }
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        permission:
                                                            e
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="module.view"
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Icon
                                        </label>

                                        <input
                                            type="text"
                                            value={form.icon}
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        icon: e
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            placeholder="Boxes"
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                {/* Sort Order + Active */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Sort Order
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                form.sort_order
                                            }
                                            onChange={(e) =>
                                                setForm(
                                                    (prev) => ({
                                                        ...prev,
                                                        sort_order:
                                                            Number(
                                                                e
                                                                    .target
                                                                    .value
                                                            ),
                                                    })
                                                )
                                            }
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <label className="w-full min-h-11 px-4 py-2 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    Active
                                                </p>

                                                <p className="text-xs text-gray-400">
                                                    Show this child
                                                    menu
                                                </p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={
                                                    form.is_active
                                                }
                                                onChange={(e) =>
                                                    setForm(
                                                        (prev) => ({
                                                            ...prev,
                                                            is_active:
                                                                e
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                                }
                                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="px-5 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingId
                                                ? "Update"
                                                : "Create"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}