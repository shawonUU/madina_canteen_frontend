import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";
import { canAccess } from "../../../services/permissions";

type Option = { value: number; label: string };
const emptyForm = { name: "", department: null as number | null, designation: null as number | null, phone: "", email: "", status: "Active", create_user: false, user_password: "" };
const listPath = "/hrm/employee-management/employee-list";
const records = (response: any): any[] => Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data?.data?.data) ? response.data.data.data : [];

export default function EmployeeForm({ employeeId }: { employeeId?: string }) {
  const canSave = canAccess("hrm", "employee-management", "employee-list", employeeId ? "update" : "create");
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [designations, setDesignations] = useState<Option[]>([]);
  const [hasLogin, setHasLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!canSave) { setLoading(false); return; }
    let active = true;
    const load = async () => {
      try {
        const [departmentResponse, designationResponse, employeeResponse] = await Promise.all([
          api.get("/lookups/departments"), api.get("/lookups/designations"),
          employeeId ? api.get(`/hrm/employees/${employeeId}`) : Promise.resolve(null),
        ]);
        if (!active) return;
        setDepartments(records(departmentResponse).map((item) => ({ value: item.id, label: item.name })));
        setDesignations(records(designationResponse).map((item) => ({ value: item.id, label: item.name })));
        if (employeeResponse) {
          const employee = employeeResponse.data.data;
          setHasLogin(Boolean(employee.user));
          setForm({ name: employee.name, department: employee.department, designation: employee.designation, phone: employee.phone ?? "", email: employee.email ?? "", status: employee.status, create_user: employee.user?.status === "Active", user_password: "" });
        }
      } catch (error: any) { if (active) setError(error?.response?.data?.message ?? "Unable to load employee details."); }
      finally { if (active) setLoading(false); }
    };
    void load(); return () => { active = false; };
  }, [employeeId, canSave]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true); setError(""); setErrors({});
    const payload = { ...form, name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, user_password: form.user_password || undefined };
    try {
      if (employeeId) await api.put(`/hrm/employees/${employeeId}`, payload);
      else await api.post("/hrm/employees", payload);
      navigate(listPath);
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to save employee."); setErrors(error?.response?.data?.errors ?? {}); }
    finally { setSaving(false); }
  };
  const fieldError = (field: string) => errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field].join(" ")}</p>;
  return <div className="flex min-h-screen bg-slate-50"><SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /><main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
    <div className="mx-auto max-w-4xl p-4 md:p-6"><div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-800">{employeeId ? "Edit Employee" : "Add Employee"}</h1><Link to={listPath} className="text-sm font-medium text-indigo-600">Employee List</Link></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!canSave ? <p className="rounded-lg border bg-white p-6 text-slate-600">You do not have permission to {employeeId ? "edit" : "create"} employees.</p> : loading ? <p className="p-6 text-slate-500">Loading…</p> : <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Employee name<input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" />{fieldError("name")}</label>
        <label className="text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5"><option>Active</option><option>Inactive</option></select></label>
        <label className="text-sm font-medium">Department<Select inputId="employee-department" aria-label="Department" isClearable options={departments} value={departments.find((option) => option.value === form.department) ?? null} onChange={(option) => setForm({ ...form, department: option?.value ?? null })} className="mt-2" />{fieldError("department")}</label>
        <label className="text-sm font-medium">Designation<Select inputId="employee-designation" aria-label="Designation" isClearable options={designations} value={designations.find((option) => option.value === form.designation) ?? null} onChange={(option) => setForm({ ...form, designation: option?.value ?? null })} className="mt-2" />{fieldError("designation")}</label>
        <label className="text-sm font-medium">Phone<input type="tel" maxLength={50} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" />{fieldError("phone")}</label>
        <label className="text-sm font-medium">Email<input type="email" required={form.create_user} maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" />{fieldError("email")}</label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={form.create_user} onChange={(event) => setForm({ ...form, create_user: event.target.checked })} />Enable system login</label>
        {form.create_user && <label className="text-sm font-medium sm:col-span-2">{hasLogin ? "New password (leave blank to keep existing)" : "Login password"}<input type="password" autoComplete="new-password" required={!hasLogin} minLength={8} value={form.user_password} onChange={(event) => setForm({ ...form, user_password: event.target.value })} className="mt-2 w-full rounded-lg border p-2.5" />{fieldError("user_password")}</label>}
      </div><div className="mt-6 flex justify-end gap-3"><Link to={listPath} className="rounded-lg border px-4 py-2">Cancel</Link><button disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : "Save Employee"}</button></div></form>}
    </div></main></div>;
}
