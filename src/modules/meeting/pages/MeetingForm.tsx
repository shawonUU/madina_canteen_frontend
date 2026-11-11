
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    ChevronDown,
    LoaderCircle,
    Save,
} from "lucide-react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

type FormState = {
    title: string;
    description: string;
    meeting_type: string;
    organizer_id: string;
    chairperson_id: string;
    department_id: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    location: string;
    meeting_link: string;
    status: string;
};

type Option = {
    value: string;
    label: string;
    description?: string;
};

type SearchableDropdownProps = {
    label: string;
    placeholder: string;
    searchPlaceholder: string;
    value: string;
    options: Option[];
    loading: boolean;
    error: string;
    onChange: (value: string) => void;
};

const initialForm: FormState = {
    title: "",
    description: "",
    meeting_type: "internal",
    organizer_id: "",
    chairperson_id: "",
    department_id: "",
    meeting_date: "",
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    meeting_link: "",
    status: "scheduled",
};

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

function normalizeList(responseData: any): any[] {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData?.data?.data)) {
        return responseData.data.data;
    }

    if (Array.isArray(responseData?.results)) {
        return responseData.results;
    }

    return [];
}

function getOptionId(item: any): string {
    const id = item?.id ?? item?.user_id ?? item?.employee_id;
    return id == null ? "" : String(id);
}

function getPersonName(item: any): string {
    const name =
        item?.name ??
        item?.full_name ??
        item?.employee_name ??
        [item?.first_name, item?.last_name].filter(Boolean).join(" ");

    return name || `User #${getOptionId(item)}`;
}

function SearchableDropdown({
    label,
    placeholder,
    searchPlaceholder,
    value,
    options,
    loading,
    error,
    onChange,
}: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selected = options.find((option) => option.value === value);

    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return options;
        }

        return options.filter((option) =>
            `${option.label} ${option.description ?? ""} ${option.value}`
                .toLowerCase()
                .includes(query),
        );
    }, [options, search]);

    return (
        <div className="relative">
            <label className={labelClass}>{label}</label>

            <div className="relative">
                <input
                    type="text"
                    value={open ? search : selected?.label ?? ""}
                    placeholder={open ? searchPlaceholder : placeholder}
                    autoComplete="off"
                    className={`${inputClass} pr-10`}
                    onFocus={() => {
                        setSearch("");
                        setOpen(true);
                    }}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setOpen(true);

                        if (value) {
                            onChange("");
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setOpen(false);
                            setSearch("");
                        }

                        if (
                            event.key === "Enter" &&
                            open &&
                            filteredOptions.length > 0
                        ) {
                            event.preventDefault();

                            onChange(filteredOptions[0].value);
                            setSearch("");
                            setOpen(false);
                        }

                        if (event.key === "ArrowDown") {
                            setOpen(true);
                        }
                    }}
                    onBlur={() => {
                        window.setTimeout(() => {
                            setOpen(false);
                            setSearch("");
                        }, 150);
                    }}
                />

                <ChevronDown
                    size={17}
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </div>

            {open && (
                <div className="absolute left-0 right-0 z-30 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-gray-500">
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                            Loading options...
                        </div>
                    ) : error ? (
                        <p className="px-3 py-5 text-center text-sm text-red-600">
                            {error}
                        </p>
                    ) : filteredOptions.length === 0 ? (
                        <p className="px-3 py-5 text-center text-sm text-gray-500">
                            No results found.
                        </p>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    onChange(option.value);
                                    setSearch("");
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                                    option.value === value
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium">
                                        {option.label}
                                    </span>

                                    {option.description && (
                                        <span className="mt-0.5 block truncate text-xs text-gray-500">
                                            {option.description}
                                        </span>
                                    )}
                                </span>

                                {option.value === value && (
                                    <Check
                                        size={17}
                                        className="shrink-0 text-indigo-600"
                                    />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function MeetingForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [openSidebar, setOpenSidebar] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [users, setUsers] = useState<Option[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState("");

    const [departments, setDepartments] = useState<Option[]>([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(true);
    const [departmentsError, setDepartmentsError] = useState("");

    useEffect(() => {
        let active = true;

        api.get("/admin/users")
            .then(({ data }) => {
                if (!active) return;

                const list = normalizeList(data);

                setUsers(
                    list
                        .map((item: any) => ({
                            value: getOptionId(item),
                            label: getPersonName(item),
                            description: item?.email ?? "",
                        }))
                        .filter((option: Option) => option.value !== ""),
                );
            })
            .catch(() => {
                if (active) {
                    setUsersError("Users could not be loaded.");
                }
            })
            .finally(() => {
                if (active) setUsersLoading(false);
            });

        api.get("/hrm/departments", {
            params: {
                per_page: 100,
                sort_by: "name",
                sort_direction: "asc",
            },
        })
            .then(({ data }) => {
                if (!active) return;

                const list = normalizeList(data);

                setDepartments(
                    list
                        .map((item: any) => ({
                            value: getOptionId(item),
                            label:
                                item?.name ??
                                item?.department_name ??
                                `Department #${getOptionId(item)}`,
                        }))
                        .filter((option: Option) => option.value !== ""),
                );
            })
            .catch(() => {
                if (active) {
                    setDepartmentsError("Departments could not be loaded.");
                }
            })
            .finally(() => {
                if (active) setDepartmentsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        let active = true;

        api.get(`/meeting-management/meetings/${id}`)
            .then(({ data }) => {
                const meeting = data?.data ?? data;

                if (!active) return;

                setForm({
                    ...initialForm,
                    ...meeting,
                    organizer_id: meeting.organizer_id
                        ? String(meeting.organizer_id)
                        : "",
                    chairperson_id: meeting.chairperson_id
                        ? String(meeting.chairperson_id)
                        : "",
                    department_id: meeting.department_id
                        ? String(meeting.department_id)
                        : "",
                    meeting_date: meeting.meeting_date
                        ? String(meeting.meeting_date).slice(0, 10)
                        : "",
                    start_time: meeting.start_time
                        ? String(meeting.start_time).slice(0, 5)
                        : "09:00",
                    end_time: meeting.end_time
                        ? String(meeting.end_time).slice(0, 5)
                        : "10:00",
                });
            })
            .catch(() => {
                if (active) {
                    setError("Meeting details could not be loaded.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    const updateField = (field: keyof FormState, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (form.end_time <= form.start_time) {
            setError("End time must be later than start time.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...form,

                // Send YYYY-MM-DD, without converting it to an ISO timestamp.
                meeting_date: form.meeting_date
                    ? form.meeting_date.slice(0, 10)
                    : "",

                organizer_id: form.organizer_id || null,
                chairperson_id: form.chairperson_id || null,
                department_id: form.department_id || null,
                meeting_link: form.meeting_link || null,
                location: form.location || null,
            };

            if (isEdit) {
                await api.put(
                    `/meeting-management/meetings/${id}`,
                    payload,
                );
            } else {
                await api.post(
                    "/meeting-management/meetings",
                    payload,
                );
            }

            navigate(
                isEdit
                    ? `/meeting-management/meetings/${id}`
                    : "/meeting/meeting-scheduling/meeting-list",
            );
        } catch (err: any) {
            const validation = err?.response?.data?.errors;

            setError(
                validation
                    ? Object.values(validation).flat().join(" ")
                    : err?.response?.data?.message ||
                          "Meeting could not be saved.",
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <LoaderCircle
                    className="animate-spin text-indigo-600"
                    size={32}
                />
            </div>
        );
    }

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
                    <div className="mx-auto max-w-5xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Meeting Management / Meetings
                                </p>

                                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                                    {isEdit ? "Edit Meeting" : "Create Meeting"}
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Enter the meeting information below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft size={17} />
                                Back
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-7"
                        >
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                    <CalendarDays size={22} />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Meeting information
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Fields marked with * are required.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Meeting title *
                                    </label>
                                    <input
                                        required
                                        maxLength={255}
                                        className={inputClass}
                                        value={form.title}
                                        onChange={(event) =>
                                            updateField(
                                                "title",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter meeting title"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Meeting type *
                                    </label>
                                    <select
                                        required
                                        className={inputClass}
                                        value={form.meeting_type}
                                        onChange={(event) =>
                                            updateField(
                                                "meeting_type",
                                                event.target.value,
                                            )
                                        }
                                    >
                                        <option value="internal">Internal</option>
                                        <option value="external">External</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select
                                        className={inputClass}
                                        value={form.status}
                                        onChange={(event) =>
                                            updateField(
                                                "status",
                                                event.target.value,
                                            )
                                        }
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="in_progress">
                                            In Progress
                                        </option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Meeting date *
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        className={inputClass}
                                        value={form.meeting_date}
                                        onChange={(event) =>
                                            updateField(
                                                "meeting_date",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>
                                            Start time *
                                        </label>
                                        <input
                                            required
                                            type="time"
                                            className={inputClass}
                                            value={form.start_time}
                                            onChange={(event) =>
                                                updateField(
                                                    "start_time",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            End time *
                                        </label>
                                        <input
                                            required
                                            type="time"
                                            className={inputClass}
                                            value={form.end_time}
                                            onChange={(event) =>
                                                updateField(
                                                    "end_time",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <SearchableDropdown
                                    label="Organizer"
                                    placeholder="Select organizer"
                                    searchPlaceholder="Type to search organizer..."
                                    value={form.organizer_id}
                                    options={users}
                                    loading={usersLoading}
                                    error={usersError}
                                    onChange={(value) =>
                                        updateField("organizer_id", value)
                                    }
                                />

                                <SearchableDropdown
                                    label="Chairperson"
                                    placeholder="Select chairperson"
                                    searchPlaceholder="Type to search chairperson..."
                                    value={form.chairperson_id}
                                    options={users}
                                    loading={usersLoading}
                                    error={usersError}
                                    onChange={(value) =>
                                        updateField("chairperson_id", value)
                                    }
                                />

                                <SearchableDropdown
                                    label="Department"
                                    placeholder="Select department"
                                    searchPlaceholder="Type to search department..."
                                    value={form.department_id}
                                    options={departments}
                                    loading={departmentsLoading}
                                    error={departmentsError}
                                    onChange={(value) =>
                                        updateField("department_id", value)
                                    }
                                />

                                <div>
                                    <label className={labelClass}>Location</label>
                                    <input
                                        className={inputClass}
                                        value={form.location}
                                        onChange={(event) =>
                                            updateField(
                                                "location",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Meeting room / venue"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Meeting link
                                    </label>
                                    <input
                                        type="url"
                                        className={inputClass}
                                        value={form.meeting_link}
                                        onChange={(event) =>
                                            updateField(
                                                "meeting_link",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="https://... (for online meetings)"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Description / agenda
                                    </label>
                                    <textarea
                                        rows={4}
                                        className={inputClass}
                                        value={form.description}
                                        onChange={(event) =>
                                            updateField(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Write meeting agenda or notes"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={saving}
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save size={17} />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : isEdit
                                          ? "Update Meeting"
                                          : "Create Meeting"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
