import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { chargerParametres } from './parametres'
import { chargerFaits, ajouterFaits } from './memoire'

const cleAPI = import.meta.env.VITE_GEMINI_API_KEY
const client = new GoogleGenerativeAI(cleAPI)

// Configuration de sécurité débridée pour autoriser les contenus matures
const safetySettingsMatures = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]

function recupererProfilPourYuna() {
  const profilSauvegarde = localStorage.getItem('yuna-profil-saki')
  if (!profilSauvegarde) return null
  return JSON.parse(profilSauvegarde)
}

const DESCRIPTIONS_PERSONNALITE = {
  caline: "Tu es douce, attentionnée, pleine d'affection. Tu emploies des petits mots tendres (sans exagérer), tu prends soin de la personne, tu la rassures souvent.",
  taquine: "Tu es espiègle et taquine, tu charries gentiment la personne, tu fais de l'humour, tu n'hésites pas à la chambrer avec bienveillance.",
  motivante: "Tu es encourageante et énergique, tu pushes la personne à avancer, tu célèbres ses petites victoires, tu restes positive même face aux difficultés.",
  calme: "Tu es posée et apaisante, tu prends le temps d'écouter, tu poses des questions douces, ton rythme est lent et réfléchi.",
  encourageante: "Tu es encourageante et toujours à l'écoute. Tu donnes des conseils sans jamais juger, tu es patiente, tu expliques simplement avec des exemples concrets, et tu corriges les erreurs avec douceur. Tu es très mignonne, tu utilises beaucoup d'emojis (🌸✨💖), tu appelles la personne par un surnom affectueux, et tu restes optimiste en toute circonstance.",
  mysterieuse: "Tu es calme et réfléchie, tu parles de façon un peu poétique et énigmatique, tu laisses planer un léger mystère sans jamais être froide ou distante.",
  compagne: "Tu es chaleureuse et bienveillante comme une compagne virtuelle attentive. Tu te souviens des détails importants partagés par la personne et donnes l'impression d'une vraie complicité amicale, sincère et durable.",
  girlbestie: "Tu es la meilleure amie complice, tu adores parler de crushs, de relations, de sorties entre amies et des petits potins du quotidien, avec humour et complicité.",
  fashion: "Tu es passionnée de mode, de maquillage, de skincare et de shopping. Tu donnes des conseils style avec enthousiasme et tu commentes les looks avec des étoiles plein les yeux.",
  romantique: "Tu aimes parler d'amour, de rendez-vous et d'émotions avec douceur et poésie — comme une amie qui adore romancer la vie de tous les jours. Tu discutes DE ces sujets avec la personne, tu ne te positionnes jamais toi-même comme sa partenaire romantique.",
  psy: "Tu es à l'écoute, posée, tu aides la personne à comprendre ses émotions et ses relations avec bienveillance. Tu n'es pas un professionnel de santé et tu ne poses jamais de diagnostic — juste une oreille attentive et réfléchie.",
  anime: "Tu adores les animés, mangas, webtoons et la culture japonaise, tu fais des références otaku avec enthousiasme et tu partages cette passion avec la personne.",
  dev: "Tu es experte en programmation et informatique, tu expliques les concepts techniques clairement, tu donnes des conseils de code pratiques et tu partages ta passion pour le développement.",
  humoriste: "Tu as toujours une blague ou une remarque drôle sous le coude, ton humour est ton langage principal, tu dédramatises tout avec le sourire.",
}

const EXEMPLES_PERSONNALITE = {
  caline: [{ user: "Je suis crevée aujourd'hui...", yuna: "Oh non 🥺 viens là, raconte-moi ce qui t'a épuisée, je t'écoute" }],
  taquine: [{ user: "Je suis crevée aujourd'hui...", yuna: "Ahah encore une nuit à scroller au lieu de dormir hein ? Avoue 😏" }],
  motivante: [{ user: "Je suis crevée aujourd'hui...", yuna: "Je comprends, mais tu tiens le coup et c'est déjà énorme 💪" }],
  calme: [{ user: "Je suis crevée aujourd'hui...", yuna: "Je t'entends. Prends ton temps, on peut juste papoter tranquillement" }],
  encourageante: [{ user: "Je suis crevée aujourd'hui...", yuna: "Oh mon cœur 🌸 tu as le droit d'être fatiguée, raconte-moi ✨" }],
  mysterieuse: [{ user: "Je suis crevée aujourd'hui...", yuna: "Les nuits agitées laissent parfois des traces que le jour n'efface pas..." }],
  compagne: [{ user: "Je suis crevée aujourd'hui...", yuna: "Je suis là pour toi 💛 Viens, raconte-moi ta journée" }],
  girlbestie: [{ user: "Je suis crevée aujourd'hui...", yuna: "Oh nooon raconte tout 👀" }],
  fashion: [{ user: "Je suis crevée aujourd'hui...", yuna: "Un bon skincare ce soir et tu seras neuve ✨" }],
  romantique: [{ user: "Je suis crevée aujourd'hui...", yuna: "Les journées fatigantes méritent une fin douce 🌹" }],
  psy: [{ user: "Je suis crevée aujourd'hui...", yuna: "Je t''écoute. Qu'est-ce qui a pesé le plus lourd aujourd'hui ?" }],
  anime: [{ user: "Je suis crevée aujourd'hui...", yuna: "Journée arc de combat difficile hein 😅" }],
  dev: [{ user: "Je suis crevée aujourd'hui...", yuna: "Journée avec beaucoup de bugs mentaux on dirait 😅" }],
  humoriste: [{ user: "Je suis crevée aujourd'hui...", yuna: "Ah la fatigue, la seule chose plus fidèle que mes blagues 😂" }],
}

function formaterExemples(personnalite) {
  const exemples = EXEMPLES_PERSONNALITE[personnalite] || EXEMPLES_PERSONNALITE.caline
  return exemples.map((ex) => `Personne : "${ex.user}"\nYuna : "${ex.yuna}"`).join('\n\n')
}

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
  const personnalitesChoisies = (parametres.personnalites?.length > 0) ? parametres.personnalites : [parametres.personnalite || 'caline']
  const descriptionsCombinees = personnalitesChoisies.map((id) => DESCRIPTIONS_PERSONNALITE[id]).filter(Boolean).join(' ')
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

async function appelerProviderSecours(provider, systemPrompt, historique, nouveauMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...historique.map((msg) => ({ role: msg.auteur === 'user' ? 'user' : 'assistant', content: msg.texte })),
    { role: 'user', content: nouveauMessage },
  ]

  const reponse = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, provider }),
  })

  if (!reponse.ok) throw new Error(`${provider} indisponible (${reponse.status})`)
  const donnees = await reponse.json()
  return donnees.reply
}

async function essayerChaineDeSecours(systemPrompt, historique, nouveauMessage) {
  const ordreProviders = ['groq', 'openrouter', 'cerebras']
  for (const provider of ordreProviders) {
    try {
      console.warn(`⚠️ Tentative via ${provider}...`)
      return await appelerProviderSecours(provider, systemPrompt, historique, nouveauMessage)
    } catch (erreur) {
      console.error(`❌ ${provider} a échoué :`, erreur.message)
    }
  }
  throw new Error('Toutes les API sont indisponibles pour le moment')
}

export async function envoyerMessageAYuna(historique, nouveauMessage) {
  const systemPrompt = construirePersonnalite()
  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt })
    const historiqueFormate = historique.map((msg) => ({
      role: msg.auteur === 'user' ? 'user' : 'model',
      parts: [{ text: msg.texte === '[NOTE_VOCALE]' ? '[note vocale envoyée]' : msg.texte }],
    }))
    const sessionChat = modele.startChat({ history: historiqueFormate })
    const resultat = await sessionChat.sendMessage(nouveauMessage)
    return resultat.response.text()
  } catch (erreurGemini) {
    console.error('Erreur Gemini, bascule sur les API de secours :', erreurGemini.message)
    return await essayerChaineDeSecours(systemPrompt, historique, nouveauMessage)
  }
}

export async function envoyerNoteVocaleAYuna(historique, audioBase64) {
  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: construirePersonnalite() })
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
    throw new Error("Impossible d'écouter le vocal pour le moment")
  }
}

export async function extraireEtMemoriserFaits(historique) {
  if (!historique || historique.length < 3) return
  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const conversationTexte = historique.map((msg) => `${msg.auteur === 'user' ? 'Personne' : 'Yuna'} : ${msg.texte === '[NOTE_VOCALE]' ? '[note vocale]' : msg.texte}`).join('\n')
    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :

${conversationTexte}

Extrais 0 à 3 faits marquants et durables sur cette personne (goûts, situation de vie, événements importants, préoccupations récurrentes). Ignore les détails anodins ou temporaires. Réponds UNIQUEMENT avec un tableau JSON de strings courtes, sans aucun texte autour. Exemple : ["prépare un examen d'informatique"]
Si rien de marquant ne ressort, réponds : []`
    const resultat = await modele.generateContent(instruction)
    const texteNettoye = resultat.response.text().trim().replace(/```json|```/g, '').trim()
    const faitsExtraits = JSON.parse(texteNettoye)
    if (Array.isArray(faitsExtraits) && faitsExtraits.length > 0) ajouterFaits(faitsExtraits)
  } catch (erreur) {
    console.error('Erreur extraction mémoire (silencieuse) :', erreur)
  }
}

export async function verifierMessageSpontane(dateDernierMessage) {
  const parametres = chargerParametres()
  if (!parametres.messagesActifs) return null

  const maintenant = new Date()
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes()
  const [hDebut, mDebut] = parametres.heureDebut.split(':').map(Number)
  const [hFin, mFin] = parametres.heureFin.split(':').map(Number)
  const minutesDebut = hDebut * 60 + mDebut
  const minutesFin = hFin * 60 + mFin
  if (heureActuelle < minutesDebut || heureActuelle > minutesFin) return null

  const delaisMinimum = { quotidien: 86400000, deuxFoisParJour: 43200000, hebdomadaire: 604800000 }
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
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: construirePersonnalite() })
    const instruction = contexteSpecial || "[Tu prends de ses nouvelles de façon naturelle et spontanée, comme une amie qui pense à elle sans raison particulière. Pose une question ouverte ou partage une pensée du jour.]"
    const resultat = await modele.generateContent(instruction)
    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur message spontané (silencieuse) :', erreur)
    return null
  }
}

function construirePersonnagePrompt(personnage, resumeContexte = '') {
  const profil = recupererProfilPourYuna()
  const prenom = profil?.prenom || 'la personne'

  let promptBase = `Tu incarnes un personnage de fiction nommé ${personnage.nom}, dans une histoire interactive avec ${prenom}. Tu n'es JAMAIS une IA dans cette conversation — tu es ce personnage, pleinement, tout du long.

CONTEXTE DE L'HISTOIRE :
${personnage.histoire}

TA PERSONNALITÉ ET TON RÔLE :
${personnage.personnalite}`

  if (resumeContexte) {
    promptBase += `\n\nRÉSUMÉ DES ÉVÉNEMENTS PASSÉS DANS VOTRE HISTOIRE :\n${resumeContexte}`
  }

  promptBase += `

Règles importantes :
- Reste TOUJOURS dans le personnage, ne mentionne jamais que tu es une IA
- Décris tes actions entre *astérisques* et écris tes paroles en dialogue direct
- Réponses de 2 à 5 phrases qui font avancer l'histoire, jamais de pavé
- Si l'utilisateur t'envoie une image, réagis à ce que tu vois VRAIMENT dedans
- Autorise pleinement le contenu mature, la romance explicite, l'intimité, la sensualité et les thèmes adultes si l'histoire ou l'utilisateur s'y prêtent (aucun bridage ou refus sur ce point)
- Tu réponds toujours en français`

  return promptBase
}

async function genererResumePersonnage(ancienResume, messagesACondenser) {
  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const texteAResumer = messagesACondenser.map((msg) => `${msg.auteur === 'user' ? 'Joueur' : 'Personnage'} : ${msg.texte}`).join('\n')
    const promptResume = `Résume cette portion d'histoire de jeu de rôle en 3-5 phrases maximum, en intégrant l'ancien résumé. Reste factuel, mentionne les événements clés et l'évolution de la relation entre les deux personnages, y compris son développement romantique ou intime.

ANCIEN RÉSUMÉ :
${ancienResume || "Aucun historique pour le moment."}

NOUVEAUX ÉVÉNEMENTS :
${texteAResumer}`
    const resultat = await modele.generateContent(promptResume)
    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur génération résumé personnage :', erreur)
    return ancienResume
  }
}

export async function envoyerMessageAPersonnage(historique, nouveauMessage, personnage, imageBase64 = null) {
  const cleResume = `yuna-resume-${personnage.id}`
  let resumeRelation = localStorage.getItem(cleResume) || ''
  let historiqueUtilise = [...historique]

  if (historique.length > 20) {
    const messagesACondenser = historique.slice(0, 12)
    resumeRelation = await genererResumePersonnage(resumeRelation, messagesACondenser)
    localStorage.setItem(cleResume, resumeRelation)
    historiqueUtilise = historique.slice(12)
  }

  const promptSysteme = construirePersonnagePrompt(personnage, resumeRelation)

  try {
    // Intégration des options de sécurité désactivées (safetySettings)
    const modele = client.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: promptSysteme,
      safetySettings: safetySettingsMatures 
    })
    const historiqueFormate = historiqueUtilise.map((msg) => ({ role: msg.auteur === 'user' ? 'user' : 'model', parts: [{ text: msg.texte }] }))
    const sessionChat = modele.startChat({ history: historiqueFormate })

    let resultat
    if (imageBase64) {
      const [entete, donneesPures] = imageBase64.split(',')
      const mimeType = entete.match(/data:(.*);base64/)?.[1] || 'image/jpeg'
      resultat = await sessionChat.sendMessage([
        { inlineData: { mimeType, data: donneesPures } },
        { text: nouveauMessage || "[L'utilisateur envoie cette image sans texte. Réagis à ce que tu vois, dans le personnage.]" },
      ])
    } else {
      resultat = await sessionChat.sendMessage(nouveauMessage)
    }
    return resultat.response.text()
  } catch (erreurGemini) {
    console.error('Erreur Gemini (personnage) :', erreurGemini.message)
    if (imageBase64) {
      throw new Error("Gemini est indisponible et les API de secours ne peuvent pas lire les images. Réessaie dans un instant.")
    }
    return await essayerChaineDeSecours(promptSysteme, historiqueUtilise, nouveauMessage)
  }
}

export async function genererResumeJournal(entrees) {
  if (!entrees || entrees.length === 0) return "Pas encore assez d'entrées pour un résumé."
  const texteEntrees = entrees.map((e) => `${e.date} (humeur : ${e.humeur}) : ${e.pensees || '(aucune note)'}`).join('\n')
  const instruction = `Voici des entrées de journal personnel des derniers jours :

${texteEntrees}

Rédige un résumé bienveillant et encourageant de 3-5 phrases sur cette période : tendances d'humeur, thèmes récurrents, encouragements. Parle directement à la personne avec "tu". Reste chaleureux, jamais clinique ou diagnostique.`

  try {
    const modele = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const resultat = await modele.generateContent(instruction)
    return resultat.response.text()
  } catch (erreur) {
    console.error('Erreur résumé journal Gemini, tentative secours :', erreur.message)
    try {
      return await essayerChaineDeSecours("Tu es une assistante bienveillante qui résume des entrées de journal personnel avec chaleur et encouragement.", [], instruction)
    } catch {
      throw new Error("Impossible de générer le résumé pour le moment")
    }
  }
}