import { useState, useEffect } from 'react'
import { chargerDernierePosition, sauvegarderPosition, obtenirPositionActuelle, obtenirAdresseApprox } from '../services/localisation'

const IconPin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 2v6h-6M3 22v-6h6M3.5 9A9 9 0 0 1 21 6M20.5 15A9 9 0 0 1 3 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function LocalisationScreen() {
  const [position, setPosition] = useState(() => chargerDernierePosition())
  const [adresse, setAdresse] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const localiser = async () => {
    setChargement(true)
    setErreur('')
    try {
      const pos = await obtenirPositionActuelle()
      setPosition(pos)
      sauvegarderPosition(pos)

      const adresseTrouvee = await obtenirAdresseApprox(pos.latitude, pos.longitude)
      setAdresse(adresseTrouvee)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  // Localise automatiquement au premier chargement si aucune
  // position n'a jamais été enregistrée
  useEffect(() => {
    if (!position) localiser()
    else if (!adresse) {
      obtenirAdresseApprox(position.latitude, position.longitude).then(setAdresse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urlCarte = position
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${position.longitude - 0.01}%2C${position.latitude - 0.01}%2C${position.longitude + 0.01}%2C${position.latitude + 0.01}&layer=mapnik&marker=${position.latitude}%2C${position.longitude}`
    : null

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[800px] mx-auto">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-espresso/8 flex items-center justify-center">
            <IconPin style={{ width: '17px', height: '17px' }} className="text-espresso" />
          </div>
          <div>
            <h1 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px' }}>
              Ma position
            </h1>
            <p className="text-[10.5px] text-espresso/45">Ta localisation, en direct sur la carte</p>
          </div>
        </div>

        {/* ============================================================
            Note honnête : la position d'amis n'est PAS incluse ici —
            ça demanderait un vrai système de comptes utilisateurs avec
            leur consentement explicite, un projet à part entière.
            ============================================================ */}
        <p className="text-[10.5px] text-espresso/40 leading-relaxed mb-6 italic">
          Pour l'instant, seule ta propre position est affichée ici — le partage de position entre amis demanderait un vrai système de comptes, ce sera une prochaine étape si tu le souhaites.
        </p>

        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
            <p className="text-[11.5px] text-red-600">{erreur}</p>
          </div>
        )}

        {position ? (
          <>
            <div className="bg-white rounded-2xl border border-espresso/10 overflow-hidden mb-5">
              <iframe
                title="Carte de ma position"
                src={urlCarte}
                className="w-full"
                style={{ height: '320px', border: 'none' }}
                loading="lazy"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Coordonnées</p>
                <p className="text-[13px] text-espresso font-medium tabular-nums">
                  {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                </p>
                <p className="text-[10px] text-espresso/40 mt-1">Précision : ~{position.precision}m</p>
              </div>
              <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Dernière mise à jour</p>
                <p className="text-[13px] text-espresso font-medium">
                  {new Date(position.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {adresse && (
              <div className="bg-white rounded-2xl border border-espresso/10 p-4 mb-5">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Adresse approximative</p>
                <p className="text-[12.5px] text-espresso leading-relaxed">{adresse}</p>
              </div>
            )}
          </>
        ) : (
          !chargement && !erreur && (
            <p className="text-center text-espresso/40 italic py-16 text-[12px]">
              Aucune position enregistrée pour l'instant
            </p>
          )
        )}

        <button
          onClick={localiser}
          disabled={chargement}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
        >
          <IconRefresh style={{ width: '14px', height: '14px' }} className={chargement ? 'animate-spin' : ''} />
          {chargement ? 'Localisation en cours...' : 'Actualiser ma position'}
        </button>
      </div>
    </div>
  )
}

export default LocalisationScreen