
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    LoaderCircle,
    Plus,
    RefreshCw,
    Trash2,
    Users,
} from "lucide-react";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";
import Select from "react-select";

type ParticipantType = "employee" | "guest";

type User = {
    id: number;
    name?: string;
    email?: string;
    employee_id?: number;
    employee?: {
        id?: number;
        name?: string;
        employee_name?: string;
    };
};

type Participant = {
    id: number;
    user_id?: number;
    employee_id?: number | null;
    name?: string;
    guest_name?: string;
    guest_company?: string;
    guest_email?: string;
    guest_phone?: string;
    employee?: {
        id?: number;
        name?: string;
        employee_name?: string;
    };
    user?: {
        name?: string;
    };
    email?: string;
    participation_type?: string;
    invitation_status?: string;
    attendance_status?: string;
};

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const badgeClass = (status?: string) =>
    ({
        accepted: "bg-emerald-50 text-emerald-700",
        declined: "bg-red-50 text-red-700",
        pending: "bg-amber-50 text-amber-700",
        present: "bg-emerald-50 text-emerald-700",
        absent: "bg-red-50 text-red-700",
        late: "bg-amber-50 text-amber-700",
    }[String(status || "").toLowerCase()] || "bg-gray-100 text-gray-700");

const pretty = (value?: string) =>
    (value || "pending")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getRows = (response: any): any[] => {
    const rows =
        response?.data?.data?.data ??
        response?.data?.data ??
        response?.data;

    return Array.isArray(rows) ? rows : [];
};

export default function MeetingParticipants() {
    const { id } = useParams();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [participantType, setParticipantType] =
        useState<ParticipantType>("employee");
    const [employeeId, setEmployeeId] = useState("");
    const [participationType, setParticipationType] = useState("required");

    const [guestName, setGuestName] = useState("");
    const [guestCompany, setGuestCompany] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);

        try {
            const response = await api.get("/admin/users");
            setUsers(getRows(response));
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Users could not be loaded."
            );
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchParticipants = useCallback(async () => {
        if (!id) {
            setError("Meeting ID is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                `/meeting-management/meetings/${id}/participants`
            );

            setParticipants(getRows(response));
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Participants could not be loaded. Check the API endpoint."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const userName = (user: User) =>
        user.name ||
        user.employee?.name ||
        user.employee?.employee_name ||
        `User #${user.id}`;

    const participantName = (item: Participant) =>
        item.employee?.name ||
        item.employee?.employee_name ||
        item.guest_name ||
        item.user?.name ||
        item.name ||
        (item.employee_id
            ? `Employee #${item.employee_id}`
            : `Participant #${item.id}`);

    const resetForm = () => {
        setEmployeeId("");
        setGuestName("");
        setGuestCompany("");
        setGuestEmail("");
        setGuestPhone("");
        setParticipationType("required");
    };

    const addParticipant = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!id) {
            setError("Meeting ID is missing.");
            return;
        }

        let payload: Record<string, unknown>;

        if (participantType === "employee") {
            if (!employeeId) {
                setError("Please select an employee.");
                return;
            }

            const selectedUser = users.find(
                (user) => String(user.id) === employeeId
            );

            if (!selectedUser) {
                setError("Selected user could not be found.");
                return;
            }

            const selectedEmployeeId =
                selectedUser.employee_id ??
                selectedUser.employee?.id;

            if (!selectedEmployeeId) {
                setError(
                    "The selected user has no linked employee profile."
                );
                return;
            }

            payload = {
                participant_type: "employee",
                employee_id: Number(selectedEmployeeId),
                participation_type: participationType,
            };
        } else {
            if (!guestName.trim()) {
                setError("Please enter the guest name.");
                return;
            }

            payload = {
                participant_type: "guest",
                guest_name: guestName.trim(),
                guest_company: guestCompany.trim() || null,
                guest_email: guestEmail.trim() || null,
                guest_phone: guestPhone.trim() || null,
                participation_type: participationType,
            };
        }

        setSaving(true);

        try {
            await api.post(
                `/meeting-management/meetings/${id}/participants`,
                payload
            );

            resetForm();
            setSuccess("Participant added successfully.");

            await fetchParticipants();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Participant could not be added."
            );
        } finally {
            setSaving(false);
        }
    };

    const updateParticipant = async (
        participant: Participant,
        field: "invitation_status" | "attendance_status",
        value: string
    ) => {
        setError("");
        setSuccess("");

        try {
            await api.patch(
                `/meeting-management/meetings/${id}/participants/${participant.id}`,
                { [field]: value }
            );

            setParticipants((current) =>
                current.map((item) =>
                    item.id === participant.id
                        ? { ...item, [field]: value }
                        : item
                )
            );

            setSuccess("Participant updated successfully.");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Participant status could not be updated."
            );
        }
    };

    const removeParticipant = async (participant: Participant) => {
        if (
            !window.confirm(
                "Remove this participant from the meeting?"
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await api.delete(
                `/meeting-management/meetings/${id}/participants/${participant.id}`
            );

            setParticipants((current) =>
                current.filter((item) => item.id !== participant.id)
            );

            setSuccess("Participant removed successfully.");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Participant could not be removed."
            );
        }
    };

    const employeeOptions = users.map((user) => ({
        value: user.id,
        label: `${userName(user)}${user.email ? ` (${user.email})` : ""}`,
    }));

    const selectedEmployeeOption =
        employeeOptions.find(
            (option) => String(option.value) === employeeId
        ) ?? null;

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
                    <div className="mx-auto max-w-6xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Meeting Management / Meetings / Participants
                                </p>

                                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                                    Participants & Invitations
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Invite employees and external guests to this meeting.
                                </p>
                            </div>

                            <Link
                                to={`/meeting-management/meetings/${id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft size={17} />
                                Meeting Details
                            </Link>
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

                        <form
                            onSubmit={addParticipant}
                            className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <div className="mb-5">
                                <h2 className="font-semibold text-gray-900">
                                    Add Participant
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Add an employee or an external guest. No email will be sent.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Participant Type *
                                    </label>

                                    <select
                                        className={inputClass}
                                        value={participantType}
                                        onChange={(event) => {
                                            setParticipantType(
                                                event.target.value as ParticipantType
                                            );
                                            setError("");
                                        }}
                                    >
                                        <option value="employee">
                                            Employee
                                        </option>
                                        <option value="guest">
                                            Guest
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Participation Type *
                                    </label>

                                    <select
                                        className={inputClass}
                                        value={participationType}
                                        onChange={(event) =>
                                            setParticipationType(
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="required">
                                            Required
                                        </option>
                                        <option value="optional">
                                            Optional
                                        </option>
                                    </select>
                                </div>

                                {participantType === "employee" ? (
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Select Employee *
                                        </label>

                                        <Select
                                            options={employeeOptions}
                                            value={selectedEmployeeOption}
                                            onChange={(option) =>
                                                setEmployeeId(
                                                    option
                                                        ? String(option.value)
                                                        : ""
                                                )
                                            }
                                            isSearchable
                                            isClearable
                                            isLoading={usersLoading}
                                            placeholder="Search employee by name or email..."
                                            noOptionsMessage={() =>
                                                "No employee found"
                                            }
                                            className="text-sm"
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    minHeight: "42px",
                                                    borderRadius: "12px",
                                                    borderColor: state.isFocused
                                                        ? "#6366f1"
                                                        : "#e5e7eb",
                                                    boxShadow: state.isFocused
                                                        ? "0 0 0 2px #e0e7ff"
                                                        : "none",
                                                    "&:hover": {
                                                        borderColor: "#6366f1",
                                                    },
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 50,
                                                }),
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Guest Name *
                                            </label>

                                            <input
                                                className={inputClass}
                                                value={guestName}
                                                onChange={(event) =>
                                                    setGuestName(event.target.value)
                                                }
                                                placeholder="Enter guest name"
                                                required={
                                                    participantType === "guest"
                                                }
                                                maxLength={255}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Company / Organization
                                            </label>

                                            <input
                                                className={inputClass}
                                                value={guestCompany}
                                                onChange={(event) =>
                                                    setGuestCompany(event.target.value)
                                                }
                                                placeholder="Enter company name"
                                                maxLength={255}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Guest Email (Optional)
                                            </label>

                                            <input
                                                type="email"
                                                className={inputClass}
                                                value={guestEmail}
                                                onChange={(event) =>
                                                    setGuestEmail(event.target.value)
                                                }
                                                placeholder="Enter email address"
                                                maxLength={255}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Guest Phone (Optional)
                                            </label>

                                            <input
                                                className={inputClass}
                                                value={guestPhone}
                                                onChange={(event) =>
                                                    setGuestPhone(event.target.value)
                                                }
                                                placeholder="Enter phone number"
                                                maxLength={30}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        (participantType === "employee" &&
                                            usersLoading)
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Plus size={17} />
                                    )}

                                    {saving
                                        ? "Adding..."
                                        : "Add Participant"}
                                </button>
                            </div>
                        </form>

                        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                        <Users size={21} />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Meeting Participants
                                        </h2>

                                        <p className="text-sm text-gray-500">
                                            {participants.length} participant(s)
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={fetchParticipants}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={15}
                                        className={
                                            loading ? "animate-spin" : ""
                                        }
                                    />
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <LoaderCircle
                                        className="animate-spin text-indigo-600"
                                        size={28}
                                    />
                                </div>
                            ) : participants.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Users
                                        className="mx-auto text-gray-300"
                                        size={36}
                                    />

                                    <p className="mt-3 font-medium text-gray-700">
                                        No participants added
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Select an employee or add a guest above.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px] text-left text-sm">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-5 py-4">
                                                    Participant
                                                </th>
                                                <th className="px-5 py-4">
                                                    Type
                                                </th>
                                                <th className="px-5 py-4">
                                                    Participation
                                                </th>
                                                <th className="px-5 py-4">
                                                    Invitation Status
                                                </th>
                                                <th className="px-5 py-4">
                                                    Attendance
                                                </th>
                                                <th className="px-5 py-4 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100">
                                            {participants.map((item) => {
                                                const isGuest = Boolean(
                                                    item.guest_name
                                                );

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="hover:bg-gray-50/70"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="font-semibold text-gray-900">
                                                                {participantName(
                                                                    item
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {item.guest_company ||
                                                                    item.guest_email ||
                                                                    item.guest_phone ||
                                                                    item.email ||
                                                                    (item.employee_id
                                                                        ? `Employee ID: ${item.employee_id}`
                                                                        : `Participant ID: ${item.id}`)}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                    isGuest
                                                                        ? "bg-purple-50 text-purple-700"
                                                                        : "bg-blue-50 text-blue-700"
                                                                }`}
                                                            >
                                                                {isGuest
                                                                    ? "Guest"
                                                                    : "Employee"}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                                {pretty(
                                                                    item.participation_type ||
                                                                        "required"
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <select
                                                                aria-label={`Invitation status for ${participantName(item)}`}
                                                                className={`${inputClass} max-w-40 ${badgeClass(item.invitation_status)}`}
                                                                value={(
                                                                    item.invitation_status ||
                                                                    "pending"
                                                                ).toLowerCase()}
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateParticipant(
                                                                        item,
                                                                        "invitation_status",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="pending">
                                                                    Pending
                                                                </option>
                                                                <option value="accepted">
                                                                    Accepted
                                                                </option>
                                                                <option value="declined">
                                                                    Declined
                                                                </option>
                                                            </select>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <select
                                                                aria-label={`Attendance for ${participantName(item)}`}
                                                                className={`${inputClass} max-w-40 ${badgeClass(item.attendance_status)}`}
                                                                value={(
                                                                    item.attendance_status ||
                                                                    "pending"
                                                                ).toLowerCase()}
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateParticipant(
                                                                        item,
                                                                        "attendance_status",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="pending">
                                                                    Pending
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

                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                type="button"
                                                                title="Remove participant"
                                                                onClick={() =>
                                                                    removeParticipant(
                                                                        item
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2
                                                                    size={17}
                                                                />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
