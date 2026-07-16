import { useState, useEffect } from 'react'
import { chargerFaits, modifierFait, supprimerFait } from '../services/memoire'

const IconCrayon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7 18.4l-3.6.8.8-3.6L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" /></svg>
)
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const IconCerveau = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M9.5 2a3.5 3.5 0 0 0-3.5 3.5c0 .3 0 .6.1.9A3 3 0 0 0 4 9.5a3 3 0 0 0 1.5 2.6A3.5 3.5 0 0 0 5 14a3.5 3.5 0 0 0 3.5 3.5V21a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3.5A3.5 3.5 0 0 0 19 14a3.5 3.5 0 0 0-.5-1.9A3 3 0 0 0 20 9.5a3 3 0 0 0-1.6-2.6c.1-.3.1-.6.1-.9A3.5 3.5 0 0 0 15 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
)

function MemoireScreen() {
  const [faits, setFaits] = useState([])
  const [indexEnEdition, setIndexEnEdition] = useState(null)
  const [texteEdition, setTexteEdition] = useState('')

  useEffect(() => {
    setFaits(chargerFaits())
  }, [])

  const commencerEdition = (index) => {
    setIndexEnEdition(index)
    setTexteEdition(faits[index])
  }

  const validerEdition = () => {
    if (!texteEdition.trim()) return
    setFaits(modifierFait(indexEnEdition, texteEdition.trim()))
    setIndexEnEdition(null)
  }

  const supprimer = (fait) => {
    const confirme = window.confirm('Supprimer ce souvenir ?')
    if (!confirme) return
    setFaits(supprimerFait(fait))
  }

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[700px] mx-auto">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-espresso/8 flex items-center justify-center">
            <IconCerveau style={{ width: '17px', height: '17px' }} className="text-espresso" />
          </div>
          <div>
            <h1 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px' }}>
              Ce que Yuna sait de toi
            </h1>
            <p className="text-[10.5px] text-espresso/45">{faits.length} souvenir{faits.length > 1 ? 's' : ''} — modifie ou supprime ce que tu veux</p>
          </div>
        </div>

        <p className="text-[10.5px] text-espresso/40 leading-relaxed mb-6 italic">
          Yuna retient automatiquement quelques détails marquants de vos discussions (jamais d'informations sensibles). Tout reste stocké uniquement dans ton navigateur.
        </p>

        {faits.length === 0 ? (
          <p className="text-center text-espresso/40 italic py-16 text-[12px]">
            Aucun souvenir pour l'instant — discute un peu avec Yuna, elle commencera à retenir des choses naturellement.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {faits.map((fait, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 border border-espresso/10 flex items-start gap-3">
                {indexEnEdition === index ? (
                  <>
                    <input
                      autoFocus
                      value={texteEdition}
                      onChange={(e) => setTexteEdition(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && validerEdition()}
                      className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/20 focus:border-espresso"
                    />
                    <button onClick={validerEdition} className="w-8 h-8 rounded-full bg-espresso text-peony flex items-center justify-center flex-shrink-0">
                      <IconCheck style={{ width: '14px', height: '14px' }} />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-[12.5px] text-espresso leading-relaxed">{fait}</p>
                    <button onClick={() => commencerEdition(index)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0">
                      <IconCrayon style={{ width: '13px', height: '13px' }} className="text-espresso/50" />
                    </button>
                    <button onClick={() => supprimer(fait)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors duration-200 flex-shrink-0">
                      <IconTrash style={{ width: '13px', height: '13px' }} className="text-red-400" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoireScreen