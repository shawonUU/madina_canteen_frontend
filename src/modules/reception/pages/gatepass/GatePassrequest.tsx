import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    ShieldCheck,
    UserRound,
    Package,
    UsersRound,
    FileDown,
    Search,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
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

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface GatePassItem {
    id?: number;
    code: string;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit: string;
    asset_no: string;
    serial_no: string;
    remarks: string;
}

interface GatePassData {
    id: number;
    code: string;
    gate_pass_type: "Person" | "Person With Material";
    requester?: { id: number; name: string } | null;
    department_name: string;
    designation_name: string;
    purpose: string;
    expected_exit_at: string;
    expected_return_at: string | null;
    remarks: string | null;
    status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Cancelled"
        | "Completed";
    pending_approval?: {
        level: string;
        approver: string | null;
    } | null;
    items: GatePassItem[];
}

interface GatePassForm {
    gate_pass_type: "Person" | "Person With Material";
    department_name: string;
    designation_name: string;
    purpose: string;
    expected_exit_at: string;
    expected_return_at: string;
    remarks: string;
    items: GatePassItem[];
}

interface GatePassApiResponse {
    success: boolean;
    data: GatePassData[];
    meta?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    message?: string;
}

const initialForm: GatePassForm = {
    gate_pass_type: "Person",
    department_name: "",
    designation_name: "",
    purpose: "",
    expected_exit_at: "",
    expected_return_at: "",
    remarks: "",
    items: [],
};

const emptyItem: GatePassItem = {
    code: "",
    product_id: null,
    product_name: "",
    quantity: 1,
    unit: "Pcs",
    asset_no: "",
    serial_no: "",
    remarks: "",
};

const PAGE_SIZES = ["10", "25", "50", "100"];

const inputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function GatePass() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [gatePasses, setGatePasses] = useState<GatePassData[]>([]);
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

    const [exitFrom, setExitFrom] = useState("");
    const [exitTo, setExitTo] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<GatePassForm>({
        ...initialForm,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(globalSearch.trim());
            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));
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
                            String(filter.value).trim() !== "",
                    )
                    .map((filter) => [
                        String(filter.id),
                        String(filter.value).trim(),
                    ]),
            ),
        [columnFilters],
    );

    const fetchGatePasses = useCallback(async () => {
        setLoading(true);
        setTableError("");

        try {
            const params: Record<string, string | number> = {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: debouncedSearch,
                sort_by: sorting[0]?.id ?? "created_at",
                sort_dir: sorting[0]?.desc ? "desc" : "asc",
            };

            Object.entries(filterValues).forEach(([key, value]) => {
                params[`filter[${key}]`] = value;
            });

            if (exitFrom) {
                params["filter[exit_from]"] = exitFrom;
            }

            if (exitTo) {
                params["filter[exit_to]"] = exitTo;
            }

            const response = await api.get<GatePassApiResponse>(
                "/reception/gate-passes",
                { params },
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message || "Failed to load gate passes.",
                );
            }

            const records = response.data.data ?? [];
            const meta = response.data.meta;

            setGatePasses(records);
            setTotalRecords(meta?.total ?? records.length);
            setLastPage(meta?.last_page ?? 1);
        } catch (error) {
            console.error("Failed to load gate passes:", error);
            setTableError("Failed to load gate passes. Please try again.");
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
        exitFrom,
        exitTo,
    ]);

    useEffect(() => {
        void fetchGatePasses();
    }, [fetchGatePasses, refreshKey]);

    const refreshGatePasses = () => {
        setRefreshing(true);
        setRefreshKey((previous) => previous + 1);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ ...initialForm });
        setModalOpen(true);
    };

    const openEditModal = (gatePass: GatePassData) => {
        setEditingId(gatePass.id);

        setForm({
            gate_pass_type: gatePass.gate_pass_type,
            department_name: gatePass.department_name || "",
            designation_name: gatePass.designation_name || "",
            purpose: gatePass.purpose || "",
            expected_exit_at: formatDateTimeForInput(
                gatePass.expected_exit_at,
            ),
            expected_return_at: gatePass.expected_return_at
                ? formatDateTimeForInput(gatePass.expected_return_at)
                : "",
            remarks: gatePass.remarks || "",
            items:
                gatePass.items?.map((item) => ({
                    ...item,
                    product_id: item.product_id ?? null,
                    product_name: item.product_name || "",
                    quantity: Number(item.quantity),
                    unit: item.unit || "Pcs",
                    asset_no: item.asset_no || "",
                    serial_no: item.serial_no || "",
                    remarks: item.remarks || "",
                })) || [],
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingId(null);
        setForm({ ...initialForm });
    };

    const handleTypeChange = (
        type: "Person" | "Person With Material",
    ) => {
        setForm((previous) => ({
            ...previous,
            gate_pass_type: type,
            items:
                type === "Person"
                    ? []
                    : previous.items.length
                      ? previous.items
                      : [{ ...emptyItem }],
        }));
    };

    const addItem = () => {
        setForm((previous) => ({
            ...previous,
            items: [...previous.items, { ...emptyItem }],
        }));
    };

    const removeItem = (index: number) => {
        setForm((previous) => ({
            ...previous,
            items: previous.items.filter(
                (_, itemIndex) => itemIndex !== index,
            ),
        }));
    };

    const updateItem = (
        index: number,
        field: keyof GatePassItem,
        value: string | number | null,
    ) => {
        setForm((previous) => ({
            ...previous,
            items: previous.items.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item,
            ),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.department_name.trim()) {
            alert("Please enter department name.");
            return;
        }

        if (!form.designation_name.trim()) {
            alert("Please enter designation name.");
            return;
        }

        if (!form.purpose.trim()) {
            alert("Please enter purpose.");
            return;
        }

        if (!form.expected_exit_at) {
            alert("Please select expected exit time.");
            return;
        }

        if (form.gate_pass_type === "Person With Material") {
            if (form.items.length === 0) {
                alert("Please add at least one material item.");
                return;
            }

            if (
                form.items.some(
                    (item) =>
                        !item.product_name.trim() ||
                        Number(item.quantity) <= 0,
                )
            ) {
                alert(
                    "Please enter valid product name and quantity for all items.",
                );
                return;
            }
        }

        setSaving(true);

        try {
            const data = {
                gate_pass_type: form.gate_pass_type,
                department_name: form.department_name.trim(),
                designation_name: form.designation_name.trim(),
                purpose: form.purpose.trim(),
                expected_exit_at: form.expected_exit_at,
                expected_return_at: form.expected_return_at || null,
                remarks: form.remarks.trim() || null,
                items:
                    form.gate_pass_type === "Person"
                        ? []
                        : form.items.map((item) => ({
                              product_id: item.product_id,
                              product_name: item.product_name.trim(),
                              quantity: Number(item.quantity),
                              unit: item.unit.trim() || null,
                              asset_no: item.asset_no.trim() || null,
                              serial_no: item.serial_no.trim() || null,
                              remarks: item.remarks.trim() || null,
                          })),
            };

            if (editingId) {
                await api.put(
                    `/reception/gate-passes/${editingId}`,
                    data,
                );
            } else {
                await api.post("/reception/gate-passes", data);
            }

            setModalOpen(false);
            setEditingId(null);
            setForm({ ...initialForm });
            setRefreshKey((previous) => previous + 1);
        } catch (error: any) {
            console.error("Failed to save gate pass:", error);
            alert(
                error?.response?.data?.message ||
                    "Failed to save gate pass.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this gate pass?",
            )
        ) {
            return;
        }

        try {
            await api.delete(`/reception/gate-passes/${id}`);

            if (gatePasses.length === 1 && pagination.pageIndex > 0) {
                setPagination((previous) => ({
                    ...previous,
                    pageIndex: previous.pageIndex - 1,
                }));
            } else {
                setRefreshKey((previous) => previous + 1);
            }
        } catch (error: any) {
            console.error("Failed to delete gate pass:", error);
            alert(
                error?.response?.data?.message ||
                    "Failed to delete gate pass.",
            );
        }
    };

    const handleDownloadPdf = async (id: number) => {
        try {
            const response = await api.get(
                `/reception/gate-passes/${id}/pdf`,
                { responseType: "blob" },
            );

            const blob = new Blob([response.data], {
                type: "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `gate-pass-${id}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download gate pass PDF:", error);
            alert("Failed to download gate pass PDF.");
        }
    };

    const clearFilters = () => {
        setGlobalSearch("");
        setDebouncedSearch("");
        setColumnFilters([]);
        setExitFrom("");
        setExitTo("");

        setPagination((previous) => ({
            ...previous,
            pageIndex: 0,
        }));
    };

    const hasFilters =
        globalSearch.trim() !== "" ||
        columnFilters.length > 0 ||
        exitFrom !== "" ||
        exitTo !== "";

    const columns = useMemo<MRT_ColumnDef<GatePassData>[]>(
        () => [
            {
                id: "serial",
                header: "#",
                size: 65,
                maxSize: 65,
                minSize: 65,
                Header: ({ table }) => (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>#</span>

                        <Tooltip label="">
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
                                        !table.getState().showColumnFilters
                                    );
                                }}
                            >
                                <IconFilter size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                ),
                Cell: ({ row }) =>
                    (pagination.pageIndex * pagination.pageSize) + row.index + 1,
                enableColumnFilter: false,
                enableSorting: false,
            },
            {
                accessorKey: "code",
                id: "code",
                header: "Pass No",
                minSize: 130,
            },
            {
                accessorKey: "gate_pass_type",
                id: "gate_pass_type",
                header: "Type",
                minSize: 160,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Person", value: "Person" },
                        {
                            label: "Person With Material",
                            value: "Person With Material",
                        },
                    ],
                    clearable: true,
                    placeholder: "All types",
                },
                Cell: ({ row }) => (
                    <TypeBadge type={row.original.gate_pass_type} />
                ),
            },
            {
                id: "requester",
                accessorFn: (row) => row.requester?.name ?? "",
                header: "Requested By",
                minSize: 180,
                Cell: ({ row }) => (
                    <div className="min-w-[140px]">
                        <p className="font-semibold text-slate-800">
                            {row.original.requester?.name || "--"}
                        </p>

                        {row.original.pending_approval && (
                            <div className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                <p className="font-semibold">
                                    Level - {row.original.pending_approval.level}
                                </p>
                                <p>
                                    {row.original.pending_approval.approver || "--"}
                                </p>
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: "department",
                accessorFn: (row) => row.department_name ?? "",
                header: "Department",
                minSize: 150,
                Cell: ({ row }) => (
                    <div className="min-w-[120px]">
                        <p className="font-medium text-slate-800">
                            {row.original.department_name || "--"}
                        </p>
                    </div>
                ),
            },
            {
                id: "designation",
                accessorFn: (row) => row.designation_name ?? "",
                header: "Designation",
                minSize: 150,
                Cell: ({ row }) => (
                    <div className="min-w-[120px]">
                        <p className="text-xs text-slate-500">
                            {row.original.designation_name || "--"}
                        </p>
                    </div>
                ),
            },
            {
                accessorKey: "purpose",
                id: "purpose",
                header: "Purpose",
                minSize: 180,
                Cell: ({ row }) => (
                    <span className="block min-w-[140px] max-w-[230px] whitespace-normal">
                        {row.original.purpose || "--"}
                    </span>
                ),
            },
            {
                accessorKey: "expected_exit_at",
                id: "expected_exit_at",
                header: "Exit Time",
                minSize: 180,
                enableColumnFilter: true,
                filterVariant: "date-range",
                Cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDateTime(row.original.expected_exit_at)}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                id: "status",
                header: "Status",
                minSize: 130,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        "Pending",
                        "Approved",
                        "Rejected",
                        "Cancelled",
                        "Completed",
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
                size: 130,
                enableSorting: false,
                enableColumnFilter: false,
                Cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() =>
                                void handleDownloadPdf(row.original.id)
                            }
                            title="Download PDF"
                            className="flex h-8 w-8 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                            <FileDown size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={() => openEditModal(row.original)}
                            title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                            <Pencil size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleDelete(row.original.id)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ),
            },
        ],
        [pagination.pageIndex, pagination.pageSize],
    );

    const columnOrder = [
        "serial",
        "code",
        "gate_pass_type",
        "requester",
        "department",
        "designation",
        "purpose",
        "expected_exit_at",
        "status",
        "actions",
    ];

    const table = useMantineReactTable({
        columns,
        data: gatePasses,

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
                typeof updater === "function"
                    ? updater(previous)
                    : updater,
            );

            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));
        },

        onSortingChange: (updater) => {
            setSorting((previous) =>
                typeof updater === "function"
                    ? updater(previous)
                    : updater,
            );

            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));
        },

        onPaginationChange: setPagination,

        state: {
            columnFilters,
            sorting,
            pagination,
            columnOrder,
            isLoading: loading,
            showProgressBars: refreshing,
        },

        mantineTableContainerProps: {
            style: {
                minWidth: "100%",
                overflowX: "auto",
            },
        },

        mantinePaperProps: {
            shadow: "none",
            radius: 0,
            style: {
                border: 0,
            },
        },

        mantineTableProps: {
            striped: true,
            highlightOnHover: true,
            withColumnBorders: true,
            // withTableBorder: true,
            style: {
                borderColor: "#cbd5e1",
            },
        },

        mantineTableHeadCellProps: {
            style: {
                backgroundColor: "#f1f5f9",
                color: "#334155",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                padding: "0px",
                paddingLeft: "10px",
                paddingTop: "10px",
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
            noRecordsToDisplay: "No gate passes found",
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
                                <ShieldCheck size={16} />
                                <span>Reception</span>
                                <span>/</span>
                                <span className="font-semibold text-slate-800">
                                    Gate Pass
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Gate Pass
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage and track gate pass requests.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={refreshGatePasses}
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
                                Add Gate Pass
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-300 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Gate Pass List
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
                                        placeholder="Search all gate passes..."
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
                                    onClick={refreshGatePasses}
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
                    <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingId
                                        ? "Update Gate Pass"
                                        : "Create Gate Pass"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {editingId
                                        ? "Update gate pass information"
                                        : "Create a new gate pass request"}
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

                        <form
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-col"
                        >
                            <div className="space-y-5 overflow-y-auto bg-slate-50 p-4 sm:p-5">
                                <section className="rounded-lg border border-slate-300 bg-white p-4">
                                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                                        Gate Pass Type
                                        <span className="ml-1 text-red-600">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <TypeOption
                                            active={form.gate_pass_type === "Person"}
                                            icon={<UserRound size={19} />}
                                            title="Person"
                                            description="Person only"
                                            onClick={() =>
                                                handleTypeChange("Person")
                                            }
                                        />

                                        <TypeOption
                                            active={
                                                form.gate_pass_type ===
                                                "Person With Material"
                                            }
                                            icon={<UsersRound size={19} />}
                                            title="Person With Material"
                                            description="Person carrying materials or assets"
                                            onClick={() =>
                                                handleTypeChange(
                                                    "Person With Material",
                                                )
                                            }
                                        />
                                    </div>
                                </section>

                                <section className="rounded-lg border border-slate-300 bg-white p-4">
                                    <h4 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
                                        Request Information
                                    </h4>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField label="Department" required>
                                            <input
                                                type="text"
                                                value={form.department_name}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        department_name:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder="Enter department"
                                                className={inputClass}
                                            />
                                        </FormField>

                                        <FormField label="Designation" required>
                                            <input
                                                type="text"
                                                value={form.designation_name}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        designation_name:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder="Enter designation"
                                                className={inputClass}
                                            />
                                        </FormField>

                                        <FormField label="Purpose" required>
                                            <input
                                                type="text"
                                                value={form.purpose}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        purpose: event.target.value,
                                                    }))
                                                }
                                                placeholder="Enter purpose"
                                                className={inputClass}
                                            />
                                        </FormField>

                                        <FormField label="Expected Exit" required>
                                            <input
                                                type="datetime-local"
                                                value={form.expected_exit_at}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        expected_exit_at:
                                                            event.target.value,
                                                    }))
                                                }
                                                className={inputClass}
                                            />
                                        </FormField>

                                        <FormField label="Expected Return">
                                            <input
                                                type="datetime-local"
                                                value={form.expected_return_at}
                                                onChange={(event) =>
                                                    setForm((previous) => ({
                                                        ...previous,
                                                        expected_return_at:
                                                            event.target.value,
                                                    }))
                                                }
                                                className={inputClass}
                                            />
                                        </FormField>
                                    </div>

                                    <div className="mt-4">
                                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={form.remarks}
                                            onChange={(event) =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    remarks: event.target.value,
                                                }))
                                            }
                                            rows={3}
                                            placeholder="Enter additional remarks..."
                                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                </section>

                                {form.gate_pass_type ===
                                    "Person With Material" && (
                                    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
                                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    Material Items
                                                </h4>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Add products or assets being taken outside
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
                                            >
                                                <Plus size={15} />
                                                Add Item
                                            </button>
                                        </div>

                                        <div className="space-y-4 p-4">
                                            {form.items.length === 0 ? (
                                                <div className="border border-dashed border-slate-300 p-6 text-center">
                                                    <Package
                                                        size={25}
                                                        className="mx-auto text-slate-400"
                                                    />
                                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                                        No material items added
                                                    </p>
                                                </div>
                                            ) : (
                                                form.items.map((item, index) => (
                                                    <div
                                                        key={item.id ?? index}
                                                        className="rounded-lg border border-slate-300 p-4"
                                                    >
                                                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
                                                            <h5 className="text-sm font-bold text-slate-800">
                                                                Item {index + 1}
                                                            </h5>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeItem(index)
                                                                }
                                                                aria-label={`Remove item ${index + 1}`}
                                                                className="flex h-8 w-8 items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <div className="md:col-span-2">
                                                                <FormField
                                                                    label="Product / Material"
                                                                    required
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        value={item.product_name}
                                                                        onChange={(event) =>
                                                                            updateItem(
                                                                                index,
                                                                                "product_name",
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        placeholder="Enter product or material"
                                                                        className={inputClass}
                                                                    />
                                                                </FormField>
                                                            </div>

                                                            <FormField label="Quantity">
                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    value={item.quantity}
                                                                    onChange={(event) =>
                                                                        updateItem(
                                                                            index,
                                                                            "quantity",
                                                                            Number(event.target.value),
                                                                        )
                                                                    }
                                                                    className={inputClass}
                                                                />
                                                            </FormField>

                                                            <FormField label="Unit">
                                                                <input
                                                                    type="text"
                                                                    value={item.unit}
                                                                    onChange={(event) =>
                                                                        updateItem(
                                                                            index,
                                                                            "unit",
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Pcs"
                                                                    className={inputClass}
                                                                />
                                                            </FormField>

                                                            <FormField label="Asset No">
                                                                <input
                                                                    type="text"
                                                                    value={item.asset_no}
                                                                    onChange={(event) =>
                                                                        updateItem(
                                                                            index,
                                                                            "asset_no",
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Asset number"
                                                                    className={inputClass}
                                                                />
                                                            </FormField>

                                                            <FormField label="Serial No">
                                                                <input
                                                                    type="text"
                                                                    value={item.serial_no}
                                                                    onChange={(event) =>
                                                                        updateItem(
                                                                            index,
                                                                            "serial_no",
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Serial number"
                                                                    className={inputClass}
                                                                />
                                                            </FormField>

                                                            <div className="md:col-span-2 lg:col-span-3">
                                                                <FormField label="Item Remarks">
                                                                    <input
                                                                        type="text"
                                                                        value={item.remarks}
                                                                        onChange={(event) =>
                                                                            updateItem(
                                                                                index,
                                                                                "remarks",
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        placeholder="Optional remarks"
                                                                        className={inputClass}
                                                                    />
                                                                </FormField>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-300 bg-white px-5 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={15}
                                                className="animate-spin"
                                            />
                                            Saving...
                                        </>
                                    ) : editingId ? (
                                        "Update Gate Pass"
                                    ) : (
                                        "Create Gate Pass"
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

function FormField({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
                {label}
                {required && <span className="ml-1 text-red-600">*</span>}
            </label>
            {children}
        </div>
    );
}

function TypeOption({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg border p-4 text-left transition ${
                active
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        active
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                    }`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        {title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
}

function TypeBadge({
    type,
}: {
    type: "Person" | "Person With Material";
}) {
    return type === "Person" ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
            <UserRound size={13} />
            Person
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-800">
            <UsersRound size={13} />
            Person + Material
        </span>
    );
}

function StatusBadge({
    status,
}: {
    status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Cancelled"
        | "Completed";
}) {
    const classNames: Record<string, string> = {
        Pending: "border-amber-200 bg-amber-50 text-amber-800",
        Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
        Rejected: "border-red-200 bg-red-50 text-red-800",
        Cancelled: "border-slate-300 bg-slate-100 text-slate-700",
        Completed: "border-blue-200 bg-blue-50 text-blue-800",
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs font-semibold ${
                classNames[status] ?? classNames.Pending
            }`}
        >
            {status}
        </span>
    );
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateTimeForInput(value: string | null | undefined) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}