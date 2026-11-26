import { canAccess } from "../../../../services/permissions";
import DataLogButton from "../../../../components/DataLogButton";

import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    ShieldCheck,
    Filter,
    FilterX as FunnelX,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface GatePassPurposeData {
    id: number;
    code: string | null;
    name: string;
    is_active: boolean;
    approval_status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Cancelled"
        | "Completed";
    created_by: number | null;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
}

interface PurposeForm {
    name: string;
    is_active: boolean;
    approval_status: string;
}

interface PurposeFilters {
    created_at: string;
    code: string;
    name: string;
    approval_status: string;
    is_active: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

const initialForm: PurposeForm = {
    name: "",
    is_active: true,
    approval_status: "Pending",
};

const initialFilters: PurposeFilters = {
    created_at: "",
    code: "",
    name: "",
    approval_status: "",
    is_active: "",
};

const initialPagination: PaginationData = {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: null,
    to: null,
};

const approvalStatuses = [
    "Pending",
    "Approved",
    "Rejected",
    "Cancelled",
    "Completed",
];

export default function GatepassPurpose() {
    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [purposes, setPurposes] =
        useState<GatePassPurposeData[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [saving, setSaving] =
        useState(false);

    const [form, setForm] =
        useState<PurposeForm>({
            ...initialForm,
        });

    const [filters, setFilters] =
        useState<PurposeFilters>({
            ...initialFilters,
        });

    const [page, setPage] =
        useState(1);

    const [itemsPerPage, setItemsPerPage] =
        useState(15);

    const [pagination, setPagination] =
        useState<PaginationData>({
            ...initialPagination,
        });

    const [sortField, setSortField] =
        useState<string | null>(null);

    const [sortDirection, setSortDirection] =
        useState<"asc" | "desc" | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Fetch Gate Pass Purposes
    |--------------------------------------------------------------------------
    */

    const fetchPurposes = useCallback(
        async (isRefresh = false, requestedPage = page) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const response = await api.get(
                    "/reception/gate-pass-purposes",
                    {
                        params: {
                            page: requestedPage,
                            per_page: itemsPerPage,
                            search_code: filters.code,
                            search_name: filters.name,
                            created_at: filters.created_at,
                            approval_status: filters.approval_status,
                            is_active: filters.is_active,
                            sort_field: sortField,
                            sort_direction: sortDirection,
                        },
                    }
                );

                const result =
                    response.data.data ?? response.data;

                if (
                    result &&
                    !Array.isArray(result) &&
                    Array.isArray(result.data)
                ) {
                    setPurposes(result.data);

                    setPagination({
                        current_page:
                            result.current_page || requestedPage,

                        last_page:
                            result.last_page || 1,

                        per_page:
                            result.per_page || itemsPerPage,

                        total:
                            result.total || 0,

                        from:
                            result.from || null,

                        to:
                            result.to || null,
                    });
                } else if (Array.isArray(result)) {
                    setPurposes(result);

                    setPagination({
                        current_page: requestedPage,
                        last_page: 1,
                        per_page: itemsPerPage,
                        total: result.length,
                        from: result.length > 0 ? 1 : null,
                        to: result.length > 0
                            ? result.length
                            : null,
                    });
                } else {
                    setPurposes([]);
                    setPagination({
                        ...initialPagination,
                        per_page: itemsPerPage,
                    });
                }
            } catch (error) {
                console.error(
                    "Failed to load gate pass purposes:",
                    error
                );

                setPurposes([]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            page,
            itemsPerPage,
            filters,
            sortField,
            sortDirection,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Initial Load + Debounced Filter
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPurposes(false, page);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [
        filters,
        sortField,
        sortDirection,
        itemsPerPage,
        page,
        fetchPurposes,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Filter Change
    |--------------------------------------------------------------------------
    */

    const handleFilterChange = (
        field: keyof PurposeFilters,
        value: string
    ) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));

        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Clear Filters
    |--------------------------------------------------------------------------
    */

    const clearFilters = () => {
        setFilters({
            ...initialFilters,
        });

        setSortField(null);
        setSortDirection(null);

        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    const handleSort = (field: string) => {
        let direction: "asc" | "desc" | null = "asc";

        if (sortField === field) {
            if (sortDirection === "asc") {
                direction = "desc";
            } else if (sortDirection === "desc") {
                direction = null;
            }
        }

        setSortField(direction ? field : null);
        setSortDirection(direction);
        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const openCreateModal = () => {
        setEditingId(null);

        setForm({
            ...initialForm,
        });

        setModalOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    const openEditModal = (
        purpose: GatePassPurposeData
    ) => {
        setEditingId(purpose.id);

        setForm({
            name: purpose.name || "",
            is_active: Boolean(purpose.is_active),
            approval_status:
                purpose.approval_status || "Pending",
        });

        setModalOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Close Modal
    |--------------------------------------------------------------------------
    */

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingId(null);

        setForm({
            ...initialForm,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Please enter purpose name.");
            return;
        }

        setSaving(true);

        try {
            const data = {
                name: form.name.trim(),
                is_active: form.is_active,
                approval_status: form.approval_status,
            };

            if (editingId) {
                await api.put(
                    `/reception/gate-pass-purposes/${editingId}`,
                    data
                );
            } else {
                await api.post(
                    "/reception/gate-pass-purposes",
                    data
                );
            }

            setModalOpen(false);
            setEditingId(null);

            setForm({
                ...initialForm,
            });

            await fetchPurposes(true, page);
        } catch (error: any) {
            console.error(
                "Failed to save gate pass purpose:",
                error
            );

            const errors =
                error?.response?.data?.errors;

            const firstError = errors
                ? Object.values(errors).flat()[0]
                : null;

            alert(
                firstError ||
                error?.response?.data?.message ||
                "Failed to save gate pass purpose."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const handleDelete = async (id: number) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this gate pass purpose?"
            )
        ) {
            return;
        }

        try {
            await api.delete(
                `/reception/gate-pass-purposes/${id}`
            );

            const nextPage =
                purposes.length === 1 && page > 1
                    ? page - 1
                    : page;

            setPage(nextPage);

            await fetchPurposes(true, nextPage);
        } catch (error: any) {
            console.error(
                "Failed to delete gate pass purpose:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to delete gate pass purpose."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

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

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                        <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800">
                                Gate Pass Purpose
                            </h2>

                            <p className="text-gray-500 mt-1 text-sm">
                                Manage gate pass purposes and their approval status.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    fetchPurposes(true, page)
                                }
                                disabled={refreshing}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"
                                title="Refresh"
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

                            {canAccess("reception", "configuration", "gatepass-purpose", "create") && (<button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition"
                            >
                                <Plus size={18} />
                                Add Purpose
                            </button>)} 

                        </div>
                    </div>

                    {/* Table Card */}

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* Table Header */}

                        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Purpose List
                                </h3>

                                <p className="text-xs text-gray-400 mt-0.5">
                                    All gate pass purposes
                                </p>
                            </div>

                            <div className="flex items-center gap-2">

                                <span className="text-xs text-gray-400">
                                    Records:
                                </span>

                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(
                                            Number(e.target.value)
                                        );

                                        setPage(1);
                                    }}
                                    className="h-8 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-600 focus:outline-none focus:border-indigo-400"
                                >
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>

                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center">

                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading gate pass purposes...
                                </p>

                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[950px]">

                                        {/* Table Header */}

                                        <thead>

                                            <tr className="bg-gray-50 border-b border-gray-200">

                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-14">
                                                    #
                                                </th>

                                                <SortableHeader
                                                    title="Purpose Code"
                                                    field="code"
                                                    sortField={sortField}
                                                    sortDirection={sortDirection}
                                                    onSort={handleSort}
                                                />

                                                <SortableHeader
                                                    title="Purpose Name"
                                                    field="name"
                                                    sortField={sortField}
                                                    sortDirection={sortDirection}
                                                    onSort={handleSort}
                                                />

                                                <SortableHeader
                                                    title="Approval Status"
                                                    field="approval_status"
                                                    sortField={sortField}
                                                    sortDirection={sortDirection}
                                                    onSort={handleSort}
                                                />

                                                <SortableHeader
                                                    title="Active Status"
                                                    field="is_active"
                                                    sortField={sortField}
                                                    sortDirection={sortDirection}
                                                    onSort={handleSort}
                                                />

                                                <SortableHeader
                                                    title="Created Date"
                                                    field="created_at"
                                                    sortField={sortField}
                                                    sortDirection={sortDirection}
                                                    onSort={handleSort}
                                                />

                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">
                                                    Action
                                                </th>

                                            </tr>

                                            {/* Filter Row */}

                                            <tr className="bg-gray-50 border-b border-gray-200">

                                                <th className="px-3 py-1.5">
                                                    <div className="flex items-center justify-center">
                                                        <Filter
                                                            size={15}
                                                            className="text-gray-400"
                                                        />
                                                    </div>
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={filters.code}
                                                        onChange={(value) =>
                                                            handleFilterChange(
                                                                "code",
                                                                value
                                                            )
                                                        }
                                                        placeholder="Search code"
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={filters.name}
                                                        onChange={(value) =>
                                                            handleFilterChange(
                                                                "name",
                                                                value
                                                            )
                                                        }
                                                        placeholder="Search name"
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <select
                                                        value={filters.approval_status}
                                                        onChange={(e) =>
                                                            handleFilterChange(
                                                                "approval_status",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-600 focus:outline-none focus:border-indigo-400"
                                                    >
                                                        <option value="">
                                                            All Status
                                                        </option>

                                                        {approvalStatuses.map(
                                                            (status) => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {status}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <select
                                                        value={filters.is_active}
                                                        onChange={(e) =>
                                                            handleFilterChange(
                                                                "is_active",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-600 focus:outline-none focus:border-indigo-400"
                                                    >
                                                        <option value="">
                                                            All
                                                        </option>
                                                        <option value="1">
                                                            Active
                                                        </option>
                                                        <option value="0">
                                                            Inactive
                                                        </option>
                                                    </select>
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <input aria-label="Filter created date" value={filters.created_at} onChange={(event) => handleFilterChange("created_at", event.target.value)} placeholder="YYYY-MM-DD" className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-600" />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={clearFilters}
                                                        title="Clear Filters"
                                                        className="w-full h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <FunnelX size={18} />
                                                    </button>
                                                </th>

                                            </tr>

                                        </thead>

                                        {/* Table Body */}

                                        <tbody className="divide-y divide-gray-100">

                                            {purposes.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-16 text-center"
                                                    >
                                                        <ShieldCheck
                                                            size={32}
                                                            className="mx-auto text-gray-300"
                                                        />

                                                        <p className="mt-3 font-semibold text-gray-600">
                                                            No purposes found
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Try changing your filters.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                purposes.map(
                                                    (purpose, index) => (
                                                        <tr
                                                            key={purpose.id}
                                                            className="hover:bg-gray-50 transition"
                                                        >

                                                            <td className="px-3 py-3 text-xs text-gray-500">
                                                                {(pagination.current_page - 1) *
                                                                    pagination.per_page +
                                                                    index + 1}
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap">
                                                                    {purpose.code || "--"}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <span className="text-sm font-semibold text-gray-700">
                                                                    {purpose.name}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <StatusBadge
                                                                    status={purpose.approval_status}
                                                                />
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <ActiveBadge
                                                                    active={purpose.is_active}
                                                                />
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                                                    {formatDate(purpose.created_at)}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center justify-end gap-1.5">

                                                                    <DataLogButton resource="gate_pass_purposes" recordId={purpose.id} />
                                                                    {canAccess("reception", "configuration", "gatepass-purpose", "update") && (<button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openEditModal(purpose)
                                                                        }
                                                                        className="w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </button>)} 

                                                                    {canAccess("reception", "configuration", "gatepass-purpose", "delete") && (<button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDelete(purpose.id)
                                                                        }
                                                                        className="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>)} 

                                                                </div>
                                                            </td>

                                                        </tr>
                                                    )
                                                )
                                            )}

                                        </tbody>

                                    </table>
                                </div>

                                {/* Pagination */}

                                {pagination.total > 0 && (
                                    <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                        <div className="text-xs text-gray-500">
                                            Showing{" "}
                                            <span className="font-semibold text-gray-700">
                                                {pagination.from}
                                            </span>{" "}
                                            to{" "}
                                            <span className="font-semibold text-gray-700">
                                                {pagination.to}
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-semibold text-gray-700">
                                                {pagination.total}
                                            </span>{" "}
                                            records
                                        </div>

                                        <div className="flex items-center gap-1">

                                            <button
                                                type="button"
                                                disabled={page <= 1}
                                                onClick={() =>
                                                    setPage((prev) =>
                                                        Math.max(1, prev - 1)
                                                    )
                                                }
                                                className="h-8 px-3 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft size={14} />
                                                Previous
                                            </button>

                                            <div className="h-8 min-w-8 px-2 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                                                {pagination.current_page}
                                            </div>

                                            <span className="text-xs text-gray-400 px-1">
                                                of {pagination.last_page}
                                            </span>

                                            <button
                                                type="button"
                                                disabled={
                                                    page >= pagination.last_page
                                                }
                                                onClick={() =>
                                                    setPage((prev) =>
                                                        Math.min(
                                                            pagination.last_page,
                                                            prev + 1
                                                        )
                                                    )
                                                }
                                                className="h-8 px-3 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <ChevronRight size={14} />
                                            </button>

                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            </main>

            {/* Create / Edit Modal */}

            {modalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">

                    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

                        {/* Modal Header */}

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ShieldCheck
                                        size={20}
                                        className="text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {editingId
                                            ? "Update Gate Pass Purpose"
                                            : "Create Gate Pass Purpose"}
                                    </h3>

                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {editingId
                                            ? "Update purpose information"
                                            : "Add a new gate pass purpose"}
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

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col min-h-0"
                        >

                            {/* Modal Body */}

                            <div className="p-6 overflow-y-auto space-y-5">

                                {/* Purpose Name */}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Purpose Name
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        required
                                        maxLength={255}
                                        placeholder="Official Work"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>


                                {/* Active Status */}

                                <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between">

                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            Active Status
                                        </p>

                                        <p className="text-xs text-gray-400 mt-1">
                                            Enable or disable this purpose.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.is_active}
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                is_active: !prev.is_active,
                                            }))
                                        }
                                        className={`relative w-12 h-6 rounded-full transition ${
                                            form.is_active
                                                ? "bg-indigo-600"
                                                : "bg-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                                                form.is_active
                                                    ? "left-7"
                                                    : "left-1"
                                            }`}
                                        />
                                    </button>

                                </div>

                            </div>

                            {/* Modal Footer */}

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
                                        editingId
                                            ? "Update"
                                            : "Create"
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

/*
|--------------------------------------------------------------------------
| Table Filter Input
|--------------------------------------------------------------------------
*/

function TableFilterInput({
    value,
    onChange,
    placeholder = "",
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-8 px-2.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
        />
    );
}

/*
|--------------------------------------------------------------------------
| Sortable Header
|--------------------------------------------------------------------------
*/

function SortableHeader({
    title,
    field,
    sortField,
    sortDirection,
    onSort,
}: {
    title: string;
    field: string;
    sortField: string | null;
    sortDirection: "asc" | "desc" | null;
    onSort: (field: string) => void;
}) {
    const active = sortField === field;

    return (
        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">

            <button
                type="button"
                onClick={() => onSort(field)}
                className="inline-flex items-center gap-1 hover:text-indigo-600 transition"
            >
                {title}

                {!active && (
                    <span className="flex flex-col text-gray-300">
                        <ChevronUp size={11} />
                        <ChevronDown size={11} />
                    </span>
                )}

                {active && (
                    sortDirection === "asc"
                        ? <ChevronUp size={14} className="text-indigo-600" />
                        : <ChevronDown size={14} className="text-indigo-600" />
                )}
            </button>

        </th>
    );
}

/*
|--------------------------------------------------------------------------
| Approval Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const styles: Record<string, string> = {
        Pending: "bg-amber-50 text-amber-700 border-amber-200",
        Approved: "bg-green-50 text-green-700 border-green-200",
        Rejected: "bg-red-50 text-red-700 border-red-200",
        Cancelled: "bg-gray-100 text-gray-600 border-gray-200",
        Completed: "bg-blue-50 text-blue-700 border-blue-200",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                styles[status] ||
                "bg-gray-100 text-gray-600 border-gray-200"
            }`}
        >
            {status}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Active Status Badge
|--------------------------------------------------------------------------
*/

function ActiveBadge({
    active,
}: {
    active: boolean;
}) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                active
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Date Formatter
|--------------------------------------------------------------------------
*/

function formatDate(date: string | null | undefined) {
    if (!date) {
        return "--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "--";
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
