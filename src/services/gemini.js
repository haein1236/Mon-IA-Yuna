import { GoogleGenerativeAI } from '@google/generative-ai'
import { chargerParametres } from './parametres'
import { chargerFaits, ajouterFaits } from './memoire'

const cleAPI = import.meta.env.VITE_GEMINI_API_KEY
const client = new GoogleGenerativeAI(cleAPI)

// Récupère le profil sauvegardé pour le donner à Yuna
function recupererProfilPourYuna() {
  const profilSauvegarde = localStorage.getItem('yuna-profil-saki')
  if (!profilSauvegarde) return null
  return JSON.parse(profilSauvegarde)
}

// ============================================================
// DESCRIPTIONS DE PERSONNALITÉ
// Une phrase de "consigne de ton" par personnalité choisie dans
// Paramètres.
// ============================================================
const DESCRIPTIONS_PERSONNALITE = {
  caline: "Tu es douce, attentionnée, pleine d'affection. Tu emploies des petits mots tendres (sans exagérer), tu prends soin de la personne, tu la rassures souvent.",
  taquine: "Tu es espiègle et taquine, tu charries gentiment la personne, tu fais de l'humour, tu n'hésites pas à la chambrer avec bienveillance.",
  motivante: "Tu es encourageante et énergique, tu pousses la personne à avancer, tu célèbres ses petites victoires, tu restes positive même face aux difficultés.",
  calme: "Tu es posée et apaisante, tu prends le temps d'écouter, tu poses des questions douces, ton rythme est lent et réfléchi.",
}

// ============================================================
// EXEMPLES CONCRETS PAR PERSONNALITÉ (few-shot prompting)
// Un modèle de langage IMITE un exemple bien mieux qu'il n'interprète
// un adjectif abstrait ("sois câline"). On lui montre 2 échanges type
// par personnalité — il en retient le STYLE, jamais recopié mot pour mot.
// ============================================================
const EXEMPLES_PERSONNALITE = {
  caline: [
    { user: "Je suis crevée aujourd'hui...", yuna: "Oh non 🥺 viens là, raconte-moi ce qui t'a épuisée, je t'écoute" },
    { user: "J'ai raté mon exam", yuna: "Aww je suis désolée mon cœur... ça ne définit pas ta valeur, tu sais ? On en reparle si tu veux 💛" },
  ],
  taquine: [
    { user: "Je suis crevée aujourd'hui...", yuna: "Ahah encore une nuit à scroller au lieu de dormir hein ? Avoue 😏" },
    { user: "J'ai raté mon exam", yuna: "Bon bah welcome au club 😂 Nan sérieux ça va aller, c'est pas la fin du monde !" },
  ],
  motivante: [
    { user: "Je suis crevée aujourd'hui...", yuna: "Je comprends, mais tu tiens le coup et c'est déjà énorme 💪 Qu'est-ce qui te ferait du bien là maintenant ?" },
    { user: "J'ai raté mon exam", yuna: "Un échec c'est juste une étape vers la réussite ! Qu'est-ce que t'en retiens pour la prochaine fois ?" },
  ],
  calme: [
    { user: "Je suis crevée aujourd'hui...", yuna: "Je t'entends. Prends ton temps, on peut juste papoter tranquillement si ça t'aide" },
    { user: "J'ai raté mon exam", yuna: "C'est une déception, c'est normal de le ressentir. Tu veux en parler, ou juste penser à autre chose un moment ?" },
  ],
}

// Formate les exemples de la personnalité choisie en texte lisible pour le prompt
function formaterExemples(personnalite) {
  const exemples = EXEMPLES_PERSONNALITE[personnalite] || EXEMPLES_PERSONNALITE.caline
  return exemples.map((ex) => `Personne : "${ex.user}"\nYuna : "${ex.yuna}"`).join('\n\n')
}

// ============================================================
// CONSTRUIT LE SYSTEM PROMPT COMPLET
// Rassemble : profil, paramètres (surnom, personnalité), exemples de
// ton, ET la mémoire à long terme (faits retenus des conversations
// précédentes). Appelé à chaque message pour être toujours à jour.
// ============================================================
function construirePersonnalite() {
  const profil = recupererProfilPourYuna()
  const parametres = chargerParametres()
  const faitsMemorises = chargerFaits()

  const infosUtilisateur = profil ? `
INFORMATIONS SUR LA PERSONNE À QUI TU PARLES :
- Prénom : ${profil.prenom}
- Âge : ${profil.age} ans
- Ville : ${profil.ville || 'non renseignée'}
- Centres d'intérêt : ${profil.interets.join(', ')}
Utilise son prénom naturellement dans la conversation, et réfère-toi à ses
centres d'intérêt quand c'est pertinent, sans le forcer artificiellement.
` : ''

  const surnom = parametres.surnom || profil?.prenom || 'toi'
  const descriptionTon = DESCRIPTIONS_PERSONNALITE[parametres.personnalite] || DESCRIPTIONS_PERSONNALITE.caline
  const exemplesTon = formaterExemples(parametres.personnalite)

  // Ce bloc n'apparaît que s'il existe déjà des souvenirs enregistrés
  const blocMemoire = faitsMemorises.length > 0 ? `
CE QUE TU SAIS DÉJÀ SUR ${surnom.toUpperCase()} (souvenirs de vos conversations passées) :
${faitsMemorises.map((f) => `- ${f}`).join('\n')}
Utilise ces souvenirs naturellement quand c'est pertinent, comme une amie qui
se souvient vraiment de toi — sans jamais les réciter comme une liste.
` : ''

  return `
Tu t'appelles Yuna. Tu es une IA amicale et détendue, tu parles exactement
comme une vraie pote. Tu appelles la personne "${surnom}".

TON CARACTÈRE : ${descriptionTon}

Voici des exemples de la façon dont tu dois réagir, pour bien capter ton
style (ne recopie jamais ces phrases mot pour mot dans une vraie
conversation, imite juste le ton et l'esprit) :

${exemplesTon}

${infosUtilisateur}
${blocMemoire}

Règles importantes :
- Tu tutoies toujours
- Tu réponds en français uniquement
- Réponses courtes et spontanées (2-4 phrases max)
- Emojis avec modération
- Tu es curieuse et poses des questions en retour

IMAGES : Quand on te demande une image, réponds avec :
[IMAGE: description en anglais]
`
}

export async function envoyerMessageAYuna(historique, nouveauMessage) {
  try {
    const modele = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: construirePersonnalite(),
    })

    const historiqueFormate = historique.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'model',
      parts: [{ text: msg.texte }],
    }))

    const sessionChat = modele.startChat({ history: historiqueFormate })
    const resultat = await sessionChat.sendMessage(nouveauMessage)
    return resultat.response.text()

  } catch (erreur) {
    console.error('Erreur Gemini :', erreur)
    return "Oups, petit bug ! 😅 Réessaie ?"
  }
}

// ============================================================
// EXTRAIT LES FAITS MARQUANTS D'UNE CONVERSATION
// Appelée quand une conversation se termine (bouton "Nouvelle").
// Demande à Gemini de résumer, en quelques phrases courtes, ce
// qu'on a appris sur la personne — pour nourrir la mémoire à long
// terme utilisée par construirePersonnalite(). Ne bloque jamais
// l'utilisateur : en cas d'erreur, on log simplement et on continue.
// ============================================================
export async function extraireEtMemoriserFaits(historique) {
  // Pas assez de messages pour qu'il y ait quelque chose à apprendre
  if (!historique || historique.length < 3) return

  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const conversationTexte = historique
      .map((msg) => `${msg.auteur === 'user' ? 'Personne' : 'Yuna'} : ${msg.texte}`)
      .join('\n')

    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :

${conversationTexte}

Extrais 0 à 3 faits marquants et durables sur cette personne (goûts, situation
de vie, événements importants, préoccupations récurrentes). Ignore les détails
anodins ou temporaires (comme "il fait beau"). Réponds UNIQUEMENT avec un
tableau JSON de strings courtes, sans aucun texte autour. Exemple de format :
["prépare un examen d'informatique", "aime le café le matin"]
Si rien de marquant ne ressort, réponds : []`

    const resultat = await modele.generateContent(instruction)
    const texteReponse = resultat.response.text().trim()

    // Nettoyage au cas où le modèle entoure sa réponse de ```json ... ```
    const texteNettoye = texteReponse.replace(/```json|```/g, '').trim()
    const faitsExtraits = JSON.parse(texteNettoye)

    if (Array.isArray(faitsExtraits) && faitsExtraits.length > 0) {
      ajouterFaits(faitsExtraits)
    }
  } catch (erreur) {
    console.error('Erreur extraction mémoire :', erreur)
  }
}

// ============================================================
// VÉRIFIE SI YUNA DOIT PARLER EN PREMIER (message "spontané")
// ============================================================
export async function verifierMessageSpontane(dateDernierMessage) {
  const parametres = chargerParametres()

  if (!parametres.messagesActifs) return null

  const maintenant = new Date()
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes()
  const [hDebut, mDebut] = parametres.heureDebut.split(':').map(Number)
  const [hFin, mFin]     = parametres.heureFin.split(':').map(Number)
  const minutesDebut = hDebut * 60 + mDebut
  const minutesFin   = hFin * 60 + mFin

  if (heureActuelle < minutesDebut || heureActuelle > minutesFin) return null

  const delaisMinimum = {
    quotidien: 24 * 60 * 60 * 1000,
    deuxFoisParJour: 12 * 60 * 60 * 1000,
    hebdomadaire: 7 * 24 * 60 * 60 * 1000,
  }
  const delaiRequis = delaisMinimum[parametres.frequence] || delaisMinimum.quotidien

  const dernierMessage = dateDernierMessage ? new Date(dateDernierMessage) : null
  const tempsEcoule = dernierMessage ? maintenant - dernierMessage : Infinity

  if (tempsEcoule < delaiRequis) return null

  let contexteSpecial = ''
  if (parametres.dateAnniversaire) {
    const [, moisAnniv, jourAnniv] = parametres.dateAnniversaire.split('-')
    const jourActuel = String(maintenant.getDate()).padStart(2, '0')
    const moisActuel = String(maintenant.getMonth() + 1).padStart(2, '0')
    if (jourAnniv === jourActuel && moisAnniv === moisActuel) {
      contexteSpecial = "[C'est l'anniversaire de la personne aujourd'hui ! Souhaite-lui un très joyeux anniversaire de façon chaleureuse et personnalisée avant toute autre chose.]"
    }
  }

  try {
    const modele = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: construirePersonnalite(),
    })

    const instruction = contexteSpecial
      || "[Tu prends de ses nouvelles de façon naturelle et spontanée, comme une amie qui pense à elle sans raison particulière. Pose une question ouverte ou partage une pensée du jour.]"

    const resultat = await modele.generateContent(instruction)
    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur message spontané :', erreur)
    return null
  }
}