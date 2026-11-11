import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    Clock3,
    FileText,
    LoaderCircle,
    RefreshCw,
    Save,
    ShieldCheck,
} from "lucide-react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    meeting_type: string;
    status: string;
}

interface MeetingMinute {
    id: number;
    meeting_id: number;
    discussion_summary: string | null;
    decisions: string | null;
    status: "draft" | "approved" | string;
    prepared_by?: number | null;
    approved_by?: number | null;
    approved_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function normalizeList<T>(responseData: any): T[] {
    if (Array.isArray(responseData?.data?.data)) {
        return responseData.data.data;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.results)) {
        return responseData.results;
    }

    return [];
}

function formatDate(date?: string | null) {
    if (!date) return "--";

    const dateOnly = date.slice(0, 10);
    const parsedDate = new Date(`${dateOnly}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(time?: string | null) {
    if (!time) return "--";

    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return time;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatStatus(status?: string | null) {
    if (!status) return "Not prepared";

    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({ status }: { status?: string | null }) {
    const normalizedStatus = status?.toLowerCase();

    const styles =
        normalizedStatus === "approved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : normalizedStatus === "draft"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-slate-100 text-slate-600";

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
        >
            {formatStatus(status)}
        </span>
    );
}

export default function MeetingMinutes() {
    const navigate = useNavigate();
    const { meetingId } = useParams<{ meetingId: string }>();

    const [openSidebar, setOpenSidebar] = useState(false);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState(
        meetingId ?? "",
    );

    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [meetingsError, setMeetingsError] = useState("");

    const [minutes, setMinutes] = useState<MeetingMinute | null>(null);
    const [discussionSummary, setDiscussionSummary] = useState("");
    const [decisions, setDecisions] = useState("");

    const [minutesLoading, setMinutesLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [pageError, setPageError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const selectedMeeting = meetings.find(
        (meeting) => String(meeting.id) === selectedMeetingId,
    );

    const isApproved = minutes?.status?.toLowerCase() === "approved";

    const fetchMeetings = useCallback(async () => {
        setMeetingsLoading(true);
        setMeetingsError("");

        try {
            const response = await api.get(
                "/meeting-management/meetings",
                {
                    params: {
                        per_page: 100,
                        sort_by: "meeting_date",
                        sort_direction: "desc",
                    },
                },
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message ||
                        "Failed to load meetings.",
                );
            }

            const records = normalizeList<Meeting>(response.data);

            setMeetings(records);

            setSelectedMeetingId((current) => {
                if (
                    current &&
                    records.some(
                        (meeting) => String(meeting.id) === current,
                    )
                ) {
                    return current;
                }

                if (
                    meetingId &&
                    records.some(
                        (meeting) => String(meeting.id) === meetingId,
                    )
                ) {
                    return meetingId;
                }

                return records.length > 0
                    ? String(records[0].id)
                    : "";
            });
        } catch (error: any) {
            setMeetingsError(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load meetings.",
            );
        } finally {
            setMeetingsLoading(false);
        }
    }, [meetingId]);

    const fetchMinutes = useCallback(async () => {
        if (!selectedMeetingId) {
            setMinutes(null);
            setDiscussionSummary("");
            setDecisions("");
            return;
        }

        setMinutesLoading(true);
        setPageError("");
        setSuccessMessage("");

        try {
            const response = await api.get(
                `/meeting-management/meetings/${selectedMeetingId}/minutes`,
            );

            const minute = response.data?.data ?? null;

            setMinutes(minute);
            setDiscussionSummary(minute?.discussion_summary ?? "");
            setDecisions(minute?.decisions ?? "");
        } catch (error: any) {
            setMinutes(null);
            setDiscussionSummary("");
            setDecisions("");

            setPageError(
                error?.response?.data?.message ||
                    "Meeting minutes could not be loaded.",
            );
        } finally {
            setMinutesLoading(false);
            setRefreshing(false);
        }
    }, [selectedMeetingId]);

    useEffect(() => {
        void fetchMeetings();
    }, [fetchMeetings]);

    useEffect(() => {
        void fetchMinutes();
    }, [fetchMinutes]);

    const refreshPage = async () => {
        setRefreshing(true);
        setPageError("");
        setSuccessMessage("");

        await fetchMinutes();

        setRefreshing(false);
    };

    const handleSave = async () => {
        if (!selectedMeetingId) {
            setPageError("Please select a meeting.");
            return;
        }

        setSaving(true);
        setPageError("");
        setSuccessMessage("");

        try {
            const response = await api.put(
                `/meeting-management/meetings/${selectedMeetingId}/minutes`,
                {
                    discussion_summary: discussionSummary.trim() || null,
                    decisions: decisions.trim() || null,
                },
            );

            const savedMinute = response.data?.data ?? null;

            setMinutes(savedMinute);
            setDiscussionSummary(
                savedMinute?.discussion_summary ?? discussionSummary,
            );
            setDecisions(savedMinute?.decisions ?? decisions);

            setSuccessMessage(
                response.data?.message ||
                    "Meeting minutes saved successfully.",
            );
        } catch (error: any) {
            const validation = error?.response?.data?.errors;

            setPageError(
                validation
                    ? Object.values(validation).flat().join(" ")
                    : error?.response?.data?.message ||
                          "Meeting minutes could not be saved.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedMeetingId || !minutes) {
            setPageError("Please save the meeting minutes first.");
            return;
        }

        if (
            !window.confirm(
                "Are you sure you want to approve these meeting minutes?",
            )
        ) {
            return;
        }

        setApproving(true);
        setPageError("");
        setSuccessMessage("");

        try {
            const response = await api.patch(
                `/meeting-management/meetings/${selectedMeetingId}/minutes/approve`,
            );

            const approvedMinute = response.data?.data;

            if (approvedMinute) {
                setMinutes(approvedMinute);
                setDiscussionSummary(
                    approvedMinute.discussion_summary ?? "",
                );
                setDecisions(approvedMinute.decisions ?? "");
            } else {
                await fetchMinutes();
            }

            setSuccessMessage(
                response.data?.message ||
                    "Meeting minutes approved successfully.",
            );
        } catch (error: any) {
            setPageError(
                error?.response?.data?.message ||
                    "Meeting minutes could not be approved.",
            );
        } finally {
            setApproving(false);
        }
    };

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
                    <div className="mx-auto max-w-6xl space-y-5">
                        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <CalendarDays size={16} />
                                    <span>Meeting Management</span>
                                    <span>/</span>
                                    <span className="font-semibold text-slate-800">
                                        Meeting Minutes
                                    </span>
                                </div>

                                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                    Meeting Minutes
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Record meeting discussions and decisions.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className={secondaryButtonClass}
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>

                                <button
                                    type="button"
                                    onClick={refreshPage}
                                    disabled={
                                        refreshing ||
                                        minutesLoading ||
                                        meetingsLoading
                                    }
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
                            </div>
                        </div>

                        {pageError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {pageError}
                            </div>
                        )}

                        {successMessage && (
                            <div
                                role="status"
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                            >
                                {successMessage}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText
                                        size={19}
                                        className="text-indigo-600"
                                    />
                                    <h2 className="font-bold text-slate-900">
                                        Select Meeting
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Select the meeting for which you want to
                                    prepare or review minutes.
                                </p>
                            </div>

                            <div className="space-y-4 p-5">
                                <div>
                                    <label
                                        htmlFor="meeting_id"
                                        className={labelClass}
                                    >
                                        Meeting *
                                    </label>

                                    <select
                                        id="meeting_id"
                                        value={selectedMeetingId}
                                        onChange={(event) => {
                                            setSelectedMeetingId(
                                                event.target.value,
                                            );
                                            setPageError("");
                                            setSuccessMessage("");
                                        }}
                                        disabled={
                                            meetingsLoading ||
                                            meetings.length === 0
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">
                                            {meetingsLoading
                                                ? "Loading meetings..."
                                                : "Select a meeting"}
                                        </option>

                                        {meetings.map((meeting) => (
                                            <option
                                                key={meeting.id}
                                                value={String(meeting.id)}
                                            >
                                                {meeting.meeting_number
                                                    ? `${meeting.meeting_number} - `
                                                    : ""}
                                                {meeting.title}
                                                {" | "}
                                                {formatDate(
                                                    meeting.meeting_date,
                                                )}
                                            </option>
                                        ))}
                                    </select>

                                    {meetingsError && (
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-red-600">
                                            <span>{meetingsError}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void fetchMeetings()
                                                }
                                                className="font-semibold underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    )}

                                    {!meetingsLoading &&
                                        !meetingsError &&
                                        meetings.length === 0 && (
                                            <p className="mt-2 text-sm text-slate-500">
                                                No meetings found. Create a
                                                meeting first.
                                            </p>
                                        )}
                                </div>

                                {selectedMeeting && (
                                    <div className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">
                                                Meeting Number
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-800">
                                                {selectedMeeting.meeting_number ||
                                                    "--"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-500">
                                                Meeting Date
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">
                                                <CalendarDays size={15} />
                                                {formatDate(
                                                    selectedMeeting.meeting_date,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-500">
                                                Meeting Time
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">
                                                <Clock3 size={15} />
                                                {formatTime(
                                                    selectedMeeting.start_time,
                                                )}
                                                {" - "}
                                                {formatTime(
                                                    selectedMeeting.end_time,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-500">
                                                Minutes Status
                                            </p>
                                            <div className="mt-1">
                                                <StatusBadge
                                                    status={minutes?.status}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <FileText size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Minutes Details
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Discussion summary and final
                                            decisions
                                        </p>
                                    </div>
                                </div>

                                <StatusBadge status={minutes?.status} />
                            </div>

                            {minutesLoading ? (
                                <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                                    <LoaderCircle
                                        size={22}
                                        className="animate-spin text-indigo-600"
                                    />
                                    Loading meeting minutes...
                                </div>
                            ) : !selectedMeetingId ? (
                                <div className="p-10 text-center text-sm text-slate-500">
                                    Select a meeting to view its minutes.
                                </div>
                            ) : (
                                <div className="space-y-6 p-5 lg:p-6">
                                    {!minutes && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                            Minutes have not been prepared for
                                            this meeting. Enter the details
                                            below and save to create a draft.
                                        </div>
                                    )}

                                    {isApproved && (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                            These minutes are approved. Saving
                                            changes will change their status
                                            back to Draft according to the
                                            current backend implementation.
                                        </div>
                                    )}

                                    <div>
                                        <label
                                            htmlFor="discussion_summary"
                                            className={labelClass}
                                        >
                                            Discussion Summary
                                        </label>

                                        <textarea
                                            id="discussion_summary"
                                            rows={7}
                                            maxLength={20000}
                                            value={discussionSummary}
                                            onChange={(event) =>
                                                setDiscussionSummary(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Write the main topics discussed, important observations, and meeting proceedings..."
                                            className={inputClass}
                                            disabled={saving || approving}
                                        />

                                        <p className="mt-1.5 text-right text-xs text-slate-400">
                                            {discussionSummary.length.toLocaleString()}{" "}
                                            characters
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="decisions"
                                            className={labelClass}
                                        >
                                            Decisions
                                        </label>

                                        <textarea
                                            id="decisions"
                                            rows={7}
                                            maxLength={20000}
                                            value={decisions}
                                            onChange={(event) =>
                                                setDecisions(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Record the decisions agreed upon during the meeting..."
                                            className={inputClass}
                                            disabled={saving || approving}
                                        />

                                        <p className="mt-1.5 text-right text-xs text-slate-400">
                                            {decisions.length.toLocaleString()}{" "}
                                            characters
                                        </p>
                                    </div>

                                    {minutes && (
                                        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Last Updated
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                                    {minutes.updated_at
                                                        ? new Date(
                                                              minutes.updated_at,
                                                          ).toLocaleString(
                                                              "en-GB",
                                                          )
                                                        : "--"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Approved At
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                                    {minutes.approved_at
                                                        ? new Date(
                                                              minutes.approved_at,
                                                          ).toLocaleString(
                                                              "en-GB",
                                                          )
                                                        : "--"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs text-slate-500">
                                            Save your minutes as a draft before
                                            requesting approval.
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate(-1)}
                                                disabled={saving || approving}
                                                className={secondaryButtonClass}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleSave()
                                                }
                                                disabled={
                                                    saving ||
                                                    approving ||
                                                    minutesLoading
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <LoaderCircle
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Save size={16} />
                                                )}
                                                {saving
                                                    ? "Saving..."
                                                    : "Save Draft"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleApprove()
                                                }
                                                disabled={
                                                    !minutes ||
                                                    isApproved ||
                                                    saving ||
                                                    approving ||
                                                    minutesLoading
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {approving ? (
                                                    <LoaderCircle
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : isApproved ? (
                                                    <ShieldCheck size={16} />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                                {approving
                                                    ? "Approving..."
                                                    : isApproved
                                                      ? "Approved"
                                                      : "Approve Minutes"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
