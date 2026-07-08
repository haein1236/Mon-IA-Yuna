import AIAvatar from './AIAvatar'
import { IconHeart, IconMessageSquare, IconArrowRight } from './Icons'

function YunaCard({ onChangerEcran }) {
  return (

    // animate-[fadeSlideUp] = l'ensemble de la carte apparaît en glissant vers le haut
    // delay-100 = commence après 100ms (légèrement après la TopBar)
<div
  className="relative rounded-2xl overflow-hidden h-[185px] flex-shrink-0 animate-[fadeSlideUp_0.5s_ease_forwards] opacity-0"
  style={{
    // color-mix() génère automatiquement une version plus claire/foncée
    // de la couleur espresso actuelle, sans avoir besoin de 3 variables séparées
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-espresso), white 30%) 0%, var(--color-espresso) 60%, color-mix(in srgb, var(--color-espresso), black 25%) 100%)',
    animationDelay: '100ms',
  }}
>
  <svg className="absolute right-5 -top-5 opacity-20" width="170" height="170" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="95" fill="none" stroke="var(--color-peony)" strokeWidth="1" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-peony)" strokeWidth="1" />
  </svg>

      {/* Avatar avec animation float : monte et descend doucement en boucle */}
      <div className="absolute bottom-0 right-14 z-10 animate-[float_3s_ease-in-out_infinite]">
        <AIAvatar size={112} />
      </div>

      {/* Boutons d'action avec transition hover : grossissent légèrement au survol */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">

        <button className="w-7 h-7 rounded-full bg-peony flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95">
          <IconHeart className="w-3 h-3 text-espresso" />
        </button>

        <button className="w-7 h-7 rounded-full bg-peony/50 flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95">
          <IconMessageSquare className="w-3 h-3 text-espresso" />
        </button>

      </div>

      {/* Texte + bouton principal */}
      <div className="absolute top-4 left-5 z-10 max-w-[54%]">
        <p className="text-[9px] text-peony/65 font-medium mb-1 uppercase tracking-widest">
          Ta compagne IA
        </p>
        <h2 className="text-[18px] font-semibold text-peony leading-tight mb-1.5">
          Salut, c'est Yuna 👋
        </h2>
        <p className="text-[10px] text-peony/70 leading-relaxed mb-3">
          Toujours là pour papoter,<br />
          te conseiller ou juste rigoler.
        </p>

        {/* Bouton avec transition hover douce */}
        <button
          onClick={() => onChangerEcran('chat')}
          className="inline-flex items-center gap-1.5 bg-peony text-espresso text-[10px] font-bold px-4 py-2 rounded-full transition-all duration-200 hover:bg-peony-light hover:scale-105 active:scale-95"
        >
          Discuter maintenant
          <IconArrowRight className="w-2.5 h-2.5" />
        </button>

      </div>
    </div>
  )
}

export default YunaCard