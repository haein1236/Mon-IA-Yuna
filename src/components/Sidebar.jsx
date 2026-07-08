import { IconHome, IconChat, IconGallery, IconProfile, IconSettings, IconClock } from './Icons'

function Sidebar({ ecranActuel, onChangerEcran }) {

  const onglets = [
    { id: 'chat',       Icone: IconChat    },
    { id: 'historique', Icone: IconClock   },
    { id: 'galerie',    Icone: IconGallery },
    { id: 'profil',     Icone: IconProfile },
  ]

  return (
    // ============================================================
    // RESPONSIVE : deux mises en page selon la taille d'écran
    // - Par défaut (mobile, < 768px) : barre HORIZONTALE collée en BAS
    //   (w-full, flex-row, fixed bottom-0)
    // - À partir de "md:" (≥768px, tablette/desktop) : on repasse à la
    //   sidebar VERTICALE d'origine (md:w-16, md:h-full, md:flex-col)
    // Tailwind applique les classes "md:" seulement au-delà de 768px,
    // donc le design mobile est celui par défaut, sans préfixe.
    // ============================================================
    <div
      className="
        fixed bottom-0 left-0 w-full h-16 flex-row justify-around
        md:static md:w-16 md:h-full md:flex-col md:justify-start md:py-5 md:gap-6
        bg-peony flex items-center z-20 flex-shrink-0
      "
    >
      {/* Logo accueil — caché sur mobile (déjà dans la barre du bas via l'onglet Home) */}
      <button
        onClick={() => onChangerEcran('accueil')}
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95
          ${ecranActuel === 'accueil' ? 'bg-espresso' : 'bg-espresso/40 md:bg-espresso'}
        `}
      >
        <IconHome className="w-4 h-4 text-peony" />
      </button>

      {/* Séparateur — visible seulement en version desktop verticale */}
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

      {/* Sur desktop : pousse le bouton Paramètres tout en bas avec flex-1.
          Sur mobile : pas besoin, la barre est horizontale donc pas de "bas" à pousser —
          on cache ce spacer pour ne pas casser l'alignement horizontal */}
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