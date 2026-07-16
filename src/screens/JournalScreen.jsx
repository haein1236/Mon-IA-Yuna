import { useState, useEffect, useRef, useMemo } from 'react'
import { chargerEntreesJournal, sauvegarderEntreeJournal, obtenirEntreeDuJour, HUMEURS } from '../services/journal'
import { genererResumeJournal } from '../services/gemini'
import { notifierErreur, notifierSucces } from '../services/notifications'
import { fichierVersBase64 } from '../services/images'

// ============================================================
// UTILITAIRES DATE
// ============================================================
function formaterDateISO(date) {
  return date.toISOString().slice(0, 10)
}

function formaterDateLongue(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const texte = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function obtenirSalutation(heure) {
  if (heure < 5) return 'Encore réveillée à cette heure'
  if (heure < 12) return 'Bonjour'
  if (heure < 18) return 'Bon après-midi'
  if (heure < 22) return 'Bonsoir'
  return 'Bonne nuit'
}

// ============================================================
// ICÔNES LOCALES
// ============================================================
const IconPlus = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>)
const IconCheck = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconEtoiles = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
const IconRecherche = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><line x1="21" y1="21" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
const IconTag = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M20.5 12.5l-8-8H4v8.5l8 8a1.5 1.5 0 0 0 2.1 0l6.4-6.4a1.5 1.5 0 0 0 0-2.1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" /></svg>)
const IconPlay = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><polygon points="6 3 20 12 6 21 6 3" /></svg>)
const IconPause = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>)
const IconTelechargement = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3v13m0 0l-4.5-4.5M12 16l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
const IconCamera = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" /></svg>)
const IconFeu = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 22c4.5 0 7-2.7 7-6.5C19 11 15 8 14 4c-.5 2.5-2 3.5-3 5-1.3 1.8-4 3-4 6.5C7 19.3 7.5 22 12 22z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>)
const IconGraphique = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
const IconCroix = (props) => (<svg viewBox="0 0 24 24" fill="none" {...props}><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>)

// ============================================================
// CITATIONS DU JOUR — une par jour, choisie de façon déterministe
// (même citation toute la journée, change le lendemain)
// ============================================================
const CITATIONS = [
  "Chaque jour est une page blanche ; écris-la avec douceur envers toi-même.",
  "Tu n'as pas besoin d'être parfaite pour avoir de la valeur.",
  "Les petits pas comptent autant que les grands bonds.",
  "Ce que tu ressens aujourd'hui n'est pas ce que tu ressentiras toujours.",
  "Prendre soin de soi n'est jamais un luxe, c'est une nécessité.",
  "Ta présence à toi-même est le plus beau cadeau que tu puisses te faire.",
  "Il est normal de ne pas être normale.",
  "Respire. Tu fais déjà de ton mieux.",
  "La patience envers soi-même est une forme de courage.",
  "Chaque page de ce journal est une preuve que tu avances.",
  "Le repos fait partie du chemin, pas une pause dans le chemin.",
  "Tu as le droit de ralentir sans culpabiliser.",
  "Ce que tu construis en silence finit toujours par se voir.",
  "Sois aussi bienveillante envers toi qu'envers celles et ceux que tu aimes.",
]

function citationDuJour(dateISO) {
  const jourDeAnnee = Math.floor(new Date(dateISO + 'T00:00:00') / 86400000)
  return CITATIONS[jourDeAnnee % CITATIONS.length]
}

// ============================================================
// MÉTÉO SIMULÉE — génère une météo "pseudo-aléatoire" mais stable
// pour une date donnée (même météo toute la journée). Prévu pour
// être remplacé plus tard par un vrai appel API (voir commentaire
// dans le composant WidgetMeteo plus bas).
// ============================================================
const CONDITIONS_METEO = [
  { icone: '☀️', label: 'Ensoleillé', tempMin: 22, tempMax: 32 },
  { icone: '⛅', label: 'Éclaircies', tempMin: 16, tempMax: 24 },
  { icone: '☁️', label: 'Nuageux', tempMin: 12, tempMax: 19 },
  { icone: '🌧️', label: 'Pluvieux', tempMin: 9, tempMax: 15 },
  { icone: '🌙', label: 'Nuit claire', tempMin: 8, tempMax: 14 },
]

function meteoSimuleeDuJour(dateISO) {
  // Petit hash déterministe à partir de la date, pour ne pas changer
  // à chaque re-render mais changer chaque jour.
  let hash = 0
  for (const char of dateISO) hash = (hash * 31 + char.charCodeAt(0)) % 997
  const condition = CONDITIONS_METEO[hash % CONDITIONS_METEO.length]
  const temperature = condition.tempMin + (hash % (condition.tempMax - condition.tempMin + 1))
  return { ...condition, temperature }
}

// ============================================================
// STATISTIQUES — calculées à partir de TOUTES les entrées
// ============================================================
function calculerStatistiques(entrees) {
  const dates = new Set(entrees.map((e) => e.date))
  const joursEcrits = entrees.length

  // Série actuelle : on remonte jour par jour depuis aujourd'hui
  let streakActuel = 0
  const curseur = new Date()
  while (dates.has(formaterDateISO(curseur))) {
    streakActuel++
    curseur.setDate(curseur.getDate() - 1)
  }

  // Plus longue série jamais atteinte
  const datesTriees = [...dates].sort()
  let streakMax = 0
  let streakCourante = 0
  let dernierJour = null
  for (const dateStr of datesTriees) {
    const jour = new Date(dateStr + 'T00:00:00')
    streakCourante = dernierJour && Math.round((jour - dernierJour) / 86400000) === 1 ? streakCourante + 1 : 1
    streakMax = Math.max(streakMax, streakCourante)
    dernierJour = jour
  }

  // Humeur la plus fréquente
  const comptage = {}
  entrees.forEach((e) => { if (e.humeur) comptage[e.humeur] = (comptage[e.humeur] || 0) + 1 })
  const humeurDominanteId = Object.entries(comptage).sort((a, b) => b[1] - a[1])[0]?.[0]

  // Pourcentage d'objectifs réalisés, toutes entrées confondues
  let totalObjectifs = 0, objectifsFaits = 0
  entrees.forEach((e) => (e.objectifs || []).forEach((o) => { totalObjectifs++; if (o.fait) objectifsFaits++ }))
  const pourcentageObjectifs = totalObjectifs ? Math.round((objectifsFaits / totalObjectifs) * 100) : 0

  return { joursEcrits, streakActuel, streakMax, humeurDominanteId, pourcentageObjectifs }
}

// ============================================================
// PETIT COMPOSANT : carte "glassmorphique" réutilisable
// (fond translucide + flou + bordure fine + ombre douce)
// ============================================================
function CarteVerre({ children, className = '', style }) {
  return (
    <div
      className={`rounded-2xl border border-espresso/10 bg-white/70 backdrop-blur-md p-5 transition-all duration-300 ${className}`}
      style={{ boxShadow: '0 8px 30px rgba(62,39,35,0.06)', ...style }}
    >
      {children}
    </div>
  )
}

// ============================================================
// PETIT COMPOSANT : bouton avec effet "ripple" au clic (aucune
// librairie — juste un span animé ajouté/retiré au clic)
// ============================================================
function BoutonRipple({ onClick, className = '', children, style, ...props }) {
  const [ripples, setRipples] = useState([])

  const gererClic = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const taille = Math.max(rect.width, rect.height) * 2
    const nouveauRipple = {
      id: Date.now(),
      x: e.clientX - rect.left - taille / 2,
      y: e.clientY - rect.top - taille / 2,
      taille,
    }
    setRipples((r) => [...r, nouveauRipple])
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== nouveauRipple.id)), 600)
    onClick?.(e)
  }

  return (
    <button
      onClick={gererClic}
      className={`relative overflow-hidden ${className}`}
      style={style}
      {...props}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x, top: r.y, width: r.taille, height: r.taille,
            background: 'currentColor', opacity: 0.18,
            animation: 'rippleAnim 0.6s ease-out forwards',
          }}
        />
      ))}
    </button>
  )
}

function JournalScreen() {
  const [dateChoisie, setDateChoisie] = useState(() => formaterDateISO(new Date()))
  const [entrees, setEntrees] = useState([])
  const [chargement, setChargement] = useState(true)

  const [humeur, setHumeur] = useState('bien')
  const [pensees, setPensees] = useState('')
  const [objectifs, setObjectifs] = useState([])
  const [nouvelObjectif, setNouvelObjectif] = useState('')

  const [tags, setTags] = useState([])
  const [nouveauTag, setNouveauTag] = useState('')
  const [tagsFiltre, setTagsFiltre] = useState([])

  const [energie, setEnergie] = useState(70)
  const [gratitude, setGratitude] = useState(['', '', ''])
  const [photo, setPhoto] = useState(null)

  const [resume, setResume] = useState('')
  const [chargementResume, setChargementResume] = useState(false)

  const [recherche, setRecherche] = useState('')
  const [sauvegardeAnimee, setSauvegardeAnimee] = useState(false)

  const [lectureEnCours, setLectureEnCours] = useState(false)
  const [progressionLecture, setProgressionLecture] = useState(0)

  const inputPhotoRef = useRef(null)
  const minuteurLectureRef = useRef(null)
  const horlogeRef = useRef(new Date())
  const [, forcerRafraichissement] = useState(0)

  // ===== HORLOGE TEMPS RÉEL — tick chaque seconde =====
  useEffect(() => {
    const intervalle = setInterval(() => {
      horlogeRef.current = new Date()
      forcerRafraichissement((n) => n + 1)
    }, 1000)
    return () => clearInterval(intervalle)
  }, [])
  const maintenant = horlogeRef.current

  // ===== CHARGEMENT INITIAL (avec un court skeleton, effet premium) =====
  useEffect(() => {
    setEntrees(chargerEntreesJournal())
    const timer = setTimeout(() => setChargement(false), 380)
    return () => clearTimeout(timer)
  }, [])

  // Charge l'entrée existante quand on change de date
  useEffect(() => {
    const entree = obtenirEntreeDuJour(dateChoisie)
    if (entree) {
      setHumeur(entree.humeur || 'bien')
      setPensees(entree.pensees || '')
      setObjectifs(entree.objectifs || [])
      setTags(entree.tags || [])
      setEnergie(entree.energie ?? 70)
      setGratitude(entree.gratitude?.length === 3 ? entree.gratitude : ['', '', ''])
      setPhoto(entree.photo || null)
    } else {
      setHumeur('bien')
      setPensees('')
      setObjectifs([])
      setTags([])
      setEnergie(70)
      setGratitude(['', '', ''])
      setPhoto(null)
    }
  }, [dateChoisie])

  // ===== LECTEUR MUSICAL — simulation front-end. Pour brancher un
  // vrai fichier audio relaxant : ajoute-le dans /public/audio/ puis
  // remplace ce setInterval par les événements d'un vrai <audio> :
  // ontimeupdate, onended, currentTime/duration.
  useEffect(() => {
    if (lectureEnCours) {
      minuteurLectureRef.current = setInterval(() => {
        setProgressionLecture((p) => (p >= 100 ? 0 : p + 0.6))
      }, 200)
    } else {
      clearInterval(minuteurLectureRef.current)
    }
    return () => clearInterval(minuteurLectureRef.current)
  }, [lectureEnCours])

  // ===== STATISTIQUES (recalculées seulement si les entrées changent) =====
  const stats = useMemo(() => calculerStatistiques(entrees), [entrees])
  const humeurDominante = HUMEURS.find((h) => h.id === stats.humeurDominanteId)

  // Tous les tags existants, pour proposer des filtres
  const tousLesTags = useMemo(() => {
    const ensemble = new Set()
    entrees.forEach((e) => (e.tags || []).forEach((t) => ensemble.add(t)))
    return [...ensemble]
  }, [entrees])

  // Résultats de recherche (pensées + objectifs + tags), combinés au
  // filtre de tags actif
  const entreesFiltrees = useMemo(() => {
    return entrees.filter((e) => {
      const correspondTags = tagsFiltre.length === 0 || (e.tags || []).some((t) => tagsFiltre.includes(t))
      if (!correspondTags) return false
      if (!recherche.trim()) return true
      const q = recherche.toLowerCase()
      const dansPensees = (e.pensees || '').toLowerCase().includes(q)
      const dansObjectifs = (e.objectifs || []).some((o) => o.texte.toLowerCase().includes(q))
      const dansTags = (e.tags || []).some((t) => t.toLowerCase().includes(q))
      return dansPensees || dansObjectifs || dansTags
    })
  }, [entrees, recherche, tagsFiltre])

  const activiteRecente = useMemo(() =>
    [...entreesFiltrees].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
  [entreesFiltrees])

  // ===== SAUVEGARDE =====
  const sauvegarder = () => {
    const nouvelleEntree = { date: dateChoisie, humeur, pensees, objectifs, tags, energie, gratitude, photo }
    setEntrees(sauvegarderEntreeJournal(nouvelleEntree))
    notifierSucces('Entrée du journal enregistrée 📝')
    setSauvegardeAnimee(true)
    setTimeout(() => setSauvegardeAnimee(false), 900)
  }

  const ajouterObjectif = () => {
    if (!nouvelObjectif.trim()) return
    setObjectifs([...objectifs, { texte: nouvelObjectif.trim(), fait: false }])
    setNouvelObjectif('')
  }
  const toggleObjectif = (index) => setObjectifs(objectifs.map((o, i) => i === index ? { ...o, fait: !o.fait } : o))
  const supprimerObjectif = (index) => setObjectifs(objectifs.filter((_, i) => i !== index))
  const progressionObjectifs = objectifs.length ? Math.round((objectifs.filter((o) => o.fait).length / objectifs.length) * 100) : 0

  // ===== TAGS DE L'ENTRÉE =====
  const ajouterTag = () => {
    const valeur = nouveauTag.trim().toLowerCase()
    if (!valeur || tags.includes(valeur)) return
    setTags([...tags, valeur])
    setNouveauTag('')
  }
  const supprimerTag = (tag) => setTags(tags.filter((t) => t !== tag))
  const toggleFiltreTag = (tag) => setTagsFiltre((actuels) => actuels.includes(tag) ? actuels.filter((t) => t !== tag) : [...actuels, tag])

  // ===== GRATITUDE =====
  const modifierGratitude = (index, valeur) => {
    const copie = [...gratitude]
    copie[index] = valeur
    setGratitude(copie)
  }

  // ===== PHOTO =====
  const gererUploadPhoto = async (e) => {
    const fichier = e.target.files[0]
    e.target.value = ''
    if (!fichier) return
    const base64 = await fichierVersBase64(fichier)
    setPhoto(base64)
  }

  // ===== EXPORT =====
  const telechargerFichier = (contenu, nomFichier, type) => {
    const blob = new Blob([contenu], { type })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = nomFichier
    lien.click()
    URL.revokeObjectURL(url)
  }

  const exporterJSON = () => {
    telechargerFichier(JSON.stringify(entrees, null, 2), `journal-${dateChoisie}.json`, 'application/json')
    notifierSucces('Export JSON téléchargé')
  }

  const exporterTXT = () => {
    const texte = [...entrees].sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
      const humeurInfo = HUMEURS.find((h) => h.id === e.humeur)
      const objectifsTxt = (e.objectifs || []).map((o) => `  ${o.fait ? '[x]' : '[ ]'} ${o.texte}`).join('\n')
      return `${formaterDateLongue(e.date)}\nHumeur : ${humeurInfo?.label || e.humeur || '—'}\n\n${e.pensees || '(aucune pensée notée)'}\n\nObjectifs :\n${objectifsTxt || '  (aucun)'}\n`
    }).join('\n' + '─'.repeat(40) + '\n\n')
    telechargerFichier(texte, `journal-complet.txt`, 'text/plain')
    notifierSucces('Export TXT téléchargé')
  }

  const exporterPDF = () => {
    // Le PDF n'est pas encore branché ici pour ne pas ajouter de
    // dépendance sans validation. Il suffit d'installer `jspdf`
    // (npm install jspdf) puis de générer le PDF à partir du même
    // texte que exporterTXT() ci-dessus.
    notifierErreur("L'export PDF arrive bientôt — utilise JSON ou TXT pour l'instant")
  }

  // ===== RÉSUMÉ IA =====
  const genererResume = async () => {
    setChargementResume(true)
    try {
      const entrees7DerniersJours = chargerEntreesJournal().slice(0, 7)
      const texte = await genererResumeJournal(entrees7DerniersJours)
      setResume(texte)
    } catch (erreur) {
      notifierErreur(erreur.message || 'Impossible de générer le résumé pour le moment')
    } finally {
      setChargementResume(false)
    }
  }

  // ===== MINI CALENDRIER DU MOIS EN COURS =====
  const anneeMois = dateChoisie.slice(0, 7)
  const [annee, mois] = anneeMois.split('-').map(Number)
  const nbJours = new Date(annee, mois, 0).getDate()
  const joursDuMois = Array.from({ length: nbJours }, (_, i) => {
    const jour = i + 1
    const dateStr = `${anneeMois}-${String(jour).padStart(2, '0')}`
    const entree = entrees.find((e) => e.date === dateStr)
    return { jour, dateStr, humeur: entree?.humeur, aUneEntree: !!entree }
  })

  // ===== MINI GRAPHIQUE (SPARKLINE SVG) DES 14 DERNIERS JOURS =====
  const ORDRE_HUMEURS = HUMEURS.map((h) => h.id)
  const sparklineDonnees = useMemo(() => {
    const jours = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = formaterDateISO(d)
      const entree = entrees.find((e) => e.date === dateStr)
      const indexHumeur = entree ? ORDRE_HUMEURS.indexOf(entree.humeur) : -1
      jours.push({ dateStr, valeur: indexHumeur === -1 ? null : indexHumeur })
    }
    return jours
  }, [entrees])

  const meteo = meteoSimuleeDuJour(dateChoisie)
  const citation = citationDuJour(dateChoisie)
  const compteurMots = pensees.trim() ? pensees.trim().split(/\s+/).length : 0

  // ============================================================
  // SKELETON — affiché brièvement au chargement initial
  // ============================================================
  if (chargement) {
    return (
      <div className="h-full min-h-0 w-full overflow-hidden bg-cream p-4 md:p-8">
        <style>{`@keyframes pulseSkeleton { 0%,100% { opacity: 0.5 } 50% { opacity: 0.9 } }`}</style>
        <div className="max-w-[1100px] mx-auto space-y-5">
          <div className="h-16 rounded-2xl bg-espresso/8" style={{ animation: 'pulseSkeleton 1.4s ease-in-out infinite' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-espresso/8" style={{ animation: `pulseSkeleton 1.4s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <style>{`
        @keyframes rippleAnim { to { transform: scale(1); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeCitation { from { opacity: 0; } to { opacity: 1; } }
        @keyframes flotter { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes checkPop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        .anim-entree { animation: fadeInUp 0.35s ease-out both; }
        .anim-citation { animation: fadeCitation 0.6s ease-out both; }
        .anim-flotter { animation: flotter 3.5s ease-in-out infinite; }
        .anim-check { animation: checkPop 0.4s ease-out both; }
      `}</style>

      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1200px] mx-auto">

        {/* ============================================================
            HEADER — date/heure dynamique + salutation + recherche
            ============================================================ */}
        <CarteVerre className="mb-5 anim-entree">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[10px] text-espresso/45 uppercase tracking-wide mb-1">
                {obtenirSalutation(maintenant.getHours())}
              </p>
              <h1 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px' }}>
                Mon Journal de Vie
              </h1>
              <p className="text-[11px] text-espresso/50 mt-1">{formaterDateLongue(formaterDateISO(maintenant))}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Horloge temps réel */}
              <div
                className="rounded-2xl px-4 py-2.5 text-center flex-shrink-0"
                style={{ background: 'var(--color-espresso)', color: 'var(--color-peony)', fontVariantNumeric: 'tabular-nums' }}
                aria-label="Heure actuelle"
              >
                <span className="text-[20px] font-semibold tracking-wide">
                  {maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative mt-4">
            <IconRecherche style={{ width: '14px', height: '14px' }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/35" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher dans tes pensées, objectifs ou tags..."
              aria-label="Rechercher dans le journal"
              className="w-full bg-white border border-espresso/10 rounded-full pl-9 pr-4 py-2.5 text-[12px] text-espresso placeholder:text-espresso/35 outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 transition-all duration-200"
            />
          </div>

          {tousLesTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tousLesTags.map((tag) => {
                const actif = tagsFiltre.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFiltreTag(tag)}
                    className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-espresso/30"
                    style={actif
                      ? { background: 'var(--color-espresso)', color: 'var(--color-peony)' }
                      : { background: '#F0EEEB', color: 'rgba(62,39,35,0.6)' }}
                  >
                    <IconTag style={{ width: '9px', height: '9px' }} />
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </CarteVerre>

        {/* ============================================================
            GRILLE PRINCIPALE — 1 col mobile / 2 col tablette / 3 col desktop
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* ===== CALENDRIER ===== */}
          <CarteVerre className="anim-entree md:col-span-2 xl:col-span-1">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">
              {new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {joursDuMois.map(({ jour, dateStr, humeur: humeurJour, aUneEntree }) => {
                const estChoisi = dateStr === dateChoisie
                const humeurInfo = HUMEURS.find((h) => h.id === humeurJour)
                return (
                  <button
                    key={jour}
                    onClick={() => setDateChoisie(dateStr)}
                    aria-label={`${jour} ${aUneEntree ? '(entrée écrite)' : ''}`}
                    aria-pressed={estChoisi}
                    className="relative flex flex-col items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-espresso/40"
                    style={{
                      width: '38px', height: '46px',
                      background: estChoisi ? 'var(--color-espresso)' : humeurJour ? 'var(--color-peony-light)' : '#F0EEEB',
                    }}
                  >
                    <span className={`text-[10px] font-medium ${estChoisi ? 'text-peony' : 'text-espresso/60'}`}>{jour}</span>
                    <span className="text-[11px]">{humeurInfo?.emoji || ''}</span>
                    {aUneEntree && !estChoisi && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--color-espresso)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </CarteVerre>

          {/* ===== STATISTIQUES ===== */}
          <CarteVerre className="anim-entree">
            <div className="flex items-center gap-2 mb-3">
              <IconGraphique style={{ width: '14px', height: '14px' }} className="text-espresso/50" />
              <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Statistiques</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[20px] font-semibold text-espresso">{stats.joursEcrits}</p>
                <p className="text-[9.5px] text-espresso/45">Jours écrits</p>
              </div>
              <div>
                <p className="text-[20px] font-semibold text-espresso flex items-center gap-1">
                  {stats.streakActuel}
                  {stats.streakActuel > 0 && <IconFeu style={{ width: '13px', height: '13px' }} className="text-espresso/50" />}
                </p>
                <p className="text-[9.5px] text-espresso/45">Série actuelle</p>
              </div>
              <div>
                <p className="text-[20px] font-semibold text-espresso">{stats.streakMax}</p>
                <p className="text-[9.5px] text-espresso/45">Meilleure série</p>
              </div>
              <div>
                <p className="text-[20px] font-semibold text-espresso">{stats.pourcentageObjectifs}%</p>
                <p className="text-[9.5px] text-espresso/45">Objectifs atteints</p>
              </div>
            </div>
            {humeurDominante && (
              <div className="mt-3 pt-3 border-t border-espresso/8 flex items-center gap-2">
                <span className="text-[16px]">{humeurDominante.emoji}</span>
                <span className="text-[10.5px] text-espresso/55">Humeur dominante : {humeurDominante.label}</span>
              </div>
            )}

            {/* Sparkline des 14 derniers jours */}
            <div className="mt-4">
              <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1.5">14 derniers jours</p>
              <svg viewBox="0 0 140 30" className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  points={sparklineDonnees.map((j, i) => `${i * 10},${j.valeur === null ? 30 : 28 - (j.valeur / Math.max(1, ORDRE_HUMEURS.length - 1)) * 26}`).join(' ')}
                  fill="none" stroke="var(--color-espresso)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
                />
                {sparklineDonnees.map((j, i) => j.valeur !== null && (
                  <circle key={i} cx={i * 10} cy={28 - (j.valeur / Math.max(1, ORDRE_HUMEURS.length - 1)) * 26} r="1.8" fill="var(--color-espresso)" />
                ))}
              </svg>
            </div>
          </CarteVerre>

          {/* ===== CITATION DU JOUR ===== */}
          <CarteVerre className="anim-entree flex flex-col justify-center" key={citation}>
            <IconEtoiles style={{ width: '16px', height: '16px' }} className="text-espresso/40 mb-2 anim-flotter" />
            <p className="anim-citation text-[12.5px] text-espresso/70 italic leading-relaxed">« {citation} »</p>
          </CarteVerre>

          {/* ===== MÉTÉO SIMULÉE ===== */}
          <CarteVerre className="anim-entree">
            {/* Pour brancher une vraie API météo : remplace
                meteoSimuleeDuJour(dateChoisie) par un fetch vers, par
                exemple, OpenWeatherMap avec ta clé API, et mappe la
                réponse sur { icone, label, temperature }. */}
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Météo du jour</p>
            <div className="flex items-center gap-4">
              <span className="text-[36px] anim-flotter">{meteo.icone}</span>
              <div>
                <p className="text-[22px] font-semibold text-espresso">{meteo.temperature}°C</p>
                <p className="text-[10.5px] text-espresso/50">{meteo.label}</p>
              </div>
            </div>
          </CarteVerre>

          {/* ===== HUMEUR + PENSÉES ===== */}
          <CarteVerre className="anim-entree md:col-span-2">
            <input
              type="date"
              value={dateChoisie}
              onChange={(e) => setDateChoisie(e.target.value)}
              max={formaterDateISO(new Date())}
              aria-label="Choisir une date"
              className="text-[12px] text-espresso bg-[#F0EEEB] rounded-xl px-3 py-2 outline-none border border-espresso/15 mb-4 focus-visible:ring-2 focus-visible:ring-espresso/30"
            />

            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Comment tu te sens</p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {HUMEURS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHumeur(h.id)}
                  aria-pressed={humeur === h.id}
                  aria-label={h.label}
                  className="flex-1 min-w-[60px] flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-espresso/30"
                  style={{ background: humeur === h.id ? 'var(--color-espresso)' : '#F0EEEB' }}
                >
                  <span className="text-[18px]">{h.emoji}</span>
                  <span className={`text-[8px] ${humeur === h.id ? 'text-peony' : 'text-espresso/50'}`}>{h.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Tes pensées</label>
              <span className="text-[9px] text-espresso/35">{compteurMots} mot{compteurMots > 1 ? 's' : ''}</span>
            </div>
            <textarea
              value={pensees}
              onChange={(e) => setPensees(e.target.value)}
              placeholder="Écris ce que tu as sur le cœur aujourd'hui..."
              rows={5}
              aria-label="Tes pensées du jour"
              className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[12.5px] text-espresso outline-none border border-espresso/15 focus-visible:ring-2 focus-visible:ring-espresso/30 resize-y mb-4 leading-relaxed"
            />

            {/* Tags de l'entrée */}
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex gap-2 mb-2">
              <input
                value={nouveauTag}
                onChange={(e) => setNouveauTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterTag())}
                placeholder="Ex : travail, famille, gratitude..."
                aria-label="Ajouter un tag"
                className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus-visible:ring-2 focus-visible:ring-espresso/30"
              />
              <BoutonRipple onClick={ajouterTag} aria-label="Ajouter le tag" className="w-9 h-9 rounded-full bg-espresso flex items-center justify-center flex-shrink-0">
                <IconPlus style={{ width: '13px', height: '13px' }} className="text-peony" />
              </BoutonRipple>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${'#3E2723'}12`, color: '#3E2723' }}>
                    #{tag}
                    <button onClick={() => supprimerTag(tag)} aria-label={`Retirer le tag ${tag}`} className="hover:opacity-60">
                      <IconCroix style={{ width: '8px', height: '8px' }} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <BoutonRipple
              onClick={sauvegarder}
              className="w-full rounded-xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-espresso/40 flex items-center justify-center gap-2"
            >
              {sauvegardeAnimee ? (
                <span className="anim-check flex items-center gap-2"><IconCheck style={{ width: '14px', height: '14px' }} /> Enregistré</span>
              ) : 'Enregistrer cette entrée'}
            </BoutonRipple>
          </CarteVerre>

          {/* ===== OBJECTIFS ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Objectifs du jour</p>

            <div className="flex gap-2 mb-3">
              <input
                value={nouvelObjectif}
                onChange={(e) => setNouvelObjectif(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ajouterObjectif()}
                placeholder="Ajouter un objectif..."
                aria-label="Ajouter un objectif"
                className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus-visible:ring-2 focus-visible:ring-espresso/30"
              />
              <BoutonRipple onClick={ajouterObjectif} aria-label="Ajouter l'objectif" className="w-9 h-9 rounded-full bg-espresso flex items-center justify-center flex-shrink-0">
                <IconPlus style={{ width: '14px', height: '14px' }} className="text-peony" />
              </BoutonRipple>
            </div>

            {objectifs.length > 0 && (
              <div className="h-1.5 rounded-full bg-[#F0EEEB] mb-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressionObjectifs}%`, background: 'var(--color-espresso)' }} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {objectifs.length === 0 && <p className="text-[10.5px] text-espresso/35 italic">Aucun objectif pour aujourd'hui</p>}
              {objectifs.map((obj, index) => (
                <div key={index} className="flex items-center gap-2 bg-[#F0EEEB] rounded-xl px-3 py-2">
                  <button
                    onClick={() => toggleObjectif(index)}
                    aria-label={obj.fait ? 'Marquer comme non fait' : 'Marquer comme fait'}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-espresso/30"
                    style={{ background: obj.fait ? 'var(--color-espresso)' : 'white', border: '1.5px solid rgba(62,39,35,0.2)' }}
                  >
                    {obj.fait && <IconCheck style={{ width: '10px', height: '10px' }} className="text-peony" />}
                  </button>
                  <span className={`flex-1 text-[11.5px] transition-all duration-200 ${obj.fait ? 'text-espresso/35 line-through' : 'text-espresso'}`}>{obj.texte}</span>
                  <button onClick={() => supprimerObjectif(index)} aria-label="Supprimer l'objectif" className="text-espresso/30 hover:text-red-400 text-[14px] flex-shrink-0">×</button>
                </div>
              ))}
            </div>
          </CarteVerre>

          {/* ===== ÉNERGIE ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Niveau d'énergie</p>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[18px]">🔋</span>
              <span className="text-[18px] font-semibold text-espresso">{energie}%</span>
            </div>
            <input
              type="range"
              min="0" max="100" value={energie}
              onChange={(e) => setEnergie(Number(e.target.value))}
              aria-label="Niveau d'énergie"
              className="w-full accent-espresso cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-espresso/35 mt-1">
              <span>Épuisée</span>
              <span>En pleine forme</span>
            </div>
          </CarteVerre>

          {/* ===== GRATITUDE ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Gratitude du jour — 3 choses positives</p>
            <div className="flex flex-col gap-2">
              {gratitude.map((valeur, i) => (
                <input
                  key={i}
                  value={valeur}
                  onChange={(e) => modifierGratitude(i, e.target.value)}
                  placeholder={`${i + 1}. Quelque chose qui t'a fait du bien...`}
                  aria-label={`Gratitude ${i + 1}`}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[11.5px] text-espresso outline-none border border-espresso/15 focus-visible:ring-2 focus-visible:ring-espresso/30"
                />
              ))}
            </div>
          </CarteVerre>

          {/* ===== PHOTO DU JOUR ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Photo du jour</p>
            <input ref={inputPhotoRef} type="file" accept="image/*" onChange={gererUploadPhoto} className="hidden" />
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Photo du journal" className="w-full h-32 object-cover rounded-xl" />
                <button
                  onClick={() => setPhoto(null)}
                  aria-label="Retirer la photo"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-espresso/80 text-peony flex items-center justify-center"
                >
                  <IconCroix style={{ width: '11px', height: '11px' }} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputPhotoRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-espresso/15 flex flex-col items-center justify-center gap-1.5 text-espresso/40 hover:border-espresso/30 hover:text-espresso/60 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-espresso/30"
              >
                <IconCamera style={{ width: '20px', height: '20px' }} />
                <span className="text-[10.5px]">Ajouter une photo</span>
              </button>
            )}
          </CarteVerre>

          {/* ===== LECTEUR MUSICAL ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Musique relaxante</p>
            <div className="flex items-center gap-3">
              <BoutonRipple
                onClick={() => setLectureEnCours((l) => !l)}
                aria-label={lectureEnCours ? 'Mettre en pause' : 'Lire'}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-peony focus-visible:ring-2 focus-visible:ring-espresso/40"
                style={{ background: 'var(--color-espresso)' }}
              >
                {lectureEnCours ? <IconPause style={{ width: '15px', height: '15px' }} /> : <IconPlay style={{ width: '15px', height: '15px', marginLeft: '2px' }} />}
              </BoutonRipple>
              <div className="flex-1">
                <p className="text-[11px] text-espresso/70 mb-1.5">{lectureEnCours ? 'Ambiance douce — en cours' : 'Ambiance douce'}</p>
                <div className="h-1.5 rounded-full bg-[#F0EEEB] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progressionLecture}%`, background: 'var(--color-espresso)', transition: lectureEnCours ? 'none' : 'width 0.3s' }} />
                </div>
              </div>
            </div>
            <p className="text-[8.5px] text-espresso/30 mt-2">Branche ton propre fichier audio dans /public pour une vraie lecture.</p>
          </CarteVerre>

          {/* ===== ACTIVITÉ RÉCENTE ===== */}
          <CarteVerre className="anim-entree md:col-span-2 xl:col-span-1">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">
              Activité récente {(recherche || tagsFiltre.length > 0) && `(${entreesFiltrees.length} résultat${entreesFiltrees.length > 1 ? 's' : ''})`}
            </p>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scroll-suave">
              {activiteRecente.length === 0 && <p className="text-[10.5px] text-espresso/35 italic">Aucune entrée à afficher</p>}
              {activiteRecente.map((e) => {
                const humeurInfo = HUMEURS.find((h) => h.id === e.humeur)
                return (
                  <button
                    key={e.date}
                    onClick={() => setDateChoisie(e.date)}
                    className="flex items-center gap-2.5 text-left rounded-xl px-3 py-2 hover:bg-[#F0EEEB] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-espresso/30"
                  >
                    <span className="text-[16px] flex-shrink-0">{humeurInfo?.emoji || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] font-medium text-espresso truncate">{formaterDateLongue(e.date)}</p>
                      <p className="text-[9.5px] text-espresso/45 truncate">{e.pensees || 'Pas de pensée notée'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </CarteVerre>

          {/* ===== EXPORT ===== */}
          <CarteVerre className="anim-entree">
            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Exporter mon journal</p>
            <div className="flex flex-col gap-2">
              <BoutonRipple onClick={exporterJSON} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold text-espresso bg-[#F0EEEB] hover:bg-espresso/10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-espresso/30">
                <IconTelechargement style={{ width: '13px', height: '13px' }} /> Export JSON
              </BoutonRipple>
              <BoutonRipple onClick={exporterTXT} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold text-espresso bg-[#F0EEEB] hover:bg-espresso/10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-espresso/30">
                <IconTelechargement style={{ width: '13px', height: '13px' }} /> Export TXT
              </BoutonRipple>
              <BoutonRipple onClick={exporterPDF} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold text-espresso/50 bg-[#F0EEEB]/50 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-espresso/30">
                <IconTelechargement style={{ width: '13px', height: '13px' }} /> Export PDF (bientôt)
              </BoutonRipple>
            </div>
          </CarteVerre>

          {/* ===== RÉSUMÉ IA ===== */}
          <CarteVerre className="anim-entree md:col-span-2 xl:col-span-1" style={{ background: 'var(--color-espresso)', border: 'none' }}>
            <div className="flex items-center gap-2 mb-3">
              <IconEtoiles style={{ width: '15px', height: '15px' }} className="text-peony/60" />
              <p className="text-[9px] text-peony/60 uppercase tracking-wide">Résumé de ta semaine par Yuna</p>
            </div>
            {resume ? (
              <p className="text-[12px] text-peony leading-relaxed italic">{resume}</p>
            ) : (
              <p className="text-[11px] text-peony/50 italic mb-3">Génère un résumé bienveillant de tes 7 dernières entrées</p>
            )}
            <BoutonRipple
              onClick={genererResume}
              disabled={chargementResume}
              className="mt-3 text-[10.5px] font-semibold text-espresso bg-peony rounded-full px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-peony/50"
            >
              {chargementResume ? 'Génération...' : (resume ? 'Régénérer' : 'Générer le résumé')}
            </BoutonRipple>
          </CarteVerre>

        </div>
      </div>
    </div>
  )
}

export default JournalScreen