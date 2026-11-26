import { Bell, ChevronDown, LogOut, Search, User, Key, X, LoaderCircle, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { logout } from "../modules/admin/services/authService";
import { getUser, getUserAccess } from "../services/storage";
import { canAccess } from "../services/permissions";
import api from "../services/api";

interface TopNavProps { openSidebar: boolean; setOpenSidebar: (value: boolean) => void }
interface PendingApproval { id: number; document_no?: string; document_type: string; requester?: { name: string } }
const title = (value: string) => value.replaceAll("-", " ").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

export default function TopNav({ setOpenSidebar }: TopNavProps) {
    const [openProfile, setOpenProfile] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);
    const [openPending, setOpenPending] = useState(false);
    const [query, setQuery] = useState("");
    const [pending, setPending] = useState<PendingApproval[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [pendingError, setPendingError] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const user = getUser();
    const mayViewApprovals = canAccess("approval", "pending-approval", null);
    const pages = Array.from(new Map(getUserAccess().filter(row => row.can_view && row.route?.startsWith("/") && !row.route.startsWith("//"))
        .map(row => [row.route, { route: String(row.route), label: title(row.child_menu_slug || row.menu_slug), module: title(row.module_slug) }])).values())
        .filter(page => `${page.module} ${page.label} ${page.route}`.toLowerCase().includes(query.trim().toLowerCase()));

    const handleLogout = async () => {
        try { await logout(); } catch { /* Local authentication is cleared by logout. */ }
        finally { navigate("/login", { replace: true }); }
    };
    const openPageSearch = () => { setQuery(""); setOpenSearch(true); setOpenProfile(false); setOpenPending(false); };
    const openPage = (route: string) => { setOpenSearch(false); setOpenPending(false); navigate(route); };

    useEffect(() => {
        const outside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) { setOpenProfile(false); setOpenPending(false); }
        };
        const keyboard = (event: KeyboardEvent) => {
            if (event.key === "Escape") { setOpenProfile(false); setOpenPending(false); setOpenSearch(false); }
        };
        document.addEventListener("mousedown", outside);
        document.addEventListener("keydown", keyboard);
        return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", keyboard); };
    }, []);
    useEffect(() => { if (openSearch) searchRef.current?.focus(); }, [openSearch]);
    useEffect(() => {
        if (!openPending || !mayViewApprovals) return;
        const controller = new AbortController();
        setPendingLoading(true); setPendingError("");
        api.get("/approvals", { params: { per_page: 5 }, signal: controller.signal })
            .then(({ data }) => { setPending(data.data?.data ?? []); setPendingTotal(data.data?.total ?? 0); })
            .catch(error => { if (!controller.signal.aborted) setPendingError(error.response?.data?.message ?? "Pending approvals could not be loaded."); })
            .finally(() => { if (!controller.signal.aborted) setPendingLoading(false); });
        return () => controller.abort();
    }, [openPending, mayViewApprovals]);

    return <>
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 shadow-sm lg:px-6">
            <div className="flex items-center gap-3">
                <button type="button" aria-label="Open menu" onClick={() => setOpenSidebar(true)} className="rounded-lg bg-gray-100 p-2 transition hover:bg-gray-200 lg:hidden">☰</button>
                <button type="button" aria-label="Search pages" onClick={openPageSearch} className="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-500 transition hover:bg-gray-200 sm:flex"><Search size={19} /><span className="text-sm">Search</span></button>
            </div>
            <div ref={menuRef} className="flex items-center gap-3">
                <button type="button" aria-label="Search pages" onClick={openPageSearch} className="rounded-lg bg-gray-100 p-2 transition hover:bg-gray-200 sm:hidden"><Search size={19} /></button>
                {mayViewApprovals && <div className="relative">
                    <button type="button" aria-label="Pending approvals" aria-expanded={openPending} title="Pending approvals" onClick={() => { setOpenPending(value => !value); setOpenProfile(false); }} className="relative rounded-lg bg-gray-100 p-2.5 transition hover:bg-gray-200"><Bell size={19} /></button>
                    {openPending && <section aria-label="Pending approval preview" className="absolute right-0 z-[80] mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-80">
                        <div className="border-b px-4 py-3 font-semibold text-gray-800">Pending approvals</div>
                        {pendingLoading ? <p className="flex items-center gap-2 p-4 text-sm text-gray-500"><LoaderCircle size={16} className="animate-spin" />Loading…</p> : pendingError ? <p role="alert" className="p-4 text-sm text-red-700">{pendingError}</p> : pending.length ? <ul className="divide-y divide-gray-100">{pending.map(item => <li key={item.id}><button type="button" onClick={() => openPage("/approval/pending-approval")} className="w-full px-4 py-3 text-left hover:bg-indigo-50"><span className="block truncate text-sm font-semibold text-gray-800">{item.document_no || `Request #${item.id}`}</span><span className="block text-xs text-gray-500">{item.document_type} · {item.requester?.name || "Requester"}</span></button></li>)}</ul> : <p className="p-4 text-sm text-gray-500">You have no pending approvals.</p>}
                        <button type="button" onClick={() => openPage("/approval/pending-approval")} className="flex w-full items-center justify-between border-t bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">View approvals{!pendingLoading && !pendingError && ` (${pendingTotal})`}<ArrowRight size={16} /></button>
                    </section>}
                </div>}
                <div className="relative">
                    <button type="button" aria-label="Account menu" aria-expanded={openProfile} onClick={() => { setOpenProfile(value => !value); setOpenPending(false); }} className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 transition hover:bg-gray-200">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white"><User size={17} /></span>
                        <span className="hidden text-sm font-medium text-gray-700 sm:block">{user?.name || "User"}</span>
                        <ChevronDown size={16} className={`hidden transition-transform sm:block ${openProfile ? "rotate-180" : ""}`} />
                    </button>
                    {openProfile && <div className="absolute right-0 z-[80] mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl">
                        <div className="mb-2 border-b border-gray-100 px-3 py-3"><p className="font-semibold text-gray-800">{user?.name || "User"}</p><p className="mt-1 truncate text-xs text-gray-500">{user?.employee?.designation_relation?.name || user?.email || ""}</p></div>
                        <button type="button" onClick={() => { setOpenProfile(false); navigate("/change-password"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50"><Key size={18} className="text-gray-500" /><span className="text-sm">Change Password</span></button>
                        <div className="my-2 border-t border-gray-100" />
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-red-500 transition hover:bg-red-50"><LogOut size={18} /><span className="text-sm">Logout</span></button>
                    </div>}
                </div>
            </div>
        </header>
        {openSearch && createPortal(<div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={event => { if (event.target === event.currentTarget) setOpenSearch(false); }}>
            <section role="dialog" aria-modal="true" aria-label="Search available pages" className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center gap-3 border-b p-4"><Search size={20} className="text-indigo-600" /><input ref={searchRef} aria-label="Search available pages" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search modules and pages…" className="min-w-0 flex-1 py-2 text-sm outline-none" /><button type="button" aria-label="Close search" onClick={() => setOpenSearch(false)}><X size={20} /></button></div>
                <div className="overflow-y-auto p-2">{!pages.length ? <p className="p-8 text-center text-sm text-gray-500">No accessible pages match your search.</p> : pages.map(page => <button type="button" key={page.route} onClick={() => openPage(page.route)} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-indigo-50"><span><span className="block text-sm font-semibold text-gray-800">{page.label}</span><span className="text-xs text-gray-500">{page.module}</span></span><ArrowRight size={16} className="text-indigo-500" /></button>)}</div>
            </section>
        </div>, document.body)}
    </>;
}
