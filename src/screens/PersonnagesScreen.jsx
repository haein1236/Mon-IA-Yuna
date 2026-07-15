import { useState, useEffect, useRef } from 'react'
import {
  chargerPersonnages,
  sauvegarderPersonnage,
  supprimerPersonnage,
  togglerFavoriPersonnage,
  creerPersonnageVide,
  chargerMessagesPersonnage,
  sauvegarderMessagesPersonnage,
  reinitialiserConversationPersonnage,
  CATEGORIES_PERSONNAGES,
} from '../services/personnages'
import { envoyerMessageAPersonnage } from '../services/gemini'
import { fichierVersBase64 } from '../services/images'

// ============================================================
// ICÔNES LOCALES
// ============================================================
const IconCroix = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
const IconCoeur = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" />
  </svg>
)
const IconRetour = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconEnvoi = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
  </svg>
)
const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 2v6h-6M3 22v-6h6M3.5 9A9 9 0 0 1 21 6M20.5 15A9 9 0 0 1 3 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

// ============================================================
// PETIT COMPOSANT : avatar de personnage (initiale + couleur si
// pas d'image uploadée)
// ============================================================
function AvatarPersonnage({ personnage, taille = 48 }) {
  if (personnage.avatarUrl) {
    return (
      <img
        src={personnage.avatarUrl}
        alt={personnage.nom}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: taille, height: taille }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{ width: taille, height: taille, background: personnage.couleur, fontSize: taille * 0.4 }}
    >
      {personnage.nom.charAt(0).toUpperCase()}
    </div>
  )
}

function PersonnagesScreen() {

  const [personnages, setPersonnages] = useState([])
  const [categorieFiltre, setCategorieFiltre] = useState('tout')
  const [recherche, setRecherche] = useState('')

  // Personnage actuellement ouvert en conversation (null = vue grille)
  const [personnageActif, setPersonnageActif] = useState(null)
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [enTrainDecrire, setEnTrainDecrire] = useState(false)

  // Créateur de personnage
  const [afficherCreateur, setAfficherCreateur] = useState(false)
  const [personnageEnEdition, setPersonnageEnEdition] = useState(null)

  const basDeListeRef = useRef(null)
  const inputAvatarRef = useRef(null)

  useEffect(() => {
    setPersonnages(chargerPersonnages())
  }, [])

  useEffect(() => {
    basDeListeRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enTrainDecrire])

  // ===== FILTRAGE =====
  const personnagesFiltres = personnages.filter((p) => {
    const correspondCategorie = categorieFiltre === 'tout' || p.categorie === categorieFiltre
    const correspondRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(recherche.toLowerCase()))
    return correspondCategorie && correspondRecherche
  })

  // ===== OUVRIR UNE CONVERSATION AVEC UN PERSONNAGE =====
  const ouvrirPersonnage = (personnage) => {
    setPersonnageActif(personnage)
    setMessages(chargerMessagesPersonnage(personnage))
  }

  const retourALaGrille = () => {
    setPersonnageActif(null)
    setMessages([])
  }

  const toggleFavori = (e, id) => {
    e.stopPropagation()
    setPersonnages(togglerFavoriPersonnage(id))
  }

  // ===== ENVOYER UN MESSAGE AU PERSONNAGE =====
  const envoyerMessage = async () => {
    if (!saisie.trim() || envoiEnCours || !personnageActif) return
    const texteUtilisateur = saisie

    const messageUtilisateur = {
      id: Date.now(), auteur: 'user', texte: texteUtilisateur,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }

    const nouveauxMessages = [...messages, messageUtilisateur]
    setMessages(nouveauxMessages)
    sauvegarderMessagesPersonnage(personnageActif.id, nouveauxMessages)
    setSaisie('')
    setEnvoiEnCours(true)
    setEnTrainDecrire(true)

    // L'historique envoyé à Gemini utilise le rôle "model" pour les
    // messages du personnage (auteur 'personnage'), comme pour Yuna
    const historiquePourGemini = nouveauxMessages.slice(1).map((m) => ({
      ...m, auteur: m.auteur === 'personnage' ? 'model' : m.auteur,
    }))

    const reponseTexte = await envoyerMessageAPersonnage(historiquePourGemini, texteUtilisateur, personnageActif)

    setEnTrainDecrire(false)
    setEnvoiEnCours(false)

    const messagesAvecReponse = [...nouveauxMessages, {
      id: Date.now() + 1, auteur: 'personnage', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
    setMessages(messagesAvecReponse)
    sauvegarderMessagesPersonnage(personnageActif.id, messagesAvecReponse)
  }

  const gererToucheEntree = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyerMessage()
    }
  }

  const recommencerHistoire = () => {
    const confirme = window.confirm(`Recommencer l'histoire avec ${personnageActif.nom} depuis le début ? Cette conversation sera effacée.`)
    if (!confirme) return
    const messagesReset = reinitialiserConversationPersonnage(personnageActif)
    setMessages(messagesReset)
  }

  // ===== CRÉATEUR DE PERSONNAGE =====
  const ouvrirCreateur = (personnageAModifier = null) => {
    setPersonnageEnEdition(personnageAModifier || creerPersonnageVide())
    setAfficherCreateur(true)
  }

  const modifierChampCreation = (champ, valeur) => {
    setPersonnageEnEdition((ancien) => ({ ...ancien, [champ]: valeur }))
  }

  const gererUploadAvatar = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return
    const base64 = await fichierVersBase64(fichier)
    modifierChampCreation('avatarUrl', base64)
  }

  const validerCreation = () => {
    if (!personnageEnEdition.nom.trim() || !personnageEnEdition.sceneOuverture.trim()) {
      alert('Le nom et la scène d\'ouverture sont obligatoires.')
      return
    }
    const personnagesMaj = sauvegarderPersonnage(personnageEnEdition)
    setPersonnages(personnagesMaj)
    setAfficherCreateur(false)
    setPersonnageEnEdition(null)
  }

  const supprimerPersonnageActuel = (e, personnage) => {
    e.stopPropagation()
    if (personnage.origine === 'predefini') {
      alert('Les personnages prédéfinis ne peuvent pas être supprimés — tu peux juste ne pas les utiliser.')
      return
    }
    const confirme = window.confirm(`Supprimer définitivement ${personnage.nom} et sa conversation ?`)
    if (!confirme) return
    setPersonnages(supprimerPersonnage(personnage.id))
  }

  // ============================================================
  // VUE CONVERSATION — chat immersif avec le personnage sélectionné
  // ============================================================
  if (personnageActif) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ background: `color-mix(in srgb, ${personnageActif.couleur} 6%, var(--color-cream))` }}>

        <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4 bg-white border-b flex-shrink-0" style={{ borderColor: `${personnageActif.couleur}30` }}>
          <button onClick={retourALaGrille} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0">
            <IconRetour style={{ width: '16px', height: '16px' }} className="text-espresso/60" />
          </button>

          <AvatarPersonnage personnage={personnageActif} taille={38} />

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-espresso truncate">{personnageActif.nom}</p>
            <p className="text-[9.5px] text-espresso/45 truncate">{personnageActif.description}</p>
          </div>

          <button
            onClick={recommencerHistoire}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0"
            title="Recommencer l'histoire"
          >
            <IconRefresh style={{ width: '15px', height: '15px' }} className="text-espresso/50" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-suave p-3 sm:p-4 md:p-6 flex flex-col gap-3">
          {messages.map((message) => {
            const estUser = message.auteur === 'user'
            return (
              <div key={message.id} className={`flex items-end gap-2 ${estUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!estUser && <AvatarPersonnage personnage={personnageActif} taille={28} />}
                <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[12px] leading-relaxed whitespace-pre-line ${
                  estUser
                    ? 'bg-espresso text-peony rounded-[18px] rounded-br-[4px]'
                    : 'bg-white text-espresso border rounded-[18px] rounded-bl-[4px]'
                }`}
                  style={!estUser ? { borderColor: `${personnageActif.couleur}30` } : undefined}
                >
                  {message.texte}
                </div>
              </div>
            )
          })}

          {enTrainDecrire && (
            <div className="flex items-end gap-2">
              <AvatarPersonnage personnage={personnageActif} taille={28} />
              <div className="bg-white border rounded-[18px] rounded-bl-[4px] px-4 py-3 flex gap-1.5" style={{ borderColor: `${personnageActif.couleur}30` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={basDeListeRef} />
        </div>

        <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2.5 md:py-4 bg-white border-t flex-shrink-0" style={{ borderColor: `${personnageActif.couleur}30`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <input
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={gererToucheEntree}
            placeholder={`Réponds à ${personnageActif.nom}...`}
            disabled={envoiEnCours}
            className="flex-1 min-w-0 bg-cream border rounded-full px-4 py-3 md:py-2.5 text-[16px] md:text-[13px] text-espresso placeholder:text-espresso/40 outline-none transition-all duration-200 disabled:opacity-50"
            style={{ borderColor: `${personnageActif.couleur}40` }}
          />
          <button
            onClick={envoyerMessage}
            disabled={!saisie.trim() || envoiEnCours}
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-35"
            style={{ background: personnageActif.couleur }}
          >
            <IconEnvoi className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // VUE GRILLE — liste des personnages, filtres, création
  // ============================================================
  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <div className="px-4 md:px-8 py-5 md:py-7">

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px' }}>
              Personnages
            </h1>
            <p className="text-[10.5px] text-espresso/45 mt-0.5">Discute, crée, vis des histoires</p>
          </div>

          <button
            onClick={() => ouvrirCreateur()}
            className="flex items-center gap-1.5 bg-espresso text-peony rounded-full px-4 py-2.5 text-[11.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <IconPlus style={{ width: '14px', height: '14px' }} />
            Créer un personnage
          </button>
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un personnage..."
          className="w-full bg-white border border-espresso/10 rounded-full px-4 py-2.5 text-[12px] text-espresso placeholder:text-espresso/35 outline-none focus:border-espresso/30 transition-colors duration-200 mb-4"
        />

        {/* Filtres catégories — scroll horizontal sur mobile si ça déborde */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scroll-suave" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCategorieFiltre('tout')}
            className="flex-shrink-0 rounded-full text-[11px] font-medium px-3.5 py-2 transition-all duration-200"
            style={{
              background: categorieFiltre === 'tout' ? 'var(--color-espresso)' : 'white',
              color: categorieFiltre === 'tout' ? 'var(--color-peony)' : 'rgba(62,39,35,0.6)',
              border: categorieFiltre === 'tout' ? 'none' : '1px solid rgba(62,39,35,0.1)',
            }}
          >
            Tous
          </button>
          {CATEGORIES_PERSONNAGES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategorieFiltre(cat.id)}
              className="flex-shrink-0 rounded-full text-[11px] font-medium px-3.5 py-2 transition-all duration-200"
              style={{
                background: categorieFiltre === cat.id ? 'var(--color-espresso)' : 'white',
                color: categorieFiltre === cat.id ? 'var(--color-peony)' : 'rgba(62,39,35,0.6)',
                border: categorieFiltre === cat.id ? 'none' : '1px solid rgba(62,39,35,0.1)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {personnagesFiltres.length === 0 && (
          <p className="text-center text-espresso/40 italic py-16 text-[12px]">
            Aucun personnage ne correspond à ta recherche
          </p>
        )}

        {/* ============================================================
            GRILLE DE CARTES — responsive : 1 colonne mobile (cartes
            larges et lisibles), 2 dès sm:, 3 dès lg:, 4 dès xl: pour
            les très grands écrans
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-8">
          {personnagesFiltres.map((personnage) => (
            <div
              key={personnage.id}
              onClick={() => ouvrirPersonnage(personnage)}
              className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 border border-espresso/8"
              style={{ boxShadow: '0 4px 14px rgba(62,39,35,0.06)' }}
            >
              {/* Bandeau coloré du haut, propre à chaque personnage */}
              <div
                className="h-16 relative flex items-end p-3"
                style={{ background: `linear-gradient(135deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 20%))` }}
              >
                <button
                  onClick={(e) => toggleFavori(e, personnage.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/15 hover:bg-black/25 transition-colors duration-200"
                >
                  <IconCoeur style={{ width: '13px', height: '13px' }} fill={personnage.favori ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" />
                </button>

                {personnage.origine === 'perso' && (
                  <button
                    onClick={(e) => supprimerPersonnageActuel(e, personnage)}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/15 hover:bg-black/25 transition-colors duration-200"
                  >
                    <IconTrash style={{ width: '12px', height: '12px' }} className="text-white" />
                  </button>
                )}
              </div>

              <div className="p-4 -mt-8 relative">
                <AvatarPersonnage personnage={personnage} taille={56} />

                <p className="font-semibold text-espresso mt-2.5 text-[14px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {personnage.nom}
                </p>

                <span
                  className="inline-block text-[8.5px] font-medium px-2 py-0.5 rounded-full mt-1"
                  style={{ background: `${personnage.couleur}18`, color: personnage.couleur }}
                >
                  {CATEGORIES_PERSONNAGES.find((c) => c.id === personnage.categorie)?.label || personnage.categorie}
                </span>

                <p className="text-[10.5px] text-espresso/55 mt-2 leading-relaxed line-clamp-2">
                  {personnage.description}
                </p>

                <div className="flex flex-wrap gap-1 mt-2.5">
                  {personnage.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[8px] text-espresso/40 bg-[#F0EEEB] px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          CRÉATEUR DE PERSONNAGE — formulaire complet en plein écran
          ============================================================ */}
      {afficherCreateur && personnageEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-espresso/60" onClick={() => setAfficherCreateur(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto scroll-suave p-5 md:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>
                Créer un personnage
              </h2>
              <button onClick={() => setAfficherCreateur(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200">
                <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3 mb-5">
              <AvatarPersonnage personnage={personnageEnEdition} taille={60} />
              <div>
                <input ref={inputAvatarRef} type="file" accept="image/*" onChange={gererUploadAvatar} className="hidden" />
                <button
                  onClick={() => inputAvatarRef.current?.click()}
                  className="text-[10.5px] font-medium text-espresso bg-[#F0EEEB] rounded-full px-3.5 py-1.5 hover:bg-espresso/10 transition-colors duration-200"
                >
                  Choisir une image
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Nom du personnage *</label>
                <input
                  type="text"
                  value={personnageEnEdition.nom}
                  onChange={(e) => modifierChampCreation('nom', e.target.value)}
                  placeholder="Ex : Sofia"
                  className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso"
                />
              </div>
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Couleur</label>
                <input
                  type="color"
                  value={personnageEnEdition.couleur}
                  onChange={(e) => modifierChampCreation('couleur', e.target.value)}
                  className="w-full h-9 rounded-xl mt-1 cursor-pointer border border-espresso/15"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Catégorie</label>
              <select
                value={personnageEnEdition.categorie}
                onChange={(e) => modifierChampCreation('categorie', e.target.value)}
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso"
              >
                {CATEGORIES_PERSONNAGES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Description courte (affichée sur la carte)</label>
              <input
                type="text"
                value={personnageEnEdition.description}
                onChange={(e) => modifierChampCreation('description', e.target.value)}
                placeholder="Une phrase qui donne envie de cliquer"
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso"
              />
            </div>

            <div className="mb-3">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Histoire / contexte</label>
              <textarea
                value={personnageEnEdition.histoire}
                onChange={(e) => modifierChampCreation('histoire', e.target.value)}
                placeholder="Le contexte complet de l'histoire, la situation, la relation avec l'utilisateur..."
                rows={3}
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-none"
              />
            </div>

            <div className="mb-3">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Personnalité (comment il/elle doit se comporter)</label>
              <textarea
                value={personnageEnEdition.personnalite}
                onChange={(e) => modifierChampCreation('personnalite', e.target.value)}
                placeholder="Ex : Timide au début, drôle une fois en confiance, protecteur..."
                rows={2}
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-none"
              />
            </div>

            <div className="mb-5">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Scène d'ouverture *</label>
              <textarea
                value={personnageEnEdition.sceneOuverture}
                onChange={(e) => modifierChampCreation('sceneOuverture', e.target.value)}
                placeholder="Le tout premier message, celui qui lance l'histoire (contexte + arrivée du perso + réplique)"
                rows={3}
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-none"
              />
            </div>

            <button
              onClick={validerCreation}
              className="w-full rounded-xl py-3 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Créer le personnage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnagesScreen