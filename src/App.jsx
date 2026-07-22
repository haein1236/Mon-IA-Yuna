import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import SplashScreen from './screens/SplashScreen'
import Sidebar from './components/Sidebar'
import NotificationHost from './components/NotificationHost'
import AccesProtege from './components/AccesProtege'
import ConnexionScreen from './screens/ConnexionScreen'
import { creerNouvelleConversation } from './services/conversations'
import { useHauteurEcran } from './hooks/useHauteurEcran'
import { chargerSuivi, enregistrerVisite, joursDepuis } from './services/suivi'
import { genererMessageAccueil } from './services/gemini'
import { notifierInfo } from './services/notifications'
import { envoyerNotificationLocale } from './services/notificationsNatives'
import { surveillerConnexion, garantirProfilPublic } from './services/authentification'
import { synchroniserAuDemarrage } from './services/sync'

// ============================================================
// CHARGEMENT PARESSEUX ("lazy loading")
// Chaque écran n'est téléchargé/exécuté QUE quand l'utilisateur y
// accède réellement — pas tous en même temps au démarrage. C'est ce
// qui va le plus réduire le temps d'ouverture initial sur mobile,
// surtout pour les écrans "lourds" (Journal charge lucide-react,
// Localisation charge Leaflet — deux librairies qu'on ne veut PAS
// dans le premier chargement si l'utilisateur ouvre juste le Chat).
// ============================================================
const HomeScreen        = lazy(() => import('./screens/HomeScreen'))
const ChatScreen        = lazy(() => import('./screens/ChatScreen'))
const HistoriqueScreen  = lazy(() => import('./screens/HistoriqueScreen'))
const GalleryScreen     = lazy(() => import('./screens/GalleryScreen'))
const ProfileScreen     = lazy(() => import('./screens/ProfileScreen'))
const SettingsScreen    = lazy(() => import('./screens/SettingsScreen'))
const PersonnagesScreen = lazy(() => import('./screens/PersonnagesScreen'))
const JournalScreen     = lazy(() => import('./screens/JournalScreen'))
const LocalisationScreen = lazy(() => import('./screens/LocalisationScreen'))

// Petit indicateur affiché brièvement pendant qu'un écran se charge
function ChargementEcran() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-cream">
      <div className="w-6 h-6 rounded-full border-2 border-espresso/20 border-t-espresso animate-spin" />
    </div>
  )
}

function App() {
  const [ecranActuel, setEcranActuel] = useState('splash')
  const [conversationActive, setConversationActive] = useState(null)
  const [utilisateur, setUtilisateur] = useState(null)
  const [verificationAuthTerminee, setVerificationAuthTerminee] = useState(false)

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
      const ecranPrecedent = evenement.state?.ecran || 'accueil'
      setEcranActuel(ecranPrecedent)
    }
    window.addEventListener('popstate', gererBoutonRetour)
    return () => window.removeEventListener('popstate', gererBoutonRetour)
  }, [])

  useEffect(() => {
    const filetSecurite = setTimeout(() => {
      setVerificationAuthTerminee((deja) => deja || true)
    }, 6000)

    const desabonner = surveillerConnexion(async (user) => {
      clearTimeout(filetSecurite)
      setUtilisateur(user)
      setVerificationAuthTerminee(true)

      if (user) {
        try {
          await garantirProfilPublic(user)
        } catch (erreur) {
          // Une erreur ici (course, réseau) ne doit JAMAIS empêcher la
          // synchro des vraies données de l'utilisateur juste après.
          console.error('Erreur création profil public (non bloquante) :', erreur)
        }
        await Promise.all([
          synchroniserAuDemarrage('yuna-profil-saki', 'profil'),
          synchroniserAuDemarrage('yuna-parametres', 'parametres'),
          synchroniserAuDemarrage('yuna-conversations', 'conversations'),
          synchroniserAuDemarrage('yuna-personnages', 'personnages'),
          synchroniserAuDemarrage('yuna-personnages-conversations', 'personnages_conversations'),
        ])
      }
    })

    return () => { 
      clearTimeout(filetSecurite)
      desabonner() 
    }
  }, [])

  useEffect(() => {
    const verifierAccueil = async () => {
      const suivi = chargerSuivi()
      const joursAbsence = joursDepuis(suivi.app)
      enregistrerVisite('app')

      if (joursAbsence >= 2) {
        const joursJournal = joursDepuis(suivi.journal)
        const joursGalerie = joursDepuis(suivi.galerie)
        try {
          const message = await genererMessageAccueil({ joursAbsence, joursJournal, joursGalerie })
          notifierInfo(message)
          envoyerNotificationLocale('Yuna', message)
        } catch (erreur) {
          console.error('Erreur message accueil :', erreur)
          const messageDefaut = `Tu m'as manqué ! Ça fait ${joursAbsence} jours qu'on ne s'est pas parlé 💭`
          notifierInfo(messageDefaut)
          envoyerNotificationLocale('Yuna', messageDefaut)
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
          {/* ⬅️ Suspense affiche ChargementEcran() pendant que le
              morceau de code de l'écran demandé se télécharge — une
              seule fois par écran, mis en cache ensuite */}
          <Suspense fallback={<ChargementEcran />}>
            {ecranActuel === 'accueil'      && <HomeScreen onChangerEcran={gererChangerEcran} />}
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
              <HistoriqueScreen onChangerEcran={gererChangerEcran} onOuvrirConversation={ouvrirConversation} />
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
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default App