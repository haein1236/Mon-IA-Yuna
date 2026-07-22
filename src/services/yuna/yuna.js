import { client, safetySettingsMatures, avecTimeout } from "../ia/client";
import { alignerHistoriquePourGemini } from "../ia/utils";
import { essayerChaineDeSecours } from "../ia/providersSecours";
import { construirePersonnalite } from "./promptYuna";
import { chargerParametres } from "../parametres";

function formaterHistoriquePourGemini(historique) {
  return alignerHistoriquePourGemini(
    historique.map((msg) => ({
      role: msg.auteur === "user" ? "user" : "model",
      parts: [{ text: msg.texte === "[NOTE_VOCALE]" ? "[note vocale envoyée]" : msg.texte }],
    })),
  );
}

export async function envoyerMessageAYuna(historique, nouveauMessage) {
  const systemPrompt = construirePersonnalite();
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      safetySettings: safetySettingsMatures,
    });

    const sessionChat = modele.startChat({ history: formaterHistoriquePourGemini(historique) });
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

    const sessionChat = modele.startChat({ history: formaterHistoriquePourGemini(historique) });
    const [entete, donneesPures] = audioBase64.split(",");
    const mimeType = entete.match(/data:(.*);base64/)?.[1] || "audio/webm";
    const resultat = await sessionChat.sendMessage([
      { inlineData: { mimeType, data: donneesPures } },
      { text: "[L'utilisateur t'a envoyé cette note vocale. Écoute-la et réponds naturellement à ce qu'elle dit, comme une vraie amie qui vient d'entendre un message vocal.]" },
    ]);
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur note vocale Gemini :", erreur);
    throw new Error("Impossible d'écouter le vocal pour le moment");
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
    const resultat = await avecTimeout(modele.generateContent(instruction));
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur message spontané (silencieuse) :", erreur);
    return null;
  }
}

export async function genererMessageAccueil({ joursAbsence, joursJournal, joursGalerie }) {
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
    console.error("Erreur message accueil Gemini, tentative secours :", erreur.message);
    return await essayerChaineDeSecours(systemPrompt, [], instruction);
  }
}