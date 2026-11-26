import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { History, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";

type Entry = {
    id: number; resource: string; record_id: string; event: string; actor_name: string;
    created_at: string; changed_fields: string[]; old_values: Record<string, unknown>; new_values: Record<string, unknown>;
};
const display = (value: unknown) => value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);

export default function DataLogButton({ resource, recordId, label = "Log" }: { resource: string; recordId: number | string; label?: string }) {
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const closeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true); setError("");
        api.get(`/record-logs/${encodeURIComponent(resource)}/${encodeURIComponent(String(recordId))}`, { params: { page }, signal: controller.signal })
            .then(({ data }) => { setEntries(data.data.data ?? []); setLastPage(data.data.last_page ?? 1); })
            .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message ?? "Unable to load history."); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [open, page, resource, recordId]);
    useEffect(() => {
        if (!open) return;
        closeButton.current?.focus();
        const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [open]);
    return <>
        <button type="button" title="View change history" onClick={event => { event.stopPropagation(); setPage(1); setOpen(true); }} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
            <History size={14} />{label}
        </button>
        {open && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) setOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-label="Record change history" className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
                <header className="flex items-center justify-between border-b bg-indigo-50 px-5 py-4"><div><h2 className="text-lg font-bold text-gray-900">Change history</h2><p className="text-sm text-gray-600">{resource.replaceAll("_", " ")} · #{recordId}</p></div><button ref={closeButton} type="button" aria-label="Close history" onClick={() => setOpen(false)}><X size={22} /></button></header>
                <div className="overflow-auto p-5">
                    {loading ? <p className="py-10 text-center">Loading history…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : entries.length === 0 ? <p className="py-10 text-center text-gray-500">No recorded changes yet. History starts after the update is installed.</p> : entries.map(entry => <article key={entry.id} className="mb-5 overflow-hidden rounded-xl border border-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3 text-sm"><div><strong className="capitalize">{entry.event}</strong> · {entry.actor_name || "System"}{entry.resource !== resource && <span> · {entry.resource.replaceAll("_", " ")} #{entry.record_id}</span>}</div><time>{new Date(entry.created_at).toLocaleString()}</time></div>
                        <table className="w-full table-fixed text-left text-sm"><thead className="bg-indigo-50"><tr><th className="w-1/4 p-3">Field</th><th className="p-3">Before</th><th className="p-3">After</th></tr></thead><tbody>{entry.changed_fields.filter(field => !["updated_at", "created_at", "updated_by"].includes(field)).map(field => <tr key={field} className="border-t"><td className="break-words p-3 font-medium">{field.replaceAll("_", " ")}</td><td className="whitespace-pre-wrap break-words bg-red-50/40 p-3 text-gray-600">{display(entry.old_values?.[field])}</td><td className="whitespace-pre-wrap break-words bg-emerald-50/40 p-3">{display(entry.new_values?.[field])}</td></tr>)}</tbody></table>
                    </article>)}
                </div>
                <footer className="flex items-center justify-between border-t px-5 py-3 text-sm"><span>Page {page} of {lastPage}</span><div className="flex gap-2"><button type="button" aria-label="Previous history page" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} className="rounded border p-2 disabled:opacity-30"><ChevronLeft size={16} /></button><button type="button" aria-label="Next history page" disabled={loading || page >= lastPage} onClick={() => setPage(page + 1)} className="rounded border p-2 disabled:opacity-30"><ChevronRight size={16} /></button></div></footer>
            </section>
        </div>, document.body)}
    </>;
}
