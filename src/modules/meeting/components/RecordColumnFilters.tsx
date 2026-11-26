export type RecordFilter = { key: string; label: string };
export function matchesRecordFilters(values: Record<string, unknown>, filters: Record<string, string>) {
    return Object.entries(filters).every(([key, value]) => !value.trim() || String(values[key] ?? "").toLowerCase().includes(value.trim().toLowerCase()));
}
export function RecordFilterInput({ column, filters, onChange }: { column: RecordFilter; filters: Record<string, string>; onChange: (key: string, value: string) => void }) {
    return <input aria-label={`Filter ${column.label}`} value={filters[column.key] ?? ""} onChange={event => onChange(column.key, event.target.value)} placeholder={`Filter ${column.label.toLowerCase()}`} className="h-9 w-full min-w-24 rounded-lg border border-slate-300 bg-white px-2 text-xs font-normal normal-case outline-none focus:border-indigo-500" />;
}
export default function RecordColumnFilters({ columns, filters, onChange }: { columns: RecordFilter[]; filters: Record<string, string>; onChange: (key: string, value: string) => void }) {
    return <tr>{columns.map(column => <th key={column.key} className="p-2"><RecordFilterInput column={column} filters={filters} onChange={onChange} /></th>)}<th className="p-2"><button type="button" onClick={() => columns.forEach(column => onChange(column.key, ""))} className="text-xs font-semibold text-indigo-600">Clear</button></th></tr>;
}
