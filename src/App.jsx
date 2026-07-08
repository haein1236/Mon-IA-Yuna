import { useState, useEffect } from 'react'
import SplashScreen     from './screens/SplashScreen'
import HomeScreen       from './screens/HomeScreen'
import ChatScreen       from './screens/ChatScreen'
import HistoriqueScreen from './screens/HistoriqueScreen'
import GalleryScreen    from './screens/GalleryScreen'
import ProfileScreen    from './screens/ProfileScreen'
import SettingsScreen from './screens/SettingsScreen'
import Sidebar          from './components/Sidebar'
import { creerNouvelleConversation } from './services/conversations'

function App() {
  const [ecranActuel, setEcranActuel]               = useState('splash')
  const [conversationActive, setConversationActive] = useState(null)

  useEffect(() => {
    const minuteur = setTimeout(() => setEcranActuel('accueil'), 2500)
    return () => clearTimeout(minuteur)
  }, [])

  const ouvrirConversation = (conv) => setConversationActive(conv)

  const gererChangerEcran = (ecran) => {
    if (ecran === 'chat' && !conversationActive) {
      setConversationActive(creerNouvelleConversation())
    }
    setEcranActuel(ecran)
  }

  const gererNouvelleConversation = (conv) => {
    setConversationActive(conv)
  }

  if (ecranActuel === 'splash') return <SplashScreen />

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar ecranActuel={ecranActuel} onChangerEcran={gererChangerEcran} />

      <div className="flex-1 h-full overflow-hidden">
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

        {/* C'est cette ligne qui manquait probablement */}
        {ecranActuel === 'profil'     && <ProfileScreen onChangerEcran={gererChangerEcran} />}
        {ecranActuel === 'parametres' && <SettingsScreen onChangerEcran={gererChangerEcran} />}
      </div>
    </div>
  )
}

export default App