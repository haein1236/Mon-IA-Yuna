import { synchroniserVersFirestore } from './sync'


const CLE_PARAMETRES = 'yuna-parametres'

export const FONDS_CHAT_DISPONIBLES = [
  { id: 'defaut',  nom: 'Défaut',      style: null },
  { id: 'sakura',  nom: 'Sakura',      style: 'linear-gradient(160deg, #FBE4EB 0%, #F4C9D6 100%)' },
  { id: 'nuit',    nom: 'Nuit douce',  style: 'linear-gradient(160deg, #2B1A2E 0%, #4A2E4F 100%)' },
  { id: 'ocean',   nom: 'Océan calme', style: 'linear-gradient(160deg, #E3EEF5 0%, #B8D4E3 100%)' },
  { id: 'automne', nom: 'Automne',     style: 'linear-gradient(160deg, #F5E6D3 0%, #E0B896 100%)' },
]

const parametresParDefaut = {
  surnom: 'Saki',
  dateAnniversaire: '',
  messagesActifs: true,
  frequence: 'quotidien',
  heureDebut: '08:00',
  heureFin: '21:00',
  // ⬅️ CHANGÉ : "personnalite" (chaîne) devient "personnalites" (tableau)
  // On garde l'ancien champ pour compatibilité avec ce qui était déjà
  // sauvegardé chez l'utilisateur (voir chargerParametres ci-dessous)
  personnalites: ['caline'],
  notificationsActives: true,
  themeId: 'espresso',
  couleursPersonnalisees: null,
  reduireAnimations: false,
  fondEcranChat: 'defaut',
  fondEcranChatPerso: null,
}

export function chargerParametres() {
  const donneesBrutes = localStorage.getItem(CLE_PARAMETRES)
  if (!donneesBrutes) return parametresParDefaut
  const parametresCharges = { ...parametresParDefaut, ...JSON.parse(donneesBrutes) }

  // ⬅️ Migration douce : si un ancien réglage "personnalite" (singulier)
  // existe encore sans "personnalites" (tableau), on le convertit
  if (parametresCharges.personnalite && (!parametresCharges.personnalites || parametresCharges.personnalites.length === 0)) {
    parametresCharges.personnalites = [parametresCharges.personnalite]
  }
  return parametresCharges
}

export function sauvegarderParametres(parametres) {
  localStorage.setItem(CLE_PARAMETRES, JSON.stringify(parametres))
  // ⬅️ NOUVEAU : synchronise aussi vers Firestore, en arrière-plan
  // (pas de "await" ici volontairement — ne ralentit jamais l'interface)
  synchroniserVersFirestore('parametres', parametres)
}

export { parametresParDefaut }