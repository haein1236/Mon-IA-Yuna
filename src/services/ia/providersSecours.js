import { avecTimeout } from "./client";

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

export async function essayerChaineDeSecours(systemPrompt, historique, nouveauMessage) {
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