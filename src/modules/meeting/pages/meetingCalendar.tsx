import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    LoaderCircle,
    MapPin,
    RefreshCw,
    Video,
} from "lucide-react";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

type Meeting = {
    id: number;
    meeting_number?: string;
    title: string;
    description?: string;
    meeting_type?: string;
    meeting_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    meeting_link?: string;
    status?: string;
    organizer?: {
        name?: string;
    };
    chairperson?: {
        name?: string;
    };
};

const statusClasses: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    postponed: "bg-amber-100 text-amber-700",
    in_progress: "bg-indigo-100 text-indigo-700",
};

const formatTime = (time?: string) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatStatus = (status?: string) =>
    (status || "scheduled")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getMeetingDate = (date: string) => date.slice(0, 10);

export default function MeetingCalendar() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();

        return new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );
    });

    const fetchMeetings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/meeting-management/meetings");

            const rows =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setMeetings(Array.isArray(rows) ? rows : []);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Meetings could not be loaded. Please check the API endpoint."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startingDay = (firstDay.getDay() + 6) % 7;

    const calendarDays: (number | null)[] = [
        ...Array.from<number | null>(
            { length: startingDay },
            () => null
        ),
        ...Array.from(
            { length: daysInMonth },
            (_, index) => index + 1
        ),
    ];

    while (calendarDays.length % 7 !== 0) {
        calendarDays.push(null);
    }

    const dateKey = (day: number) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const meetingsForDate = (date: string) =>
        meetings.filter(
            (meeting) => getMeetingDate(meeting.meeting_date) === date
        );

    const selectedMeetings = meetingsForDate(selectedDate).sort(
        (a, b) =>
            (a.start_time || "").localeCompare(b.start_time || "")
    );

    const today = new Date();
    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const monthMeetingCount = meetings.filter((meeting) => {
        const date = getMeetingDate(meeting.meeting_date);

        return (
            date.startsWith(
                `${year}-${String(month + 1).padStart(2, "0")}`
            )
        );
    }).length;

    const changeMonth = (offset: number) => {
        setCurrentMonth(
            new Date(year, month + offset, 1)
        );
    };

    const selectToday = () => {
        setCurrentMonth(
            new Date(today.getFullYear(), today.getMonth(), 1)
        );
        setSelectedDate(todayKey);
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <main className="min-w-0 flex-1">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <div className="h-[calc(100vh-64px)] overflow-y-auto p-4 lg:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Meeting Management / Calendar
                                </p>

                                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                                    Meeting Calendar
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    View and manage your scheduled meetings.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={selectToday}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Today
                                </button>

                                <button
                                    type="button"
                                    onClick={fetchMeetings}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    <RefreshCw
                                        size={16}
                                        className={loading ? "animate-spin" : ""}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <span>{error}</span>

                                <button
                                    type="button"
                                    onClick={fetchMeetings}
                                    className="font-semibold underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Meetings This Month
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {loading ? "—" : monthMeetingCount}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                        <CalendarDays size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Meetings on Selected Date
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {loading ? "—" : selectedMeetings.length}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
                            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {currentMonth.toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "long",
                                                    year: "numeric",
                                                }
                                            )}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Select a date to view its meetings.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(-1)}
                                            aria-label="Previous month"
                                            className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => changeMonth(1)}
                                            aria-label="Next month"
                                            className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 sm:p-5">
                                    <div className="grid grid-cols-7">
                                        {[
                                            "Mon",
                                            "Tue",
                                            "Wed",
                                            "Thu",
                                            "Fri",
                                            "Sat",
                                            "Sun",
                                        ].map((day) => (
                                            <div
                                                key={day}
                                                className="py-3 text-center text-xs font-semibold text-gray-500 sm:text-sm"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day, index) => {
                                            if (day === null) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className="min-h-16 rounded-xl sm:min-h-24"
                                                    />
                                                );
                                            }

                                            const date = dateKey(day);
                                            const dayMeetings =
                                                meetingsForDate(date);
                                            const isSelected =
                                                selectedDate === date;
                                            const isToday =
                                                todayKey === date;

                                            return (
                                                <button
                                                    key={date}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedDate(date)
                                                    }
                                                    className={`min-h-16 min-w-0 rounded-xl border p-1 text-left transition sm:min-h-24 sm:p-2 ${
                                                        isSelected
                                                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                                                            : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                                                            isToday
                                                                ? "bg-indigo-600 text-white"
                                                                : isSelected
                                                                  ? "text-indigo-700"
                                                                  : "text-gray-700"
                                                        }`}
                                                    >
                                                        {day}
                                                    </span>

                                                    {dayMeetings.length > 0 && (
                                                        <div className="mt-1 space-y-1">
                                                            <div className="hidden truncate rounded-md bg-indigo-100 px-1.5 py-1 text-xs font-medium text-indigo-700 sm:block">
                                                                {dayMeetings.length}{" "}
                                                                {dayMeetings.length === 1
                                                                    ? "meeting"
                                                                    : "meetings"}
                                                            </div>

                                                            <div className="flex flex-wrap gap-1 sm:hidden">
                                                                {dayMeetings
                                                                    .slice(0, 4)
                                                                    .map((meeting) => (
                                                                        <span
                                                                            key={meeting.id}
                                                                            className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                                                                        />
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full bg-indigo-600" />
                                            Today
                                        </span>

                                        <span className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-indigo-50" />
                                            Selected date
                                        </span>

                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                            Has meetings
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                                <div className="border-b border-gray-100 p-5">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Daily Schedule
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {new Date(
                                            `${selectedDate}T12:00:00`
                                        ).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <LoaderCircle
                                            size={28}
                                            className="animate-spin text-indigo-600"
                                        />
                                    </div>
                                ) : selectedMeetings.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <CalendarDays
                                            size={36}
                                            className="mx-auto text-gray-300"
                                        />

                                        <p className="mt-3 font-semibold text-gray-700">
                                            No meetings scheduled
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            There are no meetings for this date.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {selectedMeetings.map((meeting) => (
                                            <Link
                                                key={meeting.id}
                                                to={`/meeting-management/meetings/${meeting.id}`}
                                                className="block p-5 transition hover:bg-gray-50"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 h-12 w-1 shrink-0 rounded-full bg-indigo-500" />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {meeting.title}
                                                            </h3>

                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                    statusClasses[
                                                                        meeting.status ||
                                                                            "scheduled"
                                                                    ] ||
                                                                    "bg-gray-100 text-gray-700"
                                                                }`}
                                                            >
                                                                {formatStatus(
                                                                    meeting.status
                                                                )}
                                                            </span>
                                                        </div>

                                                        {meeting.meeting_number && (
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {meeting.meeting_number}
                                                            </p>
                                                        )}

                                                        <div className="mt-3 space-y-2 text-sm text-gray-500">
                                                            {(meeting.start_time ||
                                                                meeting.end_time) && (
                                                                <p className="flex items-center gap-2">
                                                                    <Clock
                                                                        size={15}
                                                                    />

                                                                    {formatTime(
                                                                        meeting.start_time
                                                                    )}

                                                                    {meeting.end_time &&
                                                                        ` - ${formatTime(meeting.end_time)}`}
                                                                </p>
                                                            )}

                                                            {meeting.location && (
                                                                <p className="flex items-center gap-2">
                                                                    <MapPin
                                                                        size={15}
                                                                    />
                                                                    <span className="break-words">
                                                                        {meeting.location}
                                                                    </span>
                                                                </p>
                                                            )}

                                                            {meeting.meeting_link && (
                                                                <p className="flex items-center gap-2">
                                                                    <Video
                                                                        size={15}
                                                                    />
                                                                    Online meeting
                                                                </p>
                                                            )}
                                                        </div>

                                                        {meeting.description && (
                                                            <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                                                                {meeting.description}
                                                            </p>
                                                        )}

                                                        <p className="mt-3 text-xs font-semibold text-indigo-600">
                                                            View meeting details
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
