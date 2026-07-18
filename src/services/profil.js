import { synchroniserVersFirestore } from './sync'

const CLE_PROFIL = 'yuna-profil-saki'

export function chargerProfil() {
  const donnees = localStorage.getItem(CLE_PROFIL)
  return donnees ? JSON.parse(donnees) : null
}

export function sauvegarderProfil(profil) {
  localStorage.setItem(CLE_PROFIL, JSON.stringify(profil))
  synchroniserVersFirestore('profil', profil)
}