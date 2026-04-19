// Formatting helpers for the cockpit UI.

const DAYS_ES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatJournalTs(ts: string | Date) {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const today = startOfLocalDay(new Date());
  const dayStart = startOfLocalDay(d);
  const diffDays = Math.round(
    (today.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dateLabel = `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
  let prefix: string;
  if (diffDays === 0) prefix = "HOY";
  else if (diffDays === 1) prefix = "AYER";
  else prefix = `${diffDays}D ATRÁS`;

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  return {
    day: `${prefix} · ${dateLabel}`,
    t: `${hh}:${mm}`,
  };
}

export function timeAgo(ts: string | Date) {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  return `hace ${days}d`;
}
