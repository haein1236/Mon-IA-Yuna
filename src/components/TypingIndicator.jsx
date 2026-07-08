// Import de l'avatar SVG de Yuna pour l'afficher à côté des points
import AIAvatar from './AIAvatar'

function TypingIndicator() {
  return (

    // Même structure qu'une bulle de message de Yuna
    // items-end = aligne l'avatar et la bulle par le bas
    // gap-2 = espace de 8px entre l'avatar et les points
    <div className="flex items-end gap-2">

      {/* Avatar Yuna en petit à gauche, comme pour ses vraies bulles */}
      <div className="w-8 h-8 rounded-full bg-peony-light border border-peony flex items-center justify-center flex-shrink-0">
        <AIAvatar size={20} />
      </div>

      {/* Conteneur des 3 points animés */}
      <div className="flex flex-col gap-1">

        {/* Petit nom au-dessus, comme pour les vraies bulles */}
        <span className="text-[9px] font-semibold text-espresso/50 ml-1">
          Yuna écrit...
        </span>

        {/* Bulle blanche avec les 3 points */}
        {/* bg-white + border peony = même style que les bulles de Yuna */}
        <div className="bg-white border border-peony/30 rounded-[18px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1.5">

          {/* Chaque point a un délai différent pour créer l'effet cascade */}
          {/* animate-bounce = rebond en boucle */}
          <div className="w-1.5 h-1.5 rounded-full bg-peony animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-peony animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-peony animate-bounce [animation-delay:300ms]" />

        </div>
      </div>
    </div>
  )
}

export default TypingIndicator