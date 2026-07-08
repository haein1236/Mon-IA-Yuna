import { IconGallery, IconChat, IconClock, IconProfile } from './Icons'

function StatCard({ Icone, label, valeur }) {
  return (

    // group = permet d'activer des styles sur les enfants au hover du parent
    // transition-all duration-200 = toutes les transitions en 200ms
    // hover:shadow-md = ombre légère au survol
    // hover:-translate-y-0.5 = monte légèrement au survol (effet "lift")
    // cursor-pointer = curseur main au survol
    <div className="bg-white border border-peony/30 rounded-xl p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">

      {/* Icône qui change d'opacité au hover de la carte parente */}
      <Icone className="w-4 h-4 text-espresso/50 transition-opacity duration-200 group-hover:opacity-100" />

      <p className="text-[9px] text-espresso/45 mt-2">{label}</p>
      <p className="text-[13px] font-semibold text-espresso mt-0.5">{valeur}</p>

    </div>
  )
}

function StatsRow() {
  return (

    // animate-[fadeSlideUp] avec délai 300ms : apparaît en dernier
    <div
      className="animate-[fadeSlideUp_0.5s_ease_forwards] opacity-0"
      style={{ animationDelay: '300ms' }}
    >
      <p className="text-[10px] text-espresso/50 mb-2">Aperçu</p>
      <div className="grid grid-cols-4 gap-2">
        <StatCard Icone={IconGallery} label="Galerie"   valeur="12 images"     />
        <StatCard Icone={IconChat}    label="Messages"  valeur="48 cette sem."  />
        <StatCard Icone={IconClock}   label="Streak"    valeur="5 jours"        />
        <StatCard Icone={IconProfile} label="Profil"    valeur="80% complet"    />
      </div>
    </div>
  )
}

export default StatsRow