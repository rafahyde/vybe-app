// Email do admin — único usuário que pode adicionar/remover lugares e festas.
// A segurança real está no RLS do Supabase (ver SQL). Isso aqui é só pra UI.
export const ADMIN_EMAIL = "rafahyde9@hotmail.com";

export function isAdmin(user) {
  return !!user && user.email === ADMIN_EMAIL;
}

// Geocodificação via Nominatim (OpenStreetMap) — gratuita, sem cadastro.
// Limite: 1 req/seg. Pra uso admin baixo volume, tranquilo.
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) {
    throw new Error("Endereço muito curto");
  }
  const query = encodeURIComponent(address + ", São José dos Campos, SP, Brasil");
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "pt-BR" },
  });
  if (!res.ok) throw new Error("Falha ao buscar endereço");
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error("Endereço não encontrado");
  }
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}
