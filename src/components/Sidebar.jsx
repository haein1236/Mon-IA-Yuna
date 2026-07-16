import { IconHome, IconChat, IconGallery, IconProfile, IconSettings, IconClock, IconPersonnages, IconJournal } from './Icons'

function Sidebar({ ecranActuel, onChangerEcran }) {

  const onglets = [
    { id: 'chat',        Icone: IconChat        },
    { id: 'personnages', Icone: IconPersonnages },
    { id: 'historique',  Icone: IconClock        },
    { id: 'galerie',     Icone: IconGallery      },
    { id: 'journal',     Icone: IconJournal      },
    { id: 'profil',      Icone: IconProfile      },
  ]

  return (
    // ⬅️ CHANGÉ : "md:" → "lg:" partout dans ce composant.
    // Les tablettes (généralement 768-1024px) gardent maintenant la
    // barre HORIZONTALE du bas, plus large et confortable, au lieu
    // de basculer trop tôt sur la colonne verticale étroite de 64px.
    <div className="order-2 lg:order-1 w-full h-16 flex-row lg:w-16 lg:h-full lg:flex-col bg-peony flex items-center z-20 flex-shrink-0">

      <button
        onClick={() => onChangerEcran('accueil')}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 flex-shrink-0 mx-2 lg:mx-0 lg:my-5 ${
          ecranActuel === 'accueil' ? 'bg-espresso' : 'bg-espresso/40 lg:bg-espresso'
        }`}
      >
        <IconHome className="w-4 h-4 text-peony" />
      </button>

      <div className="hidden lg:block w-6 h-px bg-espresso/20 lg:my-1" />

      <div
        className="flex-1 min-w-0 flex flex-row lg:flex-col items-center gap-4 lg:gap-5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto scroll-suave px-2 lg:px-0 lg:py-3"
        style={{ scrollbarWidth: 'none', touchAction: 'pan-x' }}
      >
        {onglets.map((onglet) => {
          const estActif = ecranActuel === onglet.id
          const Icone = onglet.Icone
          return (
            <button
              key={onglet.id}
              onClick={() => onChangerEcran(onglet.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-espresso/10 hover:scale-110 active:scale-95 flex-shrink-0"
            >
              <Icone className={`w-5 h-5 text-espresso transition-opacity duration-200 ${estActif ? 'opacity-100' : 'opacity-40'}`} />
            </button>
          )
        })}
      </div>

      <div className="hidden lg:block w-6 h-px bg-espresso/20 lg:my-1" />

      <button
        onClick={() => onChangerEcran('parametres')}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-espresso/10 hover:scale-110 active:scale-95 flex-shrink-0 mx-2 lg:mx-0 lg:mb-5"
      >
        <IconSettings className="w-5 h-5 text-espresso opacity-40" />
      </button>
    </div>
  )
}

export default Sidebar