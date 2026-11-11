import { describe, expect, it } from "vitest";
import { formatSlug } from "@/lib/utils";

describe("formatSlug", () => {
  it("capitalises ordinary words", () => {
    expect(formatSlug("data-analysis")).toBe("Data Analysis");
    expect(formatSlug("problem_solving")).toBe("Problem Solving");
  });

  it("keeps acronyms and product names in their usual casing", () => {
    expect(formatSlug("sql")).toBe("SQL");
    expect(formatSlug("power-bi")).toBe("Power BI");
    expect(formatSlug("rest-apis")).toBe("REST APIs");
    expect(formatSlug("generative-ai")).toBe("Generative AI");
    expect(formatSlug("javascript")).toBe("JavaScript");
    expect(formatSlug("nodejs")).toBe("Node.js");
  });

  it("leaves minor words lowercase unless they start the label", () => {
    expect(formatSlug("statistics-for-ml")).toBe("Statistics for ML");
    expect(formatSlug("infrastructure-as-code")).toBe("Infrastructure as Code");
    expect(formatSlug("the-basics")).toBe("The Basics");
  });

  it("does not choke on empty or untidy input", () => {
    expect(formatSlug("")).toBe("");
    expect(formatSlug("--sql--")).toBe("SQL");
  });
});
