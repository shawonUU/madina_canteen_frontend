
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock,
    MapPin,
    Search,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Eye,
    X,
} from "lucide-react";

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

interface Meeting {
    id: number;
    meeting_number?: string;
    title?: string;
    description?: string;
    meeting_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    meeting_link?: string;
    meeting_type?: string;
    organizer_name?: string;
    organizer?: {
        name?: string;
        employee?: {
            name?: string;
        };
    };
}

interface Invitation {
    id: number;
    meeting_id: number;
    employee_id?: number;
    invitation_status?: string;
    attendance_status?: string;
    participation_type?: string;
    meeting?: Meeting;
}

interface InvitationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

type StatusFilter = "all" | "Pending" | "Accepted" | "Declined";

const normalizeStatus = (status?: string) => (status || "Pending");

const formatLabel = (value?: string) => {
    if (!value) return "Not specified";

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (date?: string) => {
    if (!date) return "Not specified";

    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) return date;

    const [, year, month, day] = match;
    const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
    );

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/**
 * Converts a date filter to YYYY-MM-DD without UTC conversion.
 * This prevents the selected date from shifting by one day.
 */
const formatDateFilter = (value: unknown): string => {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return "";
        }

        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const dateValue = String(value ?? "").trim();
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);

    return match ? match[1] : "";
};

const formatTime = (time?: string) => {
    if (!time) return "";

    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return time;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

const getOrganizerName = (meeting?: Meeting) =>
    meeting?.organizer?.employee?.name ||
    meeting?.organizer?.name ||
    meeting?.organizer_name ||
    "Not specified";

const getStatusClasses = (status?: string) => {
    switch (normalizeStatus(status)) {
        case "Accepted":
            return "border border-emerald-200 bg-emerald-50 text-emerald-700";

        case "Declined":
        case "Rejected":
            return "border border-red-200 bg-red-50 text-red-700";

        default:
            return "border border-amber-200 bg-amber-50 text-amber-700";
    }
};

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

export default function MeetingInvitations() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [meta, setMeta] = useState<InvitationMeta>({
        current_page: 1,
        per_page: 25,
        total: 0,
        last_page: 1,
    });

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [columnFilters, setColumnFilters] =
        useState<MRT_ColumnFiltersState>([]);

    const [sorting, setSorting] = useState<MRT_SortingState>([
        { id: "meeting_date", desc: true },
    ]);

    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedInvitation, setSelectedInvitation] =
        useState<Invitation | null>(null);

    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);

    const requestParams = useMemo(() => {
        const params: Record<string, any> = {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
        };

        if (debouncedSearch) {
            params.search = debouncedSearch;
        }

        if (statusFilter !== "all") {
            params["filter[invitation_status]"] =
                statusFilter === "Declined"
                    ? "Declined"
                    : formatLabel(statusFilter);
        }

        columnFilters.forEach(({ id, value }) => {
            if (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            ) {
                return;
            }

            if (id === "meeting") {
                params["filter[meeting]"] = String(value).trim();
            } else if (id === "meeting_date") {
                const dateValue = formatDateFilter(value);

                if (dateValue) {
                    params["filter[meeting_date]"] = dateValue;
                }
            } else if (id === "participation_type") {
                params["filter[participation_type]"] = String(value);
            } else if (id === "invitation_status") {
                params["filter[invitation_status]"] =
                    normalizeStatus(String(value)) === "Rejected"
                        ? "Declined"
                        : formatLabel(String(value));
            }
        });

        if (sorting.length > 0) {
            params.sort = sorting[0].id;
            params.direction = sorting[0].desc ? "desc" : "asc";
        }

        return params;
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch,
        statusFilter,
        columnFilters,
        sorting,
    ]);

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                "/meeting-management/my-invitations",
                { params: requestParams },
            );

            const payload = response.data;
            const pageData = payload?.data;

            let rows: Invitation[] = [];

            if (Array.isArray(pageData)) {
                rows = pageData;
            } else if (Array.isArray(pageData?.data)) {
                rows = pageData.data;
            } else if (Array.isArray(payload?.data?.data?.data)) {
                rows = payload.data.data.data;
            }

            const paginationData =
                !Array.isArray(pageData) && pageData
                    ? pageData
                    : payload?.meta || payload;

            setInvitations(rows);

            setMeta({
                current_page: Number(
                    paginationData?.current_page ??
                        payload?.meta?.current_page ??
                        pagination.pageIndex + 1,
                ),
                per_page: Number(
                    paginationData?.per_page ??
                        payload?.meta?.per_page ??
                        pagination.pageSize,
                ),
                total: Number(
                    paginationData?.total ??
                        payload?.meta?.total ??
                        rows.length,
                ),
                last_page: Number(
                    paginationData?.last_page ??
                        payload?.meta?.last_page ??
                        1,
                ),
            });
        } catch (err: any) {
            setInvitations([]);
            setMeta({
                current_page: 1,
                per_page: pagination.pageSize,
                total: 0,
                last_page: 1,
            });

            setError(
                getErrorMessage(
                    err,
                    "Unable to load meeting invitations.",
                ),
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [requestParams, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        void fetchInvitations();
    }, [fetchInvitations, refreshKey]);

    const refreshInvitations = () => {
        setRefreshing(true);
        setRefreshKey((previous) => previous + 1);
    };

    const updateInvitationStatus = async (
        invitation: Invitation,
        status: "Accepted" | "Declined",
    ) => {
        if (normalizeStatus(invitation.invitation_status) !== "Pending") {
            return;
        }

        setUpdatingId(invitation.id);
        setError("");
        setSuccess("");

        try {
            await api.patch(
                `/meeting-management/meetings/${invitation.meeting_id}/invitation/${invitation.id}`,
                { invitation_status: status },
            );

            setSuccess(
                status === "Accepted"
                    ? "Meeting invitation accepted successfully."
                    : "Meeting invitation declined successfully.",
            );

            setSelectedInvitation((previous) =>
                previous?.id === invitation.id
                    ? { ...previous, invitation_status: status }
                    : previous,
            );

            await fetchInvitations();
        } catch (err: any) {
            setError(
                getErrorMessage(
                    err,
                    "Unable to update invitation status.",
                ),
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const columns = useMemo<MRT_ColumnDef<Invitation>[]>(
        () => [
            {
                id: "serial",
                header: "#",
                size: 70,
                minSize: 70,
                maxSize: 70,
                enableColumnFilter: false,
                enableSorting: false,
                Header: () => (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>#</span>
                        <Tooltip label="">
                            <ActionIcon
                                size="sm"
                                variant={showColumnFilters ? "filled" : "subtle"}
                                aria-label="Toggle column filters"
                                onClick={() =>
                                    setShowColumnFilters((previous) => !previous)
                                }
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
                id: "meeting",
                header: "Meeting",
                accessorFn: (row) => row.meeting?.title || "",
                minSize: 220,
                filterVariant: "text",
                Cell: ({ row }) => {
                    const meeting = row.original.meeting;

                    return (
                        <div className="flex min-w-[190px] items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">
                                <CalendarDays size={17} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                    {meeting?.title || "Untitled Meeting"}
                                </p>
                                <p className="mt-0.5 text-xs text-indigo-600">
                                    {meeting?.meeting_number || "No meeting number"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Organizer: {getOrganizerName(meeting)}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "meeting_date",
                header: "Date & Time",
                accessorFn: (row) => row.meeting?.meeting_date || "",
                minSize: 190,
                filterVariant: "date",
                Cell: ({ row }) => (
                    <div className="min-w-[160px]">
                        <p className="font-medium text-slate-800">
                            {formatDate(row.original.meeting?.meeting_date)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                            <Clock size={13} />
                            {formatTime(row.original.meeting?.start_time) ||
                                "Time not specified"}
                            {row.original.meeting?.end_time
                                ? ` - ${formatTime(row.original.meeting.end_time)}`
                                : ""}
                        </p>
                    </div>
                ),
            },
            {
                id: "participation_type",
                header: "Participation",
                accessorFn: (row) => row.participation_type || "",
                minSize: 135,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Required", value: "required" },
                        { label: "Optional", value: "optional" },
                    ],
                    clearable: true,
                    placeholder: "All types",
                },
                Cell: ({ row }) => (
                    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatLabel(row.original.participation_type)}
                    </span>
                ),
            },
            {
                id: "invitation_status",
                header: "Invitation Status",
                accessorFn: (row) =>
                    normalizeStatus(row.invitation_status),
                minSize: 155,
                filterVariant: "select",
                mantineFilterSelectProps: {
                    data: [
                        { label: "Pending", value: "Pending" },
                        { label: "Accepted", value: "Accepted" },
                        { label: "Declined", value: "Declined" },
                    ],
                    clearable: true,
                    placeholder: "All statuses",
                },
                Cell: ({ row }) => (
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            row.original.invitation_status,
                        )}`}
                    >
                        {formatLabel(
                            normalizeStatus(row.original.invitation_status),
                        )}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 150,
                minSize: 150,
                enableSorting: false,
                enableColumnFilter: false,
                Cell: ({ row }) => {
                    const invitation = row.original;
                    const isPending =
                        normalizeStatus(invitation.invitation_status) === "Pending";
                    const isUpdating = updatingId === invitation.id;

                    return (
                        <div className="flex items-center gap-1.5">
                            <Tooltip label="View details">
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvitation(invitation)}
                                    className="flex h-8 w-8 items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                    <Eye size={15} />
                                </button>
                            </Tooltip>

                            {isPending && (
                                <>
                                    <Tooltip label="Accept invitation">
                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() =>
                                                void updateInvitationStatus(
                                                    invitation,
                                                    "Accepted",
                                                )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <RefreshCw
                                                    size={15}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <CheckCircle2 size={15} />
                                            )}
                                        </button>
                                    </Tooltip>

                                    <Tooltip label="Decline invitation">
                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() =>
                                                void updateInvitationStatus(
                                                    invitation,
                                                    "Declined",
                                                )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                        >
                                            <XCircle size={15} />
                                        </button>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    );
                },
            },
        ],
        [
            pagination.pageIndex,
            pagination.pageSize,
            showColumnFilters,
            updatingId,
        ],
    );

    const table = useMantineReactTable({
        columns,
        data: invitations,

        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,

        rowCount: meta.total,
        pageCount: Math.max(1, meta.last_page),

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
            showColumnFilters,
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

        mantinePaginationProps: {
            rowsPerPageOptions: ["10", "25", "50", "100"],
            showRowsPerPage: true,
        },

        localization: {
            noRecordsToDisplay: "No meeting invitations found",
            rowsPerPage: "Rows per page",
        },
    });

    const clearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setStatusFilter("all");
        setColumnFilters([]);
        setSorting([{ id: "meeting_date", desc: true }]);
        setPagination((previous) => ({
            ...previous,
            pageIndex: 0,
        }));
    };

    const hasFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        columnFilters.length > 0;

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
                                    My Invitations
                                </span>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                My Meeting Invitations
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                View and respond to meetings you have been invited to.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={refreshInvitations}
                            disabled={loading || refreshing}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={refreshInvitations}
                                className="font-semibold underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                        >
                            <span>{success}</span>
                            <button
                                type="button"
                                onClick={() => setSuccess("")}
                                aria-label="Dismiss success message"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                label: "Total Invitations",
                                value: meta.total,
                                color: "text-slate-800",
                            },
                            {
                                label: "Pending",
                                value: "—",
                                color: "text-amber-600",
                            },
                            {
                                label: "Accepted",
                                value: "—",
                                color: "text-emerald-600",
                            },
                            {
                                label: "Declined",
                                value: "—",
                                color: "text-red-600",
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-slate-200 bg-white p-5"
                            >
                                <p className="text-sm text-slate-500">
                                    {item.label}
                                </p>
                                <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-300 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Invitation List
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {meta.total.toLocaleString()} invitation(s) found
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
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search invitations..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch("")}
                                            aria-label="Clear search"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(
                                            event.target.value as StatusFilter,
                                        );
                                        setPagination((previous) => ({
                                            ...previous,
                                            pageIndex: 0,
                                        }));
                                    }}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    <option value="all">All Invitations</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Declined">Declined</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    disabled={!hasFilters}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <X size={15} />
                                    Clear filters
                                </button>
                            </div>
                        </div>

                        <MantineReactTable table={table} />
                    </div>
                </div>
            </main>

            {selectedInvitation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedInvitation(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invitation-details-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2
                                    id="invitation-details-title"
                                    className="text-xl font-semibold text-slate-800"
                                >
                                    Meeting Details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Invitation information
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedInvitation(null)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-slate-500">Meeting Title</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {selectedInvitation.meeting?.title || "Untitled Meeting"}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Meeting Number</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {selectedInvitation.meeting?.meeting_number || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Date & Time</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {formatDate(selectedInvitation.meeting?.meeting_date)}
                                </p>
                                <p className="mt-1 text-slate-600">
                                    {formatTime(selectedInvitation.meeting?.start_time) || "Time not specified"}
                                    {selectedInvitation.meeting?.end_time
                                        ? ` - ${formatTime(selectedInvitation.meeting.end_time)}`
                                        : ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Meeting Type</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {formatLabel(selectedInvitation.meeting?.meeting_type)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Participation</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {formatLabel(selectedInvitation.participation_type)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Invitation Status</p>
                                <span
                                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                        selectedInvitation.invitation_status,
                                    )}`}
                                >
                                    {formatLabel(normalizeStatus(selectedInvitation.invitation_status))}
                                </span>
                            </div>

                            <div>
                                <p className="text-slate-500">Organizer</p>
                                <p className="mt-1 font-medium text-slate-800">
                                    {getOrganizerName(selectedInvitation.meeting)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Location</p>
                                <p className="mt-1 flex items-start gap-1.5 font-medium text-slate-800">
                                    <MapPin size={15} className="mt-0.5 shrink-0" />
                                    {selectedInvitation.meeting?.location || "Not specified"}
                                </p>
                            </div>

                            {selectedInvitation.meeting?.description && (
                                <div>
                                    <p className="text-slate-500">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap text-slate-700">
                                        {selectedInvitation.meeting.description}
                                    </p>
                                </div>
                            )}

                            {selectedInvitation.meeting?.meeting_link && (
                                <div>
                                    <p className="text-slate-500">Online Meeting Link</p>
                                    <a
                                        href={selectedInvitation.meeting.meeting_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-block break-all font-medium text-indigo-600 hover:underline"
                                    >
                                        Open Meeting Link
                                    </a>
                                </div>
                            )}
                        </div>

                        {normalizeStatus(selectedInvitation.invitation_status) === "Pending" && (
                            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    disabled={updatingId === selectedInvitation.id}
                                    onClick={() =>
                                        void updateInvitationStatus(
                                            selectedInvitation,
                                            "Declined",
                                        )
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                >
                                    <XCircle size={15} />
                                    Decline
                                </button>

                                <button
                                    type="button"
                                    disabled={updatingId === selectedInvitation.id}
                                    onClick={() =>
                                        void updateInvitationStatus(
                                            selectedInvitation,
                                            "Accepted",
                                        )
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={15} />
                                    Accept
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
