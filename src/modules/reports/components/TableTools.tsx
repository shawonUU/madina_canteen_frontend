import { useState } from "react";

export interface FilterColumn<T> { key: string; label: string; value: (row: T) => unknown }

export function useColumnFilters<T>(data: T[], columns: FilterColumn<T>[]) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const rows = data.filter((row) => columns.every((column) => {
    const search = (filters[column.key] ?? "").trim().toLocaleLowerCase();
    return !search || String(column.value(row) ?? "").toLocaleLowerCase().includes(search);
  }));
  const setFilter = (key: string, value: string) => setFilters((previous) => ({ ...previous, [key]: value }));
  return { rows, filters, setFilter, reset: () => setFilters({}) };
}

type FilterProps = { columns: ({ key: string; label: string } | null)[]; filters: Record<string, string>; onChange: (key: string, value: string) => void };
export function ColumnFilterRow({ columns, filters, onChange }: FilterProps) {
  return <tr className="bg-slate-50 border-b border-slate-200">{columns.map((column, index) => <th key={column?.key ?? index} className="px-3 py-2">{column && <input aria-label={`Filter ${column.label}`} value={filters[column.key] ?? ""} onChange={(event) => onChange(column.key, event.target.value)} placeholder={`Filter ${column.label}`} className="w-full min-w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-700 focus:border-indigo-400 focus:outline-none" />}</th>)}</tr>;
}

export function ColumnFilterPanel({ columns, filters, onChange }: FilterProps) {
  return <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{columns.filter((column) => column !== null).map((column) => <label key={column.key} className="text-xs text-slate-500">{column.label}<input value={filters[column.key] ?? ""} onChange={(event) => onChange(column.key, event.target.value)} placeholder={`Filter ${column.label}`} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" /></label>)}</div>;
}

export function downloadCsv<T>(filename: string, rows: T[], columns: FilterColumn<T>[]) {
  const escape = (value: unknown) => {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const content = [columns.map((column) => escape(column.label)).join(","), ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
