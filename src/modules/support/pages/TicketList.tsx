import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ErrorMessage, normalizeList, secondaryButtonClass, SupportLayout, TicketTable } from "./_support";
import type { SupportTicket, TicketFilters } from "./_support";
import { canAccess } from "../../../services/permissions";

export default function TicketList({ scope = "mine", title = "My Tickets" }: { scope?: "mine" | "assigned" | "all"; title?: string }) {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<TicketFilters>({});
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const sequence = useRef(0);
    const fetchTickets = useCallback(async () => {
        const requestId = ++sequence.current;
        setLoading(true); setError("");
        try {
            const response = await api.get("/support/tickets", { params: { scope, page, per_page: perPage, search: search.trim(), filter: filters } });
            if (requestId !== sequence.current) return;
            const result = normalizeList<SupportTicket>(response.data);
            setTickets(result.records); setTotal(result.meta.total ?? 0); setLastPage(result.meta.last_page ?? 1);
        } catch (err: any) {
            if (requestId === sequence.current) setError(err?.response?.data?.message || "Tickets could not be loaded.");
        } finally { if (requestId === sequence.current) setLoading(false); }
    }, [scope, page, perPage, search, filters]);
    useEffect(() => { const timer = setTimeout(() => void fetchTickets(), 250); return () => { clearTimeout(timer); sequence.current++; }; }, [fetchTickets, refreshKey]);
    useEffect(() => { setPage(1); setFilters({}); setSearch(""); }, [scope]);
    const clearFilters = () => { setSearch(""); setFilters({}); setPage(1); };
    const changeFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
    const mayCreate = canAccess("support", "create-ticket", null, "create");
    const mayEdit = ["my-tickets", "create-ticket", "my-assigned-tickets", "all-tickets"]
        .some(menu => canAccess("support", menu, null, "update"));
    return <SupportLayout title={title} description={scope === "assigned" ? "Tickets assigned to your account." : scope === "mine" ? "Support requests submitted by you." : "Support tickets available to your account."}
        actions={<><button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>{mayCreate && <button type="button" onClick={() => navigate("/support/create-ticket")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white"><Plus size={16} /> Create Ticket</button>}</>}>
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} matching records</p></div><div className="flex gap-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search tickets" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search ticket number or subject" className="h-10 w-64 rounded-lg border border-slate-300 pl-9 pr-3 text-sm" /></div><button type="button" onClick={clearFilters} className={secondaryButtonClass}><X size={14} /> Clear</button></div></div>
            <ErrorMessage message={error} onRetry={fetchTickets} />
            {loading && <p role="status" className="px-4 py-2 text-sm text-slate-500">Loading tickets…</p>}
            <TicketTable tickets={tickets} filters={filters} onFilter={changeFilter} onView={ticket => navigate(`/support/view-ticket/${ticket.id}`)} onEdit={scope === "mine" && mayEdit ? ticket => navigate(`/support/edit-ticket/${ticket.id}`) : undefined} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm"><label>Rows per page <select aria-label="Rows per page" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="ml-2 rounded border border-slate-300 p-2">{[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}</select></label><div className="flex items-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className={secondaryButtonClass}>Previous</button><span>Page {page} of {lastPage}</span><button disabled={page >= lastPage || loading} onClick={() => setPage(p => p + 1)} className={secondaryButtonClass}>Next</button></div></div>
        </div>
    </SupportLayout>;
}
