
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
} from "lucide-react";
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
    organizer?: {
        name?: string;
        employee?: {
            name?: string;
        };
    };
    organizer_name?: string;
}

interface Invitation {
    id: number;
    meeting_id: number;
    employee_id?: number;
    invitation_status?: string;
    attendance_status?: string;
    participation_type?: string;
    meeting?: Meeting;
    [key: string]: unknown;
}

type StatusFilter = "all" | "pending" | "accepted" | "declined";

const getRows = (response: any): any[] => {
    const data = response?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.data?.data)) {
        return data.data.data;
    }

    return [];
};

const normalizeStatus = (status?: string): string => {
    return (status || "pending").toLowerCase();
};

const formatDate = (date?: string): string => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (time?: string): string => {
    if (!time) return "";

    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
};

const getOrganizerName = (meeting?: Meeting): string => {
    return (
        meeting?.organizer?.employee?.name ||
        meeting?.organizer?.name ||
        meeting?.organizer_name ||
        "Not specified"
    );
};

const getStatusClasses = (status?: string): string => {
    switch (normalizeStatus(status)) {
        case "accepted":
            return "bg-green-100 text-green-700";

        case "declined":
        case "rejected":
            return "bg-red-100 text-red-700";

        default:
            return "bg-amber-100 text-amber-700";
    }
};

const MeetingInvitations = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedInvitation, setSelectedInvitation] =
        useState<Invitation | null>(null);

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                "/meeting-management/my-invitations"
            );

            setInvitations(getRows(response));
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Unable to load your meeting invitations."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const updateInvitationStatus = async (
        invitation: Invitation,
        status: "Accepted" | "Declined"
    ) => {
        setUpdatingId(invitation.id);
        setError("");
        setSuccess("");

        try {
            await api.patch(
                `/meeting-management/meetings/${invitation.meeting_id}/participants/${invitation.id}`,
                {
                    invitation_status: status,
                }
            );

            setInvitations((previous) =>
                previous.map((item) =>
                    item.id === invitation.id
                        ? {
                              ...item,
                              invitation_status: status,
                          }
                        : item
                )
            );

            if (selectedInvitation?.id === invitation.id) {
                setSelectedInvitation({
                    ...selectedInvitation,
                    invitation_status: status,
                });
            }

            setSuccess(
                status === "Accepted"
                    ? "Meeting invitation accepted successfully."
                    : "Meeting invitation declined successfully."
            );
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Unable to update invitation status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredInvitations = useMemo(() => {
        return invitations.filter((invitation) => {
            const meeting = invitation.meeting;
            const status = normalizeStatus(
                invitation.invitation_status
            );

            const searchText = [
                meeting?.title,
                meeting?.meeting_number,
                meeting?.location,
                getOrganizerName(meeting),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchText.includes(
                search.toLowerCase().trim()
            );

            const matchesStatus =
                statusFilter === "all" ||
                status === statusFilter ||
                (statusFilter === "declined" && status === "rejected");

            return matchesSearch && matchesStatus;
        });
    }, [invitations, search, statusFilter]);

    const counts = useMemo(() => {
        return {
            total: invitations.length,
            pending: invitations.filter(
                (item) =>
                    normalizeStatus(item.invitation_status) === "pending"
            ).length,
            accepted: invitations.filter(
                (item) =>
                    normalizeStatus(item.invitation_status) === "accepted"
            ).length,
            declined: invitations.filter((item) =>
                ["declined", "rejected"].includes(
                    normalizeStatus(item.invitation_status)
                )
            ).length,
        };
    }, [invitations]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SideNav />

            <div className="min-w-0 flex-1">
                <TopNav />

                <main className="p-4 md:p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                My Meeting Invitations
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View and respond to meetings you have been
                                invited to.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchInvitations}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                        >
                            {success}
                        </div>
                    )}

                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                label: "Total Invitations",
                                value: counts.total,
                                color: "text-gray-800",
                            },
                            {
                                label: "Pending",
                                value: counts.pending,
                                color: "text-amber-600",
                            },
                            {
                                label: "Accepted",
                                value: counts.accepted,
                                color: "text-green-600",
                            },
                            {
                                label: "Declined",
                                value: counts.declined,
                                color: "text-red-600",
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                            >
                                <p className="text-sm text-gray-500">
                                    {item.label}
                                </p>
                                <p
                                    className={`mt-2 text-2xl font-bold ${item.color}`}
                                >
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search meeting, number, location..."
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="all">All Invitations</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                        </select>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h2 className="font-semibold text-gray-800">
                                Invitation List
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {filteredInvitations.length} invitation(s)
                                found
                            </p>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-500">
                                Loading your invitations...
                            </div>
                        ) : filteredInvitations.length === 0 ? (
                            <div className="p-10 text-center">
                                <CalendarDays
                                    size={36}
                                    className="mx-auto mb-3 text-gray-300"
                                />
                                <p className="font-medium text-gray-700">
                                    No meeting invitations found
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Invitations sent to your account will
                                    appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredInvitations.map((invitation) => {
                                    const meeting = invitation.meeting;
                                    const status = normalizeStatus(
                                        invitation.invitation_status
                                    );
                                    const isPending = status === "pending";

                                    return (
                                        <div
                                            key={invitation.id}
                                            className="p-5 transition hover:bg-gray-50"
                                        >
                                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base font-semibold text-gray-800">
                                                            {meeting?.title ||
                                                                "Untitled Meeting"}
                                                        </h3>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                                                                invitation.invitation_status
                                                            )}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </div>

                                                    {meeting?.meeting_number && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Meeting No:{" "}
                                                            {meeting.meeting_number}
                                                        </p>
                                                    )}

                                                    {meeting?.description && (
                                                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                                            {meeting.description}
                                                        </p>
                                                    )}

                                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarDays
                                                                size={15}
                                                            />
                                                            {formatDate(
                                                                meeting?.meeting_date
                                                            )}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Clock size={15} />
                                                            {formatTime(
                                                                meeting?.start_time
                                                            ) ||
                                                                "Time not specified"}
                                                            {meeting?.end_time
                                                                ? ` - ${formatTime(
                                                                      meeting.end_time
                                                                  )}`
                                                                : ""}
                                                        </span>

                                                        {meeting?.location && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <MapPin
                                                                    size={15}
                                                                />
                                                                {meeting.location}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-3 text-sm text-gray-500">
                                                        Organizer:{" "}
                                                        <span className="font-medium text-gray-700">
                                                            {getOrganizerName(
                                                                meeting
                                                            )}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedInvitation(
                                                                invitation
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Eye size={15} />
                                                        Details
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    updatingId ===
                                                                    invitation.id
                                                                }
                                                                onClick={() =>
                                                                    updateInvitationStatus(
                                                                        invitation,
                                                                        "Accepted"
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                <CheckCircle2
                                                                    size={15}
                                                                />
                                                                Accept
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    updatingId ===
                                                                    invitation.id
                                                                }
                                                                onClick={() =>
                                                                    updateInvitationStatus(
                                                                        invitation,
                                                                        "Declined"
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                <XCircle
                                                                    size={15}
                                                                />
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {selectedInvitation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedInvitation(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invitation-details-title"
                        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2
                                    id="invitation-details-title"
                                    className="text-xl font-semibold text-gray-800"
                                >
                                    Meeting Details
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Invitation information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedInvitation(null)}
                                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
                                aria-label="Close details"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500">Meeting Title</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {selectedInvitation.meeting?.title ||
                                        "Untitled Meeting"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Meeting Number</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {selectedInvitation.meeting
                                        ?.meeting_number || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Date</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {formatDate(
                                        selectedInvitation.meeting?.meeting_date
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Time</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {formatTime(
                                        selectedInvitation.meeting?.start_time
                                    ) || "Not specified"}
                                    {selectedInvitation.meeting?.end_time
                                        ? ` - ${formatTime(
                                              selectedInvitation.meeting.end_time
                                          )}`
                                        : ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Location</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {selectedInvitation.meeting?.location ||
                                        "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Organizer</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {getOrganizerName(
                                        selectedInvitation.meeting
                                    )}
                                </p>
                            </div>

                            {selectedInvitation.meeting?.description && (
                                <div>
                                    <p className="text-gray-500">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap text-gray-700">
                                        {selectedInvitation.meeting.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="text-gray-500">
                                    Invitation Status
                                </p>
                                <span
                                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusClasses(
                                        selectedInvitation.invitation_status
                                    )}`}
                                >
                                    {normalizeStatus(
                                        selectedInvitation.invitation_status
                                    )}
                                </span>
                            </div>

                            {selectedInvitation.meeting?.meeting_link && (
                                <div>
                                    <p className="text-gray-500">
                                        Online Meeting Link
                                    </p>
                                    <a
                                        href={
                                            selectedInvitation.meeting
                                                .meeting_link
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-block break-all text-blue-600 hover:underline"
                                    >
                                        Open Meeting Link
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedInvitation(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingInvitations;
