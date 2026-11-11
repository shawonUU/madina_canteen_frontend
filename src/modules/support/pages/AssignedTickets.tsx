import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ErrorMessage, LoadingState, normalizeList, secondaryButtonClass, SupportLayout, TicketTable } from "./_support";
import type { SupportTicket } from "./_support";

export default function AssignedTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTickets = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const response = await api.get("/support/tickets", { params: { per_page: 100 } });
            const result = normalizeList<SupportTicket>(response.data);
            setTickets(result.records.filter(ticket => ticket.assigned_to != null));
        } catch (err: any) {
            setError(err?.response?.data?.message || "Assigned tickets could not be loaded.");
        } finally { setLoading(false); }
    }, [refreshKey]);

    useEffect(() => { void fetchTickets(); }, [fetchTickets]);
    return <SupportLayout title="Assigned Tickets" description="Tickets that have been assigned to support staff."
        actions={<button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className={secondaryButtonClass}><RefreshCw size={15} /> Refresh</button>}>
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white"><div className="border-b border-slate-200 px-4 py-4"><h2 className="font-bold text-slate-900">Assigned Tickets</h2><p className="mt-1 text-sm text-slate-500">Showing {tickets.length} assigned tickets from the first 100 accessible records.</p></div><ErrorMessage message={error} onRetry={fetchTickets} />{loading ? <LoadingState /> : <TicketTable tickets={tickets} onView={ticket => navigate(`/support/view-ticket/${ticket.id}`)} />}</div>
    </SupportLayout>;
}
