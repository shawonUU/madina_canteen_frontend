import {
    Plus,
    Pencil,
    X,
    RefreshCw,
    Workflow,
    Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

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
}

interface RoleData {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
    email?: string;
}

interface DepartmentData {
    id: number;
    name: string;
}

interface WorkflowLevel {
    id?: number;
    level_no: number;
    name: string;
    approver_type: "Role" | "User" | "Department Role";
    role_id: number | null;
    user_id: number | null;
    department_id: number | null;
    min_approvers: number;
    is_required: boolean;
    can_reject: boolean;
    can_return: boolean;
    status?: string;
}

interface ApprovalWorkflow {
    id: number;
    module_id: number;
    menu_id: number | null;
    child_menu_id: number | null;
    name: string;
    description: string | null;
    status: "Active" | "Inactive";
    created_by?: number;
    levels: WorkflowLevel[];
    module?: ModuleData;
    menu?: MenuData;
    child_menu?: ChildMenuData;
}

interface WorkflowForm {
    module_id: number | null;
    menu_id: number | null;
    child_menu_id: number | null;
    name: string;
    description: string;
    status: "Active" | "Inactive";
    levels: WorkflowLevel[];
}

const createLevel = (levelNo: number): WorkflowLevel => ({
    level_no: levelNo,
    name: "",
    approver_type: "Role",
    role_id: null,
    user_id: null,
    department_id: null,
    min_approvers: 1,
    is_required: true,
    can_reject: true,
    can_return: true,
});

const initialForm: WorkflowForm = {
    module_id: null,
    menu_id: null,
    child_menu_id: null,
    name: "",
    description: "",
    status: "Active",
    levels: [createLevel(1)],
};

export default function ApprovalWorkflow() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(
        []
    );

    const [modules, setModules] = useState<ModuleData[]>([]);
    const [menus, setMenus] = useState<MenuData[]>([]);
    const [childMenus, setChildMenus] = useState<ChildMenuData[]>([]);

    const [roles, setRoles] = useState<RoleData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [departments, setDepartments] = useState<DepartmentData[]>(
        []
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<WorkflowForm>({
        ...initialForm,
        levels: [createLevel(1)],
    });

    const fetchWorkflows = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get("/approval-workflows");

            if (
                response.data.success ||
                response.data.status === "Success"
            ) {
                setWorkflows(response.data.data?.data || response.data.data || []);
            }
        } catch (error) {
            console.error(
                "Failed to load approval workflows:",
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchModules = async () => {
        try {
            const response = await api.get("/admin/modules");

            if (response.data.success) {
                setModules(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load modules:",
                error
            );
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get("/admin/roles");

            if (response.data.success) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load roles:",
                error
            );
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/admin/users");

            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load users:",
                error
            );
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/hrm/departments");

            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load departments:",
                error
            );
        }
    };

    const fetchMenus = async (moduleId: number) => {
        try {
            const response = await api.get(
                `/admin/menus?module_id=${moduleId}`
            );

            if (response.data.success) {
                setMenus(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load menus:",
                error
            );

            setMenus([]);
        }
    };

    const fetchChildMenus = async (menuId: number) => {
        try {
            const response = await api.get(
                `/admin/child-menus?menu_id=${menuId}`
            );

            if (response.data.success) {
                setChildMenus(response.data.data);
            }
        } catch (error) {
            console.error(
                "Failed to load child menus:",
                error
            );

            setChildMenus([]);
        }
    };

    useEffect(() => {
        fetchWorkflows();
        fetchModules();
        fetchRoles();
        fetchUsers();
        fetchDepartments();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);

        setForm({
            ...initialForm,
            levels: [createLevel(1)],
        });

        setMenus([]);
        setChildMenus([]);

        setModalOpen(true);
    };

    const openEditModal = async (
        workflow: ApprovalWorkflow
    ) => {
        setEditingId(workflow.id);

        const moduleId =
            workflow.module_id || workflow.module?.id || null;

        const menuId =
            workflow.menu_id || workflow.menu?.id || null;

        const childMenuId =
            workflow.child_menu_id ||
            workflow.child_menu?.id ||
            null;

        setForm({
            module_id: moduleId,
            menu_id: menuId,
            child_menu_id: childMenuId,
            name: workflow.name,
            description: workflow.description || "",
            status: workflow.status,
            levels:
                workflow.levels?.length > 0
                    ? workflow.levels.map((level, index) => ({
                          ...level,
                          level_no:
                              level.level_no || index + 1,
                          role_id:
                              level.role_id || null,
                          user_id:
                              level.user_id || null,
                          department_id:
                              level.department_id || null,
                          min_approvers:
                              level.min_approvers || 1,
                          is_required:
                              Boolean(level.is_required),
                          can_reject:
                              Boolean(level.can_reject),
                          can_return:
                              Boolean(level.can_return),
                      }))
                    : [createLevel(1)],
        });

        if (moduleId) {
            await fetchMenus(moduleId);
        }

        if (menuId) {
            await fetchChildMenus(menuId);
        }

        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingId(null);

        setForm({
            ...initialForm,
            levels: [createLevel(1)],
        });

        setMenus([]);
        setChildMenus([]);
    };

    const handleModuleChange = async (
        moduleId: number | null
    ) => {
        setForm((prev) => ({
            ...prev,
            module_id: moduleId,
            menu_id: null,
            child_menu_id: null,
        }));

        setMenus([]);
        setChildMenus([]);

        if (moduleId) {
            await fetchMenus(moduleId);
        }
    };

    const handleMenuChange = async (
        menuId: number | null
    ) => {
        setForm((prev) => ({
            ...prev,
            menu_id: menuId,
            child_menu_id: null,
        }));

        setChildMenus([]);

        if (menuId) {
            await fetchChildMenus(menuId);
        }
    };

    const updateLevel = (
        index: number,
        field: keyof WorkflowLevel,
        value: any
    ) => {
        setForm((prev) => ({
            ...prev,
            levels: prev.levels.map((level, levelIndex) =>
                levelIndex === index
                    ? {
                          ...level,
                          [field]: value,
                      }
                    : level
            ),
        }));
    };

    const addLevel = () => {
        setForm((prev) => ({
            ...prev,
            levels: [
                ...prev.levels,
                createLevel(prev.levels.length + 1),
            ],
        }));
    };

    const removeLevel = (index: number) => {
        if (form.levels.length === 1) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            levels: prev.levels
                .filter(
                    (_, levelIndex) =>
                        levelIndex !== index
                )
                .map((level, levelIndex) => ({
                    ...level,
                    level_no: levelIndex + 1,
                })),
        }));
    };

    const handleApproverTypeChange = (
        index: number,
        type: WorkflowLevel["approver_type"]
    ) => {
        setForm((prev) => ({
            ...prev,
            levels: prev.levels.map((level, levelIndex) => {
                if (levelIndex !== index) {
                    return level;
                }

                return {
                    ...level,
                    approver_type: type,
                    role_id: null,
                    user_id: null,
                    department_id: null,
                };
            }),
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!form.module_id) {
            alert("Please select module.");
            return;
        }

        if (!form.name.trim()) {
            alert("Please enter workflow name.");
            return;
        }

        if (form.levels.length === 0) {
            alert("Please add at least one approval level.");
            return;
        }

        for (const level of form.levels) {
            if (!level.name.trim()) {
                alert(
                    `Please enter level ${level.level_no} name.`
                );
                return;
            }

            if (
                level.approver_type === "Role" &&
                !level.role_id
            ) {
                alert(
                    `Please select role for level ${level.level_no}.`
                );
                return;
            }

            if (
                level.approver_type === "User" &&
                !level.user_id
            ) {
                alert(
                    `Please select user for level ${level.level_no}.`
                );
                return;
            }

            if (
                level.approver_type === "Department Role" &&
                !level.department_id
            ) {
                alert(
                    `Please select department for level ${level.level_no}.`
                );
                return;
            }
        }

        setSaving(true);

        try {
            const data = {
                module_id: form.module_id,
                menu_id: form.menu_id,
                child_menu_id: form.child_menu_id,
                name: form.name.trim(),
                description:
                    form.description.trim() || null,
                status: form.status,
                levels: form.levels.map((level, index) => ({
                    level_no: index + 1,
                    name: level.name.trim(),
                    approver_type:
                        level.approver_type,
                    role_id:
                        level.approver_type === "Role"
                            ? level.role_id
                            : null,
                    user_id:
                        level.approver_type === "User"
                            ? level.user_id
                            : null,
                    department_id:
                        level.approver_type ===
                        "Department Role"
                            ? level.department_id
                            : null,
                    min_approvers:
                        Number(level.min_approvers) || 1,
                    is_required:
                        level.is_required,
                    can_reject:
                        level.can_reject,
                    can_return:
                        level.can_return,
                })),
            };

            if (editingId) {
                await api.put(
                    `/approval-workflows/${editingId}`,
                    data
                );
            } else {
                await api.post(
                    "/approval-workflows",
                    data
                );
            }

            closeModal();

            await fetchWorkflows(true);
        } catch (error: any) {
            console.error(
                "Failed to save approval workflow:",
                error
            );

            alert(
                error?.response?.data?.message ||
                    "Failed to save approval workflow."
            );
        } finally {
            setSaving(false);
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
                                <Workflow
                                    size={20}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-indigo-600">
                                    Approval Management
                                </span>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Approval Workflows
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Configure approval workflows and approval levels.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    fetchWorkflows(true)
                                }
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
                                Add Workflow
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                Workflow List
                            </h3>

                            <p className="text-sm text-gray-400 mt-1">
                                All configured approval workflows
                            </p>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center">
                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading workflows...
                                </p>
                            </div>
                        ) : workflows.length === 0 ? (
                            <div className="py-16 text-center">
                                <Workflow
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 font-semibold text-gray-600">
                                    No approval workflows found
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
                                                Workflow
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Module
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Levels
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
                                        {workflows.map(
                                            (
                                                workflow,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        workflow.id
                                                    }
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {index +
                                                            1}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {
                                                                    workflow.name
                                                                }
                                                            </p>

                                                            {workflow.description && (
                                                                <p className="text-xs text-gray-400 mt-1 max-w-md truncate">
                                                                    {
                                                                        workflow.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">
                                                            {workflow
                                                                .module
                                                                ?.name ||
                                                                modules.find(
                                                                    (
                                                                        module
                                                                    ) =>
                                                                        module.id ===
                                                                        workflow.module_id
                                                                )
                                                                    ?.name ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                                                            {
                                                                workflow
                                                                    .levels
                                                                    ?.length
                                                            }{" "}
                                                            Level
                                                            {workflow
                                                                .levels
                                                                ?.length !==
                                                            1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${
                                                                workflow.status ===
                                                                "Active"
                                                                    ? "bg-green-50 text-green-700 border-green-100"
                                                                    : "bg-red-50 text-red-700 border-red-100"
                                                            }`}
                                                        >
                                                            {
                                                                workflow.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        workflow
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
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Workflow
                                        size={20}
                                        className="text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {editingId
                                            ? "Update Approval Workflow"
                                            : "Create Approval Workflow"}
                                    </h3>

                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Configure workflow levels and approvers
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
                            <div className="p-6 overflow-y-auto space-y-6">

                                {/* Basic Information */}
                                <div>
                                    <div className="mb-4">
                                        <h4 className="text-base font-bold text-gray-800">
                                            Workflow Information
                                        </h4>

                                        <p className="text-xs text-gray-400 mt-1">
                                            Define where this approval workflow will be used.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* Module */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Module
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                value={
                                                    form.module_id ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleModuleChange(
                                                        e.target
                                                            .value
                                                            ? Number(
                                                                  e
                                                                      .target
                                                                      .value
                                                              )
                                                            : null
                                                    )
                                                }
                                                required
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            >
                                                <option value="">
                                                    Select Module
                                                </option>

                                                {modules.map(
                                                    (
                                                        module
                                                    ) => (
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

                                        {/* Menu */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Menu
                                            </label>

                                            <select
                                                value={
                                                    form.menu_id ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleMenuChange(
                                                        e.target
                                                            .value
                                                            ? Number(
                                                                  e
                                                                      .target
                                                                      .value
                                                              )
                                                            : null
                                                    )
                                                }
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

                                        {/* Child Menu */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Child Menu
                                            </label>

                                            <select
                                                value={
                                                    form.child_menu_id ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            child_menu_id:
                                                                e
                                                                    .target
                                                                    .value
                                                                    ? Number(
                                                                          e
                                                                              .target
                                                                              .value
                                                                      )
                                                                    : null,
                                                        })
                                                    )
                                                }
                                                disabled={
                                                    !form.menu_id
                                                }
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400"
                                            >
                                                <option value="">
                                                    Select Child Menu
                                                </option>

                                                {childMenus.map(
                                                    (
                                                        childMenu
                                                    ) => (
                                                        <option
                                                            key={
                                                                childMenu.id
                                                            }
                                                            value={
                                                                childMenu.id
                                                            }
                                                        >
                                                            {
                                                                childMenu.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                                        {/* Name */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Workflow Name
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    form.name
                                                }
                                                onChange={(e) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            name: e
                                                                .target
                                                                .value,
                                                        })
                                                    )
                                                }
                                                required
                                                placeholder="Purchase Requisition Approval"
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Status
                                            </label>

                                            <select
                                                value={
                                                    form.status
                                                }
                                                onChange={(e) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            status: e
                                                                .target
                                                                .value as
                                                                | "Active"
                                                                | "Inactive",
                                                        })
                                                    )
                                                }
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            >
                                                <option value="Active">
                                                    Active
                                                </option>

                                                <option value="Inactive">
                                                    Inactive
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>

                                        <textarea
                                            value={
                                                form.description
                                            }
                                            onChange={(e) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        description:
                                                            e
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            rows={3}
                                            placeholder="Describe this approval workflow..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Approval Levels */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-800">
                                                Approval Levels
                                            </h4>

                                            <p className="text-xs text-gray-400 mt-1">
                                                Define who can approve at each level.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addLevel}
                                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition"
                                        >
                                            <Plus
                                                size={16}
                                            />
                                            Add Level
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {form.levels.map(
                                            (
                                                level,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50"
                                                >
                                                    <div className="flex items-center justify-between mb-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                                                                {
                                                                    level.level_no
                                                                }
                                                            </div>

                                                            <div>
                                                                <h5 className="text-sm font-bold text-gray-800">
                                                                    Level{" "}
                                                                    {
                                                                        level.level_no
                                                                    }
                                                                </h5>

                                                                <p className="text-xs text-gray-400">
                                                                    Approval level configuration
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {form
                                                            .levels
                                                            .length >
                                                            1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeLevel(
                                                                        index
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
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                        {/* Level Name */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                Level Name
                                                                <span className="text-red-500 ml-1">
                                                                    *
                                                                </span>
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    level.name
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    updateLevel(
                                                                        index,
                                                                        "name",
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Department Manager"
                                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                            />
                                                        </div>

                                                        {/* Approver Type */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                Approver Type
                                                            </label>

                                                            <select
                                                                value={
                                                                    level.approver_type
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    handleApproverTypeChange(
                                                                        index,
                                                                        e
                                                                            .target
                                                                            .value as WorkflowLevel["approver_type"]
                                                                    )
                                                                }
                                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                            >
                                                                <option value="Role">
                                                                    Role
                                                                </option>

                                                                <option value="User">
                                                                    User
                                                                </option>

                                                                <option value="Department Role">
                                                                    Department Role
                                                                </option>
                                                            </select>
                                                        </div>

                                                        {/* Min Approvers */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                Minimum Approvers
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    level.min_approvers
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    updateLevel(
                                                                        index,
                                                                        "min_approvers",
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Approver Selection */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                                                        {level.approver_type ===
                                                            "Role" && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    Role
                                                                    <span className="text-red-500 ml-1">
                                                                        *
                                                                    </span>
                                                                </label>

                                                                <select
                                                                    value={
                                                                        level.role_id ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateLevel(
                                                                            index,
                                                                            "role_id",
                                                                            e
                                                                                .target
                                                                                .value
                                                                                ? Number(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  )
                                                                                : null
                                                                        )
                                                                    }
                                                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                                >
                                                                    <option value="">
                                                                        Select Role
                                                                    </option>

                                                                    {roles.map(
                                                                        (
                                                                            role
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    role.id
                                                                                }
                                                                                value={
                                                                                    role.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    role.name
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {level.approver_type ===
                                                            "User" && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    User
                                                                    <span className="text-red-500 ml-1">
                                                                        *
                                                                    </span>
                                                                </label>

                                                                <select
                                                                    value={
                                                                        level.user_id ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateLevel(
                                                                            index,
                                                                            "user_id",
                                                                            e
                                                                                .target
                                                                                .value
                                                                                ? Number(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  )
                                                                                : null
                                                                        )
                                                                    }
                                                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                                >
                                                                    <option value="">
                                                                        Select User
                                                                    </option>

                                                                    {users.map(
                                                                        (
                                                                            user
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    user.id
                                                                                }
                                                                                value={
                                                                                    user.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    user.name
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {level.approver_type ===
                                                            "Department Role" && (
                                                            <>
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                        Department
                                                                        <span className="text-red-500 ml-1">
                                                                            *
                                                                        </span>
                                                                    </label>

                                                                    <select
                                                                        value={
                                                                            level.department_id ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateLevel(
                                                                                index,
                                                                                "department_id",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                                    ? Number(
                                                                                          e
                                                                                              .target
                                                                                              .value
                                                                                      )
                                                                                    : null
                                                                            )
                                                                        }
                                                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                                    >
                                                                        <option value="">
                                                                            Select Department
                                                                        </option>

                                                                        {departments.map(
                                                                            (
                                                                                department
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        department.id
                                                                                    }
                                                                                    value={
                                                                                        department.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        department.name
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                        Role
                                                                    </label>

                                                                    <select
                                                                        value={
                                                                            level.role_id ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateLevel(
                                                                                index,
                                                                                "role_id",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                                    ? Number(
                                                                                          e
                                                                                              .target
                                                                                              .value
                                                                                      )
                                                                                    : null
                                                                            )
                                                                        }
                                                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                                    >
                                                                        <option value="">
                                                                            Select Role
                                                                        </option>

                                                                        {roles.map(
                                                                            (
                                                                                role
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        role.id
                                                                                    }
                                                                                    value={
                                                                                        role.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        role.name
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Options */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

                                                        <label className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    Required
                                                                </p>

                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    This level is mandatory
                                                                </p>
                                                            </div>

                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    level.is_required
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    updateLevel(
                                                                        index,
                                                                        "is_required",
                                                                        e
                                                                            .target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </label>

                                                        <label className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    Can Reject
                                                                </p>

                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    Allow rejection
                                                                </p>
                                                            </div>

                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    level.can_reject
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    updateLevel(
                                                                        index,
                                                                        "can_reject",
                                                                        e
                                                                            .target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </label>

                                                        <label className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    Can Return
                                                                </p>

                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    Allow return
                                                                </p>
                                                            </div>

                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    level.can_return
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    updateLevel(
                                                                        index,
                                                                        "can_return",
                                                                        e
                                                                            .target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            )
                                        )}
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
