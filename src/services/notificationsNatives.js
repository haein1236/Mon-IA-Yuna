// ============================================================
// ABSTRACTION NOTIFICATIONS — prépare la migration Capacitor
// Aujourd'hui (PWA) : utilise l'API Notification native du navigateur.
// Demain (app Capacitor) : il suffira de remplacer L'INTÉRIEUR de ces
// fonctions par les appels au plugin @capacitor/local-notifications —
// aucun autre fichier de l'app n'aura besoin d'être modifié, puisqu'ils
// appelleront toujours ces mêmes noms de fonctions.
// ============================================================

export async function demanderAutorisationNotifications() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const resultat = await Notification.requestPermission()
  return resultat === 'granted'
}

export async function envoyerNotificationLocale(titre, corps) {
  const autorise = await demanderAutorisationNotifications()
  if (!autorise) return false
  new Notification(titre, { body: corps, icon: '/icons/icon-192.png' })
  return true
}