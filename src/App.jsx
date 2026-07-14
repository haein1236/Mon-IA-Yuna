import { useState, useEffect, useRef } from 'react'
import SplashScreen     from './screens/SplashScreen'
import HomeScreen       from './screens/HomeScreen'
import ChatScreen       from './screens/ChatScreen'
import HistoriqueScreen from './screens/HistoriqueScreen'
import GalleryScreen    from './screens/GalleryScreen'
import ProfileScreen    from './screens/ProfileScreen'
import SettingsScreen   from './screens/SettingsScreen'
import Sidebar          from './components/Sidebar'
import { creerNouvelleConversation } from './services/conversations'
import { useHauteurEcran } from './hooks/useHauteurEcran'

function App() {
  const [ecranActuel, setEcranActuel]               = useState('splash')
  const [conversationActive, setConversationActive] = useState(null)
  const navigationInterneRef = useRef(false)

  useHauteurEcran()

  useEffect(() => {
    const minuteur = setTimeout(() => setEcranActuel('accueil'), 2500)
    return () => clearTimeout(minuteur)
  }, [])

  useEffect(() => {
    window.history.replaceState({ ecran: 'accueil' }, '')
  }, [])

  useEffect(() => {
    const gererBoutonRetour = (evenement) => {
      navigationInterneRef.current = true
      const ecranPrecedent = evenement.state?.ecran || 'accueil'
      setEcranActuel(ecranPrecedent)
    }
    window.addEventListener('popstate', gererBoutonRetour)
    return () => window.removeEventListener('popstate', gererBoutonRetour)
  }, [])

  const ouvrirConversation = (conv) => setConversationActive(conv)

  const gererChangerEcran = (ecran) => {
    if (ecran === 'chat' && !conversationActive) {
      setConversationActive(creerNouvelleConversation())
    }
    setEcranActuel(ecran)

    if (!navigationInterneRef.current) {
      window.history.pushState({ ecran }, '')
    }
    navigationInterneRef.current = false
  }

  const gererNouvelleConversation = (conv) => setConversationActive(conv)

  if (ecranActuel === 'splash') return <SplashScreen />

  return (
    <div className="hauteur-app overflow-hidden flex flex-col md:flex-row">
      <Sidebar ecranActuel={ecranActuel} onChangerEcran={gererChangerEcran} />

      {/* ============================================================
          CORRECTION : "order-1 md:order-2" place ce bloc de contenu
          AVANT la Sidebar visuellement sur mobile (donc le contenu
          est en haut, la barre de nav en bas — l'ordre normal d'une
          app mobile). "pb-16" SUPPRIMÉ : plus nécessaire puisque la
          Sidebar n'est plus "fixed" par-dessus le contenu, elle prend
          sa vraie place dans le flux — donc aucun risque qu'elle
          cache quoi que ce soit en bas de l'écran.
          ============================================================ */}
      <div className="order-1 md:order-2 flex-1 min-h-0 overflow-hidden">
        {ecranActuel === 'accueil'    && <HomeScreen       onChangerEcran={gererChangerEcran} />}
        {ecranActuel === 'chat'       && (
          <ChatScreen
            conversationActive={conversationActive}
            onChangerEcran={gererChangerEcran}
            onNouvelleConversation={gererNouvelleConversation}
          />
        )}
        {ecranActuel === 'historique' && (
          <HistoriqueScreen
            onChangerEcran={gererChangerEcran}
            onOuvrirConversation={ouvrirConversation}
          />
        )}
        {ecranActuel === 'galerie'    && <GalleryScreen />}
        {ecranActuel === 'profil'     && <ProfileScreen onChangerEcran={gererChangerEcran} />}
        {ecranActuel === 'parametres' && <SettingsScreen onChangerEcran={gererChangerEcran} />}
      </div>
    </div>
  )
}

export default App