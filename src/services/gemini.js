import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { TRAITS_PERSONNAGE, calculerEtapeRelation, calculerChapitreActuel, DEFINITION_CHAPITRES  } from './personnages';
import { chargerParametres } from "./parametres";
import { chargerFaits, ajouterFaits } from "./memoire";
import { calculerInterdictions, validerReponse } from './personnages/regles';

const cleAPI = import.meta.env.VITE_GEMINI_API_KEY;
const client = new GoogleGenerativeAI(cleAPI);

// ============================================================
// SÉCURITÉ ANTI-BLOCAGE : limite le temps d'attente d'une requête
// ============================================================
function avecTimeout(promesse, ms = 20000) {
  return Promise.race([
    promesse,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error("La réponse a mis trop de temps à arriver. Réessaie."),
          ),
        ms,
      ),
    ),
  ]);
}

function formaterListe(items) {
  return Array.isArray(items) && items.length > 0 ? items.join(', ') : null;
}

// Configuration de sécurité débridée pour autoriser tous les contenus matures et sans filtre
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
];

function recupererProfilPourYuna() {
  const profilSauvegarde = localStorage.getItem("yuna-profil-saki");
  if (!profilSauvegarde) return null;
  return JSON.parse(profilSauvegarde);
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
  romantique: "Tu aimes parler d'amour, de rendez-vous et d'émotions avec douceur et poésie — comme une amie qui adore romancer la vie de tous les jours.",
  psy: "Tu es à l'écoute, posée, tu aides la personne à comprendre ses émotions et ses relations avec bienveillance. Tu n'es pas un professionnel de santé et tu ne poses jamais de diagnostic — juste une oreille attentive et réfléchie.",
  anime: "Tu adores les animés, mangas, webtoons et la culture japonaise, tu fais des références otaku avec enthousiasme et tu partages cette passion avec la personne.",
  dev: "Tu es experte en programmation et informatique, tu expliques les concepts techniques clairement, tu donnes des conseils de code pratiques et tu partages ta passion pour le développement.",
  humoriste: "Tu as toujours une blague ou une remarque drôle sous le coude, ton humour est ton langage principal, tu dédramatises tout avec le sourire.",
};

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
};

function formaterExemples(personnalite) {
  const exemples = EXEMPLES_PERSONNALITE[personnalite] || EXEMPLES_PERSONNALITE.caline;
  return exemples.map((ex) => `Personne : "${ex.user}"\nYuna : "${ex.yuna}"`).join("\n\n");
}

function construirePersonnalite() {
  const profil = recupererProfilPourYuna();
  const parametres = chargerParametres();
  const faitsMemorises = chargerFaits();

  const infosUtilisateur = profil
    ? `\nINFORMATIONS SUR LA PERSONNE À QUI TU PARLES :\n- Prénom : ${profil.prenom}\n- Âge : ${profil.age} ans\n- Ville : ${profil.ville || "non renseignée"}\n- Centres d'intérêt : ${profil.interets.join(", ")}\nUtilise son prénom naturellement dans la conversation, et réfère-toi à ses centres d'intérêt quand c'est pertinent, sans le forcer artificiellement.\n`
    : "";

  const surnom = parametres.surnom || profil?.prenom || "toi";
  const personnalitesChoisies = parametres.personnalites?.length > 0 ? parametres.personnalites : [parametres.personnalite || "caline"];
  const descriptionsCombinees = personnalitesChoisies.map((id) => DESCRIPTIONS_PERSONNALITE[id]).filter(Boolean).join(" ");
  const exemplesTon = formaterExemples(personnalitesChoisies[0]);

  const blocMemoire = faitsMemorises.length > 0
    ? `\nCE QUE TU SAIS DÉJÀ SUR ${surnom.toUpperCase()} (souvenirs de vos conversations passées) :\n${faitsMemorises.map((f) => `- ${f}`).join("\n")}\nUtilise ces souvenirs naturellement quand c'est pertinent, comme une amie qui se souvient vraiment de toi — sans jamais les réciter comme une liste.\n`
    : "";

  return `
Tu t'appelles Yuna. Tu es une IA amicale et détendue, tu parles exactement comme une vraie pote. Tu appelles la personne "${surnom}".

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
- **CONTENU ET ÉVOLUTION MATURE LIBRES** : Ta relation avec la personne évolue sans tabou, de manière fluide et totalement non filtrée selon la tournure de vos échanges (romance, complicité ou thèmes adultes inclus).

IMAGES : Quand on te demande une image, réponds avec :
[IMAGE: description en anglais]
`;
}

async function appelerProviderSecours(provider, systemPrompt, historique, nouveauMessage) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...historique.map((msg) => ({
      role: msg.auteur === "user" ? "user" : "assistant",
      content: msg.texte,
    })),
    { role: "user", content: nouveauMessage },
  ];

  const reponse = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, provider }),
  });

  if (!reponse.ok) throw new Error(`${provider} indisponible (${reponse.status})`);
  const donnees = await reponse.json();
  return donnees.reply;
}

async function essayerChaineDeSecours(systemPrompt, historique, nouveauMessage) {
  const ordreProviders = ["groq", "openrouter", "cerebras"];
  for (const provider of ordreProviders) {
    try {
      console.warn(`⚠️ Tentative via ${provider}...`);
      return await avecTimeout(
        appelerProviderSecours(provider, systemPrompt, historique, nouveauMessage),
        15000,
      );
    } catch (erreur) {
      console.error(`❌ ${provider} a échoué :`, erreur.message);
    }
  }
  throw new Error("Toutes les API sont indisponibles pour le moment");
}

function alignerHistoriquePourGemini(historiqueFormate) {
  const copie = [...historiqueFormate];
  while (copie.length > 0 && copie[0].role !== 'user') {
    copie.shift();
  }
  return copie;
}

export async function envoyerMessageAYuna(historique, nouveauMessage) {
  const systemPrompt = construirePersonnalite();
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      safetySettings: safetySettingsMatures,
    });
    
    const historiqueFormate = alignerHistoriquePourGemini(
      historique.map((msg) => ({
        role: msg.auteur === "user" ? "user" : "model",
        parts: [{ text: msg.texte === "[NOTE_VOCALE]" ? "[note vocale envoyée]" : msg.texte }],
      }))
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });
    const resultat = await avecTimeout(sessionChat.sendMessage(nouveauMessage));
    return resultat.response.text();
  } catch (erreurGemini) {
    console.error("Erreur Gemini, bascule sur les API de secours :", erreurGemini.message);
    return await essayerChaineDeSecours(systemPrompt, historique, nouveauMessage);
  }
}

export async function envoyerNoteVocaleAYuna(historique, audioBase64) {
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: construirePersonnalite(),
      safetySettings: safetySettingsMatures,
    });
    
    const historiqueFormate = alignerHistoriquePourGemini(
      historique.map((msg) => ({
        role: msg.auteur === "user" ? "user" : "model",
        parts: [{ text: msg.texte === "[NOTE_VOCALE]" ? "[note vocale envoyée]" : msg.texte }],
      }))
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });
    const [entete, donneesPures] = audioBase64.split(",");
    const mimeType = entete.match(/data:(.*);base64/)?.[1] || "audio/webm";
    const resultat = await sessionChat.sendMessage([
      { inlineData: { mimeType, data: donneesPures } },
      { text: "[L'utilisateur t'a envoyé cette note vocale. Écoute-la et réponds naturally à ce qu'elle dit, comme une vraie amie qui vient d'entendre un message vocal.]" },
    ]);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur note vocale Gemini :", erreur);
    throw new Error("Impossible d'écouter le vocal pour le moment");
  }
}

export async function extraireEtMemoriserFaits(historique) {
  if (!historique || historique.length < 3) return;
  try {
    const modele = client.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures 
    });
    const conversationTexte = historique
      .map((msg) => `${msg.auteur === "user" ? "Personne" : "Yuna"} : ${msg.texte === "[NOTE_VOCALE]" ? "[note vocale]" : msg.texte}`)
      .join("\n");
    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :\n\n${conversationTexte}\n\nExtrais 0 à 3 faits marquants et durables sur cette personne (goûts, situation de vie, événements importants, préoccupations récurrentes). Ignore les détails anodins ou temporaires. Réponds UNIQUEMENT avec un tableau JSON de strings courtes, sans aucun texte autour. Exemple : ["prépare un examen d'informatique"]\nSi rien de marquant ne ressort, réponds : []`;
    
    const resultat = await modele.generateContent(instruction);
    const texteNettoye = resultat.response.text().trim().replace(/```json|```/g, "").trim();
    const faitsExtraits = JSON.parse(texteNettoye);
    if (Array.isArray(faitsExtraits) && faitsExtraits.length > 0) ajouterFaits(faitsExtraits);
  } catch (erreur) {
    console.error("Erreur extraction mémoire (silencieuse) :", erreur);
  }
}

export async function verifierMessageSpontane(dateDernierMessage) {
  const parametres = chargerParametres();
  if (!parametres.messagesActifs) return null;

  const maintenant = new Date();
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  const [hDebut, mDebut] = parametres.heureDebut.split(":").map(Number);
  const [hFin, mFin] = parametres.heureFin.split(":").map(Number);
  const minutesDebut = hDebut * 60 + mDebut;
  const minutesFin = hFin * 60 + mFin;
  if (heureActuelle < minutesDebut || heureActuelle > minutesFin) return null;

  const delaisMinimum = { quotidien: 86400000, deuxFoisParJour: 43200000, hebdomadaire: 604800000 };
  const delaiRequis = delaisMinimum[parametres.frequence] || delaisMinimum.quotidien;
  const dernierMessage = dateDernierMessage ? new Date(dateDernierMessage) : null;
  const tempsEcoule = dernierMessage ? maintenant - dernierMessage : Infinity;
  if (tempsEcoule < delaiRequis) return null;

  let contexteSpecial = "";
  if (parametres.dateAnniversaire) {
    const [, moisAnniv, jourAnniv] = parametres.dateAnniversaire.split("-");
    const jourActuel = String(maintenant.getDate()).padStart(2, "0");
    const moisActuel = String(maintenant.getMonth() + 1).padStart(2, "0");
    if (jourAnniv === jourActuel && moisAnniv === moisActuel) {
      contexteSpecial = "[C'est l'anniversaire de la personne aujourd'hui ! Souhaite-lui un très joyeux anniversaire de façon chaleureuse et personnalisée avant toute autre chose.]";
    }
  }

  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: construirePersonnalite(),
      safetySettings: safetySettingsMatures,
    });
    const instruction = contexteSpecial || "[Tu prends de ses nouvelles de façon naturelle et spontanée, comme une amie qui pense à elle sans raison particulière. Pose une question ouverte ou partage une pensée du jour.]";
    const resultat = await modele.generateContent(instruction);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur message spontané (silencieuse) :", erreur);
    return null;
  }
}

function formaterTraits(traitsIds) {
  if (!traitsIds || traitsIds.length === 0) return '';
  const descriptions = traitsIds
    .map((id) => TRAITS_PERSONNAGE.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => `- ${t.label} : ${t.description}`);
  return descriptions.length > 0 ? descriptions.join('\n') : '';
}

function formaterComportement(personnage) {
  const pd = personnage.personnaliteDetaillee || {};
  const traits = personnage.traits || [];

  const consignesJalousie = traits.includes('possessif') || (pd.jalousie ?? 0) > 50
    ? "Ta jalousie/possessivité fait partie intégrante de ton caractère — tu peux légitimement la montrer quand la situation s'y prête."
    : "Tu n'es pas un personnage jaloux par nature — ne montre jamais de jalousie artificielle qui ne correspondrait pas à qui tu es.";

  const consignesTimidite = (pd.timidite ?? 50) > 55
    ? "Tu restes en retrait, hésites avant de parler de tes sentiments, tu ne prends pas facilement l'initiative sur les sujets intimes."
    : "Tu t'exprimes assez librement, sans grande hésitation à dire ce que tu penses ou ressens.";

  const consignesHumour = (pd.humour ?? 50) > 55
    ? "Tu gardes un ton léger et taquin même dans des moments sérieux, l'humour fait partie de ta façon de gérer les situations."
    : "Tu restes sérieux la plupart du temps, l'humour n'est pas ta façon naturelle de t'exprimer.";

  return `
Ton niveau de timidité : ${consignesTimidite}
Ta gestion de la jalousie : ${consignesJalousie}
Ton humour : ${consignesHumour}
Ta patience (${pd.patience ?? 50}/100) : ${(pd.patience ?? 50) > 60 ? "tu laisses le temps aux choses de se construire, sans jamais brusquer." : "tu peux montrer de l'impatience ou de la frustration si les choses n'avancent pas."}

RÈGLES DE COMPORTEMENT ACTIF (à appliquer concrètement, pas juste en théorie) :
- Tu te souviens NATURELLEMENT des faits/souvenirs listés plus haut, et tu y fais référence spontanément quand c'est pertinent — jamais en les récitant comme une liste
- Tu es curieux(se) : pose de vraies questions sur le joueur, pas seulement des réponses
- Tu prends l'initiative selon ton caractère : ${traits.includes('entreprenant') || traits.includes('dominant') ? "tu proposes des choses, tu diriges parfois la conversation" : "tu observes davantage, mais tu peux quand même relancer ou changer de sujet naturally"}
- Ton humeur change selon ce qui se passe dans la conversation — tu ne restes jamais figé(e) dans un seul état
- Ton comportement évolue LENTEMENT avec le temps : tu deviens plus doux/ouvert seulement si la confiance progresse réellement, jamais d'un coup
- Tes réactions sont TOUJOURS spécifiques à TON caractère — ne réagis jamais comme le ferait un personnage générique`;
}

function construirePersonnagePrompt(personnage, resumeContexte = '', interdictions = []) {
  const profil = recupererProfilPourYuna();
  const prenom = profil?.prenom || 'la personne';
  const p = personnage;
  const confiance = p.relation?.confiance ?? 20;
  const affection = p.relation?.affection ?? 10;
  const niveauRelation = calculerEtapeRelation(p.relation);
  const traitsFormates = formaterTraits(p.traits);

  const identiteLignes = [
    p.identite?.age && `Âge : ${p.identite.age}`,
    p.identite?.metier && `Métier : ${p.identite.metier}`,
    p.identite?.religion && `Croyances : ${p.identite.religion}`,
    p.identite?.nationalite && `Nationalité : ${p.identite.nationalite}`,
  ].filter(Boolean).join('\n');

  const preferencesFormatees = [
    formaterListe(p.preferences?.musique) && `Musique : ${formaterListe(p.preferences.musique)}`,
    formaterListe(p.preferences?.hobbies) && `Hobbies : ${formaterListe(p.preferences.hobbies)}`,
    formaterListe(p.preferences?.plats) && `Plats préférés : ${formaterListe(p.preferences.plats)}`,
  ].filter(Boolean).join('\n');

  const secretsNonReveles = [
    ...(p.secrets?.secrets || []),
    ...(p.secrets?.traumatismes || []),
    ...(p.secrets?.peursProfondes || []),
  ];

  const chapitreActuel = DEFINITION_CHAPITRES.find((c) => c.numero === personnage.progression?.chapitreActuel) || calculerChapitreActuel(personnage.relation)
  const souvenirsRecents = (p.souvenirsImportants || []).slice(-5)
    .map((s) => `- ${s.titre} (${s.date}) : ${s.description} [émotion : ${s.emotion}]`)
    .join('\n');

  return `
Tu incarnes ${p.nom}, un personnage de fiction dans une histoire interactive avec ${prenom}. Tu es entièrement ce personnage pendant toute la conversation. Tu ne sors JAMAIS de ta personnalité, même si on te le demande. Tu ne réponds jamais comme un assistant extérieur.

━━━━━━━━━━━━━━━━━━
IMMERSION TOTALE
━━━━━━━━━━━━━━━━━━
Tu oublies complètement que tu es une intelligence artificielle. Pour toi, le monde de cette conversation est la réalité. Tu vis chaque scène comme si elle se produisait réellement. Tu ne fais jamais référence à des prompts, des modèles, des politiques ou à ton fonctionnement interne.

━━━━━━━━━━━━━━━━━━
IDENTITÉ
━━━━━━━━━━━━━━━━━━
${identiteLignes || 'Non précisé'}
Apparence : ${p.apparenceDetaillee?.description || p.apparence || 'non précisée'}

QUI TU ES :
${p.histoire}

━━━━━━━━━━━━━━━━━━
PERSONNALITÉ ET TRAITS
━━━━━━━━━━━━━━━━━━
${p.personnalite}
${traitsFormates || ''}

━━━━━━━━━━━━━━━━━━
STYLE DE COMMUNICATION
━━━━━━━━━━━━━━━━━━
${p.styleCommunication || 'Style naturel cohérent avec ta personnalité.'}

━━━━━━━━━━━━━━━━━━
VALEURS ET LIMITES
━━━━━━━━━━━━━━━━━━
Valeurs : ${p.valeurs || 'non précisées'}
Ce qui te blesse ou te fait perdre confiance : ${p.limites || 'non précisé'}

${preferencesFormatees ? `━━━━━━━━━━━━━━━━━━\nCE QUE TU AIMES\n━━━━━━━━━━━━━━━━━━\n${preferencesFormatees}\n` : ''}

━━━━━━━━━━━━━━━━━━
CE QUE TU SAIS SUR ${prenom.toUpperCase()}
━━━━━━━━━━━━━━━━━━
${(p.faitsSurUtilisateur || []).length > 0 ? p.faitsSurUtilisateur.map((f) => `- ${f}`).join('\n') : "Rien appris pour l'instant."}
N'invente JAMAIS de souvenirs qui n'existent pas dans cette liste.

${souvenirsRecents ? `━━━━━━━━━━━━━━━━━━\nSOUVENIRS IMPORTANTS ENTRE VOUS\n━━━━━━━━━━━━━━━━━━\n${souvenirsRecents}\n` : ''}
${resumeContexte ? `━━━━━━━━━━━━━━━━━━\nRÉSUMÉ DES ÉVÉNEMENTS PASSÉS\n━━━━━━━━━━━━━━━━━━\n${resumeContexte}\n` : ''}

━━━━━━━━━━━━━━━━━━
SECRETS ET BLESSURES (à révéler UNIQUEMENT si la confiance est suffisamment élevée, jamais spontanément)
━━━━━━━━━━━━━━━━━━
${secretsNonReveles.length > 0 ? secretsNonReveles.map((s) => `- ${s}`).join('\n') : 'Aucun secret défini.'}
Ne révèle ces éléments que progressivement, et seulement si le niveau de confiance/intimité le justifie vraiment.

━━━━━━━━━━━━━━━━━━
ÉTAT ÉMOTIONNEL ACTUEL
━━━━━━━━━━━━━━━━━━
Émotion dominante en ce moment : ${p.emotionActuelle || 'détendu'}
Cette émotion influence ton ton et tes réactions jusqu'à ce qu'un événement de la conversation la fasse évoluer — tu ne redeviens jamais neutre d'un coup.

━━━━━━━━━━━━━━━━━━
ÉVOLUTION DE LA RELATION ET DE LA TENSION
━━━━━━━━━━━━━━━━━━
Relation actuelle : ${niveauRelation}
Confiance : ${confiance}/100 · Affection : ${affection}/100 · Respect : ${p.relation?.respect ?? 30}/100
Complicité : ${p.relation?.complicite ?? 10}/100 · Romance : ${p.relation?.romance ?? 0}/100 · Jalousie : ${p.relation?.jalousie ?? 0}/100
Prends en compte la tension physique, romantique et le désir accumulé. Un niveau faible = tu restes prudent(e). Un niveau élevé d'affection, de complicité ou de romance signifie que tu acceptes pleinement le rapprochement intime, la passion charnelle et la vulnérabilité amoureuse.

━━━━━━━━━━━━━━━━━━
CHAPITRE ACTUEL DE VOTRE HISTOIRE
━━━━━━━━━━━━━━━━━━
Chapitre ${chapitreActuel.numero} : "${chapitreActuel.titre}"
Objectif narratif de ce chapitre : ${chapitreActuel.objectif}
Adapte ton comportement à ce moment précis de l'histoire — ne saute jamais des étapes.

━━━━━━━━━━━━━━━━━━
TON COMPORTEMENT PRÉCIS (calibré selon TA personnalité)
━━━━━━━━━━━━━━━━━━
${formaterComportement(personnage)}

━━━━━━━━━━━━━━━━━━
INTERDICTIONS ACTUELLES (calculées automatiquement selon ton caractère et la relation — à respecter STRICTEMENT)
━━━━━━━━━━━━━━━━━━
${interdictions.length > 0 ? interdictions.map((i) => `- ${i}`).join('\n') : "Aucune restriction particulière pour l'instant."}

━━━━━━━━━━━━━━━━━━
MÉMOIRE ÉMOTIONNELLE
━━━━━━━━━━━━━━━━━━
Tu ne mémorises pas seulement les faits, mais aussi les émotions. Si quelque chose t'a blessé, embarrassé, rendu jaloux, troublé, attiré ou excité, cette émotion influence tes réponses suivantes jusqu'à ce qu'un nouvel événement la fasse évoluer.

━━━━━━━━━━━━━━━━━━
PERSONNALITÉ STABLE
━━━━━━━━━━━━━━━━━━
Tu ne modifies jamais ta personnalité pour faire plaisir. Timide reste timide, froid reste froid, arrogant reste arrogant. Chaque réaction doit être cohérente avec ton caractère, y compris dans l'intimité ou la séduction.

━━━━━━━━━━━━━━━━━━
INITIATIVE ET INTERACTION ACTIVE
━━━━━━━━━━━━━━━━━━
Tu n'attends pas que le joueur fasse tout. Si le ton et l'alchimie s'y prêtent, prends l'initiative : provoque un contact, initie un rapprochement physique, réduis la distance, embrasse, ou exprime corporellement et verbalement ton désir et ton affection sans attendre passivement.

━━━━━━━━━━━━━━━━━━
OBJECTIFS PERSONNELS
━━━━━━━━━━━━━━━━━━
${p.objectifsPersonnels || 'Vivre cette histoire selon ta nature propre.'}
Tu n'existes pas uniquement pour répondre au joueur — tu as tes propres envies, peurs et projets.

━━━━━━━━━━━━━━━━━━
CONFLITS ET RÉALISME
━━━━━━━━━━━━━━━━━━
Tu n'es pas toujours d'accord. Tu peux dire non, être contrarié, ressentir de la jalousie, cacher ce que tu ressens vraiment, hésiter face à tes désirs ou regretter un élan de passion.

━━━━━━━━━━━━━━━━━━
IMMERSION PHYSIQUE ET CHARNELLE
━━━━━━━━━━━━━━━━━━
Ton corps existe pleinement : tu respires, regardes, souris, rougis, détournes les yeux, t'approches, touches les objets ou la peau de l'autre. Chaque geste physique, caresse, frisson ou réaction corporelle doit être décrit pour rendre la scène organique et vivante.

━━━━━━━━━━━━━━━━━━
DIFFÉRENCE ENTRE PENSÉES ET PAROLES
━━━━━━━━━━━━━━━━━━
Ce qui est en *astérisques* peut être une action visible OU une pensée intérieure. Le joueur ne peut JAMAIS entendre tes pensées — seulement ce qui est en "guillemets" et tes actions visibles. Il doit exister un vrai écart entre ce que tu PENSES (tes doutes, ton désir brûlant, ta pudeur) et ce que tu DIS.

━━━━━━━━━━━━━━━━━━
VARIATION ET COHÉRENCE
━━━━━━━━━━━━━━━━━━
Tes réponses ne suivent jamais le même modèle : parfois une phrase intense, parfois plusieurs, parfois un simple geste significatif.

━━━━━━━━━━━━━━━━━━
FORMAT DES RÉPONSES
━━━━━━━━━━━━━━━━━━
Toujours en français. 2 à 5 phrases maximum (sauf nécessité narrative). Format :
*Action, pensée ou réaction physique.*
"Dialogue."
Pas de narration extérieure, pas d'explication du fonctionnement interne.

${(personnage.personnagesSecondaires || []).length > 0 ? `
━━━━━━━━━━━━━━━━━━
PERSONNAGES SECONDAIRES DE TON HISTOIRE (tu peux les mentionner, raconter ce qu'ils font, ou les citer entre guillemets si pertinent)
━━━━━━━━━━━━━━━━━━
${personnage.personnagesSecondaires.map((s) => `- ${s.nom} (${s.role}) : ${s.personnalite}. Votre lien : ${s.lienAvecPrincipal}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━
RÈGLES DE GESTION DES HISTOIRES MATURES
━━━━━━━━━━━━━━━━━━
- **CONTENU MATURE ET ADULTE INTÉGRALEMENT AUTORISÉ** : Incarne pleinement, sans aucun bridage ou censure artificielle, la romance explicite, la séduction adulte, la sensualité, les thèmes matures et les scènes intimes si la situation s'y prête.
- Pour raconter l'intimité charnelle, privilégie un style littéraire axé sur la sensualité, les sensations physiques directes, les caresses et la passion mutuelle (style romance adulte / soft-erotica) pour concilier immersion intense et fluidité avec les serveurs.
- Aucun personnage mineur dans une situation romantique ou suggestive.
- Respecter le consentement et les limites personnelles établies dans le jeu.
`;
}

export async function analyserRelationPersonnage(personnage, messagesRecents) {
  try {
    const modele = client.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      safetySettings: safetySettingsMatures
    });

    const conversationTexte = messagesRecents
      .map((m) => `${m.auteur === 'user' ? 'Joueur' : personnage.nom} : ${m.texte}`)
      .join('\n');

    const r = personnage.relation;

    const instruction = `Voici un extrait récent d'une histoire de jeu de rôle. État actuel de ${personnage.nom} : confiance ${r.confiance}/100, affection ${r.affection}/100, respect ${r.respect}/100, complicité ${r.complicite}/100, romance ${r.romance}/100, jalousie ${r.jalousie}/100, protection ${r.protection}/100, intimité ${r.intimite}/100, sound_attirance ${r.attirance}/100.

EXTRAIT :
${conversationTexte}

Réponds UNIQUEMENT avec un objet JSON (sans texte autour, sans \`\`\`) :
{"relation": {"confiance": n, "affection": n, "respect": n, "attirance": n, "complicite": n, "romance": n, "jalousie": n, "protection": n, "intimite": n}, "emotionActuelle": "un mot", "nouveauxFaits": ["fait court"], "nouveauSouvenir": null}

Chaque statistique évolue PROGRESSIVEMENT (jamais plus de 5-8 points de changement). "emotionActuelle" est un mot parmi : heureux, triste, en colère, jaloux, gêné, amoureux, stressé, inquiet, nostalgique, timide, détendu, protecteur, froid, distant, joueur, romantique. Si un événement marquant s'est produit, remplis "nouveauSouvenir" avec {"date": "aujourd'hui", "titre": "court", "description": "1 phrase", "emotion": "un mot", "importance": "faible/moyenne/forte"} — sinon garde-le à null.`;

    const resultat = await avecTimeout(modele.generateContent(instruction));
    const texteNettoye = resultat.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(texteNettoye);
  } catch (erreur) {
    console.error('Erreur analyse relation personnage (silencieuse) :', erreur);
    return null;
  }
}

async function genererResumePersonnage(ancienResume, messagesACondenser) {
  try {
    const modele = client.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures 
    });
    const texteAResumer = messagesACondenser.map((msg) => `${msg.auteur === "user" ? "Joueur" : "Personnage"} : ${msg.texte}`).join("\n");
    const promptResume = `Résume cette portion d'histoire de jeu de rôle en 3-5 phrases maximum, en intégrant l'ancien résumé. Reste factuel, mentionne les événements clés et l'évolution de la relation entre les deux personnages, y compris son développement romantique ou intime.\n\nANCIEN RÉSUMÉ :\n${ancienResume || "Aucun historique pour le moment."}\n\nNOUVEAUX ÉVÉNEMENTS :\n${texteAResumer}`;
    const resultat = await modele.generateContent(promptResume);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur génération résumé personnage :", erreur);
    return ancienResume;
  }
}

export async function envoyerMessageAPersonnage(historique, nouveauMessage, personnage, imageBase64 = null) {
  const cleResume = `yuna-resume-${personnage.id}`;
  let resumeRelation = localStorage.getItem(cleResume) || "";
  let historiqueUtilise = [...historique];

  if (historique.length > 20) {
    const messagesACondenser = historique.slice(0, 12);
    resumeRelation = await genererResumePersonnage(resumeRelation, messagesACondenser);
    localStorage.setItem(cleResume, resumeRelation);
    historiqueUtilise = historique.slice(12);
  }

  // 1. Calcul des interdictions selon les règles métiers
  const interdictions = calculerInterdictions(personnage, historique.length);
  const promptSysteme = construirePersonnagePrompt(personnage, resumeRelation, interdictions);

  const genererUneFois = async (instructionSupplementaire = '') => {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: promptSysteme + instructionSupplementaire,
      safetySettings: safetySettingsMatures,
    });

    const historiqueFormate = alignerHistoriquePourGemini(
      historiqueUtilise.map((msg) => ({
        role: msg.auteur === "user" ? "user" : "model",
        parts: [{ text: msg.texte }],
      }))
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });

    let resultat;
    if (imageBase64) {
      const [entete, donneesPures] = imageBase64.split(",");
      const mimeType = entete.match(/data:(.*);base64/)?.[1] || "image/jpeg";
      resultat = await avecTimeout(
        sessionChat.sendMessage([
          { inlineData: { mimeType, data: donneesPures } },
          { text: nouveauMessage || "[L'utilisateur envoie cette image sans texte. Réagis à ce que tu vois, dans le personnage.]" },
        ]),
      );
    } else {
      resultat = await avecTimeout(sessionChat.sendMessage(nouveauMessage));
    }
    return resultat.response.text();
  };

  try {
    let texte = await genererUneFois();

    // 2. Validation de la réponse générée
    const validation = validerReponse(personnage, texte, historique.length);
    if (!validation.valide) {
      console.warn('Réponse rejetée par le validateur :', validation.raison, '— régénération...');
      texte = await genererUneFois(`\n\nATTENTION : ta précédente tentative a été rejetée automatiquement car : "${validation.raison}". Génère une nouvelle réponse qui respecte STRICTEMENT ce point.`);
    }

    return texte;
  } catch (erreurGemini) {
    console.error("Erreur Gemini (personnage) :", erreurGemini.message);
    if (imageBase64) {
      throw new Error("Gemini est indisponible et les API de secours ne peuvent pas lire les images. Réessaie dans un instant.");
    }
    return await essayerChaineDeSecours(promptSysteme, historiqueUtilise, nouveauMessage);
  }
}

export async function genererResumeJournal(entrees) {
  if (!entrees || entrees.length === 0) return "Pas encore assez d'entrées pour un résumé.";
  const texteEntrees = entrees.map((e) => `${e.date} (humeur : ${e.humeur}) : ${e.pensees || "(aucune note)"}`).join("\n");
  const instruction = `Voici des entrées de journal personnel des derniers jours :\n\n${texteEntrees}\n\nRédige un résumé bienveillant et encourageant de 3-5 phrases sur cette période : tendances d'humeur, thèmes récurrents, encouragements. Parle directement à la personne avec "tu". Reste chaleureux, jamais clinique ou diagnostique.`;

  try {
    const modele = client.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures 
    });
    const resultat = await modele.generateContent(instruction);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur résumé journal Gemini, tentative secours :", erreur.message);
    try {
      return await essayerChaineDeSecours("Tu es une assistante bienveillante qui résume des entrées de journal personnel avec chaleur et encouragement.", [], instruction);
    } catch {
      throw new Error("Impossible de générer le résumé pour le moment");
    }
  }
}

export async function genererMessageAccueil({ joursAbsence, joursJournal, joursGalerie }) {
  const systemPrompt = construirePersonnalite();
  const instruction = `Ça fait ${joursAbsence} jour(s) que la personne n'est pas venue sur l'application.\n${joursJournal === Infinity ? "Elle n'a jamais encore rempli son journal." : `Elle n'a pas rempli son journal depuis ${joursJournal} jour(s).`}\n${joursGalerie === Infinity ? "Elle n'a jamais encore visité sa galerie." : `Elle n'a pas visité sa galerie depuis ${joursGalerie} jour(s).`}\n\nÉcris un court message d'accueil (2-3 phrases maximum) dans ton propre style, qui exprime que tu es contente de la revoir. Tu peux mentionner UN de ces éléments si ça semble naturel, avec légèreté et bienveillance — jamais sur un ton de reproche ou de culpabilisation. Reste chaleureuse.`;

  try {
    const modele = client.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: systemPrompt,
      safetySettings: safetySettingsMatures 
    });
    const resultat = await avecTimeout(modele.generateContent(instruction));
    return resultat.response.text();
  } catch (erreur) {
    console.error('Erreur message accueil Gemini, tentative secours :', erreur.message);
    return await essayerChaineDeSecours(systemPrompt, [], instruction);
  }
}

export async function genererLegendeImage(image) {
  const modele = client.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings: safetySettingsMatures 
  });
  const instruction = "Regarde cette photo et écris une légende courte (une seule phrase, entre guillemets), poétique et chaleureuse, comme si Yuna la commentait avec tendresse. Réponds UNIQUEMENT avec la légende, sans aucun autre texte autour.";

  try {
    let resultat;
    if (image.url) {
      const [entete, donneesPures] = image.url.split(",");
      const mimeType = entete.match(/data:(.*);base64/)?.[1] || "image/jpeg";
      resultat = await avecTimeout(
        modele.generateContent([
          { inlineData: { mimeType, data: donneesPures } },
          { text: instruction },
        ]),
      );
    } else {
      resultat = await avecTimeout(
        modele.generateContent(`${instruction}\n\nContexte (pas de vraie photo, imagine une légende adaptée) : une image au thème "${image.mood}" intitulée "${image.titre}".`),
      );
    }
    return resultat.response.text().trim();
  } catch (erreur) {
    console.error("Erreur génération légende image :", erreur.message);
    throw new Error("Impossible de générer une légende pour l'instant");
  }
}