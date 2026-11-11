import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, LoaderCircle, MessageSquare, RefreshCw, Send, UserRound, Save } from "lucide-react";
import { api, ErrorMessage, formatDate, formatLabel, inputClass, labelClass, LoadingState, primaryButtonClass, PriorityBadge, secondaryButtonClass, StatusBadge, SupportLayout } from "./_support";
import type { SupportTicket, TicketHistory, TicketReply } from "./_support";

type UserOption = { id: number; name: string; email?: string };
const statusOptions = ["open", "assigned", "in_progress", "waiting_for_user", "resolved", "closed", "reopened"];
const normalizeTicket = (response: any): SupportTicket => response?.data?.data ?? response?.data ?? response;

export default function ViewTicket() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reply, setReply] = useState("");
    const [internal, setInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState("");
    const [statusNote, setStatusNote] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [assignee, setAssignee] = useState("");
    const [users, setUsers] = useState<UserOption[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [actionError, setActionError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTicket = useCallback(async () => {
        if (!id) return;
        setLoading(true); setError("");
        try {
            const response = await api.get(`/support/tickets/${id}`);
            const result = normalizeTicket(response.data);
            setTicket(result); setStatus(result.status); setAssignee(result.assigned_to ? String(result.assigned_to) : "");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Ticket details could not be loaded.");
        } finally { setLoading(false); }
    }, [id, refreshKey]);

    useEffect(() => { void fetchTicket(); }, [fetchTicket]);

    useEffect(() => {
        let active = true;
        api.get("/admin/users", { params: { per_page: 100 } }).then(({ data }) => {
            const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data) ? data : [];
            if (active) setUsers(raw.map((user: any) => ({ id: Number(user.id ?? user.user_id), name: user.name ?? user.full_name ?? `User #${user.id}`, email: user.email })).filter((user: UserOption) => Number.isFinite(user.id) && user.id > 0));
        }).catch(() => { if (active) setUsers([]); });
        return () => { active = false; };
    }, []);

    const sendReply = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setActionError("");
        if (!reply.trim()) { setActionError("Please enter a reply message."); return; }
        setSending(true);
        try {
            await api.post(`/support/tickets/${id}/replies`, { message: reply.trim(), is_internal: internal });
            setReply(""); setInternal(false); setRefreshKey(v => v + 1);
        } catch (err: any) {
            setActionError(err?.response?.data?.message || "Reply could not be submitted.");
        } finally { setSending(false); }
    };

    const updateStatus = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setActionError(""); setUpdatingStatus(true);
        try {
            await api.patch(`/support/tickets/${id}/status`, { status, note: statusNote || null });
            setStatusNote(""); setRefreshKey(v => v + 1);
        } catch (err: any) {
            setActionError(err?.response?.data?.message || "Ticket status could not be updated.");
        } finally { setUpdatingStatus(false); }
    };

    const assignTicket = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setActionError("");
        if (!assignee) { setActionError("Select a support staff member first."); return; }
        setAssigning(true);
        try {
            await api.put(`/support/tickets/${id}/assign`, { assigned_to: Number(assignee) });
            setRefreshKey(v => v + 1);
        } catch (err: any) {
            setActionError(err?.response?.data?.message || "Ticket could not be assigned.");
        } finally { setAssigning(false); }
    };

    return <SupportLayout title="Ticket Details" description="Review the issue, conversation, history and available ticket actions."
        actions={<><button type="button" onClick={() => navigate(-1)} className={secondaryButtonClass}><ArrowLeft size={15} /> Back</button><button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} /> Refresh</button></>}>
        {loading ? <LoadingState label="Loading ticket details..." /> : error ? <ErrorMessage message={error} onRetry={fetchTicket} /> : ticket ? <>
            {actionError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
                <div className="space-y-5">
                    <section className="rounded-xl border border-slate-300 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-indigo-700">{ticket.ticket_number}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{ticket.subject}</h2></div><div className="flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div></div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 pb-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><UserRound size={14} /> {ticket.submitter?.name ?? `User #${ticket.submitted_by}`}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {formatDate(ticket.created_at)}</span><span>{formatLabel(ticket.issue_type)}</span>{ticket.module_name && <span>Module: {ticket.module_name}</span>}</div>
                        <h3 className="mt-4 text-sm font-semibold text-slate-800">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.description}</p>
                    </section>
                    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><MessageSquare size={18} className="text-indigo-600" /><h2 className="font-bold text-slate-900">Conversation</h2></div>
                        <div className="space-y-4 p-5">{(ticket.replies ?? []).length ? ticket.replies!.map((item: TicketReply) => <div key={item.id} className={`rounded-lg border p-4 ${item.is_internal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-800">{item.user?.name ?? `User #${item.user_id}`}{item.is_internal && <span className="ml-2 rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-800">Internal note</span>}</span><span className="text-xs text-slate-500">{formatDate(item.created_at)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p></div>) : <p className="py-5 text-center text-sm text-slate-500">No replies yet.</p>}</div>
                        {!["resolved", "closed"].includes(ticket.status) && <form onSubmit={sendReply} className="border-t border-slate-200 p-5"><label className={labelClass}>Your reply</label><textarea rows={4} maxLength={20000} value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply..." className={`${inputClass} resize-y`} required /><div className="mt-3 flex flex-wrap items-center justify-between gap-3">{ticket.assigned_to && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} /> Internal note</label>}<button disabled={sending} type="submit" className={primaryButtonClass}>{sending ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}{sending ? "Sending..." : "Send Reply"}</button></div></form>}
                    </section>
                    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-900">Ticket History</h2></div><div className="divide-y divide-slate-100">{(ticket.histories ?? []).length ? ticket.histories!.map((history: TicketHistory) => <div key={history.id} className="px-5 py-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-slate-800">{formatLabel(history.field_name)}</span><span className="text-xs text-slate-500">{formatDate(history.created_at)}</span></div><p className="mt-1 text-sm text-slate-600">{history.old_value ?? "—"} <span className="px-1 text-slate-400">→</span> {history.new_value ?? "—"}</p>{history.note && <p className="mt-1 text-xs text-slate-500">{history.note}</p>}<p className="mt-1 text-xs text-slate-400">Changed by {history.changedBy?.name ?? history.changed_by?.name ?? "User"}</p></div>) : <p className="p-5 text-sm text-slate-500">No history available.</p>}</div></section>
                </div>
                <aside className="space-y-5">
                    <section className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="font-bold text-slate-900">Ticket Information</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Ticket number</dt><dd className="text-right font-semibold text-slate-800">{ticket.ticket_number}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Requester</dt><dd className="text-right font-medium text-slate-800">{ticket.submitter?.name ?? `User #${ticket.submitted_by}`}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Assignee</dt><dd className="text-right font-medium text-slate-800">{ticket.assignee?.name ?? "Unassigned"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Updated</dt><dd className="text-right text-slate-700">{formatDate(ticket.updated_at)}</dd></div></dl></section>
                    <section className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="font-bold text-slate-900">Update Status</h2><form onSubmit={updateStatus} className="mt-4 space-y-3"><div><label className={labelClass}>Status</label><select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>{statusOptions.map(option => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></div><div><label className={labelClass}>Note (optional)</label><textarea rows={3} maxLength={1000} value={statusNote} onChange={e => setStatusNote(e.target.value)} className={inputClass} placeholder="Add a status update note" /></div><button type="submit" disabled={updatingStatus || status === ticket.status} className={`${primaryButtonClass} w-full`}>{updatingStatus ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{updatingStatus ? "Updating..." : "Update Status"}</button></form></section>
                    <section className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="font-bold text-slate-900">Assign Ticket</h2><p className="mt-1 text-sm text-slate-500">Choose a support staff user to handle this ticket.</p><form onSubmit={assignTicket} className="mt-4 space-y-3"><div><label className={labelClass}>Assigned to</label><select value={assignee} onChange={e => setAssignee(e.target.value)} className={inputClass}><option value="">Select support staff</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}{user.email ? ` (${user.email})` : ""}</option>)}</select><p className="mt-1 text-xs text-slate-400">User list is loaded from the existing /admin/users endpoint.</p></div><button type="submit" disabled={assigning || !assignee || assignee === String(ticket.assigned_to ?? "")} className={`${primaryButtonClass} w-full`}>{assigning ? <LoaderCircle size={15} className="animate-spin" /> : <UserRound size={15} />}{assigning ? "Assigning..." : "Assign Ticket"}</button></form></section>
                </aside>
            </div>
        </> : null}
    </SupportLayout>;
}
