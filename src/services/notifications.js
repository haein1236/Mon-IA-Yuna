// ============================================================
// SYSTÈME DE NOTIFICATIONS DISCRÈTES ("toasts")
// Remplace les faux messages "Oups petit bug" affichés DANS la
// conversation (confus — on dirait que Yuna/le personnage parle).
// Utilise un événement DOM personnalisé : n'importe quel fichier
// peut appeler notifierErreur(...) sans avoir besoin de context React
// ni de props — un seul <NotificationHost /> (monté une fois dans
// App.jsx) écoute et affiche le petit encart.
// ============================================================

export function notifier(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('yuna-notification', {
    detail: { id: Date.now() + Math.random(), message, type },
  }))
}

export function notifierErreur(message) {
  notifier(message, 'erreur')
}

export function notifierSucces(message) {
  notifier(message, 'succes')
}

// Notification "info" — pour l'accueil de Yuna, pas une erreur
export function notifierInfo(message) {
  notifier(message, 'info')
}