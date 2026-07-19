import { useRef, useState } from 'react'
import { inscrire, connecter, traduireErreurAuth } from '../services/authentification'
import { connecterAvecGoogle } from '../services/authentification'

// ============================================================
// ÉCRAN DE CONNEXION / INSCRIPTION
// Affiché tant que l'utilisateur n'est pas connecté (voir App.jsx).
// Un seul formulaire pour les deux cas, basculé par "modeInscription".
//
// Nouveautés :
// - Avatar circulaire en haut (comme sur la maquette) : cliquable en
//   mode inscription pour choisir une photo de profil, avec aperçu.
// - Mise en page responsive : mobile, tablette, desktop, et hauteur
//   d'écran variable (clavier mobile compris via 100dvh).
// ============================================================
function ConnexionScreen() {
  const [modeInscription, setModeInscription] = useState(false)
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [erreurGoogle, setErreurGoogle] = useState('')

  // --- Photo de profil (mode inscription uniquement) ---
  const [photoFichier, setPhotoFichier] = useState(null)
  const [photoApercu, setPhotoApercu] = useState(null)
  const inputPhotoRef = useRef(null)

  const ouvrirSelecteurPhoto = () => {
    if (!modeInscription) return
    inputPhotoRef.current?.click()
  }

  const gererChoixPhoto = (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier) return

    if (!fichier.type.startsWith('image/')) {
      setErreur("Choisis un fichier image (jpg, png…).")
      return
    }
    if (fichier.size > 5 * 1024 * 1024) {
      setErreur('Photo trop lourde (5 Mo max).')
      return
    }

    setErreur('')
    setPhotoFichier(fichier)
    const lecteur = new FileReader()
    lecteur.onload = () => setPhotoApercu(lecteur.result)
    lecteur.readAsDataURL(fichier)
  }

  const retirerPhoto = (e) => {
    e.stopPropagation()
    setPhotoFichier(null)
    setPhotoApercu(null)
    if (inputPhotoRef.current) inputPhotoRef.current.value = ''
  }

  const gererConnexionGoogle = async () => {
    setErreurGoogle('')
    try {
      await connecterAvecGoogle()
      // Pas de "setChargement(false)" ici : la page va se recharger
      // automatiquement après la redirection Google, donc ce composant
      // sera de toute façon démonté
    } catch (e) {
      setErreurGoogle('Impossible de se connecter avec Google. Réessaie.')
    }
  }

  const valider = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      setErreur('Remplis les deux champs.')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      if (modeInscription) {
        // Si ta fonction "inscrire" sait gérer une photo, passe-la ici.
        // Sinon adapte sa signature côté services/authentification.js
        // pour uploader "photoFichier" (ex: vers Firebase Storage / Supabase)
        // puis enregistrer l'URL sur le profil utilisateur.
        await inscrire(email.trim(), motDePasse, photoFichier)
      } else {
        await connecter(email.trim(), motDePasse)
      }
      // Rien d'autre à faire ici : App.jsx détecte automatiquement
      // le changement de connexion via surveillerConnexion()
    } catch (e) {
      setErreur(traduireErreurAuth(e))
    } finally {
      setChargement(false)
    }
  }

  const gererEntree = (e) => {
    if (e.key === 'Enter') valider()
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-cream px-5 py-8 sm:px-6">
      <div className="w-full max-w-[340px] sm:max-w-[380px]">
        {/* -------- Avatar / photo de profil -------- */}
        <div className="flex justify-center mb-5">
          <button
            type="button"
            onClick={ouvrirSelecteurPhoto}
            aria-label={modeInscription ? 'Choisir une photo de profil' : 'Yuna'}
            className={`relative w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full bg-espresso flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-200 ${
              modeInscription ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.97]' : 'cursor-default'
            }`}
          >
            {photoApercu ? (
              <img src={photoApercu} alt="Aperçu de la photo de profil" className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 sm:w-11 sm:h-11" aria-hidden="true">
                <circle cx="12" cy="8" r="3.6" fill="var(--tw-color-peony, #f2c6d6)" className="fill-peony" />
                <path
                  d="M4.5 19.2c0-3.9 3.36-6.4 7.5-6.4s7.5 2.5 7.5 6.4"
                  className="fill-peony"
                />
              </svg>
            )}

            {/* Badge appareil photo : uniquement en mode inscription */}
            {modeInscription && (
              <span className="absolute bottom-0 inset-x-0 h-6 bg-espresso/80 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                  <path
                    d="M6.5 5.5 7.3 4h5.4l.8 1.5H16a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 14V7A1.5 1.5 0 0 1 4 5.5h2.5Z"
                    className="stroke-peony"
                    strokeWidth="1.2"
                  />
                  <circle cx="10" cy="10.2" r="2.6" className="stroke-peony" strokeWidth="1.2" />
                </svg>
              </span>
            )}
          </button>

          <input
            ref={inputPhotoRef}
            type="file"
            accept="image/*"
            onChange={gererChoixPhoto}
            className="hidden"
          />
        </div>

        {photoApercu && modeInscription && (
          <div className="flex justify-center -mt-3 mb-2">
            <button
              type="button"
              onClick={retirerPhoto}
              className="text-[10px] text-espresso/45 hover:text-espresso transition-colors duration-200"
            >
              Retirer la photo
            </button>
          </div>
        )}

        <p
          className="text-center text-[20px] sm:text-[22px] font-semibold text-espresso mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Yuna
        </p>
        <p className="text-center text-[11px] text-espresso/45 mb-6">
          {modeInscription ? 'Crée ton compte pour synchroniser ton espace' : 'Connecte-toi pour retrouver ton espace'}
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={gererEntree}
            placeholder="Adresse email"
            autoComplete="email"
            className="w-full bg-white border border-espresso/15 rounded-2xl px-4 py-3 text-[13px] text-espresso outline-none focus:border-espresso transition-colors duration-200"
          />
          <div className="relative">
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              onKeyDown={gererEntree}
              placeholder="Mot de passe"
              autoComplete={modeInscription ? 'new-password' : 'current-password'}
              className="w-full bg-white border border-espresso/15 rounded-2xl px-4 py-3 pr-12 text-[13px] text-espresso outline-none focus:border-espresso transition-colors duration-200"
            />
            <button
              type="button"
              onClick={valider}
              disabled={chargement}
              aria-label={modeInscription ? 'Créer mon compte' : 'Me connecter'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-espresso text-peony flex items-center justify-center transition-transform duration-200 hover:-translate-y-[calc(50%+2px)] active:scale-90 disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M4 10h11.5M11 5.5 16 10l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {erreur && <p className="text-[11px] text-red-500 mb-3 text-center">{erreur}</p>}

        <button
          onClick={valider}
          disabled={chargement}
          className="w-full rounded-2xl py-3.5 text-[13px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mb-3"
        >
          {chargement ? '...' : modeInscription ? 'Créer mon compte' : 'Me connecter'}
        </button>

        <div className="flex items-center gap-3 mb-3">
          <span className="flex-1 h-px bg-espresso/10" />
          <span className="text-[10px] text-espresso/40">ou</span>
          <span className="flex-1 h-px bg-espresso/10" />
        </div>

        <button
          onClick={gererConnexionGoogle}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-[12px] font-medium text-espresso bg-white border border-espresso/15 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] mb-2"
        >
          <svg viewBox="0 0 18 18" className="w-4 h-4" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          Continuer avec Google
        </button>
        {erreurGoogle && <p className="text-[11px] text-red-500 mb-2 text-center">{erreurGoogle}</p>}

        <button
          onClick={() => {
            setModeInscription(!modeInscription)
            setErreur('')
            setErreurGoogle('')
          }}
          className="w-full text-center text-[11px] text-espresso/50 hover:text-espresso transition-colors duration-200"
        >
          {modeInscription ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  )
}

export default ConnexionScreen