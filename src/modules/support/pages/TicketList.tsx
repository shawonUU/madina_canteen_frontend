import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ErrorMessage, LoadingState, normalizeList, secondaryButtonClass, SupportLayout, TicketTable } from "./_support";
import type { SupportTicket } from "./_support";

export default function TicketList() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTickets = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const params: Record<string, string | number> = { page, per_page: perPage };
            if (search.trim()) params.search = search.trim();
            if (status) params.status = status;
            if (priority) params.priority = priority;
            const response = await api.get("/support/tickets", { params });
            const result = normalizeList<SupportTicket>(response.data);
            setTickets(result.records); setTotal(result.meta.total ?? result.records.length); setLastPage(result.meta.last_page ?? 1);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Tickets could not be loaded.");
        } finally { setLoading(false); setRefreshing(false); }
    }, [page, perPage, search, status, priority, refreshKey]);

    useEffect(() => { void fetchTickets(); }, [fetchTickets]);
    const clearFilters = () => { setSearch(""); setStatus(""); setPriority(""); setPage(1); };
    const hasFilters = Boolean(search || status || priority);

    return <SupportLayout title="Ticket List" description="Search and manage support tickets available to your account."
        actions={<><button type="button" onClick={() => { setRefreshing(true); setRefreshKey(v => v + 1); }} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button><button type="button" onClick={() => navigate("/support/create-ticket")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Create Ticket</button></>}>
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="font-bold text-slate-900">Support Tickets</h2><p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} total records</p></div>
                <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                    <div className="relative sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search ticket number or subject..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={14} /></button>}</div>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All statuses</option>{["open","assigned","in_progress","waiting_for_user","resolved","closed","reopened"].map(s => <option key={s} value={s}>{s.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}</select>
                    <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All priorities</option>{["low","medium","high","critical"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select>
                    <button type="button" onClick={clearFilters} disabled={!hasFilters} className={secondaryButtonClass}><X size={14} /> Clear</button>
                </div>
            </div>
            <ErrorMessage message={error} onRetry={fetchTickets} />
            {loading ? <LoadingState label="Loading tickets..." /> : <TicketTable tickets={tickets} onView={ticket => navigate(`/support/view-ticket/${ticket.id}`)} />}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-slate-500"><span>Rows per page</span><select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded-md border border-slate-300 bg-white px-2 py-1.5"><option value={10}>10</option><option value={15}>15</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select><span>· {total} records</span></div><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className={secondaryButtonClass}>Previous</button><span className="whitespace-nowrap text-slate-600">Page {page} of {lastPage}</span><button type="button" disabled={page >= lastPage || loading} onClick={() => setPage(p => p + 1)} className={secondaryButtonClass}>Next</button></div></div>
        </div>
    </SupportLayout>;
}
