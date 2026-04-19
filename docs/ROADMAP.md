# DepositRescue — Roadmap Completo

**Hackathon:** Built with Opus 4.7 (Cerebral Valley x Anthropic)
**Fechas:** 21-28 abril 2026
**Team:** Matu + Feli
**Submission deadline:** Lunes 28 abril
**Prize pool:** $100K en API credits

---

## 1. Project Overview

### Qué estamos construyendo

**DepositRescue** — Un AI legal agent que ayuda a renters US a recuperar depósitos de garantía retenidos ilegalmente por landlords.

### El problema

- 44M renters en US
- ~$7-12B en depósitos retenidos ilegalmente cada año
- Las leyes estatales son fuertes (CA, MA, WI permiten 2-3x damages) pero casi nadie las usa
- Un reclamo de $2,000 no justifica un abogado de $300/hr
- Small claims court se siente opaco para la mayoría

### El producto

User uploads:
1. Su lease (contrato de alquiler)
2. Fotos de move-in (cuando entró al apartamento)
3. Fotos de move-out (cuando salió)
4. Carta de itemización del landlord (dónde dice qué descontó)

Claude Opus 4.7 agent:
1. Detecta jurisdicción (estado específico)
2. Carga skill estatal correspondiente
3. Vision: compara fotos move-in vs move-out, identifica claims falsos de "damage"
4. Analiza deducciones línea por línea contra statute estatal
5. Calcula damages recuperables incluyendo statutory penalties
6. Drafta demand letter citando exact code sections
7. Genera small-claims filing package listo para presentar

### Target states (V1)

10 estados que cubren ~67% de US renters:
- California (CA)
- Texas (TX)
- Florida (FL)
- New York (NY)
- Illinois (IL)
- Georgia (GA)
- North Carolina (NC)
- Pennsylvania (PA)
- Ohio (OH)
- Michigan (MI)

**Estrategia de rollout:** Empezar con 3 estados profundos (CA, NY, TX) días 1-3, expandir a los otros 7 en días 4-5.

---

## 2. Criterios de éxito

Los jueces de Anthropic/Cerebral Valley puntúan:

1. **Use of Claude Code / Opus 4.7** (peso alto) — skills, subagents, MCP, vision, long context, extended thinking
2. **Problem & Impact** (peso alto) — usuario claro, dolor claro, path a adopción
3. **Creativity & Originality** (peso medio)
4. **Pitch** (peso medio) — claridad, demo impact

### Nuestros non-negotiables (lo que prometimos en registration)

1. Structured extraction per photo con vision (JSON con observations per room/surface)
2. Pairwise comparison subagent (move-in vs move-out por feature)
3. Explicit uncertainty handling (decir "insufficient evidence" en lugar de guessear)
4. Human-in-the-loop: user ve condition report antes de generar letter
5. Statute grounding non-negotiable: cada claim legal citado con section específica + quote textual
6. Skills como source of truth (no training data de Claude)
7. Post-generation verification pass sobre todas las citations
8. Conservative defaults cuando ambiguo
9. Eval set de 40 casos de small claims outcomes reales

**Si después los jueces ven el repo y estos mecanismos no están implementados, perdemos. Todos son buildeables en 7 días con este roadmap.**

---

## 3. División de roles

### Matu (Tech lead)
**Ownership principal:**
- Agent architecture y orchestration
- Skills (statutes por estado)
- Subagents (deduction-validator, timeline-checker, damages-calculator, photo-analyzer, letter-drafter, verifier)
- Vision pipeline
- Database / backend
- Cost monitoring

### Feli (Product lead)
**Ownership principal:**
- User research / interviews (Reddit + legal aid orgs)
- Frontend UI polish
- Demo video production
- Pitch script + delivery
- Landing page copy
- Legal advisor liaison (abogado AR)
- Testing con usuarios reales

### Compartido
- Eval set creation
- Submission materials
- Decision-making sobre scope y tradeoffs

---

## 4. Tech Stack

### Core
- **Agent:** Claude Opus 4.7 via Claude Code + Agent SDK
- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Hosting:** Vercel
- **Backend:** Next.js API routes + background jobs (si hace falta, Inngest o Vercel Cron)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Vector storage (si hace falta para cross-doc search):** pgvector en Supabase
- **PDF generation:** react-pdf o Puppeteer para demand letters
- **Payment (futuro, no V1):** Stripe

### Claude Code specifics
- Skills architecture: 10 state-specific skills + shared core skills
- Subagents: 6 principales (ver sección 5)
- Prompt caching: agresivo sobre statutes (estáticos, 90% savings)
- Extended thinking: para legal reasoning sobre casos complejos
- Vision: Opus 4.7 nativo sobre photos

### Dev tools
- Repo: GitHub privado (público al submit)
- Claude Code como primary IDE
- Cursor como backup
- Voice notes para progress journaling (Mike Brown lo hizo, funciona)

---

## 5. Architecture

### High-level flow

```
User uploads (lease PDF + move-in photos + move-out photos + landlord letter)
    ↓
Jurisdiction Detection (ZIP → state)
    ↓
Load state-specific skill (CA, NY, TX, etc)
    ↓
Master Agent spawns subagents in parallel:
    ├── Photo Analyzer (vision per photo → structured JSON)
    ├── Lease Parser (key terms extraction)
    └── Landlord Letter Parser (deductions itemized)
    ↓
Sequential subagents:
    ├── Pairwise Photo Comparator (move-in vs move-out per feature)
    ├── Deduction Validator (each charge vs state law)
    ├── Timeline Checker (deadline compliance)
    ├── Damages Calculator (recoverable + statutory penalties)
    ↓
Human-in-the-loop checkpoint:
    User reviews condition report → contests items if needed
    ↓
Letter Drafter (demand letter with citations)
    ↓
Verification Pass (every citation linked to source, otherwise rejected)
    ↓
Small Claims Package Generator (complaint + evidence + service instructions)
    ↓
Output: Demand letter PDF + Small claims filing package
```

### Skills structure

```
/skills/
├── core/
│   ├── demand-letter-structure/
│   ├── photo-analysis-framework/
│   └── small-claims-process/
├── california-deposits/
│   ├── SKILL.md
│   ├── statute-1950-5.md
│   ├── case-law-wear-vs-damage.md
│   ├── local-ordinances-sf-la-oakland.md
│   └── damages-calculation.md
├── new-york-deposits/
│   ├── SKILL.md
│   ├── statute-rpl-7-108.md
│   └── ...
├── texas-deposits/
├── florida-deposits/
├── illinois-deposits/
├── georgia-deposits/
├── north-carolina-deposits/
├── pennsylvania-deposits/
├── ohio-deposits/
└── michigan-deposits/
```

### Subagents spec

**1. Photo Analyzer**
- Input: 1 photo
- Output: structured JSON
```json
{
  "photo_id": "move-out-kitchen-01",
  "room": "kitchen",
  "observations": [
    {
      "feature": "wall",
      "location": "north wall, near window",
      "condition": "small scuff, ~2in",
      "confidence": "high",
      "raw_description": "visible gray scuff mark approximately 2 inches long"
    }
  ],
  "overall_cleanliness": "acceptable",
  "quality_issues": []
}
```

**2. Pairwise Photo Comparator**
- Input: matched move-in + move-out observations para el mismo feature
- Output: classification
```json
{
  "feature": "kitchen-north-wall",
  "move_in_condition": "small pre-existing nail hole",
  "move_out_condition": "small pre-existing nail hole + scuff ~2in",
  "difference": "scuff added during tenancy",
  "classification": "normal_wear",
  "reasoning": "2-inch scuff on painted wall classified as normal wear per [state] case law",
  "citation": "CA Civ Code §1950.5(e), Kendall v. Pestana (1985)"
}
```
Classifications posibles: `pre_existing` | `normal_wear` | `tenant_damage` | `insufficient_evidence`

**3. Deduction Validator**
- Input: landlord's itemized deductions + photo comparison results + state skill
- Output: per deduction validation
```json
{
  "deduction": "carpet replacement $450",
  "landlord_justification": "stains from tenant",
  "validation": "questionable",
  "reasoning": "Photo analysis shows stains present at move-in. State law requires pro-rated depreciation for full replacement.",
  "citation": "CA Civ Code §1950.5(b)(2)",
  "recommended_challenge": "reject full replacement, accept cleaning cost only ($75 avg)"
}
```

**4. Timeline Checker**
- Input: move-out date + deposit return date + state skill
- Output: compliance report
```json
{
  "state": "CA",
  "statutory_deadline": "21 days",
  "actual_return": "34 days",
  "status": "violation",
  "penalty_available": "bad_faith_damages up to 2x deposit",
  "citation": "CA Civ Code §1950.5(g)(1), §1950.5(l)"
}
```

**5. Damages Calculator**
- Input: validated claims + state penalties available
- Output: recoverable amount
```json
{
  "base_recoverable": 2400,
  "statutory_penalties": {
    "bad_faith_2x": 4800,
    "applicable": true,
    "reasoning": "34-day return exceeds 21-day deadline + no itemization provided within statutory window"
  },
  "total_recoverable": 7200,
  "small_claims_cap": 12500,
  "within_small_claims": true
}
```

**6. Letter Drafter**
- Input: all above outputs
- Output: demand letter text with inline citations
- Uses template from skill, fills in dynamic content

**7. Verifier Subagent (critical)**
- Input: draft letter
- Process: para cada cita legal, verifica contra reference files
- Output: verified letter OR flagged unverified claims
- If unverified: regenerate without that claim

---

## 6. Schedule 7 días

### Pre-work — Sábado 19 abril

**Feli (6 hs):**
- [x] Completar registration Cerebral Valley
- [ ] Postear en r/Tenant, r/legaladvice, r/renters, r/personalfinance, r/povertyfinance
  - Template: "Building AI tool to help renters recover security deposits. Looking for 5 people who had a deposit dispute to chat 15 min — free lifetime access + I'll help with your case as test input."
- [ ] Mismo post en Twitter/X + LinkedIn
- [ ] 25 DMs targeted: usuarios activos en r/Tenant con posts de deposit disputes en últimos 60 días
- [ ] Call con abogado AR (30-45 min):
  - Anatomy de demand letter efectiva (tone, orden, evidencia)
  - Cómo se prueba condition of apartment (photos, witnesses, inspection)
  - Concepto "normal wear and tear" — argumentación legal
  - Si conoce colega US o inquilino reference

**Matu (4 hs):**
- [ ] Descargar statutes de los 10 estados como PDFs organizados:
  - CA: Civil Code §§ 1950.5
  - TX: Property Code § 92.101-92.109
  - FL: Statutes § 83.49
  - NY: General Obligations Law § 7-103 + RPL §§ 234-238
  - IL: 765 ILCS 710
  - GA: O.C.G.A. § 44-7-30 al 37
  - NC: NCGS § 42-50 al 56
  - PA: 68 Pa.C.S. § 250.511a al 512
  - OH: ORC § 5321.16
  - MI: MCL § 554.601 al 616
- [ ] Setup técnico base:
  - Repo GitHub privado con README + .gitignore
  - Next.js 14 + Tailwind + shadcn/ui inicializado en Vercel
  - Supabase project (auth + DB + storage)
  - Claude Code project con settings.json
  - Environment variables en .env.local: ANTHROPIC_API_KEY, SUPABASE_URL, etc
- [ ] Research competitors rápido (1 hs):
  - JustFix.nyc (qué cubren, qué no)
  - DoNotPay (qué hacen post-FTC ruling)
  - RentRedi, Avail (tools de landlords — invertir perspectiva)

**Fin del día — ambos:**
- [ ] Decisión scope final: ¿empezamos con 3 estados o 10?
- [ ] Sync 30 min revisando progreso

---

### Domingo 20 abril (pre-kickoff)

**Feli (6-8 hs):**
- [ ] Responder todos los DMs que llegaron
- [ ] Agendar 3-5 calls de 15 min para lunes-martes
- [ ] Calls que puedan hoy, hacerlas. Grabar con consentimiento. Whisper transcribe.
- [ ] Armar 1-page user research synthesis:
  - 5 pain quotes literales
  - 3 patterns comunes
  - 2 edge cases no pensados
- [ ] Empezar draft del demo video (storyboard)

**Matu (6-8 hs):**
- [ ] Skills scaffolding:
  - /skills/california-deposits/SKILL.md con structure
  - /skills/new-york-deposits/SKILL.md
  - /skills/texas-deposits/SKILL.md
  - Reference files markdown con statute extracts organizados por topic (return deadline, itemization, deductions, damages, interest)
- [ ] Skill architecture design doc:
  - Decision tree router (ZIP → state → skill)
  - Subagents: deduction-validator, timeline-checker, damages-calculator, photo-analyzer, letter-drafter, verifier
- [ ] Eval set V1: 10 casos inventados por estado = 30 casos con expected output
- [ ] Start coding: basic Next.js app con file upload + state detection

**Sync al fin del día:** 30 min revisando research de Feli y scope técnico de Matu.

---

### Día 1 — Lunes 21 abril (KICKOFF OFICIAL)

**Matu (10 hs):**
- [ ] Core agent loop en Claude Code: input → jurisdiction detection → load skill → run subagents → output
- [ ] Vision pipeline funcional: upload múltiples photos, Claude vision sobre cada una, output structured JSON con condition assessment per room
- [ ] Subagent 1: Deduction Validator para California. Input: itemization letter + state skill. Output: lista de deductions flagged como questionable/illegal
- [ ] Database schema: users, cases, documents, analyses, letters

**Feli (8-10 hs):**
- [ ] 3 user calls completas. Transcripción + notas
- [ ] Frontend wireframe: upload flow, analysis view, letter preview, filing package download
- [ ] Primer draft del video script para demo (2 min)
- [ ] Buscar 2-3 legal aid orgs pro-tenant para validation feedback (NY Legal Assistance Group, CA Tenants Together, etc). Emails pidiendo 20 min.

**Fin de día 1:**
- Demo interno: caso de California flowing end-to-end, aunque sea feo

---

### Día 2 — Martes 22 abril

**Matu (10 hs):**
- [ ] Subagents para NY + TX (copiar pattern de CA, adaptar a statutes locales)
- [ ] Timeline Checker subagent: computa si landlord cumplió deadline de devolución
- [ ] Damages Calculator subagent: calcula statutory penalties por estado (CA: 2x deposit, etc)
- [ ] Prompt caching sobre state statutes (crítico para costs)

**Feli (10 hs):**
- [ ] 2-3 user calls más
- [ ] Frontend funcional: upload → loading states → results display
- [ ] Primera versión de landing page (útil post-hackathon + jueces pueden chequear)
- [ ] Obtener 2 leases reales + photos + landlord letters de users cooperativos para eval set

**Fin de día 2:**
- 3 estados (CA, NY, TX) funcionando. User puede subir caso y ver analysis + damages calculation.

---

### Día 3 — Miércoles 23 abril

**Matu (10 hs):**
- [ ] Letter Drafter subagent: genera demand letter citando statutes específicas. Usa templates por estado
- [ ] PDF generation para demand letter (formato legal standard)
- [ ] Expandir a FL + IL + GA (día crítico de volumen)
- [ ] Grounding strict: cada cita legal linkea a fuente oficial con page + date

**Feli (10 hs):**
- [ ] Demand letter UI: preview, edit, download, email option
- [ ] Empezar filming del demo video. Caso real preferible
- [ ] Post de update en r/Tenant mostrando MVP, pedir feedback (earned media)
- [ ] Contactar a 1-2 legal aid orgs que respondieron para 20 min feedback

**Fin de día 3:**
- 6 estados. Demand letter downloadable. Testing con 2 casos reales.

---

### Día 4 — Jueves 24 abril

**Matu (10 hs):**
- [ ] Expandir a NC + PA + OH + MI (últimos 4 estados)
- [ ] Small-Claims-Package Generator: complaint form pre-filled per state, fee waiver instructions, service instructions, evidence organization guide
- [ ] Eval set run: 40 cases, measure approval prediction accuracy
- [ ] Audit trail: cada output del agent debe tener citation chain visible
- [ ] Verifier Subagent: implementar post-generation verification pass

**Feli (10 hs):**
- [ ] Filming + primera edición del demo video
- [ ] Landing page final
- [ ] Pitch script v1 (2 min). Leer en voz alta, cronometrar
- [ ] Testing end-to-end de 3 casos diferentes con users reales. Get feedback.

**Fin de día 4:**
- 10 estados funcionando. Small claims package generado. Demo video primera versión.

---

### Día 5 — Viernes 25 abril

**Matu (8-10 hs):**
- [ ] Bug bash: testing adversarial (leases raros, fotos borrosas, edge cases)
- [ ] Performance: prompt caching verificado, latency aceptable
- [ ] Polish: error handling elegante, loading states, fallbacks
- [ ] README completo del repo con architecture diagram

**Feli (8-10 hs):**
- [ ] Demo video final edit. Subtítulos. Music. CTA.
- [ ] Pitch script v2. Ensayos cronometrados (3-5 veces)
- [ ] Landing page polish
- [ ] Submission materials: project description, technical details, team bio

**Fin de día 5:**
- Todo funcional. Demo video casi listo. Pitch pulido.

---

### Día 6 — Sábado 26 abril (buffer day crítico)

Este día es para resolver los 3-5 problemas que inevitablemente surgen.

**Ambos:**
- [ ] Última ronda de user testing. 2-3 casos nuevos
- [ ] Fix breaking bugs
- [ ] Video final con voice-over limpio
- [ ] Cost analysis: cuánto cuesta por caso (material para pitch)
- [ ] Eval results paper: baseline vs con tool, métricas visuales

---

### Día 7 — Domingo 27 abril

**Mañana:**
- [ ] Last polish
- [ ] Submission del project (antes de que arranque deadline del lunes)
- [ ] Backup de todo (video en 2 plataformas, repo público, landing page live)

**Tarde:**
- Descansar.

---

### Lunes 28 abril — Submission day

- Submission ya debería estar hecha
- Monitorear si piden cosas adicionales
- Stand by para posibles Q&A del jury

---

## 7. Criterios de éxito por hito

- **Sábado 19 noche:** Register completo ✅, 25+ DMs enviadas, abogado AR contactado, statutes descargados, repo setup.
- **Lunes 21 noche:** CA funciona end-to-end (ugly but working).
- **Miércoles 23 noche:** 6 estados funcionando, demand letter generable.
- **Viernes 25 noche:** 10 estados, small claims package, demo video v1, pitch v2.
- **Domingo 27 noche:** Submission hecha, video final, landing page live.

---

## 8. Principios no negociables durante el build

1. **Scope discipline.** Si algo no está en este roadmap, no se hace. Scope creep mata hackathons.
2. **Reclutamiento continuo de users.** Feli sigue haciendo DMs todos los días. Al final tienen que tener 10+ users testeando.
3. **Grounding obsesivo.** Cada claim legal linkea a fuente. Zero alucinación tolerada.
4. **Demo > features.** Si hay que elegir entre feature nueva y pulir demo, siempre demo.
5. **Commits frecuentes.** Cada 2 hs push al repo. Los jueces lo van a ver.
6. **Nocturnidad responsable.** No matarse Día 1. Pico de energía debe ser Días 4-6.
7. **Humildad calibrada > confianza vacía.** Decimos lo que sabemos y lo que no. Los jueces prefieren rigor honesto sobre promesas infladas.

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Alucinación de citations | Media | Crítico | Verifier subagent + grounding architecture + eval set |
| Scope creep a 50 estados | Alta | Alto | Lock 10 estados, document en pitch "V1 covers 67% of renters" |
| Vision pipeline da false positives | Media | Alto | Confidence scores + human-in-the-loop checkpoint |
| No conseguir users reales | Media | Alto | 25 DMs mínimo + legal aid orgs outreach + Twitter/LinkedIn |
| Bugs críticos en demo day | Alta | Crítico | Buffer day 26 + backup video pre-grabado |
| Costs run over budget | Baja | Medio | Prompt caching agresivo + monitoring desde día 1 |
| Feli o Matu se enferma | Baja | Alto | Cross-training en áreas clave + documentation continua |

---

## 10. Pitch narrative

### Apertura (15 seg)
"44 million renters in America. Most are young, many are immigrants. They put down $2,000 security deposits, and a huge percentage never see that money again — not because they damaged the apartment, but because they don't know their state's specific law."

### Problem (20 seg)
"$2,000 isn't worth hiring a $300/hr attorney. Small claims court feels impossible. And landlords know this. An estimated $7 billion in deposits are illegally withheld every year in the US."

### Solution (45 seg + demo)
"DepositRescue. [Show real case]. Sarah uploaded her lease, her move-in photos, her move-out photos, and the landlord's itemization letter claiming $2,400 in damages. Watch what Claude Opus 4.7 does:

[Vision comparing photos] — The 'damaged carpet' was already stained at move-in.
[Statute analysis] — The 'cleaning fee' of $300 exceeds the statutory limit in California.
[Timeline check] — The landlord returned the deposit 34 days late, beyond the 21-day statutory deadline.

Sarah's recoverable amount: $7,200. Including 2x statutory penalties for bad faith. Her demand letter cites Cal. Civ. Code §1950.5(g)(1). Her small claims filing package is ready to submit."

### Why Claude (15 seg)
"This required 10 state-specific skills, vision over dozens of photos, multi-step reasoning over lease + statute + landlord letters. Opus 4.7 with Claude Code's subagent architecture is the only reason we could build this in 7 days."

### Close (15 seg)
"We're giving tenants their money back. We tested with real users this week. We're open-sourcing this. Because 44 million people deserve a lawyer in their pocket, and now they have one."

---

## 11. Resources & references

### Legal sources
- CA Civil Code §1950.5: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5.&lawCode=CIV
- NY RPL §7-108: https://www.nysenate.gov/legislation/laws/RPP/7-108
- TX Property Code §92.101-109: https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm
- (completar con otros estados durante setup)

### Competitors / benchmarks
- JustFix.nyc (open source, NYC-focused, non-profit)
- DoNotPay (FTC penalty 2024, limited post-ruling)
- Rocket Lawyer, LegalZoom (general purpose, not tenant-specific)

### Inspiration (ganadores previos Built with Opus 4.6)
- CrossBeam (Mike Brown) — ADU permits, ganador #1
- postvisit.ai (Michał Nedoszytko) — patient care, ganador #3
- Patrón común: domain-expertise + bureaucracy-heavy + vision + long context + subagents

### User research sources
- r/Tenant
- r/legaladvice
- r/renters
- r/personalfinance
- r/povertyfinance
- Legal aid orgs: NY Legal Assistance Group, CA Tenants Together, Texas Tenants Union

---

## 12. Contactos clave

- **Cerebral Valley:** https://cerebralvalley.ai/e/built-with-4-7-hackathon
- **Discord del hackathon:** [agregar link cuando aceptados]
- **Abogado AR de Feli:** [completar]
- **Claude Code docs:** https://docs.claude.com
- **Anthropic API platform:** https://platform.claude.com

---

## 13. Post-hackathon (si ganamos O no)

### Si entramos top 10
- Press release coordinado
- Post en LinkedIn (Matu + Feli)
- Apply to YC W27 batch con DepositRescue
- Conversaciones con Kaszek (contacto Matu vía UTDT Factory)

### Si no entramos top 10
- Seguimos igual. El research hecho + el código + los users reclutados son valor real.
- Lanzar público en Mayo 2026 como open-source + hosted version.
- Monetization: freemium (letter free, small claims package premium).

### Path a startup real
- Raise seed $500K-$1M (similar pre-money que Cuidame)
- Expand a repairs → rent increases → evictions
- Partnership con legal aid orgs (refiriendo cases complejos)
- White-label version para attorneys y legal aid

---

## 14. Nota final

Este no es un hackathon de ideas bonitas. Es un hackathon de **ejecución disciplinada** sobre un problema real. Los ganadores previos (Mike Brown, Nedoszytko) no ganaron por tener la idea más creativa — ganaron porque conocían un dolor específico y lo resolvieron con profundidad técnica.

Nuestro dolor es real: 44M personas están perdiendo $7B anuales porque el sistema legal es opaco. Nuestra solución tiene profundidad técnica real (10 skills, 7 subagents, vision + long context + grounding). Nuestro equipo es complementario (Matu tech + hardware + cross-border ops, Feli product + marketing + Claude Code power user).

**Let's ship it.**

---

*Última actualización: 19 abril 2026*
*Versión: 1.0*
