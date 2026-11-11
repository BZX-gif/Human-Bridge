import { Fragment } from "react";
import { splitInlineCode } from "@/lib/utils";

/**
 * Renders the one piece of markup that content strings use: `code` spans for
 * table, column and file names. Everything else stays plain text, so this is
 * safe for any stored or generated string.
 */
export function InlineText({ children }: { children: string | null | undefined }) {
  if (!children) return null;

  return (
    <>
      {splitInlineCode(children).map((run, index) =>
        run.code ? (
          <code key={index} className="hb-code">
            {run.text}
          </code>
        ) : (
          <Fragment key={index}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}
