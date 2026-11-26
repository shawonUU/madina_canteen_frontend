import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import DataLogButton from "../../../../components/DataLogButton";
import api from "../../../../services/api";

type ReportRow = Record<string, any>;
type Column = { key: string; label: string; value: (row: ReportRow) => unknown; type?: string; options?: string[] };
const button = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50";
const date = (value: unknown) => String(value ?? "").slice(0, 10);
const commonColumns: Column[] = [
    { key: "meeting_number", label: "Meeting", value: row => row.meeting_number },
    { key: "title", label: "Title", value: row => row.title },
    { key: "meeting_date", label: "Date", value: row => date(row.meeting_date), type: "date" },
];
const summaryColumns: Column[] = [...commonColumns,
    { key: "start_time", label: "Start", value: row => row.start_time },
    { key: "end_time", label: "End", value: row => row.end_time },
    { key: "meeting_type", label: "Type", value: row => row.meeting_type, options: ["internal", "external", "online", "hybrid"] },
    { key: "location", label: "Location", value: row => row.location },
    { key: "status", label: "Status", value: row => row.status, options: ["draft", "scheduled", "in_progress", "ongoing", "completed", "cancelled"] },
    { key: "approval_status", label: "Approval", value: row => row.approval_status, options: ["Pending", "Approved", "Rejected", "Cancelled", "Completed"] },
    { key: "participants_count", label: "Participants", value: row => row.participants_count, type: "number" },
];
const attendanceColumns: Column[] = [...commonColumns.map(column => ({ ...column, value: (row: ReportRow) => column.value(row.meeting ?? {}) })),
    { key: "participant", label: "Participant", value: row => row.employee?.name ?? row.guest_name },
    { key: "participation_type", label: "Participation", value: row => row.participation_type, options: ["required", "optional"] },
    { key: "invitation_status", label: "Invitation", value: row => row.invitation_status, options: ["Pending", "Accepted", "Declined"] },
    { key: "attendance_status", label: "Attendance", value: row => row.attendance?.status ?? "unmarked", options: ["present", "absent", "late", "excused", "unmarked"] },
];
export default function MeetingReport({ attendance = false }: { attendance?: boolean }) {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1); const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState<{ total: number; statuses: Record<string, number> }>({ total: 0, statuses: {} });
    const [loading, setLoading] = useState(true); const [exporting, setExporting] = useState(false); const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0); const sequence = useRef(0);
    const endpoint = `/meeting-management/reports/${attendance ? "attendance" : "summary"}`;
    const columns = attendance ? attendanceColumns : summaryColumns;
    const load = useCallback(async () => {
        const requestId = ++sequence.current; setLoading(true); setError("");
        try {
            const { data } = await api.get(endpoint, { params: { page, per_page: 25, date_from: dateFrom || undefined, date_to: dateTo || undefined, filter: filters } });
            if (requestId !== sequence.current) return;
            setRows(data.data ?? []); setSummary(data.summary); setLastPage(data.meta?.last_page ?? 1);
        } catch (err: any) { if (requestId === sequence.current) setError(err?.response?.data?.message || "Report could not be loaded."); }
        finally { if (requestId === sequence.current) setLoading(false); }
    }, [endpoint, page, dateFrom, dateTo, filters]);
    useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => { clearTimeout(timer); sequence.current++; }; }, [load, refreshKey]);
    const exportCsv = async () => {
        setExporting(true); setError("");
        try {
            const { data } = await api.get(endpoint, { params: { export: 1, date_from: dateFrom || undefined, date_to: dateTo || undefined, filter: filters }, responseType: "blob" });
            const url = URL.createObjectURL(data); const a = document.createElement("a"); a.href = url; a.download = attendance ? "meeting-attendance.csv" : "meeting-summary.csv"; a.click(); URL.revokeObjectURL(url);
        } catch { setError("The report could not be exported. Please retry."); }
        finally { setExporting(false); }
    };
    const changeFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
    return <div className="flex min-h-screen bg-slate-100"><SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><div className="h-[calc(100vh-64px)] overflow-y-auto p-4 lg:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"><div><p className="text-sm text-slate-500">Meeting Management / Reports</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{attendance ? "Attendance Report" : "Meeting Summary"}</h1><p className="mt-1 text-sm text-slate-500">All matching meetings available to your account.</p></div><div className="flex gap-2"><button className={button} onClick={() => setRefreshKey(value => value + 1)} disabled={loading}><RefreshCw size={15} /> Refresh</button><button className={button} onClick={exportCsv} disabled={loading || exporting}><Download size={15} /> {exporting ? "Exporting…" : "Export CSV"}</button></div></header>
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><label className="text-sm">Meeting date from<input type="date" value={dateFrom} onChange={event => { setDateFrom(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 p-2" /></label><label className="text-sm">Meeting date to<input type="date" value={dateTo} min={dateFrom || undefined} onChange={event => { setDateTo(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 p-2" /></label><button className={button} onClick={() => { setFilters({}); setDateFrom(""); setDateTo(""); setPage(1); }}>Clear filters</button></div>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Total {attendance ? "Participants" : "Meetings"}</p><strong className="mt-1 block text-2xl">{summary.total}</strong></div>{Object.entries(summary.statuses).map(([key, value]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm capitalize text-slate-500">{key.replaceAll("_", " ")}</p><strong className="mt-1 block text-2xl">{value}</strong></div>)}</div>
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">{loading && <p role="status" className="p-3 text-sm text-slate-500">Loading report…</p>}<div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-100"><tr>{columns.map(column => <th key={column.key} className="px-3 py-3">{column.label}</th>)}<th className="px-3 py-3">History</th></tr><tr>{columns.map(column => <th key={column.key} className="p-2">{column.options ? <select aria-label={`Filter ${column.label}`} value={filters[column.key] ?? ""} onChange={event => changeFilter(column.key, event.target.value)} className="h-9 w-full min-w-28 rounded border border-slate-300 bg-white px-2 text-xs font-normal"><option value="">All</option>{column.options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select> : <input aria-label={`Filter ${column.label}`} type={column.type ?? "text"} min={column.type === "number" ? 0 : undefined} value={filters[column.key] ?? ""} onChange={event => changeFilter(column.key, event.target.value)} placeholder={`Filter ${column.label}`} className="h-9 w-full min-w-24 rounded border border-slate-300 bg-white px-2 text-xs font-normal" />}</th>)}<th /></tr></thead><tbody>{!rows.length ? <tr><td colSpan={columns.length + 1} className="p-10 text-center text-slate-500">No matching records.</td></tr> : rows.map(row => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">{columns.map(column => <td key={column.key} className="max-w-64 px-3 py-3">{String(column.value(row) ?? "—")}</td>)}<td className="px-3 py-3"><DataLogButton resource={attendance ? (row.attendance?.id ? "meeting_attendances" : "meeting_participants") : "meetings"} recordId={attendance ? (row.attendance?.id ?? row.id) : row.id} /></td></tr>)}</tbody></table></div><div className="flex justify-end gap-3 border-t p-4 text-sm"><button disabled={page <= 1 || loading} className={button} onClick={() => setPage(value => value - 1)}>Previous</button><span className="self-center">Page {page} of {lastPage}</span><button disabled={page >= lastPage || loading} className={button} onClick={() => setPage(value => value + 1)}>Next</button></div></div>
    </div></main></div>;
}
