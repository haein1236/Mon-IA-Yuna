const CLE_PARAMETRES = 'yuna-parametres'

// ============================================================
// FONDS D'ÉCRAN DISPONIBLES POUR LE CHAT
// Chaque fond est soit une couleur unie, soit un dégradé CSS —
// "style" est directement utilisable dans un style={{ background }}
// ============================================================
export const FONDS_CHAT_DISPONIBLES = [
  { id: 'defaut',     nom: 'Défaut',         style: null },
  { id: 'sakura',     nom: 'Sakura',         style: 'linear-gradient(160deg, #FBE4EB 0%, #F4C9D6 100%)' },
  { id: 'nuit',       nom: 'Nuit douce',     style: 'linear-gradient(160deg, #2B1A2E 0%, #4A2E4F 100%)' },
  { id: 'ocean',      nom: 'Océan calme',    style: 'linear-gradient(160deg, #E3EEF5 0%, #B8D4E3 100%)' },
  { id: 'automne',    nom: 'Automne',        style: 'linear-gradient(160deg, #F5E6D3 0%, #E0B896 100%)' },
]

const parametresParDefaut = {
  surnom: 'Saki',
  dateAnniversaire: '',
  messagesActifs: true,
  frequence: 'quotidien',
  heureDebut: '08:00',
  heureFin: '21:00',
  personnalite: 'caline',
  notificationsActives: true,
  themeId: 'espresso',
  couleursPersonnalisees: null,
  reduireAnimations: false,
  // ⬅️ NOUVEAU : fond d'écran du chat
  fondEcranChat: 'defaut',       // id d'un preset ci-dessus, ou 'personnalise'
  fondEcranChatPerso: null,      // image en base64 si "personnalise" choisi
}

export function chargerParametres() {
  const donneesBrutes = localStorage.getItem(CLE_PARAMETRES)
  if (!donneesBrutes) return parametresParDefaut
  return { ...parametresParDefaut, ...JSON.parse(donneesBrutes) }
}

export function sauvegarderParametres(parametres) {
  localStorage.setItem(CLE_PARAMETRES, JSON.stringify(parametres))
}

export { parametresParDefaut }