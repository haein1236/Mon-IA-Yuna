import { client, safetySettingsMatures, avecTimeout } from "../ia/client";
import { ajouterSouvenirNiveau } from "../memoire";

/**
 * Extrait les faits marquants d'une conversation avec Yuna et les répartit
 * dynamiquement par niveau de mémoire (permanente, récente, émotionnelle,
 * habitudes) — voir services/memoire/moteurMemoire.js pour le stockage.
 */
export async function extraireEtMemoriserFaits(historique) {
  if (!historique || historique.length < 3) return;
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: safetySettingsMatures,
    });
    const conversationTexte = historique
      .map((msg) => `${msg.auteur === "user" ? "Personne" : "Yuna"} : ${msg.texte === "[NOTE_VOCALE]" ? "[note vocale]" : msg.texte}`)
      .join("\n");

    const instruction = `Voici un extrait de conversation entre une IA (Yuna) et une personne :

${conversationTexte}

Extrais les informations marquantes sur la personne en les classant par niveau. Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans balise markdown) :
{
  "permanente": ["faits durables : prénom, métier, ville, proches, loisirs ancrés"],
  "recente": ["faits temporaires ou projets en cours : révise un examen, stress du moment"],
  "emotionnelle": ["états d'esprit marquants : triste suite à une rupture, fier d'un projet"],
  "habitudes": ["routines observées : se couche tard, aime boire du café le matin"]
}
Chaque tableau peut être vide si rien ne correspond. Ignore les détails anodins.`;

    const resultat = await avecTimeout(modele.generateContent(instruction));
    const texteNettoye = resultat.response.text().trim().replace(/```json|```/g, "").trim();
    const faitsExtraits = JSON.parse(texteNettoye);

    if (faitsExtraits && typeof faitsExtraits === "object") {
      Object.keys(faitsExtraits).forEach((niveau) => {
        const items = faitsExtraits[niveau];
        if (Array.isArray(items) && items.length > 0) {
          ajouterSouvenirNiveau(niveau, items);
        }
      });
    }
  } catch (erreur) {
    console.error("Erreur extraction mémoire structurée (silencieuse) :", erreur);
  }
}