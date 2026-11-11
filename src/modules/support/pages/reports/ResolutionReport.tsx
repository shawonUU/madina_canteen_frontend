import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { api, ErrorMessage, formatDate, LoadingState, normalizeList, secondaryButtonClass, StatCard, SupportLayout } from "../_support";
import type { SupportTicket } from "../_support";

function exportCsv(tickets: SupportTicket[]) {
    const headers = ["Ticket Number", "Subject", "Priority", "Status", "Created At", "Resolved At", "Closed At"];
    const rows = tickets.map(t => [t.ticket_number, t.subject, t.priority, t.status, t.created_at, t.resolved_at ?? "", t.closed_at ?? ""]);
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "support-resolution-report.csv"; anchor.click(); URL.revokeObjectURL(url);
}

export default function ResolutionReport() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [period, setPeriod] = useState("all");

    const fetchTickets = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const response = await api.get("/support/tickets", { params: { per_page: 100 } });
            setTickets(normalizeList<SupportTicket>(response.data).records);
        } catch (err: any) { setError(err?.response?.data?.message || "Resolution report could not be loaded."); }
        finally { setLoading(false); }
    }, [refreshKey]);
    useEffect(() => { void fetchTickets(); }, [fetchTickets]);

    const filtered = useMemo(() => {
        if (period === "all") return tickets;
        const days = Number(period);
        const since = new Date(); since.setDate(since.getDate() - days);
        return tickets.filter(ticket => new Date(ticket.resolved_at ?? ticket.closed_at ?? ticket.updated_at ?? ticket.created_at) >= since);
    }, [tickets, period]);

    const completed = filtered.filter(t => ["resolved", "closed"].includes(t.status));
    const pending = filtered.filter(t => !["resolved", "closed"].includes(t.status));
    const averageResolutionHours = useMemo(() => {
        const durations = completed.map(t => {
            if (!t.resolved_at && !t.closed_at) return null;
            const end = new Date(t.resolved_at ?? t.closed_at!).getTime();
            const start = new Date(t.created_at).getTime();
            return end >= start ? (end - start) / 3600000 : null;
        }).filter((value): value is number => value !== null && Number.isFinite(value));
        return durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
    }, [completed]);

    return <SupportLayout title="Resolution Report" description="Review resolved and pending tickets using available ticket timestamps."
        actions={<><button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} /> Refresh</button><button type="button" onClick={() => exportCsv(filtered)} disabled={!filtered.length} className={secondaryButtonClass}><Download size={15} /> Export CSV</button></>}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-4"><div><h2 className="font-bold text-slate-900">Report Period</h2><p className="mt-1 text-sm text-slate-500">Filters by resolution, closure, update or creation date.</p></div><select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">All loaded records</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>
        <ErrorMessage message={error} onRetry={fetchTickets} />
        {loading ? <LoadingState /> : <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Tickets in Period" value={filtered.length} detail="Loaded records after filter" icon={<span className="text-lg font-bold">T</span>} /><StatCard title="Resolved / Closed" value={completed.length} detail="Completed tickets" icon={<span className="text-lg font-bold">✓</span>} tone="green" /><StatCard title="Still Open" value={pending.length} detail="Not resolved or closed" icon={<span className="text-lg font-bold">P</span>} tone="amber" /><StatCard title="Avg. Resolution Time" value={averageResolutionHours === null ? "—" : `${averageResolutionHours.toFixed(1)} hrs`} detail="For tickets with resolution timestamps" icon={<span className="text-lg font-bold">h</span>} tone="blue" /></div>
            <section className="mt-5 overflow-hidden rounded-xl border border-slate-300 bg-white"><div className="border-b border-slate-200 px-4 py-4"><h2 className="font-bold text-slate-900">Resolution Details</h2><p className="mt-1 text-sm text-slate-500">Tickets and their available resolution timestamps.</p></div>{!filtered.length ? <p className="p-8 text-center text-sm text-slate-500">No records available for this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr>{["Ticket", "Subject", "Status", "Created", "Resolved", "Closed"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{filtered.map(ticket => <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-700">{ticket.ticket_number}</td><td className="max-w-[280px] truncate px-4 py-3 font-medium text-slate-800">{ticket.subject}</td><td className="px-4 py-3">{ticket.status.replaceAll("_", " ")}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(ticket.created_at)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(ticket.resolved_at)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(ticket.closed_at)}</td></tr>)}</tbody></table></div>}</section>
            <p className="mt-4 text-xs text-slate-500">This report uses up to 100 tickets from the current paginated endpoint. Accurate full-period reports require a dedicated backend reporting endpoint.</p>
        </>}
    </SupportLayout>;
}
