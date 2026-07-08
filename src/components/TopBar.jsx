import { IconBell, IconSearch } from './Icons'

function TopBar() {
  return (

    // animate-[fadeSlideUp] avec délai 0 : premier élément à apparaître
    // opacity-0 au départ, l'animation la rend visible
    <div
      className="flex items-center gap-3 flex-shrink-0 animate-[fadeSlideUp_0.5s_ease_forwards] opacity-0"
      style={{ animationDelay: '0ms' }}
    >

      {/* Bouton notification avec pulse sur le point rouge */}
      <div className="relative w-8 h-8 rounded-full bg-peony flex items-center justify-center flex-shrink-0">
        <IconBell className="w-4 h-4 text-espresso" />

        {/* Point rouge avec animation pulse en boucle */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-espresso rounded-full border-2 border-cream animate-[pulseDot_1.8s_ease-in-out_infinite]" />
      </div>

      {/* Barre de recherche */}
      <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-2 border border-peony/30 transition-all duration-200 hover:border-peony hover:shadow-sm">
        <IconSearch className="w-3.5 h-3.5 text-espresso/35 flex-shrink-0" />
        <span className="text-[11px] text-espresso/35">
          Demande quelque chose à Yuna...
        </span>
      </div>

    </div>
  )
}

export default TopBar