// ============================================================
// LOGIQUE PURE DE MÉMOIRE À NIVEAUX — aucune dépendance au stockage.
// Utilisé par moteurMemoire.js (Yuna, stockage localStorage dédié)
// ET par personnages.js (stockage embarqué dans l'objet personnage,
// synchronisé avec Firestore comme le reste du personnage).
//
// À placer dans : src/services/memoire/utilsNiveaux.js
// ============================================================

export const NIVEAUX_VALIDES = ['permanente', 'recente', 'emotionnelle', 'relationnelle', 'secrets', 'habitudes', 'promesses']
export const MAX_PAR_NIVEAU = { permanente: 40, recente: 15, emotionnelle: 20, relationnelle: 20, secrets: 15, habitudes: 15, promesses: 15 }
export const JOURS_EXPIRATION_RECENTE = 14

export function structureMemoireVide() {
  const structure = {}
  for (const niveau of NIVEAUX_VALIDES) structure[niveau] = []
  return structure
}

// Fusionne une structure existante avec la structure vide, pour garantir
// que tous les niveaux existent même si les données stockées sont plus
// anciennes/incomplètes (utile dans migrerPersonnage par exemple)
export function completerStructure(structurePartielle) {
  return { ...structureMemoireVide(), ...(structurePartielle || {}) }
}

// Ajoute des souvenirs à un niveau, sans mutation (retourne une NOUVELLE
// structure). item peut être une string ou un objet { texte, ... }
export function fusionnerNiveau(structure, niveau, items) {
  if (!NIVEAUX_VALIDES.includes(niveau)) {
    console.error(`Niveau de mémoire invalide : ${niveau}`)
    return structure
  }
  const liste = Array.isArray(items) ? items : [items]
  if (liste.length === 0) return structure

  const normalises = liste.map((item) =>
    typeof item === 'string' ? { texte: item, date: new Date().toISOString() } : { date: new Date().toISOString(), ...item }
  )
  const textesExistants = new Set((structure[niveau] || []).map((s) => s.texte))
  const nouveaux = normalises.filter((s) => !textesExistants.has(s.texte))

  return {
    ...structure,
    [niveau]: [...(structure[niveau] || []), ...nouveaux].slice(-MAX_PAR_NIVEAU[niveau]),
  }
}

export function supprimerDeNiveau(structure, niveau, texte) {
  return { ...structure, [niveau]: (structure[niveau] || []).filter((s) => s.texte !== texte) }
}

export function modifierDansNiveau(structure, niveau, index, nouveauTexte) {
  if (!structure[niveau]?.[index]) return structure
  const copie = [...structure[niveau]]
  copie[index] = { ...copie[index], texte: nouveauTexte }
  return { ...structure, [niveau]: copie }
}

// Retire les souvenirs "récents" trop vieux et jamais reconfirmés
export function filtrerExpires(structure) {
  const maintenant = Date.now()
  return {
    ...structure,
    recente: (structure.recente || []).filter((s) => {
      const age = (maintenant - new Date(s.date).getTime()) / 86400000
      return age < JOURS_EXPIRATION_RECENTE
    }),
  }
}

// Aplati une sélection de niveaux en un tableau de strings, pratique
// pour construire un bloc de prompt
export function extraireTextesPourPrompt(structure, niveauxInclus = NIVEAUX_VALIDES) {
  const resultat = []
  for (const niveau of niveauxInclus) {
    for (const s of structure[niveau] || []) resultat.push(s.texte)
  }
  return resultat
}