import type { DemandLevel, SkillImportance } from "@/lib/demo-data";
import type { SkillLevel } from "@/lib/assessment/types";

/**
 * Skills taxonomy seed data.
 *
 * This is deliberately separate from the legacy role catalogue
 * (demo-data.ts / careers). The taxonomy is the shared, measurable layer:
 *   12 career tracks → track_skills (many-to-many) → canonical skills →
 *   sub-skills + capability definitions + assessments.
 *
 * Everything here is upserted by idempotent seed; nothing here is hardcoded
 * in UI components — those read from the database.
 */

export type SkillCategoryKey = "core" | "tool" | "human" | "domain" | "ai";

export interface TaxonomySkillSeed {
  name: string;
  slug: string;
  description: string;
  category: SkillCategoryKey;
  skillType: "domain" | "tool" | "human" | "ai_fluency";
  difficulty: "beginner" | "intermediate" | "advanced";
  importance: SkillImportance;
  marketRelevance: DemandLevel;
  whyEmployersWant?: string;
}

function s(
  name: string,
  slug: string,
  description: string,
  category: SkillCategoryKey,
  skillType: TaxonomySkillSeed["skillType"],
  difficulty: TaxonomySkillSeed["difficulty"],
  importance: SkillImportance,
  marketRelevance: DemandLevel,
  whyEmployersWant?: string,
): TaxonomySkillSeed {
  return { name, slug, description, category, skillType, difficulty, importance, marketRelevance, whyEmployersWant };
}

export const TAXONOMY_SKILLS: TaxonomySkillSeed[] = [
  // ── Software Engineering ────────────────────────────────────────────────
  s("Programming Fundamentals", "programming-fundamentals", "Core programming concepts: variables, control flow, functions, data types and problem decomposition.", "core", "domain", "beginner", "essential", "very_high", "Every software role is built on these fundamentals; they transfer across languages and frameworks."),
  s("Data Structures & Algorithms", "data-structures-algorithms", "Arrays, linked lists, trees, graphs, hashing, sorting, searching and algorithmic complexity.", "core", "domain", "intermediate", "essential", "very_high", "The basis of writing code that stays correct and fast at scale."),
  s("Git/GitHub", "git-github", "Version control: commits, branching, merging, pull requests, code review and collaborative workflows.", "tool", "tool", "beginner", "essential", "very_high", "No modern engineering team ships without it — it is the first tool a new hire must master."),
  s("REST APIs", "rest-apis", "Designing and consuming HTTP APIs: resources, methods, status codes, auth, versioning and contracts.", "core", "domain", "intermediate", "essential", "very_high", "APIs are how products talk to each other; broken contracts break business flows."),
  s("Backend Development", "backend-development", "Server-side development: services, data access, business logic, security and performance.", "core", "domain", "intermediate", "essential", "very_high", "Backend engineers own correctness, security and cost of every product feature."),
  s("Frontend Development", "frontend-development", "Client-side development: UI component architecture, state, accessibility and performance.", "core", "domain", "intermediate", "essential", "very_high", "The user-facing layer decides whether a product is usable and believable."),
  s("Testing & Debugging", "testing-debugging", "Unit, integration and end-to-end testing; systematic debugging and root-cause isolation.", "core", "domain", "intermediate", "essential", "very_high", "Employers pay for people who can find why something broke, not just who can write code."),
  s("System Design", "system-design", "Designing large systems: scalability, reliability, trade-offs, data flows and failure modes.", "core", "domain", "advanced", "important", "very_high", "Senior engineers are hired to make architecture decisions that survive traffic and change."),

  // ── Data Analytics ──────────────────────────────────────────────────────
  s("Data Cleaning", "data-cleaning", "Profiling data, handling duplicates, missing values, inconsistent formats and invalid records.", "core", "domain", "beginner", "essential", "very_high", "Analysis is only as trustworthy as the data behind it — cleaning is the highest-leverage analyst skill."),
  s("Data Visualization", "data-visualization", "Choosing and building charts and dashboards that communicate findings honestly and clearly.", "core", "domain", "beginner", "important", "high", "Insight that cannot be seen cannot be acted on."),
  s("Business Analysis", "business-analysis", "Translating business needs into requirements, process maps and measurable solutions.", "domain", "domain", "intermediate", "important", "high", "The bridge between what the business needs and what teams actually build."),

  // ── AI / Machine Learning ───────────────────────────────────────────────
  s("Machine Learning Fundamentals", "machine-learning-fundamentals", "Supervised/unsupervised learning, regression, classification, cross-validation and model selection.", "core", "domain", "intermediate", "essential", "very_high", "Day-to-day ML work is fundamentals: framing the problem, choosing the model, validating it."),
  s("Statistics for ML", "statistics-for-ml", "Distributions, hypothesis testing, confidence intervals and statistical reasoning underpinning ML.", "core", "domain", "intermediate", "important", "high", "ML without statistics produces confident nonsense."),
  s("Feature Engineering", "feature-engineering", "Transforming raw data into features that let models learn: encoding, scaling, interaction and selection.", "core", "domain", "intermediate", "important", "high", "In practice, features move metrics more than architecture."),
  s("Model Evaluation", "model-evaluation", "Metrics, baselines, leakage, lift, calibration and honest comparison of model performance.", "core", "domain", "intermediate", "essential", "very_high", "The difference between a shipped model and a demo is evaluation discipline."),
  s("Deep Learning", "deep-learning", "Neural networks: architectures, training, regularisation and modern model families.", "core", "domain", "advanced", "important", "high", "Needed wherever classic ML hits its ceiling — vision, sequence and language problems."),
  s("Natural Language Processing", "natural-language-processing", "Processing and understanding text: tokenisation, embeddings, classification and generation pipelines.", "core", "domain", "advanced", "important", "high", "Text is the largest unstructured asset most companies own."),

  // ── Cloud / DevOps ──────────────────────────────────────────────────────
  s("Linux", "linux", "Command-line operation, filesystems, processes, permissions, shells and system administration.", "tool", "tool", "beginner", "essential", "very_high", "Almost every production server — cloud or on-prem — runs Linux."),
  s("Networking", "networking", "TCP/IP, DNS, HTTP, routing, load balancing and diagnosing connectivity issues.", "core", "domain", "intermediate", "important", "high", "Most production incidents are network incidents."),
  s("Cloud Fundamentals", "cloud-fundamentals", "Core cloud concepts: regions, availability, accounts, billing, IAM and shared responsibility.", "core", "domain", "beginner", "essential", "very_high", "Cloud is the default deployment target for new work."),
  s("AWS", "aws", "Working with AWS: EC2, S3, Lambda, RDS, IAM, VPC and cost-aware operations.", "tool", "tool", "intermediate", "essential", "very_high", "The most widely used cloud platform in the market."),
  s("Azure", "azure", "Working with Azure: VMs, storage, AKS, Entra ID and hybrid scenarios.", "tool", "tool", "intermediate", "important", "high", "Enterprise estates are frequently Azure-based, especially in regulated industries."),
  s("Docker", "docker", "Building, running and shipping containerised applications: images, registries, compose and volumes.", "tool", "tool", "intermediate", "essential", "very_high", "Containers are the unit of modern deployment."),
  s("Kubernetes", "kubernetes", "Orchestrating containers: deployments, services, ingress, autoscaling and observability.", "tool", "tool", "advanced", "important", "very_high", "Standard for running containerised workloads at scale."),
  s("CI/CD", "ci-cd", "Continuous integration and delivery pipelines: builds, tests, releases and rollbacks.", "core", "domain", "intermediate", "essential", "very_high", "Teams that ship often ship better — pipelines make shipping safe."),
  s("Infrastructure as Code", "infrastructure-as-code", "Declaratively managing infrastructure (Terraform, CloudFormation): versioning, state and drift.", "core", "domain", "advanced", "important", "high", "Repeatable, reviewable, recoverable infrastructure."),
  s("Monitoring & Observability", "monitoring-observability", "Metrics, logs, traces, alerting and SLOs for reliable production systems.", "core", "domain", "intermediate", "important", "high", "You cannot fix what you cannot see."),

  // ── Cybersecurity ───────────────────────────────────────────────────────
  s("Security Fundamentals", "security-fundamentals", "Core security concepts: CIA triad, threat modelling, authentication, authorisation and defence in depth.", "core", "domain", "beginner", "essential", "very_high", "Security is a baseline expectation of every modern role, not a specialist-only concern."),
  s("Networking Security", "networking-security", "Firewalls, segmentation, VPNs, TLS, intrusion detection and securing network boundaries.", "core", "domain", "intermediate", "essential", "very_high", "Network boundaries are the first line of defence in most environments."),
  s("Linux Security", "linux-security", "Hardening Linux hosts: users, permissions, auditing, SELinux/apparmor and patching.", "core", "domain", "intermediate", "important", "high", "Most servers are Linux; most exploited servers are badly configured Linux."),
  s("Application Security", "application-security", "Securing software: input validation, injection, auth flaws, secret handling and security reviews.", "core", "domain", "intermediate", "essential", "very_high", "Application flaws are the most common entry point for attackers."),
  s("OWASP Fundamentals", "owasp-fundamentals", "The OWASP Top 10: recognising and remediating the most common web vulnerabilities.", "core", "domain", "intermediate", "essential", "high", "A shared vocabulary with the industry's most respected security guidance."),
  s("Vulnerability Management", "vulnerability-management", "Scanning, prioritising, tracking and remediating vulnerabilities across an estate.", "core", "domain", "intermediate", "essential", "very_high", "Continuous risk reduction is the core operational security job."),
  s("Incident Response", "incident-response", "Detecting, containing, eradicating and learning from security incidents.", "core", "domain", "advanced", "essential", "very_high", "How an organisation responds decides the cost of a breach."),
  s("Cloud Security", "cloud-security", "Securing cloud accounts, IAM, storage, workloads and compliance in cloud environments.", "core", "domain", "intermediate", "important", "high", "Cloud misconfiguration is the single biggest source of public data breaches."),
  s("Security Operations", "security-operations", "SOC operations: SIEM, detection engineering, threat hunting and security metrics.", "core", "domain", "advanced", "important", "high", "Where detection and response actually run day to day."),

  // ── UI/UX Design ────────────────────────────────────────────────────────
  s("User Flows", "user-flows", "Mapping user journeys, task flows and navigation structures before visual design.", "core", "domain", "beginner", "important", "high", "Flows expose where products fail before a pixel is drawn."),
  s("UI Design", "ui-design", "Visual interface design: layout, typography, colour, hierarchy and component styling.", "core", "domain", "intermediate", "essential", "very_high", "The interface is the product from the user's side."),
  s("Design Systems", "design-systems", "Building and governing reusable design tokens, components and guidelines.", "core", "domain", "advanced", "important", "high", "Design systems cut cost, increase consistency and speed shipping."),
  s("Accessibility", "accessibility", "Designing and building for WCAG: semantics, keyboard use, contrast, screen readers and inclusive UX.", "core", "domain", "intermediate", "essential", "very_high", "Accessibility is a legal and ethical requirement — and it improves UX for everyone."),
  s("Usability Testing", "usability-testing", "Planning and running moderated/unmoderated tests, analysing behaviours and iterating.", "core", "domain", "intermediate", "essential", "very_high", "Evidence from real users beats opinion from the room."),

  // ── Digital Marketing ───────────────────────────────────────────────────
  s("Market Research", "market-research", "Audience, competitor and market analysis to ground strategy in evidence.", "core", "domain", "beginner", "important", "high", "Strategy built on assumptions burns budget."),
  s("SEM", "sem", "Search engine marketing: paid search campaigns, bidding, keywords and landing page optimisation.", "tool", "tool", "intermediate", "important", "high", "Paid search is one of the most measurable revenue channels."),
  s("Email Marketing", "email-marketing", "Lifecycle email: segmentation, automation, deliverability and performance measurement.", "core", "domain", "beginner", "important", "high", "Email remains the highest-ROI owned channel for most businesses."),
  s("Marketing Analytics", "marketing-analytics", "Attribution, funnel analysis, cohort analysis and building marketing measurement systems.", "core", "domain", "intermediate", "essential", "very_high", "Marketing without measurement is spending without accountability."),
  s("Conversion Optimization", "conversion-optimization", "Hypothesis-driven testing of funnels, pages and offers to improve conversion.", "core", "domain", "intermediate", "important", "high", "Improving conversion multiplies the value of every other marketing channel."),

  // ── Sales / Business Development ────────────────────────────────────────
  s("Prospecting", "prospecting", "Building pipeline: research, outreach, sequencing and multichannel engagement.", "core", "domain", "beginner", "essential", "very_high", "Pipeline is the input to every revenue number."),
  s("Lead Qualification", "lead-qualification", "Qualifying leads with frameworks (BANT, MEDDICC, GPCT) to focus effort where value exists.", "core", "domain", "beginner", "essential", "very_high", "Good qualification protects the team's time and the customer's trust."),
  s("Discovery", "discovery", "Structured conversations that surface customer problems, impact and decision context.", "core", "domain", "intermediate", "essential", "high", "Discovery is where deals are won or lost before the demo."),
  s("Objection Handling", "objection-handling", "Responding to objections with empathy, evidence and value framing.", "core", "domain", "intermediate", "essential", "high", "Objections are information, not rejection."),
  s("Closing", "closing", "Advancing deals: next steps, alignment, procurement and asking for commitment.", "core", "domain", "intermediate", "essential", "very_high", "Closing converts activity into revenue."),
  s("Account Management", "account-management", "Growing and retaining existing accounts: relationships, renewals and expansion.", "core", "domain", "intermediate", "important", "high", "Retention and expansion are cheaper than acquisition and often more profitable."),

  // ── Product Management ──────────────────────────────────────────────────
  s("Product Discovery", "product-discovery", "Validating problems and solutions with research, prototypes and experiments before build.", "core", "domain", "intermediate", "essential", "very_high", "Most product failure is building the wrong thing well."),
  s("PRDs", "prds", "Writing product requirement documents: problem, goals, scope, success metrics and constraints.", "core", "domain", "intermediate", "essential", "high", "A clear PRD is the contract that keeps engineering, design and business aligned."),
  s("Prioritization", "prioritization", "Frameworks for sequencing work (RICE, MoSCoW, impact/effort) and saying no with evidence.", "core", "domain", "intermediate", "essential", "very_high", "A PM's real job is deciding what NOT to build."),
  s("Product Metrics", "product-metrics", "Defining and instrumenting north-star, guardrail and leading metrics for a product.", "core", "domain", "intermediate", "essential", "very_high", "Metrics turn product decisions from opinion into hypothesis tests."),
  s("Experimentation", "experimentation", "Designing, running and interpreting A/B tests and experiments with statistical rigour.", "core", "domain", "advanced", "important", "high", "Experimentation is the engine of evidence-based product change."),

  // ── Finance / Business Analysis ─────────────────────────────────────────
  s("Financial Statements", "financial-statements", "Reading and building the income statement, balance sheet and cash flow statement.", "core", "domain", "beginner", "essential", "very_high", "Every business decision lands in these three statements."),
  s("Financial Analysis", "financial-analysis", "Ratio analysis, variance analysis, margin and profitability analysis that explain performance.", "core", "domain", "intermediate", "essential", "very_high", "Analysis that explains why numbers moved is what decision makers pay for."),
  s("Forecasting", "forecasting", "Building forecasts and budgets: drivers, scenarios, rolling forecasts and accuracy tracking.", "core", "domain", "intermediate", "essential", "high", "Forecasts are how businesses commit resources."),
  s("KPI Analysis", "kpi-analysis", "Defining, tracking and interpreting KPIs and performance dashboards for teams and units.", "core", "domain", "intermediate", "important", "high", "KPIs turn strategy into something measurable."),
  s("Business Case Development", "business-case-development", "Building business cases: costs, benefits, risks, payback and investment recommendations.", "core", "domain", "intermediate", "essential", "high", "Decisions need numbers; business cases make them defensible."),

  // ── Project Management ──────────────────────────────────────────────────
  s("Project Planning", "project-planning", "Scoping, scheduling, milestones, dependencies and delivery plans for a project.", "core", "domain", "beginner", "essential", "very_high", "A project without a plan is a wish."),
  s("Requirements", "requirements", "Eliciting, documenting and managing requirements through their lifecycle.", "core", "domain", "intermediate", "essential", "high", "Misunderstood requirements are the most expensive defect class."),
  s("Risk Management", "risk-management", "Identifying, assessing, mitigating and monitoring project risk.", "core", "domain", "intermediate", "essential", "high", "Projects fail on unmanaged risks, not unmanaged tasks."),
  s("Resource Planning", "resource-planning", "Planning people, budgets and tools across competing priorities.", "core", "domain", "intermediate", "important", "high", "Capacity reality determines whether a plan can ever ship."),

  // ── Customer Success / Support ──────────────────────────────────────────
  s("Customer Communication", "customer-communication", "Clear, empathetic written and verbal communication with customers at every stage.", "human", "human", "beginner", "essential", "very_high", "Every support and success interaction is a brand interaction."),
  s("Troubleshooting", "troubleshooting", "Systematic diagnosis of customer issues: reproduction, isolation, resolution and prevention.", "core", "domain", "beginner", "essential", "very_high", "The core capability of support: finding the cause, not the workaround."),
  s("Ticket Management", "ticket-management", "Triaging, prioritising, routing and managing tickets to resolution SLAs.", "core", "domain", "beginner", "essential", "high", "Disciplined ticket handling protects customers and teams alike."),
  s("Escalation Management", "escalation-management", "Recognising, escalating and managing critical/high-impact customer situations.", "core", "domain", "intermediate", "essential", "high", "How escalations are handled decides whether a customer stays."),
  s("Customer Retention", "customer-retention", "Understanding churn drivers, building retention plays and measuring customer health.", "core", "domain", "intermediate", "important", "high", "Retention is the most reliable predictor of durable revenue."),
  s("Documentation", "documentation", "Writing clear, maintainable documentation for processes, systems and customers.", "core", "domain", "beginner", "important", "high", "Documentation turns individual knowledge into organisational capability."),

  // ── AI Fluency (cross-functional) ────────────────────────────────────────
  s("Prompt Design", "prompt-design", "Designing prompts: task framing, context, constraints, few-shot examples and iteration.", "ai", "ai_fluency", "beginner", "essential", "very_high", "Prompt design is now a baseline capability across nearly every knowledge role."),
  s("AI-Assisted Research", "ai-assisted-research", "Using AI systems to accelerate research while maintaining source discipline and traceability.", "ai", "ai_fluency", "beginner", "important", "very_high", "Research throughput is a competitive advantage in most roles."),
  s("AI Output Verification", "ai-output-verification", "Checking AI output against primary sources, data and first principles before using it.", "ai", "ai_fluency", "intermediate", "essential", "very_high", "The ability to verify output is what separates AI users from AI dependents."),
  s("Fact Checking", "fact-checking", "Systematically verifying claims, numbers and citations — including AI-generated ones.", "ai", "ai_fluency", "beginner", "essential", "high", "False confidence in AI output is the fastest way to lose stakeholder trust."),
  s("Structured AI Workflows", "structured-ai-workflows", "Composing multi-step AI workflows: chaining tasks, hand-offs, checkpoints and review gates.", "ai", "ai_fluency", "intermediate", "important", "high", "Real work needs repeatable pipelines, not one-shot prompts."),
  s("AI Automation", "ai-automation", "Automating recurring work with AI: tooling, guardrails, error handling and human oversight.", "ai", "ai_fluency", "intermediate", "important", "very_high", "Automation ROI comes from tasks that are repeated and well-defined."),
  s("Responsible AI", "responsible-ai", "Understanding bias, privacy, transparency, safety and governance when deploying AI systems.", "ai", "ai_fluency", "intermediate", "essential", "very_high", "Regulation and customer trust make responsible AI a requirement, not a preference."),
  s("Knowing When Not To Trust AI", "knowing-when-not-to-trust-ai", "Recognising hallucination risk, uncertainty and situations where AI output must not be used.", "ai", "ai_fluency", "intermediate", "essential", "very_high", "The most senior AI skill is knowing its limits."),
  s("Generative AI", "generative-ai", "Working with generative models: capabilities, limitations, prompting and integration patterns.", "ai", "ai_fluency", "intermediate", "essential", "very_high", "Generative AI is the technology reshaping most knowledge work."),
  s("RAG", "rag", "Retrieval-augmented generation: retrieval, embeddings, chunking, reranking and grounded answers.", "ai", "ai_fluency", "advanced", "important", "very_high", "RAG is the dominant pattern for grounding AI in private data."),
  s("AI Agents", "ai-agents", "Designing agentic systems: tools, planning, memory, orchestration and evaluation.", "ai", "ai_fluency", "advanced", "important", "very_high", "Agents shift AI from answering to doing — with new failure modes to manage."),
  s("AI Evaluation", "ai-evaluation", "Evaluating AI systems: benchmarks, judge rubrics, error analysis and regression testing.", "ai", "ai_fluency", "advanced", "essential", "very_high", "Without evaluation, AI quality is vibes."),
];

// ─── Career tracks ──────────────────────────────────────────────────────────

export interface TrackSkillSeed {
  slug: string;
  importance: SkillImportance;
  requiredLevel: SkillLevel;
  categoryLabel?: string;
}

export interface CareerTrackSeed {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  ordering: number;
  skills: TrackSkillSeed[];
}

const trackSkill = (
  slug: string,
  importance: SkillImportance = "important",
  requiredLevel: SkillLevel = "intermediate",
  categoryLabel?: string,
): TrackSkillSeed => ({ slug, importance, requiredLevel, categoryLabel });

export const TAXONOMY_TRACKS: CareerTrackSeed[] = [
  {
    name: "Software Engineering",
    slug: "software-engineering",
    description: "Design, build, test and maintain the software systems products depend on. Measured by real code, debugging and architecture decisions — not course completion.",
    category: "Technology",
    icon: "Code2",
    color: "violet",
    ordering: 1,
    skills: [
      trackSkill("programming-fundamentals", "essential", "intermediate", "Core Skills"),
      trackSkill("javascript", "essential", "intermediate"),
      trackSkill("typescript", "important", "intermediate"),
      trackSkill("python", "important", "beginner"),
      trackSkill("data-structures-algorithms", "essential", "intermediate"),
      trackSkill("git-github", "essential", "beginner"),
      trackSkill("sql", "important", "intermediate"),
      trackSkill("rest-apis", "essential", "intermediate"),
      trackSkill("backend-development", "essential", "intermediate"),
      trackSkill("frontend-development", "essential", "intermediate"),
      trackSkill("testing-debugging", "essential", "intermediate"),
      trackSkill("system-design", "important", "advanced"),
      trackSkill("react", "important", "intermediate"),
      trackSkill("nodejs", "important", "intermediate"),
      trackSkill("problem-solving", "essential", "intermediate", "Human Skills"),
      trackSkill("communication", "important", "intermediate", "Human Skills"),
      trackSkill("agile-scrum", "important", "beginner", "Methodology"),
      trackSkill("ai-assisted-research", "important", "beginner", "AI Fluency"),
      trackSkill("ai-output-verification", "essential", "intermediate", "AI Fluency"),
    ],
  },
  {
    name: "Data Analytics",
    slug: "data-analytics",
    description: "Turn raw business data into decisions. Measured by real investigation: cleaning data, writing queries, finding the actual cause and defending the answer.",
    category: "Data & AI",
    icon: "BarChart3",
    color: "blue",
    ordering: 2,
    skills: [
      trackSkill("excel", "essential", "intermediate", "Tools"),
      trackSkill("sql", "essential", "advanced", "Core Skills"),
      trackSkill("data-analysis", "essential", "advanced", "Core Skills"),
      trackSkill("statistics", "essential", "intermediate", "Core Skills"),
      trackSkill("data-cleaning", "essential", "intermediate", "Core Skills"),
      trackSkill("data-visualization", "essential", "intermediate", "Core Skills"),
      trackSkill("power-bi", "important", "intermediate", "Tools"),
      trackSkill("tableau", "helpful", "beginner", "Tools"),
      trackSkill("python", "important", "intermediate", "Tools"),
      trackSkill("business-analysis", "important", "intermediate", "Domain"),
      trackSkill("google-analytics", "helpful", "beginner", "Tools"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("critical-thinking", "essential", "intermediate", "Human Skills"),
      trackSkill("prompt-design", "important", "beginner", "AI Fluency"),
      trackSkill("ai-output-verification", "essential", "intermediate", "AI Fluency"),
      trackSkill("fact-checking", "important", "beginner", "AI Fluency"),
    ],
  },
  {
    name: "AI / Machine Learning",
    slug: "ai-ml",
    description: "Build and evaluate models and AI systems that solve real problems. Measured by model quality, evaluation discipline and the ability to explain behaviour.",
    category: "Data & AI",
    icon: "BrainCircuit",
    color: "indigo",
    ordering: 3,
    skills: [
      trackSkill("python", "essential", "intermediate", "Tools"),
      trackSkill("statistics", "essential", "intermediate"),
      trackSkill("machine-learning-fundamentals", "essential", "intermediate"),
      trackSkill("model-evaluation", "essential", "intermediate"),
      trackSkill("feature-engineering", "important", "intermediate"),
      trackSkill("deep-learning", "important", "advanced"),
      trackSkill("natural-language-processing", "important", "advanced"),
      trackSkill("data-analysis", "important", "intermediate"),
      trackSkill("data-cleaning", "important", "intermediate"),
      trackSkill("generative-ai", "essential", "intermediate", "AI Fluency"),
      trackSkill("rag", "important", "advanced", "AI Fluency"),
      trackSkill("ai-agents", "important", "advanced", "AI Fluency"),
      trackSkill("ai-evaluation", "essential", "advanced", "AI Fluency"),
      trackSkill("responsible-ai", "essential", "intermediate", "AI Fluency"),
      trackSkill("communication", "important", "intermediate", "Human Skills"),
    ],
  },
  {
    name: "Cloud / DevOps",
    slug: "cloud-devops",
    description: "Run and ship software reliably: infrastructure, containers, pipelines and observability. Measured by working systems, not certifications.",
    category: "Technology",
    icon: "Cloud",
    color: "sky",
    ordering: 4,
    skills: [
      trackSkill("linux", "essential", "intermediate"),
      trackSkill("networking", "essential", "intermediate"),
      trackSkill("cloud-fundamentals", "essential", "beginner"),
      trackSkill("aws", "essential", "intermediate"),
      trackSkill("azure", "helpful", "beginner"),
      trackSkill("docker", "essential", "intermediate"),
      trackSkill("kubernetes", "important", "advanced"),
      trackSkill("ci-cd", "essential", "intermediate"),
      trackSkill("infrastructure-as-code", "important", "advanced"),
      trackSkill("monitoring-observability", "important", "intermediate"),
      trackSkill("git-github", "essential", "beginner"),
      trackSkill("python", "helpful", "beginner"),
      trackSkill("security-fundamentals", "important", "beginner"),
      trackSkill("structured-ai-workflows", "helpful", "beginner", "AI Fluency"),
      trackSkill("ai-automation", "important", "intermediate", "AI Fluency"),
    ],
  },
  {
    name: "Cybersecurity",
    slug: "cybersecurity",
    description: "Protect systems, data and people. Measured by real defence work: hardening, detection, incident response and honest risk judgement.",
    category: "Technology",
    icon: "ShieldCheck",
    color: "red",
    ordering: 5,
    skills: [
      trackSkill("security-fundamentals", "essential", "intermediate"),
      trackSkill("networking-security", "essential", "intermediate"),
      trackSkill("linux-security", "important", "intermediate"),
      trackSkill("application-security", "essential", "intermediate"),
      trackSkill("owasp-fundamentals", "essential", "intermediate"),
      trackSkill("vulnerability-management", "essential", "intermediate"),
      trackSkill("incident-response", "essential", "advanced"),
      trackSkill("cloud-security", "important", "advanced"),
      trackSkill("security-operations", "important", "advanced"),
      trackSkill("networking", "important", "intermediate"),
      trackSkill("linux", "essential", "intermediate"),
      trackSkill("problem-solving", "essential", "intermediate", "Human Skills"),
      trackSkill("communication", "important", "intermediate", "Human Skills"),
      trackSkill("ai-evaluation", "important", "intermediate", "AI Fluency"),
      trackSkill("responsible-ai", "important", "intermediate", "AI Fluency"),
      trackSkill("knowing-when-not-to-trust-ai", "important", "intermediate", "AI Fluency"),
    ],
  },
  {
    name: "UI/UX Design",
    slug: "ui-ux-design",
    description: "Design products people can actually use. Measured by research, usability evidence and shipped interfaces — not portfolios of concepts.",
    category: "Design & Product",
    icon: "Palette",
    color: "pink",
    ordering: 6,
    skills: [
      trackSkill("user-research", "essential", "intermediate"),
      trackSkill("user-flows", "essential", "beginner"),
      trackSkill("wireframing", "essential", "beginner"),
      trackSkill("prototyping", "essential", "intermediate"),
      trackSkill("figma", "essential", "intermediate", "Tools"),
      trackSkill("ui-design", "essential", "intermediate"),
      trackSkill("design-systems", "important", "advanced"),
      trackSkill("accessibility", "essential", "intermediate"),
      trackSkill("usability-testing", "essential", "intermediate"),
      trackSkill("market-research", "helpful", "beginner"),
      trackSkill("communication", "important", "intermediate", "Human Skills"),
      trackSkill("prompt-design", "important", "beginner", "AI Fluency"),
      trackSkill("ai-assisted-research", "important", "beginner", "AI Fluency"),
      trackSkill("ai-output-verification", "important", "intermediate", "AI Fluency"),
    ],
  },
  {
    name: "Digital Marketing",
    slug: "digital-marketing",
    description: "Grow audiences and revenue through evidence-based marketing. Measured by campaigns, measurement discipline and attribution reasoning.",
    category: "Growth & Sales",
    icon: "Megaphone",
    color: "orange",
    ordering: 7,
    skills: [
      trackSkill("market-research", "essential", "intermediate"),
      trackSkill("seo", "essential", "intermediate"),
      trackSkill("sem", "important", "intermediate"),
      trackSkill("content-marketing", "essential", "intermediate"),
      trackSkill("social-media-marketing", "important", "intermediate"),
      trackSkill("google-analytics", "essential", "intermediate", "Tools"),
      trackSkill("email-marketing", "important", "beginner"),
      trackSkill("marketing-analytics", "essential", "intermediate"),
      trackSkill("conversion-optimization", "important", "intermediate"),
      trackSkill("data-analysis", "helpful", "beginner"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("prompt-design", "important", "beginner", "AI Fluency"),
      trackSkill("ai-assisted-research", "important", "beginner", "AI Fluency"),
      trackSkill("ai-output-verification", "essential", "intermediate", "AI Fluency"),
    ],
  },
  {
    name: "Sales / Business Development",
    slug: "sales-business-development",
    description: "Build pipeline, run real conversations and close deals. Measured by qualification, discovery and consultative selling — not call scripts.",
    category: "Growth & Sales",
    icon: "Handshake",
    color: "green",
    ordering: 8,
    skills: [
      trackSkill("prospecting", "essential", "beginner"),
      trackSkill("lead-qualification", "essential", "intermediate"),
      trackSkill("discovery", "essential", "intermediate"),
      trackSkill("crm-software", "essential", "intermediate", "Tools"),
      trackSkill("objection-handling", "essential", "intermediate"),
      trackSkill("negotiation", "essential", "intermediate"),
      trackSkill("closing", "essential", "intermediate"),
      trackSkill("account-management", "important", "intermediate"),
      trackSkill("sales-techniques", "important", "intermediate"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("prompt-design", "helpful", "beginner", "AI Fluency"),
      trackSkill("ai-assisted-research", "helpful", "beginner", "AI Fluency"),
    ],
  },
  {
    name: "Product Management",
    slug: "product-management",
    description: "Decide what to build and why. Measured by discovery evidence, prioritisation reasoning and shipped outcomes — not by frameworks recited.",
    category: "Design & Product",
    icon: "Layers",
    color: "teal",
    ordering: 9,
    skills: [
      trackSkill("user-research", "essential", "intermediate"),
      trackSkill("product-discovery", "essential", "intermediate"),
      trackSkill("prds", "essential", "intermediate"),
      trackSkill("prioritization", "essential", "intermediate"),
      trackSkill("product-strategy", "essential", "advanced"),
      trackSkill("product-metrics", "essential", "intermediate"),
      trackSkill("experimentation", "important", "advanced"),
      trackSkill("data-analysis", "important", "intermediate"),
      trackSkill("stakeholder-management", "essential", "intermediate", "Human Skills"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("agile-scrum", "important", "intermediate", "Methodology"),
      trackSkill("ai-output-verification", "important", "intermediate", "AI Fluency"),
      trackSkill("structured-ai-workflows", "helpful", "beginner", "AI Fluency"),
    ],
  },
  {
    name: "Finance / Business Analysis",
    slug: "finance-business-analysis",
    description: "Make numbers tell the right story. Measured by financial rigour, modelling and decision-support reasoning on real business questions.",
    category: "Business & Operations",
    icon: "LineChart",
    color: "emerald",
    ordering: 10,
    skills: [
      trackSkill("excel", "essential", "advanced", "Tools"),
      trackSkill("sql", "important", "intermediate"),
      trackSkill("financial-statements", "essential", "intermediate"),
      trackSkill("financial-analysis", "essential", "intermediate"),
      trackSkill("financial-modelling", "essential", "advanced"),
      trackSkill("accounting", "important", "intermediate"),
      trackSkill("forecasting", "essential", "intermediate"),
      trackSkill("kpi-analysis", "essential", "intermediate"),
      trackSkill("business-case-development", "essential", "intermediate"),
      trackSkill("business-analysis", "essential", "intermediate"),
      trackSkill("statistics", "important", "intermediate"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("critical-thinking", "essential", "intermediate", "Human Skills"),
      trackSkill("ai-output-verification", "important", "intermediate", "AI Fluency"),
      trackSkill("fact-checking", "important", "beginner", "AI Fluency"),
    ],
  },
  {
    name: "Project Management",
    slug: "project-management",
    description: "Deliver work on time with stakeholders intact. Measured by plans, risk handling and real delivery outcomes — not by certification.",
    category: "Business & Operations",
    icon: "ClipboardList",
    color: "amber",
    ordering: 11,
    skills: [
      trackSkill("project-planning", "essential", "intermediate"),
      trackSkill("requirements", "essential", "intermediate"),
      trackSkill("agile-scrum", "essential", "intermediate"),
      trackSkill("risk-management", "essential", "intermediate"),
      trackSkill("resource-planning", "important", "intermediate"),
      trackSkill("stakeholder-management", "essential", "intermediate", "Human Skills"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("documentation", "important", "beginner"),
      trackSkill("excel", "helpful", "beginner", "Tools"),
      trackSkill("data-analysis", "helpful", "beginner"),
      trackSkill("structured-ai-workflows", "helpful", "beginner", "AI Fluency"),
      trackSkill("ai-automation", "important", "beginner", "AI Fluency"),
    ],
  },
  {
    name: "Customer Success / Support",
    slug: "customer-success-support",
    description: "Keep customers healthy by actually solving their problems. Measured by diagnosis, communication and retention outcomes.",
    category: "Business & Operations",
    icon: "Headphones",
    color: "rose",
    ordering: 12,
    skills: [
      trackSkill("customer-communication", "essential", "intermediate", "Human Skills"),
      trackSkill("troubleshooting", "essential", "intermediate"),
      trackSkill("ticket-management", "essential", "beginner"),
      trackSkill("crm-software", "essential", "intermediate", "Tools"),
      trackSkill("escalation-management", "essential", "intermediate"),
      trackSkill("customer-retention", "essential", "intermediate"),
      trackSkill("documentation", "essential", "beginner"),
      trackSkill("problem-solving", "essential", "intermediate", "Human Skills"),
      trackSkill("communication", "essential", "intermediate", "Human Skills"),
      trackSkill("ai-assisted-research", "helpful", "beginner", "AI Fluency"),
      trackSkill("fact-checking", "important", "beginner", "AI Fluency"),
      trackSkill("knowing-when-not-to-trust-ai", "essential", "intermediate", "AI Fluency"),
    ],
  },
];

/** Existing role catalogue → taxonomy track mapping (careers.track_id). */
export const TRACK_BY_CAREER_SLUG: Record<string, string> = {
  "data-analyst": "data-analytics",
  "software-developer": "software-engineering",
  "digital-marketing-executive": "digital-marketing",
  "ui-ux-designer": "ui-ux-design",
  "sales-executive": "sales-business-development",
  "product-manager": "product-management",
  "business-analyst": "finance-business-analysis",
  "financial-analyst": "finance-business-analysis",
  "content-strategist": "digital-marketing",
};

// ─── Sub-skills ─────────────────────────────────────────────────────────────

export interface SubSkillSeed {
  skillSlug: string;
  subSkills: { name: string; slug: string; description: string }[];
}

export const TAXONOMY_SUB_SKILLS: SubSkillSeed[] = [
  {
    skillSlug: "sql",
    subSkills: [
      { name: "Query Basics", slug: "query-basics", description: "SELECT, WHERE, ORDER BY, LIMIT and result-set thinking." },
      { name: "Joins", slug: "joins", description: "INNER, LEFT/RIGHT/FULL and understanding NULL semantics." },
      { name: "Aggregation & Grouping", slug: "aggregation-grouping", description: "GROUP BY, HAVING, COUNT/SUM/AVG and rollups." },
      { name: "Subqueries & CTEs", slug: "subqueries-ctes", description: "Correlated subqueries, WITH clauses and query readability." },
      { name: "Window Functions", slug: "window-functions", description: "ROW_NUMBER, RANK, running totals and partitioning." },
      { name: "Indexing & Performance", slug: "indexing-performance", description: "Reading query plans, indexes and avoiding full scans." },
    ],
  },
  {
    skillSlug: "python",
    subSkills: [
      { name: "Language Fundamentals", slug: "language-fundamentals", description: "Types, control flow, functions and modules." },
      { name: "Data Structures", slug: "data-structures", description: "Lists, dicts, sets, tuples and choosing the right one." },
      { name: "File & Data I/O", slug: "file-data-io", description: "Reading and writing CSV/JSON and handling encodings." },
      { name: "pandas", slug: "pandas", description: "DataFrames, filtering, groupby and reshaping." },
      { name: "Error Handling", slug: "error-handling", description: "Exceptions, validation and defensive code." },
    ],
  },
  {
    skillSlug: "data-analysis",
    subSkills: [
      { name: "Exploratory Analysis", slug: "exploratory-analysis", description: "Profiling, distributions, outliers and summary statistics." },
      { name: "Hypothesis-Driven Analysis", slug: "hypothesis-driven-analysis", description: "Framing questions and testing them against data." },
      { name: "Root-Cause Analysis", slug: "root-cause-analysis", description: "Segmenting and decomposing to isolate true drivers." },
      { name: "Dashboarding", slug: "dashboarding", description: "Designing dashboards that answer decisions, not decorate." },
      { name: "Storytelling With Data", slug: "storytelling-with-data", description: "Turning findings into a narrative stakeholders act on." },
    ],
  },
  {
    skillSlug: "excel",
    subSkills: [
      { name: "Formulas & Functions", slug: "formulas-functions", description: "Lookups, SUMIFS, text and date functions." },
      { name: "PivotTables", slug: "pivottables", description: "Aggregating and slicing data for analysis." },
      { name: "Data Cleaning in Excel", slug: "data-cleaning-excel", description: "Text-to-columns, deduplication and validation." },
      { name: "Power Query", slug: "power-query", description: "Connecting, transforming and refreshing data." },
      { name: "Charts & Formatting", slug: "charts-formatting", description: "Clear visual presentation and formatting discipline." },
    ],
  },
  {
    skillSlug: "machine-learning-fundamentals",
    subSkills: [
      { name: "Supervised Learning", slug: "supervised-learning", description: "Regression and classification problem framing." },
      { name: "Unsupervised Learning", slug: "unsupervised-learning", description: "Clustering, dimensionality reduction and anomaly detection." },
      { name: "Model Selection", slug: "model-selection", description: "Cross-validation, baselines and comparison." },
      { name: "Bias & Variance", slug: "bias-variance", description: "Understanding overfitting, underfitting and regularisation." },
    ],
  },
  {
    skillSlug: "generative-ai",
    subSkills: [
      { name: "LLM Fundamentals", slug: "llm-fundamentals", description: "How generative models work, what they know and their limits." },
      { name: "Prompting Patterns", slug: "prompting-patterns", description: "Framing, context, constraints and few-shot examples." },
      { name: "Grounding", slug: "grounding", description: "Reducing hallucination with retrieval and references." },
      { name: "Evaluation", slug: "evaluation", description: "Measuring quality, correctness and regression." },
    ],
  },
  {
    skillSlug: "prompt-design",
    subSkills: [
      { name: "Task Decomposition", slug: "task-decomposition", description: "Breaking work into steps the model can execute." },
      { name: "Role & Context", slug: "role-context", description: "Providing role, audience, constraints and examples." },
      { name: "Output Formatting", slug: "output-formatting", description: "Structured output contracts and parseable results." },
      { name: "Iteration", slug: "iteration", description: "Diagnosing failures and refining prompts systematically." },
    ],
  },
  {
    skillSlug: "rag",
    subSkills: [
      { name: "Chunking", slug: "chunking", description: "Splitting documents so retrieval stays relevant." },
      { name: "Embeddings", slug: "embeddings", description: "Representing text semantically for search." },
      { name: "Retrieval", slug: "retrieval", description: "Vector search, hybrid search and reranking." },
      { name: "Grounded Answering", slug: "grounded-answering", description: "Answering with citations and refusing when evidence is absent." },
    ],
  },
  {
    skillSlug: "git-github",
    subSkills: [
      { name: "Repositories & Commits", slug: "repositories-commits", description: "Init, add, commit, staging and history." },
      { name: "Branching & Merging", slug: "branching-merging", description: "Feature branches, merge strategies and conflict resolution." },
      { name: "Pull Requests & Review", slug: "pull-requests-review", description: "Opening, reviewing and shipping changes collaboratively." },
      { name: "Workflows", slug: "workflows", description: "Git flow, trunk-based development and tags/releases." },
    ],
  },
  {
    skillSlug: "rest-apis",
    subSkills: [
      { name: "HTTP Fundamentals", slug: "http-fundamentals", description: "Methods, status codes, headers and idempotency." },
      { name: "API Design", slug: "api-design", description: "Resource modelling, naming, pagination and versioning." },
      { name: "Authentication & Authorization", slug: "auth", description: "Tokens, keys, scopes and least privilege." },
      { name: "Contracts", slug: "contracts", description: "OpenAPI specs, validation and breaking-change discipline." },
    ],
  },
  {
    skillSlug: "user-research",
    subSkills: [
      { name: "Interviews", slug: "interviews", description: "Unbiased questioning and active listening." },
      { name: "Surveys", slug: "surveys", description: "Question design, sampling and analysis." },
      { name: "Journey Mapping", slug: "journey-mapping", description: "Mapping user journeys and friction points." },
      { name: "Synthesis", slug: "synthesis", description: "Turning raw research into insights and decisions." },
    ],
  },
  {
    skillSlug: "seo",
    subSkills: [
      { name: "Keyword Research", slug: "keyword-research", description: "Intent, volume, difficulty and clustering." },
      { name: "On-Page SEO", slug: "on-page-seo", description: "Content structure, metadata and internal linking." },
      { name: "Technical SEO", slug: "technical-seo", description: "Crawlability, sitemaps, Core Web Vitals and structured data." },
      { name: "Link Building", slug: "link-building", description: "Earning authority legitimately and measuring it." },
    ],
  },
  {
    skillSlug: "sales-techniques",
    subSkills: [
      { name: "Qualification Frameworks", slug: "qualification-frameworks", description: "BANT, MEDDICC and GPCT in practice." },
      { name: "Consultative Selling", slug: "consultative-selling", description: "Problem-first conversations and value framing." },
      { name: "Pipeline Management", slug: "pipeline-management", description: "Forecasting, stage hygiene and next steps." },
      { name: "Negotiation Tactics", slug: "negotiation-tactics", description: "Anchoring, trade-offs and mutual-gain outcomes." },
    ],
  },
  {
    skillSlug: "financial-modelling",
    subSkills: [
      { name: "3-Statement Model", slug: "three-statement-model", description: "Connecting income statement, balance sheet and cash flow." },
      { name: "Scenario & Sensitivity", slug: "scenario-sensitivity", description: "Base/best/worst cases and driver sensitivity." },
      { name: "DCF & Valuation", slug: "dcf-valuation", description: "Discounting cash flows and interpreting valuation." },
      { name: "Waterfall & Contribution", slug: "waterfall-contribution", description: "Decomposing change into drivers." },
    ],
  },
  {
    skillSlug: "networking",
    subSkills: [
      { name: "TCP/IP", slug: "tcp-ip", description: "Addressing, routing, ports and packet flow." },
      { name: "DNS", slug: "dns", description: "Resolution, records and troubleshooting." },
      { name: "HTTP & Load Balancing", slug: "http-load-balancing", description: "Requests, proxies, caching and balancing." },
      { name: "Diagnostics", slug: "diagnostics", description: "ping, traceroute, dig, netstat and packet capture." },
    ],
  },
];

// ─── Capability definitions (real-world capability model) ───────────────────

export interface CapabilitySeed {
  skillSlug: string;
  capabilities: {
    dimension: "knowledge" | "practical_capability" | "real_world_task" | "reasoning" | "communication" | "verification";
    title: string;
    description: string;
    definition?: Record<string, unknown>;
  }[];
}

export const TAXONOMY_CAPABILITIES: CapabilitySeed[] = [
  {
    skillSlug: "sql",
    capabilities: [
      { dimension: "knowledge", title: "SQL knowledge", description: "SQL syntax, relational model, joins, aggregation and window functions." },
      {
        dimension: "practical_capability",
        title: "Querying a real database",
        description: "Write correct queries against a real schema and return verified results.",
        definition: { task: "Answer business questions with queries against a supplied database schema.", deliverables: ["Queries", "Results"], criteria: ["Correctness", "Clarity", "Efficiency"] },
      },
      {
        dimension: "real_world_task",
        title: "Analyse a sales database",
        description: "Investigate a company's sales data to explain what happened and why.",
        definition: { task: "Revenue grew but profit declined — inspect data, write queries, identify the cause, produce findings, explain recommendations." },
      },
      { dimension: "reasoning", title: "Reasoning about evidence", description: "Explain why a query returns what it does and what the result means." },
      { dimension: "communication", title: "Presenting findings", description: "Present query findings in a form non-technical stakeholders can act on." },
      { dimension: "verification", title: "Verifying results", description: "Cross-check totals, handle NULLs and prove the numbers reconcile." },
    ],
  },
  {
    skillSlug: "data-analysis",
    capabilities: [
      { dimension: "knowledge", title: "Analysis concepts", description: "Descriptive statistics, segmentation, comparison and data-quality concepts." },
      { dimension: "practical_capability", title: "Analysing a messy dataset", description: "Clean, profile and analyse a raw export without dropping evidence." },
      { dimension: "real_world_task", title: "Explaining a business movement", description: "Identify the real cause of a metric change and quantify each driver." },
      { dimension: "reasoning", title: "Business reasoning", description: "Separate correlation from causation and support claims with numbers." },
      { dimension: "communication", title: "Executive communication", description: "Lead with the answer, quantify impact and avoid jargon." },
      { dimension: "verification", title: "Data verification", description: "Reconcile totals, audit assumptions and state confidence honestly." },
    ],
  },
  {
    skillSlug: "python",
    capabilities: [
      { dimension: "knowledge", title: "Python knowledge", description: "Language syntax, data structures and standard library usage." },
      { dimension: "practical_capability", title: "Writing working scripts", description: "Write a script that reads data, computes results and handles errors." },
      { dimension: "real_world_task", title: "Automating a data task", description: "Build a repeatable analysis/automation task end to end." },
      { dimension: "reasoning", title: "Debugging", description: "Diagnose failures from tracebacks and isolate root causes." },
      { dimension: "communication", title: "Code communication", description: "Explain code choices and trade-offs to a reviewer." },
      { dimension: "verification", title: "Output verification", description: "Check results against independent calculations." },
    ],
  },
  {
    skillSlug: "machine-learning-fundamentals",
    capabilities: [
      { dimension: "knowledge", title: "ML knowledge", description: "Learning paradigms, model families and evaluation concepts." },
      { dimension: "practical_capability", title: "Training a model", description: "Train, validate and compare models on a supplied dataset." },
      { dimension: "real_world_task", title: "Business prediction task", description: "Build a model that answers a real business question with honest performance." },
      { dimension: "reasoning", title: "Model reasoning", description: "Explain why one model was chosen over alternatives." },
      { dimension: "communication", title: "Explaining model behaviour", description: "Communicate performance, limits and risks to non-experts." },
      { dimension: "verification", title: "Evaluation rigour", description: "Avoid leakage, use held-out data and report calibrated metrics." },
    ],
  },
  {
    skillSlug: "generative-ai",
    capabilities: [
      { dimension: "knowledge", title: "Generative AI knowledge", description: "Capabilities, limitations, hallucination and context handling." },
      { dimension: "practical_capability", title: "Producing usable output", description: "Prompt and iterate to produce reliable, useful AI output." },
      {
        dimension: "real_world_task",
        title: "AI-assisted analysis review",
        description: "AI generated an analysis. Identify the errors, verify the claims, correct it and explain your reasoning.",
        definition: { task: "Review AI-generated analysis, find factual and logical errors, correct it and justify each change." },
      },
      { dimension: "reasoning", title: "Judging output", description: "Judge when AI output is trustworthy enough to use." },
      { dimension: "communication", title: "Explaining AI use", description: "Describe what AI did, what you changed and why." },
      { dimension: "verification", title: "Output verification", description: "Verify AI claims against sources and first principles." },
    ],
  },
  {
    skillSlug: "ui-design",
    capabilities: [
      { dimension: "knowledge", title: "Design knowledge", description: "Layout, typography, hierarchy, colour and component patterns." },
      { dimension: "practical_capability", title: "Designing an interface", description: "Produce a usable interface for a stated problem and audience." },
      { dimension: "real_world_task", title: "Redesigning a broken flow", description: "Redesign a failing flow with justification from research evidence." },
      { dimension: "reasoning", title: "Design reasoning", description: "Defend design decisions against alternatives." },
      { dimension: "communication", title: "Presenting to stakeholders", description: "Present design rationale to product and engineering." },
      { dimension: "verification", title: "Usability verification", description: "Validate the design with testing or heuristics and report limits." },
    ],
  },
  {
    skillSlug: "seo",
    capabilities: [
      { dimension: "knowledge", title: "SEO knowledge", description: "Search mechanics, ranking factors and measurement." },
      { dimension: "practical_capability", title: "SEO audit", description: "Audit a site and produce prioritised, verifiable improvements." },
      { dimension: "real_world_task", title: "Grow organic traffic", description: "Produce a content strategy tied to measurable targets." },
      { dimension: "reasoning", title: "Priority reasoning", description: "Rank opportunities by impact, effort and evidence." },
      { dimension: "communication", title: "Stakeholder reporting", description: "Report progress with metrics non-marketers trust." },
      { dimension: "verification", title: "Measurement", description: "Prove impact with analytics and avoid vanity metrics." },
    ],
  },
  {
    skillSlug: "customer-communication",
    capabilities: [
      { dimension: "knowledge", title: "Communication knowledge", description: "Empathy, tone, clarity and customer-first framing." },
      { dimension: "practical_capability", title: "Writing to a customer", description: "Write a clear, kind, actionable response to an unhappy customer." },
      { dimension: "real_world_task", title: "Handling a real escalation", description: "Handle a high-stakes customer situation end to end." },
      { dimension: "reasoning", title: "Diagnosing customer needs", description: "Separate stated problem from underlying need." },
      { dimension: "communication", title: "Verbal communication", description: "Communicate status and expectations under pressure." },
      { dimension: "verification", title: "Confirming resolution", description: "Confirm understanding, set expectations and verify issue closure." },
    ],
  },
];
