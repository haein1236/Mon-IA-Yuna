import {
  IconHome,
  IconChat,
  IconGallery,
  IconProfile,
  IconSettings,
  IconClock,
  IconPersonnages
} from "./Icons";


function Sidebar({ ecranActuel, onChangerEcran }) {

  const onglets = [
    { id: 'chat',       Icone: IconChat    },
    { id: 'personnages', Icone: IconPersonnages },
    { id: 'historique', Icone: IconClock   },
    { id: 'galerie',    Icone: IconGallery },
    { id: 'profil',     Icone: IconProfile },
  ]

  return (
    // ============================================================
    // CORRECTION MAJEURE : "fixed bottom-0" SUPPRIMÉ.
    // AVANT : la barre restait "collée" au bas de l'écran physique
    // via position fixed — ce qui causait des bugs de repositionnement
    // quand le clavier virtuel s'ouvrait (comportement inconsistant
    // entre navigateurs mobiles).
    // APRÈS : la barre fait partie du flux normal de la page (un
    // simple élément dans le flex-col de App.jsx). "order-2 md:order-1"
    // la place en dernier (donc en BAS) sur mobile, et en premier
    // (donc à GAUCHE) sur desktop — sans jamais utiliser fixed.
    // Plus aucun conflit possible avec le clavier tactile.
    // ============================================================
    <div className="order-2 md:order-1 w-full h-16 flex-row justify-around md:w-16 md:h-full md:flex-col md:justify-start md:py-5 md:gap-6 bg-peony flex items-center z-20 flex-shrink-0">

      <button
        onClick={() => onChangerEcran('accueil')}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 ${
          ecranActuel === 'accueil' ? 'bg-espresso' : 'bg-espresso/40 md:bg-espresso'
        }`}
      >
        <IconHome className="w-4 h-4 text-peony" />
      </button>

      <div className="hidden md:block w-6 h-px bg-espresso/20" />

      {onglets.map((onglet) => {
        const estActif = ecranActuel === onglet.id
        const Icone = onglet.Icone

        return (
          <button
            key={onglet.id}
            onClick={() => onChangerEcran(onglet.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-espresso/10 hover:scale-110 active:scale-95"
          >
            <Icone className={`w-5 h-5 text-espresso transition-opacity duration-200 ${estActif ? 'opacity-100' : 'opacity-40'}`} />
          </button>
        )
      })}

      <div className="hidden md:block md:flex-1" />

      <button
        onClick={() => onChangerEcran('parametres')}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-espresso/10 hover:scale-110 active:scale-95"
      >
        <IconSettings className="w-5 h-5 text-espresso opacity-40" />
      </button>

    </div>
  )
}

export default Sidebar