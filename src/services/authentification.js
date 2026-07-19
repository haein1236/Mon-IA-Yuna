import { supabase } from './supabase'

// ============================================================
// AUTHENTIFICATION SUPABASE
// Mêmes noms de fonctions que la version Firebase précédente —
// aucun autre fichier n'a besoin d'être retouché pour ça.
// ============================================================

export async function inscrire(email, motDePasse) {
  const { data, error } = await supabase.auth.signUp({ email, password: motDePasse })
  if (error) throw error
  return data.user
}

export async function connecter(email, motDePasse) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
  if (error) throw error
  return data.user
}

export async function deconnecter() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Équivalent de onAuthStateChanged de Firebase : appelle callback(user)
// à chaque changement (connexion, déconnexion, chargement initial)
export function surveillerConnexion(callback) {
  // Vérifie tout de suite s'il y a déjà une session active
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user || null)
  })

  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })

  // Retourne une fonction de désabonnement, comme Firebase
  return () => subscription.subscription.unsubscribe()
}

export function traduireErreurAuth(erreur) {
  const message = erreur?.message || ''
  if (message.includes('already registered')) return 'Un compte existe déjà avec cet email.'
  if (message.includes('invalid') && message.includes('email')) return "Cet email n'est pas valide."
  if (message.includes('Password') && message.includes('6')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (message.includes('rate limit')) return 'Trop de tentatives — réessaie dans quelques minutes.'
  return "Une erreur est survenue. Réessaie."
}


// ============================================================
// CONNEXION VIA GOOGLE
// Redirige vers l'écran de choix de compte Google natif, puis
// revient automatiquement sur l'app une fois connecté — Supabase
// gère tout le flux OAuth en interne.
// ============================================================
export async function connecterAvecGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirige vers l'URL actuelle de l'app après connexion,
      // que ce soit en local ou une fois déployé sur Vercel
      redirectTo: window.location.origin,
    },
  })
  if (error) throw error
}