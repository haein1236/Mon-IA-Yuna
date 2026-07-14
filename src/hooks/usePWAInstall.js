import { useEffect, useState } from "react"

// ============================================================
// HOOK D'INSTALLATION PWA
// Capture l'événement "beforeinstallprompt" du navigateur, qui se
// déclenche automatiquement quand Chrome/Edge détecte que le site
// remplit les critères d'installation (manifest valide, service
// worker actif, servi en HTTPS). On stocke cet événement pour
// pouvoir déclencher l'installation plus tard, au clic d'un bouton
// de notre choix (plutôt que d'attendre le mini-popup automatique
// du navigateur, moins contrôlable).
// ============================================================
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installable, setInstallable] = useState(false)
  const [dejaInstalle, setDejaInstalle] = useState(false)

  useEffect(() => {
    // "display-mode: standalone" est vrai quand l'app est déjà
    // installée et ouverte depuis son icône (pas depuis un onglet
    // navigateur classique) — "navigator.standalone" est l'équivalent
    // historique sur iOS Safari
    const enModeStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    setDejaInstalle(enModeStandalone)

    const gererEvenementInstall = (e) => {
      // Empêche le mini-popup automatique du navigateur —
      // on affichera notre propre bouton à la place
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallable(true)
    }
    window.addEventListener("beforeinstallprompt", gererEvenementInstall)
    return () => window.removeEventListener("beforeinstallprompt", gererEvenementInstall)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setInstallable(false)
    return outcome === 'accepted'
  }

  // ⬅️ NOUVEAU : iOS Safari ne déclenche JAMAIS "beforeinstallprompt"
  // (limitation permanente d'Apple, aucune solution technique possible)
  // — on détecte l'iOS pour proposer les instructions manuelles à la place
  const estIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

  return { installable, install, dejaInstalle, estIOS }
}