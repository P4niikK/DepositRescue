// Mock data for the cockpit. Ported from the design prototype.
// Will be replaced by real Postgres-backed data wave by wave.

export type UserId = "matu" | "feli";

export type User = { id: UserId; name: string; initials: string };

export type ActivityKind =
  | "started"
  | "finished"
  | "blocked"
  | "decided"
  | "note"
  | "commit"
  | "question"
  | "handoff";

export const USERS: Record<UserId, User> = {
  matu: { id: "matu", name: "Matu", initials: "MT" },
  feli: { id: "feli", name: "Feli", initials: "FL" },
};

export const TYPE_META: Record<
  ActivityKind,
  { label: string; colorVar: string }
> = {
  started:  { label: "started",  colorVar: "var(--c-started)"  },
  finished: { label: "finished", colorVar: "var(--c-finished)" },
  blocked:  { label: "blocked",  colorVar: "var(--c-blocked)"  },
  decided:  { label: "decided",  colorVar: "var(--c-decided)"  },
  note:     { label: "note",     colorVar: "var(--c-note)"     },
  commit:   { label: "commit",   colorVar: "var(--c-commit)"   },
  question: { label: "question", colorVar: "var(--c-question)" },
  handoff:  { label: "handoff",  colorVar: "var(--c-handoff)"  },
};

export type FeedItem = {
  id: string;
  day: string;
  t: string;
  who: UserId;
  type: ActivityKind;
  title: string;
  note: string;
  files: string[];
};

export const FEED: FeedItem[] = [
  { id: "f1",  day: "HOY · Sab 19 Abr",  t: "03:42", who: "matu", type: "blocked",
    title: "Photo comparison subagent tira timeout en stateful loop",
    note: "Se cuelga después de la 3ra iteración. Voy a intentar con un timeout explícito + retry policy. Si no, hablamos.",
    files: ["agents/photo-compare.ts", "lib/retry.ts"] },
  { id: "f2",  day: "HOY · Sab 19 Abr",  t: "03:28", who: "feli", type: "decided",
    title: "1 skill por estado en vez de por región",
    note: "Entrevistas confirman: la variación fuerte es estado. Regiones dentro del estado comparten casi todo el playbook.",
    files: ["skills/ca.md", "skills/ny.md", "ROADMAP.md"] },
  { id: "f3",  day: "HOY · Sab 19 Abr",  t: "03:11", who: "feli", type: "finished",
    title: "3 user interviews hechas, 1 pain quote fuerte",
    note: '"Mi landlord se quedó con 1800USD y no contesta los mails hace 6 semanas" — sirve para el demo.',
    files: ["research/interviews.md"] },
  { id: "f4",  day: "HOY · Sab 19 Abr",  t: "02:54", who: "matu", type: "started",
    title: "Empezando subagente de photo comparison",
    note: "Plan: antes/después + diff de items tocados. Claude Vision en paralelo con rule-based flagger.",
    files: ["agents/photo-compare.ts"] },
  { id: "f5",  day: "HOY · Sab 19 Abr",  t: "02:30", who: "feli", type: "note",
    title: "Encontré el statute de CA bien indexado",
    note: "Civ Code §1950.5. Los deadlines son 21 días en CA vs 30 en la mayoría de estados — importante para el skill.",
    files: ["skills/ca.md"] },
  { id: "f6",  day: "HOY · Sab 19 Abr",  t: "01:47", who: "matu", type: "commit",
    title: "feat: base schema para evidence pack",
    note: "schema.sql + migrations. Todavía sin tests.",
    files: ["db/schema.sql", "db/migrations/003_evidence.sql"] },
  { id: "f7",  day: "HOY · Sab 19 Abr",  t: "01:12", who: "feli", type: "question",
    title: "¿Cubrimos 3 estados profundos o 10 superficiales en V1?",
    note: "Lanzo debate. Me tironea para los dos lados.",
    files: [] },
  { id: "f8",  day: "HOY · Sab 19 Abr",  t: "00:48", who: "matu", type: "handoff",
    title: "Paso a Feli la review del evidence pack",
    note: "Le dejé dudas concretas en los comments. Yo sigo con photo compare.",
    files: ["db/schema.sql"] },
  { id: "f9",  day: "AYER · Vie 18 Abr", t: "23:55", who: "feli", type: "finished",
    title: "Posteo en r/Tenant validado + 47 upvotes",
    note: "Mucho DM pidiendo early access. Guardé 12 emails en la lista.",
    files: ["research/waitlist.csv"] },
  { id: "f10", day: "AYER · Vie 18 Abr", t: "22:14", who: "matu", type: "decided",
    title: "Stack final: Next + Tailwind + shadcn, deploy en Tailscale",
    note: "Cerramos el debate de stack. No vamos a Vercel — queremos control total del backend para los agentes.",
    files: ["ARCHITECTURE.md"] },
  { id: "f11", day: "AYER · Vie 18 Abr", t: "21:02", who: "feli", type: "started",
    title: "Draft del demo video, guión v1",
    note: "90 segundos, 3 escenas. Pain → producto → CTA.",
    files: ["demo/script.md"] },
  { id: "f12", day: "AYER · Vie 18 Abr", t: "19:30", who: "matu", type: "note",
    title: "Anthropic subagents API responde mejor con tool_choice=required",
    note: "Sin eso el orquestador a veces no llama tools. Flag importante para todos los agentes.",
    files: ["agents/orchestrator.ts"] },
];

export type ChecklistItem = {
  id: string;
  done: boolean;
  t: string;
  tags: string[];
  who: UserId | null;
};

export type ChecklistGroup = { cat: string; items: ChecklistItem[] };

export const CHECKLIST: ChecklistGroup[] = [
  { cat: "Research", items: [
    { id: "c1", done: true,  t: "Postear en r/Tenant",                         tags: ["validation"],         who: "feli" },
    { id: "c2", done: true,  t: "3 entrevistas con tenants afectados",         tags: ["interviews"],         who: "feli" },
    { id: "c3", done: false, t: "Descargar statutes CA/NY/TX",                 tags: ["legal", "priority"],  who: "feli" },
    { id: "c4", done: false, t: "Comparar APIs de OCR para evidence pack",     tags: ["tech"],               who: "matu" },
  ]},
  { cat: "Agents", items: [
    { id: "c5", done: true,  t: "Base del orquestador multi-experto",          tags: ["core"],               who: "matu" },
    { id: "c6", done: false, t: "Subagente de photo comparison",               tags: ["core", "priority"],   who: "matu" },
    { id: "c7", done: false, t: "Skill por estado (1 por c/u, no regional)",   tags: ["skills"],             who: "feli" },
    { id: "c8", done: false, t: "Abogado del diablo automático en debates",    tags: ["core"],               who: null   },
  ]},
  { cat: "Demo", items: [
    { id: "c9",  done: false, t: "Grabar draft del demo video",                tags: ["video"],              who: "feli" },
    { id: "c10", done: false, t: "Pulir landing con 3 screens reales",         tags: ["ui"],                 who: "matu" },
    { id: "c11", done: false, t: "Audit trail: debate → commit",               tags: ["integrity"],          who: null   },
  ]},
];

export type ExpertId = "arq" | "tenant" | "product" | "devil" | "ux" | "ops";

export type Expert = {
  id: ExpertId;
  initials: string;
  role: string;
  color: string;
  desc: string;
};

export const EXPERTS: Record<ExpertId, Expert> = {
  arq:     { id: "arq",     initials: "AA", role: "Arquitecta de agentes", color: "oklch(72% 0.11 230)", desc: "topología, tools, latencia" },
  tenant:  { id: "tenant",  initials: "TL", role: "Abogada tenant law",    color: "oklch(72% 0.10 155)", desc: "statutes, deadlines, edge cases" },
  product: { id: "product", initials: "PS", role: "Product strategist",    color: "oklch(72% 0.10 75)",  desc: "scope, GTM, métricas" },
  devil:   { id: "devil",   initials: "AD", role: "Abogado del diablo",    color: "oklch(68% 0.14 25)",  desc: "challengea el consenso" },
  ux:      { id: "ux",      initials: "UX", role: "UX researcher",         color: "oklch(72% 0.10 295)", desc: "flujos de usuario, copy" },
  ops:     { id: "ops",     initials: "OP", role: "Ops / legal ops",       color: "oklch(70% 0.06 180)", desc: "escalabilidad del playbook" },
};

export type DebateTurn = {
  who: ExpertId;
  content: string[];
  thinking?: boolean;
};

export type DebateRound = { n: number; turns: DebateTurn[] };

export type JudgeVerdict = {
  round: number;
  verdict: string;
  decision: "continue" | "close";
};

export type Synthesis = {
  headline: string;
  points: string[];
  dissent: string;
};

export type CommitLink = { sha: string; msg: string; author: UserId };

export type Debate = {
  id: string;
  status: "live" | "closed";
  prompt: string;
  author: UserId;
  opened: string;
  round: number;
  experts: ExpertId[];
  orchestrator?: string;
  rounds?: DebateRound[];
  judgeVerdicts?: JudgeVerdict[];
  synthesis?: Synthesis;
  commit?: CommitLink;
};

export const DEBATES: Debate[] = [
  {
    id: "d1",
    status: "live",
    prompt: "¿Cubrimos 3 estados profundos o 10 superficiales en V1?",
    author: "feli",
    opened: "00:38 ago",
    round: 2,
    experts: ["arq", "tenant", "product", "devil"],
    orchestrator:
      "Elegí a <b>Arquitecta de agentes</b>, <b>Abogada tenant law</b> y <b>Product strategist</b> — la decisión mezcla complejidad técnica (skills por estado), exposure legal y trade-off de scope. Sumo <b>Abogado del diablo</b> por defecto.",
    rounds: [
      { n: 1, turns: [
        { who: "tenant", content: [
          "La regulación varía **mucho** entre estados. Deadlines en CA son 21 días, en TX son 30, y en NY el burden of proof vive en el landlord. Cubrir 10 superficiales significa 10 formas de dar consejo legalmente cuestionable.",
          "Mi voto: 3 profundos (CA, NY, TX) — concentran ~40% del mercado de alquiler del país y tenemos statutes bien indexados.",
        ]},
        { who: "product", content: [
          "Discrepo en matiz: con 3 estados dejás fuera a Florida, Illinois, Washington. En hackathon lo que importa es que el 80% de los que prueben el demo vean SU estado.",
          "**Plan mixto**: 3 estados deep (CA/NY/TX con skill completa) + 7 estados shallow con plantilla genérica + disclaimer. Mejor cobertura para el demo, honest sobre la profundidad.",
        ]},
        { who: "arq", content: [
          "Técnicamente los shallow son baratos: mismo prompt template, tabla de variables por estado. El costo real está en QA — cada estado 'shallow' es una superficie donde podemos equivocarnos.",
          "Si vamos al plan mixto, debería haber un flag visible en UI: <code>deep</code> vs <code>general guidance</code>. No mezclar en silencio.",
        ]},
        { who: "devil", content: [
          "¿Nadie va a decir lo obvio? Si 3 deep = más trabajo en cada uno, probablemente <b>ninguno</b> esté listo para el día 7. La consigna real es: cuántos podés hacer al 85% en los 4 días que quedan. La respuesta honesta es 2, no 3.",
        ]},
      ]},
      { n: 2, turns: [
        { who: "tenant", content: [
          'El diablo tiene razón con el riesgo de tiempo, pero "2 deep" vende mal. Propongo: 2 deep completos (CA + NY) + plantillas shallow para 5 más con disclaimer explícito "orientativo, no legal advice".',
        ]},
        { who: "product", content: [
          "Acepto 2 deep si el disclaimer es fuerte. El demo va a mostrar CA end-to-end igual, nadie mira 3 estados en un demo de 90s.",
        ]},
        { who: "devil", content: [
          "Una más: si van con CA + NY, aseguren que el evidence pack funcione bien en CA primero. La complejidad de la UI es mayor que la del skill legal. No me convence que tengan photo compare funcional para el día 7.",
        ]},
        { who: "arq", content: ["thinking"], thinking: true },
      ]},
    ],
    judgeVerdicts: [
      { round: 1, verdict: "Hay señal fuerte pero desacuerdo en el número exacto. Continuar ronda 2 enfocada en capacidad real hasta el día 7.", decision: "continue" },
    ],
  },
  {
    id: "d2",
    status: "closed",
    prompt: "Stack final: ¿Next + Tailwind + shadcn en Tailscale, o Vercel?",
    author: "matu",
    opened: "Ayer 22:00",
    round: 2,
    experts: ["arq", "ops", "product"],
    synthesis: {
      headline: "Next.js + Tailwind + shadcn, deploy local en Tailscale",
      points: [
        "Tailscale da control total del backend — crítico para agentes con tools custom.",
        "Vercel tiene edge runtime limits que chocan con subagentes largos.",
        "Deploy local acepta el trade-off de no-HA durante el hackathon.",
      ],
      dissent: "Abogado del diablo mantiene que la falta de HA puede morder si el demo es live. Mitigación: grabar fallback.",
    },
    commit: { sha: "a3f9b21", msg: "chore: switch to tailscale deploy", author: "matu" },
  },
  {
    id: "d3",
    status: "closed",
    prompt: "¿El juez debería poder pedir un experto extra mid-debate?",
    author: "feli",
    opened: "2 días",
    round: 3,
    experts: ["arq", "product", "devil"],
    synthesis: {
      headline: "Sí, pero limitado a 1 experto extra por debate.",
      points: [
        "Juez puede sumar hasta 1 experto si detecta gap de expertise.",
        "El extra no resetea rondas — entra en la ronda activa.",
        "UI debe mostrar que el experto fue añadido por el juez, no por el user.",
      ],
      dissent: "Product strategist pedía 2 extra; descartado por scope.",
    },
    commit: { sha: "7c2e184", msg: "feat(debate): allow judge to summon 1 extra", author: "matu" },
  },
];

export type RoadmapDay = {
  n: number;
  label: string;
  done: number;
  total: number;
  title: string;
  status: "done" | "today" | "late" | "upcoming";
};

export type TodayTask = { t: string; done: boolean };

export const ROADMAP: {
  file: string;
  days: RoadmapDay[];
  todayTasks: TodayTask[];
} = {
  file: "ROADMAP.md",
  days: [
    { n: 1, label: "D1", done: 5, total: 5, title: "Research inicial + stack",      status: "done"     },
    { n: 2, label: "D2", done: 6, total: 6, title: "Schema + orquestador base",     status: "done"     },
    { n: 3, label: "D3", done: 4, total: 5, title: "Skills CA/NY primer pase",      status: "late"     },
    { n: 4, label: "D4", done: 4, total: 6, title: "Evidence pack + photo compare", status: "late"     },
    { n: 5, label: "D5", done: 1, total: 5, title: "Debate view + ask the team",    status: "today"    },
    { n: 6, label: "D6", done: 0, total: 4, title: "Demo video + landing",          status: "upcoming" },
    { n: 7, label: "D7", done: 0, total: 3, title: "Polish + submit",               status: "upcoming" },
  ],
  todayTasks: [
    { t: "Terminar photo comparison subagent",       done: false },
    { t: "Cerrar debate de scope (3 vs 10 estados)", done: false },
    { t: "Merge evidence pack schema",               done: true  },
    { t: "Primer draft de debate UI",                done: false },
    { t: "Sync 22:00 para ver qué queda para D6",    done: false },
  ],
};
