import { useState, useEffect } from 'react'
import { chargerImages } from '../services/images'
import AIAvatar from '../components/AIAvatar'

const IconPhoto = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconCrayon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconCroix = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
  </svg>
)
const IconCoche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconRobotMini = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="6" y="9" width="12" height="10" rx="2.5" fill="currentColor" />
    <circle cx="9.5" cy="14" r="1.3" fill="#fff" />
    <circle cx="14.5" cy="14" r="1.3" fill="#fff" />
    <rect x="11" y="4" width="2" height="4" fill="currentColor" />
    <circle cx="12" cy="3.5" r="1.4" fill="currentColor" />
  </svg>
)
const IconCode = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M9 6L4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconFleur = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx="12" cy="6.5" rx="2.2" ry="3.4" fill="currentColor" opacity="0.85" transform={`rotate(${a} 12 12)`} />
    ))}
  </svg>
)
const IconMusique = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="7.5" cy="17" r="2.3" fill="currentColor" />
    <circle cx="16.5" cy="15" r="2.3" fill="currentColor" />
    <path d="M9.8 17V6l9-1.6V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)
const IconLivre = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12z" fill="currentColor" opacity="0.9" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12z" fill="currentColor" opacity="0.65" />
  </svg>
)
const IconCloche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3a5 5 0 0 0-5 5v3.5c0 1-0.4 2-1.2 2.7L5 15h14l-0.8-0.8A3.8 3.8 0 0 1 17 11.5V8a5 5 0 0 0-5-5z" fill="currentColor" />
    <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const CLE_PROFIL = 'yuna-profil-saki'

const profilParDefaut = {
  prenom: 'Saki', age: '20', ville: '', langue: 'Français', photoUrl: null,
  bio1: "Étudiante en L2, je construis mon premier vrai projet d'application complète — entre apprentissage et création, chaque ligne de code est une petite victoire.",
  bio2: "Passionnée par le développement web et le design, j'aime quand les interfaces sont à la fois belles et fonctionnelles. Yuna est mon tout premier projet IA.",
  bio3: "Aujourd'hui, je continue à apprendre, à coder, et à façonner cet espace personnel — doux, organisé, et qui me ressemble.",
  interets: ['Code', 'Anime', 'Musique'],
}

const interetsDisponibles = [
  { id: 'Code',    label: 'Code',       Icone: IconCode    },
  { id: 'Anime',   label: 'Anime',      Icone: IconFleur   },
  { id: 'Musique', label: 'Musique',    Icone: IconMusique },
  { id: 'Lecture', label: 'Lecture',    Icone: IconLivre   },
  { id: 'Jeux',    label: 'Jeux vidéo', Icone: IconCode    },
  { id: 'Dessin',  label: 'Dessin',     Icone: IconFleur   },
]

function ProfileScreen({ onChangerEcran }) {

  const [profil, setProfil] = useState(profilParDefaut)
  const [modeEdition, setModeEdition] = useState(false)
  const [afficherSelecteurPhoto, setAfficherSelecteurPhoto] = useState(false)
  const [imagesGalerie, setImagesGalerie] = useState([])

  useEffect(() => {
    const profilSauvegarde = localStorage.getItem(CLE_PROFIL)
    if (profilSauvegarde) setProfil(JSON.parse(profilSauvegarde))
    setImagesGalerie(chargerImages())
  }, [])

  const sauvegarderProfil = () => {
    localStorage.setItem(CLE_PROFIL, JSON.stringify(profil))
    setModeEdition(false)
  }

  const modifierChamp = (champ, valeur) => setProfil((a) => ({ ...a, [champ]: valeur }))

  const toggleInteret = (id) => {
    setProfil((ancien) => {
      const dejaActif = ancien.interets.includes(id)
      return { ...ancien, interets: dejaActif ? ancien.interets.filter((i) => i !== id) : [...ancien.interets, id] }
    })
  }

  const choisirPhotoProfil = (urlImage) => {
    const profilMisAJour = { ...profil, photoUrl: urlImage }
    setProfil(profilMisAJour)
    localStorage.setItem(CLE_PROFIL, JSON.stringify(profilMisAJour))
    setAfficherSelecteurPhoto(false)
  }

  const champsRemplis = [profil.prenom, profil.age, profil.ville, profil.bio1].filter(Boolean).length
  const pourcentageCompletion = Math.round((champsRemplis / 4) * 100)

  return (
    // FIX : min-h-0 sur le conteneur racine — nécessaire car c'est
    // ICI que se trouve le "overflow-y-auto" qui doit scroller toute
    // la page (bannière + colonne gauche + colonne droite ensemble).
    <div className="h-full min-h-0 w-full overflow-y-auto">

      <div
        className="w-full min-h-full grid grid-cols-1 md:grid-cols-[1fr_300px]"
        style={{ boxShadow: '0 20px 50px rgba(62,39,35,0.12)' }}
      >

        <div className="px-4 md:px-7 py-5 md:py-7 bg-[#F0EEEB]">

          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-espresso/8">
              <IconCloche style={{ width: '15px', height: '15px' }} className="text-espresso" />
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-espresso/10 transition-all duration-200 focus-within:border-espresso/40 focus-within:shadow-[0_0_0_3px_rgba(62,39,35,0.06)]">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-espresso/35 flex-shrink-0">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher dans mon profil..."
                className="flex-1 bg-transparent outline-none text-[11px] text-espresso placeholder:text-espresso/35"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-3 mb-5">
            <div
              className="relative flex-1 w-full rounded-[24px] overflow-hidden flex-shrink-0"
              style={{ minHeight: '220px', height: '220px', backgroundColor: '#3E2723' }}
            >
              {profil.photoUrl ? (
                <>
                  <img
                    src={profil.photoUrl}
                    alt="Photo de profil"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(62,39,35,0.78) 0%, rgba(62,39,35,0.1) 40%, transparent 65%)' }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #6B4F46, #3E2723)' }}>
                  <AIAvatar size={80} />
                </div>
              )}

              <div
                className="absolute bottom-3 left-3 right-3 rounded-2xl p-4"
                style={{ background: 'rgba(62,39,35,0.6)', backdropFilter: 'blur(5px)' }}
              >
                <p className="text-peony font-semibold text-[13px] truncate">L'aventure Yuna (2026)</p>
                <p className="text-peony/75 text-[10.5px] mt-1 leading-relaxed line-clamp-2">
                  Construire sa propre IA compagnon en L2 — entre apprentissage du code
                  et envie de créer quelque chose qui me ressemble vraiment.
                </p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 justify-center md:pl-1">
              <button
                onClick={() => setModeEdition(!modeEdition)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-espresso transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ boxShadow: '0 4px 12px rgba(62,39,35,0.18)' }}
                title="Modifier mon profil"
              >
                <IconCrayon style={{ width: '16px', height: '16px' }} className="text-peony" />
              </button>

              <button
                onClick={() => setAfficherSelecteurPhoto(true)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-espresso transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ boxShadow: '0 4px 12px rgba(62,39,35,0.18)' }}
                title="Choisir ma photo depuis la galerie"
              >
                <IconPhoto style={{ width: '16px', height: '16px' }} className="text-peony" />
              </button>

              <button
                onClick={() => onChangerEcran && onChangerEcran('chat')}
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-espresso transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ boxShadow: '0 4px 12px rgba(62,39,35,0.18)' }}
                title="Discuter avec Yuna"
              >
                <IconRobotMini style={{ width: '16px', height: '16px' }} className="text-peony" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] text-espresso/60 font-medium whitespace-nowrap">
              Profil complété
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-espresso/10 overflow-hidden">
              <div className="h-full rounded-full bg-espresso transition-all duration-500" style={{ width: `${pourcentageCompletion}%` }} />
            </div>
            <span className="text-[10px] font-medium text-espresso/60 whitespace-nowrap w-7 text-right">{pourcentageCompletion}%</span>
          </div>

          <div>
            <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium mb-3">
              Informations
            </h2>

            {modeEdition ? (
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Prénom</label>
                  <input type="text" value={profil.prenom} onChange={(e) => modifierChamp('prenom', e.target.value)}
                    className="w-full bg-white rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Âge</label>
                  <input type="text" value={profil.age} onChange={(e) => modifierChamp('age', e.target.value)}
                    className="w-full bg-white rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ville</label>
                  <input type="text" value={profil.ville} onChange={(e) => modifierChamp('ville', e.target.value)} placeholder="Non renseignée"
                    className="w-full bg-white rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Langue</label>
                  <input type="text" value={profil.langue} onChange={(e) => modifierChamp('langue', e.target.value)}
                    className="w-full bg-white rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200" />
                </div>
                <button onClick={sauvegarderProfil}
                  className="col-span-2 mt-1 rounded-xl py-2.5 text-[11px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
                  ✓ Sauvegarder mon profil
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                <div className="bg-white rounded-xl px-3 py-2.5 border border-espresso/10 h-[58px] flex flex-col justify-center">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Prénom</p>
                  <p className="text-[12px] text-espresso font-medium mt-0.5 truncate">{profil.prenom}</p>
                </div>
                <div className="bg-white rounded-xl px-3 py-2.5 border border-espresso/10 h-[58px] flex flex-col justify-center">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Âge</p>
                  <p className="text-[12px] text-espresso font-medium mt-0.5">{profil.age} ans</p>
                </div>
                <div className="bg-white rounded-xl px-3 py-2.5 border border-espresso/10 h-[58px] flex flex-col justify-center">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Ville</p>
                  <p className={`text-[12px] mt-0.5 truncate ${profil.ville ? 'text-espresso font-medium' : 'text-espresso/30 italic'}`}>
                    {profil.ville || 'Non renseignée'}
                  </p>
                </div>
                <div className="bg-white rounded-xl px-3 py-2.5 border border-espresso/10 h-[58px] flex flex-col justify-center">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Langue</p>
                  <p className="text-[12px] text-espresso font-medium mt-0.5 truncate">{profil.langue}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium mb-3">
              Mes centres d'intérêt
            </h2>
            <div className="flex flex-wrap gap-2">
              {interetsDisponibles.map((interet) => {
                const estActif = profil.interets.includes(interet.id)
                return (
                  <button
                    key={interet.id}
                    onClick={() => toggleInteret(interet.id)}
                    className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      estActif ? 'bg-espresso text-peony border border-espresso' : 'bg-white text-espresso/55 border border-espresso/12 hover:border-espresso/30'
                    }`}
                  >
                    <interet.Icone style={{ width: '12px', height: '12px' }} />
                    {interet.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-5 md:py-7 bg-white flex flex-col md:border-l border-espresso/10">

          <div className="flex items-center gap-3.5 mb-6">
            <button
              onClick={() => setAfficherSelecteurPhoto(true)}
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden group bg-cream transition-transform duration-200 hover:scale-105"
              title="Changer ma photo de profil"
            >
              {profil.photoUrl ? (
                <img src={profil.photoUrl} alt="Photo de profil" className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
              ) : (
                <AIAvatar size={30} />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                <IconCrayon style={{ width: '14px', height: '14px' }} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-espresso truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}>
                {profil.prenom}
              </p>
              <p className="text-[10.5px] text-espresso/45">Étudiante L2 · Créatrice de Yuna</p>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-7 bg-espresso">
            <p className="text-[9px] text-peony/60 uppercase tracking-wide mb-2">💬 Ce que Yuna sait de toi</p>
            <p className="text-[11px] text-peony italic leading-relaxed">
              "Salut {profil.prenom} ! 🌸 J'ai vu que t'aimes bien {profil.interets.slice(0, 2).join(' et ').toLowerCase() || 'plein de choses'} — on en parle quand tu veux !"
            </p>
          </div>

          <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium mb-4">
            Mon histoire
          </h2>

          {/* Les 3 blocs (Qui je suis / Ce projet / Aujourd'hui) — mb-8
              en bas garantit un espace de respiration après le dernier
              bloc, pour ne jamais coller au bord de l'écran sur mobile
              (sans ça, "Aujourd'hui" pouvait sembler "coupé") */}
          <div className="flex flex-col gap-5 mb-8">
            {[
              { titre: 'Qui je suis', texte: profil.bio1 },
              { titre: 'Ce projet',   texte: profil.bio2 },
              { titre: "Aujourd'hui", texte: profil.bio3 },
            ].map((bloc) => (
              <div key={bloc.titre} className="pb-5 border-b border-espresso/8 last:border-0 last:pb-0">
                <p className="text-[11.5px] font-semibold text-espresso mb-1.5">{bloc.titre}</p>
                <p className="text-[11px] text-espresso/55 leading-[1.7]">{bloc.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {afficherSelecteurPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-espresso/50" onClick={() => setAfficherSelecteurPhoto(false)}>
          <div className="bg-white rounded-3xl p-5 md:p-6 max-w-[500px] w-full max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-espresso" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px' }}>
                Choisir ma photo de profil
              </h3>
              <button onClick={() => setAfficherSelecteurPhoto(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200">
                <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
              </button>
            </div>

            {imagesGalerie.filter((img) => img.url).length === 0 && (
              <p className="text-[12px] text-espresso/40 italic text-center py-10">
                Aucune image dans ta galerie pour l'instant.<br/>
                Ajoute des photos depuis l'onglet Galerie d'abord.
              </p>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {imagesGalerie.filter((img) => img.url).map((img) => (
                <button
                  key={img.id}
                  onClick={() => choisirPhotoProfil(img.url)}
                  className="relative rounded-xl overflow-hidden aspect-square transition-transform duration-150 hover:scale-95"
                  style={{ border: profil.photoUrl === img.url ? '3px solid #3E2723' : '2px solid transparent' }}
                >
                  <img src={img.url} alt={img.titre} className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
                  {profil.photoUrl === img.url && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-espresso flex items-center justify-center">
                      <IconCoche style={{ width: '11px', height: '11px' }} className="text-peony" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileScreen