import { useState, useEffect } from 'react'
import { chargerEntreesJournal, sauvegarderEntreeJournal, obtenirEntreeDuJour, HUMEURS } from '../services/journal'
import { genererResumeJournal } from '../services/gemini'
import { notifierErreur, notifierSucces } from '../services/notifications'

function formaterDateISO(date) {
  return date.toISOString().slice(0, 10)
}

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
)
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const IconEtoiles = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)

function JournalScreen() {
  const [dateChoisie, setDateChoisie] = useState(() => formaterDateISO(new Date()))
  const [entrees, setEntrees] = useState([])
  const [humeur, setHumeur] = useState('bien')
  const [pensees, setPensees] = useState('')
  const [objectifs, setObjectifs] = useState([])
  const [nouvelObjectif, setNouvelObjectif] = useState('')
  const [resume, setResume] = useState('')
  const [chargementResume, setChargementResume] = useState(false)

  useEffect(() => {
    setEntrees(chargerEntreesJournal())
  }, [])

  // Charge l'entrée existante quand on change de date
  useEffect(() => {
    const entree = obtenirEntreeDuJour(dateChoisie)
    if (entree) {
      setHumeur(entree.humeur)
      setPensees(entree.pensees || '')
      setObjectifs(entree.objectifs || [])
    } else {
      setHumeur('bien')
      setPensees('')
      setObjectifs([])
    }
  }, [dateChoisie])

  const sauvegarder = () => {
    const nouvelleEntree = { date: dateChoisie, humeur, pensees, objectifs }
    setEntrees(sauvegarderEntreeJournal(nouvelleEntree))
    notifierSucces('Entrée du journal enregistrée 📝')
  }

  const ajouterObjectif = () => {
    if (!nouvelObjectif.trim()) return
    setObjectifs([...objectifs, { texte: nouvelObjectif.trim(), fait: false }])
    setNouvelObjectif('')
  }

  const toggleObjectif = (index) => {
    setObjectifs(objectifs.map((o, i) => i === index ? { ...o, fait: !o.fait } : o))
  }

  const supprimerObjectif = (index) => {
    setObjectifs(objectifs.filter((_, i) => i !== index))
  }

  // ===== Mini calendrier du mois en cours =====
  const aujourdHui = new Date()
  const anneeMois = dateChoisie.slice(0, 7)
  const [annee, mois] = anneeMois.split('-').map(Number)
  const nbJours = new Date(annee, mois, 0).getDate()
  const joursDuMois = Array.from({ length: nbJours }, (_, i) => {
    const jour = i + 1
    const dateStr = `${anneeMois}-${String(jour).padStart(2, '0')}`
    const entree = entrees.find((e) => e.date === dateStr)
    return { jour, dateStr, humeur: entree?.humeur }
  })

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

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[800px] mx-auto">

        <h1 className="text-espresso font-semibold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px' }}>
          Mon Journal
        </h1>
        <p className="text-[10.5px] text-espresso/45 mb-6">Humeur, pensées, objectifs — au fil des jours</p>

        {/* ===== MINI CALENDRIER ===== */}
        <div className="bg-white rounded-2xl border border-espresso/10 p-4 mb-5 overflow-x-auto scroll-suave">
          <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">
            {new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
          <div className="flex gap-1.5 min-w-max">
            {joursDuMois.map(({ jour, dateStr, humeur: humeurJour }) => {
              const estChoisi = dateStr === dateChoisie
              const humeurInfo = HUMEURS.find((h) => h.id === humeurJour)
              return (
                <button
                  key={jour}
                  onClick={() => setDateChoisie(dateStr)}
                  className="flex flex-col items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150"
                  style={{
                    width: '34px', height: '42px',
                    background: estChoisi ? 'var(--color-espresso)' : humeurJour ? 'var(--color-peony-light)' : '#F0EEEB',
                  }}
                >
                  <span className={`text-[10px] font-medium ${estChoisi ? 'text-peony' : 'text-espresso/60'}`}>{jour}</span>
                  <span className="text-[11px]">{humeurInfo?.emoji || ''}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ===== COLONNE GAUCHE : entrée du jour ===== */}
          <div className="bg-white rounded-2xl border border-espresso/10 p-5">
            <input
              type="date"
              value={dateChoisie}
              onChange={(e) => setDateChoisie(e.target.value)}
              max={formaterDateISO(aujourdHui)}
              className="text-[12px] text-espresso bg-[#F0EEEB] rounded-xl px-3 py-2 outline-none border border-espresso/15 mb-4"
            />

            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Comment tu te sens</p>
            <div className="flex gap-2 mb-5">
              {HUMEURS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHumeur(h.id)}
                  className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150"
                  style={{ background: humeur === h.id ? 'var(--color-espresso)' : '#F0EEEB' }}
                >
                  <span className="text-[18px]">{h.emoji}</span>
                  <span className={`text-[8px] ${humeur === h.id ? 'text-peony' : 'text-espresso/50'}`}>{h.label}</span>
                </button>
              ))}
            </div>

            <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Tes pensées</p>
            <textarea
              value={pensees}
              onChange={(e) => setPensees(e.target.value)}
              placeholder="Écris ce que tu as sur le cœur aujourd'hui..."
              rows={5}
              className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[12.5px] text-espresso outline-none border border-espresso/15 focus:border-espresso resize-y mb-5 leading-relaxed"
            />

            <button
              onClick={sauvegarder}
              className="w-full rounded-xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Enregistrer cette entrée
            </button>
          </div>

          {/* ===== COLONNE DROITE : objectifs + résumé IA ===== */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-espresso/10 p-5">
              <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-3">Objectifs du jour</p>

              <div className="flex gap-2 mb-3">
                <input
                  value={nouvelObjectif}
                  onChange={(e) => setNouvelObjectif(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && ajouterObjectif()}
                  placeholder="Ajouter un objectif..."
                  className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus:border-espresso"
                />
                <button onClick={ajouterObjectif} className="w-9 h-9 rounded-full bg-espresso flex items-center justify-center flex-shrink-0">
                  <IconPlus style={{ width: '14px', height: '14px' }} className="text-peony" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {objectifs.length === 0 && (
                  <p className="text-[10.5px] text-espresso/35 italic">Aucun objectif pour aujourd'hui</p>
                )}
                {objectifs.map((obj, index) => (
                  <div key={index} className="flex items-center gap-2 bg-[#F0EEEB] rounded-xl px-3 py-2">
                    <button
                      onClick={() => toggleObjectif(index)}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                      style={{ background: obj.fait ? 'var(--color-espresso)' : 'white', border: '1.5px solid rgba(62,39,35,0.2)' }}
                    >
                      {obj.fait && <IconCheck style={{ width: '10px', height: '10px' }} className="text-peony" />}
                    </button>
                    <span className={`flex-1 text-[11.5px] ${obj.fait ? 'text-espresso/35 line-through' : 'text-espresso'}`}>
                      {obj.texte}
                    </span>
                    <button onClick={() => supprimerObjectif(index)} className="text-espresso/30 hover:text-red-400 text-[14px] flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== RÉSUMÉ IA ===== */}
            <div className="bg-espresso rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <IconEtoiles style={{ width: '15px', height: '15px' }} className="text-peony/60" />
                <p className="text-[9px] text-peony/60 uppercase tracking-wide">Résumé de ta semaine par Yuna</p>
              </div>

              {resume ? (
                <p className="text-[12px] text-peony leading-relaxed italic">{resume}</p>
              ) : (
                <p className="text-[11px] text-peony/50 italic mb-3">Génère un résumé bienveillant de tes 7 dernières entrées</p>
              )}

              <button
                onClick={genererResume}
                disabled={chargementResume}
                className="mt-3 text-[10.5px] font-semibold text-espresso bg-peony rounded-full px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                {chargementResume ? 'Génération...' : (resume ? 'Régénérer' : 'Générer le résumé')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JournalScreen