import { useState, useEffect } from 'react'
import AIAvatar from './AIAvatar'
import { IconHeart } from './Icons'
import { chargerImages } from '../services/images'

// ============================================================
// RIGHT PANEL
// AVANT : "Voir plus" et "Voir tout" étaient de simples <span>,
// donc pas cliquables. Les 5 miniatures étaient des <div> vides
// sans image réelle.
// APRÈS : vrais <button> connectés à onChangerEcran (reçu depuis
// App.jsx via HomeScreen), et les miniatures affichent les
// vraies images marquées comme favorites dans la Galerie.
// "hidden md:flex" : invisible sur mobile (pas la place), visible
// à partir de la taille tablette/desktop.
// ============================================================
function RightPanel({ onChangerEcran }) {

  const [imagesFavorites, setImagesFavorites] = useState([])

  useEffect(() => {
    const toutesLesImages = chargerImages()
    setImagesFavorites(toutesLesImages.filter((img) => img.favori))
  }, [])

  const totalFavoris = imagesFavorites.length
  const imagesAffichees = imagesFavorites.slice(0, 5)
  const nombreRestant = Math.max(0, totalFavoris - 5)

  return (
    <div className="hidden md:flex w-[230px] h-full bg-white flex-col flex-shrink-0 border-l border-peony/30 overflow-hidden">

      {/* ===== ZONE HAUTE : Profil Yuna ===== */}
      <div className="p-5 border-b border-peony/30">

        <div className="flex items-center gap-2.5 mb-3">
          <AIAvatar size={40} />
          <div>
            <p className="text-xs font-semibold text-espresso">Yuna</p>
            <p className="text-[9px] text-espresso/50">Ta pote IA</p>
          </div>
        </div>

        <span className="inline-block bg-peony-light text-espresso text-[9px] font-semibold px-2.5 py-1 rounded-full mb-3">
          En ligne
        </span>

        <h4 className="text-[10px] font-semibold text-espresso mb-1.5">
          À propos
        </h4>

        <p className="text-[9px] text-espresso/55 leading-relaxed mb-2.5">
          Yuna est là pour papoter, donner des idées, et égayer ta journée.
        </p>

        {/* CORRECTION : vrai bouton cliquable, navigue vers le Profil
            (où se trouve "Mon histoire", la suite naturelle de "À propos") */}
        <button
          onClick={() => onChangerEcran && onChangerEcran('profil')}
          className="inline-block border border-peony text-espresso text-[8px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200 hover:bg-peony hover:-translate-y-0.5"
        >
          Voir plus
        </button>

      </div>

      {/* ===== ZONE BASSE : Images favorites ===== */}
      <div className="flex-1 p-5 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <IconHeart className="w-3 h-3 text-espresso" />
            <span className="text-[10px] font-semibold text-espresso">
              Images favorites
            </span>
          </div>

          {/* CORRECTION : vrai bouton cliquable, navigue vers la Galerie */}
          <button
            onClick={() => onChangerEcran && onChangerEcran('galerie')}
            className="text-[8px] text-espresso/40 hover:text-espresso transition-colors duration-200"
          >
            Voir tout
          </button>
        </div>

        {/* CORRECTION : message clair si aucune image favorite pour l'instant,
            plutôt que d'afficher 6 cases roses vides sans explication */}
        {totalFavoris === 0 ? (
          <p className="text-[9px] text-espresso/35 italic">
            Aucune image favorite pour l'instant. Ajoute-en depuis la Galerie !
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 flex-1">
            {imagesAffichees.map((img) => (
              // CORRECTION : vraie image (plus une <div> vide), cliquable → Galerie
              <button
                key={img.id}
                onClick={() => onChangerEcran && onChangerEcran('galerie')}
                className="relative rounded-lg overflow-hidden min-h-0 aspect-square"
                style={{ background: img.bg || 'var(--color-peony-light)' }}
                title={img.titre}
              >
                {img.url && (
                  <img
                    src={img.url}
                    alt={img.titre}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </button>
            ))}

            {/* Dernière case : nombre d'images favorites supplémentaires,
                affichée seulement si elle existe (> 5 favoris) */}
            {nombreRestant > 0 && (
              <button
                onClick={() => onChangerEcran && onChangerEcran('galerie')}
                className="bg-peony-light rounded-lg min-h-0 aspect-square flex items-center justify-center text-[9px] font-semibold text-espresso/60 hover:bg-peony transition-colors duration-200"
              >
                +{nombreRestant}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel