// ─── Human Bridge Demo Data ────────────────────────────────────────────────
// All data is clearly marked as DEMO. Replace with real APIs/DB queries.

export type SkillImportance = "essential" | "important" | "helpful";
export type DemandLevel = "very_high" | "high" | "medium" | "low";
export type WorkType = "remote" | "hybrid" | "onsite";
export type VerificationStatus =
  | "self_reported"
  | "assessed"
  | "project_verified"
  | "employer_verified";

export interface Skill {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: "core" | "tool" | "human" | "domain";
  whyEmployersWant: string;
}

export interface CareerSkill {
  skill: Skill;
  importance: SkillImportance;
  categoryLabel: string;
}

export interface CareerPathStep {
  title: string;
  yearsExperience: string;
}

export interface Career {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  whatThisRoleDoes: string;
  demandLevel: DemandLevel;
  salaryMin: number;
  salaryMax: number;
  salaryUnit: string;
  experienceLevel: string;
  totalJobs: number;
  growthRate: string;
  icon: string;
  color: string;
  skills: CareerSkill[];
  careerPathway: CareerPathStep[];
  typicalRequirements: string[];
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  logoInitials: string;
  logoColor: string;
  verified: boolean;
}

export interface JobSkill {
  skill: Skill;
  importance: SkillImportance;
}

export interface Job {
  id: number;
  title: string;
  company: Company;
  career: Career;
  description: string;
  location: string;
  workType: WorkType;
  salaryMin: number;
  salaryMax: number;
  salaryUnit: string;
  experienceMin: number;
  experienceMax: number;
  skills: JobSkill[];
  postedDaysAgo: number;
}

export interface AssessmentQuestion {
  id: number;
  type: "mcq" | "scenario" | "practical" | "written";
  question: string;
  options?: string[];
  correctIndex?: number;
  hint?: string;
}

export interface Assessment {
  id: number;
  title: string;
  skillName: string;
  careerName: string;
  type: string;
  description: string;
  duration: number;
  passingScore: number;
  questions: AssessmentQuestion[];
}

export interface Project {
  id: number;
  title: string;
  description: string;
  careerName: string;
  skills: string[];
  difficulty: string;
  estimatedHours: number;
  instructions: string;
  deliverables: string[];
}

export interface LearningResource {
  id: number;
  title: string;
  skillName: string;
  type: string;
  provider: string;
  duration: string;
  level: string;
  free: boolean;
  description: string;
}

// ─── Skills ────────────────────────────────────────────────────────────────
export const DEMO_SKILLS: Skill[] = [
  { id: 1, name: "Excel", slug: "excel", description: "Microsoft Excel for data analysis and reporting", category: "tool", whyEmployersWant: "Excel remains the universal tool for business data work. Proficiency signals analytical thinking and attention to detail." },
  { id: 2, name: "SQL", slug: "sql", description: "Structured Query Language for database querying", category: "core", whyEmployersWant: "SQL is the lingua franca of data. Every company with data needs someone who can query it." },
  { id: 3, name: "Data Analysis", slug: "data-analysis", description: "Ability to interpret, clean and extract insights from data", category: "core", whyEmployersWant: "Turning raw numbers into business decisions is one of the highest-value skills in any organisation." },
  { id: 4, name: "Statistics", slug: "statistics", description: "Statistical concepts, probability, distributions", category: "core", whyEmployersWant: "Data without statistical thinking produces misleading conclusions. Employers need analysts who understand confidence intervals, not just averages." },
  { id: 5, name: "Power BI", slug: "power-bi", description: "Microsoft Power BI for business intelligence dashboards", category: "tool", whyEmployersWant: "Power BI is the most widely deployed BI tool in enterprise. Dashboard fluency accelerates decision-making." },
  { id: 6, name: "Tableau", slug: "tableau", description: "Tableau for interactive data visualisation", category: "tool", whyEmployersWant: "Tableau's visualisation capability converts complex data into compelling stories for stakeholders." },
  { id: 7, name: "Python", slug: "python", description: "Python programming for data science and automation", category: "tool", whyEmployersWant: "Python's libraries (pandas, numpy, matplotlib) make it the standard language for data work at scale." },
  { id: 8, name: "Communication", slug: "communication", description: "Clear written and verbal communication", category: "human", whyEmployersWant: "Technical skills are only valuable if insights can be communicated to non-technical stakeholders." },
  { id: 9, name: "Problem Solving", slug: "problem-solving", description: "Structured approach to identifying and solving problems", category: "human", whyEmployersWant: "Every role involves problems. Employers want people who can diagnose root causes, not just symptoms." },
  { id: 10, name: "Critical Thinking", slug: "critical-thinking", description: "Evaluating information and making sound judgements", category: "human", whyEmployersWant: "Critical thinkers question assumptions, spot errors and drive better outcomes." },
  { id: 11, name: "JavaScript", slug: "javascript", description: "JavaScript programming for web development", category: "core", whyEmployersWant: "JavaScript runs the web. Every company with a digital product needs JavaScript developers." },
  { id: 12, name: "React", slug: "react", description: "React library for building user interfaces", category: "tool", whyEmployersWant: "React is the dominant frontend framework. React skills are transferable across thousands of companies." },
  { id: 13, name: "TypeScript", slug: "typescript", description: "Typed JavaScript for large-scale applications", category: "tool", whyEmployersWant: "TypeScript reduces bugs and improves team collaboration on large codebases." },
  { id: 14, name: "Node.js", slug: "nodejs", description: "Node.js for server-side JavaScript development", category: "tool", whyEmployersWant: "Node.js enables full-stack JavaScript development with fast, scalable APIs." },
  { id: 15, name: "SEO", slug: "seo", description: "Search engine optimisation strategy and execution", category: "core", whyEmployersWant: "Organic search drives the highest ROI traffic. SEO expertise directly impacts revenue." },
  { id: 16, name: "Content Marketing", slug: "content-marketing", description: "Creating content strategies that attract and convert audiences", category: "core", whyEmployersWant: "Content that educates and converts is one of the most scalable growth levers for businesses." },
  { id: 17, name: "Google Analytics", slug: "google-analytics", description: "Web analytics platform for measuring digital performance", category: "tool", whyEmployersWant: "Data-driven marketing requires analytics fluency. GA4 is the standard measurement platform." },
  { id: 18, name: "Social Media Marketing", slug: "social-media-marketing", description: "Building audiences and campaigns on social platforms", category: "core", whyEmployersWant: "Social media reaches billions of potential customers. Skilled social marketers drive measurable growth." },
  { id: 19, name: "Figma", slug: "figma", description: "Figma for UI/UX design and prototyping", category: "tool", whyEmployersWant: "Figma is the industry standard design tool. Figma fluency is non-negotiable for UI/UX roles." },
  { id: 20, name: "User Research", slug: "user-research", description: "Methods for understanding user needs, behaviours and pain points", category: "core", whyEmployersWant: "Products built without user research fail at market. User research reduces costly design mistakes." },
  { id: 21, name: "Wireframing", slug: "wireframing", description: "Creating low-fidelity layouts and interaction flows", category: "core", whyEmployersWant: "Wireframes align teams early and save engineering time by resolving UX issues before development." },
  { id: 22, name: "Prototyping", slug: "prototyping", description: "Building interactive mockups to test design concepts", category: "core", whyEmployersWant: "Prototypes validate ideas quickly. Designers who prototype reduce development risk." },
  { id: 23, name: "Sales Techniques", slug: "sales-techniques", description: "Consultative selling, objection handling and closing", category: "core", whyEmployersWant: "Revenue doesn't exist without sales. Skilled salespeople are the direct drivers of company growth." },
  { id: 24, name: "CRM Software", slug: "crm-software", description: "Customer relationship management platforms", category: "tool", whyEmployersWant: "CRM discipline keeps pipelines clean, forecasts accurate and customer relationships strong." },
  { id: 25, name: "Negotiation", slug: "negotiation", description: "Reaching mutually beneficial agreements", category: "human", whyEmployersWant: "Negotiation skills directly impact deal values, margins and partnership terms." },
  { id: 26, name: "Financial Modelling", slug: "financial-modelling", description: "Building financial models for forecasting and valuation", category: "core", whyEmployersWant: "Financial models are the backbone of investment decisions, budgets and strategic planning." },
  { id: 27, name: "Accounting", slug: "accounting", description: "Financial accounting principles, P&L, balance sheets", category: "core", whyEmployersWant: "Accounting accuracy is the foundation of every business's financial health and legal compliance." },
  { id: 28, name: "Product Strategy", slug: "product-strategy", description: "Defining product vision, roadmap and go-to-market", category: "core", whyEmployersWant: "Product strategy determines whether a product solves a real market problem profitably." },
  { id: 29, name: "Stakeholder Management", slug: "stakeholder-management", description: "Aligning and managing expectations of multiple stakeholders", category: "human", whyEmployersWant: "Complex organisations require people who can navigate competing priorities without losing trust." },
  { id: 30, name: "Agile / Scrum", slug: "agile-scrum", description: "Agile methodology and Scrum framework for project delivery", category: "core", whyEmployersWant: "Agile is the standard delivery methodology. Teams that work in Agile ship faster and adapt better." },
];

const getSkill = (id: number) => DEMO_SKILLS.find(s => s.id === id)!;

// ─── Careers ───────────────────────────────────────────────────────────────
export const DEMO_CAREERS: Career[] = [
  {
    id: 1,
    name: "Data Analyst",
    slug: "data-analyst",
    tagline: "Turn data into decisions.",
    description: "Data Analysts transform raw information into strategic insights that drive business outcomes.",
    whatThisRoleDoes: "A Data Analyst collects, cleans and interprets data to help organisations make better decisions. You'll work with databases, build dashboards, identify trends and present findings to stakeholders across the business. Your work directly influences strategy, operations and product decisions.",
    demandLevel: "very_high",
    salaryMin: 4,
    salaryMax: 12,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 2847,
    growthRate: "+23% YoY",
    icon: "BarChart3",
    color: "blue",
    skills: [
      { skill: getSkill(1), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(2), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(3), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(4), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(5), importance: "important", categoryLabel: "Tools" },
      { skill: getSkill(6), importance: "helpful", categoryLabel: "Tools" },
      { skill: getSkill(7), importance: "helpful", categoryLabel: "Tools" },
      { skill: getSkill(8), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Junior Data Analyst", yearsExperience: "0–1 years" },
      { title: "Data Analyst", yearsExperience: "1–3 years" },
      { title: "Senior Data Analyst", yearsExperience: "3–5 years" },
      { title: "Analytics Manager", yearsExperience: "5–8 years" },
      { title: "Head of Analytics", yearsExperience: "8+ years" },
    ],
    typicalRequirements: [
      "Bachelor's degree in any quantitative field or equivalent experience",
      "Proficiency in Excel and SQL",
      "Experience with at least one BI tool (Power BI or Tableau)",
      "Ability to present data-driven recommendations to non-technical stakeholders",
      "Strong attention to detail and analytical mindset",
    ],
  },
  {
    id: 2,
    name: "Software Developer",
    slug: "software-developer",
    tagline: "Build the products people use every day.",
    description: "Software Developers design, build and maintain the applications and systems that power modern businesses.",
    whatThisRoleDoes: "A Software Developer writes code, solves technical problems and collaborates with product and design teams to ship working software. You'll build features, fix bugs, review code and continuously improve systems. Good developers are problem-solvers first and coders second.",
    demandLevel: "very_high",
    salaryMin: 6,
    salaryMax: 25,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Senior",
    totalJobs: 5621,
    growthRate: "+31% YoY",
    icon: "Code2",
    color: "violet",
    skills: [
      { skill: getSkill(11), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(12), importance: "essential", categoryLabel: "Frameworks" },
      { skill: getSkill(13), importance: "important", categoryLabel: "Frameworks" },
      { skill: getSkill(14), importance: "important", categoryLabel: "Frameworks" },
      { skill: getSkill(9), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(8), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(30), importance: "important", categoryLabel: "Methodology" },
    ],
    careerPathway: [
      { title: "Junior Developer", yearsExperience: "0–1 years" },
      { title: "Software Developer", yearsExperience: "1–3 years" },
      { title: "Senior Developer", yearsExperience: "3–6 years" },
      { title: "Lead Engineer", yearsExperience: "6–9 years" },
      { title: "Engineering Manager / Principal", yearsExperience: "9+ years" },
    ],
    typicalRequirements: [
      "Proficiency in at least one programming language",
      "Understanding of data structures and algorithms",
      "Experience with version control (Git)",
      "Ability to write clean, maintainable code",
      "Team collaboration and communication skills",
    ],
  },
  {
    id: 3,
    name: "Digital Marketing Executive",
    slug: "digital-marketing-executive",
    tagline: "Grow audiences. Drive revenue.",
    description: "Digital Marketing Executives plan and execute strategies that attract customers and build brand visibility online.",
    whatThisRoleDoes: "A Digital Marketing Executive manages online campaigns across search, social and content channels. You'll analyse performance, optimise spend, create compelling content and grow an organisation's digital presence. Your work directly connects to revenue and brand growth.",
    demandLevel: "high",
    salaryMin: 3,
    salaryMax: 8,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 1934,
    growthRate: "+18% YoY",
    icon: "TrendingUp",
    color: "orange",
    skills: [
      { skill: getSkill(15), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(16), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(17), importance: "important", categoryLabel: "Tools" },
      { skill: getSkill(18), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(3), importance: "important", categoryLabel: "Core Skills" },
    ],
    careerPathway: [
      { title: "Digital Marketing Executive", yearsExperience: "0–2 years" },
      { title: "Senior Marketing Executive", yearsExperience: "2–4 years" },
      { title: "Marketing Manager", yearsExperience: "4–6 years" },
      { title: "Head of Marketing", yearsExperience: "6–9 years" },
      { title: "Chief Marketing Officer", yearsExperience: "10+ years" },
    ],
    typicalRequirements: [
      "Understanding of digital marketing channels and metrics",
      "Google Analytics certification preferred",
      "Strong writing and content creation skills",
      "Experience running paid campaigns",
      "Analytical mindset with attention to campaign data",
    ],
  },
  {
    id: 4,
    name: "UI/UX Designer",
    slug: "ui-ux-designer",
    tagline: "Design experiences people love.",
    description: "UI/UX Designers craft the visual and interactive experiences of digital products, making them intuitive, accessible and delightful.",
    whatThisRoleDoes: "A UI/UX Designer researches user needs, creates wireframes and prototypes, and designs polished interfaces. You bridge the gap between user psychology and technical implementation, collaborating closely with product managers and engineers to ensure products work beautifully.",
    demandLevel: "high",
    salaryMin: 4,
    salaryMax: 15,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Senior",
    totalJobs: 1256,
    growthRate: "+21% YoY",
    icon: "Palette",
    color: "pink",
    skills: [
      { skill: getSkill(19), importance: "essential", categoryLabel: "Tools" },
      { skill: getSkill(20), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(21), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(22), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(8), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "important", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Junior UI/UX Designer", yearsExperience: "0–1 years" },
      { title: "UI/UX Designer", yearsExperience: "1–3 years" },
      { title: "Senior Designer", yearsExperience: "3–5 years" },
      { title: "Lead Designer", yearsExperience: "5–8 years" },
      { title: "Head of Design", yearsExperience: "8+ years" },
    ],
    typicalRequirements: [
      "Proficiency in Figma",
      "Strong portfolio demonstrating design process",
      "Experience conducting user research",
      "Understanding of accessibility principles",
      "Ability to work closely with engineers",
    ],
  },
  {
    id: 5,
    name: "Sales Executive",
    slug: "sales-executive",
    tagline: "Build relationships. Close deals. Drive growth.",
    description: "Sales Executives generate revenue by identifying opportunities, building relationships and converting prospects into customers.",
    whatThisRoleDoes: "A Sales Executive manages the full sales cycle from prospecting to closing. You'll qualify leads, run demos, handle objections and negotiate contracts. High-performing salespeople understand their customers deeply and create genuine value at every stage of the relationship.",
    demandLevel: "very_high",
    salaryMin: 3,
    salaryMax: 15,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 4218,
    growthRate: "+15% YoY",
    icon: "Handshake",
    color: "green",
    skills: [
      { skill: getSkill(23), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(24), importance: "important", categoryLabel: "Tools" },
      { skill: getSkill(25), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Sales Development Rep", yearsExperience: "0–1 years" },
      { title: "Sales Executive", yearsExperience: "1–3 years" },
      { title: "Senior Sales Executive", yearsExperience: "3–5 years" },
      { title: "Sales Manager", yearsExperience: "5–8 years" },
      { title: "VP of Sales", yearsExperience: "8+ years" },
    ],
    typicalRequirements: [
      "Strong interpersonal and communication skills",
      "Experience with CRM systems",
      "Proven track record of meeting targets",
      "Ability to understand complex product value propositions",
      "Resilience and self-motivation",
    ],
  },
  {
    id: 6,
    name: "Product Manager",
    slug: "product-manager",
    tagline: "Own the product. Ship what matters.",
    description: "Product Managers define the vision, strategy and roadmap for products that solve real user problems.",
    whatThisRoleDoes: "A Product Manager sits at the intersection of business, technology and user experience. You'll define what gets built, why it matters and how success is measured. PMs prioritise relentlessly, align diverse teams and ensure every feature shipped creates real value.",
    demandLevel: "very_high",
    salaryMin: 8,
    salaryMax: 30,
    salaryUnit: "LPA",
    experienceLevel: "Mid to Senior",
    totalJobs: 987,
    growthRate: "+28% YoY",
    icon: "Layers",
    color: "teal",
    skills: [
      { skill: getSkill(28), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(29), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(30), importance: "important", categoryLabel: "Methodology" },
      { skill: getSkill(3), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Associate PM", yearsExperience: "0–2 years" },
      { title: "Product Manager", yearsExperience: "2–4 years" },
      { title: "Senior PM", yearsExperience: "4–7 years" },
      { title: "Principal PM / Group PM", yearsExperience: "7–10 years" },
      { title: "VP of Product / CPO", yearsExperience: "10+ years" },
    ],
    typicalRequirements: [
      "Experience defining product roadmaps and writing PRDs",
      "Strong analytical skills and comfort with data",
      "Ability to work across engineering, design and business",
      "Understanding of Agile methodologies",
      "Exceptional written and verbal communication",
    ],
  },
  {
    id: 7,
    name: "Business Analyst",
    slug: "business-analyst",
    tagline: "Bridge business needs and technical solutions.",
    description: "Business Analysts identify business needs, analyse processes and translate requirements into actionable solutions.",
    whatThisRoleDoes: "A Business Analyst investigates business challenges, gathers requirements and recommends solutions that improve efficiency or create value. You'll work with stakeholders, create process maps, write requirements and validate that delivered solutions meet business needs.",
    demandLevel: "high",
    salaryMin: 4,
    salaryMax: 12,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 1543,
    growthRate: "+16% YoY",
    icon: "FileSearch",
    color: "indigo",
    skills: [
      { skill: getSkill(3), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(2), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(1), importance: "important", categoryLabel: "Tools" },
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(29), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(30), importance: "helpful", categoryLabel: "Methodology" },
    ],
    careerPathway: [
      { title: "Junior Business Analyst", yearsExperience: "0–1 years" },
      { title: "Business Analyst", yearsExperience: "1–3 years" },
      { title: "Senior BA", yearsExperience: "3–5 years" },
      { title: "Lead BA / BA Manager", yearsExperience: "5–8 years" },
      { title: "Head of Business Analysis", yearsExperience: "8+ years" },
    ],
    typicalRequirements: [
      "Strong analytical and problem-solving skills",
      "Experience with requirements gathering techniques",
      "Proficiency in data analysis tools",
      "Excellent stakeholder communication",
      "Process mapping and documentation skills",
    ],
  },
  {
    id: 8,
    name: "Financial Analyst",
    slug: "financial-analyst",
    tagline: "Make numbers tell the right story.",
    description: "Financial Analysts evaluate financial data, build models and provide insights that guide investment and business decisions.",
    whatThisRoleDoes: "A Financial Analyst builds financial models, analyses performance trends and produces reports that inform strategic decisions. You'll work with revenue data, forecasts, budgets and valuations, communicating complex financial concepts clearly to leadership.",
    demandLevel: "high",
    salaryMin: 5,
    salaryMax: 18,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 1128,
    growthRate: "+14% YoY",
    icon: "LineChart",
    color: "emerald",
    skills: [
      { skill: getSkill(26), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(1), importance: "essential", categoryLabel: "Tools" },
      { skill: getSkill(27), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(4), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(8), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Junior Financial Analyst", yearsExperience: "0–2 years" },
      { title: "Financial Analyst", yearsExperience: "2–4 years" },
      { title: "Senior Financial Analyst", yearsExperience: "4–6 years" },
      { title: "Finance Manager", yearsExperience: "6–9 years" },
      { title: "CFO / VP Finance", yearsExperience: "10+ years" },
    ],
    typicalRequirements: [
      "Proficiency in Excel and financial modelling",
      "Understanding of accounting principles",
      "Experience with financial reporting",
      "Strong quantitative and analytical skills",
      "CFA or CA certification preferred for senior roles",
    ],
  },
  {
    id: 9,
    name: "Content Strategist",
    slug: "content-strategist",
    tagline: "Build audiences with ideas worth reading.",
    description: "Content Strategists plan, create and manage content that builds brand authority and drives audience growth.",
    whatThisRoleDoes: "A Content Strategist defines the editorial vision, audience and distribution strategy for a brand's content. You'll research topics, plan content calendars, brief creators, and measure performance. Great content strategists combine journalistic instincts with data-driven optimisation.",
    demandLevel: "medium",
    salaryMin: 3,
    salaryMax: 10,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 743,
    growthRate: "+12% YoY",
    icon: "PenTool",
    color: "amber",
    skills: [
      { skill: getSkill(16), importance: "essential", categoryLabel: "Core Skills" },
      { skill: getSkill(15), importance: "important", categoryLabel: "Core Skills" },
      { skill: getSkill(17), importance: "important", categoryLabel: "Tools" },
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "helpful", categoryLabel: "Human Skills" },
    ],
    careerPathway: [
      { title: "Content Writer", yearsExperience: "0–1 years" },
      { title: "Content Strategist", yearsExperience: "1–3 years" },
      { title: "Senior Content Strategist", yearsExperience: "3–5 years" },
      { title: "Content Director", yearsExperience: "5–8 years" },
      { title: "Head of Content", yearsExperience: "8+ years" },
    ],
    typicalRequirements: [
      "Strong writing and editing skills",
      "SEO content experience",
      "Content performance analysis capability",
      "Editorial planning and calendar management",
      "Understanding of audience development",
    ],
  },
  {
    id: 10,
    name: "HR Executive",
    slug: "hr-executive",
    tagline: "Build the teams that build the company.",
    description: "HR Executives attract, develop and retain the talent that drives organisational success.",
    whatThisRoleDoes: "An HR Executive manages recruitment, onboarding, employee relations and people processes. You'll coordinate hiring pipelines, maintain culture, support employee development and ensure compliance with employment regulations. Great HR professionals are trusted partners to both leadership and employees.",
    demandLevel: "medium",
    salaryMin: 3,
    salaryMax: 8,
    salaryUnit: "LPA",
    experienceLevel: "Entry to Mid",
    totalJobs: 1891,
    growthRate: "+10% YoY",
    icon: "Users",
    color: "rose",
    skills: [
      { skill: getSkill(8), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(29), importance: "essential", categoryLabel: "Human Skills" },
      { skill: getSkill(9), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(10), importance: "important", categoryLabel: "Human Skills" },
      { skill: getSkill(25), importance: "helpful", categoryLabel: "Core Skills" },
    ],
    careerPathway: [
      { title: "HR Executive", yearsExperience: "0–2 years" },
      { title: "Senior HR Executive", yearsExperience: "2–4 years" },
      { title: "HR Manager", yearsExperience: "4–6 years" },
      { title: "HR Business Partner", yearsExperience: "6–9 years" },
      { title: "CHRO / Head of HR", yearsExperience: "10+ years" },
    ],
    typicalRequirements: [
      "Understanding of HR practices and employment law",
      "Experience with recruitment and onboarding",
      "Strong interpersonal skills",
      "HRIS software experience",
      "MBA HR or equivalent qualification preferred",
    ],
  },
];

// ─── Companies ─────────────────────────────────────────────────────────────
export const DEMO_COMPANIES: Company[] = [
  { id: 1, name: "Infosys", slug: "infosys", description: "Global IT services and consulting leader", industry: "Technology", size: "100,000+", location: "Bangalore, India", logoInitials: "IN", logoColor: "blue", verified: true },
  { id: 2, name: "Razorpay", slug: "razorpay", description: "India's leading payment infrastructure company", industry: "Fintech", size: "2,000–5,000", location: "Bangalore, India", logoInitials: "RZ", logoColor: "indigo", verified: true },
  { id: 3, name: "Meesho", slug: "meesho", description: "Social commerce platform for small businesses", industry: "E-Commerce", size: "5,000–10,000", location: "Bangalore, India", logoInitials: "ME", logoColor: "pink", verified: true },
  { id: 4, name: "Groww", slug: "groww", description: "India's largest retail investment platform", industry: "Fintech", size: "1,000–2,000", location: "Bangalore, India", logoInitials: "GW", logoColor: "green", verified: true },
  { id: 5, name: "Zoho", slug: "zoho", description: "Global business software suite", industry: "SaaS", size: "10,000–20,000", location: "Chennai, India", logoInitials: "ZH", logoColor: "orange", verified: true },
];

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const DEMO_JOBS: Job[] = [
  {
    id: 1,
    title: "Junior Data Analyst",
    company: DEMO_COMPANIES[0],
    career: DEMO_CAREERS[0],
    description: "Join our analytics team to drive data-driven decisions across our client portfolio.",
    location: "Bangalore / Remote",
    workType: "hybrid",
    salaryMin: 4,
    salaryMax: 6,
    salaryUnit: "LPA",
    experienceMin: 0,
    experienceMax: 2,
    skills: [
      { skill: getSkill(1), importance: "essential" },
      { skill: getSkill(2), importance: "essential" },
      { skill: getSkill(5), importance: "important" },
      { skill: getSkill(3), importance: "essential" },
    ],
    postedDaysAgo: 2,
  },
  {
    id: 2,
    title: "Senior Data Analyst",
    company: DEMO_COMPANIES[3],
    career: DEMO_CAREERS[0],
    description: "Lead analytics for our investment products, turning complex financial data into user insights.",
    location: "Bangalore",
    workType: "hybrid",
    salaryMin: 8,
    salaryMax: 14,
    salaryUnit: "LPA",
    experienceMin: 3,
    experienceMax: 5,
    skills: [
      { skill: getSkill(2), importance: "essential" },
      { skill: getSkill(7), importance: "important" },
      { skill: getSkill(5), importance: "essential" },
      { skill: getSkill(4), importance: "important" },
    ],
    postedDaysAgo: 4,
  },
  {
    id: 3,
    title: "Frontend Developer (React)",
    company: DEMO_COMPANIES[1],
    career: DEMO_CAREERS[1],
    description: "Build beautiful, performant payment experiences for millions of Indian businesses.",
    location: "Bangalore",
    workType: "hybrid",
    salaryMin: 8,
    salaryMax: 15,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 3,
    skills: [
      { skill: getSkill(11), importance: "essential" },
      { skill: getSkill(12), importance: "essential" },
      { skill: getSkill(13), importance: "important" },
    ],
    postedDaysAgo: 1,
  },
  {
    id: 4,
    title: "Full Stack Developer",
    company: DEMO_COMPANIES[4],
    career: DEMO_CAREERS[1],
    description: "Build and scale Zoho's cloud-based SaaS products used by millions worldwide.",
    location: "Chennai",
    workType: "onsite",
    salaryMin: 6,
    salaryMax: 12,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 4,
    skills: [
      { skill: getSkill(11), importance: "essential" },
      { skill: getSkill(14), importance: "essential" },
      { skill: getSkill(2), importance: "important" },
    ],
    postedDaysAgo: 3,
  },
  {
    id: 5,
    title: "Digital Marketing Executive",
    company: DEMO_COMPANIES[2],
    career: DEMO_CAREERS[2],
    description: "Drive Meesho's seller acquisition through targeted digital campaigns.",
    location: "Bangalore / Remote",
    workType: "remote",
    salaryMin: 4,
    salaryMax: 7,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 3,
    skills: [
      { skill: getSkill(15), importance: "essential" },
      { skill: getSkill(18), importance: "important" },
      { skill: getSkill(17), importance: "important" },
    ],
    postedDaysAgo: 5,
  },
  {
    id: 6,
    title: "UI/UX Designer",
    company: DEMO_COMPANIES[1],
    career: DEMO_CAREERS[3],
    description: "Design the future of financial experiences for India's payment infrastructure.",
    location: "Bangalore",
    workType: "hybrid",
    salaryMin: 6,
    salaryMax: 12,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 4,
    skills: [
      { skill: getSkill(19), importance: "essential" },
      { skill: getSkill(20), importance: "essential" },
      { skill: getSkill(22), importance: "important" },
    ],
    postedDaysAgo: 2,
  },
  {
    id: 7,
    title: "Product Manager",
    company: DEMO_COMPANIES[3],
    career: DEMO_CAREERS[5],
    description: "Own the product roadmap for Groww's portfolio management features.",
    location: "Bangalore",
    workType: "hybrid",
    salaryMin: 14,
    salaryMax: 22,
    salaryUnit: "LPA",
    experienceMin: 2,
    experienceMax: 5,
    skills: [
      { skill: getSkill(28), importance: "essential" },
      { skill: getSkill(29), importance: "essential" },
      { skill: getSkill(3), importance: "important" },
    ],
    postedDaysAgo: 6,
  },
  {
    id: 8,
    title: "Business Analyst",
    company: DEMO_COMPANIES[0],
    career: DEMO_CAREERS[6],
    description: "Analyse client business processes and identify opportunities for technology transformation.",
    location: "Bangalore / Hybrid",
    workType: "hybrid",
    salaryMin: 5,
    salaryMax: 9,
    salaryUnit: "LPA",
    experienceMin: 0,
    experienceMax: 2,
    skills: [
      { skill: getSkill(3), importance: "essential" },
      { skill: getSkill(2), importance: "important" },
      { skill: getSkill(8), importance: "important" },
    ],
    postedDaysAgo: 3,
  },
  {
    id: 9,
    title: "Sales Executive",
    company: DEMO_COMPANIES[4],
    career: DEMO_CAREERS[4],
    description: "Drive B2B sales of Zoho's CRM and business software suite to SMEs across India.",
    location: "Mumbai / Hybrid",
    workType: "hybrid",
    salaryMin: 4,
    salaryMax: 8,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 3,
    skills: [
      { skill: getSkill(23), importance: "essential" },
      { skill: getSkill(24), importance: "important" },
      { skill: getSkill(25), importance: "helpful" },
    ],
    postedDaysAgo: 1,
  },
  {
    id: 10,
    title: "Financial Analyst",
    company: DEMO_COMPANIES[3],
    career: DEMO_CAREERS[7],
    description: "Model and analyse financial performance for Groww's expanding product portfolio.",
    location: "Bangalore",
    workType: "onsite",
    salaryMin: 6,
    salaryMax: 11,
    salaryUnit: "LPA",
    experienceMin: 1,
    experienceMax: 3,
    skills: [
      { skill: getSkill(26), importance: "essential" },
      { skill: getSkill(1), importance: "essential" },
      { skill: getSkill(4), importance: "important" },
    ],
    postedDaysAgo: 7,
  },
];

// ─── Assessments ───────────────────────────────────────────────────────────
export const DEMO_ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    title: "SQL Fundamentals Assessment",
    skillName: "SQL",
    careerName: "Data Analyst",
    type: "Mixed",
    description: "Test your SQL knowledge through queries, scenario-based problems and a practical data challenge.",
    duration: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        type: "mcq",
        question: "Which SQL clause is used to filter rows after grouping?",
        options: ["WHERE", "HAVING", "FILTER", "GROUP BY"],
        correctIndex: 1,
        hint: "Think about when GROUP BY executes vs. WHERE.",
      },
      {
        id: 2,
        type: "mcq",
        question: "What does a LEFT JOIN return?",
        options: [
          "Only matching rows from both tables",
          "All rows from the left table and matching rows from the right",
          "All rows from both tables",
          "Only rows that don't match",
        ],
        correctIndex: 1,
      },
      {
        id: 3,
        type: "scenario",
        question: "You have a sales table with 500,000 rows. A query joining it to a products table is taking 8 seconds. What is your first step?",
        options: [
          "Add a LIMIT clause",
          "Check if indexes exist on join columns",
          "Reduce the number of columns selected",
          "Move the query to a stored procedure",
        ],
        correctIndex: 1,
      },
      {
        id: 4,
        type: "practical",
        question: "Write a SQL query to find the top 3 products by total revenue in the last 30 days. Assume a table 'orders' with columns: order_id, product_id, revenue, order_date.",
      },
      {
        id: 5,
        type: "scenario",
        question: "Your manager asks: 'Why did sales drop by 20% last week?' Using SQL, what is your investigation approach?",
        options: [
          "Check if the query is correct",
          "Segment by region, product and time period to isolate the drop",
          "Ask the engineering team to check the database",
          "Pull all data into Excel and sort by date",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 2,
    title: "Data Analysis Practical Challenge",
    skillName: "Data Analysis",
    careerName: "Data Analyst",
    type: "Practical",
    description: "Apply real analytical thinking to a realistic business scenario.",
    duration: 45,
    passingScore: 65,
    questions: [
      {
        id: 1,
        type: "written",
        question: "Here is a summary dataset: Website visits: 50,000/month. Conversion rate: 2.1%. Average order value: ₹1,400. Cart abandonment: 72%. Mobile traffic: 68%. Mobile conversion: 0.8%. Desktop conversion: 4.2%. Identify the three most important business insights and recommend specific actions.",
      },
      {
        id: 2,
        type: "scenario",
        question: "Revenue grew 15% but profit fell 8% this quarter. What analysis would you run to understand why?",
        options: [
          "Check if revenue data is correct",
          "Analyse cost breakdown by category and compare margin trends",
          "Ask the CEO what changed this quarter",
          "Build a new dashboard to track daily revenue",
        ],
        correctIndex: 1,
      },
      {
        id: 3,
        type: "written",
        question: "You find that your company's NPS score dropped from 42 to 28 over 3 months. How would you structure your analysis to identify the root cause?",
      },
    ],
  },
  {
    id: 3,
    title: "UI/UX Design Challenge",
    skillName: "UI/UX Design",
    careerName: "UI/UX Designer",
    type: "Practical",
    description: "Demonstrate your design thinking through real-world UX challenges.",
    duration: 60,
    passingScore: 65,
    questions: [
      {
        id: 1,
        type: "written",
        question: "A food delivery app's checkout has a 65% abandonment rate. Users exit at the payment screen. Describe your research process to diagnose the problem and three UX hypotheses you would test.",
      },
      {
        id: 2,
        type: "scenario",
        question: "A product manager asks you to add 4 new features to an already complex settings page. What is your response?",
        options: [
          "Add the features as requested",
          "Conduct user research first to understand which features are actually needed",
          "Decline because the page is already complex",
          "Ask engineering what's easiest to build",
        ],
        correctIndex: 1,
      },
      {
        id: 3,
        type: "written",
        question: "Redesign the onboarding of a hypothetical productivity app for first-time users. Describe the 3-screen flow, the key information shown on each screen and your reasoning.",
      },
    ],
  },
];

// ─── Projects ──────────────────────────────────────────────────────────────
export const DEMO_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Sales Performance Dashboard",
    description: "Build a Power BI dashboard that gives sales leadership instant visibility into team performance.",
    careerName: "Data Analyst",
    skills: ["Excel", "Power BI", "Data Analysis"],
    difficulty: "Intermediate",
    estimatedHours: 8,
    instructions: "You are given a 12-month sales dataset (provided as CSV). Clean the data, identify the key sales KPIs and build an interactive Power BI dashboard showing regional performance, top products and month-over-month trends.",
    deliverables: ["Cleaned dataset", "Power BI dashboard file", "2-page insights summary"],
  },
  {
    id: 2,
    title: "Customer Churn Analysis",
    description: "Analyse customer data to identify churn patterns and recommend retention strategies.",
    careerName: "Data Analyst",
    skills: ["SQL", "Python", "Statistics", "Data Analysis"],
    difficulty: "Intermediate",
    estimatedHours: 10,
    instructions: "Using the provided customer dataset, write SQL queries to segment customers by churn risk. Use statistical analysis to identify the top 3 predictors of churn. Recommend 3 actionable retention strategies.",
    deliverables: ["SQL query file", "Analysis report", "Retention strategy recommendations"],
  },
  {
    id: 3,
    title: "Mobile App UX Audit",
    description: "Conduct a full UX audit of a fictional banking app and deliver a redesign recommendation.",
    careerName: "UI/UX Designer",
    skills: ["User Research", "Wireframing", "Figma"],
    difficulty: "Beginner",
    estimatedHours: 6,
    instructions: "Review the provided screenshots of a fictional banking app. Identify 5 UX issues with supporting heuristic analysis. Create wireframes for an improved onboarding flow in Figma.",
    deliverables: ["UX audit document", "Figma wireframe file", "Video walkthrough (optional)"],
  },
  {
    id: 4,
    title: "SEO Content Strategy",
    description: "Create a 3-month content strategy to grow organic traffic for a fictional e-commerce brand.",
    careerName: "Digital Marketing Executive",
    skills: ["SEO", "Content Marketing", "Google Analytics"],
    difficulty: "Beginner",
    estimatedHours: 5,
    instructions: "Given a fictional home decor brand with 5,000 monthly visitors, develop a 3-month content strategy targeting 10 keyword clusters. Include content calendar, distribution plan and measurement framework.",
    deliverables: ["Keyword research doc", "Content calendar", "Distribution strategy", "KPI framework"],
  },
  {
    id: 5,
    title: "Sales Objection Handling Simulation",
    description: "Handle 5 realistic customer objections and demonstrate consultative selling techniques.",
    careerName: "Sales Executive",
    skills: ["Sales Techniques", "Communication", "Negotiation"],
    difficulty: "Beginner",
    estimatedHours: 3,
    instructions: "For each of the 5 provided customer objection scenarios, write your complete response. Your response will be evaluated on: empathy, product knowledge, value framing and closing technique.",
    deliverables: ["Written responses to 5 objections", "Self-reflection note on sales approach"],
  },
];

// ─── Learning Resources ────────────────────────────────────────────────────
export const DEMO_LEARNING_RESOURCES: LearningResource[] = [
  { id: 1, title: "SQL for Data Analysis — Complete Beginner to Intermediate", skillName: "SQL", type: "Video Course", provider: "Human Bridge Learning", duration: "12 hours", level: "beginner", free: true, description: "Learn SQL from scratch with real business datasets and practical exercises." },
  { id: 2, title: "Power BI Fundamentals", skillName: "Power BI", type: "Video Course", provider: "Human Bridge Learning", duration: "8 hours", level: "beginner", free: true, description: "Build your first business dashboard with Power BI from connection to published report." },
  { id: 3, title: "Statistics for Data Professionals", skillName: "Statistics", type: "Video Course", provider: "Human Bridge Learning", duration: "10 hours", level: "intermediate", free: false, description: "Master statistical concepts used daily in data analysis roles." },
  { id: 4, title: "Excel for Business Analysis", skillName: "Excel", type: "Video Course", provider: "Human Bridge Learning", duration: "6 hours", level: "beginner", free: true, description: "Master the Excel features that matter most for analytical roles." },
  { id: 5, title: "Figma UI Design Masterclass", skillName: "Figma", type: "Video Course", provider: "Human Bridge Learning", duration: "14 hours", level: "beginner", free: true, description: "Design professional interfaces from wireframe to final polish in Figma." },
  { id: 6, title: "User Research Methods", skillName: "User Research", type: "Video Course", provider: "Human Bridge Learning", duration: "8 hours", level: "intermediate", free: false, description: "Learn interviews, usability testing and synthesis techniques used at top design teams." },
  { id: 7, title: "JavaScript Fundamentals", skillName: "JavaScript", type: "Video Course", provider: "Human Bridge Learning", duration: "16 hours", level: "beginner", free: true, description: "Go from zero to writing real JavaScript with practical projects throughout." },
  { id: 8, title: "React — Build Modern UIs", skillName: "React", type: "Video Course", provider: "Human Bridge Learning", duration: "20 hours", level: "intermediate", free: false, description: "Build production-quality React applications with hooks, state and real APIs." },
  { id: 9, title: "Consultative Sales Fundamentals", skillName: "Sales Techniques", type: "Video Course", provider: "Human Bridge Learning", duration: "6 hours", level: "beginner", free: true, description: "Learn the SPIN selling framework and other proven consultative approaches." },
  { id: 10, title: "SEO Strategy for Growth", skillName: "SEO", type: "Video Course", provider: "Human Bridge Learning", duration: "8 hours", level: "intermediate", free: false, description: "Go beyond keywords — learn technical SEO, content strategy and link building." },
];

// ─── Demo User ──────────────────────────────────────────────────────────────
export const DEMO_USER = {
  id: 1,
  name: "Aditya Sharma",
  email: "aditya@example.com",
  avatarInitials: "AS",
  avatarColor: "blue",
  goal: "Get my first job",
  targetCareer: DEMO_CAREERS[0], // Data Analyst
  careerReadiness: 72,
  skills: [
    { skill: getSkill(1), proficiency: 82, status: "assessed" as VerificationStatus },
    { skill: getSkill(2), proficiency: 61, status: "assessed" as VerificationStatus },
    { skill: getSkill(3), proficiency: 55, status: "self_reported" as VerificationStatus },
    { skill: getSkill(4), proficiency: 48, status: "self_reported" as VerificationStatus },
    { skill: getSkill(5), proficiency: 25, status: "self_reported" as VerificationStatus },
    { skill: getSkill(8), proficiency: 76, status: "assessed" as VerificationStatus },
    { skill: getSkill(9), proficiency: 70, status: "self_reported" as VerificationStatus },
    { skill: getSkill(10), proficiency: 65, status: "self_reported" as VerificationStatus },
  ],
  completedProjects: [
    { title: "Sales Dashboard", skills: ["Excel", "Data Analysis"], verified: true },
    { title: "Customer Churn Analysis", skills: ["SQL", "Statistics"], verified: false },
  ],
  assessmentResults: [
    { title: "SQL Fundamentals", score: 91, date: "2025-01-12" },
    { title: "Data Analysis Practical", score: 87, date: "2025-01-18" },
    { title: "Excel Assessment", score: 95, date: "2025-01-08" },
  ],
  roadmap: [
    { week: 1, title: "Statistics Fundamentals", description: "Probability, distributions, hypothesis testing", status: "completed" },
    { week: 2, title: "SQL Intermediate", description: "Joins, subqueries, window functions", status: "in_progress" },
    { week: 3, title: "Power BI", description: "Data modelling, DAX, interactive dashboards", status: "upcoming" },
    { week: 4, title: "Real-world Project", description: "Sales Performance Dashboard", status: "upcoming" },
    { week: 5, title: "Final Assessment", description: "Comprehensive Data Analyst assessment", status: "upcoming" },
    { week: 6, title: "Job Applications", description: "Apply to matched positions", status: "upcoming" },
  ],
};

// ─── Utility functions ─────────────────────────────────────────────────────
export function getCareerBySlug(slug: string): Career | undefined {
  return DEMO_CAREERS.find(c => c.slug === slug);
}

export function getJobsByCareer(careerId: number): Job[] {
  return DEMO_JOBS.filter(j => j.career.id === careerId);
}

export function calculateMatchScore(userSkills: typeof DEMO_USER.skills, jobSkills: JobSkill[]): number {
  if (jobSkills.length === 0) return 0;
  let totalWeight = 0;
  let earnedWeight = 0;
  for (const js of jobSkills) {
    const weight = js.importance === "essential" ? 3 : js.importance === "important" ? 2 : 1;
    totalWeight += weight;
    const userSkill = userSkills.find(us => us.skill.id === js.skill.id);
    if (userSkill) {
      earnedWeight += (userSkill.proficiency / 100) * weight;
    }
  }
  return Math.round((earnedWeight / totalWeight) * 100);
}

export function getSkillGapColor(proficiency: number): string {
  if (proficiency >= 75) return "green";
  if (proficiency >= 50) return "yellow";
  return "red";
}

export function getDemandLabel(level: DemandLevel): string {
  const labels: Record<DemandLevel, string> = {
    very_high: "Very High",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[level];
}
