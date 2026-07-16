import { IconHome, IconChat, IconGallery, IconProfile, IconSettings, IconClock, IconPersonnages, IconJournal } from './Icons'

function Sidebar({ ecranActuel, onChangerEcran }) {

  // ============================================================
  // ⬅️ NOUVEAU : ajout de "journal" à la liste des onglets
  // ============================================================
  const onglets = [
    { id: 'chat',        Icone: IconChat        },
    { id: 'personnages', Icone: IconPersonnages },
    { id: 'historique',  Icone: IconClock        },
    { id: 'galerie',     Icone: IconGallery      },
    { id: 'journal',     Icone: IconJournal      },
    { id: 'profil',      Icone: IconProfile      },
  ]

  return (
    <div className="order-2 md:order-1 w-full h-16 flex-row md:w-16 md:h-full md:flex-col bg-peony flex items-center z-20 flex-shrink-0">

      {/* ===== ACCUEIL — toujours visible, jamais dans la zone scrollable ===== */}
      <button
        onClick={() => onChangerEcran('accueil')}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 flex-shrink-0 mx-2 md:mx-0 md:my-5 ${
          ecranActuel === 'accueil' ? 'bg-espresso' : 'bg-espresso/40 md:bg-espresso'
        }`}
      >
        <IconHome className="w-4 h-4 text-peony" />
      </button>

      <div className="hidden md:block w-6 h-px bg-espresso/20 md:my-1" />

      {/* ============================================================
          ⬅️ NOUVEAU : ZONE SCROLLABLE des onglets du milieu
          Sur mobile (par défaut) : "overflow-x-auto" + "touch-action:
          pan-x" permettent de swiper horizontalement pour voir les
          icônes qui dépassent — nécessaire maintenant qu'on a 6 onglets
          au milieu (avant on en avait 4, ça tenait sans scroll).
          Sur desktop (md:) : on repasse en colonne verticale classique,
          avec un scroll VERTICAL de secours ("md:overflow-y-auto") au
          cas où l'écran serait vraiment petit en hauteur.
          "scrollbarWidth: none" cache la barre de scroll disgracieuse
          sur Firefox ; les navigateurs WebKit (Chrome/Safari) la
          cachent nativement sur ce genre de petite zone tactile.
          ============================================================ */}
      <div
        className="flex-1 min-w-0 flex flex-row md:flex-col items-center gap-4 md:gap-5 overflow-x-auto md:overflow-x-visible md:overflow-y-auto scroll-suave px-2 md:px-0 md:py-3"
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

      <div className="hidden md:block w-6 h-px bg-espresso/20 md:my-1" />

      {/* ===== PARAMÈTRES — toujours visible, jamais dans la zone scrollable ===== */}
      <button
        onClick={() => onChangerEcran('parametres')}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-espresso/10 hover:scale-110 active:scale-95 flex-shrink-0 mx-2 md:mx-0 md:mb-5"
      >
        <IconSettings className="w-5 h-5 text-espresso opacity-40" />
      </button>

    </div>
  )
}

export default Sidebar