import { useState, useEffect, useRef } from 'react'
import {
  chargerDernierePosition,
  sauvegarderPosition,
  obtenirPositionActuelle,
  obtenirAdresseApprox,
  chargerHistoriquePositions,
  chargerLieuxFavoris,
  sauvegarderLieuFavori,
  supprimerLieuFavori,
  calculerDistanceKm,
} from '../services/localisation'
import { notifierErreur, notifierSucces } from '../services/notifications'

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
const IconCopier = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconPartager = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconItineraire = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 19l6-14 4 8 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconEtoile = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6L12 2z" />
  </svg>
)
const IconHistorique = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

// Retourne un badge {texte, couleur} selon la précision GPS en mètres
function evaluerPrecision(metres) {
  if (metres <= 20) return { texte: 'Excellente', couleur: '#3E8E5A' }
  if (metres <= 100) return { texte: 'Bonne', couleur: '#C99A2E' }
  return { texte: 'Faible', couleur: '#C6564B' }
}

function tempsEcoule(dateISO) {
  const diffMin = Math.round((Date.now() - new Date(dateISO).getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return `il y a ${Math.round(diffH / 24)} j`
}

function LocalisationScreen() {
  const [position, setPosition] = useState(() => chargerDernierePosition())
  const [adresse, setAdresse] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  // Le point actuellement centré sur la carte : soit ma position,
  // soit un lieu favori / une entrée d'historique cliqué(e)
  const [centreCarte, setCentreCarte] = useState(null)

  const [historique, setHistorique] = useState([])
  const [lieuxFavoris, setLieuxFavoris] = useState([])
  const [nomNouveauFavori, setNomNouveauFavori] = useState('')
  const [afficherFormFavori, setAfficherFormFavori] = useState(false)

  const [actualisationAuto, setActualisationAuto] = useState(false)
  const intervalleRef = useRef(null)

  const localiser = async (silencieux = false) => {
    setChargement(true)
    if (!silencieux) setErreur('')
    try {
      const pos = await obtenirPositionActuelle()
      setPosition(pos)
      setCentreCarte(pos)
      sauvegarderPosition(pos)
      setHistorique(chargerHistoriquePositions())

      const adresseTrouvee = await obtenirAdresseApprox(pos.latitude, pos.longitude)
      setAdresse(adresseTrouvee)
    } catch (e) {
      if (!silencieux) setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  // Localise automatiquement au premier chargement si aucune
  // position n'a jamais été enregistrée
  useEffect(() => {
    setHistorique(chargerHistoriquePositions())
    setLieuxFavoris(chargerLieuxFavoris())
    if (!position) {
      localiser()
    } else {
      setCentreCarte(position)
      obtenirAdresseApprox(position.latitude, position.longitude).then(setAdresse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actualisation automatique toutes les 2 minutes si activée
  useEffect(() => {
    if (actualisationAuto) {
      intervalleRef.current = setInterval(() => localiser(true), 2 * 60 * 1000)
    } else {
      clearInterval(intervalleRef.current)
    }
    return () => clearInterval(intervalleRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualisationAuto])

  const centre = centreCarte || position
  const urlCarte = centre
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${centre.longitude - 0.01}%2C${centre.latitude - 0.01}%2C${centre.longitude + 0.01}%2C${centre.latitude + 0.01}&layer=mapnik&marker=${centre.latitude}%2C${centre.longitude}`
    : null

  const copierCoordonnees = async () => {
    if (!position) return
    const texte = `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
    try {
      await navigator.clipboard.writeText(texte)
      notifierSucces('Coordonnées copiées 📋')
    } catch {
      notifierErreur('Impossible de copier automatiquement — coordonnées : ' + texte)
    }
  }

  const partagerPosition = async () => {
    if (!position) return
    const lien = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ma position', text: 'Voici où je suis :', url: lien })
      } catch {
        // annulé par l'utilisateur, rien à faire
      }
    } else {
      await navigator.clipboard.writeText(lien)
      notifierSucces('Lien de position copié 📋')
    }
  }

  const ouvrirItineraire = (lat, lon) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
  }

  const enregistrerFavori = () => {
    if (!nomNouveauFavori.trim() || !position) return
    const lieux = sauvegarderLieuFavori({
      nom: nomNouveauFavori.trim(),
      latitude: position.latitude,
      longitude: position.longitude,
    })
    setLieuxFavoris(lieux)
    setNomNouveauFavori('')
    setAfficherFormFavori(false)
    notifierSucces(`"${nomNouveauFavori.trim()}" ajouté à tes lieux favoris ⭐`)
  }

  const retirerFavori = (e, id) => {
    e.stopPropagation()
    setLieuxFavoris(supprimerLieuFavori(id))
  }

  const precisionInfo = position ? evaluerPrecision(position.precision) : null

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
            ça demande un vrai backend (comptes utilisateurs, base de
            données partagée) avec leur consentement explicite, ce
            n'est pas quelque chose que localStorage peut faire.
            ============================================================ */}
        <p className="text-[10.5px] text-espresso/40 leading-relaxed mb-6 italic">
          Pour l'instant, seule ta propre position est affichée ici — le partage de position entre amis demande un vrai système de comptes et un serveur partagé (pas seulement ce fichier), avec leur consentement explicite. Prochaine étape possible si tu veux t'y mettre.
        </p>

        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
            <p className="text-[11.5px] text-red-600">{erreur}</p>
          </div>
        )}

        {position ? (
          <>
            <div className="bg-white rounded-2xl border border-espresso/10 overflow-hidden mb-3 relative">
              <iframe
                title="Carte de ma position"
                src={urlCarte}
                className="w-full"
                style={{ height: '320px', border: 'none' }}
                loading="lazy"
              />
              {centreCarte && position && centreCarte !== position && (centreCarte.latitude !== position.latitude || centreCarte.longitude !== position.longitude) && (
                <button
                  onClick={() => setCentreCarte(position)}
                  className="absolute top-3 right-3 text-[10.5px] font-semibold text-espresso bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow"
                >
                  Revenir à ma position
                </button>
              )}
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button onClick={copierCoordonnees} className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-espresso/10 py-3 hover:bg-espresso/5 transition-colors duration-150">
                <IconCopier style={{ width: '15px', height: '15px' }} className="text-espresso/60" />
                <span className="text-[9.5px] text-espresso/55">Copier</span>
              </button>
              <button onClick={partagerPosition} className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-espresso/10 py-3 hover:bg-espresso/5 transition-colors duration-150">
                <IconPartager style={{ width: '15px', height: '15px' }} className="text-espresso/60" />
                <span className="text-[9.5px] text-espresso/55">Partager</span>
              </button>
              <button onClick={() => ouvrirItineraire(position.latitude, position.longitude)} className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-espresso/10 py-3 hover:bg-espresso/5 transition-colors duration-150">
                <IconItineraire style={{ width: '15px', height: '15px' }} className="text-espresso/60" />
                <span className="text-[9.5px] text-espresso/55">Itinéraire</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Coordonnées</p>
                <p className="text-[13px] text-espresso font-medium tabular-nums">
                  {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: precisionInfo.couleur }} />
                  <p className="text-[10px] text-espresso/45">Précision {precisionInfo.texte.toLowerCase()} (~{position.precision}m)</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Dernière mise à jour</p>
                <p className="text-[13px] text-espresso font-medium">
                  {new Date(position.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] text-espresso/45 mt-1.5">{tempsEcoule(position.date)}</p>
              </div>
            </div>

            {(position.vitesse != null || position.altitude != null) && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {position.vitesse != null && (
                  <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Vitesse</p>
                    <p className="text-[13px] text-espresso font-medium">{position.vitesse} km/h</p>
                  </div>
                )}
                {position.altitude != null && (
                  <div className="bg-white rounded-2xl border border-espresso/10 p-4">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Altitude</p>
                    <p className="text-[13px] text-espresso font-medium">{position.altitude} m</p>
                  </div>
                )}
              </div>
            )}

            {adresse && (
              <div className="bg-white rounded-2xl border border-espresso/10 p-4 mb-5">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Adresse approximative</p>
                <p className="text-[12.5px] text-espresso leading-relaxed">{adresse}</p>
              </div>
            )}

            {/* ===== LIEUX FAVORIS ===== */}
            <div className="bg-white rounded-2xl border border-espresso/10 p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Lieux favoris</p>
                <button
                  onClick={() => setAfficherFormFavori((a) => !a)}
                  className="text-[10.5px] font-semibold text-espresso underline underline-offset-2"
                >
                  {afficherFormFavori ? 'Annuler' : '+ Enregistrer ici'}
                </button>
              </div>

              {afficherFormFavori && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={nomNouveauFavori}
                    onChange={(e) => setNomNouveauFavori(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enregistrerFavori()}
                    placeholder="Ex : Maison, Travail..."
                    className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus:border-espresso"
                  />
                  <button onClick={enregistrerFavori} className="rounded-xl px-3.5 text-[11px] font-semibold text-peony bg-espresso">
                    Ajouter
                  </button>
                </div>
              )}

              {lieuxFavoris.length === 0 ? (
                <p className="text-[10.5px] text-espresso/35 italic">Aucun lieu favori enregistré</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {lieuxFavoris.map((lieu) => {
                    const distance = calculerDistanceKm(position.latitude, position.longitude, lieu.latitude, lieu.longitude)
                    return (
                      <div
                        key={lieu.id}
                        onClick={() => setCentreCarte(lieu)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#F0EEEB] transition-colors duration-150 cursor-pointer"
                      >
                        <IconEtoile style={{ width: '13px', height: '13px' }} className="text-espresso/40 flex-shrink-0" fill="currentColor" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-medium text-espresso truncate">{lieu.nom}</p>
                          <p className="text-[9.5px] text-espresso/45">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} de toi</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); ouvrirItineraire(lieu.latitude, lieu.longitude) }}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0"
                          title="Itinéraire"
                        >
                          <IconItineraire style={{ width: '12px', height: '12px' }} className="text-espresso/50" />
                        </button>
                        <button onClick={(e) => retirerFavori(e, lieu.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0" title="Supprimer">
                          <IconTrash style={{ width: '12px', height: '12px' }} className="text-espresso/40" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ===== HISTORIQUE ===== */}
            {historique.length > 1 && (
              <div className="bg-white rounded-2xl border border-espresso/10 p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <IconHistorique style={{ width: '13px', height: '13px' }} className="text-espresso/40" />
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Historique des positions</p>
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scroll-suave">
                  {historique.slice(0, 15).map((pos, i) => (
                    <button
                      key={pos.date + i}
                      onClick={() => setCentreCarte(pos)}
                      className="flex items-center justify-between text-left rounded-lg px-2.5 py-1.5 hover:bg-[#F0EEEB] transition-colors duration-150"
                    >
                      <span className="text-[10.5px] text-espresso/60 tabular-nums">{pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}</span>
                      <span className="text-[9.5px] text-espresso/35">{tempsEcoule(pos.date)}</span>
                    </button>
                  ))}
                </div>
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
          onClick={() => localiser()}
          disabled={chargement}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
        >
          <IconRefresh style={{ width: '14px', height: '14px' }} className={chargement ? 'animate-spin' : ''} />
          {chargement ? 'Localisation en cours...' : 'Actualiser ma position'}
        </button>

        <label className="flex items-center justify-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={actualisationAuto}
            onChange={(e) => setActualisationAuto(e.target.checked)}
            className="accent-espresso"
          />
          <span className="text-[10.5px] text-espresso/50">Actualiser automatiquement toutes les 2 minutes</span>
        </label>
      </div>
    </div>
  )
}

export default LocalisationScreen