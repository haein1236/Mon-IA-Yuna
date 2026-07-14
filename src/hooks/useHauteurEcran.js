import { useEffect } from 'react'

// ============================================================
// HOOK : recalcule la hauteur réelle de l'écran visible
// Sur les navigateurs qui ne supportent pas encore "100dvh"
// nativement, on utilise l'API visualViewport du navigateur (qui,
// elle, est informée en temps réel de l'ouverture/fermeture du
// clavier tactile) pour mettre à jour manuellement une variable CSS
// --app-height. La classe "hauteur-app" (dans index.css) lit cette
// variable comme filet de sécurité.
// À utiliser UNE SEULE FOIS, tout en haut de l'app (App.jsx).
// ============================================================
export function useHauteurEcran() {
  useEffect(() => {
    const mettreAJourHauteur = () => {
      // visualViewport existe sur la plupart des navigateurs mobiles
      // modernes ; fallback sur window.innerHeight sinon
      const hauteur = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${hauteur}px`)
    }

    mettreAJourHauteur()

    // "resize" du visualViewport se déclenche précisément à l'ouverture
    // et à la fermeture du clavier virtuel — c'est l'événement qui
    // manquait pour réagir correctement
    window.visualViewport?.addEventListener('resize', mettreAJourHauteur)
    window.addEventListener('resize', mettreAJourHauteur)

    return () => {
      window.visualViewport?.removeEventListener('resize', mettreAJourHauteur)
      window.removeEventListener('resize', mettreAJourHauteur)
    }
  }, [])
}