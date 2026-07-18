import { useState } from 'react'
import { inscrire, connecter, traduireErreurAuth } from '../services/authentification'

// ============================================================
// ÉCRAN DE CONNEXION / INSCRIPTION
// Affiché tant que l'utilisateur n'est pas connecté (voir App.jsx).
// Un seul formulaire pour les deux cas, basculé par "modeInscription".
// ============================================================
function ConnexionScreen() {
  const [modeInscription, setModeInscription] = useState(false)
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const valider = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      setErreur('Remplis les deux champs.')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      if (modeInscription) {
        await inscrire(email.trim(), motDePasse)
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
    <div className="h-full min-h-0 w-full flex items-center justify-center bg-cream p-6">
      <div className="w-full max-w-[340px]">
        <p className="text-center text-[22px] font-semibold text-espresso mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
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
            className="w-full bg-white border border-espresso/15 rounded-2xl px-4 py-3 text-[13px] text-espresso outline-none focus:border-espresso transition-colors duration-200"
          />
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={gererEntree}
            placeholder="Mot de passe"
            className="w-full bg-white border border-espresso/15 rounded-2xl px-4 py-3 text-[13px] text-espresso outline-none focus:border-espresso transition-colors duration-200"
          />
        </div>

        {erreur && <p className="text-[11px] text-red-500 mb-3 text-center">{erreur}</p>}

        <button
          onClick={valider}
          disabled={chargement}
          className="w-full rounded-2xl py-3.5 text-[13px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mb-3"
        >
          {chargement ? '...' : (modeInscription ? 'Créer mon compte' : 'Me connecter')}
        </button>

        <button
          onClick={() => { setModeInscription(!modeInscription); setErreur('') }}
          className="w-full text-center text-[11px] text-espresso/50 hover:text-espresso transition-colors duration-200"
        >
          {modeInscription ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  )
}

export default ConnexionScreen