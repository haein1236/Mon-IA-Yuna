import { useState } from 'react'
import { inscrire, connecter, traduireErreurAuth, connecterAvecGoogle } from '../services/authentification'

// ============================================================
// ÉCRAN DE CONNEXION / INSCRIPTION
// Affiché tant que l'utilisateur n'est pas connecté (voir App.jsx).
// Un seul formulaire pour les deux cas, basculé par "modeInscription".
// Desktop : panneau de marque à gauche + formulaire à droite.
// Mobile/tablette : formulaire seul, centré, en carte.
// ============================================================

const IconMail = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconLock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const IconEye = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const IconEyeOff = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.6 5.2A10.4 10.4 0 0 1 12 5c6.2 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.8 7 10 7a9.7 9.7 0 0 0 3.4-.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.9 10a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconSparkle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)

function ConnexionScreen() {
  const [modeInscription, setModeInscription] = useState(false)
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [mdpVisible, setMdpVisible] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [chargementGoogle, setChargementGoogle] = useState(false)
  const [erreur, setErreur] = useState('')
  const [erreurGoogle, setErreurGoogle] = useState('')

  const gererConnexionGoogle = async () => {
    setChargementGoogle(true)
    setErreurGoogle('')
    try {
      await connecterAvecGoogle()
      // Pas de "setChargement(false)" ici : la page va se recharger
      // automatiquement après la redirection Google, donc ce composant
      // sera de toute façon démonté
    } catch (e) {
      setChargementGoogle(false)
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
    <div className="h-full min-h-0 w-full flex flex-col lg:flex-row overflow-y-auto scroll-suave bg-cream">
      <style>{`
        @keyframes carteEntree { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flotter { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-14px) translateX(6px); } }
        .anim-carte { animation: carteEntree 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-flotter-1 { animation: flotter 9s ease-in-out infinite; }
        .anim-flotter-2 { animation: flotter 11s ease-in-out infinite 1.5s; }
      `}</style>

      {/* ===== PANNEAU DE MARQUE — visible uniquement sur desktop (lg+) ===== */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative overflow-hidden items-center justify-center px-12 flex-shrink-0"
        style={{ background: 'linear-gradient(155deg, var(--color-espresso), color-mix(in srgb, var(--color-espresso), black 30%))' }}
      >
        <div className="anim-flotter-1 absolute -top-16 -left-10 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' }} />
        <div className="anim-flotter-2 absolute bottom-[-4rem] right-[-3rem] w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)' }} />

        <div className="relative z-10 max-w-[360px]">
          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-6">
            <IconSparkle style={{ width: '18px', height: '18px' }} className="text-peony" />
          </div>
          <p className="text-peony font-semibold text-[36px] leading-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Yuna
          </p>
          <p className="text-peony/60 text-[13.5px] leading-relaxed">
            Ton espace personnel pour discuter, créer des personnages et vivre des histoires — synchronisé partout où tu te connectes.
          </p>
        </div>
      </div>

      {/* ===== FORMULAIRE ===== */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-10">
        <div className="anim-carte w-full max-w-[380px] bg-white lg:bg-white/80 lg:backdrop-blur rounded-3xl border border-espresso/8 shadow-[0_8px_30px_rgba(62,39,35,0.06)] p-6 sm:p-8">

          {/* Sur mobile/tablette, le nom de marque n'apparaît que dans la carte */}
          <p className="lg:hidden text-center text-[24px] font-semibold text-espresso mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Yuna
          </p>
          <p className="text-center text-[13px] sm:text-[14px] font-semibold text-espresso mb-1 hidden lg:block">
            {modeInscription ? 'Créer un compte' : 'Bon retour'}
          </p>
          <p className="text-center text-[11px] text-espresso/45 mb-6">
            {modeInscription ? 'Crée ton compte pour synchroniser ton espace' : 'Connecte-toi pour retrouver ton espace'}
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <IconMail style={{ width: '15px', height: '15px' }} className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/35 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={gererEntree}
                placeholder="Adresse email"
                autoComplete="email"
                className="w-full bg-[#F8F6F3] lg:bg-white border border-espresso/12 rounded-2xl pl-11 pr-4 py-3 text-[13.5px] text-espresso outline-none focus:border-espresso/50 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="relative">
              <IconLock style={{ width: '15px', height: '15px' }} className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/35 pointer-events-none" />
              <input
                type={mdpVisible ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                onKeyDown={gererEntree}
                placeholder="Mot de passe"
                autoComplete={modeInscription ? 'new-password' : 'current-password'}
                className="w-full bg-[#F8F6F3] lg:bg-white border border-espresso/12 rounded-2xl pl-11 pr-11 py-3 text-[13.5px] text-espresso outline-none focus:border-espresso/50 focus:bg-white transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setMdpVisible((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso/35 hover:text-espresso/60 transition-colors duration-150"
                title={mdpVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {mdpVisible ? <IconEyeOff style={{ width: '15px', height: '15px' }} /> : <IconEye style={{ width: '15px', height: '15px' }} />}
              </button>
            </div>
          </div>

          {erreur && (
            <p className="text-[11px] text-red-500 mb-3 text-center bg-red-50 border border-red-100 rounded-xl py-2 px-3">{erreur}</p>
          )}

          {/* Bouton de connexion classique — action principale, en premier */}
          <button
            onClick={valider}
            disabled={chargement}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {chargement && <span className="w-3.5 h-3.5 rounded-full border-2 border-peony/40 border-t-peony animate-spin flex-shrink-0" />}
            {chargement ? 'Un instant...' : (modeInscription ? 'Créer mon compte' : 'Me connecter')}
          </button>

          {/* Séparateur graphique */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex-1 h-px bg-espresso/10" />
            <span className="text-[9px] text-espresso/35 uppercase tracking-wide">ou</span>
            <div className="flex-1 h-px bg-espresso/10" />
          </div>

          {/* Bouton de connexion Google */}
          <button
            onClick={gererConnexionGoogle}
            disabled={chargementGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[13px] font-semibold text-espresso bg-white border border-espresso/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-espresso/30 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {chargementGoogle ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-espresso/25 border-t-espresso animate-spin flex-shrink-0" />
            ) : (
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} className="flex-shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {chargementGoogle ? 'Connexion...' : 'Continuer avec Google'}
          </button>

          {/* Message d'erreur Google */}
          {erreurGoogle && (
            <p className="text-[11px] text-red-500 text-center mb-3 bg-red-50 border border-red-100 rounded-xl py-2 px-3">
              {erreurGoogle}
            </p>
          )}

          <button
            onClick={() => { setModeInscription(!modeInscription); setErreur(''); setErreurGoogle('') }}
            className="w-full text-center text-[11px] text-espresso/50 hover:text-espresso transition-colors duration-200 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 rounded"
          >
            {modeInscription ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnexionScreen