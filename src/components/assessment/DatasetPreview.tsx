"use client";

import { useState } from "react";
import { Download, Table2 } from "lucide-react";

export interface DatasetPreviewProps {
  datasetKey: string;
  columns: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

/**
 * Read-only dataset preview shown inside the workspace. Candidates download the
 * full CSV to work in their own tools; this grid is for orientation only.
 */
export function DatasetPreview({ datasetKey, columns, rows, totalRows }: DatasetPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 8);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white" aria-label="Dataset">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-slate-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-900">{datasetKey}.csv</p>
            <p className="text-xs text-slate-500">
              {totalRows.toLocaleString()} rows · {columns.length} columns · raw operational export
            </p>
          </div>
        </div>
        <a
          href={`/api/dataset?key=${encodeURIComponent(datasetKey)}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a56ff] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1040cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56ff] focus-visible:ring-offset-2"
          download
        >
          <Download size={13} aria-hidden />
          Download CSV
        </a>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <caption className="sr-only">
            Preview of the first rows of the assessment dataset
          </caption>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row, i) => (
              <tr key={i} className="text-slate-700">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-3 py-2">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-100 p-3 text-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-[#1a56ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56ff] focus-visible:ring-offset-2 rounded"
        >
          {expanded ? "Show fewer rows" : `Show ${rows.length} preview rows`}
        </button>
      </footer>
    </section>
  );
}
