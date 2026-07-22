import { client, safetySettingsMatures, avecTimeout } from "../ia/client";
import { essayerChaineDeSecours } from "../ia/providersSecours";

export async function genererResumeJournal(entrees) {
  if (!entrees || entrees.length === 0)
    return "Pas encore assez d'entrées pour un résumé.";
  const texteEntrees = entrees
    .map((e) => `${e.date} (humeur : ${e.humeur}) : ${e.pensees || "(aucune note)"}`)
    .join("\n");
  const instruction = `Voici des entrées de journal personnel des derniers jours :\n\n${texteEntrees}\n\nRédige un résumé bienveillant et encourageant de 3-5 phrases sur cette période : tendances d'humeur, thèmes récurrents, encouragements. Parle directement à la personne avec "tu". Reste chaleureux, jamais clinique ou diagnostique.`;

  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures,
    });
    const resultat = await avecTimeout(modele.generateContent(instruction));
    return resultat.response.text();
  } catch (erreur) {
    console.error("Erreur résumé journal Gemini, tentative secours :", erreur.message);
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