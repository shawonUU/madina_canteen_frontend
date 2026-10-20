
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    ClipboardCheck,
    LoaderCircle,
    RefreshCw,
    Save,
    Search,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

type Meeting = {
    id: number;
    meeting_number?: string;
    title: string;
    meeting_date?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
};

type Participant = {
    id: number;
    meeting_id: number;
    employee_id?: number | null;
    guest_name?: string | null;
    guest_company?: string | null;
    employee?: {
        id?: number;
        name?: string;
        employee_name?: string;
    };
    user?: {
        name?: string;
    };
    name?: string;
    participation_type?: string;
    invitation_status?: string;
    attendance_status?: string | null;
};

type AttendanceStatus = "present" | "absent" | "late";

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function getRows<T>(response: any): T[] {
    const data = response?.data?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(response?.data)) return response.data;

    return [];
}

function getErrorMessage(error: any, fallback: string) {
    const errors = error?.response?.data?.errors;

    if (errors && typeof errors === "object") {
        const firstError = Object.values(errors).flat()[0];

        if (typeof firstError === "string") {
            return firstError;
        }
    }

    return error?.response?.data?.message || fallback;
}

function getParticipantName(participant: Participant) {
    return (
        participant.employee?.name ||
        participant.employee?.employee_name ||
        participant.guest_name ||
        participant.user?.name ||
        participant.name ||
        (participant.employee_id
            ? `Employee #${participant.employee_id}`
            : `Participant #${participant.id}`)
    );
}

function normalizeAttendance(
    status?: string | null
): AttendanceStatus | "" {
    const value = String(status || "").toLowerCase();

    if (value === "present") return "present";
    if (value === "absent") return "absent";
    if (value === "late") return "late";

    return "";
}

function formatDate(date?: string) {
    if (!date) return "Date not set";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function MeetingAttendance() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [attendance, setAttendance] = useState<Record<number, string>>({});
    const [savedAttendance, setSavedAttendance] = useState<
        Record<number, string>
    >({});

    const [selectedMeetingId, setSelectedMeetingId] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [savingIds, setSavingIds] = useState<number[]>([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchMeetings = useCallback(async () => {
        setMeetingsLoading(true);

        try {
            const response = await api.get("/meeting-management/meetings");
            const rows = getRows<Meeting>(response);

            setMeetings(rows);

            setSelectedMeetingId((current) => {
                if (
                    current &&
                    rows.some((meeting) => String(meeting.id) === current)
                ) {
                    return current;
                }

                return rows.length ? String(rows[0].id) : "";
            });
        } catch (err: any) {
            setError(
                getErrorMessage(err, "Meetings could not be loaded.")
            );
        } finally {
            setMeetingsLoading(false);
        }
    }, []);

    const fetchParticipants = useCallback(async () => {
        if (!selectedMeetingId) {
            setParticipants([]);
            setAttendance({});
            setSavedAttendance({});
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.get(
                `/meeting-management/meetings/${selectedMeetingId}/participants`
            );

            const rows = getRows<Participant>(response);

            setParticipants(rows);

            const initialAttendance: Record<number, string> = {};

            rows.forEach((participant) => {
                initialAttendance[participant.id] = normalizeAttendance(
                    participant.attendance_status
                );
            });

            setAttendance(initialAttendance);
            setSavedAttendance(initialAttendance);
        } catch (err: any) {
            setParticipants([]);
            setAttendance({});
            setSavedAttendance({});

            setError(
                getErrorMessage(
                    err,
                    "Participants could not be loaded. Please check the API."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [selectedMeetingId]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const selectedMeeting = meetings.find(
        (meeting) => String(meeting.id) === selectedMeetingId
    );

    const filteredParticipants = useMemo(() => {
        return participants.filter((participant) => {
            const name = getParticipantName(participant).toLowerCase();
            const company = (participant.guest_company || "").toLowerCase();
            const query = search.trim().toLowerCase();

            const matchesSearch =
                !query ||
                name.includes(query) ||
                company.includes(query);

            const currentStatus = attendance[participant.id] || "unmarked";

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "unmarked"
                    ? !attendance[participant.id]
                    : currentStatus === statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [participants, attendance, search, statusFilter]);

    const markedCount = participants.filter(
        (participant) => Boolean(attendance[participant.id])
    ).length;

    const presentCount = participants.filter(
        (participant) => attendance[participant.id] === "present"
    ).length;

    const absentCount = participants.filter(
        (participant) => attendance[participant.id] === "absent"
    ).length;

    const lateCount = participants.filter(
        (participant) => attendance[participant.id] === "late"
    ).length;

    const dirtyCount = participants.filter(
        (participant) =>
            (attendance[participant.id] || "") !==
            (savedAttendance[participant.id] || "")
    ).length;

    const changeAttendance = (
        participantId: number,
        value: string
    ) => {
        setAttendance((current) => ({
            ...current,
            [participantId]: value,
        }));

        setError("");
        setSuccess("");
    };

    const saveParticipant = async (participant: Participant) => {
        const value = attendance[participant.id];

        if (!value) {
            setError("Please select an attendance status.");
            return;
        }

        setError("");
        setSuccess("");
        setSavingIds((current) => [...current, participant.id]);

        try {
            await api.patch(
                `/meeting-management/meetings/${selectedMeetingId}/participants/${participant.id}`,
                {
                    attendance_status: value,
                }
            );

            setSavedAttendance((current) => ({
                ...current,
                [participant.id]: value,
            }));

            setParticipants((current) =>
                current.map((item) =>
                    item.id === participant.id
                        ? { ...item, attendance_status: value }
                        : item
                )
            );

            setSuccess(
                `Attendance saved for ${getParticipantName(participant)}.`
            );
        } catch (err: any) {
            setError(
                getErrorMessage(
                    err,
                    "Attendance could not be saved."
                )
            );
        } finally {
            setSavingIds((current) =>
                current.filter((id) => id !== participant.id)
            );
        }
    };

    const saveAllAttendance = async () => {
        const changedParticipants = participants.filter(
            (participant) =>
                (attendance[participant.id] || "") !==
                (savedAttendance[participant.id] || "")
        );

        if (changedParticipants.length === 0) {
            setError("There are no unsaved attendance changes.");
            return;
        }

        const unmarkedChanged = changedParticipants.some(
            (participant) => !attendance[participant.id]
        );

        if (unmarkedChanged) {
            setError(
                "Please select an attendance status for every changed participant."
            );
            return;
        }

        setSavingAll(true);
        setError("");
        setSuccess("");

        const failedIds: number[] = [];
        const successfulUpdates: Record<number, string> = {};

        try {
            for (const participant of changedParticipants) {
                try {
                    await api.patch(
                        `/meeting-management/meetings/${selectedMeetingId}/participants/${participant.id}`,
                        {
                            attendance_status: attendance[participant.id],
                        }
                    );

                    successfulUpdates[participant.id] =
                        attendance[participant.id];
                } catch {
                    failedIds.push(participant.id);
                }
            }

            if (Object.keys(successfulUpdates).length > 0) {
                setSavedAttendance((current) => ({
                    ...current,
                    ...successfulUpdates,
                }));

                setParticipants((current) =>
                    current.map((participant) =>
                        successfulUpdates[participant.id]
                            ? {
                                  ...participant,
                                  attendance_status:
                                      successfulUpdates[participant.id],
                              }
                            : participant
                    )
                );
            }

            if (failedIds.length > 0) {
                setError(
                    `${failedIds.length} attendance record(s) could not be saved. Please try again.`
                );
            } else {
                setSuccess(
                    `Attendance saved for ${changedParticipants.length} participant(s).`
                );
            }
        } finally {
            setSavingAll(false);
        }
    };

    const markAllPresent = () => {
        setAttendance((current) => {
            const updated = { ...current };

            filteredParticipants.forEach((participant) => {
                updated[participant.id] = "present";
            });

            return updated;
        });

        setError("");
        setSuccess("");
    };

    const statusClass = (status: string) => {
        switch (status) {
            case "present":
                return "bg-emerald-50 text-emerald-700";
            case "absent":
                return "bg-red-50 text-red-700";
            case "late":
                return "bg-amber-50 text-amber-700";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <div className="min-h-screen">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                                    <Link
                                        to="/meeting-management/calendar"
                                        className="inline-flex items-center gap-1 hover:text-indigo-600"
                                    >
                                        <ArrowLeft size={15} />
                                        Meeting Management
                                    </Link>

                                    <span>/</span>
                                    <span>Meeting Attendance</span>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900">
                                    Meeting Attendance
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Record and manage meeting attendance.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    fetchMeetings();
                                    fetchParticipants();
                                }}
                                disabled={meetingsLoading || loading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        meetingsLoading || loading
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                                Refresh
                            </button>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                role="status"
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                            >
                                {success}
                            </div>
                        )}

                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Select Meeting
                                    </label>

                                    <select
                                        value={selectedMeetingId}
                                        onChange={(event) =>
                                            setSelectedMeetingId(
                                                event.target.value
                                            )
                                        }
                                        className={inputClass}
                                        disabled={meetingsLoading}
                                    >
                                        <option value="">
                                            {meetingsLoading
                                                ? "Loading meetings..."
                                                : "Select a meeting"}
                                        </option>

                                        {meetings.map((meeting) => (
                                            <option
                                                key={meeting.id}
                                                value={meeting.id}
                                            >
                                                {meeting.meeting_number
                                                    ? `${meeting.meeting_number} - `
                                                    : ""}
                                                {meeting.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                        <CalendarDays
                                            size={20}
                                            className="text-indigo-600"
                                        />

                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedMeeting?.title ||
                                                    "No meeting selected"}
                                            </p>

                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {formatDate(
                                                    selectedMeeting?.meeting_date
                                                )}
                                                {selectedMeeting?.start_time
                                                    ? ` • ${selectedMeeting.start_time}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users size={17} />
                                    Total Participants
                                </div>

                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {participants.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Present
                                </p>

                                <p className="mt-2 text-2xl font-bold text-emerald-600">
                                    {presentCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Absent
                                </p>

                                <p className="mt-2 text-2xl font-bold text-red-600">
                                    {absentCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Late
                                </p>

                                <p className="mt-2 text-2xl font-bold text-amber-600">
                                    {lateCount}
                                </p>
                            </div>
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center">
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Participant Attendance
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {markedCount} of {participants.length}{" "}
                                        participants marked
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={markAllPresent}
                                        disabled={
                                            loading ||
                                            filteredParticipants.length === 0
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <Check size={16} />
                                        Mark All Present
                                    </button>

                                    <button
                                        type="button"
                                        onClick={saveAllAttendance}
                                        disabled={
                                            savingAll ||
                                            loading ||
                                            dirtyCount === 0
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {savingAll ? (
                                            <LoaderCircle
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Save size={16} />
                                        )}

                                        {savingAll
                                            ? "Saving..."
                                            : `Save Changes${dirtyCount ? ` (${dirtyCount})` : ""}`}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-5 md:grid-cols-2">
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search participant..."
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="all">
                                        All Attendance Statuses
                                    </option>
                                    <option value="unmarked">
                                        Not Marked
                                    </option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
                                    <LoaderCircle
                                        size={20}
                                        className="animate-spin"
                                    />
                                    Loading participants...
                                </div>
                            ) : !selectedMeetingId ? (
                                <div className="p-12 text-center">
                                    <ClipboardCheck
                                        size={36}
                                        className="mx-auto text-gray-300"
                                    />

                                    <p className="mt-3 font-medium text-gray-700">
                                        Select a meeting
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Select a meeting to manage its attendance.
                                    </p>
                                </div>
                            ) : filteredParticipants.length === 0 ? (
                                <div className="p-12 text-center">
                                    <ClipboardCheck
                                        size={36}
                                        className="mx-auto text-gray-300"
                                    />

                                    <p className="mt-3 font-medium text-gray-700">
                                        No participants found
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Add participants to the meeting or change your filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left">
                                        <thead className="bg-gray-50">
                                            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                <th className="px-5 py-3">
                                                    Participant
                                                </th>
                                                <th className="px-5 py-3">
                                                    Type
                                                </th>
                                                <th className="px-5 py-3">
                                                    Attendance
                                                </th>
                                                <th className="px-5 py-3">
                                                    Saved Status
                                                </th>
                                                <th className="px-5 py-3 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100">
                                            {filteredParticipants.map(
                                                (participant) => {
                                                    const currentStatus =
                                                        attendance[
                                                            participant.id
                                                        ] || "";

                                                    const savedStatus =
                                                        savedAttendance[
                                                            participant.id
                                                        ] || "";

                                                    const isDirty =
                                                        currentStatus !==
                                                        savedStatus;

                                                    const isSaving =
                                                        savingIds.includes(
                                                            participant.id
                                                        ) || savingAll;

                                                    const isGuest =
                                                        !participant.employee_id &&
                                                        Boolean(
                                                            participant.guest_name
                                                        );

                                                    return (
                                                        <tr
                                                            key={participant.id}
                                                            className="transition hover:bg-gray-50/70"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <p className="font-medium text-gray-900">
                                                                    {getParticipantName(
                                                                        participant
                                                                    )}
                                                                </p>

                                                                {participant.guest_company && (
                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {
                                                                            participant.guest_company
                                                                        }
                                                                    </p>
                                                                )}

                                                                <p className="mt-1 text-xs text-gray-400">
                                                                    {participant.participation_type ===
                                                                    "optional"
                                                                        ? "Optional participant"
                                                                        : "Required participant"}
                                                                </p>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                                    {isGuest
                                                                        ? "Guest"
                                                                        : "Employee"}
                                                                </span>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <select
                                                                    value={
                                                                        currentStatus
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        changeAttendance(
                                                                            participant.id,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSaving
                                                                    }
                                                                    className={`${inputClass} min-w-32`}
                                                                >
                                                                    <option value="">
                                                                        Select status
                                                                    </option>
                                                                    <option value="present">
                                                                        Present
                                                                    </option>
                                                                    <option value="absent">
                                                                        Absent
                                                                    </option>
                                                                    <option value="late">
                                                                        Late
                                                                    </option>
                                                                </select>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                                                        savedStatus
                                                                    )}`}
                                                                >
                                                                    {savedStatus
                                                                        ? savedStatus
                                                                              .charAt(
                                                                                  0
                                                                              )
                                                                              .toUpperCase() +
                                                                          savedStatus.slice(
                                                                              1
                                                                          )
                                                                        : "Not marked"}
                                                                </span>

                                                                {isDirty && (
                                                                    <p className="mt-1 text-xs text-amber-600">
                                                                        Unsaved
                                                                        changes
                                                                    </p>
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        saveParticipant(
                                                                            participant
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !isDirty ||
                                                                        !currentStatus ||
                                                                        isSaving
                                                                    }
                                                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                                >
                                                                    {savingIds.includes(
                                                                        participant.id
                                                                    ) ? (
                                                                        <LoaderCircle
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : (
                                                                        <Save
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}

                                                                    Save
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
