// ============================================================
// gemini.js — POINT D'ENTRÉE UNIQUE, POUR COMPATIBILITÉ
// ============================================================
// Ce fichier ne contient plus de logique : toute la logique a été
// répartie dans des modules spécialisés (services/ia, services/yuna,
// services/personnages, services/memoire, services/divers).
//
// Il ne fait que ré-exporter les mêmes fonctions qu'avant, sous les
// mêmes noms, pour que AUCUN écran (ChatScreen.jsx, PersonnagesScreen.jsx,
// JournalScreen.jsx, GalleryScreen.jsx...) n'ait besoin de changer ses
// imports. Si tu veux un jour importer directement depuis les modules
// plutôt que depuis ce barrel, c'est possible aussi — les deux marchent.
// ============================================================

export {
  envoyerMessageAYuna,
  envoyerNoteVocaleAYuna,
  verifierMessageSpontane,
  genererMessageAccueil,
} from "./yuna/yuna";

export { extraireEtMemoriserFaits } from "./memoire/extraction";

export { envoyerMessageAPersonnage } from "./personnages/personnageChat";

export { analyserRelationPersonnage } from "./personnages/relationIA";

export { genererResumeJournal } from "./divers/journal";

export { genererLegendeImage } from "./divers/legendesImages";