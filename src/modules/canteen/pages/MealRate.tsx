import { canAccess } from "../../../services/permissions";
import { useEffect, useState } from "react";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import DataLogButton from "../../../components/DataLogButton";
import api from "../../../services/api";
import { ColumnFilterRow, useColumnFilters, localToday, type FilterColumn } from "../../reports/components/TableTools";

type Rate = { id: number; code: string; meal_type_id: number; meal_type?: { name: string }; rate: string | number; effective_date: string; status: string };
type MealType = { id: number; name: string };
const columns: FilterColumn<Rate>[] = [
  { key: "code", label: "Code", value: (row) => row.code },
  { key: "meal_type", label: "Meal type", value: (row) => row.meal_type?.name },
  { key: "rate", label: "Rate", value: (row) => row.rate },
  { key: "effective_date", label: "Effective date", value: (row) => row.effective_date },
  { key: "status", label: "Status", value: (row) => row.status },
];
const blank = () => ({ meal_type_id: "", rate: "", effective_date: localToday(), status: "Active" });

export default function MealRatePage() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [rows, setRows] = useState<Rate[]>([]);
  const [types, setTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const tableFilter = useColumnFilters(rows, columns);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const all: Rate[] = [];
      let page = 1, last = 1;
      do {
        const response = await api.get("/meal-rates", { params: { page, per_page: 100 } });
        all.push(...(response.data.data?.data || []));
        last = response.data.data?.last_page || 1; page += 1;
      } while (page <= last);
      setRows(all);
      const response = await api.get("/meal-types", { params: { per_page: 500 } });
      setTypes(response.data.data?.data || []);
    } catch (exception: any) { setError(exception.response?.data?.message || "Unable to load meal rates."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, meal_type_id: Number(form.meal_type_id), rate: Number(form.rate) };
      if (editing) await api.put(`/meal-rates/${editing}`, payload); else await api.post("/meal-rates", payload);
      setFormOpen(false); setMessage("Meal rate saved. Existing booking amounts are unchanged."); await load();
    } catch (exception: any) { setError(exception.response?.data?.message || "Unable to save meal rate."); }
    finally { setSaving(false); }
  };
  const remove = async (row: Rate) => {
    if (!window.confirm("Delete this rate entry? Existing booking amounts will be preserved.")) return;
    try { await api.delete(`/meal-rates/${row.id}`); await load(); }
    catch (exception: any) { setError(exception.response?.data?.message || "Unable to delete meal rate."); }
  };
  return <div className="min-h-screen bg-slate-50 flex"><SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><main className="flex-1 min-w-0"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><div className="p-5 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Meal Rates</h1><p className="text-sm text-slate-500">Set effective rates for new bookings. Existing bookings keep their saved rate.</p></div>{canAccess("canteen", "meal-rate", null, "create") && (<button onClick={() => { setEditing(null); setForm(blank()); setFormOpen(true); setError(""); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add Rate</button>)} </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}{message && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex justify-between p-4 text-sm"><span>{tableFilter.rows.length} rates</span><button onClick={() => void load()} disabled={loading} className="text-indigo-600">{loading ? "Loading..." : "Refresh"}</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50">{columns.map((column) => <th key={column.key} className="px-3 py-3 text-left">{column.label}</th>)}<th className="px-3 py-3 text-left">Actions</th></tr><ColumnFilterRow columns={[...columns, null]} filters={tableFilter.filters} onChange={tableFilter.setFilter} /></thead><tbody>{tableFilter.rows.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-3 py-3">{row.code}</td><td className="px-3 py-3">{row.meal_type?.name}</td><td className="px-3 py-3">{Number(row.rate).toFixed(2)}</td><td className="px-3 py-3">{row.effective_date || "Default"}</td><td className="px-3 py-3">{row.status}</td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-3">{canAccess("canteen", "meal-rate", null, "update") && (<button className="text-indigo-600" onClick={() => { setEditing(row.id); setForm({ meal_type_id: String(row.meal_type_id), rate: String(row.rate), effective_date: row.effective_date || localToday(), status: row.status }); setFormOpen(true); }}>Edit</button>)} {canAccess("canteen", "meal-rate", null, "delete") && (<button className="text-red-600" onClick={() => void remove(row)}>Delete</button>)} <DataLogButton resource="meal_rates" recordId={row.id} /></div></td></tr>)}{!loading && !tableFilter.rows.length && <tr><td colSpan={6} className="p-10 text-center text-slate-400">No rates match your filters.</td></tr>}</tbody></table></div></section>
    {formOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 className="text-lg font-bold">{editing ? "Edit Rate" : "Add Rate"}</h2>{error && <p className="text-sm text-red-600">{error}</p>}<label className="block text-sm">Meal Type<select required value={form.meal_type_id} onChange={(event) => setForm({ ...form, meal_type_id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2"><option value="">Select meal type</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label className="block text-sm">Rate<input required type="number" min="0" max="99999999.99" step="0.01" value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label><label className="block text-sm">Effective Date<input required type="date" value={form.effective_date} onChange={(event) => setForm({ ...form, effective_date: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label><label className="block text-sm">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2"><option>Active</option><option>Inactive</option></select></label><div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</button><button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-white">{saving ? "Saving..." : "Save"}</button></div></form></div>}
  </div></main></div>;
}
