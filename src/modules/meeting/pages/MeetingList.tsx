
import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    Search,
    CalendarDays,
    Clock3,
    Eye,
    User,
    Users,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
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
import { Link, useNavigate } from "react-router-dom";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

type MeetingStatus =
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";

type ApprovalStatus = 'Pending'| 'Approved'| 'Rejected'| 'Cancelled'| 'Completed';

interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    description?: string | null;
    meeting_type: "internal" | "external" | "online" | "hybrid";
    meeting_date: string;
    start_time: string;
    end_time: string;
    location?: string | null;
    meeting_link?: string | null;
    status: MeetingStatus;
    approval_status?: ApprovalStatus | null;
    organizer_id?: number;
    participants_count?: number;
    created_at?: string;
}

interface ApiMeta {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
}

const PAGE_SIZES = ["10", "25", "50", "100"];

const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const statusStyles: Record<string, string> = {
    scheduled: "border-blue-200 bg-blue-50 text-blue-700",
    in_progress: "border-amber-200 bg-amber-50 text-amber-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelled: "border-red-200 bg-red-50 text-red-700",
};

const approvalStatusStyles: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
};

const formatStatus = (status: string) =>
    status.replaceAll("_", " ").replace(/\b\w/g, (char) =>
        char.toUpperCase(),
    );

const formatMeetingType = (type: string) =>
    type.replaceAll("_", " ").replace(/\b\w/g, (char) =>
        char.toUpperCase(),
    );

const formatDate = (date: string) => {
    if (!date) return "--";

    const dateOnly = date.slice(0, 10);
    const parsedDate = new Date(`${dateOnly}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (time: string) => {
    if (!time) return "--";

    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return time;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                statusStyles[status] ??
                "border-slate-300 bg-slate-100 text-slate-600"
            }`}
        >
            {formatStatus(status || "unknown")}
        </span>
    );
}

function ApprovalStatusBadge({
    status,
}: {
    status?: string | null;
}) {
    const normalizedStatus = status?.toLowerCase() ?? "";

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                approvalStatusStyles[normalizedStatus] ??
                "border-slate-300 bg-slate-100 text-slate-600"
            }`}
        >
            {status ? formatStatus(status) : "Not set"}
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

export default function MeetingList() {
    const navigate = useNavigate();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [meetings, setMeetings] = useState<Meeting[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tableError, setTableError] = useState("");
    const [totalRecords, setTotalRecords] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [globalSearch, setGlobalSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [columnFilters, setColumnFilters] =
        useState<MRT_ColumnFiltersState>([]);

    const [sorting, setSorting] = useState<MRT_SortingState>([
        { id: "meeting_date", desc: true },
    ]);

    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });

    const [refreshKey, setRefreshKey] = useState(0);

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

    const fetchMeetings = useCallback(async () => {
        setLoading(true);
        setTableError("");

        try {
            const params: Record<string, string | number> = {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: debouncedSearch,
                sort_by: sorting[0]?.id ?? "meeting_date",
                sort_direction: sorting[0]?.desc ? "desc" : "asc",
            };

            Object.entries(filterValues).forEach(([key, value]) => {
                params[`filter[${key}]`] = value;
            });

            const response = await api.get(
                "/meeting-management/meetings",
                { params },
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Failed to load meetings.",
                );
            }

            const result = normalizeList<Meeting>(response.data);

            setMeetings(result.records);
            setTotalRecords(result.meta.total ?? result.records.length);
            setLastPage(result.meta.last_page ?? 1);
        } catch (error: any) {
            console.error("Failed to load meetings:", error);

            setTableError(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load meetings. Please try again.",
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
        void fetchMeetings();
    }, [fetchMeetings, refreshKey]);

    const refreshMeetings = () => {
        setRefreshing(true);
        setRefreshKey((previous) => previous + 1);
    };

    const clearFilters = () => {
        setGlobalSearch("");
        setDebouncedSearch("");
        setColumnFilters([]);
        setSorting([{ id: "meeting_date", desc: true }]);

        setPagination((previous) => ({
            ...previous,
            pageIndex: 0,
        }));
    };

    const hasFilters =
        globalSearch.trim() !== "" || columnFilters.length > 0;

    const handleDelete = async (meeting: Meeting) => {
        if (
            !window.confirm(
                `Are you sure you want to delete meeting "${meeting.meeting_number}"?`,
            )
        ) {
            return;
        }

        setDeletingId(meeting.id);
        setTableError("");

        try {
            await api.delete(
                `/meeting-management/meetings/${meeting.id}`,
            );

            if (meetings.length === 1 && pagination.pageIndex > 0) {
                setPagination((previous) => ({
                    ...previous,
                    pageIndex: previous.pageIndex - 1,
                }));
            } else {
                setRefreshKey((previous) => previous + 1);
            }
        } catch (error: any) {
            console.error("Failed to delete meeting:", error);

            setTableError(
                error?.response?.data?.message ||
                    "Failed to delete meeting.",
            );
        } finally {
            setDeletingId(null);
        }
    };

    const columns = useMemo<MRT_ColumnDef<Meeting>[]>(
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

                        <Tooltip label="">
                            <ActionIcon
                                size="sm"
                                variant={
                                    table.getState().showColumnFilters
                                        ? "filled"
                                        : "subtle"
                                }
                                aria-label="Toggle column filters"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    table.setShowColumnFilters(
                                        !table.getState().showColumnFilters,
                                    );
                                }}
                            >
                                <IconFilter size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                ),
                Cell: ({ row }) =>
                    pagination.pageIndex * pagination.pageSize +
                    row.index +
                    1,
            },
            {
                accessorKey: "meeting_number",
                id: "meeting_number",
                header: "Meeting",
                minSize: 220,
                Cell: ({ row }) => (
                    <div className="flex min-w-[180px] items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">
                            <CalendarDays size={17} />
                        </div>

                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                                {row.original.title}
                            </p>

                            <p className="mt-0.5 text-xs text-indigo-600">
                                {row.original.meeting_number || "--"}
                            </p>

                            {row.original.location && (
                                <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500">
                                    {row.original.location}
                                </p>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "meeting_date",
                id: "meeting_date",
                header: "Date & Time",
                minSize: 190,
                filterVariant: "date",
                Cell: ({ row }) => (
                    <div className="min-w-[160px]">
                        <p className="font-medium text-slate-800">
                            {formatDate(row.original.meeting_date)}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                            <Clock3 size={13} />
                            {formatTime(row.original.start_time)}
                            {" - "}
                            {formatTime(row.original.end_time)}
                        </p>
                    </div>
                ),
            },
            {
                accessorKey: "meeting_type",
                id: "meeting_type",
                header: "Type",
                minSize: 130,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Internal", value: "internal" },
                        { label: "External", value: "external" },
                        { label: "Online", value: "online" },
                        { label: "Hybrid", value: "hybrid" },
                    ],
                    clearable: true,
                    placeholder: "All types",
                },
                Cell: ({ row }) => (
                    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatMeetingType(row.original.meeting_type)}
                    </span>
                ),
            },
            {
                accessorKey: "participants_count",
                id: "participants_count",
                header: "Participants",
                minSize: 130,
                enableColumnFilter: false,
                Cell: ({ row }) => (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <Users size={14} />
                        {row.original.participants_count ?? 0}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                id: "status",
                header: "Meeting Status",
                minSize: 145,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Scheduled", value: "scheduled" },
                        { label: "In Progress", value: "in_progress" },
                        { label: "Completed", value: "completed" },
                        { label: "Cancelled", value: "cancelled" },
                    ],
                    clearable: true,
                    placeholder: "All statuses",
                },
                Cell: ({ row }) => (
                    <StatusBadge status={row.original.status} />
                ),
            },
            {
                accessorKey: "approval_status",
                id: "approval_status",
                header: "Approval Status",
                minSize: 155,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Pending", value: "pending" },
                        { label: "Approved", value: "approved" },
                        { label: "Rejected", value: "rejected" },
                    ],
                    clearable: true,
                    placeholder: "All approvals",
                },
                Cell: ({ row }) => (
                    <ApprovalStatusBadge
                        status={row.original.approval_status}
                    />
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 125,
                minSize: 125,
                enableSorting: false,
                enableColumnFilter: false,
                Cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/meeting/meeting-scheduling/view-meeting/${row.original.id}`,
                                )
                            }
                            title="View meeting"
                            className="flex h-8 w-8 items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                            <Eye size={15} />

                        </button>



                        <button
                            type="button"
                            onClick={() =>
                                alert(
                                    "Edit meeting page will be implemented next.",
                                )
                            }
                            title="Edit meeting"
                            className="flex h-8 w-8 items-center justify-center rounded border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                            <Pencil size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/meeting-management/meetings/${row.original.id}/participants`,
                                )
                            }
                            title="View Participants"
                            className="flex h-8 w-8 items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                            <User size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleDelete(row.original)}
                            disabled={deletingId === row.original.id}
                            title="Delete meeting"
                            className="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                            {deletingId === row.original.id ? (
                                <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <Trash2 size={15} />
                            )}
                        </button>
                    </div>
                ),
            },
        ],
        [
            pagination.pageIndex,
            pagination.pageSize,
            deletingId,
            navigate,
        ],
    );

    const table = useMantineReactTable({
        columns,
        data: meetings,
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
            columnOrder: [
                "serial",
                "meeting_number",
                "meeting_date",
                "meeting_type",
                "participants_count",
                "status",
                "approval_status",
                "actions",
            ],
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
            noRecordsToDisplay: "No meetings found",
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
                                <CalendarDays size={16} />
                                <span>Meeting Management</span>
                                <span>/</span>
                                <span className="font-semibold text-slate-800">
                                    Meetings
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Meeting Management
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage meeting schedules, participants and status.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={refreshMeetings}
                                disabled={refreshing || loading}
                                className={secondaryButtonClass}
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                Refresh
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/meeting/meeting-scheduling/create-meeting",
                                    )
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <Plus size={17} />
                                Create Meeting
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-300 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Meeting List
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
                                        placeholder="Search meetings..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                    {globalSearch && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setGlobalSearch("")
                                            }
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
                                    onClick={refreshMeetings}
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
        </div>
    );
}
