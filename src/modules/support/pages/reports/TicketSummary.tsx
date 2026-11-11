import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Download } from "lucide-react";
import { api, ErrorMessage, formatLabel, LoadingState, normalizeList, secondaryButtonClass, StatCard, SupportLayout } from "../_support";
import type { SupportTicket } from "../_support";

function downloadCsv(tickets: SupportTicket[]) {
    const headers = ["Ticket Number", "Subject", "Issue Type", "Module", "Priority", "Status", "Requester", "Assignee", "Created At"];
    const rows = tickets.map(t => [t.ticket_number, t.subject, t.issue_type, t.module_name ?? "", t.priority, t.status, t.submitter?.name ?? "", t.assignee?.name ?? "", t.created_at]);
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "support-ticket-summary.csv"; anchor.click(); URL.revokeObjectURL(url);
}

export default function TicketSummary() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTickets = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const response = await api.get("/support/tickets", { params: { per_page: 100 } });
            setTickets(normalizeList<SupportTicket>(response.data).records);
        } catch (err: any) { setError(err?.response?.data?.message || "Ticket summary could not be loaded."); }
        finally { setLoading(false); }
    }, [refreshKey]);
    useEffect(() => { void fetchTickets(); }, [fetchTickets]);

    const statusCount = (status: string) => tickets.filter(t => t.status === status).length;
    const priorities = ["critical", "high", "medium", "low"];
    return <SupportLayout title="Ticket Summary" description="Summary of the ticket records returned by the support API."
        actions={<><button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} /> Refresh</button><button type="button" onClick={() => downloadCsv(tickets)} disabled={!tickets.length} className={secondaryButtonClass}><Download size={15} /> Export CSV</button></>}>
        <ErrorMessage message={error} onRetry={fetchTickets} />
        {loading ? <LoadingState /> : <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Loaded Tickets" value={tickets.length} detail="Maximum 100 records loaded" icon={<span className="text-lg font-bold">#</span>} /><StatCard title="Open / Reopened" value={tickets.filter(t => ["open","assigned","reopened"].includes(t.status)).length} detail="Needs attention" icon={<span className="text-lg font-bold">O</span>} tone="blue" /><StatCard title="In Progress" value={statusCount("in_progress")} detail="Currently in progress" icon={<span className="text-lg font-bold">P</span>} tone="amber" /><StatCard title="Resolved / Closed" value={tickets.filter(t => ["resolved","closed"].includes(t.status)).length} detail="Completed tickets" icon={<span className="text-lg font-bold">R</span>} tone="green" /></div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="font-bold text-slate-900">Tickets by Status</h2><p className="mt-1 text-sm text-slate-500">Counts within the loaded records.</p><div className="mt-5 space-y-4">{["open","assigned","in_progress","waiting_for_user","reopened","resolved","closed"].map(status => { const count = statusCount(status); const max = Math.max(tickets.length, 1); return <div key={status}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{formatLabel(status)}</span><span className="font-semibold text-slate-800">{count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${count / max * 100}%` }} /></div></div>; })}</div></section>
                <section className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="font-bold text-slate-900">Tickets by Priority</h2><p className="mt-1 text-sm text-slate-500">Priority distribution within the loaded records.</p><div className="mt-5 space-y-4">{priorities.map(priority => { const count = tickets.filter(t => t.priority === priority).length; const max = Math.max(tickets.length, 1); const color = priority === "critical" ? "bg-red-500" : priority === "high" ? "bg-orange-500" : priority === "medium" ? "bg-blue-500" : "bg-slate-400"; return <div key={priority}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{formatLabel(priority)}</span><span className="font-semibold text-slate-800">{count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${count / max * 100}%` }} /></div></div>; })}</div></section>
            </div>
            <p className="mt-4 text-xs text-slate-500">Note: The current backend list endpoint is paginated. This report summarizes up to the first 100 records returned, not necessarily every ticket in the database.</p>
        </>}
    </SupportLayout>;
}
