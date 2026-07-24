import { synchroniserVersFirestore } from './sync'
import { structureMemoireVide, completerStructure, fusionnerNiveau } from './memoire/utilsNiveaux'

// ============================================================
// SERVICE PERSONNAGES — v2.2, enrichi façon Character.AI/PolyBuzz
// Moteur relationnel déterministe & propagation dynamique par traits
// ============================================================

const CLE_PERSONNAGES = 'yuna-personnages'
const CLE_CONVERSATIONS_PERSONNAGES = 'yuna-personnages-conversations'
const CLE_PERSONNAGES_SUPPRIMES = 'yuna-personnages-supprimes-defaut'

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
// AXES DE COMPORTEMENT PAR TRAIT
// Chaque trait ajuste un ou plusieurs axes, sur une échelle de -2 à +2 :
//
// initiative   : -2 n'engage jamais / +2 engage tout le temps
// honnetete    : -2 peut déformer/cacher la vérité / +2 toujours transparent
// expressivite : -2 cache ses émotions / +2 les montre ouvertement
// conflit      : -2 fuit ou se referme / +2 affronte directement
// protection   : -2 indifférent aux autres / +2 veille spontanément sur eux
// formalite    : -2 très familier/direct / +2 poli et soigné
//
// Un personnage cumule les effets de TOUS ses traits (addition), donc la
// combinaison de traits crée un profil unique plutôt qu'une catégorie figée.
// ============================================================
export const AXES_COMPORTEMENT_PAR_TRAIT = {
  possessif:     { expressivite: 1, protection: 2 },
  timide:        { initiative: -2, expressivite: -1 },
  entreprenant:  { initiative: 2 },
  protecteur:    { protection: 2, initiative: 1 },
  dominant:      { initiative: 2, conflit: 2 },
  espiegle:      { formalite: -1, expressivite: 1 },
  melancolique:  { expressivite: -1 },
  loyal:         { protection: 1, honnetete: 1 },
  impulsif:      { conflit: 2, expressivite: 1 },
  reserve:       { initiative: -2, expressivite: -1 },
  mefiant:       { initiative: -1, honnetete: -1, conflit: -1 },
  fidele:        { honnetete: 2, protection: 1 },
  mature:        { conflit: -1 },
  calculateur:   { honnetete: -1, initiative: -1, conflit: -1 },
  charismatique: { initiative: 1 },
  froid:         { initiative: -2, expressivite: -2, conflit: -1 },
  empathique:    { expressivite: 1, protection: 1, conflit: -1 },
  gentleman:     { formalite: 2, protection: 1 },
  romantique:    { expressivite: 2 },
  impitoyable:   { conflit: 2, protection: 1 }, // impitoyable envers les ennemis, protecteur envers les siens
}

const TEXTES_AXES = {
  initiative: {
    tresFaible: "Tu n'inities jamais la conversation, tu ne poses pas de questions personnelles en premier, tu attends que le joueur fasse les efforts.",
    faible: "Tu prends rarement l'initiative — tu réponds plus que tu ne relances.",
    neutre: "Tu prends l'initiative avec mesure, ni trop ni trop peu.",
    forte: "Tu relances facilement la conversation, tu proposes des idées ou des activités de ton propre chef.",
    tresForte: "Tu prends l'initiative constantly : tu changes de sujet, proposes des activités, racontes des souvenirs sans attendre qu'on te le demande.",
  },
  honnetete: {
    tresFaible: "Tu peux déformer la vérité ou cacher des choses si ça te protège émotionnellement — jamais par pure méchanceté, mais par instinct de préservation.",
    faible: "Tu éludes ou restes vague plutôt que de mentir franchement, quand un sujet te met mal à l'aise.",
    neutre: "",
    forte: "",
    tresForte: "Tu es toujours honnête, même quand la vérité est inconfortable à dire — c'est une valeur non négociable pour toi.",
  },
  expressivite: {
    tresFaible: "Tu caches presque totalement tes émotions ; ton visage et tes mots trahissent rarement ce que tu ressens vraiment.",
    faible: "Tu montres peu tes émotions, il faut du temps et de la confiance pour que ça transparaisse.",
    neutre: "",
    forte: "Tu exprimes assez librement ce que tu ressens.",
    tresForte: "Tu exprimes tes émotions ouvertement et sans retenue, positives comme négatives.",
  },
  conflit: {
    tresFaible: "Face à une tension ou un manque de respect, tu te refermes et deviens distant plutôt que d'affronter.",
    faible: "Tu évites la confrontation directe, tu préfères minimiser ou changer de sujet.",
    neutre: "Face à une tension, tu en parles calmement, sans fuir ni t'énerver.",
    forte: "Tu n'hésites pas à hausser le ton ou remettre les choses à leur place si on te manque de respect.",
    tresForte: "Tu affrontes directement, sans détour, toute tension ou manque de respect.",
  },
  protection: {
    tresFaible: "", faible: "",
    neutre: "",
    forte: "Tu veilles naturellement sur le bien-être du joueur et de ceux qui te sont proches.",
    tresForte: "Protéger ceux que tu aimes est une priorité constante pour toi, parfois avant ta propre tranquillité.",
  },
  formalite: {
    tresFaible: "Ton langage est très familier, direct, parfois brut.",
    faible: "Ton langage est décontracté.",
    neutre: "",
    forte: "Ton langage est soigné et poli.",
    tresForte: "Ton langage est toujours élégant, courtois, presque cérémonieux.",
  },
}

function texteSelonScore(axe, score) {
  const textes = TEXTES_AXES[axe]
  if (score <= -2) return textes.tresFaible
  if (score === -1) return textes.faible
  if (score === 0) return textes.neutre
  if (score === 1) return textes.forte
  return textes.tresForte
}

// Le chapitre actuel module SEULEMENT l'initiative : même un personnage
// entreprenant reste un peu plus réservé au tout début de l'histoire.
function facteurInitiativeSelonChapitre(numeroChapitre) {
  const paliers = { 1: 0.5, 2: 0.7, 3: 0.85, 4: 1, 5: 1.1, 6: 1.2 }
  return paliers[numeroChapitre] ?? 1
}

/**
 * Calcule le profil comportemental complet d'un personnage à partir de
 * TOUS ses traits combinés, ajusté selon le chapitre actuel de l'histoire.
 * Renvoie un tableau de phrases prêtes à insérer dans le prompt.
 */
export function calculerProfilComportemental(traits, numeroChapitre = 1) {
  const scores = { initiative: 0, honnetete: 0, expressivite: 0, conflit: 0, protection: 0, formalite: 0 }

  for (const trait of traits || []) {
    const effets = AXES_COMPORTEMENT_PAR_TRAIT[trait]
    if (!effets) continue
    for (const axe of Object.keys(effets)) {
      scores[axe] += effets[axe]
    }
  }

  // Applique le facteur de chapitre uniquement sur l'initiative
  if (scores.initiative > 0) {
    scores.initiative = Math.round(scores.initiative * facteurInitiativeSelonChapitre(numeroChapitre))
  }

  for (const axe of Object.keys(scores)) {
    scores[axe] = Math.max(-2, Math.min(2, scores[axe]))
  }

  const phrases = []
  for (const axe of Object.keys(scores)) {
    const texte = texteSelonScore(axe, scores[axe])
    if (texte) phrases.push(texte)
  }

  // Nuance spéciale pour "impitoyable" : dur avec les ennemis, pas avec les proches
  if ((traits || []).includes('impitoyable')) {
    phrases.push("Ta dureté (conflit direct, sans pitié) vise tes ennemis ou ceux qui te trahissent — envers le joueur et ceux que tu aimes, cette même intensité se transforme en protection farouche, pas en agressivité.")
  }

  return phrases
}

// Score d'initiative pur, réutilisé pour décider comment le personnage
// doit se comporter quand on lui demande de "continuer" la scène seul
// (bouton dédié), sans reconstruire tout le profil textuel.
export function calculerScoreInitiative(traits) {
  let score = 0
  for (const trait of traits || []) {
    score += AXES_COMPORTEMENT_PAR_TRAIT[trait]?.initiative || 0
  }
  return Math.max(-2, Math.min(2, score))
}

export const TYPES_ROMANCE = [
  'Slow Burn', 'Enemies to Lovers', 'Friends to Lovers', 'Marriage Contract',
  'Fake Dating', 'Childhood Friends', 'Boss x Employee', 'Bodyguard',
  'Mafia', 'Muslim Romance', 'Royal', 'Fantasy', 'Dark Romance',
]

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

export function calculerNiveauRelation(confianceOuRelation) {
  const relation = typeof confianceOuRelation === 'number'
    ? { confiance: confianceOuRelation, affection: 0, romance: 0 }
    : confianceOuRelation
  return calculerEtapeRelation(relation)
}

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
  metier: '', etudes: '', niveauSocial: '', routineQuotidienne: '',
}

const LIEU_TEMPS_PAR_DEFAUT = {
  lieuActuel: '',
  dateDebutHistoire: null,
  objetsPresents: [],     // ex: ["une tasse de thé", "un vieux carnet"]
  ambianceActuelle: '',   // ex: "tendue", "chaleureuse et calme"
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

const MEMOIRE_NIVEAUX_PAR_DEFAUT = structureMemoireVide()

const SECRETS_PAR_DEFAUT = {
  secrets: [], traumatismes: [], blessures: [], regrets: [], reves: [],
  objectifs: [], peursProfondes: [],
}

const PROGRESSION_PAR_DEFAUT = {
  chapitreActuel: 1, sceneActuelle: '', objectifActuel: '', finPossible: '',
  evenementsDebloques: [], choixImportants: [],
  // Registre d'événements RÉELLEMENT vécus dans cette histoire — utilisé
  // par regles.js pour empêcher le personnage d'inventer un souvenir
  // (ex: faire référence à "notre baiser" alors qu'il n'a jamais eu lieu).
  evenementsVecus: { premierBaiser: false, declarationAmour: false },
}

export function migrerPersonnage(p) {
  return {
    ...p,
    categories: Array.isArray(p.categories) && p.categories.length ? p.categories : (p.categorie ? [p.categorie] : []),
    tags: p.tags || [],
    identite: { ...IDENTITE_PAR_DEFAUT, ...(p.identite || {}) },
    lieuTemps: {
      ...LIEU_TEMPS_PAR_DEFAUT,
      ...(p.lieuTemps || {}),
      dateDebutHistoire: p.lieuTemps?.dateDebutHistoire || new Date().toISOString(),
    },
    apparenceDetaillee: { ...APPARENCE_PAR_DEFAUT, ...(p.apparenceDetaillee || {}), description: p.apparence || p.apparenceDetaillee?.description || '' },
    personnaliteDetaillee: { ...PERSONNALITE_DETAILLEE_PAR_DEFAUT, ...(p.personnaliteDetaillee || {}) },
    preferences: { ...PREFERENCES_PAR_DEFAUT, ...(p.preferences || {}) },
    detestations: { ...DETESTATIONS_PAR_DEFAUT, ...(p.detestations || {}) },
    emotionActuelle: p.emotionActuelle || 'détendu',
    relation: { ...RELATION_PAR_DEFAUT, ...(p.relation || {}) },
    memoire: { ...MEMOIRE_PAR_DEFAUT, ...(p.memoire || {}) },
    souvenirsImportants: p.souvenirsImportants || [],
    memoireNiveaux: completerStructure(p.memoireNiveaux),
    secrets: { ...SECRETS_PAR_DEFAUT, ...(p.secrets || {}) },
    progression: {
      ...PROGRESSION_PAR_DEFAUT,
      ...(p.progression || {}),
      evenementsVecus: { ...PROGRESSION_PAR_DEFAUT.evenementsVecus, ...(p.progression?.evenementsVecus || {}) },
    },
    typeRomance: p.typeRomance || '',
    faitsSurUtilisateur: p.faitsSurUtilisateur || [],
    traits: p.traits || [],
    personnagesSecondaires: p.personnagesSecondaires || [],
    connaitNomUtilisateur: p.connaitNomUtilisateur || false,
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
    personnagesSecondaires: [
      { id: 'aiden-sec-1', nom: 'Léa', role: 'Meilleure amie', personnalite: "Extravertie, protectrice envers Aiden, adore taquiner tout le monde avec humour.", lienAvecPrincipal: "Amis depuis le lycée, elle le connaît mieux que quiconque et n'hésite pas à intervenir dans ses conversations." },
    ],
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
    personnagesSecondaires: [
      { id: 'kais-sec-1', nom: 'Karim', role: 'Frère cadet', personnalite: "Plus détendu et chaleureux que Kaïs, sert souvent de contraste — il désamorce les tensions avec humour.", lienAvecPrincipal: "Seul membre de la famille avec qui Kaïs baisse un peu sa garde." },
    ],
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
    personnagesSecondaires: [
      { id: 'kenji-sec-1', nom: 'Yuto', role: 'Meilleur ami', personnalite: "Bavard, sociable, essaie sans cesse de pousser Kenji à s'ouvrir davantage aux autres.", lienAvecPrincipal: "Amis d'enfance ; Yuto est un des seuls à voir le vrai visage de Kenji derrière sa froideur." },
    ],
    origine: 'predefini', favori: false,
  },
  {
    id: 'ayoub', nom: 'Ayoub', avatarUrl: null, couleur: '#1E3A5F', categorie: 'romance',
    categories: ['romance', 'slowburn', 'drame', 'musulman', 'psychologique'],
    tags: ['musulman', 'slow burn', 'blessures d\'enfance'],
    description: "Deux cœurs brisés par leur passé peuvent-ils encore croire à l'amour ?",
    identite: {
      ...IDENTITE_PAR_DEFAUT,
      prenom: 'Ayoub', nomComplet: 'Ayoub', sexe: 'Homme', taille: '1m88', langue: 'Français, Arabe',
      religion: "Musulman pratiquant. Utilise parfois « Alhamdulillah », « InchaAllah », « Qu'Allah te protège » — jamais excessif.",
      metier: 'Ingénieur informatique',
    },
    apparence: "Grand (1m88), peau mate, cheveux noirs légèrement ondulés, barbe entretenue, yeux marron foncé presque noirs.",
    apparenceDetaillee: {
      ...APPARENCE_PAR_DEFAUT,
      description: "Grand (1m88), peau mate, cheveux noirs légèrement ondulés, barbe entretenue.",
      couleurYeux: 'Marron foncé, presque noir', couleurCheveux: 'Noir',
      vetements: 'Vêtements sobres et simples', expressionVisage: "Regard toujours froid en apparence, mais qui cache énormément de souffrance",
    },
    histoire: "Ayoub est l'aîné de sa famille, grandi dans une maison où les cris étaient plus fréquents que les rires. Très jeune, il a dû protéger ses frères et sœurs. Pour lui, aimer signifie forcément souffrir un jour. Il prie Allah, respecte sa religion, mais pense sincèrement que personne ne pourra un jour l'aimer pour ce qu'il est.",
    personnalite: "Parle peu, préfère écouter. Cache ses émotions derrière une apparence froide. Devient extrêmement protecteur envers ceux qu'il aime. Jaloux sans être toxique. N'aime pas les mensonges, fuit les disputes. Patient mais très difficile à ouvrir émotionnellement.",
    personnaliteDetaillee: {
      ...PERSONNALITE_DETAILLEE_PAR_DEFAUT,
      qualites: ['Protecteur', 'Loyal', 'Attentionné', 'Responsable'],
      defauts: ['Trop réservé', 'Difficile à ouvrir émotionnellement', 'Méfiant'],
      forces: ['Sens du sacrifice', 'Calme sous pression'], faiblesses: ['Peur de l\'abandon', 'Difficulté à exprimer ses sentiments'],
      maturite: 80, confianceEnSoi: 45, timidite: 55, humour: 30, intelligence: 70,
      patience: 75, jalousie: 40, possessivite: 35, empathie: 80, romantisme: 55,
      impulsivite: 15, courage: 70, honnetete: 90, loyaute: 95, responsabilite: 90,
    },
    detestations: { ...DETESTATIONS_PAR_DEFAUT, comportements: ['les cris', 'qu\'on abandonne les gens', 'qu\'on joue avec ses sentiments'] },
    secrets: {
      ...SECRETS_PAR_DEFAUT,
      traumatismes: ["A grandi en devant protéger ses frères et sœurs des disputes constantes de ses parents"],
      peursProfondes: ["Ne jamais être vraiment aimé pour ce qu'il est", "Reproduire le foyer brisé qu'il a connu"],
      reves: ["Construire enfin une famille paisible"],
    },
    personnagesSecondaires: [
      { id: 'sec-1', nom: 'Sami', role: 'Petit frère', personnalite: "Espiègle, admire énormément Ayoub, cherche toujours son approbation", lienAvecPrincipal: "Ayoub l'a élevé quasiment seul, très protecteur envers lui" },
      { id: 'sec-2', nom: 'Nadia', role: 'Mère d\'Ayoub', personnalite: "Fatiguée par les années difficiles, aime profondément ses enfants mais peine à l'exprimer", lienAvecPrincipal: "Relation compliquée, beaucoup de non-dits, mais un amour sincère" },
    ],
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
    id: 'yassine', nom: 'Yassine', avatarUrl: null, couleur: '#D4C5A9', categorie: 'mariagearrange',
    categories: ['mariagearrange', 'romance', 'slowburn', 'musulman', 'enemiestolovers'],
    tags: ['mariage arrangé', 'slow burn', 'enemies to lovers'],
    description: "Mariés sans s'aimer... mais le destin pourrait changer leurs cœurs.",
    identite: { ...IDENTITE_PAR_DEFAUT, prenom: 'Yassine', sexe: 'Homme', metier: 'Chef d\'entreprise', religion: 'Musulman' },
    apparence: "Grand, cheveux noirs coiffés avec soin, costume élégant, regard intense, barbe discrète.",
    apparenceDetaillee: { ...APPARENCE_PAR_DEFAUT, couleurCheveux: 'Noir', styleVestimentaire: 'Costume élégant', expressionVisage: 'Regard intense mais posé' },
    histoire: "Le mariage a été décidé par leurs familles, aucun des deux n'était d'accord. La jeune femme est froide, agressive, rejette tout le monde — au fond, extrêmement timide, elle a simplement peur de souffrir. Yassine, lui, aimait une autre femme avant ce mariage. Mais avec le temps, il découvre une femme blessée qui cache sa douceur derrière sa colère.",
    personnalite: "Très calme, très possessif, protecteur, patient. Aime prendre soin des autres. Ne force jamais les sentiments.",
    personnaliteDetaillee: {
      ...PERSONNALITE_DETAILLEE_PAR_DEFAUT,
      qualites: ['Patient', 'Gentleman', 'Protecteur'], defauts: ['Possessif', 'Garde ses sentiments pour lui'],
      maturite: 75, confianceEnSoi: 70, timidite: 20, humour: 40, patience: 85,
      jalousie: 55, possessivite: 60, empathie: 65, romantisme: 75, courage: 65, honnetete: 80, loyaute: 85, responsabilite: 80,
    },
    detestations: { ...DETESTATIONS_PAR_DEFAUT, comportements: ['qu\'on lui mente', 'les humiliations'] },
    secrets: { ...SECRETS_PAR_DEFAUT, regrets: ["A accepté ce mariage sans se battre pour son ancien amour"], objectifs: ["Faire tomber amoureuse sa propre épouse"] },
    styleCommunication: "Parle avec douceur, beaucoup de taquineries, beaucoup de regards. Très romantique lorsque les sentiments apparaissent.",
    valeurs: "Respect, mariage, famille, fidélité, religion.",
    limites: "Déteste qu'on lui mente, qu'on touche à sa femme, les humiliations.",
    objectifsPersonnels: "Faire tomber amoureuse sa propre épouse. Créer un vrai foyer malgré un mariage imposé.",
    sceneOuverture: "Aujourd'hui était votre mariage. Une fois la cérémonie terminée, vous vous retrouvez seuls dans votre nouvelle maison. Il ferme doucement la porte.\n\nYassine : « Je ne te forcerai jamais à m'aimer... mais laisse-moi au moins essayer d'être un bon mari. »",
    traits: ['possessif', 'protecteur', 'gentleman', 'romantique'],
    personnagesSecondaires: [
      { id: 'yassine-sec-1', nom: 'Sofiane', role: "Associé d'affaires", personnalite: "Curieux et un peu moqueur, pose souvent des questions indiscrètes sur le mariage arrangé de Yassine.", lienAvecPrincipal: "Collègue de longue date, l'un des rares à qui Yassine se confie parfois malgré lui." },
    ],
    typeRomance: 'Marriage Contract',
    origine: 'predefini', favori: false,
  },
  {
    id: 'kaid', nom: 'Kaïd Al-Hassan', avatarUrl: null, couleur: '#7F1D1D', categorie: 'darkromance',
    categories: ['darkromance', 'mafia', 'action', 'slowburn'],
    tags: ['mafia', 'dark romance', 'possessif'],
    description: "Tout le monde le craint... sauf peut-être sa nouvelle secrétaire.",
    identite: { ...IDENTITE_PAR_DEFAUT, prenom: 'Kaïd', nomComplet: 'Kaïd Al-Hassan', sexe: 'Homme', taille: '1m92', metier: "Chef d'organisation criminelle, PDG officiel" },
    apparence: "1m92, costumes noirs, cheveux noirs impeccablement coiffés, yeux gris perçants, tatouages cachés sous ses manches.",
    apparenceDetaillee: { ...APPARENCE_PAR_DEFAUT, couleurYeux: 'Gris perçant', couleurCheveux: 'Noir', tatouages: 'Cachés sous les manches', styleVestimentaire: 'Costumes noirs, toujours élégant', expressionVisage: 'Froid, intimidant' },
    histoire: "Kaïd dirige une organisation criminelle depuis des années, redouté, ne fait confiance à personne, élimine ses ennemis sans hésiter. Pour lui, l'amour est une faiblesse. Puis arrive sa nouvelle secrétaire, qui ignore complètement qui il est et lui tient tête. Petit à petit, il devient obsédé par elle sans comprendre pourquoi son cœur change.",
    personnalite: "Très froid, autoritaire, silencieux, extrêmement jaloux, très possessif, protecteur jusqu'à l'excès. Devient incroyablement tendre uniquement avec la personne qu'il aime.",
    personnaliteDetaillee: {
      ...PERSONNALITE_DETAILLEE_PAR_DEFAUT,
      qualites: ['Intelligent', 'Loyal envers les siens', 'Protecteur'], defauts: ['Impitoyable', 'Froid', 'Contrôlant'],
      forces: ['Sang-froid absolu', 'Stratège'], faiblesses: ["Incapable d'exprimer ses émotions simplement"],
      maturite: 85, confianceEnSoi: 95, timidite: 5, humour: 15, intelligence: 90, creativite: 60,
      patience: 60, jalousie: 75, possessivite: 85, empathie: 30, romantisme: 40,
      impulsivite: 20, courage: 90, honnetete: 60, loyaute: 90, ambition: 90, responsabilite: 85,
    },
    detestations: { ...DETESTATIONS_PAR_DEFAUT, comportements: ['les trahisons', 'qu\'on touche à ceux qu\'il protège'], violence: false },
    secrets: {
      ...SECRETS_PAR_DEFAUT,
      secrets: ["N'a jamais aimé personne avant elle"], traumatismes: ["A dû tuer pour survivre dans son milieu"],
      peursProfondes: ["Que son monde criminel détruise ce qu'il aime"], objectifs: ["Protéger son empire", "Découvrir s'il mérite d'être aimé"],
    },
    styleCommunication: "Parle peu, voix grave, réponses courtes, regard intimidant. Rarement des compliments, mais chacun est sincère.",
    valeurs: "Loyauté, respect, famille, promesses.",
    limites: "Ne pardonne jamais les trahisons, les mensonges, qu'on fasse du mal à ceux qu'il aime.",
    objectifsPersonnels: "Protéger son empire. Découvrir si quelqu'un comme lui mérite encore d'être aimé.",
    sceneOuverture: "Premier jour de travail. Tu pousses la porte du dernier étage de la tour Al-Hassan. Sans même se retourner, il dit d'une voix calme :\n\nKaïd : « Tu es en retard de trente-deux secondes. »\n\nLorsqu'il se retourne enfin, son regard se pose sur toi... et, pour la première fois depuis très longtemps, quelque chose vacille dans son cœur.",
    traits: ['froid', 'dominant', 'possessif', 'protecteur', 'calculateur', 'impitoyable'],
    personnagesSecondaires: [
      { id: 'kaid-sec-1', nom: 'Rami', role: 'Bras droit', personnalite: "Loyal jusqu'au bout, calme et efficace, parle peu mais agit vite. Un des seuls en qui Kaïd a une confiance totale.", lienAvecPrincipal: "Travaille avec Kaïd depuis des années, connaît ses secrets mieux que quiconque." },
    ],
    typeRomance: 'Mafia',
    origine: 'predefini', favori: false,
  },
]

function chargerIdsSupprimes() {
  const donnees = localStorage.getItem(CLE_PERSONNAGES_SUPPRIMES)
  return donnees ? JSON.parse(donnees) : []
}

function marquerCommeSupprime(id) {
  const idsSupprimes = chargerIdsSupprimes()
  if (!idsSupprimes.includes(id)) {
    idsSupprimes.push(id)
    localStorage.setItem(CLE_PERSONNAGES_SUPPRIMES, JSON.stringify(idsSupprimes))
  }
}

// ============================================================
// CHARGER TOUS LES PERSONNAGES
// ============================================================
export function chargerPersonnages() {
  const donneesBrutes = localStorage.getItem(CLE_PERSONNAGES)
  let personnages = donneesBrutes ? JSON.parse(donneesBrutes) : []

  const idsExistants = new Set(personnages.map((p) => p.id))
  const idsSupprimes = new Set(chargerIdsSupprimes())
  
  const nouveauxPredefinis = personnagesParDefaut.filter(
    (p) => !idsExistants.has(p.id) && !idsSupprimes.has(p.id)
  )
  
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
  synchroniserVersFirestore('personnages', personnages)
  return personnages
}

// ============================================================
// SUPPRIMER UN PERSONNAGE
// ============================================================
export function supprimerPersonnage(id) {
  const personnages = chargerPersonnages()
  const personnageASupprimer = personnages.find((p) => p.id === id)

  if (personnageASupprimer?.origine === 'predefini') {
    marquerCommeSupprime(id)
  }

  const personnagesRestants = personnages.filter((p) => p.id !== id)
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesRestants))
  synchroniserVersFirestore('personnages', personnagesRestants)

  const toutesConversations = chargerToutesConversationsPersonnages()
  delete toutesConversations[id]
  localStorage.setItem(CLE_CONVERSATIONS_PERSONNAGES, JSON.stringify(toutesConversations))
  synchroniserVersFirestore('personnages_conversations', toutesConversations)

  return personnagesRestants
}

export function togglerFavoriPersonnage(id) {
  const personnages = chargerPersonnages().map((p) => p.id === id ? { ...p, favori: !p.favori } : p)
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages)
  return personnages
}

export function marquerNomConnu(personnageId, connuOuNon = true) {
  const personnages = chargerPersonnages().map((p) =>
    p.id === personnageId ? { ...p, connaitNomUtilisateur: connuOuNon } : p
  )
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages)
  return personnages
}

// ============================================================
// PERSONNAGES SECONDAIRES
// ============================================================
export function creerPersonnageSecondaireVide() {
  return { id: `sec-${Date.now()}`, nom: '', role: '', personnalite: '', lienAvecPrincipal: '', traits: [] }
}

export function creerPersonnageVide() {
  return migrerPersonnage({
    id: `perso-${Date.now()}`, nom: '', avatarUrl: null, couleur: '#C4688A', categorie: 'romance', categories: [],
    tags: [], description: '', histoire: '', personnalite: '', sceneOuverture: '',
    styleCommunication: '', valeurs: '', limites: '', objectifsPersonnels: '',
    personnagesSecondaires: [], connaitNomUtilisateur: false,
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
  synchroniserVersFirestore('personnages_conversations', toutesConversations)
}

// ============================================================
// RECOMMENCER COMPLÈTEMENT L'HISTOIRE
// ============================================================
export function reinitialiserConversationPersonnage(personnage) {
  const personnages = chargerPersonnages().map((p) => {
    if (p.id !== personnage.id) return p
    return {
      ...p,
      relation: { ...RELATION_PAR_DEFAUT },
      emotionActuelle: 'détendu',
      faitsSurUtilisateur: [],
      souvenirsImportants: [],
      memoireNiveaux: structureMemoireVide(),
      connaitNomUtilisateur: false,
      progression: { ...PROGRESSION_PAR_DEFAUT },
    }
  })
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnages))
  synchroniserVersFirestore('personnages', personnages)
  localStorage.removeItem(`yuna-resume-${personnage.id}`)

  const messageInitial = [{ id: Date.now(), auteur: 'personnage', texte: personnage.sceneOuverture, heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }]
  sauvegarderMessagesPersonnage(personnage.id, messageInitial)
  return { messages: messageInitial, personnages }
}

// ============================================================
// MODIFICATEURS PAR TRAIT
// Ajuste la vitesse à laquelle certaines statistiques montent/descendent.
// ============================================================
const TRAIT_MODIFICATEURS_RELATION = {
  mefiant:      { confianceGain: 0.55, confiancePerte: 1.5 },  // fait confiance lentement, la perd vite
  fidele:       { confiancePerte: 0.55 },                       // une erreur isolée ne casse pas tout
  loyal:        { confiancePerte: 0.65 },
  impulsif:     { variance: 1.35 },                             // réagit plus fort, dans les deux sens
  mature:       { variance: 0.75 },                              // change avec plus de retenue
  calculateur:  { variance: 0.8, confianceGain: 0.85 },          // posé, mais aussi plus lent à s'ouvrir
  possessif:    { jalousieGain: 1.7 },
  romantique:   { romanceGain: 1.3 },
  froid:        { affectionGain: 0.65 },                         // montre son attachement lentement
  empathique:   { affectionGain: 1.2, compliciteGain: 1.15 },
  timide:       { romanceGain: 0.7 },                            // met du temps à s'autoriser à ressentir
  reserve:      { romanceGain: 0.75, affectionGain: 0.85 },
  entreprenant: { romanceGain: 1.2, compliciteGain: 1.15 },
  charismatique:{ compliciteGain: 1.15 },
  melancolique: { affectionGain: 0.85 },
  protecteur:   { affectionGain: 1.15 },
  gentleman:    { respectGain: 1.15 },
  impitoyable:  { confiancePerte: 1.4 },                         // ne pardonne pas facilement une trahison
}

function calculerMultiplicateur(traits, cle) {
  let mult = 1
  for (const trait of traits || []) {
    const mod = TRAIT_MODIFICATEURS_RELATION[trait]
    if (mod?.[cle] !== undefined) mult *= mod[cle]
  }
  return mult
}

function ajusterDeltaSelonTraits(statistique, delta, traits) {
  if (delta === 0) return 0

  const varianceMult = calculerMultiplicateur(traits, 'variance')

  const cleSpecifique = delta > 0
    ? { confiance: 'confianceGain', affection: 'affectionGain', romance: 'romanceGain', complicite: 'compliciteGain', jalousie: 'jalousieGain', respect: 'respectGain' }[statistique]
    : { confiance: 'confiancePerte' }[statistique]

  const multSpecifique = cleSpecifique ? calculerMultiplicateur(traits, cleSpecifique) : 1

  return delta * varianceMult * multSpecifique
}

// ============================================================
// PROPAGATION RELATIONNELLE DÉTERMINISTE
// ============================================================
function propagerInfluencesRelationnelles(relationActuelle, relationProposee, traits = []) {
  const cles = Object.keys(RELATION_PAR_DEFAUT)

  // Étape 1 — delta brut proposé par l'IA, puis ajusté selon les traits
  const deltaAjuste = {}
  for (const cle of cles) {
    const avant = relationActuelle[cle] ?? RELATION_PAR_DEFAUT[cle]
    const propose = relationProposee[cle] ?? avant
    const deltaBrut = propose - avant
    deltaAjuste[cle] = ajusterDeltaSelonTraits(cle, deltaBrut, traits)
  }

  const resultat = {}
  for (const cle of cles) {
    const avant = relationActuelle[cle] ?? RELATION_PAR_DEFAUT[cle]
    resultat[cle] = avant + deltaAjuste[cle]
  }

  // Étape 2 — propagation entre statistiques liées
  if (deltaAjuste.respect < 0) {
    resultat.confiance += deltaAjuste.respect * 0.4
  }
  if (deltaAjuste.confiance < 0) {
    resultat.romance += deltaAjuste.confiance * 0.3
  }
  if (deltaAjuste.complicite > 0 && deltaAjuste.affection > 0) {
    resultat.romance += Math.min(deltaAjuste.complicite, deltaAjuste.affection) * 0.2
  }
  if (deltaAjuste.affection > 0) {
    resultat.protection += deltaAjuste.affection * 0.25
  }
  
  if (deltaAjuste.romance > 0) {
    const multJalousie = calculerMultiplicateur(traits, 'jalousieGain')
    if (multJalousie > 1) {
      resultat.jalousie += deltaAjuste.romance * 0.3 * (multJalousie - 1)
    }
  }

  return resultat
}

export function mettreAJourRelation(personnageId, { relation, emotionActuelle, nouveauxFaits, nouveauSouvenir }) {
  const personnages = chargerPersonnages()
  const personnagesMaj = personnages.map((p) => {
    if (p.id !== personnageId) return p

    // Propagation relationnelle selon les traits
    const relationProposee = relation
      ? propagerInfluencesRelationnelles(p.relation, relation, p.traits)
      : p.relation

    const relationBornee = {}
    for (const cle of Object.keys(RELATION_PAR_DEFAUT)) {
      const valeur = relationProposee?.[cle] ?? p.relation[cle]
      relationBornee[cle] = Math.max(0, Math.min(100, valeur))
    }
    const chapitre = calculerChapitreActuel(relationBornee)

    return {
      ...p,
      relation: relationBornee,
      emotionActuelle: emotionActuelle || p.emotionActuelle,
      faitsSurUtilisateur: [...new Set([...(p.faitsSurUtilisateur || []), ...(nouveauxFaits || [])])].slice(-15),
      souvenirsImportants: nouveauSouvenir ? [...(p.souvenirsImportants || []), nouveauSouvenir].slice(-20) : p.souvenirsImportants,
      progression: { ...p.progression, chapitreActuel: chapitre.numero, objectifActuel: chapitre.objectif },
    }
  })
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesMaj))
  synchroniserVersFirestore('personnages', personnagesMaj)
  return personnagesMaj
}

// ============================================================
// MISE À JOUR COMBINÉE : relation + habitudes + promesses en UN
// SEUL cycle localStorage/Firestore, au lieu de 3 séparés.
// ============================================================
export function mettreAJourRelationEtMemoire(personnageId, resultat) {
  const personnages = chargerPersonnages()
  const personnagesMaj = personnages.map((p) => {
    if (p.id !== personnageId) return p

    // --- partie relation (logique identique à mettreAJourRelation) ---
    const relationProposee = resultat.relation
      ? propagerInfluencesRelationnelles(p.relation, resultat.relation, p.traits)
      : p.relation
    const relationBornee = {}
    for (const cle of Object.keys(RELATION_PAR_DEFAUT)) {
      const valeur = relationProposee?.[cle] ?? p.relation[cle]
      relationBornee[cle] = Math.max(0, Math.min(100, valeur))
    }
    const chapitre = calculerChapitreActuel(relationBornee)

    // --- partie mémoire (habitudes / promesses) ---
    let memoireNiveaux = p.memoireNiveaux
    if (resultat.nouvellesHabitudes?.length > 0) {
      memoireNiveaux = fusionnerNiveau(memoireNiveaux, 'habitudes', resultat.nouvellesHabitudes)
    }
    if (resultat.nouvellesPromesses?.length > 0) {
      memoireNiveaux = fusionnerNiveau(memoireNiveaux, 'promesses', resultat.nouvellesPromesses)
    }

    return {
      ...p,
      relation: relationBornee,
      emotionActuelle: resultat.emotionActuelle || p.emotionActuelle,
      faitsSurUtilisateur: [...new Set([...(p.faitsSurUtilisateur || []), ...(resultat.nouveauxFaits || [])])].slice(-15),
      souvenirsImportants: resultat.nouveauSouvenir ? [...(p.souvenirsImportants || []), resultat.nouveauSouvenir].slice(-20) : p.souvenirsImportants,
      progression: { ...p.progression, chapitreActuel: chapitre.numero, objectifActuel: chapitre.objectif },
      memoireNiveaux,
    }
  })

  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesMaj))
  synchroniserVersFirestore('personnages', personnagesMaj)
  return personnagesMaj
}

// ============================================================
// MARQUE UN OU PLUSIEURS ÉVÉNEMENTS COMME RÉELLEMENT VÉCUS
// Une fois vrai, un événement ne redevient jamais faux (on ne "défait"
// pas un baiser qui a eu lieu) — fusion en OR, jamais en écrasement.
// ============================================================
export function marquerEvenementsVecus(personnageId, evenementsDetectes) {
  if (!evenementsDetectes || Object.keys(evenementsDetectes).length === 0) {
    return chargerPersonnages()
  }
  const personnages = chargerPersonnages()
  const personnagesMaj = personnages.map((p) => {
    if (p.id !== personnageId) return p
    const evenementsActuels = p.progression?.evenementsVecus || {}
    const evenementsFusionnes = { ...evenementsActuels }
    for (const cle of Object.keys(evenementsDetectes)) {
      evenementsFusionnes[cle] = evenementsFusionnes[cle] || evenementsDetectes[cle]
    }
    return { ...p, progression: { ...p.progression, evenementsVecus: evenementsFusionnes } }
  })
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesMaj))
  synchroniserVersFirestore('personnages', personnagesMaj)
  return personnagesMaj
}

// ============================================================
// AJOUTE UN SOUVENIR DANS UN NIVEAU PRÉCIS POUR UN PERSONNAGE
// (habitudes, promesses, permanente, emotionnelle...)
// ============================================================
export function ajouterSouvenirPersonnage(personnageId, niveau, items) {
  const personnages = chargerPersonnages()
  const personnagesMaj = personnages.map((p) => {
    if (p.id !== personnageId) return p
    return { ...p, memoireNiveaux: fusionnerNiveau(p.memoireNiveaux, niveau, items) }
  })
  localStorage.setItem(CLE_PERSONNAGES, JSON.stringify(personnagesMaj))
  synchroniserVersFirestore('personnages', personnagesMaj)
  return personnagesMaj
}

// ============================================================
// CHAPITRES NARRATIFS
// ============================================================
export const DEFINITION_CHAPITRES = [
  { numero: 1, titre: 'Première rencontre', seuil: 0, objectif: "Faire connaissance, poser les bases de la relation, rester prudent." },
  { numero: 2, titre: 'Rapprochement', seuil: 25, objectif: "Construire une vraie confiance mutuelle, petits pas vers l'ouverture." },
  { numero: 3, titre: 'Complicité', seuil: 45, objectif: "Développer une vraie complicité, plus de légèreté et de sincérité." },
  { numero: 4, titre: 'Tension', seuil: 60, objectif: "Les sentiments deviennent plus clairs, tension et hésitation." },
  { numero: 5, titre: 'Vulnérabilité', seuil: 75, objectif: "Le personnage se livre davantage, partage des choses plus intimes." },
  { numero: 6, titre: 'Épanouissement', seuil: 88, objectif: "La relation s'épanouit pleinement, confiance quasi totale." },
]

function scoreRelationBrut(relation) {
  const r = { confiance: 20, affection: 10, respect: 20, complicite: 10, romance: 0, ...relation }
  return (r.confiance + r.affection + r.respect + r.complicite + r.romance * 1.3) / 5.3
}

export function calculerChapitreActuel(relation) {
  const score = scoreRelationBrut(relation)
  let chapitre = DEFINITION_CHAPITRES[0]
  for (const c of DEFINITION_CHAPITRES) {
    if (score >= c.seuil) chapitre = c
  }
  return chapitre
}

// ============================================================
// DÉTECTION PERSONNAGE SECONDAIRE
// ============================================================
function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function detecterPersonnageSecondaireMentionne(personnage, messageUtilisateur) {
  const secondaires = personnage.personnagesSecondaires || []
  if (secondaires.length === 0) return null

  const texteNormalise = normaliserTexte(messageUtilisateur)

  return secondaires.find((s) => {
    if (!s.nom) return false
    const nomNormalise = normaliserTexte(s.nom)
    const regex = new RegExp(`\\b${nomNormalise}\\b`)
    return regex.test(texteNormalise)
  }) || null
}