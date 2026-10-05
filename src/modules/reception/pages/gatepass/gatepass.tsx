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
    Filter,
    FunnelX,
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

interface GatePassItem {
    id?: number;
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
    pass_no: string;
    gate_pass_type:
        | "Person"
        | "Person With Material";

    requester?: {
        id: number;
        name: string;
    };

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
    gate_pass_type:
        | "Person"
        | "Person With Material";

    department_name: string;
    designation_name: string;
    purpose: string;
    expected_exit_at: string;
    expected_return_at: string;
    remarks: string;
    items: GatePassItem[];
}

interface GatePassFilters {
    pass_no: string;
    gate_pass_type: string;
    requester: string;
    department_name: string;
    purpose: string;
    expected_exit_at: string;
    status: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
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
    product_id: null,
    product_name: "",
    quantity: 1,
    unit: "Pcs",
    asset_no: "",
    serial_no: "",
    remarks: "",
};

const initialFilters: GatePassFilters = {
    pass_no: "",
    gate_pass_type: "",
    requester: "",
    department_name: "",
    purpose: "",
    expected_exit_at: "",
    status: "",
};

export default function GatePass() {
    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [gatePasses, setGatePasses] =
        useState<GatePassData[]>([]);

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
        useState<GatePassForm>({
            ...initialForm,
        });

    /*
    |--------------------------------------------------------------------------
    | Data Table States
    |--------------------------------------------------------------------------
    */

    const [filters, setFilters] =
        useState<GatePassFilters>({
            ...initialFilters,
        });

    const [page, setPage] =
        useState(1);

    const [itemsPerPage, setItemsPerPage] =
        useState(100);

    const [pagination, setPagination] =
        useState<PaginationData>({
            current_page: 1,
            last_page: 1,
            per_page: 100,
            total: 0,
            from: null,
            to: null,
        });

    const [sortField, setSortField] =
        useState<string | null>(null);

    const [sortDirection, setSortDirection] =
        useState<"asc" | "desc" | null>(
            null
        );

    /*
    |--------------------------------------------------------------------------
    | Build Filter Options
    |--------------------------------------------------------------------------
    */

    const buildFilterOptions = () => {
        return [
            {
                relation_name: null,
                field_name: "pass_no",
                search_param:
                    filters.pass_no,
                action: null,
                order_by:
                    sortField === "pass_no"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Pass No",
                filter_type: "input",
            },

            {
                relation_name: null,
                field_name:
                    "gate_pass_type",
                search_param:
                    filters.gate_pass_type,
                action: null,
                order_by:
                    sortField ===
                    "gate_pass_type"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Type",
                filter_type: "input",
            },

            {
                relation_name: "requester",
                field_name: "name",
                search_param:
                    filters.requester,
                action: null,
                order_by:
                    sortField === "requester"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Requested By",
                filter_type: "input",
            },

            {
                relation_name: null,
                field_name:
                    "department_name",
                search_param:
                    filters.department_name,
                action: null,
                order_by:
                    sortField ===
                    "department_name"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Department",
                filter_type: "input",
            },

            {
                relation_name: null,
                field_name: "purpose",
                search_param:
                    filters.purpose,
                action: null,
                order_by:
                    sortField === "purpose"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Purpose",
                filter_type: "input",
            },

            {
                relation_name: null,
                field_name:
                    "expected_exit_at",
                search_param:
                    filters.expected_exit_at,
                action: null,
                order_by:
                    sortField ===
                    "expected_exit_at"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Exit Time",
                filter_type: "input",
            },

            {
                relation_name: null,
                field_name: "status",
                search_param:
                    filters.status,
                action: null,
                order_by:
                    sortField === "status"
                        ? sortDirection
                        : null,
                date_from: null,
                label: "Status",
                filter_type: "input",
            },
        ];
    };

    /*
    |--------------------------------------------------------------------------
    | Fetch Gate Passes
    |--------------------------------------------------------------------------
    */

    const fetchGatePasses = useCallback(
        async (
            isRefresh = false,
            requestedPage = page
        ) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const data = {
                    business_unit: "MML",
                    items_per_page:
                        itemsPerPage,
                    page: requestedPage,
                    isFilter: true,
                    filter_options:
                        buildFilterOptions(),
                };

                const response =
                    await api.get(
                        "/reception/gate-passes",
                        {
                            params: {
                                page: requestedPage,
                                items_per_page:
                                    itemsPerPage,
                                data: JSON.stringify(
                                    data
                                ),
                            },
                        }
                    );

                if (
                    response.data.success
                ) {
                    const result =
                        response.data.data;

                    /*
                    |--------------------------------------------------------------------------
                    | Laravel Pagination Response
                    |--------------------------------------------------------------------------
                    |
                    | {
                    |     data: [],
                    |     current_page: 1,
                    |     last_page: 5,
                    |     per_page: 100,
                    |     total: 450
                    | }
                    |
                    */

                    if (
                        result &&
                        !Array.isArray(
                            result
                        ) &&
                        Array.isArray(
                            result.data
                        )
                    ) {
                        setGatePasses(
                            result.data
                        );

                        setPagination({
                            current_page:
                                result.current_page ||
                                requestedPage,

                            last_page:
                                result.last_page ||
                                1,

                            per_page:
                                result.per_page ||
                                itemsPerPage,

                            total:
                                result.total ||
                                0,

                            from:
                                result.from ||
                                null,

                            to:
                                result.to ||
                                null,
                        });
                    } else if (
                        Array.isArray(
                            result
                        )
                    ) {
                        setGatePasses(
                            result
                        );

                        setPagination({
                            current_page:
                                requestedPage,

                            last_page:
                                1,

                            per_page:
                                itemsPerPage,

                            total:
                                result.length,

                            from:
                                result.length >
                                0
                                    ? 1
                                    : null,

                            to:
                                result.length >
                                0
                                    ? result.length
                                    : null,
                        });
                    }
                }
            } catch (error) {
                console.error(
                    "Failed to load gate passes:",
                    error
                );
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
            fetchGatePasses(
                false,
                page
            );
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
        fetchGatePasses,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Filter Change
    |--------------------------------------------------------------------------
    */

    const handleFilterChange = (
        field: keyof GatePassFilters,
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

    const handleSort = (
        field: string
    ) => {
        let direction:
            | "asc"
            | "desc"
            | null = "asc";

        if (sortField === field) {
            if (
                sortDirection ===
                "asc"
            ) {
                direction = "desc";
            } else if (
                sortDirection ===
                "desc"
            ) {
                direction = null;
            }
        }

        setSortField(
            direction ? field : null
        );

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
            items: [],
        });

        setModalOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    const openEditModal = (
        gatePass: GatePassData
    ) => {
        setEditingId(
            gatePass.id
        );

        setForm({
            gate_pass_type:
                gatePass.gate_pass_type,

            department_name:
                gatePass.department_name ||
                "",

            designation_name:
                gatePass.designation_name ||
                "",

            purpose:
                gatePass.purpose ||
                "",

            expected_exit_at:
                formatDateTimeForInput(
                    gatePass.expected_exit_at
                ),

            expected_return_at:
                gatePass.expected_return_at
                    ? formatDateTimeForInput(
                          gatePass.expected_return_at
                      )
                    : "",

            remarks:
                gatePass.remarks || "",

            items:
                gatePass.items?.map(
                    (item) => ({
                        id: item.id,

                        product_id:
                            item.product_id,

                        product_name:
                            item.product_name ||
                            "",

                        quantity:
                            Number(
                                item.quantity
                            ),

                        unit:
                            item.unit ||
                            "Pcs",

                        asset_no:
                            item.asset_no ||
                            "",

                        serial_no:
                            item.serial_no ||
                            "",

                        remarks:
                            item.remarks ||
                            "",
                    })
                ) || [],
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
    | Gate Pass Type
    |--------------------------------------------------------------------------
    */

    const handleTypeChange = (
        type:
            | "Person"
            | "Person With Material"
    ) => {
        setForm((prev) => ({
            ...prev,

            gate_pass_type: type,

            items:
                type === "Person"
                    ? []
                    : prev.items.length > 0
                    ? prev.items
                    : [
                          {
                              ...emptyItem,
                          },
                      ],
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Add Item
    |--------------------------------------------------------------------------
    */

    const addItem = () => {
        setForm((prev) => ({
            ...prev,

            items: [
                ...prev.items,
                {
                    ...emptyItem,
                },
            ],
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Remove Item
    |--------------------------------------------------------------------------
    */

    const removeItem = (
        index: number
    ) => {
        setForm((prev) => ({
            ...prev,

            items: prev.items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            ),
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Update Item
    |--------------------------------------------------------------------------
    */

    const updateItem = (
        index: number,
        field: keyof GatePassItem,
        value:
            | string
            | number
            | null
    ) => {
        setForm((prev) => ({
            ...prev,

            items: prev.items.map(
                (
                    item,
                    itemIndex
                ) =>
                    itemIndex ===
                    index
                        ? {
                              ...item,
                              [field]:
                                  value,
                          }
                        : item
            ),
        }));
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

        if (
            !form.department_name.trim()
        ) {
            alert(
                "Please enter department name."
            );

            return;
        }

        if (
            !form.designation_name.trim()
        ) {
            alert(
                "Please enter designation name."
            );

            return;
        }

        if (!form.purpose.trim()) {
            alert(
                "Please enter purpose."
            );

            return;
        }

        if (!form.expected_exit_at) {
            alert(
                "Please select expected exit time."
            );

            return;
        }

        if (
            form.gate_pass_type ===
            "Person With Material"
        ) {
            if (
                form.items.length ===
                0
            ) {
                alert(
                    "Please add at least one material item."
                );

                return;
            }

            const invalidItem =
                form.items.some(
                    (item) =>
                        !item.product_name.trim() ||
                        Number(
                            item.quantity
                        ) <= 0
                );

            if (invalidItem) {
                alert(
                    "Please enter valid product name and quantity for all items."
                );

                return;
            }
        }

        setSaving(true);

        try {
            const data = {
                gate_pass_type:
                    form.gate_pass_type,

                department_name:
                    form.department_name.trim(),

                designation_name:
                    form.designation_name.trim(),

                purpose:
                    form.purpose.trim(),

                expected_exit_at:
                    form.expected_exit_at,

                expected_return_at:
                    form.expected_return_at ||
                    null,

                remarks:
                    form.remarks.trim() ||
                    null,

                items:
                    form.gate_pass_type ===
                    "Person"
                        ? []
                        : form.items.map(
                              (item) => ({
                                  product_id:
                                      item.product_id,

                                  product_name:
                                      item.product_name.trim(),

                                  quantity:
                                      Number(
                                          item.quantity
                                      ),

                                  unit:
                                      item.unit.trim() ||
                                      null,

                                  asset_no:
                                      item.asset_no.trim() ||
                                      null,

                                  serial_no:
                                      item.serial_no.trim() ||
                                      null,

                                  remarks:
                                      item.remarks.trim() ||
                                      null,
                              })
                          ),
            };

            if (editingId) {
                await api.put(
                    `/reception/gate-passes/${editingId}`,
                    data
                );
            } else {
                await api.post(
                    "/reception/gate-passes",
                    data
                );
            }

            setModalOpen(false);

            setEditingId(null);

            setForm({
                ...initialForm,
            });

            await fetchGatePasses(
                true,
                page
            );
        } catch (error: any) {
            console.error(
                "Failed to save gate pass:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to save gate pass."
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

    const handleDelete = async (
        id: number
    ) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this gate pass?"
            )
        ) {
            return;
        }

        try {
            await api.delete(
                `/reception/gate-passes/${id}`
            );

            await fetchGatePasses(
                true,
                page
            );
        } catch (error: any) {
            console.error(
                "Failed to delete gate pass:",
                error
            );

            alert(
                error?.response?.data
                    ?.message ||
                    "Failed to delete gate pass."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | PDF
    |--------------------------------------------------------------------------
    */

    const handleDownloadPdf =
        async (id: number) => {
            try {
                const response =
                    await api.get(
                        `/reception/gate-passes/${id}/pdf`,
                        {
                            responseType:
                                "blob",
                        }
                    );

                const blob =
                    new Blob(
                        [
                            response.data,
                        ],
                        {
                            type: "application/pdf",
                        }
                    );

                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href = url;

                link.download = `gate-pass-${id}.pdf`;

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                window.URL.revokeObjectURL(
                    url
                );
            } catch (error) {
                console.error(
                    "Failed to download gate pass PDF:",
                    error
                );

                alert(
                    "Failed to download gate pass PDF."
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
                openSidebar={
                    openSidebar
                }
                setOpenSidebar={
                    setOpenSidebar
                }
            />

            <main className="flex-1 min-w-0">
                <TopNav
                    openSidebar={
                        openSidebar
                    }
                    setOpenSidebar={
                        setOpenSidebar
                    }
                />

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                        <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800">
                                Gate Pass
                            </h2>

                            <p className="text-gray-500 mt-1 text-sm">
                                Manage Person and material gate pass requests.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    fetchGatePasses(
                                        true,
                                        page
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                                className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw
                                    size={
                                        17
                                    }
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                            </button>

                            <button
                                type="button"
                                onClick={
                                    openCreateModal
                                }
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition"
                            >
                                <Plus
                                    size={
                                        18
                                    }
                                />

                                Add Gate Pass
                            </button>

                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* Table Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Gate Pass List
                                </h3>

                                <p className="text-xs text-gray-400 mt-0.5">
                                    All gate pass requests
                                </p>
                            </div>

                            <div className="flex items-center gap-2">

                                <span className="text-xs text-gray-400">
                                    Records:
                                </span>

                                <select
                                    value={
                                        itemsPerPage
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setItemsPerPage(
                                            Number(
                                                e
                                                    .target
                                                    .value
                                            )
                                        );

                                        setPage(
                                            1
                                        );
                                    }}
                                    className="h-8 px-2 rounded-md border border-gray-200 bg-white text-xs text-gray-600 focus:outline-none focus:border-indigo-400"
                                >
                                    <option value={10}>
                                        10
                                    </option>

                                    <option value={25}>
                                        25
                                    </option>

                                    <option value={50}>
                                        50
                                    </option>

                                    <option value={100}>
                                        100
                                    </option>
                                </select>

                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center">
                                <RefreshCw
                                    size={
                                        30
                                    }
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading gate passes...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1250px]">

                                        {/* Header */}
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">

                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-14">
                                                    #
                                                </th>

                                                <SortableHeader
                                                    title="Pass No"
                                                    field="pass_no"
                                                    sortField={
                                                        sortField
                                                    }
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                    onSort={
                                                        handleSort
                                                    }
                                                />

                                                <SortableHeader
                                                    title="Type"
                                                    field="gate_pass_type"
                                                    sortField={
                                                        sortField
                                                    }
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                    onSort={
                                                        handleSort
                                                    }
                                                />

                                                <SortableHeader
                                                    title="Requested By"
                                                    field="requester"
                                                    sortField={
                                                        sortField
                                                    }
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                    onSort={
                                                        handleSort
                                                    }
                                                />

                                                <SortableHeader
                                                    title="Department"
                                                    field="department_name"
                                                    sortField={
                                                        sortField
                                                    }
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                    onSort={
                                                        handleSort
                                                    }
                                                />

                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                    Purpose
                                                </th>

                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                    Exit Time
                                                </th>

                                                <SortableHeader
                                                    title="Status"
                                                    field="status"
                                                    sortField={
                                                        sortField
                                                    }
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                    onSort={
                                                        handleSort
                                                    }
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
                                                            size={
                                                                15
                                                            }
                                                            className="text-gray-400"
                                                        />
                                                    </div>
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.pass_no
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "pass_no",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.gate_pass_type
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "gate_pass_type",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.requester
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "requester",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.department_name
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "department_name",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.purpose
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "purpose",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.expected_exit_at
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "expected_exit_at",
                                                                value
                                                            )
                                                        }
                                                        placeholder="YYYY-MM-DD"
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <TableFilterInput
                                                        value={
                                                            filters.status
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            handleFilterChange(
                                                                "status",
                                                                value
                                                            )
                                                        }
                                                    />
                                                </th>

                                                <th className="px-3 py-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            clearFilters
                                                        }
                                                        title="Clear Filters"
                                                        className="w-full h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <FunnelX
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </button>
                                                </th>

                                            </tr>
                                        </thead>

                                        {/* Body */}
                                        <tbody className="divide-y divide-gray-100">

                                            {gatePasses.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={
                                                            9
                                                        }
                                                        className="py-16 text-center"
                                                    >
                                                        <ShieldCheck
                                                            size={
                                                                32
                                                            }
                                                            className="mx-auto text-gray-300"
                                                        />

                                                        <p className="mt-3 font-semibold text-gray-600">
                                                            No gate passes found
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Try changing your filters.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                gatePasses.map(
                                                    (
                                                        gatePass,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                gatePass.id
                                                            }
                                                            className="hover:bg-gray-50 transition"
                                                        >

                                                            {/* # */}
                                                            <td className="px-3 py-3 text-xs text-gray-500">
                                                                {(pagination.current_page -
                                                                    1) *
                                                                    pagination.per_page +
                                                                    index +
                                                                    1}
                                                            </td>

                                                            {/* Pass No */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap">
                                                                    {
                                                                        gatePass.pass_no
                                                                    }
                                                                </span>
                                                            </td>

                                                            {/* Type */}
                                                            <td className="px-3 py-3">
                                                                <TypeBadge
                                                                    type={
                                                                        gatePass.gate_pass_type
                                                                    }
                                                                />
                                                            </td>

                                                            {/* Requested By */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                                    {gatePass
                                                                        .requester
                                                                        ?.name ||
                                                                        "--"}
                                                                </span>
                                                            </td>

                                                            {/* Department */}
                                                            <td className="px-3 py-3">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-700">
                                                                        {
                                                                            gatePass.department_name
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                                        {
                                                                            gatePass.designation_name
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </td>

                                                            {/* Purpose */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-sm text-gray-600">
                                                                    {
                                                                        gatePass.purpose
                                                                    }
                                                                </span>
                                                            </td>

                                                            {/* Exit */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                                                    {formatDateTime(
                                                                        gatePass.expected_exit_at
                                                                    )}
                                                                </span>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-3 py-3">
                                                                <div className="space-y-1">

                                                                    <StatusBadge
                                                                        status={
                                                                            gatePass.status
                                                                        }
                                                                    />

                                                                    {gatePass.pending_approval && (
                                                                        <div className="text-xs text-gray-500">
                                                                            <p className="font-semibold text-gray-600">
                                                                                Level -{" "}
                                                                                {
                                                                                    gatePass
                                                                                        .pending_approval
                                                                                        .level
                                                                                }
                                                                            </p>

                                                                            <p>
                                                                                {
                                                                                    gatePass
                                                                                        .pending_approval
                                                                                        .approver ||
                                                                                    "--"
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            </td>

                                                            {/* Action */}
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center justify-end gap-1.5">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDownloadPdf(
                                                                                gatePass.id
                                                                            )
                                                                        }
                                                                        className="w-8 h-8 rounded-lg text-green-600 hover:bg-green-50 flex items-center justify-center transition"
                                                                        title="Download PDF"
                                                                    >
                                                                        <FileDown
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                gatePass
                                                                            )
                                                                        }
                                                                        className="w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition"
                                                                        title="Edit"
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
                                                                                gatePass.id
                                                                            )
                                                                        }
                                                                        className="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                                                                        title="Delete"
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
                                                )
                                            )}

                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.total >
                                    0 && (
                                    <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                        <div className="text-xs text-gray-500">
                                            Showing{" "}
                                            <span className="font-semibold text-gray-700">
                                                {
                                                    pagination.from
                                                }
                                            </span>{" "}
                                            to{" "}
                                            <span className="font-semibold text-gray-700">
                                                {
                                                    pagination.to
                                                }
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-semibold text-gray-700">
                                                {
                                                    pagination.total
                                                }
                                            </span>{" "}
                                            records
                                        </div>

                                        <div className="flex items-center gap-1">

                                            <button
                                                type="button"
                                                disabled={
                                                    page <=
                                                    1
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (
                                                            prev
                                                        ) =>
                                                            Math.max(
                                                                1,
                                                                prev -
                                                                    1
                                                            )
                                                    )
                                                }
                                                className="h-8 px-3 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft
                                                    size={
                                                        14
                                                    }
                                                />

                                                Previous
                                            </button>

                                            <div className="h-8 min-w-8 px-2 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                                                {
                                                    pagination.current_page
                                                }
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    page >=
                                                    pagination.last_page
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (
                                                            prev
                                                        ) =>
                                                            Math.min(
                                                                pagination.last_page,
                                                                prev +
                                                                    1
                                                            )
                                                    )
                                                }
                                                className="h-8 px-3 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Next

                                                <ChevronRight
                                                    size={
                                                        14
                                                    }
                                                />
                                            </button>

                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">

                    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ShieldCheck
                                        size={
                                            20
                                        }
                                        className="text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {editingId
                                            ? "Update Gate Pass"
                                            : "Create Gate Pass"}
                                    </h3>

                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {editingId
                                            ? "Update gate pass information"
                                            : "Create a new gate pass request"}
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                            >
                                <X
                                    size={
                                        18
                                    }
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="flex flex-col min-h-0"
                        >

                            {/* Body */}
                            <div className="p-6 overflow-y-auto space-y-6">

                                {/* Gate Pass Type */}
                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Gate Pass Type

                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                        <TypeOption
                                            active={
                                                form.gate_pass_type ===
                                                "Person"
                                            }
                                            icon={
                                                <UserRound
                                                    size={
                                                        20
                                                    }
                                                />
                                            }
                                            title="Person"
                                            description="Person only"
                                            onClick={() =>
                                                handleTypeChange(
                                                    "Person"
                                                )
                                            }
                                        />

                                        <TypeOption
                                            active={
                                                form.gate_pass_type ===
                                                "Person With Material"
                                            }
                                            icon={
                                                <UsersRound
                                                    size={
                                                        20
                                                    }
                                                />
                                            }
                                            title="Person With Material"
                                            description="Person with material"
                                            onClick={() =>
                                                handleTypeChange(
                                                    "Person With Material"
                                                )
                                            }
                                        />

                                    </div>
                                </div>

                                {/* Request Information */}
                                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">

                                    <div className="flex items-center gap-2 mb-4">
                                        <UserRound
                                            size={
                                                17
                                            }
                                            className="text-indigo-600"
                                        />

                                        <h4 className="text-sm font-bold text-gray-800">
                                            Request Information
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Department */}
                                        <FormInput
                                            label="Department"
                                            required
                                            value={
                                                form.department_name
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        department_name:
                                                            value,
                                                    })
                                                )
                                            }
                                            placeholder="IT"
                                        />

                                        {/* Designation */}
                                        <FormInput
                                            label="Designation"
                                            required
                                            value={
                                                form.designation_name
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        designation_name:
                                                            value,
                                                    })
                                                )
                                            }
                                            placeholder="IT Officer"
                                        />

                                        {/* Purpose */}
                                        <FormInput
                                            label="Purpose"
                                            required
                                            value={
                                                form.purpose
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        purpose:
                                                            value,
                                                    })
                                                )
                                            }
                                            placeholder="Official Work"
                                        />

                                        {/* Exit */}
                                        <FormInput
                                            label="Expected Exit"
                                            required
                                            type="datetime-local"
                                            value={
                                                form.expected_exit_at
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        expected_exit_at:
                                                            value,
                                                    })
                                                )
                                            }
                                        />

                                        {/* Return */}
                                        <FormInput
                                            label="Expected Return"
                                            type="datetime-local"
                                            value={
                                                form.expected_return_at
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        expected_return_at:
                                                            value,
                                                    })
                                                )
                                            }
                                        />

                                    </div>

                                    {/* Remarks */}
                                    <div className="mt-4">

                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Remarks
                                        </label>

                                        <textarea
                                            value={
                                                form.remarks
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        remarks:
                                                            e
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            rows={
                                                3
                                            }
                                            placeholder="Additional remarks..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                        />

                                    </div>
                                </div>

                                {/* Materials */}
                                {form.gate_pass_type !==
                                    "Person" && (
                                    <div className="rounded-2xl border border-gray-100 bg-white">

                                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">

                                            <div className="flex items-center gap-2">

                                                <Package
                                                    size={
                                                        17
                                                    }
                                                    className="text-indigo-600"
                                                />

                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-800">
                                                        Material Items
                                                    </h4>

                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Products or assets being taken outside
                                                    </p>
                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    addItem
                                                }
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition"
                                            >
                                                <Plus
                                                    size={
                                                        16
                                                    }
                                                />

                                                Add Item
                                            </button>

                                        </div>

                                        <div className="p-5 space-y-4">

                                            {form.items.length ===
                                            0 ? (
                                                <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">

                                                    <Package
                                                        size={
                                                            28
                                                        }
                                                        className="mx-auto text-gray-300"
                                                    />

                                                    <p className="mt-2 text-sm text-gray-500">
                                                        No material items added.
                                                    </p>

                                                </div>
                                            ) : (
                                                form.items.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={
                                                                index
                                                            }
                                                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60"
                                                        >

                                                            <div className="flex items-center justify-between mb-4">

                                                                <p className="text-sm font-bold text-gray-700">
                                                                    Item{" "}
                                                                    {index +
                                                                        1}
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeItem(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>

                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                                                {/* Product */}
                                                                <div className="lg:col-span-2">

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Product / Material

                                                                        <span className="text-red-500 ml-1">
                                                                            *
                                                                        </span>
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.product_name
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "product_name",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Laptop"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                                {/* Quantity */}
                                                                <div>

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Quantity
                                                                    </label>

                                                                    <input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "quantity",
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            )
                                                                        }
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                                {/* Unit */}
                                                                <div>

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Unit
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.unit
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "unit",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Pcs"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                                {/* Asset */}
                                                                <div>

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Asset No
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.asset_no
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "asset_no",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="IT-LAP-025"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                                {/* Serial */}
                                                                <div>

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Serial No
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.serial_no
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "serial_no",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Serial number"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                                {/* Remarks */}
                                                                <div className="md:col-span-2 lg:col-span-3">

                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Item Remarks
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.remarks
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "remarks",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Item remarks"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />

                                                                </div>

                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="px-5 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={
                                                    16
                                                }
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
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) =>
                onChange(
                    e.target.value
                )
            }
            placeholder={
                placeholder
            }
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
    sortDirection:
        | "asc"
        | "desc"
        | null;
    onSort: (
        field: string
    ) => void;
}) {
    const active =
        sortField === field;

    return (
        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">

            <button
                type="button"
                onClick={() =>
                    onSort(field)
                }
                className="inline-flex items-center gap-1 hover:text-indigo-600 transition"
            >
                {title}

                {!active && (
                    <span className="inline-flex flex-col text-gray-300">
                        <ChevronUp
                            size={
                                11
                            }
                        />

                        <ChevronDown
                            size={
                                11
                            }
                            className="-mt-1"
                        />
                    </span>
                )}

                {active &&
                    sortDirection ===
                        "asc" && (
                        <ChevronUp
                            size={
                                14
                            }
                            className="text-indigo-600"
                        />
                    )}

                {active &&
                    sortDirection ===
                        "desc" && (
                        <ChevronDown
                            size={
                                14
                            }
                            className="text-indigo-600"
                        />
                    )}
            </button>

        </th>
    );
}

/*
|--------------------------------------------------------------------------
| Form Input
|--------------------------------------------------------------------------
*/

function FormInput({
    label,
    required = false,
    type = "text",
    value,
    onChange,
    placeholder = "",
}: {
    label: string;
    required?: boolean;
    type?: string;
    value: string;
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
}) {
    return (
        <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}

                {required && (
                    <span className="text-red-500 ml-1">
                        *
                    </span>
                )}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
                placeholder={
                    placeholder
                }
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Type Option
|--------------------------------------------------------------------------
*/

function TypeOption({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-4 rounded-2xl border transition ${
                active
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
            }`}
        >
            <div className="flex items-center gap-3">

                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {icon}
                </div>

                <div>

                    <p
                        className={`text-sm font-bold ${
                            active
                                ? "text-indigo-700"
                                : "text-gray-700"
                        }`}
                    >
                        {title}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                        {
                            description
                        }
                    </p>

                </div>

            </div>
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| Type Badge
|--------------------------------------------------------------------------
*/

function TypeBadge({
    type,
}: {
    type:
        | "Person"
        | "Person With Material";
}) {
    if (
        type === "Person"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold whitespace-nowrap">
                <UserRound
                    size={
                        12
                    }
                />

                Person
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold whitespace-nowrap">
            <UsersRound
                size={
                    12
                }
            />

            Person + Material
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

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
    const config = {
        Pending: {
            label: "Pending",
            className:
                "bg-yellow-50 text-yellow-700 border-yellow-100",
        },

        Approved: {
            label: "Approved",
            className:
                "bg-green-50 text-green-700 border-green-100",
        },

        Rejected: {
            label: "Rejected",
            className:
                "bg-red-50 text-red-700 border-red-100",
        },

        Cancelled: {
            label: "Cancelled",
            className:
                "bg-gray-50 text-gray-600 border-gray-200",
        },

        Completed: {
            label: "Completed",
            className:
                "bg-blue-50 text-blue-700 border-blue-100",
        },
    };

    const item =
        config[status];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${item.className}`}
        >
            {
                item.label
            }
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Date Time
|--------------------------------------------------------------------------
*/

function formatDateTime(
    value: string
) {
    if (!value) {
        return "--";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

/*
|--------------------------------------------------------------------------
| Date Time For Input
|--------------------------------------------------------------------------
*/

function formatDateTimeForInput(
    value: string
) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value.slice(
            0,
            16
        );
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}