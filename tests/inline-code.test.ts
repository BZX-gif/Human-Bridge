import { describe, expect, it } from "vitest";
import { splitInlineCode } from "@/lib/utils";

describe("splitInlineCode", () => {
  it("returns plain text as a single run", () => {
    expect(splitInlineCode("Which join do you use?")).toEqual([{ text: "Which join do you use?", code: false }]);
  });

  it("marks backtick-quoted names as code and drops the backticks", () => {
    expect(splitInlineCode("You have an `orders` table and a `customers` table.")).toEqual([
      { text: "You have an ", code: false },
      { text: "orders", code: true },
      { text: " table and a ", code: false },
      { text: "customers", code: true },
      { text: " table.", code: false },
    ]);
  });

  it("handles a code span at the start or the end", () => {
    expect(splitInlineCode("`region` is blank")).toEqual([
      { text: "region", code: true },
      { text: " is blank", code: false },
    ]);
    expect(splitInlineCode("Open `hb-ecommerce-revenue-2024.csv`")).toEqual([
      { text: "Open ", code: false },
      { text: "hb-ecommerce-revenue-2024.csv", code: true },
    ]);
  });

  it("leaves a backtick with no partner in the text", () => {
    expect(splitInlineCode("It`s unmatched")).toEqual([{ text: "It`s unmatched", code: false }]);
    expect(splitInlineCode("Use `id` and the ` character")).toEqual([
      { text: "Use ", code: false },
      { text: "id", code: true },
      { text: " and the ` character", code: false },
    ]);
  });

  it("returns nothing for empty input and skips empty spans", () => {
    expect(splitInlineCode("")).toEqual([]);
    expect(splitInlineCode("a `` b")).toEqual([{ text: "a  b", code: false }]);
  });
});
