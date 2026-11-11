"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { PublicItem } from "@/lib/services/assessment-service";
import type { ResponseValue } from "@/lib/assessment/types";
import { InlineText } from "@/components/ui/InlineText";

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
        <fieldset className="space-y-2.5">
          <legend className="sr-only">{item.prompt}</legend>
          {options.map((option, index) => {
            const selected = value?.kind === "choice" && value.index === index;
            return (
              <label
                key={index}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md p-4 text-md leading-relaxed transition-[background-color,box-shadow] duration-200 ease-apple",
                  selected
                    ? "bg-accent-soft text-ink ring-2 ring-inset ring-accent"
                    : "bg-paper text-graphite ring-1 ring-inset ring-line-strong hover:bg-paper-2",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent/60",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-${item.key}`}
                  className="mt-[3px] focus-visible:outline-none"
                  checked={selected}
                  onChange={() => onChange({ kind: "choice", index })}
                />
                <span>
                  <InlineText>{option}</InlineText>
                </span>
              </label>
            );
          })}
        </fieldset>
      );

    case "multi_select": {
      const chosen = value?.kind === "choices" ? value.indexes : [];
      return (
        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-sm font-medium text-muted">Select all that apply</legend>
          {options.map((option, index) => {
            const selected = chosen.includes(index);
            return (
              <label
                key={index}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md p-4 text-md leading-relaxed transition-[background-color,box-shadow] duration-200 ease-apple",
                  selected
                    ? "bg-accent-soft text-ink ring-2 ring-inset ring-accent"
                    : "bg-paper text-graphite ring-1 ring-inset ring-line-strong hover:bg-paper-2",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent/60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-[3px] focus-visible:outline-none"
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
                <span>
                  <InlineText>{option}</InlineText>
                </span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    case "numeric":
      return (
        <div className="flex items-center gap-3">
          <input
            id={`${id}-${item.key}`}
            type="number"
            inputMode="decimal"
            className="hb-input tabular w-48"
            value={value?.kind === "number" ? value.value : ""}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              if (e.target.value === "") return;
              if (Number.isFinite(parsed)) onChange({ kind: "number", value: parsed });
            }}
            aria-label={item.prompt}
          />
          {item.payload.unit && (
            <span className="text-md text-muted">{item.payload.unit}</span>
          )}
        </div>
      );

    case "sql":
      return (
        <textarea
          id={`${id}-${item.key}`}
          rows={item.payload.rows ?? 10}
          spellCheck={false}
          className="w-full rounded-md bg-[#1d1d1f] px-4 py-3.5 font-mono text-sm leading-relaxed text-[#f5f5f7] caret-[#2997ff] placeholder:text-[#86868b] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/50"
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
            className="hb-input leading-relaxed"
            placeholder={item.payload.placeholder ?? "Write your answer..."}
            value={text}
            onChange={(e) => onChange({ kind: "text", text: e.target.value })}
            onPaste={(e) => onPaste?.(e.clipboardData.getData("text").length)}
            aria-label={item.prompt}
          />
          {minWords !== undefined && (
            <p
              className={cn("tabular mt-2 text-sm", words >= minWords ? "text-muted" : "text-ochre")}
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
        className="block w-full cursor-pointer rounded-md bg-paper-2 p-2.5 text-md text-muted file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-paper file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:shadow-xs hover:file:bg-paper-3"
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
        <p className="mt-2.5 text-sm text-muted">
          Attached: <span className="font-medium text-ink">{current.fileName}</span> (
          {(current.size / 1024).toFixed(0)} KB). File metadata is recorded as evidence.
        </p>
      )}
    </div>
  );
}
