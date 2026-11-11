"use client";

import { useState } from "react";
import { ChevronDown, Download, Table2 } from "lucide-react";

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
    <section className="hb-card overflow-clip" aria-label="Dataset">
      <header className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-7">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-moss-soft text-moss">
            <Table2 size={19} strokeWidth={1.7} aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">{datasetKey}.csv</p>
            <p className="tabular text-sm text-muted">
              {totalRows.toLocaleString("en-GB")} rows · {columns.length} columns · raw operational export
            </p>
          </div>
        </div>
        <a
          href={`/api/dataset?key=${encodeURIComponent(datasetKey)}`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-md font-medium text-white transition-[background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-[0.97]"
          download
        >
          <Download size={15} aria-hidden />
          Download CSV
        </a>
      </header>

      <div className="hb-scroll-x border-y border-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">Preview of the first rows of the assessment dataset</caption>
          <thead className="bg-paper-2 text-xs text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="whitespace-nowrap px-4 py-2.5 font-semibold first:pl-5 sm:first:pl-7">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            {visible.map((row, i) => (
              <tr key={i} className="text-graphite transition-colors duration-150 hover:bg-paper-2">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-2.5 first:pl-5 sm:first:pl-7">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="p-3 text-center">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="hb-link text-sm">
          {expanded ? "Show fewer rows" : `Show ${rows.length} preview rows`}
          <ChevronDown
            size={14}
            strokeWidth={2.2}
            className={expanded ? "rotate-180 transition-transform duration-300" : "transition-transform duration-300"}
            aria-hidden
          />
        </button>
      </footer>
    </section>
  );
}
