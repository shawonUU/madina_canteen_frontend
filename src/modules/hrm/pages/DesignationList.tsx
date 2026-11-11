import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    Search,
    BriefcaseBusiness,
    Building2,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
    type MRT_ColumnFiltersState,
    type MRT_PaginationState,
    type MRT_SortingState,
} from "mantine-react-table";

import { ActionIcon, Tooltip } from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

interface DepartmentOption {
    id: number;
    code: string | null;
    name: string;
    status?: "Active" | "Inactive";
}

interface Designation {
    id: number;
    department_id: number;
    department?: DepartmentOption | null;
    code: string | null;
    name: string;
    description: string | null;
    status: "Active" | "Inactive";
    created_at?: string;
}

interface DesignationForm {
    department_id: string;
    code: string;
    name: string;
    description: string;
    status: "Active" | "Inactive";
}

interface ApiMeta {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
}

const initialForm: DesignationForm = {
    department_id: "",
    code: "",
    name: "",
    description: "",
    status: "Active",
};

const PAGE_SIZES = ["10", "25", "50", "100"];

const inputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ status }: { status: string }) {
    const active = status === "Active";

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-100 text-slate-600"
            }`}
        >
            {status}
        </span>
    );
}

function normalizeList<T>(responseData: any): {
    records: T[];
    meta: ApiMeta;
} {
    const payload = responseData?.data;

    if (Array.isArray(payload)) {
        return {
            records: payload,
            meta: responseData?.meta ?? {
                current_page: 1,
                last_page: 1,
                per_page: payload.length,
                total: payload.length,
            },
        };
    }

    if (Array.isArray(payload?.data)) {
        return {
            records: payload.data,
            meta: {
                current_page: payload.current_page ?? 1,
                last_page: payload.last_page ?? 1,
                per_page: payload.per_page ?? payload.data.length,
                total: payload.total ?? payload.data.length,
            },
        };
    }

    return {
        records: [],
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 25,
            total: 0,
        },
    };
}

export default function DesignationPage() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tableError, setTableError] = useState("");
    const [totalRecords, setTotalRecords] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [globalSearch, setGlobalSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [columnFilters, setColumnFilters] =
        useState<MRT_ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<MRT_SortingState>([
        { id: "created_at", desc: true },
    ]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [formError, setFormError] = useState("");
    const [form, setForm] = useState<DesignationForm>({ ...initialForm });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(globalSearch.trim());
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
        }, 350);

        return () => clearTimeout(timer);
    }, [globalSearch]);

    const filterValues = useMemo(
        () =>
            Object.fromEntries(
                columnFilters
                    .filter(
                        (filter) =>
                            filter.value !== undefined &&
                            filter.value !== null &&
                            String(filter.value).trim() !== "",
                    )
                    .map((filter) => [
                        String(filter.id),
                        String(filter.value).trim(),
                    ]),
            ),
        [columnFilters],
    );

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await api.get("/hrm/departments", {
                params: {
                    per_page: 100,
                    sort_by: "name",
                    sort_direction: "asc",
                },
            });

            const result = normalizeList<DepartmentOption>(response.data);
            setDepartments(
                result.records.filter(
                    (department) =>
                        department.status === "Active" ||
                        (form.department_id &&
                            String(department.id) === form.department_id),
                ),
            );
        } catch (error) {
            console.error("Failed to load departments:", error);
            setDepartments([]);
        }
    }, [form.department_id]);

    const fetchDesignations = useCallback(async () => {
        setLoading(true);
        setTableError("");

        try {
            const params: Record<string, string | number> = {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: debouncedSearch,
                sort_by: sorting[0]?.id ?? "created_at",
                sort_direction: sorting[0]?.desc ? "desc" : "asc",
            };

            Object.entries(filterValues).forEach(([key, value]) => {
                params[`filter[${key}]`] = value;
            });

            const response = await api.get("/hrm/designations", { params });

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Failed to load designations.",
                );
            }

            const result = normalizeList<Designation>(response.data);
            setDesignations(result.records);
            setTotalRecords(result.meta.total ?? result.records.length);
            setLastPage(result.meta.last_page ?? 1);
        } catch (error: any) {
            console.error("Failed to load designations:", error);
            setTableError(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load designations. Please try again.",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch,
        sorting,
        filterValues,
    ]);

    useEffect(() => {
        void fetchDesignations();
    }, [fetchDesignations, refreshKey]);

    useEffect(() => {
        void fetchDepartments();
    }, [fetchDepartments, refreshKey]);

    const refreshDesignations = () => {
        setRefreshing(true);
        setRefreshKey((previous) => previous + 1);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ ...initialForm });
        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (designation: Designation) => {
        setEditingId(designation.id);
        setForm({
            department_id: String(
                designation.department_id ?? designation.department?.id ?? "",
            ),
            code: designation.code ?? "",
            name: designation.name ?? "",
            description: designation.description ?? "",
            status: designation.status ?? "Active",
        });
        setFormError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setModalOpen(false);
        setEditingId(null);
        setForm({ ...initialForm });
        setFormError("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        if (!form.department_id) {
            setFormError("Please select a department.");
            return;
        }

        if (!form.name.trim()) {
            setFormError("Please enter designation name.");
            return;
        }

        setSaving(true);

        const payload = {
            department_id: Number(form.department_id),
            code: form.code.trim() || null,
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: form.status,
        };

        try {
            if (editingId !== null) {
                await api.put(`/hrm/designations/${editingId}`, payload);
            } else {
                await api.post("/hrm/designations", payload);
            }

            setModalOpen(false);
            setEditingId(null);
            setForm({ ...initialForm });
            setPagination((previous) => ({
                ...previous,
                pageIndex: editingId !== null ? previous.pageIndex : 0,
            }));
            setRefreshKey((previous) => previous + 1);
        } catch (error: any) {
            console.error("Failed to save designation:", error);
            const validationErrors = error?.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(
                      (message) => typeof message === "string",
                  )
                : null;

            setFormError(
                (firstValidationError as string) ||
                    error?.response?.data?.message ||
                    "Failed to save designation.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (designation: Designation) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${designation.name}"?`,
            )
        ) {
            return;
        }

        setDeletingId(designation.id);
        setTableError("");

        try {
            await api.delete(`/hrm/designations/${designation.id}`);

            if (designations.length === 1 && pagination.pageIndex > 0) {
                setPagination((previous) => ({
                    ...previous,
                    pageIndex: previous.pageIndex - 1,
                }));
            } else {
                setRefreshKey((previous) => previous + 1);
            }
        } catch (error: any) {
            console.error("Failed to delete designation:", error);
            setTableError(
                error?.response?.data?.message ||
                    "Failed to delete designation.",
            );
        } finally {
            setDeletingId(null);
        }
    };

    const clearFilters = () => {
        setGlobalSearch("");
        setDebouncedSearch("");
        setColumnFilters([]);
        setSorting([{ id: "created_at", desc: true }]);
        setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    };

    const hasFilters =
        globalSearch.trim() !== "" || columnFilters.length > 0;

    const columns = useMemo<MRT_ColumnDef<Designation>[]>(
        () => [
            {
                id: "serial",
                header: "#",
                size: 65,
                minSize: 65,
                maxSize: 65,
                enableColumnFilter: false,
                enableSorting: false,
                Header: ({ table }) => (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>#</span>
                        <ActionIcon
                            size="sm"
                            variant={
                                table.getState().showColumnFilters
                                    ? "filled"
                                    : "subtle"
                            }
                            onClick={(event) => {
                                event.stopPropagation();
                                table.setShowColumnFilters(
                                    !table.getState().showColumnFilters,
                                );
                            }}
                        >
                            <IconFilter size={14} />
                        </ActionIcon>
                    </div>
                ),
                Cell: ({ row }) =>
                    pagination.pageIndex * pagination.pageSize +
                    row.index +
                    1,
            },
            {
                accessorKey: "code",
                id: "code",
                header: "Designation Code",
                minSize: 150,
                Cell: ({ row }) => (
                    <span className="font-semibold text-slate-800">
                        {row.original.code || "--"}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                id: "name",
                header: "Designation Name",
                minSize: 200,
                Cell: ({ row }) => (
                    <div className="flex min-w-[160px] items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">
                            <BriefcaseBusiness size={17} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">
                                {row.original.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                ID: {row.original.id}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                id: "department_id",
                accessorFn: (row) => row.department?.name ?? "",
                header: "Department",
                minSize: 180,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: departments.map((department) => ({
                        label: department.name,
                        value: String(department.id),
                    })),
                    clearable: true,
                    placeholder: "All departments",
                },
                Cell: ({ row }) => (
                    <div className="flex min-w-[150px] items-center gap-2">
                        <Building2 size={15} className="shrink-0 text-slate-500" />
                        <span className="font-medium text-slate-700">
                            {row.original.department?.name || "--"}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "description",
                id: "description",
                header: "Description",
                minSize: 220,
                enableSorting: false,
                Cell: ({ row }) => (
                    <span className="block min-w-[160px] max-w-[320px] whitespace-normal text-slate-600">
                        {row.original.description || "--"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                id: "status",
                header: "Status",
                minSize: 120,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Active", value: "Active" },
                        { label: "Inactive", value: "Inactive" },
                    ],
                    clearable: true,
                    placeholder: "All statuses",
                },
                Cell: ({ row }) => (
                    <StatusBadge status={row.original.status} />
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 110,
                minSize: 110,
                enableSorting: false,
                enableColumnFilter: false,
                Cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => openEditModal(row.original)}
                            title="Edit designation"
                            className="flex h-8 w-8 items-center justify-center rounded border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDelete(row.original)}
                            disabled={deletingId === row.original.id}
                            title="Delete designation"
                            className="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                            {deletingId === row.original.id ? (
                                <RefreshCw size={15} className="animate-spin" />
                            ) : (
                                <Trash2 size={15} />
                            )}
                        </button>
                    </div>
                ),
            },
        ],
        [pagination.pageIndex, pagination.pageSize, deletingId, departments],
    );

    const table = useMantineReactTable({
        columns,
        data: designations,
        manualFiltering: true,
        manualSorting: true,
        manualPagination: true,
        rowCount: totalRecords,
        pageCount: lastPage,
        enableColumnFilters: true,
        enableGlobalFilter: false,
        enableColumnFilterModes: false,
        enableColumnActions: false,
        enableHiding: false,
        enableDensityToggle: false,
        enableFullScreenToggle: false,
        columnFilterDisplayMode: "subheader",
        paginationDisplayMode: "default",
        positionPagination: "bottom",
        onColumnFiltersChange: (updater) => {
            setColumnFilters((previous) =>
                typeof updater === "function" ? updater(previous) : updater,
            );
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
        },
        onSortingChange: (updater) => {
            setSorting((previous) =>
                typeof updater === "function" ? updater(previous) : updater,
            );
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
        },
        onPaginationChange: setPagination,
        state: {
            columnFilters,
            sorting,
            pagination,
            columnOrder: [
                "serial",
                "code",
                "name",
                "department_id",
                "description",
                "status",
                "actions",
            ],
            isLoading: loading,
            showProgressBars: refreshing,
        },
        mantineTableContainerProps: {
            style: { minWidth: "100%", overflowX: "auto" },
        },
        mantinePaperProps: {
            shadow: "none",
            radius: 0,
            style: { border: 0 },
        },
        mantineTableProps: {
            striped: true,
            highlightOnHover: true,
            withColumnBorders: true,
            style: { borderColor: "#cbd5e1" },
        },
        mantineTableHeadCellProps: {
            style: {
                backgroundColor: "#f1f5f9",
                color: "#334155",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                padding: "10px",
            },
        },
        mantineFilterTextInputProps: {
            size: "xs",
            variant: "default",
            placeholder: "Search...",
        },
        mantineFilterSelectProps: {
            size: "xs",
            variant: "default",
        },
        mantinePaginationProps: {
            rowsPerPageOptions: PAGE_SIZES,
            showRowsPerPage: true,
        },
        localization: {
            noRecordsToDisplay: "No designations found",
            rowsPerPage: "Rows per page",
        },
    });

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <main className="min-w-0 flex-1">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <div className="h-[calc(100vh-64px)] overflow-y-auto p-3 sm:p-4 lg:p-6">
                    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <BriefcaseBusiness size={16} />
                                <span>HRM</span>
                                <span>/</span>
                                <span className="font-semibold text-slate-800">
                                    Designations
                                </span>
                            </div>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Designation Management
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Manage designations and assign them to departments.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={refreshDesignations}
                                disabled={refreshing || loading}
                                className={secondaryButtonClass}
                            >
                                <RefreshCw
                                    size={16}
                                    className={refreshing ? "animate-spin" : ""}
                                />
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <Plus size={17} />
                                Add Designation
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-300 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Designation List
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {totalRecords.toLocaleString()} total records
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative sm:w-72">
                                    <Search
                                        size={16}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    />
                                    <input
                                        type="text"
                                        value={globalSearch}
                                        onChange={(event) =>
                                            setGlobalSearch(event.target.value)
                                        }
                                        placeholder="Search designations..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                    {globalSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setGlobalSearch("")}
                                            aria-label="Clear search"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    disabled={!hasFilters}
                                    className={secondaryButtonClass}
                                >
                                    <X size={15} />
                                    Clear filters
                                </button>
                            </div>
                        </div>

                        {tableError && (
                            <div className="flex flex-col gap-2 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                                <span>{tableError}</span>
                                <button
                                    type="button"
                                    onClick={refreshDesignations}
                                    className="font-semibold underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        <MantineReactTable table={table} />
                    </div>
                </div>
            </main>

            {modalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
                    <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingId ? "Update Designation" : "Create Designation"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {editingId
                                        ? "Update designation information"
                                        : "Add a designation to a department"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close modal"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
                            <div className="space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-5">
                                {formError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {formError}
                                    </div>
                                )}

                                <section className="rounded-lg border border-slate-300 bg-white p-4">
                                    <h4 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
                                        Designation Information
                                    </h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                                Department
                                                <span className="ml-1 text-red-600">*</span>
                                            </label>
                                            <select
                                                value={form.department_id}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        department_id: event.target.value,
                                                    }))
                                                }
                                                required
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select department
                                                </option>
                                                {departments.map((department) => (
                                                    <option
                                                        key={department.id}
                                                        value={department.id}
                                                    >
                                                        {department.code
                                                            ? `${department.name} (${department.code})`
                                                            : department.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {departments.length === 0 && (
                                                <p className="mt-1.5 text-xs text-amber-700">
                                                    No active departments found. Create or activate a department first.
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                                    Designation Name
                                                    <span className="ml-1 text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(event) =>
                                                        setForm((previous) => ({
                                                            ...previous,
                                                            name: event.target.value,
                                                        }))
                                                    }
                                                    required
                                                    maxLength={150}
                                                    placeholder="Enter designation name"
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                                Description
                                            </label>
                                            <textarea
                                                value={form.description}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        description: event.target.value,
                                                    }))
                                                }
                                                rows={3}
                                                placeholder="Enter designation description..."
                                                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>

                                        <div className="max-w-xs">
                                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                                Status
                                            </label>
                                            <select
                                                value={form.status}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        status: event.target.value as DesignationForm["status"],
                                                    }))
                                                }
                                                className={inputClass}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className={secondaryButtonClass}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || departments.length === 0}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving && <RefreshCw size={15} className="animate-spin" />}
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                          ? "Update Designation"
                                          : "Create Designation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
