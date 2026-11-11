import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Ticket, Plus, ArrowRight, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ErrorMessage, LoadingState, normalizeList, PriorityBadge, StatCard, StatusBadge, SupportLayout, formatDate, secondaryButtonClass } from "./_support";

import type { SupportTicket } from "./_support";

type DashboardData = {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    waiting_for_user: number;
    resolved_tickets: number;
    critical_tickets: number;
    status_summary: Record<string, number>;
    recent_tickets: SupportTicket[];
};

export default function SupportDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const response = await api.get("/support/dashboard");
            setData(response.data?.data ?? response.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Support dashboard could not be loaded.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

    const recent = data?.recent_tickets ?? [];
    return (
        <SupportLayout title="Support Dashboard" description="Monitor support requests, ticket status and urgent issues."
            actions={<><button type="button" className={secondaryButtonClass} onClick={() => { setRefreshing(true); void fetchDashboard(); }} disabled={loading}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button><button type="button" onClick={() => navigate("/support/create-ticket")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> New Ticket</button></>}>
            <ErrorMessage message={error} onRetry={fetchDashboard} />
            {loading ? <LoadingState label="Loading support dashboard..." /> : <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard title="Total Tickets" value={data?.total_tickets ?? 0} detail="Tickets visible to your account" icon={<Ticket size={21} />} />
                    <StatCard title="Open Tickets" value={data?.open_tickets ?? 0} detail="Open, assigned or reopened" icon={<Clock3 size={21} />} tone="blue" />
                    <StatCard title="In Progress" value={data?.in_progress_tickets ?? 0} detail="Currently being handled" icon={<RefreshCw size={21} />} tone="amber" />
                    <StatCard title="Waiting for User" value={data?.waiting_for_user ?? 0} detail="Awaiting requester response" icon={<AlertCircle size={21} />} tone="amber" />
                    <StatCard title="Resolved / Closed" value={data?.resolved_tickets ?? 0} detail="Completed support requests" icon={<CheckCircle2 size={21} />} tone="green" />
                    <StatCard title="Critical Tickets" value={data?.critical_tickets ?? 0} detail="Critical and not resolved/closed" icon={<AlertCircle size={21} />} tone="red" />
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
                    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><div><h2 className="font-bold text-slate-900">Recent Tickets</h2><p className="mt-1 text-sm text-slate-500">Latest support requests</p></div><button type="button" onClick={() => navigate("/support/my-tickets")} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900">View all <ArrowRight size={15} /></button></div>
                        {recent.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No recent tickets found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Ticket", "Subject", "Priority", "Status", "Created"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{recent.map(ticket => <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-700">{ticket.ticket_number}</td><td className="max-w-[240px] px-4 py-3"><button onClick={() => navigate(`/support/view-ticket/${ticket.id}`)} className="truncate font-medium text-slate-800 hover:text-indigo-700">{ticket.subject}</button></td><td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td><td className="px-4 py-3"><StatusBadge status={ticket.status} /></td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(ticket.created_at)}</td></tr>)}</tbody></table></div>}
                    </section>
                    <section className="rounded-xl border border-slate-300 bg-white p-4"><div className="flex items-center gap-2"><BarChart3 size={19} className="text-indigo-600" /><h2 className="font-bold text-slate-900">Status Summary</h2></div><p className="mt-1 text-sm text-slate-500">Current ticket distribution</p><div className="mt-4 space-y-4">{Object.entries(data?.status_summary ?? {}).length ? Object.entries(data?.status_summary ?? {}).map(([status, count]) => { const total = Math.max(data?.total_tickets ?? 0, 1); return <div key={status}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{status.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</span><span className="font-semibold text-slate-800">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (Number(count) / total) * 100)}%` }} /></div></div>; }) : <p className="py-6 text-sm text-slate-500">No status data available.</p>}</div></section>
                </div>
            </>}
        </SupportLayout>
    );
}
