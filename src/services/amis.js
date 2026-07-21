import { supabase } from './supabase'

export async function obtenirMonProfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profils_publics').select('*').eq('id', user.id).maybeSingle()
  return data
}

export async function envoyerDemandeAmi(codeAmi) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: cible } = await supabase.from('profils_publics').select('id, pseudo').eq('code_ami', codeAmi.trim().toUpperCase()).maybeSingle()

  if (!cible) throw new Error("Aucun utilisateur ne correspond à ce code.")
  if (cible.id === user.id) throw new Error("Tu ne peux pas t'ajouter toi-même.")

  const { error } = await supabase.from('amities').insert({ demandeur_id: user.id, destinataire_id: cible.id })
  if (error) throw new Error(error.message.includes('duplicate') ? 'Demande déjà envoyée.' : error.message)
  return cible.pseudo
}

export async function repondreDemandeAmi(amitieId, accepter) {
  const { error } = await supabase.from('amities').update({ statut: accepter ? 'accepte' : 'refuse' }).eq('id', amitieId)
  if (error) throw error
}

export async function chargerDemandesRecues() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('amities')
    .select('id, demandeur_id, statut, profils_publics!amities_demandeur_id_fkey(pseudo)')
    .eq('destinataire_id', user.id)
    .eq('statut', 'en_attente')
  return data || []
}

export async function chargerMesAmis() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('amities')
    .select('id, demandeur_id, destinataire_id, statut, demandeur:profils_publics!amities_demandeur_id_fkey(id, pseudo), destinataire:profils_publics!amities_destinataire_id_fkey(id, pseudo)')
    .eq('statut', 'accepte')
    .or(`demandeur_id.eq.${user.id},destinataire_id.eq.${user.id}`)

  return (data || []).map((a) => a.demandeur_id === user.id ? a.destinataire : a.demandeur)
}