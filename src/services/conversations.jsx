// ===== CLÉ DE STOCKAGE =====
// Toutes les conversations sont stockées sous cette clé dans localStorage
const CLE_CONVERSATIONS = 'yuna-conversations'

// ===== CHARGER TOUTES LES CONVERSATIONS =====
// Retourne le tableau de toutes les conversations sauvegardées
// Si rien n'est sauvegardé, retourne un tableau vide []
export function chargerConversations() {

  // On récupère la valeur sauvegardée sous la clé 'yuna-conversations'
  const donneesBrutes = localStorage.getItem(CLE_CONVERSATIONS)

  // Si rien n'existe encore, on retourne un tableau vide
  if (!donneesBrutes) return []

  // JSON.parse convertit le texte sauvegardé en tableau JavaScript
  return JSON.parse(donneesBrutes)
}

// ===== SAUVEGARDER UNE CONVERSATION =====
// Crée une nouvelle conversation ou met à jour une existante
// conversation = objet { id, titre, messages, dateCreation, dateMiseAJour }
export function sauvegarderConversation(conversation) {

  // On charge toutes les conversations existantes
  const conversations = chargerConversations()

  // On cherche si cette conversation existe déjà (par son id)
  const indexExistant = conversations.findIndex((c) => c.id === conversation.id)

  if (indexExistant !== -1) {
    // Si elle existe déjà, on la met à jour à sa position
    conversations[indexExistant] = conversation
  } else {
    // Si c'est une nouvelle conversation, on l'ajoute au début du tableau
    // unshift = ajoute au début (les plus récentes en premier)
    conversations.unshift(conversation)
  }

  // On sauvegarde le tableau mis à jour dans localStorage
  localStorage.setItem(CLE_CONVERSATIONS, JSON.stringify(conversations))
}

// ===== SUPPRIMER UNE CONVERSATION =====
// Supprime une conversation par son id
export function supprimerConversation(id) {

  // On charge toutes les conversations
  const conversations = chargerConversations()

  // filter = garde seulement les conversations dont l'id est différent
  // (donc supprime celle qui correspond à l'id passé en paramètre)
  const conversationsFiltrees = conversations.filter((c) => c.id !== id)

  // On sauvegarde le tableau sans la conversation supprimée
  localStorage.setItem(CLE_CONVERSATIONS, JSON.stringify(conversationsFiltrees))
}

// ===== CRÉER UNE NOUVELLE CONVERSATION =====
// Retourne un objet conversation vide prêt à l'emploi
export function creerNouvelleConversation() {
  return {
    // id unique basé sur le timestamp actuel
    id: Date.now().toString(),
    // Titre par défaut, l'utilisateur peut le changer plus tard
    titre: 'Nouvelle conversation',
    // Messages initiaux avec le message d'accueil de Yuna
    messages: [
      {
        id: 1,
        auteur: 'yuna',
        texte: "Coucou ! 👋 Je suis Yuna, ta pote IA. Comment tu vas aujourd'hui ?",
        heure: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    ],
    // Date de création (pour l'affichage)
    dateCreation: new Date().toISOString(),
    // Date de dernière mise à jour (pour trier par plus récent)
    dateMiseAJour: new Date().toISOString(),
  }
}

// ===== FORMATER LA DATE =====
// Convertit une date ISO en texte lisible (ex: "Aujourd'hui", "Hier", "20 juin")
export function formaterDate(dateISO) {

  const date = new Date(dateISO)
  const maintenant = new Date()

  // On compare juste les dates (sans l'heure) pour savoir si c'est aujourd'hui ou hier
  const dateSeule = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const maintenantSeule = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())

  // Différence en millisecondes convertie en jours
  const diffJours = Math.round((maintenantSeule - dateSeule) / (1000 * 60 * 60 * 24))

  if (diffJours === 0) return "Aujourd'hui"
  if (diffJours === 1) return 'Hier'

  // Pour les dates plus anciennes, on affiche le jour et le mois
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}