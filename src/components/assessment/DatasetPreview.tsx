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
    <section className="rounded-lg border border-line bg-paper" aria-label="Dataset">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-faint" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">{datasetKey}.csv</p>
            <p className="text-xs text-muted">
              {totalRows.toLocaleString()} rows · {columns.length} columns · raw operational export
            </p>
          </div>
        </div>
        <a
          href={`/api/dataset?key=${encodeURIComponent(datasetKey)}`}
          className="inline-flex items-center gap-2 rounded-md bg-ink px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2B2B30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0C] focus-visible:ring-offset-2"
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
          <thead className="bg-paper-2 text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((row, i) => (
              <tr key={i} className="text-graphite">
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

      <footer className="border-t border-line p-3 text-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0C] focus-visible:ring-offset-2 rounded"
        >
          {expanded ? "Show fewer rows" : `Show ${rows.length} preview rows`}
        </button>
      </footer>
    </section>
  );
}
