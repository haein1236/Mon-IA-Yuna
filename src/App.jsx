import { useState, useEffect, useRef } from 'react'
import SplashScreen     from './screens/SplashScreen'
import HomeScreen       from './screens/HomeScreen'
import ChatScreen       from './screens/ChatScreen'
import HistoriqueScreen from './screens/HistoriqueScreen'
import GalleryScreen    from './screens/GalleryScreen'
import ProfileScreen    from './screens/ProfileScreen'
import SettingsScreen   from './screens/SettingsScreen'
import PersonnagesScreen from './screens/PersonnagesScreen'
import JournalScreen    from './screens/JournalScreen'
import LocalisationScreen from './screens/LocalisationScreen'
import Sidebar          from './components/Sidebar'
import NotificationHost from './components/NotificationHost'
import { synchroniserAuDemarrage } from './services/sync'
import AccesProtege     from './components/AccesProtege'
import ConnexionScreen from './screens/ConnexionScreen'
import { surveillerConnexion } from './services/authentification'
import { creerNouvelleConversation } from './services/conversations'
import { useHauteurEcran } from './hooks/useHauteurEcran'
import { chargerSuivi, enregistrerVisite, joursDepuis } from './services/suivi'
import { genererMessageAccueil } from './services/gemini'
import { notifierInfo } from './services/notifications'

function App() {
  const [ecranActuel, setEcranActuel]               = useState('splash')
  const [conversationActive, setConversationActive] = useState(null)
  const [utilisateur, setUtilisateur] = useState(null)
  const [verificationAuthTerminee, setVerificationAuthTerminee] = useState(false)

  // ============================================================
  // AUTHENTIFICATION ET SYNCHRONISATION INITIALE
  // Écoute les changements d'état de session Supabase. Intègre un 
  // filet de sécurité de 6 secondes pour éviter de bloquer l'utilisateur 
  // sur le Splash screen en cas de coupure réseau ou mauvaise configuration.
  // ============================================================
  useEffect(() => {
    // ⬅️ NOUVEAU : filet de sécurité — si Supabase ne répond jamais
    // (mauvaise config, réseau), on force l'affichage de l'écran de
    // connexion après 6 secondes maximum, au lieu de rester bloqué
    // indéfiniment sur le Splash
    const filetSecurite = setTimeout(() => {
      setVerificationAuthTerminee((deja) => deja || true)
    }, 6000)

    const desabonner = surveillerConnexion(async (user) => {
      clearTimeout(filetSecurite)
      setUtilisateur(user)
      if (user) {
        await synchroniserAuDemarrage('yuna-profil-saki', 'profil')
        await synchroniserAuDemarrage('yuna-parametres', 'parametres')
        // ⬅️ NOUVEAU : synchronise aussi conversations Yuna + personnages
        await synchroniserAuDemarrage('yuna-conversations', 'conversations')
        await synchroniserAuDemarrage('yuna-personnages', 'personnages')
        await synchroniserAuDemarrage('yuna-personnages-conversations', 'personnages_conversations')
      }
      setVerificationAuthTerminee(true)
    })

    return () => { clearTimeout(filetSecurite); desabonner() }
  }, [])

  useHauteurEcran()

  useEffect(() => {
    const minuteur = setTimeout(() => setEcranActuel('accueil'), 2500)
    return () => clearTimeout(minuteur)
  }, [])

  useEffect(() => {
    window.history.replaceState({ ecran: 'accueil' }, '')
  }, [])

  // ============================================================
  // GESTION DU BOUTON RETOUR NAVIGATEUR (POPSTATE)
  // Le popstate se contente de lire l'état — il n'a JAMAIS besoin
  // d'appeler pushState lui-même. Chaque clic normal enregistre 
  // sa page. Simple et fiable.
  // ============================================================
  useEffect(() => {
    const gererBoutonRetour = (evenement) => {
      const ecranPrecedent = evenement.state?.ecran || 'accueil'
      setEcranActuel(ecranPrecedent)
    }
    window.addEventListener('popstate', gererBoutonRetour)
    return () => window.removeEventListener('popstate', gererBoutonRetour)
  }, [])

  // ============================================================
  // ACCUEIL INTELLIGENT DE YUNA
  // Se déclenche UNE FOIS à l'ouverture de l'app. Compare la date de
  // la dernière visite à maintenant pour générer un message personnalisé.
  // ============================================================
  useEffect(() => {
    const verifierAccueil = async () => {
      const suivi = chargerSuivi()
      const joursAbsence = joursDepuis(suivi.app)

      // On enregistre la visite MAINTENANT
      enregistrerVisite('app')

      if (joursAbsence >= 2) {
        const joursJournal = joursDepuis(suivi.journal)
        const joursGalerie = joursDepuis(suivi.galerie)
        try {
          const message = await genererMessageAccueil({ joursAbsence, joursJournal, joursGalerie })
          notifierInfo(message)
        } catch (erreur) {
          console.error('Erreur message accueil :', erreur)
          notifierInfo(`Tu m'as manqué ! Ça fait ${joursAbsence} jours qu'on ne s'est pas parlé 💭`)
        }
      }
    }
    
    const delai = setTimeout(verifierAccueil, 2800)
    return () => clearTimeout(delai)
  }, [])

  const ouvrirConversation = (conv) => setConversationActive(conv)

  const gererChangerEcran = (ecran) => {
    if (ecran === ecranActuel) return

    if (ecran === 'chat' && !conversationActive) {
      setConversationActive(creerNouvelleConversation())
    }
    setEcranActuel(ecran)
    window.history.pushState({ ecran }, '')
  }

  const gererNouvelleConversation = (conv) => setConversationActive(conv)

  const mettreAJourConversationActive = (conv) => setConversationActive(conv)

  if (ecranActuel === 'splash') return <SplashScreen />
  if (!verificationAuthTerminee) return <SplashScreen />
  if (!utilisateur) return <ConnexionScreen />

  return (
    <>
      <NotificationHost />
      <div className="hauteur-app overflow-hidden flex flex-col lg:flex-row">
        <Sidebar ecranActuel={ecranActuel} onChangerEcran={gererChangerEcran} />

        <div className="order-1 lg:order-2 flex-1 min-h-0 overflow-hidden">
          {ecranActuel === 'accueil'      && <HomeScreen       onChangerEcran={gererChangerEcran} />}
          {ecranActuel === 'chat'         && (
            <ChatScreen
              key={conversationActive?.id || 'nouvelle'}
              conversationActive={conversationActive}
              onChangerEcran={gererChangerEcran}
              onNouvelleConversation={gererNouvelleConversation}
              onConversationMiseAJour={mettreAJourConversationActive}
            />
          )}
          {ecranActuel === 'historique'   && (
            <HistoriqueScreen
              onChangerEcran={gererChangerEcran}
              onOuvrirConversation={ouvrirConversation}
            />
          )}
          {ecranActuel === 'galerie'      && <GalleryScreen />}
          {ecranActuel === 'profil'       && <ProfileScreen onChangerEcran={gererChangerEcran} />}
          {ecranActuel === 'parametres'   && <SettingsScreen onChangerEcran={gererChangerEcran} />}
          {ecranActuel === 'personnages'  && (
            <AccesProtege>
              <PersonnagesScreen />
            </AccesProtege>
          )}
          {ecranActuel === 'journal'      && <JournalScreen />}
          {ecranActuel === 'localisation' && <LocalisationScreen />}
        </div>
      </div>
    </>
  )
}

export default App