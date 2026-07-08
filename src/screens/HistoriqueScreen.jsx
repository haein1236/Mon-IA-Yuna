import { useState, useEffect } from 'react'
import AIAvatar from '../components/AIAvatar'
import { IconPlus, IconTrash } from '../components/Icons'
import {
  chargerConversations,
  supprimerConversation,
  creerNouvelleConversation,
  formaterDate,
} from '../services/conversations'

// HistoriqueScreen reçoit ces props depuis App.jsx :
// - onChangerEcran : pour naviguer vers le chat
// - onOuvrirConversation : pour ouvrir une conversation spécifique
function HistoriqueScreen({ onChangerEcran, onOuvrirConversation }) {

  // ----- ÉTAT -----
  // conversations = tableau de toutes les conversations sauvegardées
  const [conversations, setConversations] = useState([])

  // Au chargement de l'écran, on récupère toutes les conversations
  // depuis le localStorage (via le service conversations.js)
  useEffect(() => {
    setConversations(chargerConversations())
  }, []) // [] = le tableau de dépendances est vide -> exécuté une seule fois au montage

  // ----- ACTIONS -----

  // Crée une nouvelle conversation vide et navigue directement vers le chat
  const nouvelleConversation = () => {
    // On crée un objet conversation vide avec un id unique (généré par le service)
    const conv = creerNouvelleConversation()
    // On transmet cette nouvelle conversation à App.jsx pour qu'elle soit
    // active dans l'écran de chat
    onOuvrirConversation(conv)
    // On change d'écran pour afficher le chat
    onChangerEcran('chat')
  }

  // Ouvre une conversation existante : on la transmet au parent puis on navigue
  const ouvrirConversation = (conversation) => {
    onOuvrirConversation(conversation)
    onChangerEcran('chat')
  }

  // Supprime une conversation de la liste affichée et du stockage
  const handleSupprimerConversation = (e, id) => {
    // e.stopPropagation() = empêche le clic de se propager à la carte parente.
    // Sans cette ligne, cliquer sur la corbeille déclencherait AUSSI
    // l'ouverture de la conversation (car le clic "remonte" au div parent)
    e.stopPropagation()
    // Supprime la conversation côté stockage (localStorage)
    supprimerConversation(id)
    // Met à jour l'état local en retirant la conversation supprimée,
    // pour que l'interface se rafraîchisse immédiatement sans recharger
    setConversations((anciens) => anciens.filter((c) => c.id !== id))
  }

  // Calcule le nombre total de messages tous fils confondus,
  // affiché en sous-titre du header pour donner une vue d'ensemble
  const totalMessages = conversations.reduce(
    (acc, conv) => acc + (conv.messages?.length || 0),
    0
  )

  return (
    // h-full = occupe toute la hauteur disponible du parent
    // flex flex-col = empile verticalement : header / liste / bouton
    // overflow-hidden = empêche tout débordement visuel du conteneur racine
    <div className="h-full flex flex-col bg-cream overflow-hidden">

      {/* ===================================================== */}
      {/* HEADER — titre + compteur + icône décorative            */}
      {/* ===================================================== */}
      <div className="px-6 py-5 bg-white border-b border-peony/30 flex-shrink-0 flex items-center justify-between">

        <div>
          <h1
            className="text-espresso font-semibold flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '19px' }}
          >
            Mes conversations
          </h1>

          {/* Sous-titre dynamique : nombre de conversations + nombre total de messages */}
          <p className="text-[10.5px] text-espresso/45 mt-1">
            {conversations.length === 0
              ? 'Aucune conversation sauvegardée'
              : `${conversations.length} conversation${conversations.length > 1 ? 's' : ''} · ${totalMessages} message${totalMessages > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Badge icône décoratif à droite du header, juste pour l'esthétique */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(196,104,138,0.1)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-[#C4688A]">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ===================================================== */}
      {/* LISTE DES CONVERSATIONS                                  */}
      {/* flex-1 = prend tout l'espace restant entre header/bouton */}
      {/* overflow-y-auto = scroll vertical si la liste est longue */}
      {/* ===================================================== */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">

        {/* ----- ÉTAT VIDE : affiché uniquement si aucune conversation ----- */}
        {conversations.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 animate-fade-slide-up">
            {/* Halo doux derrière l'avatar pour le mettre en valeur */}
            <div
              className="rounded-full flex items-center justify-center animate-float"
              style={{ width: '88px', height: '88px', background: 'rgba(196,104,138,0.08)' }}
            >
              <AIAvatar size={56} />
            </div>
            <p
              className="text-espresso/60 font-medium"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}
            >
              Aucune conversation pour l'instant
            </p>
            <p className="text-[10.5px] text-espresso/40 text-center leading-relaxed">
              Clique sur "Nouvelle conversation"<br />pour commencer à parler avec Yuna
            </p>
          </div>
        )}

        {/* ----- BOUCLE SUR TOUTES LES CONVERSATIONS ----- */}
        {/* On affiche une carte par conversation, avec un léger délai en
            cascade (index * 40ms) pour un effet d'apparition progressive */}
        {conversations.map((conversation, index) => {

          // On récupère le dernier message de la conversation, pour
          // afficher un aperçu de ce qui a été dit en dernier
          const dernierMessage = conversation.messages[conversation.messages.length - 1]

          return (
            // Carte cliquable : un clic n'importe où dans la carte
            // (sauf sur le bouton supprimer) ouvre la conversation
            <div
              key={conversation.id}
              onClick={() => ouvrirConversation(conversation)}
              className="group bg-white rounded-2xl p-4 border border-peony/25 flex items-center gap-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-peony animate-fade-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >

              {/* ----- AVATAR DE YUNA À GAUCHE ----- */}
              <div
                className="w-11 h-11 rounded-full border border-peony flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'rgba(244,201,214,0.25)' }}
              >
                <AIAvatar size={26} />
              </div>

              {/* ----- TITRE + APERÇU DU DERNIER MESSAGE ----- */}
              {/* min-w-0 est nécessaire pour que `truncate` fonctionne
                  correctement à l'intérieur d'un flex container */}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-espresso">
                  {conversation.titre}
                </p>
                {/* Aperçu tronqué (...) si le message dépasse la largeur disponible.
                    L'émoji change selon qui a envoyé le dernier message */}
                <p className="text-[10.5px] text-espresso/50 mt-0.5 truncate">
                  {dernierMessage?.auteur === 'yuna' ? '🤖 ' : '👤 '}
                  {dernierMessage?.texte || 'Aucun message'}
                </p>
              </div>

              {/* ----- MÉTADONNÉES À DROITE : date / nb messages / suppression ----- */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">

                {/* Date de dernière mise à jour, formatée par le service */}
                <span className="text-[9px] text-espresso/40">
                  {formaterDate(conversation.dateMiseAJour)}
                </span>

                <div className="flex items-center gap-2">
                  {/* Badge "X msg" — fond espresso plein, texte peony, contraste fort */}
                  <span className="bg-espresso text-peony text-[9px] font-semibold px-2.5 py-1 rounded-full">
                    {conversation.messages.length} msg
                  </span>

                  {/* Bouton supprimer : stopPropagation empêche l'ouverture
                      de la conversation au clic (voir handleSupprimerConversation) */}
                  <button
                    onClick={(e) => handleSupprimerConversation(e, conversation.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors duration-200"
                  >
                    <IconTrash className="w-3.5 h-3.5 text-espresso/30 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===================================================== */}
      {/* BOUTON "NOUVELLE CONVERSATION"                           */}
      {/* flex-shrink-0 = ne rétrécit jamais, toujours visible      */}
      {/* ===================================================== */}
      <div className="p-4 flex-shrink-0 border-t border-peony/15">
        <button
          onClick={nouvelleConversation}
          className="w-full bg-espresso text-peony rounded-2xl py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ boxShadow: '0 4px 14px rgba(62,39,35,0.18)' }}
        >
          <IconPlus className="w-4 h-4" />
          Nouvelle conversation
        </button>
      </div>
    </div>
  )
}

export default HistoriqueScreen