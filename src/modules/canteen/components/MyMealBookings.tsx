import { useEffect, useState } from "react";
import api from "../../../services/api";
import { canAccess } from "../../../services/permissions";
import DataLogButton from "../../../components/DataLogButton";
import { ColumnFilterRow, useColumnFilters, localToday, type FilterColumn } from "../../reports/components/TableTools";

export interface SavedMealBooking {
  id: number; code: string; employee_id: number; meal_type_id: number; meal_date: string;
  meal_rate: number | string; quantity: number; total_amount: number | string; menu_id: number | null;
  status: "Selected" | "Served" | "Cancelled"; created_at: string; meal_type?: { name: string };
  items: { menu_item?: { id: number; name: string; item_type: "Main" | "Alternative"; alternative_of: number | null } }[];
}
const columns: FilterColumn<SavedMealBooking>[] = [
  { key: "code", label: "Code", value: (row) => row.code },
  { key: "meal_date", label: "Date", value: (row) => row.meal_date },
  { key: "meal_type", label: "Meal", value: (row) => row.meal_type?.name },
  { key: "items", label: "Items", value: (row) => row.items.map((item) => item.menu_item?.name).join(", ") },
  { key: "meal_rate", label: "Rate", value: (row) => row.meal_rate },
  { key: "quantity", label: "Quantity", value: (row) => row.quantity },
  { key: "total_amount", label: "Amount", value: (row) => row.total_amount },
  { key: "status", label: "Status", value: (row) => row.status },
];

export default function MyMealBookings({ revision, mealTypeId, onEdit, onDetails }: { revision: number; mealTypeId?: number; onEdit: (row: SavedMealBooking) => void; onDetails: (row: SavedMealBooking) => void }) {
  const [rows, setRows] = useState<SavedMealBooking[]>([]);
  const [from, setFrom] = useState(localToday);
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableFilter = useColumnFilters(rows, columns);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/my-booked-meals", { params: { date_from: from || undefined, date_to: to || undefined, meal_type_id: mealTypeId } });
      setRows(response.data.data || []);
    } catch (exception: any) { setError(exception.response?.data?.message || "Unable to load your bookings."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [revision, mealTypeId]);
  const cancel = async (row: SavedMealBooking) => {
    if (!window.confirm(`Cancel meal booking for ${row.meal_date}?`)) return;
    try { await api.put(`/meal-bookings/${row.id}/cancel`); await load(); }
    catch (exception: any) { setError(exception.response?.data?.message || "Unable to cancel booking."); }
  };
  return <section className="my-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="font-bold text-slate-800">My Bookings</h2><p className="text-xs text-slate-500">{tableFilter.rows.length} matching records</p></div><div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">From <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-slate-200 p-2" /></label><label className="text-xs text-slate-500">To <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-slate-200 p-2" /></label><button type="button" disabled={loading} onClick={() => void load()} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">{loading ? "Loading..." : "Apply / Refresh"}</button></div></header>
    {error && <p role="alert" className="p-3 text-sm text-red-600">{error}</p>}<div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-slate-50">{columns.map((column) => <th key={column.key} className="px-3 py-3 text-left">{column.label}</th>)}<th className="px-3 py-3 text-left">Actions</th></tr><ColumnFilterRow columns={[...columns, null]} filters={tableFilter.filters} onChange={tableFilter.setFilter} /></thead><tbody>{tableFilter.rows.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-3 py-3">{row.code}</td><td className="px-3 py-3 whitespace-nowrap">{row.meal_date}</td><td className="px-3 py-3">{row.meal_type?.name}</td><td className="px-3 py-3">{row.items.map((item) => item.menu_item?.name).join(", ") || "No menu selected"}</td><td className="px-3 py-3">{Number(row.meal_rate).toFixed(2)}</td><td className="px-3 py-3">{row.quantity}</td><td className="px-3 py-3">{Number(row.total_amount).toFixed(2)}</td><td className="px-3 py-3">{row.status}</td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-2"><button onClick={() => onDetails(row)} className="text-indigo-600">Details</button>{row.status === "Selected" && canAccess("canteen", "meal-booking", null, "update") && <button onClick={() => onEdit(row)} className="text-indigo-600">Edit</button>}{row.status === "Selected" && canAccess("canteen", "meal-booking", null, "delete") && <button onClick={() => void cancel(row)} className="text-red-600">Cancel</button>}<DataLogButton resource="employee_meals" recordId={row.id} /></div></td></tr>)}{!loading && !tableFilter.rows.length && <tr><td colSpan={9} className="p-8 text-center text-slate-400">No bookings match your filters.</td></tr>}</tbody></table></div>
  </section>;
}
