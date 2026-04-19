"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { EXPERTS, type ExpertId } from "@/lib/cockpit/data";
import { cn } from "@/lib/cockpit/utils";

const MOCK_ANSWERS: Record<ExpertId, { status: "done" | "streaming"; content: string }> = {
  arq: {
    status: "done",
    content:
      "Server Actions si el feed es simple. Para writes con side-effects a 3+ tablas, las API routes dan más control del error handling. Mixto: actions para posts simples, /api para debates.",
  },
  product: {
    status: "streaming",
    content:
      "Desde producto me da igual. Lo que importa: el post tiene que aparecer en <1s en la otra pantalla. Lo que cumpla eso.",
  },
  tenant: {
    status: "done",
    content:
      "No es mi área, pero cuiden los writes de legal content — audit trail obligatorio para cualquier cosa que pueda ser advice.",
  },
  devil: {
    status: "done",
    content: "Están optimizando prematuramente. Usen lo que el equipo ya conoce y salgan con el demo.",
  },
  ux: {
    status: "done",
    content:
      "UX-wise: loading states en cualquiera de las dos opciones. Lo peor es una UI muda mientras escribe.",
  },
  ops: {
    status: "done",
    content:
      "Ops: si el backend es local via Tailscale, lo que más importa es tolerar caídas de red. Optimistic updates obligatorio.",
  },
};

export default function AskPage() {
  const [selected, setSelected] = useState<ExpertId[]>(["arq", "product"]);
  const [synth, setSynth] = useState(true);
  const [prompt, setPrompt] = useState(
    "¿Conviene Server Actions para los mutations del feed, o API routes clásicas?"
  );

  const toggle = (id: ExpertId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <header>
        <h1 className="text-[22px] font-semibold text-[var(--text-0)]">Ask the team</h1>
        <p className="font-mono text-[11px] text-[var(--text-3)]">
          async · sin rondas · respuestas en paralelo
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Hacé una pregunta corta…"
          className="w-full resize-none bg-transparent text-[13.5px] text-[var(--text-0)] placeholder:text-[var(--text-3)] focus:outline-none"
        />
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
            EXPERTOS · elegí 2 a 4
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.values(EXPERTS).map((ex) => {
              const on = selected.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11.5px] transition",
                    on
                      ? "border-[var(--amber-border)] bg-[var(--amber-soft)]/30"
                      : "border-[var(--border-1)] bg-[var(--bg-2)] hover:border-[var(--border-2)]"
                  )}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold text-[var(--bg-0)]"
                    style={{ background: ex.color }}
                  >
                    {ex.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--text-0)]">
                      {ex.role}
                    </span>
                    <span className="block truncate text-[10.5px] text-[var(--text-3)]">
                      {ex.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={synth}
              onChange={(e) => setSynth(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--amber)]"
            />
            Síntesis al final
          </label>
          <button className="flex items-center gap-2 rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 py-1.5 font-mono text-[11px] text-[var(--amber)] transition hover:bg-[var(--amber)]/20 disabled:opacity-40">
            <Send size={11} /> Preguntar a {selected.length}
          </button>
        </div>
      </section>

      <section className="space-y-2.5">
        {selected.map((eid) => {
          const ex = EXPERTS[eid];
          const ans = MOCK_ANSWERS[eid];
          return (
            <article
              key={eid}
              className="flex gap-3 rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold text-[var(--bg-0)]"
                style={{ background: ex.color }}
              >
                {ex.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[var(--text-0)]">
                    {ex.role}
                  </span>
                  <span
                    className="font-mono text-[9px] uppercase tracking-widest"
                    style={{
                      color: ans.status === "streaming" ? "var(--amber)" : "var(--c-finished)",
                    }}
                  >
                    {ans.status === "streaming" ? "● typing" : "✓ done"}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-1)]">
                  {ans.content}
                </p>
              </div>
            </article>
          );
        })}

        {synth && selected.length >= 2 && (
          <div className="rounded-md border border-[var(--amber-border)] bg-[var(--amber-soft)]/40 p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
              <Sparkles size={11} /> SÍNTESIS
            </div>
            <h3 className="mt-2 text-[14px] font-semibold text-[var(--text-0)]">
              Server Actions para writes simples del feed; /api para mutations complejas de debates.
            </h3>
            <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--text-1)]">
              <li className="flex gap-2"><span className="text-[var(--amber)]">·</span> Posts del feed son writes atómicos → actions OK.</li>
              <li className="flex gap-2"><span className="text-[var(--amber)]">·</span> Debates tocan 3+ tablas y piden audit trail → /api con más control.</li>
              <li className="flex gap-2"><span className="text-[var(--amber)]">·</span> Optimistic updates obligatorio en ambos, por Tailscale flaky.</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
