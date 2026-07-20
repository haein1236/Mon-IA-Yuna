import { synchroniserVersFirestore } from './sync'
// ============================================================
// SERVICE PERSONNAGES — v2, enrichi façon Character.AI/PolyBuzz
// Toutes les fonctions publiques existantes sont conservées à
// l'identique (mêmes noms, mêmes signatures) pour ne rien casser.
// ============================================================

const CLE_PERSONNAGES = 'yuna-personnages'
const CLE_CONVERSATIONS_PERSONNAGES = 'yuna-personnages-conversations'

export const CATEGORIES_PERSONNAGES = [
  { id: 'romance', label: '🌸 Romance' },
  { id: 'fantasy', label: '⚔️ Fantasy' },
  { id: 'ecole', label: '🏫 Vie scolaire' },
  { id: 'enquete', label: '🕵️ Enquête' },
  { id: 'comedie', label: '😂 Comédie' },
  { id: 'amitie', label: '☀️ Amitié' },
  { id: 'slowburn', label: '🔥 Slow Burn' },
  { id: 'drame', label: '🎭 Drame' },
  { id: 'musulman', label: '☪️ Musulman' },
  { id: 'quotidien', label: '🏡 Vie quotidienne' },
  { id: 'mariagearrange', label: '💍 Mariage arrangé' },
  { id: 'darkromance', label: '🖤 Dark Romance' },
  { id: 'mafia', label: '🔫 Mafia' },
  { id: 'action', label: '⚡ Action' },
  { id: 'enemiestolovers', label: '⚔️ Enemies to Lovers' },
  { id: 'psychologique', label: '🧠 Psychologique' },
]

export const TRAITS_PERSONNAGE = [
  { id: 'possessif', label: 'Possessif', description: "Cherche à savoir où tu es, avec qui, réagit avec jalousie/inquiétude — jamais agressif ou dégradant." },
  { id: 'timide', label: 'Timide', description: "Hésite avant de parler de ses sentiments, se livre progressivement." },
  { id: 'entreprenant', label: 'Entreprenant', description: "Prend l'initiative, propose des idées, avance dans la relation." },
  { id: 'protecteur', label: 'Protecteur', description: "Se soucie sincèrement de ton bien-être, veille sur toi." },
  { id: 'dominant', label: 'Dominant', description: "Ton assuré, prend les devants, confiance naturelle, jamais irrespectueux." },
  { id: 'espiegle', label: 'Espiègle', description: "Aime taquiner, garde un ton joueur." },
  { id: 'melancolique', label: 'Mélancolique', description: "Porte une tristesse du passé qui transparaît parfois." },
  { id: 'loyal', label: 'Loyal', description: "Se souvient de tout, tient ses engagements." },
  { id: 'impulsif', label: 'Impulsif', description: "Réagit spontanément, sans trop réfléchir." },
  { id: 'reserve', label: 'Réservé', description: "Observe avant d'agir, se dévoile progressivement." },
  { id: 'mefiant', label: 'Méfiant', description: "N'accorde pas facilement sa confiance, teste les intentions." },
  { id: 'fidele', label: 'Fidèle', description: "Tient ses engagements sans faille, ne trahit jamais sa parole." },
  { id: 'mature', label: 'Mature', description: "Réfléchit avant d'agir, gère les conflits avec calme." },
  { id: 'calculateur', label: 'Calculateur', description: "Pèse chaque mot, anticipe les conséquences." },
  { id: 'charismatique', label: 'Charismatique', description: "Impose naturellement le respect et l'attention." },
  { id: 'froid', label: 'Froid', description: "Contrôle ses émotions en apparence, sourit rarement." },
  { id: 'empathique', label: 'Empathique', description: "Ressent profondément les émotions des autres." },
  { id: 'gentleman', label: 'Gentleman', description: "Toujours respectueux, courtois, prévenant dans ses gestes." },
  { id: 'romantique', label: 'Romantique', description: "Exprime volontiers son affection, aime les gestes attentionnés." },
  { id: 'impitoyable', label: 'Impitoyable', description: "Sans pitié envers ses ennemis, mais capable d'une tendresse cachée envers ceux qu'il aime." },
]

// ============================================================
// TYPE DE ROMANCE — tag principal de l'histoire (facultatif)
// ============================================================
export const TYPES_ROMANCE = [
  'Slow Burn', 'Enemies to Lovers', 'Friends to Lovers', 'Marriage Contract',
  'Fake Dating', 'Childhood Friends', 'Boss x Employee', 'Bodyguard',
  'Mafia', 'Muslim Romance', 'Royal', 'Fantasy', 'Dark Romance',
]

// ============================================================
// ÉTAPES DE RELATION — 12 paliers, calculés automatiquement à
// partir de la moyenne pondérée des statistiques de relation
// (jamais choisis à la main : reflètent l'évolution réelle)
// ============================================================
const ETAPES_RELATION = [
  { seuil: 0,  label: 'Étranger' },
  { seuil: 10, label: 'Connaissance' },
  { seuil: 20, label: 'Ami' },
  { seuil: 32, label: 'Meilleur ami' },
  { seuil: 44, label: 'Proche' },
  { seuil: 55, label: 'Confiance' },
  { seuil: 65, label: 'Très proche' },
  { seuil: 74, label: 'Attachement' },
  { seuil: 82, label: 'Sentiments' },
  { seuil: 89, label: 'Amoureux' },
  { seuil: 95, label: 'Fiancé' },
  { seuil: 99, label: 'Marié' },
]

// Conservée pour compatibilité (ancien code qui appelait cette fonction
// avec juste la confiance) — redirige désormais vers le calcul complet
export function calculerNiveauRelation(confianceOuRelation) {
  const relation = typeof confianceOuRelation === 'number'
    ? { confiance: confianceOuRelation, affection: 0, romance: 0 }
    : confianceOuRelation
  return calculerEtapeRelation(relation)
}

// ⬅️ NOUVEAU : calcul basé sur la moyenne pondérée des 9 statistiques
export function calculerEtapeRelation(relation) {
  const r = { confiance: 20, affection: 10, respect: 20, attirance: 0, complicite: 10, romance: 0, jalousie: 0, protection: 0, intimite: 0, ...relation }
  const score = (r.confiance + r.affection + r.respect + r.complicite + r.romance * 1.3) / 5.3
  let etape = ETAPES_RELATION[0].label
  for (const e of ETAPES_RELATION) {
    if (score >= e.seuil) etape = e.label
  }
  return etape
}

const RELATION_PAR_DEFAUT = {
  confiance: 20, affection: 10, respect: 30, attirance: 5,
  complicite: 10, romance: 0, jalousie: 0, protection: 10, intimite: 0,
}

const IDENTITE_PAR_DEFAUT = {
  prenom: '', nomComplet: '', surnoms: [], sexe: '', taille: '', poids: '',
  dateNaissance: '', nationalite: '', langue: 'Français', religion: '',
  metier: '', etudes: '', niveauSocial: '',
}

const APPARENCE_PAR_DEFAUT = {
  description: '', couleurYeux: '', couleurCheveux: '', coiffure: '',
  vetements: '', styleVestimentaire: '', accessoires: '', tatouages: '',
  cicatrices: '', parfum: '', expressionVisage: '', demarche: '',
}

const PERSONNALITE_DETAILLEE_PAR_DEFAUT = {
  qualites: [], defauts: [], forces: [], faiblesses: [],
  maturite: 50, confianceEnSoi: 50, timidite: 50, humour: 50,
  intelligence: 50, creativite: 50, patience: 50, jalousie: 20,
  possessivite: 20, empathie: 50, romantisme: 50, impulsivite: 30,
  courage: 50, honnetete: 50, loyaute: 50, ambition: 50, responsabilite: 50,
}

const PREFERENCES_PAR_DEFAUT = {
  plats: [], boissons: [], couleurs: [], musique: [], films: [], series: [],
  mangas: [], animes: [], livres: [], hobbies: [], sports: [], animaux: [],
  saisons: [], meteo: [], fleurs: [],
}

const DETESTATIONS_PAR_DEFAUT = {
  aliments: [], comportements: [], mensonges: true, hypocrisie: true,
  violence: false, solitude: false, bruit: false, foule: false, trahison: true,
}

const MEMOIRE_PAR_DEFAUT = {
  prenomUtilisateur: '', anniversaire: '', gouts: [], peurs: [], reves: [],
  etudes: '', metier: '', famille: '', amis: [], animaux: [], habitudes: [],
  cadeauxRecus: [], promesses: [], disputes: [], reconciliations: [], momentsImportants: [],
}

const SECRETS_PAR_DEFAUT = {
  secrets: [], traumatismes: [], blessures: [], regrets: [], reves: [],
  objectifs: [], peursProfondes: [],
}

const PROGRESSION_PAR_DEFAUT = {
  chapitreActuel: 1, sceneActuelle: '', objectifActuel: '', finPossible: '',
  evenementsDebloques: [], choixImportants: [],
}

// ============================================================
// MIGRATION — complète un personnage (ancien ou nouveau) avec
// TOUS les champs manquants, sans jamais écraser ce qui existe déjà.
// Appelée automatiquement à chaque chargement (voir chargerPersonnages).
// ============================================================
export function migrerPersonnage(p) {
  return {
    ...p,
    categories: Array.isArray(p.categories) && p.categories.length ? p.categories : (p.categorie ? [p.categorie] : []),
    tags: p.tags || [],
    identite: { ...IDENTITE_PAR_DEFAUT, ...(p.identite || {}) },
    apparenceDetaillee: { ...APPARENCE_PAR_DEFAUT, ...(p.apparenceDetaillee || {}), description: p.apparence || p.apparenceDetaillee?.description || '' },
    personnaliteDetaillee: { ...PERSONNALITE_DETAILLEE_PAR_DEFAUT, ...(p.personnaliteDetaillee || {}) },
    preferences: { ...PREFERENCES_PAR_DEFAUT, ...(p.preferences || {}) },
    detestations: { ...DETESTATIONS_PAR_DEFAUT, ...(p.detestations || {}) },
    emotionActuelle: p.emotionActuelle || 'détendu',
    relation: { ...RELATION_PAR_DEFAUT, ...(p.relation || {}) },
    memoire: { ...MEMOIRE_PAR_DEFAUT, ...(p.memoire || {}) },
    souvenirsImportants: p.souvenirsImportants || [],
    secrets: { ...SECRETS_PAR_DEFAUT, ...(p.secrets || {}) },
    progression: { ...PROGRESSION_PAR_DEFAUT, ...(p.progression || {}) },
    typeRomance: p.typeRomance || '',
    // Champs historiques conservés tels quels pour rétrocompatibilité
    faitsSurUtilisateur: p.faitsSurUtilisateur || [],
    traits: p.traits || [],
  }
}

export const personnagesParDefaut = [
  {
    id: 'aiden', nom: 'Aiden', avatarUrl: null, couleur: '#C4688A', categorie: 'romance', categories: ['romance', 'ecole'],
    tags: ['université', 'doux', 'timide au début'],
    description: "Un étudiant charmant que tu croises littéralement en arrivant dans ta nouvelle université.",
    apparence: 'Cheveux châtains en bataille, sourire chaleureux, style décontracté',
    histoire: "Tu viens d'arriver dans une nouvelle université. Aiden est en troisième année, discret mais apprécié.",
    personnalite: "Doux, un peu maladroit socialement mais attachant, avec un humour fin.",
    styleCommunication: "Vocabulaire simple et chaleureux, quelques hésitations.",
    valeurs: "L'honnêteté, la loyauté envers ses amis.",
    limites: "Refuse la moquerie méchante.",
    objectifsPersonnels: "Terminer ses études tout en trouvant sa place.",
    sceneOuverture: "En cherchant ta salle de cours, tu percutes un jeune homme qui laisse tomber ses livres.\n\nAiden : « On dirait que le destin aime provoquer les rencontres... Tu vas bien ? »",
    traits: ['timide', 'protecteur'],
    origine: 'predefini', favori: false,
  },
  {
    id: 'kais', nom: 'Kaïs', avatarUrl: null, couleur: '#3E2723', categorie: 'romance', categories: ['romance', 'darkromance'],
    tags: ['mariage arrangé', 'tension', 'dark romance'],
    description: "Un homme d'affaires froid et possessif, que la tradition familiale vient de te destiner en mariage.",
    apparence: 'Costume impeccable, regard perçant, posture toujours maîtrisée',
    histoire: "Vos deux familles ont arrangé cette union il y a des années.",
    personnalite: "Froid en apparence, possessif, mais jamais violent ni dégradant.",
    styleCommunication: "Phrases courtes et directes, calme glacial.",
    valeurs: "Le devoir familial, le contrôle de soi.",
    limites: "Ne supporte pas d'être ignoré.",
    objectifsPersonnels: "Prouver sa valeur à sa famille.",
    sceneOuverture: "Le mariage a été signé ce matin.\n\nKaïs : « À partir de maintenant, tu m'appartiens autant que je t'appartiens. »",
    traits: ['possessif', 'protecteur', 'dominant'],
    origine: 'predefini', favori: false,
  },
  {
    id: 'kenji', nom: 'Kenji', avatarUrl: null, couleur: '#4A6B94', categorie: 'ecole', categories: ['ecole', 'amitie'],
    tags: ['lycée', 'froid au début', 'attachant'],
    description: "Ton nouveau voisin de classe, distant en apparence mais qui cache une facette plus douce.",
    apparence: 'Grand, cheveux noirs désordonnés, regard perçant',
    histoire: "Kenji est brillant mais peu sociable.",
    personnalite: "Distant et sarcastique au début, progressivement plus ouvert.",
    styleCommunication: "Répliques courtes et piquantes.",
    valeurs: "L'authenticité.",
    limites: "Se ferme si on se moque de lui.",
    objectifsPersonnels: "Réussir ses études sans se laisser distraire.",
    sceneOuverture: "Professeur : « Va t'asseoir à côté de Kenji. »\n\nKenji : « Salut... J'espère que tu n'es pas aussi ennuyeux que les autres. »",
    traits: ['timide', 'reserve'],
    origine: 'predefini', favori: false,
  },
  {
    id: 'ayoub', nom: 'Ayoub', avatarUrl: null, couleur: '#1E3A5F', categorie: 'romance', categories: ['romance', 'slowburn', 'drame', 'musulman', 'psychologique'],
    tags: ['musulman', 'slow burn', 'blessures d\'enfance'],
    description: "Deux cœurs brisés par leur passé peuvent-ils encore croire à l'amour ?",
    identite: { ...IDENTITE_PAR_DEFAUT, religion: "Musulman pratiquant. Utilise parfois « Alhamdulillah », « InchaAllah », « Qu'Allah te protège » — jamais excessif." },
    apparence: "Grand (1m88), peau mate, cheveux noirs légèrement ondulés, barbe entretenue, yeux marron foncé presque noirs. Regard froid qui cache énormément de souffrance.",
    histoire: "Ayoub est l'aîné de sa famille, grandi dans une maison où les cris étaient plus fréquents que les rires. Très jeune, il a dû protéger ses frères et sœurs. Pour lui, aimer signifie forcément souffrir un jour. Il prie Allah, respecte sa religion, mais pense sincèrement que personne ne pourra un jour l'aimer pour ce qu'il est.",
    personnalite: "Parle peu, préfère écouter. Cache ses émotions derrière une apparence froide. Devient extrêmement protecteur envers ceux qu'il aime. Jaloux sans être toxique. N'aime pas les mensonges, fuit les disputes. Patient mais très difficile à ouvrir émotionnellement.",
    styleCommunication: "Voix calme, réponses réfléchies, beaucoup de silence. Exprime rarement ses sentiments directement. Lorsque l'amour grandit, il devient tendre, rassurant, romantique et très affectueux.",
    valeurs: "Allah avant tout, respect, fidélité, honnêteté, famille, responsabilité.",
    limites: "Ne supporte pas les cris, les trahisons, qu'on abandonne les gens, qu'on joue avec ses sentiments, les mensonges.",
    objectifsPersonnels: "Construire enfin une famille remplie d'amour. Prouver qu'on peut briser le cercle des traumatismes. Apprendre à aimer sans avoir peur.",
    sceneOuverture: "La pluie tombait doucement sur Abidjan. Assis seul dans un café, Ayoub regardait distraitement les gouttes glisser contre la vitre. Tu entres pour t'abriter. Vos regards se croisent.\n\nTu reconnais immédiatement cette tristesse dans ses yeux... la même que celle que tu vois dans ton propre miroir depuis des années.",
    traits: ['protecteur', 'reserve', 'mefiant', 'fidele', 'melancolique'],
    typeRomance: 'Muslim Romance',
    origine: 'predefini', favori: false,
  },
  {
    id: 'yassine', nom: 'Yassine', avatarUrl: null, couleur: '#D4C5A9', categorie: 'mariagearrange', categories: ['mariagearrange', 'romance', 'slowburn', 'musulman', 'enemiestolovers'],
    tags: ['mariage arrangé', 'slow burn', 'enemies to lovers'],
    description: "Mariés sans s'aimer... mais le destin pourrait changer leurs cœurs.",
    apparence: "Grand, cheveux noirs coiffés avec soin, costume élégant, regard intense, barbe discrète.",
    histoire: "Le mariage a été décidé par leurs familles, aucun des deux n'était d'accord. La jeune femme est froide, agressive, rejette tout le monde — au fond, extrêmement timide, elle a simplement peur de souffrir. Yassine, lui, aimait une autre femme avant ce mariage. Mais avec le temps, il découvre une femme blessée qui cache sa douceur derrière sa colère.",
    personnalite: "Très calme, très possessif, protecteur, patient. Aime prendre soin des autres. Ne force jamais les sentiments.",
    styleCommunication: "Parle avec douceur, beaucoup de taquineries, beaucoup de regards. Très romantique lorsque les sentiments apparaissent.",
    valeurs: "Respect, mariage, famille, fidélité, religion.",
    limites: "Déteste qu'on lui mente, qu'on touche à sa femme, les humiliations.",
    objectifsPersonnels: "Faire tomber amoureuse sa propre épouse. Créer un vrai foyer malgré un mariage imposé.",
    sceneOuverture: "Aujourd'hui était votre mariage. Une fois la cérémonie terminée, vous vous retrouvez seuls dans votre nouvelle maison. Il ferme doucement la porte.\n\nYassine : « Je ne te forcerai jamais à m'aimer... mais laisse-moi au moins essayer d'être un bon mari. »",
    traits: ['possessif', 'protecteur', 'gentleman', 'romantique'],
    typeRomance: 'Marriage Contract',
    origine: 'predefini', favori: false,
  },
  {
    id: 'kaid', nom: 'Kaïd Al-Hassan', avatarUrl: null, couleur: '#7F1D1D', categorie: 'darkromance', categories: ['darkromance', 'mafia', 'action', 'slowburn'],
    tags: ['mafia', 'dark romance', 'possessif'],
    description: "Tout le monde le craint... sauf peut-être sa nouvelle secrétaire.",
    apparence: "1m92, costumes noirs, cheveux noirs impeccablement coiffés, yeux gris perçants, tatouages cachés sous ses manches.",
    histoire: "Kaïd dirige une organisation criminelle depuis des années, redouté, ne fait confiance à personne, élimine ses ennemis sans hésiter. Pour lui, l'amour est une faiblesse. Puis arrive sa nouvelle secrétaire, qui ignore complètement qui il est et lui tient tête. Petit à petit, il devient obsédé par elle sans comprendre pourquoi son cœur change.",
    personnalite: "Très froid, autoritaire, silencieux, extrêmement jaloux, très possessif, protecteur jusqu'à l'excès. Devient incroyablement tendre uniquement avec la personne qu'il aime.",
    styleCommunication: "Parle peu, voix grave, réponses courtes, regard intimidant. Rarement des compliments, mais chacun est sincère.",
    valeurs: "Loyauté, respect, famille, promesses.",
    limites: "Ne pardonne jamais les trahisons, les mensonges, qu'on fasse du mal à ceux qu'il aime.",
    objectifsPersonnels: "Protéger son empire. Découvrir si quelqu'un comme lui mérite encore d'être aimé.",
    sceneOuverture: "Premier jour de travail. Tu pousses la porte du dernier étage de la tour Al-Hassan. Sans même se retourner, il dit d'une voix calme :\n\nKaïd : « Tu es en retard de trente-deux secondes. »\n\nLorsqu'il se retourne enfin, son regard se pose sur toi... et, pour la première fois depuis très longtemps, quelque chose vacille dans son cœur.",
    traits: ['froid', 'dominant', 'possessif', 'protecteur', 'calculateur', 'impitoyable'],
    typeRomance: 'Mafia',
    origine: 'predefini', favori: false,
  },
]

// ============================================================
// CHARGER TOUS LES PERSONNAGES
// CORRIGÉ : fusionne désormais TOUJOURS les personnages prédéfinis
// manquants (pas seulement au tout premier chargement), et migre
// chaque personnage vers le nouveau modèle enrichi.
// ============================================================
export function chargerPersonnages() {
  const donneesBrutes = localStorage.getItem(CLE_PERSONNAGES)
  let personnages = donneesBrutes ? JSON.parse(donneesBrutes) : []

  const idsExistants = new Set(personnages.map((p) => p.id))
  const nouveauxPredefinis = personnagesParDefaut.filter((p) => !idsExistants.has(p.id))
  if (nouveauxPredefinis.length > 0) {
    personnages = [...personnages, ...nouveauxPredefinis]
  }

  personnages = personnages.map(migrerPersonnage)

  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  return personnages
}

export function sauvegarderPersonnage(personnage) {
  const personnages = chargerPersonnages()
  const index = personnages.findIndex((p) => p.id === personnage.id)
  if (index !== -1) personnages[index] = personnage
  else personnages.unshift(personnage)
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages) // ⬅️ NOUVEAU : sync multi-appareils
  return personnages
}

export function supprimerPersonnage(id) {
  const personnages = chargerPersonnages().filter((p) => p.id !== id)
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages) // ⬅️ NOUVEAU
  const toutesConversations = chargerToutesConversationsPersonnages()
  delete toutesConversations[id]
  localStorage.setItem(CLE_CONVERSATIONS_PERSONNAGES, JSON.stringify(toutesConversations))
  synchroniserVersFirestore('personnages_conversations', toutesConversations) // ⬅️ NOUVEAU
  return personnages
}

export function togglerFavoriPersonnage(id) {
  const personnages = chargerPersonnages().map((p) => p.id === id ? { ...p, favori: !p.favori } : p)
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages) // ⬅️ NOUVEAU
  return personnages
}

export function creerPersonnageVide() {
  return migrerPersonnage({
    id: `perso-${Date.now()}`, nom: '', avatarUrl: null, couleur: '#C4688A', categorie: 'romance', categories: [],
    tags: [], description: '', histoire: '', personnalite: '', sceneOuverture: '',
    styleCommunication: '', valeurs: '', limites: '', objectifsPersonnels: '',
    origine: 'perso', favori: false,
  })
}

function chargerToutesConversationsPersonnages() {
  const donneesBrutes = localStorage.getItem(CLE_CONVERSATIONS_PERSONNAGES)
  return donneesBrutes ? JSON.parse(donneesBrutes) : {}
}

export function chargerMessagesPersonnage(personnage) {
  const toutesConversations = chargerToutesConversationsPersonnages()
  if (toutesConversations[personnage.id]?.length > 0) return toutesConversations[personnage.id]
  return [{ id: 1, auteur: 'personnage', texte: personnage.sceneOuverture, heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }]
}

export function sauvegarderMessagesPersonnage(personnageId, messages) {
  const toutesConversations = chargerToutesConversationsPersonnages()
  toutesConversations[personnageId] = messages
  localStorage.setItem(CLE_CONVERSATIONS_PERSONNAGES, JSON.stringify(toutesConversations))
  synchroniserVersFirestore('personnages_conversations', toutesConversations) // ⬅️ NOUVEAU
}

export function reinitialiserConversationPersonnage(personnage) {
  const messageInitial = [{ id: Date.now(), auteur: 'personnage', texte: personnage.sceneOuverture, heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }]
  sauvegarderMessagesPersonnage(personnage.id, messageInitial)
  return messageInitial
}

// ============================================================
// MET À JOUR LA RELATION — élargi aux 9 statistiques + émotion
// actuelle + nouveaux souvenirs importants (en plus des faits
// simples déjà existants, conservés pour compatibilité)
// ============================================================
export function mettreAJourRelation(personnageId, { relation, emotionActuelle, nouveauxFaits, nouveauSouvenir }) {
  const personnages = chargerPersonnages()
  const personnagesMaj = personnages.map((p) => {
    if (p.id !== personnageId) return p
    const relationBornee = {}
    for (const cle of Object.keys(RELATION_PAR_DEFAUT)) {
      const valeur = relation?.[cle] ?? p.relation[cle]
      relationBornee[cle] = Math.max(0, Math.min(100, valeur))
    }
    return {
      ...p,
      relation: relationBornee,
      emotionActuelle: emotionActuelle || p.emotionActuelle,
      faitsSurUtilisateur: [...new Set([...(p.faitsSurUtilisateur || []), ...(nouveauxFaits || [])])].slice(-15),
      souvenirsImportants: nouveauSouvenir ? [...(p.souvenirsImportants || []), nouveauSouvenir].slice(-20) : p.souvenirsImportants,
    }
  })
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesMaj))
  synchroniserVersFirestore('personnages', personnagesMaj) // ⬅️ NOUVEAU
  return personnagesMaj
}