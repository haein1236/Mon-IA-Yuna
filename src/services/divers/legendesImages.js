import { client, safetySettingsMatures, avecTimeout } from "../ia/client";

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