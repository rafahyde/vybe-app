// ─── DATE UTILS ───────────────────────────────────────────────────────────────

export function parseEventDate(dateStr: string, timeStr?: string): string | null {
  if (!dateStr) return null;
  try {
    // Formats: "2025-06-15", "15/06/2025", "15 de junho de 2025", "Sábado, 15 de junho"
    let date = dateStr.trim();

    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      const dt = timeStr ? `${date.slice(0,10)}T${timeStr}:00` : `${date.slice(0,10)}T00:00:00`;
      return new Date(dt).toISOString();
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
      const [d, m, y] = date.split("/");
      const dt = timeStr ? `${y}-${m}-${d}T${timeStr}:00` : `${y}-${m}-${d}T00:00:00`;
      return new Date(dt).toISOString();
    }

    // "15 de junho de 2025"
    const months: Record<string, string> = {
      janeiro: "01", fevereiro: "02", março: "03", abril: "04",
      maio: "05", junho: "06", julho: "07", agosto: "08",
      setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
    };
    const match = date.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
    if (match) {
      const [, d, mon, y] = match;
      const m = months[mon.toLowerCase()];
      if (m) {
        const dd = d.padStart(2, "0");
        const dt = timeStr ? `${y}-${m}-${dd}T${timeStr}:00` : `${y}-${m}-${dd}T00:00:00`;
        return new Date(dt).toISOString();
      }
    }

    // Fallback: try native parse
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();

    return null;
  } catch {
    return null;
  }
}

export function isExpired(startsAt: string | null): boolean {
  if (!startsAt) return false;
  return new Date(startsAt) < new Date();
}

export function formatDateLabel(startsAt: string): string {
  const d = new Date(startsAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (eventDay.getTime() === today.getTime()) return "Hoje";
  if (eventDay.getTime() === tomorrow.getTime()) return "Amanhã";

  const dayOfWeek = d.getDay();
  const daysUntilSat = (6 - now.getDay() + 7) % 7;
  const daysUntilSun = (7 - now.getDay()) % 7 || 7;
  const satDate = new Date(today); satDate.setDate(today.getDate() + daysUntilSat);
  const sunDate = new Date(today); sunDate.setDate(today.getDate() + daysUntilSun);

  if (eventDay >= satDate && eventDay <= sunDate && daysUntilSat <= 7) return "Fim de semana";

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
