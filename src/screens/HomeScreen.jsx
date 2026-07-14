import { useState, useEffect } from 'react'
import TopBar     from '../components/TopBar'
import YunaCard   from '../components/YunaCard'
import RightPanel from '../components/RightPanel'
import { chargerConversations } from '../services/conversations'
import { chargerImages } from '../services/images'

function HomeScreen({ onChangerEcran }) {

  const [conversations, setConversations] = useState([])
  const [images, setImages]               = useState([])

  useEffect(() => {
    setConversations(chargerConversations())
    setImages(chargerImages())
  }, [])

  const discussionsRecentes = conversations.slice(0, 4).map((conv) => ({
    titre: conv.titre || 'Conversation',
    heure: conv.dateMiseAJour
      ? new Date(conv.dateMiseAJour).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    id: conv.id,
  }))

  const discussionsAffichees = discussionsRecentes.length > 0
    ? discussionsRecentes
    : [
        { titre: 'Conseils',   heure: '12:20', id: '1' },
        { titre: 'Idées',      heure: '03:30', id: '2' },
        { titre: 'Discussion', heure: '10:05', id: '3' },
        { titre: 'Souvenirs',  heure: '02:40', id: '4' },
      ]

  const totalImages   = images.length
  const totalMessages = conversations.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0)
  const totalFavoris  = images.filter((i) => i.favori).length

  const apercu = [
    {
      id: 'galerie', label: 'Galerie', valeur: totalImages > 0 ? `${totalImages} images` : '12 images', couleur: '#C4917A',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" style={{ color: '#C4917A' }}>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'chat', label: 'Messages', valeur: totalMessages > 0 ? `${totalMessages} total` : '48 cette sem.', couleur: '#8AA0C4',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" style={{ color: '#8AA0C4' }}>
          <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'galerie', label: 'Favoris', valeur: totalFavoris > 0 ? `${totalFavoris} images` : '5 images', couleur: '#C4688A',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" style={{ color: '#C4688A' }}>
          <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'profil', label: 'Profil', valeur: '80% complet', couleur: '#8B9E7A',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" style={{ color: '#8B9E7A' }}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    // FIX : min-h-0 ajouté sur le conteneur racine — sans lui, ce
    // conteneur "h-full" pouvait grandir plus que l'espace réel
    // fourni par App.jsx, empêchant tout scroll interne.
    <div className="h-full min-h-0 bg-cream flex flex-col md:flex-row overflow-hidden">

      {/* FIX : min-h-0 ajouté ICI aussi — c'est CET élément qui a
          "overflow-y-auto", donc c'est lui qui a absolument besoin
          de min-h-0 pour que le scroll se déclenche réellement */}
      <div className="flex-1 min-h-0 flex flex-col gap-5 md:gap-6 p-4 md:p-7 overflow-y-auto min-w-0">

        <TopBar />

        <YunaCard onChangerEcran={onChangerEcran} />

        <div className="animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium">
              Discussions récentes
            </h2>
            <div className="flex-1 h-px bg-espresso/8" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {discussionsAffichees.map((discussion, i) => (
              <div
                key={discussion.id}
                onClick={() => onChangerEcran('historique')}
                className="group bg-white rounded-2xl p-4 border border-peony/25 cursor-pointer transition-all duration-200 hover:border-peony hover:-translate-y-0.5"
                style={{ boxShadow: '0 2px 8px rgba(62,39,35,0.04)', animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4688A]/60 group-hover:bg-[#C4688A] transition-colors" />
                  <span className="text-[9px] text-espresso/40">{discussion.heure}</span>
                </div>
                <p className="text-[12px] font-semibold text-espresso leading-snug">
                  {discussion.titre}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium">
              Aperçu
            </h2>
            <div className="flex-1 h-px bg-espresso/8" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {apercu.map((carte, i) => (
              <div
                key={carte.label}
                onClick={() => onChangerEcran(carte.id)}
                className="bg-white border border-peony/25 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-peony"
                style={{ boxShadow: '0 2px 8px rgba(62,39,35,0.04)', animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5"
                  style={{ background: `${carte.couleur}1A` }}
                >
                  {carte.icone}
                </div>
                <p className="text-[9.5px] text-espresso/45">{carte.label}</p>
                <p className="text-[14px] font-semibold text-espresso mt-0.5">
                  {carte.valeur}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RightPanel onChangerEcran={onChangerEcran} />
    </div>
  )
}

export default HomeScreen