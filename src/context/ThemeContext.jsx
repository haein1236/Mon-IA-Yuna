import { createContext, useContext, useState, useEffect } from 'react'
import { chargerParametres, sauvegarderParametres } from '../services/parametres'

// ============================================================
// THEME CONTEXT (version Tailwind v4)
// Comme les couleurs sont déjà déclarées en hexadécimal dans le
// @theme de index.css, on n'a plus besoin de les convertir :
// on modifie directement les variables CSS avec des codes hex.
// Tailwind v4 recalcule automatiquement les opacités (bg-espresso/10)
// à partir de la nouvelle valeur, en live.
// ============================================================

// Chaque thème a maintenant 4 couleurs au lieu de 3
export const THEMES_DISPONIBLES = [
  {
    id: 'espresso',
    nom: 'Espresso (par défaut)',
    couleurs: { espresso: '#3E2723', peony: '#F4C9D6', cream: '#FFF8F5', accent: '#C4688A' },
  },
  {
    id: 'lavande',
    nom: 'Lavande',
    couleurs: { espresso: '#3A2C4A', peony: '#E5D8F0', cream: '#FAF8FD', accent: '#8B6FA8' },
  },
  {
    id: 'sauge',
    nom: 'Sauge',
    couleurs: { espresso: '#2B3D2D', peony: '#D7E3D2', cream: '#F8FAF6', accent: '#6B8F5E' },
  },
  {
    id: 'nuit',
    nom: 'Bleu Nuit',
    couleurs: { espresso: '#1E293B', peony: '#CBD5E1', cream: '#F8FAFC', accent: '#4A6B94' },
  },
  {
    id: 'sakura',
    nom: 'Sakura',
    couleurs: { espresso: '#443025', peony: '#EC9C9D', cream: '#FBEAEA', accent: '#B4506E' },
  },
  {
    id: 'jardin',
    nom: 'Jardin',
    couleurs: { espresso: '#2D3A47', peony: '#F7C8D3', cream: '#FFF7E6', accent: '#B46A72' },
  },
]
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [parametres, setParametres] = useState(() => chargerParametres())

  // À chaque changement de thème, on écrase les variables CSS sur <html>.
  // Comme elles ont une priorité plus forte que le @theme de base,
  // toute l'app change de couleur instantanément.
// Dans le useEffect du ThemeProvider, ajoute la ligne accent
useEffect(() => {
  const couleurs = parametres.couleursPersonnalisees
    || THEMES_DISPONIBLES.find((t) => t.id === parametres.themeId)?.couleurs
    || THEMES_DISPONIBLES[0].couleurs

  const racine = document.documentElement
  racine.style.setProperty('--color-espresso', couleurs.espresso)
  racine.style.setProperty('--color-peony', couleurs.peony)
  racine.style.setProperty('--color-cream', couleurs.cream)
  racine.style.setProperty('--color-accent', couleurs.accent) // ⬅️ NOUVEAU
  racine.style.setProperty('--color-peony-light', `color-mix(in srgb, ${couleurs.peony}, white 35%)`)
}, [parametres.themeId, parametres.couleursPersonnalisees])

// Ajoute ce useEffect à la suite de celui qui gère déjà les couleurs
useEffect(() => {
  // toggle() ajoute la classe si true, la retire si false
  document.documentElement.classList.toggle('reduce-motion', !!parametres.reduireAnimations)
}, [parametres.reduireAnimations])

  const choisirTheme = (themeId) => {
    const nouveauxParametres = { ...parametres, themeId, couleursPersonnalisees: null }
    setParametres(nouveauxParametres)
    sauvegarderParametres(nouveauxParametres)
  }

  const appliquerCouleursPersonnalisees = (couleursHex) => {
    const nouveauxParametres = { ...parametres, couleursPersonnalisees: couleursHex }
    setParametres(nouveauxParametres)
    sauvegarderParametres(nouveauxParametres)
  }

  const mettreAJourParametres = (champs) => {
    const nouveauxParametres = { ...parametres, ...champs }
    setParametres(nouveauxParametres)
    sauvegarderParametres(nouveauxParametres)
  }

  return (
    <ThemeContext.Provider value={{ parametres, choisirTheme, appliquerCouleursPersonnalisees, mettreAJourParametres }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}