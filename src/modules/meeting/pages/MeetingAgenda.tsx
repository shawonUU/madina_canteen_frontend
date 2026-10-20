
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    X,
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
    status?: string;
};

type Agenda = {
    id: number;
    meeting_id: number;
    title: string;
    description?: string | null;
    presenter?: string | null;
    duration_minutes?: number | null;
    sort_order?: number;
};

type AgendaForm = {
    title: string;
    description: string;
    presenter: string;
    duration_minutes: string;
    sort_order: string;
};

const initialForm: AgendaForm = {
    title: "",
    description: "",
    presenter: "",
    duration_minutes: "15",
    sort_order: "1",
};

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

function getRows<T>(response: any): T[] {
    const data = response?.data?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

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

export default function MeetingAgenda() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [agendas, setAgendas] = useState<Agenda[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState("");
    const [form, setForm] = useState<AgendaForm>(initialForm);
    const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);

    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchMeetings = useCallback(async () => {
        setMeetingsLoading(true);

        try {
            const response = await api.get("/meeting-management/meetings");
            const rows = getRows<Meeting>(response);

            setMeetings(rows);

            setSelectedMeetingId((current) => {
                if (current && rows.some((meeting) => String(meeting.id) === current)) {
                    return current;
                }

                return rows.length ? String(rows[0].id) : "";
            });
        } catch (err: any) {
            setError(getErrorMessage(err, "Meetings could not be loaded."));
        } finally {
            setMeetingsLoading(false);
        }
    }, []);

    const fetchAgendas = useCallback(async () => {
        if (!selectedMeetingId) {
            setAgendas([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                `/meeting-management/meetings/${selectedMeetingId}/agendas`
            );

            const rows = getRows<Agenda>(response);

            setAgendas(
                [...rows].sort(
                    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                )
            );
        } catch (err: any) {
            setAgendas([]);
            setError(
                getErrorMessage(
                    err,
                    "Agenda items could not be loaded. Please check the Agenda API."
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
        fetchAgendas();
    }, [fetchAgendas]);

    const selectedMeeting = meetings.find(
        (meeting) => String(meeting.id) === selectedMeetingId
    );

    const resetForm = () => {
        setForm({
            ...initialForm,
            sort_order: String(agendas.length + 1),
        });
        setEditingAgenda(null);
    };

    const handleMeetingChange = (value: string) => {
        setSelectedMeetingId(value);
        setError("");
        setSuccess("");
        setEditingAgenda(null);
        setForm(initialForm);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!selectedMeetingId) {
            setError("Please select a meeting.");
            return;
        }

        if (!form.title.trim()) {
            setError("Please enter the agenda title.");
            return;
        }

        const duration = Number(form.duration_minutes);
        const sortOrder = Number(form.sort_order);

        if (!Number.isInteger(duration) || duration < 1) {
            setError("Duration must be a positive whole number.");
            return;
        }

        if (!Number.isInteger(sortOrder) || sortOrder < 1) {
            setError("Agenda order must be a positive whole number.");
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            presenter: form.presenter.trim() || null,
            duration_minutes: duration,
            sort_order: sortOrder,
        };

        setSaving(true);

        try {
            if (editingAgenda) {
                await api.patch(
                    `/meeting-management/meetings/${selectedMeetingId}/agendas/${editingAgenda.id}`,
                    payload
                );

                setSuccess("Agenda updated successfully.");
            } else {
                await api.post(
                    `/meeting-management/meetings/${selectedMeetingId}/agendas`,
                    payload
                );

                setSuccess("Agenda added successfully.");
            }

            resetForm();
            await fetchAgendas();
        } catch (err: any) {
            setError(
                getErrorMessage(err, "Agenda could not be saved.")
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (agenda: Agenda) => {
        setEditingAgenda(agenda);

        setForm({
            title: agenda.title || "",
            description: agenda.description || "",
            presenter: agenda.presenter || "",
            duration_minutes: String(agenda.duration_minutes ?? 15),
            sort_order: String(agenda.sort_order ?? 1),
        });

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const deleteAgenda = async (agenda: Agenda) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${agenda.title}"?`
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await api.delete(
                `/meeting-management/meetings/${selectedMeetingId}/agendas/${agenda.id}`
            );

            if (editingAgenda?.id === agenda.id) {
                resetForm();
            }

            setSuccess("Agenda deleted successfully.");
            await fetchAgendas();
        } catch (err: any) {
            setError(
                getErrorMessage(err, "Agenda could not be deleted.")
            );
        }
    };

    const totalMinutes = agendas.reduce(
        (total, agenda) => total + Number(agenda.duration_minutes || 0),
        0
    );

    const formatDate = (date?: string) => {
        if (!date) return "Date not set";

        const parsedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <div className="min-w-0 flex-1">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <main className="min-w-0 flex-1">
                    <div className="h-[calc(100vh-64px)] overflow-y-auto p-4 lg:p-6">
                        <div className="mx-auto max-w-7xl space-y-6">
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
                                    <span>Meeting Agenda</span>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900">
                                    Meeting Agenda
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Organize discussion topics for each meeting.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    fetchMeetings();
                                    fetchAgendas();
                                }}
                                disabled={meetingsLoading || loading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
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

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-1">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                                        <ClipboardList size={21} />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            {editingAgenda
                                                ? "Edit Agenda"
                                                : "Add Agenda"}
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Meeting discussion details
                                        </p>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className={labelClass}>
                                            Select Meeting{" "}
                                            <span className="text-red-500">*</span>
                                        </label>

                                        <select
                                            value={selectedMeetingId}
                                            onChange={(event) =>
                                                handleMeetingChange(event.target.value)
                                            }
                                            className={inputClass}
                                            required
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

                                    <div>
                                        <label className={labelClass}>
                                            Agenda Title{" "}
                                            <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    title: event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                            placeholder="e.g. Review previous meeting"
                                            maxLength={255}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Description
                                        </label>

                                        <textarea
                                            value={form.description}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    description: event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                            rows={4}
                                            placeholder="Describe the discussion topic..."
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Presenter
                                        </label>

                                        <input
                                            type="text"
                                            value={form.presenter}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    presenter: event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                            placeholder="Presenter name"
                                            maxLength={255}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>
                                                Duration (minutes)
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={form.duration_minutes}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        duration_minutes:
                                                            event.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Agenda Order
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={form.sort_order}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        sort_order:
                                                            event.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={
                                                saving ||
                                                !selectedMeetingId ||
                                                meetingsLoading
                                            }
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <LoaderCircle
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : editingAgenda ? (
                                                <Save size={17} />
                                            ) : (
                                                <Plus size={17} />
                                            )}

                                            {saving
                                                ? "Saving..."
                                                : editingAgenda
                                                  ? "Update Agenda"
                                                  : "Add Agenda"}
                                        </button>

                                        {editingAgenda && (
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </section>

                            <section className="space-y-5 xl:col-span-2">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <CalendarDays size={17} />
                                            Selected Meeting
                                        </div>

                                        <p className="mt-2 truncate text-base font-semibold text-gray-900">
                                            {selectedMeeting?.title || "No meeting selected"}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatDate(selectedMeeting?.meeting_date)}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <p className="text-sm text-gray-500">
                                            Total Agenda Items
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-indigo-600">
                                            {agendas.length}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <p className="text-sm text-gray-500">
                                            Estimated Duration
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                            {totalMinutes}{" "}
                                            <span className="text-sm font-medium text-gray-500">
                                                min
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                                        <div>
                                            <h2 className="font-semibold text-gray-900">
                                                Agenda Items
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Discussion topics in meeting order
                                            </p>
                                        </div>

                                        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                            {agendas.length} items
                                        </span>
                                    </div>

                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
                                            <LoaderCircle
                                                size={20}
                                                className="animate-spin"
                                            />
                                            Loading agenda items...
                                        </div>
                                    ) : !selectedMeetingId ? (
                                        <div className="p-12 text-center">
                                            <ClipboardList
                                                size={36}
                                                className="mx-auto text-gray-300"
                                            />

                                            <p className="mt-3 font-medium text-gray-700">
                                                Select a meeting
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Select a meeting to view its agenda.
                                            </p>
                                        </div>
                                    ) : agendas.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <ClipboardList
                                                size={36}
                                                className="mx-auto text-gray-300"
                                            />

                                            <p className="mt-3 font-medium text-gray-700">
                                                No agenda items yet
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Add the first agenda using the form.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {agendas.map((agenda, index) => (
                                                <div
                                                    key={agenda.id}
                                                    className="p-5 transition hover:bg-gray-50/70"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-700">
                                                            {agenda.sort_order ??
                                                                index + 1}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="break-words font-semibold text-gray-900">
                                                                {agenda.title}
                                                            </h3>

                                                            {agenda.description && (
                                                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                                                    {agenda.description}
                                                                </p>
                                                            )}

                                                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                                                                {agenda.presenter && (
                                                                    <span>
                                                                        Presenter:{" "}
                                                                        <span className="font-medium text-gray-700">
                                                                            {agenda.presenter}
                                                                        </span>
                                                                    </span>
                                                                )}

                                                                <span>
                                                                    Duration:{" "}
                                                                    <span className="font-medium text-gray-700">
                                                                        {agenda.duration_minutes ??
                                                                            0}{" "}
                                                                        min
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    startEditing(agenda)
                                                                }
                                                                title="Edit agenda"
                                                                className="rounded-lg p-2 text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    deleteAgenda(agenda)
                                                                }
                                                                title="Delete agenda"
                                                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
