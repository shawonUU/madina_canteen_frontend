import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, X } from "lucide-react";
import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import DataLogButton from "../../../../components/DataLogButton";
import api from "../../../../services/api";
import { canAccess } from "../../../../services/permissions";
import ColumnFilters, { matchesColumns, type Filters } from "../../components/ColumnFilters";

type Permission = { id: number; name: string; key: string; is_active: boolean };
type Role = { id: number; name: string; description: string | null; is_active: boolean; permissions: Permission[]; users_count?: number };
const emptyForm = { name: "", description: "", is_active: true, permissions: [] as number[] };

export default function RolePage() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [columnFilters, setColumnFilters] = useState<Filters>({});
  const [permissionSearch, setPermissionSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const can = (action: "create" | "update" | "delete") => canAccess("admin", "access-control", "role", action);
  const load = async () => {
    setLoading(true);
    try {
      const roleResponse = await api.get("/admin/roles");
      setRoles(roleResponse.data.data ?? []);
      setPermissions(roleResponse.data.permissions ?? []);
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to load roles."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const open = (role?: Role) => {
    setEditId(role?.id ?? null);
    setForm(role ? { name: role.name, description: role.description ?? "", is_active: role.is_active, permissions: role.permissions.filter((p) => p.is_active).map((p) => p.id) } : { ...emptyForm, permissions: [] });
    setPermissionSearch(""); setError(""); setOpenModal(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editId) await api.put(`/admin/roles/${editId}`, form);
      else await api.post("/admin/roles", form);
      setOpenModal(false); await load();
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to save role."); }
    finally { setSaving(false); }
  };
  const remove = async (role: Role) => {
    if (!window.confirm(`Delete the role "${role.name}"?`)) return;
    try { await api.delete(`/admin/roles/${role.id}`); await load(); }
    catch (error: any) { setError(error?.response?.data?.message ?? "Unable to delete role."); }
  };
  const shownRoles = roles.filter((role) => matchesColumns({
    name: role.name, description: role.description, permissions: role.permissions.map((p) => `${p.name} ${p.key}`).join(" "),
    users: role.users_count ?? 0, status: role.is_active ? "Active" : "Inactive",
  }, columnFilters));
  return <div className="flex min-h-screen bg-slate-50">
    <SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
    <main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <div className="p-4 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Role Management</h1><p className="text-sm text-slate-500">Group permissions and assign roles to users.</p></div>
          <div className="flex gap-2"><button onClick={() => void load()} disabled={loading} className="rounded-lg border bg-white p-2" title="Refresh"><RefreshCw size={18} /></button>
            {can("create") && <button onClick={() => open()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"><Plus size={17} />Add Role</button>}</div></div>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[850px] text-left text-sm">
          <thead><tr className="bg-slate-50 text-slate-500">{["#", "Role", "Description", "Permissions", "Users", "Status", "Actions"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr>
            <ColumnFilters columns={[null, { key: "name", label: "role" }, { key: "description", label: "description" }, { key: "permissions", label: "permissions" }, { key: "users", label: "users" }, { key: "status", label: "status", options: ["Active", "Inactive"] }, null]} values={columnFilters} onChange={setColumnFilters} />
          </thead><tbody>
            {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading roles…</td></tr> : shownRoles.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">No roles match your filters.</td></tr> : shownRoles.map((role, index) => <tr key={role.id} className="border-t hover:bg-slate-50">
              <td className="p-3">{index + 1}</td><td className="p-3 font-semibold">{role.name}</td><td className="max-w-56 p-3">{role.description || "—"}</td>
              <td className="max-w-xs p-3"><div className="flex flex-wrap gap-1">{role.permissions.map((p) => <span key={p.id} title={p.key} className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{p.name}</span>)}{!role.permissions.length && "No permissions"}</div></td>
              <td className="p-3">{role.users_count ?? 0}</td><td className="p-3">{role.is_active ? "Active" : "Inactive"}</td><td className="p-3"><div className="flex items-center gap-2">
                <DataLogButton resource="roles" recordId={role.id} />
                {can("update") && <button onClick={() => open(role)} title="Edit role" className="rounded border p-2 text-indigo-700"><Pencil size={15} /></button>}
                {can("delete") && <button onClick={() => void remove(role)} title="Delete role" className="rounded border p-2 text-red-600"><Trash2 size={15} /></button>}
              </div></td></tr>)}
          </tbody></table></div>
      </div>
      {openModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-between"><h2 className="text-xl font-bold">{editId ? "Edit Role" : "Add Role"}</h2><button type="button" disabled={saving} onClick={() => setOpenModal(false)} aria-label="Close"><X size={20} /></button></div>
        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
        <label className="mb-3 block text-sm">Role name<input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
        <label className="mb-3 block text-sm">Description<textarea maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
        <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Active</label>
        <label className="block text-sm font-medium">Permissions<input value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} placeholder="Search permissions" className="my-2 w-full rounded border p-2 font-normal" /></label>
        <div className="max-h-60 overflow-y-auto rounded border p-2">{permissions.filter((p) => p.is_active && `${p.name} ${p.key}`.toLowerCase().includes(permissionSearch.toLowerCase())).map((p) => <label key={p.id} className="flex items-center gap-2 rounded p-2 text-sm hover:bg-slate-50">
          <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={(e) => setForm({ ...form, permissions: e.target.checked ? [...form.permissions, p.id] : form.permissions.filter((id) => id !== p.id) })} /><span>{p.name}<small className="ml-2 text-slate-400">{p.key}</small></span>
        </label>)}</div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setOpenModal(false)} className="rounded border px-4 py-2">Cancel</button><button disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-white">{saving ? "Saving…" : "Save Role"}</button></div>
      </form></div>}
    </main>
  </div>;
}
