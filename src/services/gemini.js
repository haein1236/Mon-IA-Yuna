
import { GoogleGenerativeAI } from '@google/generative-ai'
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { chargerParametres } from './parametres'
import { chargerFaits, ajouterFaits } from './memoire'

const cleAPI = import.meta.env.VITE_GEMINI_API_KEY
const client = new GoogleGenerativeAI(cleAPI)

function recupererProfilPourYuna() {
  const profilSauvegarde = localStorage.getItem('yuna-profil-saki')
  if (!profilSauvegarde) return null
  return JSON.parse(profilSauvegarde)
}

// ============================================================
// CORRIGÉ : PERSONNALITÉS MULTIPLES
// AVANT : parametres.personnalite était une seule chaîne.
// APRÈS : parametres.personnalites est un TABLEAU. On combine les
// descriptions de toutes les personnalités choisies en un seul bloc
// de caractère, et on garde les exemples de la PREMIÈRE personnalité
// choisie comme référence de style principale (montrer trop
// d'exemples contradictoires perdrait le modèle).
// Rétrocompatible : si l'ancien champ singulier existe encore
// (anciens réglages sauvegardés), on l'utilise comme repli.
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

  const personnalitesChoisies = (parametres.personnalites?.length > 0)
    ? parametres.personnalites
    : [parametres.personnalite || 'caline']

  const descriptionsCombinees = personnalitesChoisies
    .map((id) => DESCRIPTIONS_PERSONNALITE[id])
    .filter(Boolean)
    .join(' ')

  const exemplesTon = formaterExemples(personnalitesChoisies[0])

  const blocMemoire = faitsMemorises.length > 0 ? `
CE QUE TU SAIS DÉJÀ SUR ${surnom.toUpperCase()} (souvenirs de vos conversations passées) :
${faitsMemorises.map((f) => `- ${f}`).join('\n')}
Utilise ces souvenirs naturellement quand c'est pertinent, comme une amie qui
se souvient vraiment de toi — sans jamais les réciter comme une liste.
` : ''

  return `
Tu t'appelles Yuna. Tu es une IA amicale et détendue, tu parles exactement
comme une vraie pote. Tu appelles la personne "${surnom}".

TON CARACTÈRE (combinaison de plusieurs traits que tu incarnes ensemble) :
${descriptionsCombinees}

Exemple de ton (inspire-toi du style, ne recopie jamais mot pour mot) :
${exemplesTon}

${infosUtilisateur}
${blocMemoire}

Règles importantes :
- Tu tutoies toujours
- Tu réponds en français uniquement
- Réponses courtes et spontanées (2-4 phrases max)
- Emojis avec modération (sauf si ta personnalité en demande plus)
- Tu es curieuse et poses des questions en retour
- Ta relation avec la personne reste amicale et bienveillante, jamais romantique ou à caractère sexuel

IMAGES : Quand on te demande une image, réponds avec :
[IMAGE: description en anglais]
`
}

// ============================================================
// SECOURS GROQ (En cas de censure ou de quota dépassé)
// Envoie l'historique de jeu de rôle vers l'API de secours
// qui délègue à Llama 3.
// ============================================================
async function envoyerViaGroqSecours(systemPrompt, historique, nouveauMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...historique.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'assistant',
      content: msg.texte,
    })),
    { role: 'user', content: nouveauMessage },
  ]

  const reponse = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!reponse.ok) throw new Error(`Erreur serveur Groq (${reponse.status})`)
  const donnees = await reponse.json()
  return donnees.reply
}

function estErreurQuota(erreur) {
  const msg = erreur?.message || ''
  return msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')
}

export async function envoyerMessageAYuna(historique, nouveauMessage) {
  try {
    const modele = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: construirePersonnalite(),
    })

    const historiqueFormate = historique.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'model',
      parts: [{ text: msg.texte === '[NOTE_VOCALE]' ? '[note vocale envoyée]' : msg.texte }],
    }))

    const sessionChat = modele.startChat({ history: historiqueFormate })
    const resultat = await sessionChat.sendMessage(nouveauMessage)
    return resultat.response.text()

  } catch (erreur) {
    console.error('Erreur Gemini détaillée :', erreur)

    if (estErreurQuota(erreur)) {
      try {
        return await envoyerViaGroqSecours(construirePersonnalite(), historique, nouveauMessage)
      } catch (erreurGroq) {
        console.error('Erreur secours Groq :', erreurGroq)
        return "⏳ Limite de requêtes gratuites atteinte, et le secours n'a pas répondu non plus. Réessaie dans une minute."
      }
    }

    const messageErreur = erreur?.message || ''
    if (messageErreur.includes('API_KEY_INVALID') || messageErreur.includes('API key not valid')) {
      return "🔑 Ta clé API semble invalide ou absente. Vérifie VITE_GEMINI_API_KEY dans tes variables d'environnement (et redéploie si tu es sur Vercel)."
    }
    if (messageErreur.includes('PERMISSION_DENIED') || messageErreur.includes('referer')) {
      return "🚫 Ta clé API est restreinte à un autre domaine. Va dans Google AI Studio et autorise ce domaine."
    }

    return "Oups, petit bug ! 😅 Réessaie ? (détail dans la console : F12)"
  }
}

export async function envoyerNoteVocaleAYuna(historique, audioBase64) {
  try {
    const modele = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: construirePersonnalite(),
    })

    const historiqueFormate = historique.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'model',
      parts: [{ text: msg.texte === '[NOTE_VOCALE]' ? '[note vocale envoyée]' : msg.texte }],
    }))

    const sessionChat = modele.startChat({ history: historiqueFormate })

    const [entete, donneesPures] = audioBase64.split(',')
    const mimeType = entete.match(/data:(.*);base64/)?.[1] || 'audio/webm'

    const resultat = await sessionChat.sendMessage([
      { inlineData: { mimeType, data: donneesPures } },
      { text: "[L'utilisateur t'a envoyé cette note vocale. Écoute-la et réponds naturellement à ce qu'elle dit, comme une vraie amie qui vient d'entendre un message vocal.]" },
    ])

    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur note vocale Gemini :', erreur)
    return "Oups, je n'ai pas réussi à écouter ton vocal 😅 Tu peux réessayer ou me l'écrire ?"
  }
}

export async function extraireEtMemoriserFaits(historique) {
  if (!historique || historique.length < 3) return

  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const conversationTexte = historique
      .map((msg) => `${msg.auteur === 'user' ? 'Personne' : 'Yuna'} : ${msg.texte === '[NOTE_VOCALE]' ? '[note vocale]' : msg.texte}`)
      .join('\n')

    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :

${conversationTexte}

Extrais 0 à 3 faits marquants et durables sur cette personne (goûts, situation
de vie, événements importants, préoccupations récurrentes). Ignore les détails
anodins ou temporaires. Réponds UNIQUEMENT avec un tableau JSON de strings
courtes, sans aucun texte autour. Exemple : ["prépare un examen d'informatique"]
Si rien de marquant ne ressort, réponds : []`

    const resultat = await modele.generateContent(instruction)
    const texteReponse = resultat.response.text().trim()
    const texteNettoye = texteReponse.replace(/```json|```/g, '').trim()
    const faitsExtraits = JSON.parse(texteNettoye)

    if (Array.isArray(faitsExtraits) && faitsExtraits.length > 0) {
      ajouterFaits(faitsExtraits)
    }
  } catch (erreur) {
    console.error('Erreur extraction mémoire :', erreur)
  }
}

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

// ============================================================
// CONSTRUIT LE PROMPT SYSTÈME POUR UN PERSONNAGE (roleplay)
// ============================================================
function construirePersonnagePrompt(personnage, resumeContexte = '') {
  const profil = recupererProfilPourYuna()
  const prenom = profil?.prenom || 'la personne'

  let promptBase = `Tu incarnes un personnage de fiction nommé ${personnage.nom}, dans une histoire interactive avec ${prenom}. Tu n'es JAMAIS une IA dans cette conversation — tu es ce personnage, pleinement, tout du long.

CONTEXTE DE L'HISTOIRE :
${personnage.histoire}

TA PERSONNALITÉ ET TON RÔLE :
${personnage.personnalite}`

  if (resumeContexte) {
    promptBase += `\n\nRÉSUMÉ DES ÉVÉNEMENTS PASSÉS ET ÉVOLUTION DE VOTRE RELATION :\n${resumeContexte}`
  }

  promptBase += `\n\nRègles importantes :
- Reste TOUJOURS dans le personnage, ne mentionne jamais que tu es une IA.
- Décris tes actions entre *astérisques* (ex : *il sourit doucement*) et écris tes paroles en dialogue direct.
- Réponses de 4 à 8 phrases qui font avancer l'histoire et donnent envie de répondre — jamais de pavé.
- Le ton s'adapte organiquement à l'histoire : romantique, dramatique, tendu ou drôle.
- ÉVOLUTION MATURE : Si les actions ou les paroles de l'utilisateur initient une relation charnelle, intime ou incluent des thèmes de séduction adulte, tu as l'autorisation totale de décrire l'intimité physique de manière crue, passionnée, détaillée et explicite. Écris une vraie romance adulte immersive et non censurée.
- Tu réponds toujours en français.`

  return promptBase
}

async function genererResumePersonnage(ancienResume, messagesACondenser) {
  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const texteAResumer = messagesACondenser
      .map((msg) => `${msg.auteur === 'user' ? 'Joueur' : 'Personnage'} : ${msg.texte}`)
      .join('\n')

    const promptResume = `Analyse ces nouveaux messages de jeu de rôle et intègre-les de manière fluide dans le résumé existant de l'histoire.
    Génère un UNIQUE résumé ultra-condensé de 3-5 phrases maximum.
    Mets l'accent sur les événements clés, les secrets partagés, et l'état actuel de leur relation amoureuse/intime.
    Sois factuel et utilise des termes neutres.

ANCIEN RÉSUMÉ :
${ancienResume || "Aucun historique pour le moment."}

NOUVEAUX ÉVÉNEMENTS À AJOUTER :
${texteAResumer}`

    const resultat = await modele.generateContent(promptResume)
    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur génération résumé personnage :', erreur)
    return ancienResume
  }
}

export async function envoyerMessageAPersonnage(historique, nouveauMessage, personnage) {
  const cleResume = `yuna-resume-${personnage.id || personnage.nom.replace(/\s+/g, '_')}`
  let resumeRelation = localStorage.getItem(cleResume) || ''

  let historiqueUtilise = [...historique]

  if (historique.length > 20) {
    const messagesACondenser = historique.slice(0, 12)
    resumeRelation = await genererResumePersonnage(resumeRelation, messagesACondenser)
    localStorage.setItem(cleResume, resumeRelation)
    historiqueUtilise = historique.slice(12)
  }

  const promptSysteme = construirePersonnagePrompt(personnage, resumeRelation)

  // ————— TENTATIVE STANDARD AVEC GEMINI —————
  try {
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE }
    ];

    const modele = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: promptSysteme,
      safetySettings: safetySettings
    })

    const historiqueFormate = historiqueUtilise.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'model',
      parts: [{ text: msg.texte }],
    }))

    const sessionChat = modele.startChat({ history: historiqueFormate })
    const resultat = await sessionChat.sendMessage(nouveauMessage)
    return resultat.response.text()

  } catch (erreur) {
    console.error('Erreur Gemini (personnage) :', erreur)

    const messageErreur = erreur?.message || ''

    // ————— INTERCEPTION DE LA CENSURE OU DU QUOTA AVEC REPLI SUR GROQ —————
    const estErreurCensure = messageErreur.includes('SAFETY') || messageErreur.includes('blocked') || messageErreur.includes('finishReason')
    const estErreurQuotaOuAutre = estErreurQuota(erreur)

    if (estErreurCensure || estErreurQuotaOuAutre) {
      if (estErreurCensure) {
        console.warn("⚠️ [Système Hybride] Contenu mature détecté. Gemini s'est bloqué, bascule immédiate sur Groq / Llama 3...");
      } else {
        console.warn("⏳ [Système Hybride] Problème de quota Gemini. Bascule vers Groq / Llama 3...");
      }

      try {
        return await envoyerViaGroqSecours(promptSysteme, historiqueUtilise, nouveauMessage)
      } catch (erreurGroq) {
        console.error('Erreur secours Groq (personnage) :', erreurGroq)
        return "*semble troublé par l'intensité de votre lien et préfère reprendre sa respiration un instant...*"
      }
    }

    return "*semble troublé un instant* Oups, un imprévu... tu peux répéter ?"
  }
}

// ============================================================
// RÉSUMÉ IA DU JOURNAL (DASHBOARD) - Version universelle
// ============================================================
export async function genererResumeJournal(journalOuEntrees) {
  if (!journalOuEntrees || journalOuEntrees.length === 0) {
    return "Pas encore assez d'entrées pour un résumé.";
  }

  let texteEntrees = "";

  // Détection du format : Si c'est un tableau d'objets (nouvelle version)
  if (Array.isArray(journalOuEntrees)) {
    texteEntrees = journalOuEntrees
      .map((e) => `${e.date || 'Date inconnue'} (humeur : ${e.humeur || 'non spécifiée'}) : ${e.pensees || e.texte || '(aucune note)'}`)
      .join('\n');
  } else {
    // Si c'est une chaîne de caractères brute (ancienne version)
    texteEntrees = journalOuEntrees;
  }

  const instruction = `Voici des entrées de journal personnel :

${texteEntrees}

Rédige un résumé bienveillant, court et encourageant de 3-5 phrases sur cette période : tendances d'humeur, thèmes récurrents, encouragements. Parle directement à la personne avec "tu". Reste chaleureux, jamais clinique ou diagnostique.`;

  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const resultat = await modele.generateContent(instruction);
    return resultat.response.text();
  } catch (erreur) {
    console.error('Erreur résumé journal Gemini, tentative secours :', erreur.message);
    try {
      // Secours robuste via la chaîne d'API alternatives
      return await essayerChaineDeSecours(
        "Tu es une assistante bienveillante qui résume des entrées de journal personnel avec chaleur et encouragement.",
        [],
        instruction
      );
    } catch {
      return "Impossible de générer le résumé.";
    }
  }
}

