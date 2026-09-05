"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { PublicItem } from "@/lib/services/assessment-service";
import type { ResponseValue } from "@/lib/assessment/types";

export interface ItemInputProps {
  item: PublicItem;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  onPaste?: (characters: number) => void;
}

/**
 * Renders the correct input for each item type.
 *
 * Note: this component never knows the correct answer. Answer keys are stripped
 * server-side, so no amount of client inspection reveals them.
 */
export function ItemInput({ item, value, onChange, onPaste }: ItemInputProps) {
  const id = useId();
  const options = item.payload.options ?? [];

  switch (item.type) {
    case "mcq":
      return (
        <fieldset className="space-y-2">
          <legend className="sr-only">{item.prompt}</legend>
          {options.map((option, index) => {
            const selected = value?.kind === "choice" && value.index === index;
            return (
              <label
                key={index}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
                  selected
                    ? "border-[#1a56ff] bg-[#eef3ff] text-[#1a3fb8]"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  "focus-within:ring-2 focus-within:ring-[#1a56ff] focus-within:ring-offset-2",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-${item.key}`}
                  className="mt-0.5 h-4 w-4 accent-[#1a56ff]"
                  checked={selected}
                  onChange={() => onChange({ kind: "choice", index })}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </fieldset>
      );

    case "multi_select": {
      const chosen = value?.kind === "choices" ? value.indexes : [];
      return (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-slate-500">Select all that apply</legend>
          {options.map((option, index) => {
            const selected = chosen.includes(index);
            return (
              <label
                key={index}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
                  selected
                    ? "border-[#1a56ff] bg-[#eef3ff] text-[#1a3fb8]"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  "focus-within:ring-2 focus-within:ring-[#1a56ff] focus-within:ring-offset-2",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#1a56ff]"
                  checked={selected}
                  onChange={() =>
                    onChange({
                      kind: "choices",
                      indexes: selected
                        ? chosen.filter((i) => i !== index)
                        : [...chosen, index].sort((a, b) => a - b),
                    })
                  }
                />
                <span>{option}</span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    case "numeric":
      return (
        <div className="flex items-center gap-2">
          <input
            id={`${id}-${item.key}`}
            type="number"
            inputMode="decimal"
            className="w-48 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/20"
            value={value?.kind === "number" ? value.value : ""}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              if (e.target.value === "") return;
              if (Number.isFinite(parsed)) onChange({ kind: "number", value: parsed });
            }}
            aria-label={item.prompt}
          />
          {item.payload.unit && (
            <span className="text-sm text-slate-500">{item.payload.unit}</span>
          )}
        </div>
      );

    case "sql":
      return (
        <textarea
          id={`${id}-${item.key}`}
          rows={item.payload.rows ?? 10}
          spellCheck={false}
          className="w-full rounded-xl border border-slate-200 bg-slate-900 px-3.5 py-3 font-mono text-[13px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/30"
          placeholder={item.payload.placeholder ?? "SELECT ..."}
          value={value?.kind === "text" ? value.text : ""}
          onChange={(e) => onChange({ kind: "text", text: e.target.value })}
          onPaste={(e) => onPaste?.(e.clipboardData.getData("text").length)}
          aria-label={item.prompt}
        />
      );

    case "file_upload":
      return <FileField item={item} value={value} onChange={onChange} />;

    case "short_answer":
    case "long_form":
    default: {
      const text = value?.kind === "text" ? value.text : "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minWords = item.payload.minWords;
      return (
        <div>
          <textarea
            id={`${id}-${item.key}`}
            rows={item.payload.rows ?? 5}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/20"
            placeholder={item.payload.placeholder ?? "Write your answer..."}
            value={text}
            onChange={(e) => onChange({ kind: "text", text: e.target.value })}
            onPaste={(e) => onPaste?.(e.clipboardData.getData("text").length)}
            aria-label={item.prompt}
          />
          {minWords !== undefined && (
            <p
              className={cn(
                "mt-1.5 text-xs",
                words >= minWords ? "text-slate-400" : "text-amber-600",
              )}
            >
              {words} words · {minWords} suggested for a complete answer
            </p>
          )}
        </div>
      );
    }
  }
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

function FileField({ item, value, onChange }: Omit<ItemInputProps, "onPaste">) {
  const accept = item.payload.accept ?? [];
  const current = value?.kind === "file" ? value : null;

  return (
    <div>
      <input
        type="file"
        accept={accept.join(",")}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          // Client-side guard for UX. The server re-validates size and type —
          // the browser is never trusted for file safety.
          if (file.size > MAX_UPLOAD_BYTES) {
            e.target.value = "";
            alert("File is larger than the 10 MB limit.");
            return;
          }
          if (file.type && !ALLOWED_TYPES.has(file.type)) {
            e.target.value = "";
            alert("That file type is not accepted. Use CSV, XLSX, PDF, PNG or JPG.");
            return;
          }
          onChange({
            kind: "file",
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          });
        }}
        aria-label={item.prompt}
      />
      {current && (
        <p className="mt-2 text-xs text-slate-500">
          Attached: <span className="font-medium text-slate-700">{current.fileName}</span> (
          {(current.size / 1024).toFixed(0)} KB). File metadata is recorded as evidence.
        </p>
      )}
    </div>
  );
}
