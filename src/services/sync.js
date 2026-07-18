import { supabase } from './supabase'

// ============================================================
// SYNCHRONISATION GÉNÉRIQUE AVEC SUPABASE
// "upsert" = met à jour la ligne si elle existe déjà (même user_id +
// type), sinon la crée — grâce à la contrainte "unique(user_id, type)"
// posée dans la table. Comme avant : jamais bloquant, échoue en
// silence si pas de réseau, réessaiera à la prochaine sauvegarde.
// ============================================================

export async function synchroniserVersFirestore(type, contenu) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  try {
    await supabase.from('donnees_utilisateur').upsert(
      { user_id: user.id, type, contenu, mis_a_jour_le: new Date().toISOString() },
      { onConflict: 'user_id,type' }
    )
  } catch (erreur) {
    console.error(`Erreur sync Supabase (${type}) :`, erreur)
  }
}

export async function chargerDepuisFirestore(type) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const { data, error } = await supabase
      .from('donnees_utilisateur')
      .select('contenu')
      .eq('user_id', user.id)
      .eq('type', type)
      .maybeSingle()
    if (error) throw error
    return data?.contenu || null
  } catch (erreur) {
    console.error(`Erreur lecture Supabase (${type}) :`, erreur)
    return null
  }
}

export async function synchroniserAuDemarrage(cleLocalStorage, type) {
  const donneesCloud = await chargerDepuisFirestore(type)
  if (donneesCloud) {
    localStorage.setItem(cleLocalStorage, JSON.stringify(donneesCloud))
  } else {
    const donneesLocales = localStorage.getItem(cleLocalStorage)
    if (donneesLocales) {
      await synchroniserVersFirestore(type, JSON.parse(donneesLocales))
    }
  }
}