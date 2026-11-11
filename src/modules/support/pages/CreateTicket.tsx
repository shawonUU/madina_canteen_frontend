import { useState, type FormEvent } from "react";
import { ArrowLeft, Save, LoaderCircle, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, inputClass, labelClass, primaryButtonClass, secondaryButtonClass, SupportLayout, } from "./_support";

type TicketForm = { subject: string; description: string; module_name: string; issue_type: string; priority: string };
const initialForm: TicketForm = { subject: "", description: "", module_name: "", issue_type: "bug", priority: "medium" };

export default function CreateTicket() {
    const navigate = useNavigate();
    const [form, setForm] = useState<TicketForm>(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const updateField = (field: keyof TicketForm, value: string) => setForm(current => ({ ...current, [field]: value }));

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setError(""); setFieldErrors({}); setSaving(true);
        try {
            const payload = { ...form, module_name: form.module_name.trim() || null };
            const response = await api.post("/support/tickets", payload);
            const ticket = response.data?.data;
            if (ticket?.id) navigate(`/support/view-ticket/${ticket.id}`, { replace: true });
            else navigate("/support/my-tickets", { replace: true });
        } catch (err: any) {
            const validation = err?.response?.data?.errors;
            if (validation) setFieldErrors(Object.fromEntries(Object.entries(validation).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)])));
            setError(err?.response?.data?.message || "Ticket could not be created. Please check the form and try again.");
        } finally { setSaving(false); }
    };

    return <SupportLayout title="Create Ticket" description="Describe the issue clearly so the support team can investigate it."
        actions={<button type="button" onClick={() => navigate(-1)} className={secondaryButtonClass}><ArrowLeft size={16} /> Back</button>}>
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-slate-300 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-200 p-4"><div className="rounded-lg bg-indigo-50 p-3 text-indigo-700"><Ticket size={21} /></div><div><h2 className="font-bold text-slate-900">Ticket Information</h2><p className="mt-1 text-sm text-slate-500">Fields marked with * are required.</p></div></div>
            <div className="grid gap-5 p-4 md:grid-cols-2 lg:p-6">
                <div className="md:col-span-2"><label className={labelClass}>Subject *</label><input required maxLength={255} value={form.subject} onChange={e => updateField("subject", e.target.value)} placeholder="Briefly summarize the issue" className={inputClass} />{fieldErrors.subject && <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>}</div>
                <div><label className={labelClass}>Issue Type *</label><select required value={form.issue_type} onChange={e => updateField("issue_type", e.target.value)} className={inputClass}><option value="bug">Bug / Error</option><option value="technical_support">Technical Support</option><option value="access_request">Access Request</option><option value="service_request">Service Request</option><option value="other">Other</option></select>{fieldErrors.issue_type && <p className="mt-1 text-xs text-red-600">{fieldErrors.issue_type}</p>}</div>
                <div><label className={labelClass}>Priority *</label><select required value={form.priority} onChange={e => updateField("priority", e.target.value)} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>{fieldErrors.priority && <p className="mt-1 text-xs text-red-600">{fieldErrors.priority}</p>}</div>
                <div className="md:col-span-2"><label className={labelClass}>Related Module</label><input maxLength={100} value={form.module_name} onChange={e => updateField("module_name", e.target.value)} placeholder="e.g. HRM, Accounts, Inventory, Purchase" className={inputClass} />{fieldErrors.module_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.module_name}</p>}</div>
                <div className="md:col-span-2"><label className={labelClass}>Description *</label><textarea required rows={7} value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Explain what happened, what you expected, and the steps to reproduce the issue..." className={`${inputClass} resize-y`} />{fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4"><button type="button" onClick={() => navigate(-1)} className={secondaryButtonClass}>Cancel</button><button disabled={saving} type="submit" className={primaryButtonClass}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Submitting..." : "Submit Ticket"}</button></div>
        </form>
    </SupportLayout>;
}
