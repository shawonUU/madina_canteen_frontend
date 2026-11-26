import { useEffect, useState } from "react";
import { Plus, Pencil, RefreshCw, X } from "lucide-react";
import Select from "react-select";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import DataLogButton from "../../../components/DataLogButton";
import api from "../../../services/api";
import { canAccess } from "../../../services/permissions";
import ColumnFilters, { matchesColumns, type Filters } from "../../admin/components/ColumnFilters";

type User = { id: number; name: string; email?: string };
type Delegation = { id: number; code: string; from_user_id: number; to_user_id: number; start_at: string; end_at: string; reason: string | null; status: "Active" | "Inactive" | "Cancelled"; from_user?: User; to_user?: User };
type Form = { from_user_id: number | null; to_user_id: number | null; start_at: string; end_at: string; reason: string; status: Delegation["status"] };
const emptyForm: Form = { from_user_id: null, to_user_id: null, start_at: "", end_at: "", reason: "", status: "Active" };
const displayDate = (value: string) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const inputDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ApprovalDelegation() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const allowed = (action: "create" | "update" | "delete") => canAccess("approval", "approval-delegation", null, action);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const [response, userResponse] = await Promise.all([api.get("/approval-delegations", { params: { all: 1 } }), api.get("/lookups/users")]);
      setDelegations(response.data.data?.data ?? response.data.data ?? []);
      setUsers(userResponse.data.data ?? []);
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to load approval delegations."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const open = (delegation?: Delegation) => {
    setEditing(delegation?.id ?? null); setError("");
    setForm(delegation ? { from_user_id: delegation.from_user_id, to_user_id: delegation.to_user_id, start_at: inputDate(delegation.start_at), end_at: inputDate(delegation.end_at), reason: delegation.reason ?? "", status: delegation.status } : { ...emptyForm });
    setOpenModal(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (form.from_user_id === form.to_user_id) { setError("Choose a different user to receive the delegation."); return; }
    if (new Date(form.end_at).getTime() <= new Date(form.start_at).getTime()) { setError("End time must be later than start time."); return; }
    setSaving(true);
    try {
      const payload = { ...form, start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString() };
      if (editing) await api.put(`/approval-delegations/${editing}`, payload);
      else await api.post("/approval-delegations", payload);
      setOpenModal(false); await load();
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to save delegation."); }
    finally { setSaving(false); }
  };
  const cancel = async (delegation: Delegation) => {
    if (!window.confirm(`Cancel delegation ${delegation.code}?`)) return;
    try { await api.delete(`/approval-delegations/${delegation.id}`); await load(); }
    catch (error: any) { setError(error?.response?.data?.message ?? "Unable to cancel delegation."); }
  };
  const options = users.map((user) => ({ value: user.id, label: `${user.name}${user.email ? ` (${user.email})` : ""}` }));
  const filtered = delegations.filter((row) => matchesColumns({ code: row.code, from: row.from_user?.name ?? row.from_user_id, to: row.to_user?.name ?? row.to_user_id, start: `${row.start_at} ${displayDate(row.start_at)}`, end: `${row.end_at} ${displayDate(row.end_at)}`, reason: row.reason, status: row.status }, filters));
  return <div className="flex min-h-screen bg-slate-50"><SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
    <div className="p-4 lg:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Approval Delegation</h1><p className="text-sm text-slate-500">Choose who can approve during an approver’s absence.</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={loading} title="Refresh" className="rounded-lg border bg-white p-2"><RefreshCw size={18} /></button>{allowed("create") && <button onClick={() => open()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"><Plus size={17} />Add Delegation</button>}</div></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="bg-slate-50 text-slate-500">{["Code", "From", "Delegate", "Starts", "Ends", "Reason", "Status", "Actions"].map((title) => <th key={title} className="px-3 py-3">{title}</th>)}</tr>
        <ColumnFilters columns={[{key:"code",label:"code"},{key:"from",label:"approver"},{key:"to",label:"delegate"},{key:"start",label:"start"},{key:"end",label:"end"},{key:"reason",label:"reason"},{key:"status",label:"status",options:["Active","Inactive","Cancelled"]},null]} values={filters} onChange={setFilters} />
      </thead><tbody>{loading ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading delegations…</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">No delegations match your filters.</td></tr> : filtered.map((row) => <tr key={row.id} className="border-t hover:bg-slate-50"><td className="p-3 font-medium">{row.code}</td><td className="p-3">{row.from_user?.name ?? `User #${row.from_user_id}`}</td><td className="p-3">{row.to_user?.name ?? `User #${row.to_user_id}`}</td><td className="whitespace-nowrap p-3">{displayDate(row.start_at)}</td><td className="whitespace-nowrap p-3">{displayDate(row.end_at)}</td><td className="max-w-64 p-3">{row.reason || "—"}</td><td className="p-3">{row.status}</td><td className="p-3"><div className="flex items-center gap-2"><DataLogButton resource="approval_delegations" recordId={row.id} />{allowed("update") && <button onClick={() => open(row)} title="Edit delegation" className="rounded border p-2 text-indigo-700"><Pencil size={15} /></button>}{allowed("delete") && row.status !== "Cancelled" && <button onClick={() => void cancel(row)} title="Cancel delegation" className="rounded border p-2 text-red-600"><X size={15} /></button>}</div></td></tr>)}</tbody></table></div>
    </div>
    {openModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? "Edit Delegation" : "Add Delegation"}</h2><button type="button" onClick={() => setOpenModal(false)} disabled={saving} aria-label="Close"><X size={20} /></button></div>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">From approver<Select required aria-label="From approver" isDisabled={Boolean(editing)} options={options} value={options.find((option) => option.value === form.from_user_id) ?? null} onChange={(option) => setForm({ ...form, from_user_id: option?.value ?? null })} className="mt-2" /></label><label className="text-sm font-medium">Delegate<Select required aria-label="Delegate" isDisabled={Boolean(editing)} options={options.filter((option) => option.value !== form.from_user_id)} value={options.find((option) => option.value === form.to_user_id) ?? null} onChange={(option) => setForm({ ...form, to_user_id: option?.value ?? null })} className="mt-2" /></label>
        <label className="text-sm font-medium">Starts<input required type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" /></label><label className="text-sm font-medium">Ends<input required type="datetime-local" value={form.end_at} min={form.start_at} onChange={(event) => setForm({ ...form, end_at: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" /></label>
        <label className="text-sm font-medium sm:col-span-2">Reason<textarea maxLength={2000} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" /></label>
        {editing && <label className="text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Form["status"] })} className="mt-2 w-full rounded-lg border p-2.5"><option>Active</option><option>Inactive</option><option>Cancelled</option></select></label>}
      </div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpenModal(false)} disabled={saving} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : "Save Delegation"}</button></div>
    </form></div>}
  </main></div>;
}
