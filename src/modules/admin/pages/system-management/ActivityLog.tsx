import { useEffect, useState } from "react";
import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import DataLogButton from "../../../../components/DataLogButton";
import api from "../../../../services/api";

type LogRow = { id: number; resource: string; record_id: string; event: string; actor_name: string; created_at: string };
const empty = { resource: "", record_id: "", event: "", actor: "", date_from: "", date_to: "" };

export default function ActivityLog() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [filters, setFilters] = useState(empty);
    const [rows, setRows] = useState<LogRow[]>([]);
    const [resources, setResources] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, last_page: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true); setError("");
            api.get("/record-logs", { params: { ...filters, page }, signal: controller.signal }).then(({ data }) => {
                setRows(data.data.data); setMeta(data.data); setResources(data.resources);
            }).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message ?? "Unable to load history."); })
                .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [filters, page]);
    const filter = (key: keyof typeof empty, value: string) => { setPage(1); setFilters(previous => ({ ...previous, [key]: value })); };
    const input = "w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-normal text-gray-700";
    return <div className="flex min-h-screen bg-gray-100"><SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><div className="p-4 lg:p-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Activity Log</h1><p className="mt-1 text-sm text-gray-500">Track record changes, including deleted records.</p></div><button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { setFilters(empty); setPage(1); }}>Clear filters</button></div>
            {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
            <div className="overflow-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-indigo-50 text-gray-700"><tr>
                <th className="p-3">Record type<select aria-label="Filter record type" className={input} value={filters.resource} onChange={e => filter("resource", e.target.value)}><option value="">All records</option>{resources.map(resource => <option key={resource} value={resource}>{resource.replaceAll("_", " ")}</option>)}</select></th>
                <th className="p-3">Record ID<input aria-label="Filter record ID" className={input} value={filters.record_id} onChange={e => filter("record_id", e.target.value)} /></th>
                <th className="p-3">Action<select aria-label="Filter action" className={input} value={filters.event} onChange={e => filter("event", e.target.value)}><option value="">All actions</option>{["created", "updated", "deleted", "restored"].map(event => <option key={event}>{event}</option>)}</select></th>
                <th className="p-3">Changed by<input aria-label="Filter changed by" className={input} value={filters.actor} onChange={e => filter("actor", e.target.value)} /></th>
                <th className="p-3">Changed at<div className="flex gap-1"><input aria-label="History from date" type="date" className={input} value={filters.date_from} onChange={e => filter("date_from", e.target.value)} /><input aria-label="History to date" type="date" className={input} value={filters.date_to} onChange={e => filter("date_to", e.target.value)} /></div></th><th className="p-3">History</th>
            </tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-gray-500">No matching changes.</td></tr> : rows.map(row => <tr key={row.id} className="border-t hover:bg-gray-50"><td className="p-3">{row.resource.replaceAll("_", " ")}</td><td className="p-3">#{row.record_id}</td><td className="p-3 capitalize">{row.event}</td><td className="p-3">{row.actor_name}</td><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td className="p-3"><DataLogButton resource={row.resource} recordId={row.record_id} /></td></tr>)}</tbody></table></div>
            <footer className="mt-4 flex items-center justify-between text-sm"><span>{meta.total} changes · Page {page} of {meta.last_page}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page >= meta.last_page || loading} onClick={() => setPage(page + 1)}>Next</button></div></footer>
        </section>
    </div></main></div>;
}
