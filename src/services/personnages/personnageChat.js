import { client, safetySettingsMatures, avecTimeout } from "../ia/client";
import { alignerHistoriquePourGemini, calculerJoursDepuisDebut } from "../ia/utils";
import { essayerChaineDeSecours } from "../ia/providersSecours";
import { construirePersonnagePrompt } from "./promptPersonnage";
import {
  calculerInterdictions,
  validerReponse,
  calculerInterdictionsSecondaires,
  validerReponseScene,
  detecterEvenementsVecus,
} from "./regles";
import { mettreAJourScene, construireInstructionScene } from "./moteurScene";
import { marquerEvenementsVecus } from "../personnages";

async function genererResumePersonnage(ancienResume, messagesACondenser) {
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures,
    });
    const texteAResumer = messagesACondenser
      .map((msg) => `${msg.auteur === "user" ? "Joueur" : "Personnage"} : ${msg.texte}`)
      .join("\n");
    const promptResume = `Résume cette portion d'histoire de jeu de rôle en 3-5 phrases maximum, en intégrant l'ancien résumé. Reste factuel, mentionne les événements clés et l'évolution de la relation entre les deux personnages.\n\nANCIEN RÉSUMÉ :\n${ancienResume || "Aucun historique pour le moment."}\n\nNOUVEAUX ÉVÉNEMENTS :\n${texteAResumer}`;
    const resultat = await avecTimeout(modele.generateContent(promptResume));
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur génération résumé personnage :", erreur);
    return ancienResume;
  }
}

// NOUVEAU — construit une liste noire des 2 dernières actions/répliques du
// personnage, pour que le modèle voie concrètement ce qu'il doit éviter
// de répéter cette fois-ci (plus efficace qu'une règle générique dans le prompt)
function construireAntiRepetition(historique) {
  const dernieresReponses = [...historique]
    .reverse()
    .filter((m) => m.auteur !== "user")
    .slice(0, 2)
    .map((m) => m.texte);

  if (dernieresReponses.length === 0) return "";

  return `\n\n[NE RÉPÈTE PAS ce que tu as déjà dit/fait dans tes 2 derniers messages :\n${dernieresReponses.map((t) => `- "${t.slice(0, 150)}${t.length > 150 ? "..." : ""}"`).join("\n")}\nVarie ton action, ta formulation, ou ton angle.]`;
}

export async function envoyerMessageAPersonnage(
  historique,
  nouveauMessage,
  personnage,
  imageBase64 = null,
  estContinuation = false,
) {
  const cleResume = `yuna-resume-${personnage.id}`;
  let resumeRelation = localStorage.getItem(cleResume) || "";
  let historiqueUtilise = [...historique];

  if (historique.length > 20) {
    const messagesACondenser = historique.slice(0, 12);
    resumeRelation = await genererResumePersonnage(resumeRelation, messagesACondenser);
    localStorage.setItem(cleResume, resumeRelation);
    historiqueUtilise = historique.slice(12);
  }

  const joursDepuisDebut = calculerJoursDepuisDebut(personnage);

  const dernierMessagePersonnage = [...historique].reverse().find((m) => m.auteur !== "user")?.texte || "";

  const detectionScene = mettreAJourScene(personnage, nouveauMessage, dernierMessagePersonnage, { estContinuation });
  const instructionScene = construireInstructionScene(personnage, detectionScene);
  const instructionAntiRepetition = construireAntiRepetition(historique);

  const interdictions = [
    ...calculerInterdictions(personnage, historique.length, joursDepuisDebut),
    ...calculerInterdictionsSecondaires(detectionScene.nommes),
  ];
  const promptSysteme = construirePersonnagePrompt(personnage, resumeRelation, interdictions);

  const messageEnrichi = nouveauMessage;

  const genererUneFois = async (instructionSupplementaire = "") => {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: promptSysteme + instructionScene + instructionAntiRepetition + instructionSupplementaire,
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
          { text: messageEnrichi || "[L'utilisateur envoie cette image sans texte. Réagis à ce que tu vois, dans le personnage.]" },
        ]),
      );
    } else {
      resultat = await avecTimeout(sessionChat.sendMessage(messageEnrichi));
    }
    return resultat.response.text();
  };

  try {
    let texte = await genererUneFois();

    const validationPrincipal = validerReponse(personnage, texte, historique.length, joursDepuisDebut);
    const validationScene = validationPrincipal.valide
      ? validerReponseScene(detectionScene.nommes, detectionScene.improvises, detectionScene.demandeParole, texte)
      : validationPrincipal;

    if (!validationScene.valide) {
      console.warn("Réponse rejetée par le validateur :", validationScene.raison, "— régénération...");
      texte = await genererUneFois(
        `\n\nATTENTION : ta précédente tentative a été rejetée car : "${validationScene.raison}". Génère une nouvelle réponse qui respecte STRICTEMENT ce point.`,
      );
    }

    // NOUVEAU — enregistre les événements réellement vécus (baiser,
    // déclaration) une fois la réponse validée, pour que les futures
    // références à cet événement soient légitimes.
    const evenementsDetectes = detecterEvenementsVecus(texte);
    if (Object.keys(evenementsDetectes).length > 0) {
      marquerEvenementsVecus(personnage.id, evenementsDetectes);
    }

    return texte;
  } catch (erreurGemini) {
    console.error("Erreur Gemini (personnage) :", erreurGemini.message);
    if (imageBase64) {
      throw new Error("Gemini est indisponible et les API de secours ne peuvent pas lire les images. Réessaie dans un instant.");
    }
    return await essayerChaineDeSecours(promptSysteme + instructionScene, historiqueUtilise, messageEnrichi);
  }
}