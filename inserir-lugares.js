import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://aicyggsnmmjqefqeldlb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpY3lnZ3NubW1qcWVmcWVsZGxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMwMDA4OCwiZXhwIjoyMDk0ODc2MDg4fQ.blXLCw9YMGGUxpOWdpeMJug7mV1KZTVKcodyZ9hMtYc" // substitui pela sua chave service_role
);

const PLACES = [
  {
    name: "Bar Coronel",
    type: "bar",
    distance: "0.3km",
    tags: ["petiscos", "chopp", "tradicional"],
    rating: 4.7,
    crowd: 80,
    music: "Sertanejo",
    cover: "Grátis",
    color: "#FF6B6B",
    lat: -23.1825311,
    lng: -45.8833651,
    checkins: 34,
    address: "R. Francisco Raphael, 298 - Centro",
    reports: []
  },
  {
    name: "Honey Club",
    type: "club",
    distance: "1.4km",
    tags: ["eletrônico", "shows", "18+"],
    rating: 4.1,
    crowd: 92,
    music: "House / Pop",
    cover: "R$40",
    color: "#A78BFA",
    lat: -23.193504,
    lng: -45.890727,
    checkins: 112,
    address: "Av. Dr. Ademar de Barros, 152 - Vila Adyana",
    reports: []
  },
  {
    name: "Buteco da Villa",
    type: "bar",
    distance: "2.1km",
    tags: ["boteco", "torresmo", "zona leste"],
    rating: 4.7,
    crowd: 58,
    music: "Pagode / Samba",
    cover: "Grátis",
    color: "#34D399",
    lat: -23.174844,
    lng: -45.854184,
    checkins: 67,
    address: "Av. Prof. S. P. T. Pontes, 875 - Vila Industrial",
    reports: []
  },
  {
    name: "Buxixo Gastrobar",
    type: "restaurant",
    distance: "1.8km",
    tags: ["gastronomia", "cocktails", "vista"],
    rating: 4.6,
    crowd: 65,
    music: "Deep House",
    cover: "Grátis",
    color: "#F59E0B",
    lat: -23.195435,
    lng: -45.908351,
    checkins: 89,
    address: "Av. Anchieta, 1580 - Jardim Esplanada",
    reports: []
  },
  {
    name: "Hangar Gastronomia",
    type: "restaurant",
    distance: "2.0km",
    tags: ["temático", "aviação", "família"],
    rating: 4.8,
    crowd: 45,
    music: "MPB",
    cover: "Grátis",
    color: "#60A5FA",
    lat: -23.197353,
    lng: -45.904646,
    checkins: 41,
    address: "Av. Barão do Rio Branco, 669 - Jd. Esplanada",
    reports: []
  },
  {
    name: "FREAKOUT",
    type: "club",
    distance: "1.6km",
    tags: ["rock", "underground", "alternativo"],
    rating: 3.6,
    crowd: 88,
    music: "Rock / Alternativo",
    cover: "R$25",
    color: "#F43F5E",
    lat: -23.191118,
    lng: -45.891523,
    checkins: 178,
    address: "R. Luiz Jacinto, 240 - Centro",
    reports: []
  }
];

const { data, error } = await supabase.from("places").insert(PLACES);

if (error) {
  console.error("Erro:", error.message);
} else {
  console.log("✅ " + PLACES.length + " lugares inseridos com sucesso!");
}