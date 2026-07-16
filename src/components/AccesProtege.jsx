import { useState } from 'react'
import { CODE_ACCES_PERSONNAGES } from '../config/acces'

// ============================================================
// PROTECTION PAR CODE FIXE
// Le code est défini UNE FOIS dans config/acces.js — aucun visiteur
// ne peut le redéfinir. Une fois le bon code entré, "déverrouillé"
// reste vrai pour la session du navigateur (sessionStorage) — pas
// besoin de retaper à chaque clic, mais retapé à chaque nouvelle
// visite/onglet, ce qui est plus sûr qu'un stockage permanent.
// ============================================================
function AccesProtege({ children }) {
  const [deverrouille, setDeverrouille] = useState(() => sessionStorage.getItem('yuna-perso-ok') === '1')
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState('')

  if (deverrouille) return children

  const validerSaisiePin = (val) => val.replace(/\D/g, '').slice(0, 4)

  const tenterDeverrouillage = () => {
    if (saisie === CODE_ACCES_PERSONNAGES) {
      sessionStorage.setItem('yuna-perso-ok', '1')
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