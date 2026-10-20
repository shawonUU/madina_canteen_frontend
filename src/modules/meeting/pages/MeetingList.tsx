
import {
    Plus,
    Search,
    RefreshCw,
    CalendarDays,
    Clock3,
    Eye,
    Pencil,
    Trash2,
    Users,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

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
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    organizer_id?: number;
    participants_count?: number;
}

interface MeetingResponse {
    data: Meeting[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface MeetingFilters {
    search: string;
    status: string;
    date_from: string;
    date_to: string;
    page: number;
    per_page: number;
}

const initialFilters: MeetingFilters = {
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 10,
};

const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-100",
    completed: "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
};

const formatStatus = (status: string) =>
    status.replaceAll("_", " ").replace(/\b\w/g, (char) =>
        char.toUpperCase()
    );

const formatDate = (date: string) => {
    if (!date) return "--";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (time: string) => {
    if (!time) return "--";

    const [hours, minutes] = time.split(":");
    const parsedHours = Number(hours);

    if (Number.isNaN(parsedHours) || !minutes) return time;

    const period = parsedHours >= 12 ? "PM" : "AM";
    const displayHours = parsedHours % 12 || 12;

    return `${displayHours}:${minutes} ${period}`;
};

export default function MeetingList() {
    const navigate = useNavigate();
    const [openSidebar, setOpenSidebar] = useState(false);

    const [meetings, setMeetings] = useState<Meeting[]>([]);

    const [filters, setFilters] = useState<MeetingFilters>({
        ...initialFilters,
    });

    const [searchInput, setSearchInput] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchMeetings = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await api.get(
                    "/meeting-management/meetings",
                    {
                        params: {
                            search: filters.search || undefined,
                            status: filters.status || undefined,
                            date_from: filters.date_from || undefined,
                            date_to: filters.date_to || undefined,
                            page: filters.page,
                            per_page: filters.per_page,
                        },
                    }
                );

                const result = response.data;

                const pagination: MeetingResponse =
                    result.data?.data
                        ? result.data
                        : result.data?.current_page
                          ? result.data
                          : result;

                setMeetings(
                    Array.isArray(pagination.data)
                        ? pagination.data
                        : []
                );

                setCurrentPage(pagination.current_page || 1);
                setLastPage(pagination.last_page || 1);
                setTotal(pagination.total || 0);
            } catch (error: any) {
                console.error("Failed to load meetings:", error);

                setError(
                    error?.response?.data?.message ||
                        "Failed to load meetings. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [filters]
    );

    useEffect(() => {
        void fetchMeetings();
    }, [fetchMeetings]);

    const updateFilter = (
        field: keyof MeetingFilters,
        value: string | number
    ) => {
        setFilters((previous) => ({
            ...previous,
            [field]: value,
            page: 1,
        }));
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        updateFilter("search", searchInput.trim());
    };

    const resetFilters = () => {
        setSearchInput("");
        setFilters({ ...initialFilters });
    };

    const handleDelete = async (meeting: Meeting) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete meeting "${meeting.meeting_number}"?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(meeting.id);
            setError("");

            await api.delete(
                `/meeting-management/meetings/${meeting.id}`
            );

            if (meetings.length === 1 && currentPage > 1) {
                setFilters((previous) => ({
                    ...previous,
                    page: previous.page - 1,
                }));
            } else {
                await fetchMeetings(true);
            }
        } catch (error: any) {
            console.error("Failed to delete meeting:", error);

            setError(
                error?.response?.data?.message ||
                    "Failed to delete meeting."
            );
        } finally {
            setDeletingId(null);
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
                                <CalendarDays
                                    size={20}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-indigo-600">
                                    Meeting Management
                                </span>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Meeting List
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Manage meeting schedules, participants and status.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => void fetchMeetings(true)}
                                disabled={refreshing}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"
                                title="Refresh meetings"
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                            </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/meeting/meeting-scheduling/create-meeting")}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition"
                                >
                                    <Plus size={18} />
                                    Create Meeting
                                </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Meetings
                                    </p>

                                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">
                                        {total}
                                    </h3>
                                </div>

                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <CalendarDays size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Current Page
                                    </p>

                                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">
                                        {currentPage} / {lastPage}
                                    </h3>
                                </div>

                                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Clock3 size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Displayed Meetings
                                    </p>

                                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">
                                        {meetings.length}
                                    </h3>
                                </div>

                                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                    <Users size={22} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
                        <form
                            onSubmit={handleSearch}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
                        >
                            <div className="xl:col-span-2">
                                <label
                                    htmlFor="meeting-search"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Search Meeting
                                </label>

                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        id="meeting-search"
                                        type="search"
                                        value={searchInput}
                                        onChange={(event) =>
                                            setSearchInput(event.target.value)
                                        }
                                        placeholder="Meeting number or title"
                                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="meeting-status"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Status
                                </label>

                                <select
                                    id="meeting-status"
                                    value={filters.status}
                                    onChange={(event) =>
                                        updateFilter("status", event.target.value)
                                    }
                                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="meeting-date-from"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Date From
                                </label>

                                <input
                                    id="meeting-date-from"
                                    type="date"
                                    value={filters.date_from}
                                    max={filters.date_to || undefined}
                                    onChange={(event) =>
                                        updateFilter(
                                            "date_from",
                                            event.target.value
                                        )
                                    }
                                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="meeting-date-to"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Date To
                                </label>

                                <input
                                    id="meeting-date-to"
                                    type="date"
                                    min={filters.date_from || undefined}
                                    value={filters.date_to}
                                    onChange={(event) =>
                                        updateFilter(
                                            "date_to",
                                            event.target.value
                                        )
                                    }
                                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>

                            <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-5">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    <Search size={16} />
                                    Search
                                </button>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    <X size={16} />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => void fetchMeetings(true)}
                                className="text-sm font-semibold text-red-700 hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Meeting Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Meetings
                                </h3>

                                <p className="text-sm text-gray-400 mt-1">
                                    All scheduled meetings
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-gray-500">
                                {total} Records
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center">
                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading meetings...
                                </p>
                            </div>
                        ) : meetings.length === 0 ? (
                            <div className="py-16 text-center">
                                <CalendarDays
                                    size={34}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 font-semibold text-gray-600">
                                    No meetings found
                                </p>

                                <p className="text-sm text-gray-400 mt-1">
                                    Try changing your search or filters.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px]">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                #
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Meeting
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Date & Time
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Type
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Participants
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {meetings.map((meeting, index) => (
                                            <tr
                                                key={meeting.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {(currentPage - 1) *
                                                        filters.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {meeting.title}
                                                        </p>

                                                        <p className="text-xs text-indigo-600 mt-1">
                                                            {meeting.meeting_number}
                                                        </p>

                                                        {meeting.location && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {meeting.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {formatDate(
                                                            meeting.meeting_date
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatTime(
                                                            meeting.start_time
                                                        )}
                                                        {" - "}
                                                        {formatTime(
                                                            meeting.end_time
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 capitalize">
                                                        {meeting.meeting_type}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Users
                                                            size={15}
                                                            className="text-gray-400"
                                                        />

                                                        {meeting.participants_count ?? 0}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${
                                                            statusStyles[
                                                                meeting.status
                                                            ] ||
                                                            "bg-gray-50 text-gray-600 border-gray-100"
                                                        }`}
                                                    >
                                                        {formatStatus(
                                                            meeting.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            title="View Meeting"
                                                           onClick={() => navigate(`/meeting/meeting-scheduling/view-meeting/${meeting.id}`)}
                                                            className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Edit Meeting"
                                                            onClick={() =>
                                                                alert(
                                                                    "Edit meeting page will be implemented next."
                                                                )
                                                            }
                                                            className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Delete Meeting"
                                                            disabled={
                                                                deletingId ===
                                                                meeting.id
                                                            }
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    meeting
                                                                )
                                                            }
                                                            className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition disabled:opacity-50"
                                                        >
                                                            {deletingId ===
                                                            meeting.id ? (
                                                                <RefreshCw
                                                                    size={16}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    size={16}
                                                                />
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

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-sm text-gray-500">
                                Showing {meetings.length > 0
                                    ? (currentPage - 1) *
                                          filters.per_page +
                                      1
                                    : 0}
                                {" - "}
                                {(currentPage - 1) * filters.per_page +
                                    meetings.length}
                                {" of "}
                                {total} records
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={
                                        loading || currentPage <= 1
                                    }
                                    onClick={() =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            page: previous.page - 1,
                                        }))
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <span className="text-sm text-gray-500 px-2">
                                    {currentPage} / {lastPage}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        loading ||
                                        currentPage >= lastPage
                                    }
                                    onClick={() =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            page: previous.page + 1,
                                        }))
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
