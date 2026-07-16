import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Check, Sparkles, Search, Download, Camera, Flame, X,
  Clock, ImagePlus, Heart, TrendingUp, Feather, ChevronLeft,
  ChevronRight, Wand2, NotebookPen, Star,
} from 'lucide-react'
import { chargerEntreesJournal, sauvegarderEntreesJournal } from '../services/journal'
import { genererResumeJournal } from '../services/gemini'
import { notifierErreur } from '../services/notifications'

const C = {
  cream: '#FAF6F0', sable: '#F1E9DE', sableBorder: 'rgba(62,39,35,0.10)',
  espresso: '#3E2723', encreDoux: 'rgba(62,39,35,0.52)', encreFaible: 'rgba(62,39,35,0.35)',
  peony: '#F6D8DE', peonyDeep: '#C98A93', sauge: '#7C8F6E',
}

const HUMEURS = [
  { id: 'radieuse', emoji: '✨', label: 'Radieuse' },
  { id: 'bien', emoji: '🙂', label: 'Bien' },
  { id: 'sereine', emoji: '😌', label: 'Sereine' },
  { id: 'fatiguee', emoji: '😴', label: 'Fatiguée' },
  { id: 'stressee', emoji: '😰', label: 'Stressée' },
  { id: 'triste', emoji: '😔', label: 'Triste' },
]

const PROMPTS = [
  "Si aujourd'hui avait une couleur, laquelle serait-elle ?",
  "Qu'est-ce qui ferait de cette semaine une réussite pour toi ?",
  'Pour qui ressens-tu de la gratitude aujourd’hui ?',
  "Quel petit moment t'a fait sourire récemment ?",
  'De quoi as-tu besoin pour te sentir plus légère demain ?',
  'Qu’as-tu appris sur toi cette semaine ?',
]

const CITATIONS = [
  'Chaque jour est une page blanche ; écris-la avec douceur envers toi-même.',
  'Tu n’as pas besoin d’être parfaite pour avoir de la valeur.',
  'Les petits pas comptent autant que les grands bonds.',
  'Prendre soin de soi n’est jamais un luxe, c’est une nécessité.',
  'Il est normal de ne pas être normale.',
  'Le repos fait partie du chemin, pas une pause dans le chemin.',
  'Ce que tu construis en silence finit toujours par se voir.',
]

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function iso(d) { return d.toISOString().slice(0, 10) }
function dateLongue(str) {
  const d = new Date(str + 'T00:00:00')
  const t = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function salutation(h) {
  if (h < 5) return 'Encore réveillée à cette heure'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  if (h < 22) return 'Bonsoir'
  return 'Bonne nuit'
}
function citationDuJour(dateStr) {
  const j = Math.floor(new Date(dateStr + 'T00:00:00') / 86400000)
  return CITATIONS[((j % CITATIONS.length) + CITATIONS.length) % CITATIONS.length]
}

function Carte({ children, className = '', style, delay = 0 }) {
  return (
    <div
      className={`anim-in hover-lift rounded-3xl border p-5 md:p-6 ${className}`}
      style={{ background: 'rgba(255,255,255,0.72)', borderColor: C.sableBorder, boxShadow: '0 10px 28px rgba(62,39,35,0.06)', animationDelay: `${delay}s`, ...style }}
    >
      {children}
    </div>
  )
}

function Eyebrow({ children, icon: Icon }) {
  return (
    <p className="flex items-center gap-1.5 mb-3 uppercase" style={{ fontSize: '10px', letterSpacing: '0.09em', color: C.encreFaible, fontWeight: 700 }}>
      {Icon && <Icon size={12} strokeWidth={2.3} />}
      {children}
    </p>
  )
}

export default function JournalScreen() {
  // ⬅️ CONNECTÉ : charge les vraies entrées sauvegardées au démarrage
  // au lieu de partir d'un tableau vide à chaque rechargement
  const [entrees, setEntrees] = useState(() => chargerEntreesJournal())
  const [dateChoisie, setDateChoisie] = useState(() => iso(new Date()))
  const [horloge, setHorloge] = useState(new Date())
  const [mois, setMois] = useState(() => new Date())

  const [humeur, setHumeur] = useState('bien')
  const [pensees, setPensees] = useState('')
  const [tags, setTags] = useState([])
  const [nouveauTag, setNouveauTag] = useState('')
  const [objectifs, setObjectifs] = useState([])
  const [nouvelObjectif, setNouvelObjectif] = useState('')
  const [energie, setEnergie] = useState(70)
  const [gratitude, setGratitude] = useState(['', '', ''])
  const [recherche, setRecherche] = useState('')
  const [enregistre, setEnregistre] = useState(false)
  const inputPhotoRef = useRef(null)

  // ⬅️ NOUVEAU : résumé généré par la vraie IA (Yuna), en plus du
  // résumé "local" instantané déjà présent dans ton design
  const [resumeIA, setResumeIA] = useState('')
  const [chargementResumeIA, setChargementResumeIA] = useState(false)

  const promptDuJour = PROMPTS[new Date(dateChoisie + 'T00:00:00').getDate() % PROMPTS.length]
  const citation = citationDuJour(dateChoisie)

  useEffect(() => {
    const t = setInterval(() => setHorloge(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ⬅️ NOUVEAU : sauvegarde automatiquement à CHAQUE changement du
  // tableau d'entrées — plus besoin d'action manuelle, rien ne se
  // perd même si l'utilisateur ferme l'onglet sans cliquer "Enregistrer"
  useEffect(() => {
    sauvegarderEntreesJournal(entrees)
  }, [entrees])

  useEffect(() => {
    const e = entrees.find((x) => x.date === dateChoisie)
    setHumeur(e?.humeur || 'bien')
    setPensees(e?.pensees || '')
    setTags(e?.tags || [])
    setObjectifs(e?.objectifs || [])
    setEnergie(e?.energie ?? 70)
    setGratitude(e?.gratitude?.length === 3 ? e.gratitude : ['', '', ''])
    setResumeIA('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateChoisie])

  const stats = useMemo(() => {
    const dates = new Set(entrees.map((e) => e.date))
    let streak = 0
    const cur = new Date()
    while (dates.has(iso(cur))) { streak++; cur.setDate(cur.getDate() - 1) }
    const compte = {}
    entrees.forEach((e) => { if (e.humeur) compte[e.humeur] = (compte[e.humeur] || 0) + 1 })
    const dominanteId = Object.entries(compte).sort((a, b) => b[1] - a[1])[0]?.[0]
    let total = 0, faits = 0
    entrees.forEach((e) => (e.objectifs || []).forEach((o) => { total++; if (o.fait) faits++ }))
    return {
      joursEcrits: entrees.length,
      streak,
      dominante: HUMEURS.find((h) => h.id === dominanteId),
      pctObjectifs: total ? Math.round((faits / total) * 100) : 0,
    }
  }, [entrees])

  const semaine = useMemo(() => {
    const lundi = new Date()
    lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7))
    const dates = new Set(entrees.map((e) => e.date))
    return JOURS_SEMAINE.map((label, i) => {
      const d = new Date(lundi); d.setDate(d.getDate() + i)
      return { label, actif: dates.has(iso(d)), estAujourdhui: iso(d) === iso(new Date()) }
    })
  }, [entrees])

  const joursDuMois = useMemo(() => {
    const y = mois.getFullYear(), m = mois.getMonth()
    const nb = new Date(y, m + 1, 0).getDate()
    const premierJour = (new Date(y, m, 1).getDay() + 6) % 7
    const jours = Array.from({ length: nb }, (_, i) => {
      const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      const e = entrees.find((x) => x.date === dStr)
      return { jour: i + 1, date: dStr, humeur: e?.humeur, aEntree: !!e }
    })
    return { vides: premierJour, jours }
  }, [mois, entrees])

  const toutesPhotos = useMemo(() =>
    [...entrees].sort((a, b) => b.date.localeCompare(a.date)).flatMap((e) => (e.photos || []).map((src) => ({ src, date: e.date }))),
  [entrees])

  const entreesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return [...entrees]
      .filter((e) => !q || (e.pensees || '').toLowerCase().includes(q) || (e.tags || []).some((t) => t.includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
  }, [entrees, recherche])

  const motYuna = useMemo(() => {
    const dernieres = [...entrees].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    if (dernieres.length === 0) {
      return { resume: 'Écris ta première entrée pour que je puisse commencer à t’accompagner ici.', humeur: '—', progres: 'Ton parcours commence aujourd’hui, une première page à la fois.', encouragement: 'Chaque petite étape construit une grande évolution.' }
    }
    return {
      resume: resumeIA || (dernieres.length >= 3
        ? 'Cette semaine, tu as pris le temps d’écrire régulièrement, continue à noter ce qui compte pour toi.'
        : 'Tu viens de commencer à écrire ici — reviens quand tu en ressens le besoin.'),
      humeur: stats.dominante?.label || '—',
      progres: stats.streak > 1 ? `Tu tiens une série de ${stats.streak} jours d’affilée, continue ainsi.` : 'Tu poses les bases d’une belle habitude d’écriture.',
      encouragement: 'Chaque petite étape construit une grande évolution.',
    }
  }, [entrees, stats, resumeIA])

  // ⬅️ NOUVEAU : demande un VRAI résumé généré par Yuna (via Gemini,
  // avec la chaîne de secours Groq/OpenRouter/Cerebras en cas d'échec)
  const demanderResumeYuna = async () => {
    const dernieres = [...entrees].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    if (dernieres.length === 0) return
    setChargementResumeIA(true)
    try {
      const texte = await genererResumeJournal(dernieres)
      setResumeIA(texte)
    } catch (erreur) {
      notifierErreur(erreur.message || "Impossible de générer le résumé pour le moment")
    } finally {
      setChargementResumeIA(false)
    }
  }

  const sparkline = useMemo(() => {
    const ordre = HUMEURS.map((h) => h.id)
    const jours = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const e = entrees.find((x) => x.date === iso(d))
      const idx = e ? ordre.indexOf(e.humeur) : -1
      jours.push(idx === -1 ? null : idx)
    }
    return jours
  }, [entrees])

  const sauvegarder = () => {
    setEntrees((prev) => {
      const reste = prev.filter((e) => e.date !== dateChoisie)
      const existante = prev.find((e) => e.date === dateChoisie)
      return [...reste, { ...(existante || { photos: [] }), date: dateChoisie, humeur, pensees, tags, objectifs, energie, gratitude }]
    })
    setEnregistre(true)
    setTimeout(() => setEnregistre(false), 1400)
  }
  const ajouterTag = () => {
    const v = nouveauTag.trim().toLowerCase()
    if (!v || tags.includes(v)) return
    setTags([...tags, v]); setNouveauTag('')
  }
  const ajouterObjectif = () => {
    if (!nouvelObjectif.trim()) return
    setObjectifs([...objectifs, { texte: nouvelObjectif.trim(), fait: false }])
    setNouvelObjectif('')
  }
  const toggleObjectif = (i) => setObjectifs(objectifs.map((o, idx) => idx === i ? { ...o, fait: !o.fait } : o))
  const supprimerObjectif = (i) => setObjectifs(objectifs.filter((_, idx) => idx !== i))
  const progressionObjectifs = objectifs.length ? Math.round((objectifs.filter((o) => o.fait).length / objectifs.length) * 100) : 0

  const ajouterPhoto = (e) => {
    const fichier = e.target.files[0]
    e.target.value = ''
    if (!fichier) return
    const reader = new FileReader()
    reader.onload = () => {
      setEntrees((prev) => {
        const existante = prev.find((x) => x.date === dateChoisie)
        const reste = prev.filter((x) => x.date !== dateChoisie)
        const base = existante || { date: dateChoisie, humeur, pensees, tags, objectifs, energie, gratitude, photos: [] }
        return [...reste, { ...base, photos: [...(base.photos || []), reader.result] }]
      })
    }
    reader.readAsDataURL(fichier)
  }

  const telecharger = (contenu, nom, type) => {
    const blob = new Blob([contenu], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = nom; a.click()
    URL.revokeObjectURL(url)
  }
  const exporterJSON = () => telecharger(JSON.stringify(entrees, null, 2), 'journal.json', 'application/json')
  const exporterTXT = () => telecharger(
    [...entrees].sort((a, b) => a.date.localeCompare(b.date)).map((e) => `${dateLongue(e.date)}\n${e.pensees || ''}`).join('\n\n'),
    'journal.txt', 'text/plain'
  )

  const compteurMots = pensees.trim() ? pensees.trim().split(/\s+/).length : 0

  return (
    // ⬅️ CHANGÉ : "min-h-full" → "h-full min-h-0 overflow-y-auto
    // scroll-suave" pour s'intégrer correctement au système de scroll
    // fluide déjà en place sur tous les autres écrans de l'app
    <div className="h-full min-h-0 overflow-y-auto scroll-suave w-full" style={{ background: C.cream, fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes entree { from { opacity:0; transform:translateY(10px);} to {opacity:1; transform:translateY(0);} }
        @keyframes halo { 0%,100% { transform: translate(0,0) scale(1); opacity:.5; } 50% { transform: translate(10px,-14px) scale(1.08); opacity:.78; } }
        @keyframes scintille { 0%,100% { opacity:.2; transform: scale(.8);} 50% { opacity:1; transform: scale(1.15);} }
        @keyframes pop { 0% { transform: scale(.7); opacity:0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity:1; } }
        .anim-in { animation: entree .5s cubic-bezier(.2,.7,.3,1) both; }
        .halo { animation: halo 7s ease-in-out infinite; }
        .etoile { animation: scintille 2.4s ease-in-out infinite; }
        .pop-in { animation: pop .35s ease-out both; }
        .hover-lift { transition: transform .25s ease, box-shadow .25s ease; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(62,39,35,0.09); }
        @media (prefers-reduced-motion: reduce) { .anim-in, .halo, .etoile, .pop-in { animation: none !important; } }
      `}</style>

      <div className="border-b sticky top-0 z-20 backdrop-blur-md" style={{ borderColor: C.sableBorder, background: 'rgba(250,246,240,0.86)' }}>
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-4 md:px-8 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.espresso }}>
              <Feather size={15} color={C.peony} />
            </div>
            <span style={{ color: C.espresso, fontFamily: "'Cormorant Garamond', serif", fontSize: '19px', fontWeight: 600 }}>Mon Journal de Vie</span>
          </div>
          <div className="hidden sm:flex rounded-2xl px-4 py-2 items-center gap-2" style={{ background: C.espresso, color: C.peony, fontVariantNumeric: 'tabular-nums' }}>
            <Clock size={13} />
            <span className="text-sm font-semibold tracking-wide">
              {horloge.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 md:py-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 anim-in">
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', color: C.espresso, fontWeight: 600 }}>{salutation(horloge.getHours())}.</h1>
            <p className="text-sm mt-1" style={{ color: C.encreDoux }}>{dateLongue(iso(horloge))} · comment te sens-tu aujourd'hui ?</p>
          </div>
          <p className="text-[12.5px] italic max-w-sm" style={{ color: C.encreDoux }}>« {citation} »</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

          <div className="flex flex-col gap-5 min-w-0">

            <Carte delay={0.02}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: C.sable }}>
                    {HUMEURS.find((h) => h.id === humeur)?.emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: C.encreFaible, fontWeight: 700, letterSpacing: '.06em' }}>NIVEAU D'ÉNERGIE</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: C.espresso, fontWeight: 600 }}>{energie}%</p>
                  </div>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-xs" style={{ color: C.encreDoux }}>
                    {energie > 70 ? "Tu débordes d'énergie, profites-en." : energie > 40 ? "Un rythme stable aujourd'hui." : 'Sois douce avec toi, ralentis un peu.'}
                  </p>
                  <input type="range" min="0" max="100" value={energie} onChange={(e) => setEnergie(Number(e.target.value))} className="w-full mt-2 cursor-pointer" style={{ accentColor: C.espresso }} />
                </div>
              </div>
            </Carte>

            <Carte delay={0.05}>
              <Eyebrow icon={Wand2}>Inspiration du jour</Eyebrow>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {PROMPTS.slice(0, 3).map((p) => (
                  <button key={p} onClick={() => setPensees((v) => (v ? v : p + '\n'))}
                    className="text-left rounded-2xl p-3.5 text-xs leading-relaxed transition-opacity hover:opacity-75"
                    style={{ background: C.sable, color: C.encreDoux }}>
                    {p}
                  </button>
                ))}
              </div>
            </Carte>

            <Carte delay={0.08}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <Eyebrow icon={NotebookPen}>Tes pensées</Eyebrow>
                <input type="date" value={dateChoisie} max={iso(new Date())} onChange={(e) => setDateChoisie(e.target.value)}
                  className="text-xs rounded-xl px-3 py-1.5 outline-none border" style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {HUMEURS.map((h) => (
                  <button key={h.id} onClick={() => setHumeur(h.id)}
                    className="flex-1 min-w-[64px] flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all hover:-translate-y-0.5"
                    style={{ background: humeur === h.id ? C.espresso : C.sable }}>
                    <span className="text-lg">{h.emoji}</span>
                    <span className="text-[10px] font-semibold" style={{ color: humeur === h.id ? C.peony : C.encreDoux }}>{h.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase" style={{ color: C.encreFaible, letterSpacing: '.06em' }}>Écris librement</span>
                <span className="text-[10px]" style={{ color: C.encreFaible }}>{compteurMots} mot{compteurMots > 1 ? 's' : ''}</span>
              </div>
              <textarea value={pensees} onChange={(e) => setPensees(e.target.value)} rows={5} placeholder={promptDuJour}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none border resize-y leading-relaxed mb-4"
                style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />

              <div className="flex gap-2 mb-2">
                <input value={nouveauTag} onChange={(e) => setNouveauTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ajouterTag()}
                  placeholder="Ajouter un tag…" className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border" style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />
                <button onClick={ajouterTag} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.espresso }}>
                  <Plus size={14} color={C.peony} />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: C.peony, color: C.peonyDeep }}>
                      #{t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}

              <button onClick={sauvegarder} className="w-full rounded-2xl py-3 text-xs font-bold transition-transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: C.espresso, color: C.peony }}>
                {enregistre ? <span className="pop-in flex items-center gap-2"><Check size={14} /> Enregistré</span> : 'Enregistrer cette entrée'}
              </button>
            </Carte>

            <div className="grid sm:grid-cols-2 gap-5">
              <Carte delay={0.1}>
                <Eyebrow icon={Check}>Objectifs du jour</Eyebrow>
                <div className="flex gap-2 mb-3">
                  <input value={nouvelObjectif} onChange={(e) => setNouvelObjectif(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ajouterObjectif()}
                    placeholder="Ajouter un objectif…" className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border" style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />
                  <button onClick={ajouterObjectif} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.espresso }}>
                    <Plus size={14} color={C.peony} />
                  </button>
                </div>
                {objectifs.length > 0 && (
                  <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: C.sable }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressionObjectifs}%`, background: C.sauge }} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {objectifs.length === 0 && <p className="text-xs italic" style={{ color: C.encreFaible }}>Aucun objectif pour l'instant</p>}
                  {objectifs.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.sable }}>
                      <button onClick={() => toggleObjectif(i)} className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ background: o.fait ? C.sauge : 'white', borderColor: 'rgba(62,39,35,0.15)' }}>
                        {o.fait && <Check size={10} color="white" />}
                      </button>
                      <span className="flex-1 text-xs" style={{ color: o.fait ? C.encreFaible : C.espresso, textDecoration: o.fait ? 'line-through' : 'none' }}>{o.texte}</span>
                      <button onClick={() => supprimerObjectif(i)} style={{ color: 'rgba(62,39,35,0.3)' }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </Carte>

              <Carte delay={0.12}>
                <Eyebrow icon={Heart}>Gratitude — 3 belles choses</Eyebrow>
                <div className="flex flex-col gap-2">
                  {gratitude.map((v, i) => (
                    <input key={i} value={v} onChange={(e) => setGratitude(gratitude.map((g, idx) => idx === i ? e.target.value : g))}
                      placeholder={`${i + 1}. Quelque chose qui t'a fait du bien…`}
                      className="rounded-xl px-3 py-2 text-xs outline-none border" style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />
                  ))}
                </div>
              </Carte>
            </div>

            <Carte delay={0.14}>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow>Calendrier des humeurs</Eyebrow>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.espresso }}>
                  <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))}><ChevronLeft size={15} /></button>
                  {mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))}><ChevronRight size={15} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {JOURS_SEMAINE.map((j) => <p key={j} className="text-center text-[9px] font-bold" style={{ color: C.encreFaible }}>{j}</p>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: joursDuMois.vides }).map((_, i) => <div key={'v' + i} />)}
                {joursDuMois.jours.map(({ jour, date, humeur: hj, aEntree }) => {
                  const choisi = date === dateChoisie
                  const hInfo = HUMEURS.find((h) => h.id === hj)
                  return (
                    <button key={jour} onClick={() => setDateChoisie(date)}
                      className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:-translate-y-0.5"
                      style={{ background: choisi ? C.espresso : hj ? C.peony : C.sable }}>
                      <span className="text-[10px] font-semibold" style={{ color: choisi ? C.peony : C.encreDoux }}>{jour}</span>
                      <span className="text-[11px] leading-none">{hInfo?.emoji || ''}</span>
                      {aEntree && !choisi && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: C.espresso }} />}
                    </button>
                  )
                })}
              </div>
              {stats.joursEcrits === 0 && (
                <p className="text-[11px] italic mt-3" style={{ color: C.encreFaible }}>Aucune entrée pour l'instant — chaque jour rempli ajoutera sa couleur ici.</p>
              )}
            </Carte>

            <Carte delay={0.16}>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow icon={ImagePlus}>Galerie photo</Eyebrow>
                <button onClick={() => inputPhotoRef.current?.click()} className="flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1.5" style={{ background: C.sable, color: C.espresso }}>
                  <Camera size={12} /> Ajouter
                </button>
                <input ref={inputPhotoRef} type="file" accept="image/*" onChange={ajouterPhoto} className="hidden" />
              </div>
              {toutesPhotos.length === 0 ? (
                <button onClick={() => inputPhotoRef.current?.click()} className="w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5" style={{ borderColor: 'rgba(62,39,35,0.15)', color: C.encreFaible }}>
                  <Camera size={20} />
                  <span className="text-xs">Ajoute ta première photo</span>
                </button>
              ) : (
                <div style={{ columnCount: toutesPhotos.length === 1 ? 1 : 3, columnGap: '10px' }} className="sm:[column-count:3]">
                  {toutesPhotos.map((p, i) => (
                    <div key={i} className="mb-2.5 rounded-2xl overflow-hidden hover-lift" style={{ breakInside: 'avoid' }}>
                      <img src={p.src} alt="" className="w-full h-auto block" />
                    </div>
                  ))}
                </div>
              )}
            </Carte>

            <Carte delay={0.18}>
              <Eyebrow icon={Download}>Exporter mon journal</Eyebrow>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={exporterJSON} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.sable, color: C.espresso }}>
                  <Download size={13} /> Export JSON
                </button>
                <button onClick={exporterTXT} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.sable, color: C.espresso }}>
                  <Download size={13} /> Export TXT
                </button>
              </div>
            </Carte>
          </div>

          <div className="flex flex-col gap-5 min-w-0">

            <Carte delay={0.04}>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow icon={Flame}>Série de la semaine</Eyebrow>
                <span className="text-xs font-bold" style={{ color: C.espresso }}>{stats.streak}j</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {semaine.map((j) => (
                  <div key={j.label} className="flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square rounded-xl flex items-center justify-center" style={{ background: j.actif ? C.espresso : C.sable }}>
                      <Flame size={13} style={{ color: j.actif ? C.peony : 'rgba(62,39,35,0.2)' }} />
                    </div>
                    <span className="text-[9px] font-semibold" style={{ color: j.estAujourdhui ? C.espresso : C.encreFaible }}>{j.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: C.sableBorder }}>
                <div><p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '19px', fontWeight: 600, color: C.espresso }}>{stats.joursEcrits}</p><p className="text-[9px]" style={{ color: C.encreFaible }}>Jours écrits</p></div>
                <div><p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '19px', fontWeight: 600, color: C.espresso }}>{stats.pctObjectifs}%</p><p className="text-[9px]" style={{ color: C.encreFaible }}>Objectifs</p></div>
                <div><p className="text-base">{stats.dominante?.emoji || '—'}</p><p className="text-[9px]" style={{ color: C.encreFaible }}>Humeur clé</p></div>
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: C.sableBorder }}>
                <p className="text-[9px] uppercase font-bold tracking-wide mb-1.5" style={{ color: C.encreFaible }}>14 derniers jours</p>
                {sparkline.every((v) => v === null) ? (
                  <p className="text-[10px] italic" style={{ color: C.encreFaible }}>Ta courbe d'humeur apparaîtra ici dès ta première entrée.</p>
                ) : (
                  <svg viewBox="0 0 140 30" className="w-full h-8" preserveAspectRatio="none">
                    <polyline points={sparkline.map((v, i) => `${i * 10.7},${v === null ? 30 : 28 - (v / 5) * 26}`).join(' ')} fill="none" stroke={C.espresso} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    {sparkline.map((v, i) => v !== null && <circle key={i} cx={i * 10.7} cy={28 - (v / 5) * 26} r="1.8" fill={C.espresso} />)}
                  </svg>
                )}
              </div>
            </Carte>

            <div className="anim-in hover-lift relative rounded-3xl p-6 overflow-hidden" style={{ animationDelay: '.07s', background: `linear-gradient(150deg, #2A1712 0%, ${C.espresso} 55%, #5A362E 100%)`, boxShadow: '0 20px 45px rgba(42,23,18,0.35)' }}>
              <div className="halo absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl" style={{ background: 'rgba(246,216,222,0.35)' }} />
              <div className="halo absolute -bottom-16 -left-10 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(201,138,147,0.28)', animationDelay: '2s' }} />
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={8} fill={C.peony} className="etoile absolute" style={{ color: C.peony, top: `${12 + i * 16}%`, left: `${70 + (i % 3) * 8}%`, animationDelay: `${i * 0.4}s` }} />
              ))}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <Sparkles size={14} color={C.peony} />
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', color: C.peony, fontWeight: 600 }}>Le mot de Yuna</p>
                  </div>
                  {/* ⬅️ NOUVEAU : bouton pour demander un vrai résumé IA */}
                  {entrees.length > 0 && (
                    <button
                      onClick={demanderResumeYuna}
                      disabled={chargementResumeIA}
                      className="text-[9px] font-semibold px-2.5 py-1 rounded-full disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.14)', color: C.peony }}
                    >
                      {chargementResumeIA ? '...' : (resumeIA ? 'Régénérer' : 'Demander à Yuna')}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    { icon: NotebookPen, label: 'Résumé de la semaine', texte: motYuna.resume },
                    { icon: Sparkles, label: 'Humeur dominante', chip: motYuna.humeur },
                    { icon: TrendingUp, label: 'Progrès observés', texte: motYuna.progres },
                    { icon: Heart, label: 'Encouragement', texte: motYuna.encouragement },
                  ].map(({ icon: Icon, label, texte, chip }) => (
                    <div className="flex gap-2.5" key={label}>
                      <Icon size={14} className="flex-shrink-0 mt-0.5" color="rgba(246,216,222,0.75)" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(246,216,222,0.75)' }}>{label}</p>
                        {chip ? (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.14)', color: C.peony }}>{chip}</span>
                        ) : (
                          <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(246,216,222,0.92)' }}>{texte}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Carte delay={0.1}>
              <Eyebrow icon={Search}>Entrées récentes</Eyebrow>
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.encreFaible }} />
                <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…"
                  className="w-full rounded-full pl-8 pr-3 py-2 text-xs outline-none border" style={{ background: C.sable, borderColor: C.sableBorder, color: C.espresso }} />
              </div>
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                {entreesFiltrees.length === 0 && (
                  <p className="text-xs italic" style={{ color: C.encreFaible }}>
                    {entrees.length === 0 ? 'Ton journal est encore vierge — enregistre ta première entrée pour la voir apparaître ici.' : 'Aucune entrée'}
                  </p>
                )}
                {entreesFiltrees.map((e) => {
                  const h = HUMEURS.find((x) => x.id === e.humeur)
                  return (
                    <button key={e.date} onClick={() => setDateChoisie(e.date)} className="flex items-center gap-2.5 text-left rounded-xl px-2.5 py-2 transition-colors hover:opacity-80" style={{ background: e.date === dateChoisie ? C.sable : 'transparent' }}>
                      <span className="text-base flex-shrink-0">{h?.emoji || '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate" style={{ color: C.espresso }}>{dateLongue(e.date)}</p>
                        <p className="text-[10px] truncate" style={{ color: C.encreFaible }}>{e.pensees || 'Pas de pensée notée'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </div>
  )
}