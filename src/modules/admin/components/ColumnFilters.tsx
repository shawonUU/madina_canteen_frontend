import type { Dispatch, SetStateAction } from "react";

export type Filters = Record<string, string>;
type Column = { key: string; label: string; options?: string[] } | null;

export function matchesColumns(values: Record<string, unknown>, filters: Filters): boolean {
  return Object.entries(filters).every(([key, value]) => {
    if (!value.trim()) return true;
    const actual = String(values[key] ?? "").toLowerCase();
    return key === "status" ? actual === value.toLowerCase() : actual.includes(value.trim().toLowerCase());
  });
}

export default function ColumnFilters({ columns, values, onChange }: {
  columns: Column[]; values: Filters; onChange: Dispatch<SetStateAction<Filters>>;
}) {
  return <tr className="border-b border-slate-200 bg-slate-50/70">
    {columns.map((column, index) => <th key={column?.key ?? index} className="px-3 py-2 font-normal">
      {column && (column.options ? <select aria-label={`Filter ${column.label}`} value={values[column.key] ?? ""}
        onChange={(event) => onChange((previous) => ({ ...previous, [column.key]: event.target.value }))}
        className="w-full min-w-24 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">
        <option value="">All {column.label}</option>{column.options.map((option) => <option key={option}>{option}</option>)}
      </select> : <input aria-label={`Filter ${column.label}`} placeholder={`Filter ${column.label}`} value={values[column.key] ?? ""}
        onChange={(event) => onChange((previous) => ({ ...previous, [column.key]: event.target.value }))}
        className="w-full min-w-24 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700" />)}
    </th>)}
  </tr>;
}
