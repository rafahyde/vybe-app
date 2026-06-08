// ─── DEDUPLICATION ────────────────────────────────────────────────────────────

export function generateFingerprint(
  name: string,
  date: string,
  location: string,
  city: string = "sjc"
): string {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 50);

  const parts = [
    normalize(name),
    normalize(date.slice(0, 10)),
    normalize(location),
    normalize(city),
  ];
  return parts.join("|");
}

export function isInSJC(
  city: string = "",
  address: string = "",
  description: string = ""
): boolean {
  const SJC_TERMS = [
    "são josé dos campos", "sao jose dos campos", "sjc",
    "vale do paraíba", "vale do paraiba",
    "urbanova", "jardim esplanada", "centro sjc",
  ];
  const text = `${city} ${address} ${description}`.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return SJC_TERMS.some(term =>
    text.includes(term.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
}
