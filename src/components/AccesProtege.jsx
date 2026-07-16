import { useState } from 'react'

// ============================================================
// PROTECTION PAR CODE PIN
// ⚠️ Honnêteté technique : ceci est une SIMPLE barrière de
// confidentialité personnelle (comme un verrou d'app), PAS une
// vraie sécurité — le code est stocké en clair dans le navigateur
// et n'importe qui avec accès aux DevTools pourrait le lire. Pour
// un usage "empêcher un proche de fouiller par curiosité", c'est
// largement suffisant.
// Premier passage : demande de DÉFINIR un code à 4 chiffres.
// Passages suivants : demande de le SAISIR. Une fois déverrouillé,
// reste ouvert pour le reste de la session (sessionStorage) — pas
// besoin de retaper à chaque clic dans l'app.
// ============================================================
function AccesProtege({ children, cleStorage = 'yuna-personnages-pin' }) {
  const [pinEnregistre, setPinEnregistre] = useState(() => localStorage.getItem(cleStorage))
  const [deverrouille, setDeverrouille] = useState(() => sessionStorage.getItem(`${cleStorage}-ok`) === '1')
  const [saisie, setSaisie] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  if (deverrouille) return children

  const validerSaisiePin = (val) => val.replace(/\D/g, '').slice(0, 4)

  // ===== PREMIÈRE UTILISATION : définir le code =====
  if (!pinEnregistre) {
    const definirCode = () => {
      if (saisie.length !== 4) { setErreur('Le code doit faire 4 chiffres.'); return }
      if (saisie !== confirmation) { setErreur('Les deux codes ne correspondent pas.'); return }
      localStorage.setItem(cleStorage, saisie)
      sessionStorage.setItem(`${cleStorage}-ok`, '1')
      setPinEnregistre(saisie)
      setDeverrouille(true)
    }

    return (
      <div className="h-full min-h-0 w-full flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-[320px] text-center">
          <p className="text-[15px] font-semibold text-espresso mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Protège cet espace 🔒
          </p>
          <p className="text-[11px] text-espresso/50 mb-5">Définis un code à 4 chiffres pour accéder à tes Personnages</p>

          <input
            type="tel" inputMode="numeric" autoFocus
            value={saisie}
            onChange={(e) => { setSaisie(validerSaisiePin(e.target.value)); setErreur('') }}
            placeholder="0000"
            className="w-full text-center text-[24px] tracking-[0.5em] bg-white border border-espresso/15 rounded-2xl py-3 outline-none focus:border-espresso mb-3"
          />
          <input
            type="tel" inputMode="numeric"
            value={confirmation}
            onChange={(e) => { setConfirmation(validerSaisiePin(e.target.value)); setErreur('') }}
            placeholder="Confirme le code"
            className="w-full text-center text-[16px] tracking-[0.3em] bg-white border border-espresso/15 rounded-2xl py-2.5 outline-none focus:border-espresso mb-3"
          />

          {erreur && <p className="text-[10.5px] text-red-500 mb-3">{erreur}</p>}

          <button
            onClick={definirCode}
            className="w-full rounded-2xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Définir mon code
          </button>
        </div>
      </div>
    )
  }

  // ===== UTILISATIONS SUIVANTES : saisir le code =====
  const tenterDeverrouillage = () => {
    if (saisie === pinEnregistre) {
      sessionStorage.setItem(`${cleStorage}-ok`, '1')
      setDeverrouille(true)
    } else {
      setErreur('Code incorrect.')
      setSaisie('')
    }
  }

  return (
    <div className="h-full min-h-0 w-full flex items-center justify-center bg-cream p-6">
      <div className="w-full max-w-[280px] text-center">
        <p className="text-[15px] font-semibold text-espresso mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Espace protégé 🔒
        </p>
        <input
          type="tel" inputMode="numeric" autoFocus
          value={saisie}
          onChange={(e) => { setSaisie(validerSaisiePin(e.target.value)); setErreur('') }}
          onKeyDown={(e) => e.key === 'Enter' && tenterDeverrouillage()}
          placeholder="Code à 4 chiffres"
          className="w-full text-center text-[24px] tracking-[0.5em] bg-white border border-espresso/15 rounded-2xl py-3 outline-none focus:border-espresso mb-3"
        />
        {erreur && <p className="text-[10.5px] text-red-500 mb-3">{erreur}</p>}
        <button
          onClick={tenterDeverrouillage}
          disabled={saisie.length !== 4}
          className="w-full rounded-2xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 disabled:opacity-40 active:scale-[0.98]"
        >
          Déverrouiller
        </button>
      </div>
    </div>
  )
}

export default AccesProtege