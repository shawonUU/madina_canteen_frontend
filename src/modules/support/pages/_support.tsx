import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, RefreshCw, Headset, Ticket, Clock3, CheckCircle2,
    AlertCircle, Search, Plus, Eye, UserRound, CalendarDays,
    MessageSquare, Send, LoaderCircle, ClipboardList, BarChart3,
} from "lucide-react";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

export type TicketStatus =
    | "open" | "assigned" | "in_progress" | "waiting_for_user"
    | "resolved" | "closed" | "reopened";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface SupportTicket {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    module_name?: string | null;
    issue_type: string;
    priority: TicketPriority;
    status: TicketStatus;
    submitted_by: number;
    assigned_to?: number | null;
    resolved_at?: string | null;
    closed_at?: string | null;
    created_at: string;
    updated_at?: string;
    submitter?: { id: number; name: string };
    assignee?: { id: number; name: string } | null;
    replies?: TicketReply[];
    attachments?: unknown[];
    histories?: TicketHistory[];
}

export interface TicketReply {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_internal: boolean;
    created_at: string;
    user?: { id: number; name: string };
}

export interface TicketHistory {
    id: number;
    field_name: string;
    old_value?: string | null;
    new_value?: string | null;
    note?: string | null;
    created_at: string;
    changed_by?: { id: number; name: string };
    changedBy?: { id: number; name: string };
}

export const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
export const primaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export function normalizeList<T>(response: any): { records: T[]; meta: any } {
    const payload = response?.data;
    if (Array.isArray(payload)) {
        return { records: payload, meta: response?.meta ?? { current_page: 1, last_page: 1, per_page: payload.length, total: payload.length } };
    }
    if (Array.isArray(payload?.data)) {
        return { records: payload.data, meta: { current_page: payload.current_page ?? 1, last_page: payload.last_page ?? 1, per_page: payload.per_page ?? payload.data.length, total: payload.total ?? payload.data.length } };
    }
    if (Array.isArray(response?.results)) {
        return { records: response.results, meta: { current_page: 1, last_page: 1, per_page: response.results.length, total: response.results.length } };
    }
    return { records: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
}

export function formatLabel(value?: string | null) {
    if (!value) return "—";
    return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusStyles: Record<string, string> = {
    open: "border-blue-200 bg-blue-50 text-blue-700",
    assigned: "border-violet-200 bg-violet-50 text-violet-700",
    in_progress: "border-amber-200 bg-amber-50 text-amber-700",
    waiting_for_user: "border-orange-200 bg-orange-50 text-orange-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    closed: "border-slate-300 bg-slate-100 text-slate-700",
    reopened: "border-rose-200 bg-rose-50 text-rose-700",
};
const priorityStyles: Record<string, string> = {
    low: "border-slate-200 bg-slate-50 text-slate-600",
    medium: "border-blue-200 bg-blue-50 text-blue-700",
    high: "border-orange-200 bg-orange-50 text-orange-700",
    critical: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status?: string | null }) {
    return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{formatLabel(status)}</span>;
}
export function PriorityBadge({ priority }: { priority?: string | null }) {
    return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityStyles[priority ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{formatLabel(priority)}</span>;
}

export function SupportLayout({
    title, description, children, actions,
}: { title: string; description: string; children: ReactNode; actions?: ReactNode }) {
    const [openSidebar, setOpenSidebar] = useState(false);
    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <main className="min-w-0 flex-1">
                <TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
                <div className="h-[calc(100vh-64px)] overflow-y-auto p-3 sm:p-4 lg:p-6">
                    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Headset size={16} /><span>Support</span><span>/</span><span className="font-semibold text-slate-800">{title}</span>
                            </div>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
                            <p className="mt-1 text-sm text-slate-500">{description}</p>
                        </div>
                        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
    if (!message) return null;
    return <div className="mb-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{message}</span>{onRetry && <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button>}</div>;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
    return <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin text-indigo-600" />{label}</div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
    return <div className="flex flex-col items-center justify-center px-4 py-14 text-center"><div className="mb-3 rounded-xl bg-slate-100 p-3 text-slate-500"><ClipboardList size={24} /></div><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{detail}</p></div>;
}

export function TicketTable({ tickets, onView }: { tickets: SupportTicket[]; onView: (ticket: SupportTicket) => void }) {
    if (!tickets.length) return <EmptyState title="No tickets found" detail="There are no tickets matching the current view." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>{["Ticket", "Subject", "Requester", "Assignee", "Priority", "Status", "Created", "Action"].map((item) => <th key={item} className="border-b border-slate-200 px-4 py-3 font-bold">{item}</th>)}</tr>
                </thead>
                <tbody>
                    {tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-700">{ticket.ticket_number}</td>
                            <td className="max-w-[250px] px-4 py-3"><p className="truncate font-semibold text-slate-800">{ticket.subject}</p><p className="mt-1 text-xs text-slate-500">{formatLabel(ticket.issue_type)}{ticket.module_name ? ` · ${ticket.module_name}` : ""}</p></td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{ticket.submitter?.name ?? `User #${ticket.submitted_by}`}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{ticket.assignee?.name ?? "Unassigned"}</td>
                            <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                            <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(ticket.created_at)}</td>
                            <td className="px-4 py-3"><button type="button" onClick={() => onView(ticket)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Eye size={14} /> View</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function StatCard({ title, value, detail, icon, tone = "indigo" }: { title: string; value: number | string; detail: string; icon: ReactNode; tone?: "indigo" | "blue" | "amber" | "green" | "red" }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        red: "bg-red-50 text-red-700 ring-red-100",
    };
    return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><div className={`rounded-lg p-3 ring-1 ${tones[tone]}`}>{icon}</div></div></div>;
}

export function TicketListPanel({ tickets, loading, error, onRetry, onView }: {
    tickets: SupportTicket[]; loading: boolean; error: string; onRetry: () => void; onView: (ticket: SupportTicket) => void;
}) {
    return <div className="overflow-hidden rounded-xl border border-slate-300 bg-white"><div className="border-b border-slate-200 px-4 py-4"><h2 className="font-bold text-slate-900">Tickets</h2><p className="mt-1 text-sm text-slate-500">Review ticket details, assignment, priority and status.</p></div><ErrorMessage message={error} onRetry={onRetry} />{loading ? <LoadingState label="Loading tickets..." /> : <TicketTable tickets={tickets} onView={onView} />}</div>;
}

export function useTicketNavigation() {
    const navigate = useNavigate();
    return (ticket: SupportTicket) => navigate(`/support/view-ticket/${ticket.id}`);
}

export const TicketIcons = { Ticket, Clock3, CheckCircle2, AlertCircle, Search, Plus, Eye, UserRound, CalendarDays, MessageSquare, Send, RefreshCw, ArrowLeft, BarChart3 };
export { api };
