import AIAvatar from './AIAvatar'
import { IconHeart } from './Icons'

function RightPanel() {
  return (

    // w-[230px] = largeur fixe de la colonne droite
    // h-full = toute la hauteur disponible (héritée du parent flex)
    // bg-white = fond blanc
    // flex flex-col = contenu empilé verticalement
    // flex-shrink-0 = ne rétrécit jamais, largeur toujours fixe
    // border-l = fine bordure rose sur le côté gauche de la colonne
    // overflow-hidden = rien ne déborde
    <div className="hidden md:flex w-[230px] h-full bg-white flex-col flex-shrink-0 border-l border-peony/30 overflow-hidden">
      {/* ===== ZONE HAUTE : Profil Yuna ===== */}
      {/* border-b = fine bordure rose en bas pour séparer des favoris */}
      <div className="p-5 border-b border-peony/30">

        {/* En-tête : avatar + nom + sous-titre côte à côte */}
        <div className="flex items-center gap-2.5 mb-3">

          {/* Avatar SVG de Yuna en petit (40px) */}
          <AIAvatar size={40} />

          <div>
            <p className="text-xs font-semibold text-espresso">Yuna</p>
            <p className="text-[9px] text-espresso/50">Ta pote IA</p>
          </div>
        </div>

        {/* Badge "En ligne" : fond peony clair, texte espresso */}
        <span className="inline-block bg-peony-light text-espresso text-[9px] font-semibold px-2.5 py-1 rounded-full mb-3">
          En ligne
        </span>

        {/* Titre de la section description */}
        <h4 className="text-[10px] font-semibold text-espresso mb-1.5">
          À propos
        </h4>

        {/* Description courte de Yuna */}
        <p className="text-[9px] text-espresso/55 leading-relaxed mb-2.5">
          Yuna est là pour papoter, donner des idées, et égayer ta journée.
        </p>

        {/* Bouton "Voir plus" en style outline (bordure, pas de fond) */}
        <span className="inline-block border border-peony text-espresso text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Voir plus
        </span>

      </div>

      {/* ===== ZONE BASSE : Images favorites ===== */}
      {/* flex-1 = prend TOUT l'espace restant sous la zone profil */}
      {/* flex flex-col = pour que la grille puisse s'étirer */}
      <div className="flex-1 p-5 flex flex-col overflow-hidden">

        {/* En-tête de la section favoris */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">

          {/* Titre avec icône cœur */}
          <div className="flex items-center gap-1.5">
            <IconHeart className="w-3 h-3 text-espresso" />
            <span className="text-[10px] font-semibold text-espresso">
              Images favorites
            </span>
          </div>

          {/* Lien "Voir tout" à droite */}
          <span className="text-[8px] text-espresso/40">Voir tout</span>

        </div>

        {/* Grille 3 colonnes pour les miniatures d'images */}
        {/* flex-1 = la grille prend tout l'espace vertical restant */}
        {/* gap-2 = espace de 8px entre chaque miniature */}
        <div className="grid grid-cols-3 gap-2 flex-1">

          {/* 5 cases vides (seront remplies par les vraies images Firebase plus tard) */}
          {/* min-h-0 = permet à l'élément de rétrécir si besoin */}
          <div className="bg-peony-light rounded-lg min-h-0" />
          <div className="bg-peony-light rounded-lg min-h-0" />
          <div className="bg-peony-light rounded-lg min-h-0" />
          <div className="bg-peony-light rounded-lg min-h-0" />
          <div className="bg-peony-light rounded-lg min-h-0" />

          {/* Dernière case : affiche le nombre d'images supplémentaires */}
          <div className="bg-peony-light rounded-lg min-h-0 flex items-center justify-center text-[9px] font-semibold text-espresso/60">
            +9
          </div>

        </div>
      </div>
    </div>
  )
}

export default RightPanel