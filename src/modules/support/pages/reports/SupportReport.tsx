import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ErrorMessage, formatLabel, secondaryButtonClass, StatCard, SupportLayout, TicketTable } from "../_support";
import type { SupportTicket, TicketFilters } from "../_support";
import { canAccess } from "../../../../services/permissions";

type Summary = { total: number; statuses: Record<string, number>; priorities: Record<string, number>; average_resolution_hours: number | null; resolution_sample_count: number };
const empty: Summary = { total: 0, statuses: {}, priorities: {}, average_resolution_hours: null, resolution_sample_count: 0 };
export default function SupportReport({ resolution = false }: { resolution?: boolean }) {
    const navigate = useNavigate();
    const canViewTicket = ["my-tickets", "create-ticket", "my-assigned-tickets", "all-tickets"]
        .some(menu => canAccess("support", menu, null));
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [summary, setSummary] = useState<Summary>(empty);
    const [filters, setFilters] = useState<TicketFilters>({});
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [basis, setBasis] = useState("created");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const sequence = useRef(0);
    const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined, date_basis: basis, filter: filters, page, per_page: 25 };
    const load = useCallback(async () => {
        const requestId = ++sequence.current;
        setLoading(true); setError("");
        try {
            const { data } = await api.get("/support/reports", { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined, date_basis: basis, filter: filters, page, per_page: 25 } });
            if (requestId !== sequence.current) return;
            setTickets(data.data ?? []); setSummary(data.summary ?? empty); setLastPage(data.meta?.last_page ?? 1);
        } catch (err: any) { if (requestId === sequence.current) setError(err?.response?.data?.message || "Report could not be loaded."); }
        finally { if (requestId === sequence.current) setLoading(false); }
    }, [dateFrom, dateTo, basis, filters, page]);
    useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => { clearTimeout(timer); sequence.current++; }; }, [load, refreshKey]);
    const exportReport = async () => {
        setExporting(true); setError("");
        try {
            const response = await api.get("/support/reports", { params: { ...params, export: 1 }, responseType: "blob" });
            const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url;
            link.download = resolution ? "support-resolution-report.csv" : "support-ticket-summary.csv"; link.click(); URL.revokeObjectURL(url);
        } catch { setError("The report could not be exported. Please check the selected dates and retry."); }
        finally { setExporting(false); }
    };
    const completed = Number(summary.statuses.resolved ?? 0) + Number(summary.statuses.closed ?? 0);
    return <SupportLayout title={resolution ? "Resolution Report" : "Ticket Summary"} description="Report totals include every matching ticket you are allowed to view."
        actions={<><button onClick={() => setRefreshKey(value => value + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} /> Refresh</button><button onClick={exportReport} disabled={exporting || loading} className={secondaryButtonClass}><Download size={15} /> {exporting ? "Exporting…" : "Export CSV"}</button></>}>
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-300 bg-white p-4">
            <label className="text-sm font-medium">From<input aria-label="Report from date" type="date" value={dateFrom} onChange={event => { setDateFrom(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 p-2" /></label>
            <label className="text-sm font-medium">To<input aria-label="Report to date" type="date" value={dateTo} min={dateFrom || undefined} onChange={event => { setDateTo(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 p-2" /></label>
            <label className="text-sm font-medium">Date basis<select value={basis} onChange={event => { setBasis(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 p-2"><option value="created">Created date</option><option value="resolved">Resolved date</option></select></label>
            <button className={secondaryButtonClass} onClick={() => { setFilters({}); setDateFrom(""); setDateTo(""); setBasis("created"); setPage(1); }}>Clear filters</button>
        </div>
        <ErrorMessage message={error} onRetry={load} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Total Tickets" value={summary.total} detail="All matching records" icon={<span>#</span>} /><StatCard title="Resolved / Closed" value={completed} detail="Completed tickets" icon={<span>✓</span>} tone="green" /><StatCard title="Still Open" value={summary.total - completed} detail="Awaiting resolution" icon={<span>○</span>} tone="amber" /><StatCard title="Average Resolution" value={summary.average_resolution_hours === null ? "—" : `${summary.average_resolution_hours.toFixed(1)} hrs`} detail={`${summary.resolution_sample_count} tickets with resolution timestamps`} icon={<span>h</span>} tone="blue" /></div>
        {!resolution && <div className="my-5 grid gap-4 lg:grid-cols-2">{[["Status", summary.statuses], ["Priority", summary.priorities]].map(([label, counts]) => <section key={String(label)} className="rounded-xl border border-slate-300 bg-white p-5"><h2 className="mb-4 font-bold">Tickets by {String(label)}</h2>{Object.entries(counts as Record<string, number>).map(([key, value]) => <div key={key} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{formatLabel(key)}</span><strong>{value}</strong></div><div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-indigo-500" style={{ width: `${Number(value) / Math.max(summary.total, 1) * 100}%` }} /></div></div>)}</section>)}</div>}
        <section className="mt-5 overflow-hidden rounded-xl border border-slate-300 bg-white"><div className="border-b p-4 font-bold">Ticket Details {loading && <span role="status" className="ml-2 text-sm font-normal text-slate-500">Loading…</span>}</div><TicketTable tickets={tickets} filters={filters} resolution={resolution} onFilter={(key, value) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); }} onView={canViewTicket ? ticket => navigate(`/support/view-ticket/${ticket.id}`) : undefined} /><div className="flex justify-end gap-3 border-t p-4 text-sm"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className={secondaryButtonClass}>Previous</button><span className="self-center">Page {page} of {lastPage}</span><button disabled={page >= lastPage || loading} onClick={() => setPage(value => value + 1)} className={secondaryButtonClass}>Next</button></div></section>
    </SupportLayout>;
}
