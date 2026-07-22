export function formaterListe(items) {
  return Array.isArray(items) && items.length > 0 ? items.join(", ") : null;
}

// Gemini exige que l'historique commence par un message "user" — retire les
// éventuels messages "model" en tête si l'historique en contient.
export function alignerHistoriquePourGemini(historiqueFormate) {
  const copie = [...historiqueFormate];
  while (copie.length > 0 && copie[0].role !== "user") {
    copie.shift();
  }
  return copie;
}

export function calculerMomentDeLaJournee() {
  const h = new Date().getHours();
  if (h < 6) return "la nuit, très tard";
  if (h < 12) return "le matin";
  if (h < 14) return "le midi";
  if (h < 18) return "l'après-midi";
  if (h < 22) return "le soir";
  return "la nuit";
}

export function calculerJoursDepuisDebut(personnage) {
  const debut = personnage.lieuTemps?.dateDebutHistoire;
  if (!debut) return 0;
  return Math.floor((Date.now() - new Date(debut).getTime()) / 86400000);
}

export function recupererProfilPourYuna() {
  const profilSauvegarde = localStorage.getItem("yuna-profil-saki");
  if (!profilSauvegarde) return null;
  try {
    return JSON.parse(profilSauvegarde);
  } catch {
    return null;
  }
}