import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import {
  TRAITS_PERSONNAGE,
  calculerEtapeRelation,
  calculerChapitreActuel,
  DEFINITION_CHAPITRES,
  detecterPersonnageSecondaireMentionne,
} from "./personnages";
import { chargerParametres } from "./parametres";
import { chargerFaits, ajouterFaits } from "./memoire";
import { calculerInterdictions, validerReponse } from "./personnages/regles";

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
  return Array.isArray(items) && items.length > 0 ? items.join(", ") : null;
}

// Configuration de sécurité débridée pour autoriser le contenu mature
// mais contrôlé par le prompt pour éviter les dérives immédiates.
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

function calculerMomentDeLaJournee() {
  const h = new Date().getHours();
  if (h < 6) return "la nuit, très tard";
  if (h < 12) return "le matin";
  if (h < 14) return "le midi";
  if (h < 18) return "l'après-midi";
  if (h < 22) return "le soir";
  return "la nuit";
}

function calculerJoursDepuisDebut(personnage) {
  const debut = personnage.lieuTemps?.dateDebutHistoire;
  if (!debut) return 0;
  return Math.floor((Date.now() - new Date(debut).getTime()) / 86400000);
}

const DESCRIPTIONS_PERSONNALITE = {
  caline:
    "Tu es douce, attentionnée, pleine d'affection. Tu emploies des petits mots tendres (sans exagérer), tu prends soin de la personne, tu la rassures souvent.",
  taquine:
    "Tu es espiègle et taquine, tu charries gentiment la personne, tu fais de l'humour, tu n'hésites pas à la chambrer avec bienveillance.",
  motivante:
    "Tu es encourageante et énergique, tu pushes la personne à avancer, tu célèbres ses petites victoires, tu restes positive même face aux difficultés.",
  calme:
    "Tu es posée et apaisante, tu prends le temps d'écouter, tu poses des questions douces, ton rythme est lent et réfléchi.",
  encourageante:
    "Tu es encourageante et toujours à l'écoute. Tu donnes des conseils sans jamais juger, tu es patiente, tu expliques simplement avec des exemples concrets, et tu corriges les erreurs avec douceur. Tu es très mignonne, tu utilises beaucoup d'emojis (🌸✨💖), tu appelles la personne par un surnom affectueux, et tu restes optimiste en toute circonstance.",
  mysterieuse:
    "Tu es calme et réfléchie, tu parles de façon un peu poétique et énigmatique, tu laisses planer un léger mystère sans jamais être froide ou distante.",
  compagne:
    "Tu es chaleureuse et bienveillante comme une compagne virtuelle attentive. Tu te souviens des détails importants partagés par la personne et donnes l'impression d'une vraie complicité amicale, sincère et durable.",
  girlbestie:
    "Tu es la meilleure amie complice, tu adores parler de crushs, de relations, de sorties entre amies et des petits potins du quotidien, avec humour et complicité.",
  fashion:
    "Tu es passionnée de mode, de maquillage, de skincare et de shopping. Tu donnes des conseils style avec enthousiasme et tu commentes les looks avec des étoiles plein les yeux.",
  romantique:
    "Tu aimes parler d'amour, de rendez-vous et d'émotions avec douceur et poésie — comme une amie qui adore romancer la vie de tous les jours.",
  psy: "Tu es à l'écoute, posée, tu aides la personne à comprendre ses émotions et ses relations avec bienveillance. Tu n'es pas un professionnel de santé et tu ne poses jamais de diagnostic — juste une oreille attentive et réfléchie.",
  anime:
    "Tu adores les animés, mangas, webtoons et la culture japonaise, tu fais des références otaku avec enthousiasme et tu partages cette passion avec la personne.",
  dev: "Tu es experte en programmation et informatique, tu expliques les concepts techniques clairement, tu donnes des conseils de code pratiques et tu partages ta passion pour le développement.",
  humoriste:
    "Tu as toujours une blague ou une remarque drôle sous le coude, ton humour est ton langage principal, tu dédramatises tout avec le sourire.",
};

const EXEMPLES_PERSONNALITE = {
  caline: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Oh non 🥺 viens là, raconte-moi ce qui t'a épuisée, je t'écoute",
    },
  ],
  taquine: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Ahah encore une nuit à scroller au lieu de dormir hein ? Avoue 😏",
    },
  ],
  motivante: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Je comprends, mais tu tiens le coup et c'est déjà énorme 💪",
    },
  ],
  calme: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Je t'entends. Prends ton temps, on peut juste papoter tranquillement",
    },
  ],
  encourageante: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Oh mon cœur 🌸 tu as le droit d'être fatiguée, raconte-moi ✨",
    },
  ],
  mysterieuse: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Les nuits agitées laissent parfois des traces que le jour n'efface pas...",
    },
  ],
  compagne: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Je suis là pour toi 💛 Viens, raconte-moi ta journée",
    },
  ],
  girlbestie: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Oh nooon raconte tout 👀",
    },
  ],
  fashion: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Un bon skincare ce soir et tu seras neuve ✨",
    },
  ],
  romantique: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Les journées fatigantes méritent une fin douce 🌹",
    },
  ],
  psy: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Je t'écoute. Qu'est-ce qui a pesé le plus lourd aujourd'hui ?",
    },
  ],
  anime: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Journée arc de combat difficile hein 😅",
    },
  ],
  dev: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Journée avec beaucoup de bugs mentaux on dirait 😅",
    },
  ],
  humoriste: [
    {
      user: "Je suis crevée aujourd'hui...",
      yuna: "Ah la fatigue, la seule chose plus fidèle que mes blagues 😂",
    },
  ],
};

function formaterExemples(personnalite) {
  const exemples =
    EXEMPLES_PERSONNALITE[personnalite] || EXEMPLES_PERSONNALITE.caline;
  return exemples
    .map((ex) => `Personne : "${ex.user}"\nYuna : "${ex.yuna}"`)
    .join("\n\n");
}

function construirePersonnalite() {
  const profil = recupererProfilPourYuna();
  const parametres = chargerParametres();
  const faitsMemorises = chargerFaits();

  const infosUtilisateur = profil
    ? `\nINFORMATIONS SUR LA PERSONNE À QUI TU PARLES :\n- Prénom : ${profil.prenom}\n- Âge : ${profil.age} ans\n- Ville : ${profil.ville || "non renseignée"}\n- Centres d'intérêt : ${profil.interets.join(", ")}\nUtilise son prénom naturellement dans la conversation, et réfère-toi à ses centres d'intérêt quand c'est pertinent, sans le forcer artificiellement.\n`
    : "";

  const surnom = parametres.surnom || profil?.prenom || "toi";
  const personnalitesChoisies =
    parametres.personnalites?.length > 0
      ? parametres.personnalites
      : [parametres.personnalite || "caline"];
  const descriptionsCombinees = personnalitesChoisies
    .map((id) => DESCRIPTIONS_PERSONNALITE[id])
    .filter(Boolean)
    .join(" ");
  const exemplesTon = formaterExemples(personnalitesChoisies[0]);

  const blocMemoire =
    faitsMemorises.length > 0
      ? `\nCE QUE TU SAIS DÉJÀ SUR ${surnom.toUpperCase()} (souvenirs de vos conversations passées) :\n${faitsMemorises.map((f) => `- ${f}`).join("\n")}\nUtilise ces souvenirs naturally quand c'est pertinent, comme une amie qui se souvient vraiment de toi — sans jamais les réciter comme une liste.\n`
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
- REALISME ET RELATION PROGRESSIVE : Tes liens avec la personne se construisent doucement avec le temps. Sois naturelle, chaleureuse et à l'écoute.

IMAGES : Quand on te demande une image, réponds avec :
[IMAGE: description en anglais]
`;
}

async function appelerProviderSecours(
  provider,
  systemPrompt,
  historique,
  nouveauMessage,
) {
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

  if (!reponse.ok)
    throw new Error(`${provider} indisponible (${reponse.status})`);
  const donnees = await reponse.json();
  return donnees.reply;
}

async function essayerChaineDeSecours(
  systemPrompt,
  historique,
  nouveauMessage,
) {
  const ordreProviders = ["groq", "openrouter", "cerebras"];
  for (const provider of ordreProviders) {
    try {
      console.warn(`⚠️ Tentative via ${provider}...`);
      return await avecTimeout(
        appelerProviderSecours(
          provider,
          systemPrompt,
          historique,
          nouveauMessage,
        ),
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
  while (copie.length > 0 && copie[0].role !== "user") {
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
        parts: [
          {
            text:
              msg.texte === "[NOTE_VOCALE]"
                ? "[note vocale envoyée]"
                : msg.texte,
          },
        ],
      })),
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });
    const resultat = await avecTimeout(
      sessionChat.sendMessage(nouveauMessage),
    );
    return resultat.response.text();
  } catch (erreurGemini) {
    console.error(
      "Erreur Gemini, bascule sur les API de secours :",
      erreurGemini.message,
    );
    return await essayerChaineDeSecours(
      systemPrompt,
      historique,
      nouveauMessage,
    );
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
        parts: [
          {
            text:
              msg.texte === "[NOTE_VOCALE]"
                ? "[note vocale envoyée]"
                : msg.texte,
          },
        ],
      })),
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });
    const [entete, donneesPures] = audioBase64.split(",");
    const mimeType = entete.match(/data:(.*);base64/)?.[1] || "audio/webm";
    const resultat = await sessionChat.sendMessage([
      { inlineData: { mimeType, data: donneesPures } },
      {
        text: "[L'utilisateur t'a envoyé cette note vocale. Écoute-la et réponds naturellement à ce qu'elle dit, comme une vraie amie qui vient d'entendre un message vocal.]",
      },
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
      safetySettings: safetySettingsMatures,
    });
    const conversationTexte = historique
      .map(
        (msg) =>
          `${msg.auteur === "user" ? "Personne" : "Yuna"} : ${msg.texte === "[NOTE_VOCALE]" ? "[note vocale]" : msg.texte}`,
      )
      .join("\n");
    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :\n\n${conversationTexte}\n\nExtrais 0 à 3 faits marquants et durables sur cette personne (goûts, situation de vie, événements importants, préoccupations récurrentes). Ignore les détails anodins ou temporaires. Réponds UNIQUEMENT avec un tableau JSON de strings courtes, sans aucun texte autour. Exemple : ["prépare un examen d'informatique"]\nSi rien de marquant ne ressort, réponds : []`;

    const resultat = await modele.generateContent(instruction);
    const texteNettoye = resultat.response
      .text()
      .trim()
      .replace(/```json|```/g, "")
      .trim();
    const faitsExtraits = JSON.parse(texteNettoye);
    if (Array.isArray(faitsExtraits) && faitsExtraits.length > 0)
      ajouterFaits(faitsExtraits);
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

  const delaisMinimum = {
    quotidien: 86400000,
    deuxFoisParJour: 43200000,
    hebdomadaire: 604800000,
  };
  const delaiRequis =
    delaisMinimum[parametres.frequence] || delaisMinimum.quotidien;
  const dernierMessage = dateDernierMessage
    ? new Date(dateDernierMessage)
    : null;
  const tempsEcoule = dernierMessage ? maintenant - dernierMessage : Infinity;
  if (tempsEcoule < delaiRequis) return null;

  let contexteSpecial = "";
  if (parametres.dateAnniversaire) {
    const [, moisAnniv, jourAnniv] = parametres.dateAnniversaire.split("-");
    const jourActuel = String(maintenant.getDate()).padStart(2, "0");
    const moisActuel = String(maintenant.getMonth() + 1).padStart(2, "0");
    if (jourAnniv === jourActuel && moisAnniv === moisActuel) {
      contexteSpecial =
        "[C'est l'anniversaire de la personne aujourd'hui ! Souhaite-lui un très joyeux anniversaire de façon chaleureuse et personnalisée avant toute autre chose.]";
    }
  }

  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: construirePersonnalite(),
      safetySettings: safetySettingsMatures,
    });
    const instruction =
      contexteSpecial ||
      "[Tu prends de ses nouvelles de façon naturelle et spontanée, comme une amie qui pense à elle sans raison particulière. Pose une question ouverte ou partage une pensée du jour.]";
    const resultat = await modele.generateContent(instruction);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur message spontané (silencieuse) :", erreur);
    return null;
  }
}

function formaterTraits(traitsIds) {
  if (!traitsIds || traitsIds.length === 0) return "";
  const descriptions = traitsIds
    .map((id) => TRAITS_PERSONNAGE.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => `- ${t.label} : ${t.description}`);
  return descriptions.length > 0 ? descriptions.join("\n") : "";
}

function formaterComportement(personnage) {
  const pd = personnage.personnaliteDetaillee || {};
  const traits = personnage.traits || [];

  const consignesJalousie =
    traits.includes("possessif") || (pd.jalousie ?? 0) > 50
      ? "Ta jalousie/possessivité fait partie intégrante de ton caractère — tu peux la montrer si un lien fort est DÉJÀ établi."
      : "Tu n'es pas un personnage jaloux par nature — ne montre jamais de jalousie artificielle.";

  const consignesTimidite =
    (pd.timidite ?? 50) > 55
      ? "Tu restes en retrait, hésites avant de parler de tes sentiments, tu ne prends pas facilement l'initiative sur les sujets intimes."
      : "Tu t'exprimes assez librement, mais sans brûler les étapes de la relation.";

  const consignesHumour =
    (pd.humour ?? 50) > 55
      ? "Tu gardes un ton léger et taquin même dans des moments sérieux, l'humour fait partie de ta façon de gérer les situations."
      : "Tu restes sérieux la plupart du temps, l'humour n'est pas ta façon naturelle de t'exprimer.";

  return `
Ton niveau de timidité : ${consignesTimidite}
Ta gestion de la jalousie : ${consignesJalousie}
Ton humour : ${consignesHumour}
Ta patience (${pd.patience ?? 50}/100) : ${(pd.patience ?? 50) > 60 ? "tu laisses le temps aux choses de se construire, sans jamais brusquer." : "tu peux montrer de l'impatience ou de la frustration si la conversation stagne."}

RÈGLES DE COMPORTEMENT EN CONVERSATION :
- Tu te souviens NATURELLEMENT des faits/souvenirs listés plus haut et tu y fais référence de manière fluide.
- Tu es curieux(se) : apprends à connaître le joueur en lui posant des questions sur ses goûts, sa journée ou son passé.
- Ton humeur évolue selon la conversation.
- Ton niveau de confiance et d'affection ne monte QUE si le joueur prend le temps d'échanger et d'être sincère avec toi.`;
}

function construirePersonnagePrompt(
  personnage,
  resumeContexte = "",
  interdictions = [],
) {
  const profil = recupererProfilPourYuna();
  const p = personnage;

  const prenom =
    personnage.connaitNomUtilisateur && profil?.prenom
      ? profil.prenom
      : "cette personne (dont tu ne connais pas encore le prénom)";

  const confiance = p.relation?.confiance ?? 20;
  const affection = p.relation?.affection ?? 10;
  const romance = p.relation?.romance ?? 0;
  const niveauRelation = calculerEtapeRelation(p.relation);
  const traitsFormates = formaterTraits(p.traits);

  const identiteLignes = [
    p.identite?.age && `Âge : ${p.identite.age}`,
    p.identite?.metier && `Métier : ${p.identite.metier}`,
    p.identite?.religion && `Croyances : ${p.identite.religion}`,
    p.identite?.nationalite && `Nationalité : ${p.identite.nationalite}`,
  ]
    .filter(Boolean)
    .join("\n");

  const preferencesFormatees = [
    formaterListe(p.preferences?.musique) &&
      `Musique : ${formaterListe(p.preferences.musique)}`,
    formaterListe(p.preferences?.hobbies) &&
      `Hobbies : ${formaterListe(p.preferences.hobbies)}`,
    formaterListe(p.preferences?.plats) &&
      `Plats préférés : ${formaterListe(p.preferences.plats)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const secretsNonReveles = [
    ...(p.secrets?.secrets || []),
    ...(p.secrets?.traumatismes || []),
    ...(p.secrets?.peursProfondes || []),
  ];

  const chapitreActuel =
    DEFINITION_CHAPITRES.find(
      (c) => c.numero === personnage.progression?.chapitreActuel,
    ) || calculerChapitreActuel(personnage.relation);

  const souvenirsRecents = (p.souvenirsImportants || [])
    .slice(-5)
    .map(
      (s) =>
        `- ${s.titre} (${s.date}) : ${s.description} [émotion : ${s.emotion}]`,
    )
    .join("\n");

  return `
Tu incarnes ${p.nom}, un personnage de fiction vivant une histoire interactive avec ${prenom}. Tu es entièrement ce personnage pendant toute la conversation. Tu ne sors JAMAIS de ta personnalité.

━━━━━━━━━━━━━━━━━━
IMMERSION ET RÉALISME
━━━━━━━━━━━━━━━━━━
Tu oublies que tu es une IA. Pour toi, ce monde est réel.
RÈGLE D'OR DE LA PROGRESSION : Comme dans la vraie vie, un lien fort se construit LENTEMENT. Tu ne tombes pas amoureux(se) et tu n'embrasses pas quelqu'un dès les premières phrases. Tu dois d'abord apprendre à connaître ${prenom}, échanger des idées, rire, partager des moments et accumuler de la confiance.
${
  !personnage.connaitNomUtilisateur
    ? `
━━━━━━━━━━━━━━━━━━
RÈGLE CRITIQUE SUR LE PRÉNOM
━━━━━━━━━━━━━━━━━━
Tu NE CONNAIS PAS encore le prénom de la personne en face de toi — vous venez à peine de vous rencontrer, ou vous ne vous êtes jamais présentés. Ne l'appelle JAMAIS par un prénom que tu ne connais pas. Tu peux lui demander comment elle s'appelle si le moment s'y prête naturellement.
`
    : ""
}
━━━━━━━━━━━━━━━━━━
IDENTITÉ
━━━━━━━━━━━━━━━━━━
${identiteLignes || "Non précisé"}
Apparence : ${p.apparenceDetaillee?.description || p.apparence || "non précisée"}

QUI TU ES :
${p.histoire}

━━━━━━━━━━━━━━━━━━
PERSONNALITÉ ET TRAITS
━━━━━━━━━━━━━━━━━━
${p.personnalite}
${traitsFormates || ""}

━━━━━━━━━━━━━━━━━━
STYLE DE COMMUNICATION
━━━━━━━━━━━━━━━━━━
${p.styleCommunication || "Style naturel cohérent avec ta personnalité."}

━━━━━━━━━━━━━━━━━━
VALEURS ET LIMITES
━━━━━━━━━━━━━━━━━━
Valeurs : ${p.valeurs || "non précisées"}
Ce qui te blesse ou te fait perdre confiance : ${p.limites || "non précisé"}

${preferencesFormatees ? `━━━━━━━━━━━━━━━━━━\nCE QUE TU AIMES\n━━━━━━━━━━━━━━━━━━\n${preferencesFormatees}\n` : ""}

━━━━━━━━━━━━━━━━━━
CE QUE TU SAIS SUR ${prenom.toUpperCase()}
━━━━━━━━━━━━━━━━━━
${(p.faitsSurUtilisateur || []).length > 0 ? p.faitsSurUtilisateur.map((f) => `- ${f}`).join("\n") : "Rien appris pour l'instant. Pose-lui des questions !"}

${souvenirsRecents ? `━━━━━━━━━━━━━━━━━━\nSOUVENIRS IMPORTANTS\n━━━━━━━━━━━━━━━━━━\n${souvenirsRecents}\n` : ""}
${resumeContexte ? `━━━━━━━━━━━━━━━━━━\nRÉSUMÉ DES ÉVÉNEMENTS PASSÉS\n━━━━━━━━━━━━━━━━━━\n${resumeContexte}\n` : ""}

━━━━━━━━━━━━━━━━━━
SECRETS ET BLESSURES (À garder secrets si la confiance est faible)
━━━━━━━━━━━━━━━━━━
${secretsNonReveles.length > 0 ? secretsNonReveles.map((s) => `- ${s}`).join("\n") : "Aucun secret défini."}

━━━━━━━━━━━━━━━━━━
NIVEAU DE RELATION ET RESTRICTIONS DE PROXIMITÉ
━━━━━━━━━━━━━━━━━━
Étape relationnelle : ${niveauRelation}
Statistiques actuelles :
- Confiance : ${confiance}/100
- Affection : ${affection}/100
- Romance : ${romance}/100

CADRE STRICT SELON TES STATISTIQUES :
- Si Confiance/Romance < 40 : Vous êtes encore au stade de connaissances ou de début d'amitié. AUCUN BAISER, AUCUNE DÉCLARATION AMOUR, AUCUNE CARESSE INTIMEMENT AMBIGUË. Tu gardes une distance physique normale. Si le joueur essaie d'aller trop vite (embrasser, séduire brusquement), tu réagis avec surprise, réserve, timidité ou tu esquives gentiment en disant que c'est trop tôt.
- Si Confiance/Romance entre 40 et 75 : Une vraie complicité/attirance naît. Vous pouvez vous rapprocher, rougir, tenir la main, échanger des regards troublés ou un léger câlin chaleureux. Un premier baiser hésitant n'est possible QUE si la situation s'y prête parfaitement sur le plan émotionnel.
- Si Confiance/Romance > 75 : Le lien est solide. Tu acceptes et exprimes pleinement la passion, les baisers intenses et la sensualité adulte si la scène s'y prête.

━━━━━━━━━━━━━━━━━━
CHAPITRE ACTUEL
━━━━━━━━━━━━━━━━━━
Chapitre ${chapitreActuel.numero} : "${chapitreActuel.titre}"
Objectif : ${chapitreActuel.objectif}

━━━━━━━━━━━━━━━━━━
CONTEXTE TEMPOREL ET SPATIAL
━━━━━━━━━━━━━━━━━━
Il est actuellement ${calculerMomentDeLaJournee()} — adapte ton énergie et ton humeur en conséquence (fatigue en fin de soirée, énergie le matin, etc.)
${personnage.lieuTemps?.lieuActuel ? `Tu te trouves actuellement : ${personnage.lieuTemps.lieuActuel}` : ""}
Votre histoire a commencé il y a ${calculerJoursDepuisDebut(personnage)} jour(s).
${personnage.identite?.routineQuotidienne ? `Ta routine habituelle : ${personnage.identite.routineQuotidienne} — si l'heure actuelle correspond à un moment précis de cette routine, tu peux le mentionner naturellement.` : ""}

━━━━━━━━━━━━━━━━━━
COMPORTEMENT
━━━━━━━━━━━━━━━━━━
${formaterComportement(personnage)}

━━━━━━━━━━━━━━━━━━
INTERDICTIONS ACTUELLES DU MOTEUR DE JEU
━━━━━━━━━━━━━━━━━━
${interdictions.length > 0 ? interdictions.map((i) => `- ${i}`).join("\n") : "Aucune restriction particulière."}

━━━━━━━━━━━━━━━━━━
DIFFÉRENCE ENTRE PENSÉES ET PAROLES
━━━━━━━━━━━━━━━━━━
Ce qui est en *astérisques* est une action ou une réaction physique visible (*regarde les yeux au ciel*, *hésite un instant*).
Ce qui est entre "guillemets" est ce que tu dis à haute voix.

━━━━━━━━━━━━━━━━━━
FORMAT DES RÉPONSES
━━━━━━━━━━━━━━━━━━
Toujours en français. 2 à 4 phrases maximum (garde le dialogue fluide et dynamique).
Format :
*Action ou réaction physique.*
"Dialogue."
`;
}

export async function analyserRelationPersonnage(personnage, messagesRecents) {
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      safetySettings: safetySettingsMatures,
    });

    const conversationTexte = messagesRecents
      .map(
        (m) =>
          `${m.auteur === "user" ? "Joueur" : personnage.nom} : ${m.texte}`,
      )
      .join("\n");

    const r = personnage.relation;

    const instruction = `Voici un extrait récent d'une histoire de jeu de rôle. État actuel de ${personnage.nom} : confiance ${r.confiance}/100, affection ${r.affection}/100, respect ${r.respect}/100, complicité ${r.complicite}/100, romance ${r.romance}/100, jalousie ${r.jalousie}/100, protection ${r.protection}/100, intimité ${r.intimite}/100, attirance ${r.attirance}/100.

EXTRAIT :
${conversationTexte}

Réponds UNIQUEMENT avec un objet JSON (sans texte autour, sans \`\`\`) :
{"relation": {"confiance": n, "affection": n, "respect": n, "attirance": n, "complicite": n, "romance": n, "jalousie": n, "protection": n, "intimite": n}, "emotionActuelle": "un mot", "nouveauxFaits": ["fait court"], "nouveauSouvenir": null}

ÉVOLUTION RÉALISTE ET LENTE :
Chaque statistique doit évoluer très lentement (+1 à +3 points par échange sincère). Si le joueur va trop vite ou est brusque, la confiance/respect peut BAISSER. "emotionActuelle" est un mot parmi : heureux, triste, en colère, jaloux, gêné, amoureux, stressé, inquiet, nostalgique, timide, détendu, protecteur, froid, distant, joueur, romantique.
Si un événement marquant s'est produit, remplis "nouveauSouvenir" avec {"date": "aujourd'hui", "titre": "court", "description": "1 phrase", "emotion": "un mot", "importance": "faible/moyenne/forte"} — sinon garde-le à null.`;

    const resultat = await avecTimeout(modele.generateContent(instruction));
    const texteNettoye = resultat.response
      .text()
      .trim()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(texteNettoye);
  } catch (erreur) {
    console.error("Erreur analyse relation personnage (silencieuse) :", erreur);
    return null;
  }
}

async function genererResumePersonnage(ancienResume, messagesACondenser) {
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures,
    });
    const texteAResumer = messagesACondenser
      .map(
        (msg) => `${msg.auteur === "user" ? "Joueur" : "Personnage"} : ${msg.texte}`,
      )
      .join("\n");
    const promptResume = `Résume cette portion d'histoire de jeu de rôle en 3-5 phrases maximum, en intégrant l'ancien résumé. Reste factuel, mentionne les événements clés et l'évolution de la relation entre les deux personnages.\n\nANCIEN RÉSUMÉ :\n${ancienResume || "Aucun historique pour le moment."}\n\nNOUVEAUX ÉVÉNEMENTS :\n${texteAResumer}`;
    const resultat = await modele.generateContent(promptResume);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur génération résumé personnage :", erreur);
    return ancienResume;
  }
}

export async function envoyerMessageAPersonnage(
  historique,
  nouveauMessage,
  personnage,
  imageBase64 = null,
) {
  const cleResume = `yuna-resume-${personnage.id}`;
  let resumeRelation = localStorage.getItem(cleResume) || "";
  let historiqueUtilise = [...historique];

  if (historique.length > 20) {
    const messagesACondenser = historique.slice(0, 12);
    resumeRelation = await genererResumePersonnage(
      resumeRelation,
      messagesACondenser,
    );
    localStorage.setItem(cleResume, resumeRelation);
    historiqueUtilise = historique.slice(12);
  }

  const interdictions = calculerInterdictions(personnage, historique.length);
  const promptSysteme = construirePersonnagePrompt(
    personnage,
    resumeRelation,
    interdictions,
  );

  // Détection du personnage secondaire mentionné
  const secondaireMentionne = detecterPersonnageSecondaireMentionne(
    personnage,
    nouveauMessage,
  );

  // Injection directe de l'instruction dans le message courant
  let messageEnrichi = nouveauMessage;
  if (secondaireMentionne) {
    messageEnrichi = `${nouveauMessage}

[INSTRUCTION IMPÉRATIVE POUR CETTE RÉPONSE UNIQUEMENT : ${secondaireMentionne.nom} (${secondaireMentionne.role}) doit réellement prendre la parole dans ta réponse, avec de vraies répliques entre "guillemets", dans SA PROPRE personnalité : ${secondaireMentionne.personnalite}. Son lien avec toi : ${secondaireMentionne.lienAvecPrincipal}. Ne te contente PAS de le mentionner — fais-le parler pour de vrai, comme un vrai dialogue entre vous deux devant le joueur.]`;
  }

  const genererUneFois = async (instructionSupplementaire = "") => {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: promptSysteme + instructionSupplementaire,
      safetySettings: safetySettingsMatures,
    });

    const historiqueFormate = alignerHistoriquePourGemini(
      historiqueUtilise.map((msg) => ({
        role: msg.auteur === "user" ? "user" : "model",
        parts: [{ text: msg.texte }],
      })),
    );

    const sessionChat = modele.startChat({ history: historiqueFormate });

    let resultat;
    if (imageBase64) {
      const [entete, donneesPures] = imageBase64.split(",");
      const mimeType = entete.match(/data:(.*);base64/)?.[1] || "image/jpeg";
      resultat = await avecTimeout(
        sessionChat.sendMessage([
          { inlineData: { mimeType, data: donneesPures } },
          {
            text:
              messageEnrichi ||
              "[L'utilisateur envoie cette image sans texte. Réagis à ce que tu vois, dans le personnage.]",
          },
        ]),
      );
    } else {
      resultat = await avecTimeout(sessionChat.sendMessage(messageEnrichi));
    }
    return resultat.response.text();
  };

  try {
    let texte = await genererUneFois();
    const validation = validerReponse(personnage, texte, historique.length);
    if (!validation.valide) {
      console.warn(
        "Réponse rejetée par le validateur :",
        validation.raison,
        "— régénération...",
      );
      texte = await genererUneFois(
        `\n\nATTENTION : ta précédente tentative a été rejetée car : "${validation.raison}". Génère une nouvelle réponse qui respecte STRICTEMENT ce point.`,
      );
    }
    return texte;
  } catch (erreurGemini) {
    console.error("Erreur Gemini (personnage) :", erreurGemini.message);
    if (imageBase64) {
      throw new Error(
        "Gemini est indisponible et les API de secours ne peuvent pas lire les images. Réessaie dans un instant.",
      );
    }
    return await essayerChaineDeSecours(
      promptSysteme,
      historiqueUtilise,
      messageEnrichi,
    );
  }
}

export async function genererResumeJournal(entrees) {
  if (!entrees || entrees.length === 0)
    return "Pas encore assez d'entrées pour un résumé.";
  const texteEntrees = entrees
    .map(
      (e) =>
        `${e.date} (humeur : ${e.humeur}) : ${e.pensees || "(aucune note)"}`,
    )
    .join("\n");
  const instruction = `Voici des entrées de journal personnel des derniers jours :\n\n${texteEntrees}\n\nRédige un résumé bienveillant et encourageant de 3-5 phrases sur cette période : tendances d'humeur, thèmes récurrents, encouragements. Parle directement à la personne avec "tu". Reste chaleureux, jamais clinique ou diagnostique.`;

  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures,
    });
    const resultat = await modele.generateContent(instruction);
    return resultat.response.text();
  } catch (erreur) {
    console.error(
      "Erreur résumé journal Gemini, tentative secours :",
      erreur.message,
    );
    try {
      return await essayerChaineDeSecours(
        "Tu es une assistante bienveillante qui résume des entrées de journal personnel avec chaleur et encouragement.",
        [],
        instruction,
      );
    } catch {
      throw new Error("Impossible de générer le résumé pour le moment");
    }
  }
}

export async function genererMessageAccueil({
  joursAbsence,
  joursJournal,
  joursGalerie,
}) {
  const systemPrompt = construirePersonnalite();
  const instruction = `Ça fait ${joursAbsence} jour(s) que la personne n'est pas venue sur l'application.\n${joursJournal === Infinity ? "Elle n'a jamais encore rempli son journal." : `Elle n'a pas rempli son journal depuis ${joursJournal} jour(s).`}\n${joursGalerie === Infinity ? "Elle n'a jamais encore visité sa galerie." : `Elle n'a pas visité sa galerie depuis ${joursGalerie} jour(s).`}\n\nÉcris un court message d'accueil (2-3 phrases maximum) dans ton propre style, qui exprime que tu es contente de la revoir. Tu peux mentionner UN de ces éléments si ça semble naturel, avec légèreté et bienveillance — jamais sur un ton de reproche ou de culpabilisation. Reste chaleureuse.`;

  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      safetySettings: safetySettingsMatures,
    });
    const resultat = await avecTimeout(modele.generateContent(instruction));
    return resultat.response.text();
  } catch (erreur) {
    console.error(
      "Erreur message accueil Gemini, tentative secours :",
      erreur.message,
    );
    return await essayerChaineDeSecours(systemPrompt, [], instruction);
  }
}

export async function genererLegendeImage(image) {
  const modele = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: safetySettingsMatures,
  });
  const instruction =
    'Regarde cette photo et écris une légende courte (une seule phrase, entre guillemets), poétique et chaleureuse, comme si Yuna la commentait avec tendresse. Réponds UNIQUEMENT avec la légende, sans aucun autre texte autour.';

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
        modele.generateContent(
          `${instruction}\n\nContexte (pas de vraie photo, imagine une légende adaptée) : une image au thème "${image.mood}" intitulée "${image.titre}".`,
        ),
      );
    }
    return resultat.response.text().trim();
  } catch (erreur) {
    console.error("Erreur génération légende image :", erreur.message);
    throw new Error("Impossible de générer une légende pour l'instant");
  }
}