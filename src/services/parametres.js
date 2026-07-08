// ============================================================
// SERVICE PARAMÈTRES
// Gère la sauvegarde et la lecture des réglages utilisateur.
// Fonctionne exactement comme conversations.jsx : tout est stocké
// dans le localStorage du navigateur, sous une seule clé.
// ============================================================

const CLE_PARAMETRES = 'yuna-parametres'

// Valeurs utilisées si l'utilisateur n'a encore rien configuré
export const parametresParDefaut = {
  // --- Yuna & moi ---
  surnom: 'Saki',               // Comment Yuna doit t'appeler dans le chat
  dateAnniversaire: '',         // Format 'AAAA-MM-JJ' — vide = non renseignée

  // --- Messages spontanés ---
  messagesActifs: true,         // Yuna a-t-elle le droit d'écrire en premier ?
  frequence: 'quotidien',       // 'quotidien' | 'deuxFoisParJour' | 'hebdomadaire'
  heureDebut: '08:00',          // Yuna n'écrira jamais avant cette heure
  heureFin: '21:00',            // ...ni après celle-ci

  // --- Personnalité de l'IA (utilisé plus tard dans gemini.js) ---
  personnalite: 'caline',       // 'caline' | 'taquine' | 'motivante' | 'calme'

  // --- Notifications ---
  notificationsActives: true,

  // --- Thème visuel ---
  themeId: 'espresso',          // id du preset choisi (voir ThemeContext.jsx)
  couleursPersonnalisees: null, // { espresso, peony, cream } si mode "sur-mesure"

  // Dans parametresParDefaut, ajoute cette ligne :
  reduireAnimations: false, // Désactive les animations (accessibilité / performance)
}

// Charge les paramètres sauvegardés (fusionnés avec les valeurs par défaut,
// au cas où on ajoute un nouveau réglage plus tard sans casser les anciens profils)
export function chargerParametres() {
  const donneesBrutes = localStorage.getItem(CLE_PARAMETRES)
  if (!donneesBrutes) return parametresParDefaut
  return { ...parametresParDefaut, ...JSON.parse(donneesBrutes) }
}

// Sauvegarde l'objet paramètres complet
export function sauvegarderParametres(parametres) {
  localStorage.setItem(CLE_PARAMETRES, JSON.stringify(parametres))
}