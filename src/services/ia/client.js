import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const cleAPI = import.meta.env.VITE_GEMINI_API_KEY;
export const client = new GoogleGenerativeAI(cleAPI);

// Configuration de sécurité débridée pour autoriser le contenu mature
// mais contrôlé par le prompt pour éviter les dérives immédiates.
export const safetySettingsMatures = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// SÉCURITÉ ANTI-BLOCAGE : limite le temps d'attente d'une requête
export function avecTimeout(promesse, ms = 20000) {
  return Promise.race([
    promesse,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("La réponse a mis trop de temps à arriver. Réessaie.")),
        ms,
      ),
    ),
  ]);
}