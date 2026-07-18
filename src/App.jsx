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



  useEffect(() => {
  const desabonner = surveillerConnexion(async (user) => {
    setUtilisateur(user)
    if (user) {
      // ⬅️ NOUVEAU : synchronise Profil + Paramètres dès la connexion
      await synchroniserAuDemarrage('yuna-profil-saki', 'profil')
      await synchroniserAuDemarrage('yuna-parametres', 'parametres')
    }
    setVerificationAuthTerminee(true)
  })
  return () => desabonner()
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
  // CORRIGÉ : plus de "drapeau" navigationInterneRef.
  // AVANT : le bouton retour activait un drapeau censé "sauter" le
  // prochain enregistrement d'historique — mais ce drapeau restait
  // parfois activé bien après, et faisait sauter l'enregistrement
  // d'un clic complètement différent plus tard, cassant la pile
  // d'historique (d'où "ça m'envoie sur une autre page").
  // APRÈS : le popstate (bouton retour) se contente de lire l'état —
  // il n'a JAMAIS besoin d'appeler pushState lui-même (le navigateur
  // gère déjà sa propre pile automatiquement). Chaque clic normal,
  // lui, enregistre TOUJOURS sa page. Plus simple, plus fiable.
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
  // la dernière visite (stockée localement) à maintenant — si 2 jours
  // ou plus se sont écoulés, on regarde aussi depuis quand le Journal
  // et la Galerie n'ont pas été visités, et on demande à Yuna un
  // message d'accueil personnalisé, affiché en notification discrète.
  // ⚠️ Rappel technique honnête : ceci ne fonctionne QUE si tu ouvres
  // l'app toi-même — aucune vraie notification ne peut arriver sur
  // ton téléphone pendant que l'app est fermée (ça demanderait un
  // serveur permanent, hors de portée gratuite).
  // ============================================================
  useEffect(() => {
    const verifierAccueil = async () => {
      const suivi = chargerSuivi()
      const joursAbsence = joursDepuis(suivi.app)

      // On enregistre la visite MAINTENANT, pour que la prochaine
      // fois compare bien depuis cet instant précis
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
    // On attend un court instant après le splash pour ne pas juxtaposer
    // la notification à l'animation de démarrage
    const delai = setTimeout(verifierAccueil, 2800)
    return () => clearTimeout(delai)
  }, [])

  const ouvrirConversation = (conv) => setConversationActive(conv)

  const gererChangerEcran = (ecran) => {
    // Évite d'empiler des entrées d'historique identiques si on
    // clique deux fois sur le même onglet
    if (ecran === ecranActuel) return

    if (ecran === 'chat' && !conversationActive) {
      setConversationActive(creerNouvelleConversation())
    }
    setEcranActuel(ecran)
    // ⬅️ TOUJOURS enregistré maintenant, sans condition — c'est ce qui
    // corrige le bug
    window.history.pushState({ ecran }, '')
  }

  const gererNouvelleConversation = (conv) => setConversationActive(conv)

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