import { DATASET_KEY } from "../datasets/northwind-commerce";
import type {
  AnswerKey,
  ItemPayload,
  ItemType,
  PassingPolicy,
  RubricDefinition,
  SectionKind,
} from "../types";

/**
 * DATA ANALYST — "E-commerce Revenue Investigation" (v1)
 *
 * The first production blueprint. Everything here is data: sections, weights,
 * rubrics, answer keys and the passing policy. Nothing about this assessment
 * is hardcoded into a React component or an API handler.
 */

export interface BlueprintItemSeed {
  key: string;
  type: ItemType;
  prompt: string;
  helperText?: string;
  payload?: ItemPayload;
  answerKey?: AnswerKey;
  skillSlugs: string[];
  points?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface BlueprintSectionSeed {
  key: string;
  kind: SectionKind;
  title: string;
  instructions: string;
  weight: number;
  timeLimitMinutes?: number;
  rubricKey?: string;
  config?: Record<string, unknown>;
  items: BlueprintItemSeed[];
}

export interface BlueprintSeed {
  slug: string;
  version: number;
  title: string;
  summary: string;
  targetRole: string;
  careerSlug: string;
  durationMinutes: number;
  passingPolicy: PassingPolicy;
  toolsAllowed: string[];
  aiPolicy: string;
  scenario: string;
  rubrics: RubricDefinition[];
  sections: BlueprintSectionSeed[];
}

const PASSING_POLICY: PassingPolicy = {
  minOverall: 65,
  // Knowledge can never compensate for an inability to do the work.
  minPractical: 60,
  essentialSkillFloor: 55,
  minDefense: 50,
  blockOnIntegrityFlag: true,
};

const RUBRICS: RubricDefinition[] = [
  {
    key: "data_investigation",
    title: "Data Quality Investigation",
    criteria: [
      {
        key: "problem_identification",
        label: "Identified real data-quality problems",
        weight: 40,
        skillSlug: "data-analysis",
        guidance:
          "Credit only problems that genuinely exist in the dataset (duplicates, blank region, negative quantity, revenue that does not reconcile, mixed date formats, inconsistent category casing). Invented problems score zero.",
      },
      {
        key: "impact_reasoning",
        label: "Explained the analytical impact of each problem",
        weight: 30,
        skillSlug: "critical-thinking",
        guidance:
          "Does the candidate explain how each defect would distort the revenue analysis if left untreated?",
      },
      {
        key: "remediation",
        label: "Proposed a defensible cleaning approach",
        weight: 30,
        skillSlug: "data-analysis",
        guidance:
          "Is the treatment appropriate and justified (e.g. dedupe on full-row fingerprint, treat blanks as 'Unknown' rather than dropping, quarantine unreconciled revenue)? Blanket row-dropping without justification scores low.",
      },
    ],
  },
  {
    key: "practical_analysis",
    title: "Practical Revenue Analysis",
    criteria: [
      {
        key: "accuracy",
        label: "Numerical accuracy",
        weight: 25,
        skillSlug: "data-analysis",
        guidance:
          "Are the quoted figures correct and consistent with the dataset? The true Q4-vs-Q3 decline is approximately 18%.",
      },
      {
        key: "methodology",
        label: "Methodology and SQL correctness",
        weight: 20,
        skillSlug: "sql",
        guidance:
          "Is the aggregation, grouping, period comparison and join logic sound? Does the query answer the question asked?",
      },
      {
        key: "data_quality_handling",
        label: "Handled data quality in the analysis",
        weight: 15,
        skillSlug: "data-analysis",
        guidance:
          "Did the analysis actually account for duplicates, negative quantities and blank regions, or silently include them?",
      },
      {
        key: "insight_quality",
        label: "Depth and correctness of insight",
        weight: 20,
        skillSlug: "problem-solving",
        guidance:
          "Did they isolate the real drivers (North region collapse, enterprise segment loss, paid_social decay, Electronics return spike, deeper discounting) rather than restating totals?",
      },
      {
        key: "visualisation",
        label: "Visualisation and dashboard thinking",
        weight: 10,
        skillSlug: "power-bi",
        guidance:
          "Did they specify appropriate chart types and a dashboard structure that answers the business question?",
      },
      {
        key: "communication",
        label: "Clarity of communication",
        weight: 10,
        skillSlug: "communication",
        guidance: "Would a non-technical stakeholder follow this? Concise and structured beats long.",
      },
    ],
  },
  {
    key: "business_reasoning",
    title: "Business Reasoning",
    criteria: [
      {
        key: "diagnosis",
        label: "Correct diagnosis of what happened",
        weight: 30,
        skillSlug: "problem-solving",
        guidance: "Is the stated cause supported by the data, or is it a plausible-sounding guess?",
      },
      {
        key: "evidence",
        label: "Evidence supporting the conclusion",
        weight: 25,
        skillSlug: "critical-thinking",
        guidance: "Every claim should point at a number or a comparison. Unsupported assertions score low.",
      },
      {
        key: "recommendations",
        label: "Actionable, prioritised recommendations",
        weight: 25,
        skillSlug: "problem-solving",
        guidance: "Are recommendations specific, owned, and tied to the diagnosed cause? Generic advice scores low.",
      },
      {
        key: "stakeholder_communication",
        label: "Executive communication",
        weight: 20,
        skillSlug: "communication",
        guidance: "Appropriate for a CEO audience: leads with the answer, quantifies impact, avoids jargon.",
      },
    ],
  },
  {
    key: "defense",
    title: "Defense Round",
    criteria: [
      {
        key: "ownership",
        label: "Genuine ownership of the submitted work",
        weight: 40,
        skillSlug: "data-analysis",
        guidance:
          "Can the candidate explain why they made their own choices? Answers that do not engage with the specifics of their own submission score low regardless of fluency.",
      },
      {
        key: "technical_depth",
        label: "Technical depth under questioning",
        weight: 35,
        skillSlug: "sql",
        guidance: "Do they understand the mechanics behind what they wrote, including trade-offs?",
      },
      {
        key: "verification",
        label: "Verification and intellectual honesty",
        weight: 25,
        skillSlug: "critical-thinking",
        guidance:
          "Do they acknowledge uncertainty and describe how they checked their work? Admitting a limitation scores better than bluffing.",
      },
    ],
  },
];

const SCENARIO = `**Brightline Commerce** is a mid-sized online retailer selling Electronics, Home, Apparel and Beauty products across four regions.

You have just joined as a Data Analyst. On your second day the CEO forwards you this message:

> "Q4 revenue came in roughly 18% below Q3 and nobody can tell me why. Marketing says the market is soft. Sales says it's a product problem. Finance says it's discounting. I have a board meeting on Monday. I need to know what actually happened, what the evidence is, and what we should do about it."

You have been given an export of every order placed in Q3 and Q4 2024 (${"`hb-ecommerce-revenue-2024.csv`"}). It is a raw operational export — it has not been cleaned.

Your job is to investigate, analyse, and come back with an answer you can defend.`;

export const DATA_ANALYST_BLUEPRINT: BlueprintSeed = {
  slug: "data-analyst-revenue-investigation",
  version: 1,
  title: "Data Analyst — E-commerce Revenue Investigation",
  summary:
    "A work simulation. You investigate a real 2,840-row order dataset to explain an 18% revenue decline, then defend your reasoning.",
  targetRole: "Data Analyst",
  careerSlug: "data-analyst",
  durationMinutes: 150,
  passingPolicy: PASSING_POLICY,
  toolsAllowed: [
    "Excel or Google Sheets",
    "SQL (any dialect)",
    "Python / pandas",
    "Power BI, Tableau or any BI tool",
    "AI assistants — permitted, and you will be asked to explain your work",
  ],
  aiPolicy:
    "You may use AI assistants. Human Bridge evaluates whether you can direct, verify and improve AI output — not whether you avoided it. The defense round asks about the specifics of what you submitted, so submitting work you do not understand will lower your score.",
  scenario: SCENARIO,
  rubrics: RUBRICS,
  sections: [
    // ── Section 1: Knowledge (20%) ────────────────────────────────────────
    {
      key: "knowledge",
      kind: "knowledge",
      title: "Knowledge Check",
      instructions:
        "A short check on the fundamentals you will need for the investigation. This section is worth 20% — it establishes baseline knowledge, not job readiness.",
      weight: 20,
      timeLimitMinutes: 20,
      items: [
        {
          key: "sql-join-semantics",
          type: "mcq",
          prompt:
            "You have an `orders` table and a `customers` table. You need every order in the result, including orders whose `customer_id` has no matching row in `customers`. Which join do you use?",
          skillSlugs: ["sql"],
          payload: {
            options: [
              "INNER JOIN orders to customers",
              "LEFT JOIN orders to customers",
              "RIGHT JOIN orders to customers",
              "CROSS JOIN orders and customers",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "A LEFT JOIN from orders preserves every order row, filling customer columns with NULL where no match exists.",
          },
        },
        {
          key: "sql-aggregation",
          type: "mcq",
          prompt:
            "Which query correctly returns total revenue per region for orders placed in Q4 2024 only?",
          skillSlugs: ["sql"],
          payload: {
            options: [
              "SELECT region, SUM(revenue) FROM orders WHERE order_date >= '2024-10-01' GROUP BY region",
              "SELECT region, SUM(revenue) FROM orders GROUP BY region WHERE order_date >= '2024-10-01'",
              "SELECT region, revenue FROM orders WHERE order_date >= '2024-10-01' GROUP BY region",
              "SELECT region, SUM(revenue) FROM orders HAVING order_date >= '2024-10-01' GROUP BY region",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 0,
            explanation:
              "WHERE filters rows before aggregation and must precede GROUP BY. HAVING filters aggregates, not raw dates.",
          },
        },
        {
          key: "sql-window",
          type: "mcq",
          prompt:
            "You need each order alongside that customer's running total of revenue, ordered by date, without collapsing rows. What do you use?",
          skillSlugs: ["sql"],
          payload: {
            options: [
              "GROUP BY customer_id with SUM(revenue)",
              "SUM(revenue) OVER (PARTITION BY customer_id ORDER BY order_date)",
              "A correlated subquery in the WHERE clause",
              "DISTINCT ON (customer_id)",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "A window function computes the running aggregate while preserving every individual row.",
          },
        },
        {
          key: "excel-lookup",
          type: "mcq",
          prompt:
            "In Excel, you need to pull a value from a column that sits to the LEFT of your lookup column. Which approach works?",
          skillSlugs: ["excel"],
          payload: {
            options: [
              "VLOOKUP with a negative column index",
              "INDEX/MATCH, or XLOOKUP",
              "HLOOKUP with TRUE as the range lookup",
              "It is not possible in Excel",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "VLOOKUP can only look rightwards. INDEX/MATCH and XLOOKUP have no directional restriction.",
          },
        },
        {
          key: "excel-pivot",
          type: "multi_select",
          prompt:
            "You have 2,800 order rows and need revenue by region by month. Which of these would produce that correctly? Select all that apply.",
          skillSlugs: ["excel"],
          payload: {
            options: [
              "A PivotTable with Region as rows, Month as columns, Sum of Revenue as values",
              "SUMIFS with criteria on region and a month range",
              "A single AVERAGE over the revenue column",
              "Power Query group-by on region and month",
            ],
          },
          answerKey: {
            kind: "multi_select",
            correctIndexes: [0, 1, 3],
            explanation: "An overall average tells you nothing about the region-by-month breakdown.",
          },
        },
        {
          key: "stats-significance",
          type: "mcq",
          prompt:
            "Revenue fell 18% quarter over quarter. A colleague says 'that could just be noise'. What is the most rigorous way to respond?",
          skillSlugs: ["statistics"],
          payload: {
            options: [
              "Point out that 18% is a big number, so it cannot be noise",
              "Compare the change against historical quarter-over-quarter variation, and test whether the segment-level differences exceed normal fluctuation",
              "Run a p-value on the total revenue figure",
              "Increase the sample size by including Q1 and Q2",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "Significance is relative to baseline variability. A single aggregate total has no distribution to test on its own.",
          },
        },
        {
          key: "stats-mean-median",
          type: "mcq",
          prompt:
            "Order values are heavily right-skewed by a handful of large enterprise orders. Which summary best represents a typical order?",
          skillSlugs: ["statistics"],
          payload: {
            options: [
              "The mean, because it uses every data point",
              "The median, because it is not dragged by extreme values",
              "The maximum, because it shows potential",
              "The mode, always",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "With a skewed distribution the median describes the typical case; the mean describes the total divided by count.",
          },
        },
        {
          key: "viz-chart-choice",
          type: "mcq",
          prompt:
            "You want to show how revenue changed month by month across four regions in one chart. What is the most appropriate default?",
          skillSlugs: ["power-bi"],
          payload: {
            options: [
              "A pie chart per region",
              "A multi-series line chart with month on the x-axis and one line per region",
              "A single stacked bar for the full period",
              "A scatter plot of revenue against region",
            ],
          },
          answerKey: {
            kind: "mcq",
            correctIndex: 1,
            explanation:
              "Lines over a time axis are the standard encoding for trend comparison across a small number of categories.",
          },
        },
        {
          key: "data-quality-concept",
          type: "multi_select",
          prompt:
            "Before trusting a revenue total from a raw operational export, which checks are genuinely necessary? Select all that apply.",
          skillSlugs: ["data-analysis"],
          payload: {
            options: [
              "Check for exact duplicate rows",
              "Check that derived columns reconcile with their inputs",
              "Check for impossible values such as negative quantities",
              "Sort the file alphabetically by product name",
            ],
          },
          answerKey: {
            kind: "multi_select",
            correctIndexes: [0, 1, 2],
            explanation: "Sorting changes presentation, not data validity.",
          },
        },
        {
          key: "metric-definition",
          type: "short_answer",
          prompt:
            "In one or two sentences: why can total revenue stay flat while the business is in trouble? Give a concrete mechanism.",
          helperText: "Graded on whether you identify a real compensating mechanism.",
          skillSlugs: ["problem-solving", "communication"],
          payload: { placeholder: "e.g. Volume growth in a low-margin segment can mask...", rows: 3 },
          answerKey: {
            kind: "keywords",
            requiredGroups: 2,
            groups: [
              {
                label: "Mix or segment shift",
                any: ["mix", "segment", "composition", "shift", "category", "channel"],
              },
              {
                label: "Margin, discount or cost erosion",
                any: ["margin", "discount", "cost", "profit", "unit econom", "cac", "acquisition cost"],
              },
              {
                label: "Churn or retention masked by acquisition",
                any: ["churn", "retention", "one-off", "one time", "new customers", "returns", "refund"],
              },
            ],
            explanation:
              "Strong answers name a compensating mechanism: mix shift, margin erosion, or churn masked by acquisition.",
          },
        },
      ],
    },

    // ── Section 2: Data Investigation (15%) ───────────────────────────────
    {
      key: "investigation",
      kind: "investigation",
      title: "Data Investigation",
      instructions:
        "Open the dataset and audit it before you analyse anything. Find what is actually wrong with this export. Your findings here are checked against the real defects in the file.",
      weight: 15,
      timeLimitMinutes: 30,
      rubricKey: "data_investigation",
      config: { datasetKey: DATASET_KEY },
      items: [
        {
          key: "row-count",
          type: "numeric",
          prompt: "How many data rows does the export contain (excluding the header)?",
          skillSlugs: ["excel", "data-analysis"],
          payload: { unit: "rows" },
          answerKey: { kind: "numeric", value: 2840, tolerance: 0 },
        },
        {
          key: "duplicate-count",
          type: "numeric",
          prompt:
            "How many rows are exact duplicates of another row (i.e. how many rows would you remove to leave one of each)?",
          skillSlugs: ["excel", "data-analysis"],
          payload: { unit: "rows" },
          answerKey: { kind: "numeric", value: 40, tolerance: 2 },
        },
        {
          key: "missing-region-count",
          type: "numeric",
          prompt: "How many rows have a blank/missing `region` value?",
          skillSlugs: ["excel", "data-analysis"],
          payload: { unit: "rows" },
          answerKey: { kind: "numeric", value: 55, tolerance: 2 },
        },
        {
          key: "quality-report",
          type: "long_form",
          prompt:
            "Write a data-quality report. For every problem you found: state the problem, quantify it, explain how it would distort a revenue analysis, and say exactly how you would treat it.",
          helperText:
            "There are at least six distinct classes of problem in this file. Precision matters more than length.",
          skillSlugs: ["data-analysis", "critical-thinking", "communication"],
          payload: { rows: 14, minWords: 150, placeholder: "1. Duplicate rows — ..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "data_investigation",
            minWords: 150,
            expectedPoints: [
              { label: "Duplicate rows", any: ["duplicate", "dedup", "repeated row", "identical row"] },
              { label: "Missing region values", any: ["missing region", "blank region", "empty region", "null region"] },
              { label: "Negative quantities", any: ["negative quantity", "negative qty", "quantity < 0", "negative value"] },
              {
                label: "Revenue does not reconcile",
                any: ["reconcile", "does not match", "doesn't match", "recompute", "quantity * price", "revenue mismatch", "inconsistent revenue"],
              },
              { label: "Mixed date formats", any: ["date format", "dd-mm", "mm-dd", "inconsistent date", "mixed format"] },
              {
                label: "Inconsistent category casing",
                any: ["casing", "case", "lowercase", "capitali", "electronics vs", "inconsistent categor"],
              },
            ],
          },
        },
      ],
    },

    // ── Section 3: Practical Analysis (30%) ───────────────────────────────
    {
      key: "practical",
      kind: "practical",
      title: "Practical Analysis",
      instructions:
        "Do the actual analysis. Use whatever tools you would use on the job. This is the heaviest section and it cannot be compensated for by the knowledge check.",
      weight: 30,
      timeLimitMinutes: 60,
      rubricKey: "practical_analysis",
      config: { datasetKey: DATASET_KEY },
      items: [
        {
          key: "sql-quarterly-region",
          type: "sql",
          prompt:
            "Write the SQL you would run to compare revenue by region between Q3 and Q4 2024, showing the absolute and percentage change per region. Assume a table `orders` with the columns in the export.",
          helperText:
            "Your query is reviewed for logic, not executed. Handle the data-quality issues you found.",
          skillSlugs: ["sql", "data-analysis"],
          payload: { rows: 12, placeholder: "SELECT region, ..." },
          answerKey: {
            kind: "sql",
            requiredClauses: [
              { label: "Aggregates revenue", any: ["sum(revenue", "sum( revenue", "sum(o.revenue"] },
              { label: "Groups by region", any: ["group by region", "group by o.region", "group by 1", "partition by region"] },
              {
                label: "Separates the two quarters",
                any: ["case when", "quarter", "date_trunc", "extract(", "filter (where", "10-01", "07-01", "between"],
              },
              {
                label: "Computes a change or ratio",
                any: ["/", "-", "pct", "percent", "change", "ratio", "lag("],
              },
            ],
            forbiddenClauses: [
              { label: "SELECT * as the final output", any: ["select *\nfrom orders;", "select * from orders;"] },
            ],
          },
        },
        {
          key: "sql-decline-driver",
          type: "sql",
          prompt:
            "Write a second query that tests ONE specific hypothesis about the cause of the decline. State the hypothesis in a SQL comment on the first line, then the query.",
          helperText: "A good hypothesis is falsifiable and points at a segment, source, or behaviour.",
          skillSlugs: ["sql", "problem-solving"],
          payload: { rows: 12, placeholder: "-- Hypothesis: the decline is concentrated in..." },
          answerKey: {
            kind: "sql",
            requiredClauses: [
              { label: "States a hypothesis", any: ["--", "/*", "hypothesis"] },
              { label: "Aggregates a measure", any: ["sum(", "count(", "avg("] },
              {
                label: "Segments by an explanatory dimension",
                any: [
                  "acquisition_source",
                  "customer_type",
                  "category",
                  "channel",
                  "returned",
                  "discount",
                  "region",
                ],
              },
              { label: "Groups results", any: ["group by"] },
            ],
          },
        },
        {
          key: "key-findings",
          type: "long_form",
          prompt:
            "Present your analysis. What is driving the revenue decline? Quantify each driver, rank them by contribution, and state how confident you are in each.",
          helperText:
            "Numbers with context. 'North fell' is weak; 'North fell 35% QoQ, contributing roughly X of the total decline' is strong.",
          skillSlugs: ["data-analysis", "problem-solving", "statistics", "communication"],
          payload: { rows: 16, minWords: 200, placeholder: "Headline: Q4 revenue fell ..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "practical_analysis",
            minWords: 200,
            expectedPoints: [
              { label: "Quantifies the overall decline (~18%)", any: ["18%", "17.8", "18 percent", "~18"] },
              { label: "Identifies the North region collapse", any: ["north"] },
              { label: "Identifies the enterprise segment loss", any: ["enterprise"] },
              { label: "Identifies paid_social decay", any: ["paid_social", "paid social", "social"] },
              { label: "Identifies the Electronics return spike", any: ["return", "electronics"] },
              { label: "Identifies deeper discounting", any: ["discount"] },
            ],
          },
        },
        {
          key: "dashboard-spec",
          type: "long_form",
          prompt:
            "Specify the dashboard you would build for the CEO. For each visual: the chart type, the exact measure and dimensions, and the decision it supports. Describe the layout and the top-line KPI strip.",
          helperText:
            "You may also upload a screenshot of an actual dashboard you built in the next question.",
          skillSlugs: ["power-bi", "tableau", "communication"],
          payload: { rows: 12, minWords: 120, placeholder: "KPI strip: Total revenue (QoQ %), ..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "practical_analysis",
            minWords: 120,
            expectedPoints: [
              { label: "Defines KPI headline metrics", any: ["kpi", "headline", "card", "scorecard", "total revenue"] },
              { label: "Trend over time", any: ["line", "trend", "over time", "monthly", "time series"] },
              { label: "Breakdown by segment", any: ["by region", "bar", "breakdown", "segment", "column chart"] },
              { label: "Contribution or waterfall", any: ["waterfall", "contribution", "bridge", "decomposition"] },
              { label: "Interactivity or filters", any: ["filter", "slicer", "drill", "interactive"] },
            ],
          },
        },
        {
          key: "work-artifact",
          type: "file_upload",
          prompt:
            "Optional: upload your working file — the cleaned dataset, your Excel workbook, a dashboard screenshot, or a notebook export.",
          helperText:
            "Optional, but uploaded work counts as additional evidence on your Skill Passport. CSV, XLSX, PDF, PNG or JPG, up to 10 MB.",
          skillSlugs: ["excel", "data-analysis"],
          payload: { accept: [".csv", ".xlsx", ".pdf", ".png", ".jpg"] },
          points: 0,
        },
        {
          key: "ai-usage",
          type: "long_form",
          prompt:
            "If you used an AI assistant, describe how: what you asked it, what it got wrong or was unable to verify, and what you changed. If you did not use one, say so and describe how you verified your own numbers.",
          helperText:
            "There is no penalty for using AI. There is a penalty for not being able to explain or verify your output.",
          skillSlugs: ["critical-thinking"],
          payload: { rows: 8, minWords: 60, placeholder: "I used AI to draft the SQL for..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "practical_analysis",
            minWords: 60,
            expectedPoints: [
              { label: "Describes verification", any: ["verif", "check", "cross-check", "validated", "reconcil", "tested", "sanity"] },
              { label: "Identifies a limitation or correction", any: ["wrong", "incorrect", "corrected", "changed", "limitation", "hallucinat", "missed"] },
            ],
          },
        },
      ],
    },

    // ── Section 4: Business Reasoning (15%) ───────────────────────────────
    {
      key: "reasoning",
      kind: "reasoning",
      title: "Business Reasoning",
      instructions:
        "The CEO does not want a data report. They want a decision. Answer as you would in the room.",
      weight: 15,
      timeLimitMinutes: 25,
      rubricKey: "business_reasoning",
      items: [
        {
          key: "executive-summary",
          type: "long_form",
          prompt:
            "Write the executive summary you would send the CEO before the board meeting. Maximum 200 words. Lead with the answer.",
          skillSlugs: ["communication", "problem-solving"],
          payload: { rows: 10, minWords: 80, placeholder: "Q4 revenue fell 18%. The primary driver is..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "business_reasoning",
            minWords: 80,
            expectedPoints: [
              { label: "States the primary cause up front", any: ["north", "enterprise", "primary", "main driver", "largest"] },
              { label: "Quantifies impact", any: ["%", "revenue", "₹", "crore", "lakh", "decline"] },
              { label: "Distinguishes cause from symptom", any: ["not", "rather than", "however", "although", "while"] },
            ],
          },
        },
        {
          key: "recommendations",
          type: "long_form",
          prompt:
            "Give three prioritised recommendations. For each: the action, the owner, the expected impact, and the metric you would use to know if it worked.",
          skillSlugs: ["problem-solving", "communication"],
          payload: { rows: 12, minWords: 120, placeholder: "1. Action: ... Owner: ... Expected impact: ... Metric: ..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "business_reasoning",
            minWords: 120,
            expectedPoints: [
              { label: "Names owners", any: ["owner", "sales", "marketing", "finance", "product", "cs ", "support"] },
              { label: "Defines success metrics", any: ["metric", "measure", "kpi", "track", "monitor"] },
              { label: "Prioritises", any: ["first", "priority", "1.", "highest", "immediate"] },
            ],
          },
        },
        {
          key: "counter-evidence",
          type: "long_form",
          prompt:
            "What would have to be true for your conclusion to be WRONG? Name the data you do not have that would change your answer.",
          helperText: "This tests intellectual honesty. 'Nothing' is a weak answer.",
          skillSlugs: ["critical-thinking"],
          payload: { rows: 8, minWords: 60, placeholder: "My conclusion assumes..." },
          answerKey: {
            kind: "rubric",
            rubricKey: "business_reasoning",
            minWords: 60,
            expectedPoints: [
              { label: "Names a specific assumption", any: ["assum", "if ", "depends", "presum"] },
              { label: "Names missing data", any: ["missing", "do not have", "don't have", "would need", "no data", "unavailable", "prior quarter", "historical", "competitor", "seasonal"] },
            ],
          },
        },
      ],
    },

    // ── Section 5: Defense (20%) ──────────────────────────────────────────
    {
      key: "defense",
      kind: "defense",
      title: "Defense Round",
      instructions:
        "Questions generated from what you actually submitted. There is no preparation for this — it checks that the work is yours and that you understand it.",
      weight: 20,
      timeLimitMinutes: 20,
      rubricKey: "defense",
      config: { maxQuestions: 4 },
      items: [],
    },
  ],
};

export const BLUEPRINT_SEEDS: BlueprintSeed[] = [DATA_ANALYST_BLUEPRINT];
