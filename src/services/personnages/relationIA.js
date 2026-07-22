import { client, safetySettingsMatures, avecTimeout } from "../ia/client";

export async function analyserRelationPersonnage(personnage, messagesRecents) {
  try {
    const modele = client.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      safetySettings: safetySettingsMatures,
    });

    const conversationTexte = messagesRecents
      .map((m) => `${m.auteur === "user" ? "Joueur" : personnage.nom} : ${m.texte}`)
      .join("\n");

    const r = personnage.relation;

    const instruction = `Voici un extrait récent d'une histoire de jeu de rôle. État actuel de ${personnage.nom} : confiance ${r.confiance}/100, affection ${r.affection}/100, respect ${r.respect}/100, complicité ${r.complicite}/100, romance ${r.romance}/100, jalousie ${r.jalousie}/100, protection ${r.protection}/100, intimité ${r.intimite}/100, attirance ${r.attirance}/100.

EXTRAIT :
${conversationTexte}

Réponds UNIQUEMENT avec un objet JSON (sans texte autour, sans \`\`\`) :
{"relation": {"confiance": n, "affection": n, "respect": n, "attirance": n, "complicite": n, "romance": n, "jalousie": n, "protection": n, "intimite": n}, "emotionActuelle": "un mot", "nouveauxFaits": ["fait court"], "nouveauSouvenir": null, "nouvellesHabitudes": [], "nouvellesPromesses": []}

"nouvellesHabitudes" : routines ou préférences répétées que tu observes chez le joueur (ex: "boit toujours son café noir", "évite de parler de sa famille"). Laisse vide si rien de nouveau.
"nouvellesPromesses" : engagements pris par l'un des deux personnages durant cet extrait (ex: "a promis de l'appeler demain soir"). Laisse vide si rien de nouveau.

ÉVOLUTION RÉALISTE ET LENTE :
Chaque statistique doit évoluer très lentement (+1 à +3 points par échange sincère). Si le joueur va trop vite ou est brusque, la confiance/respect peut BAISSER. "emotionActuelle" est un mot parmi : heureux, triste, en colère, jaloux, gêné, amoureux, stressé, inquiet, nostalgique, timide, détendu, protecteur, froid, distant, joueur, romantique.
Si un événement marquant s'est produit, remplis "nouveauSouvenir" avec {"date": "aujourd'hui", "titre": "court", "description": "1 phrase", "emotion": "un mot", "importance": "faible/moyenne/forte"} — sinon garde-le à null.`;

    const resultat = await avecTimeout(modele.generateContent(instruction));
    const texteNettoye = resultat.response.text().trim().replace(/```json|```/g, "").trim();
    return JSON.parse(texteNettoye);
  } catch (erreur) {
    console.error("Erreur analyse relation personnage (silencieuse) :", erreur);
    return null;
  }
}