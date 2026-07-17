import { useState, useEffect } from 'react'

// ============================================================
// AFFICHEUR DE NOTIFICATIONS
// À monter UNE SEULE FOIS, tout en haut de App.jsx (en dehors des
// écrans). Écoute l'événement "yuna-notification" et empile les
// toasts en haut de l'écran, avec disparition automatique après 4s.
// ============================================================
function NotificationHost() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const gererNotification = (e) => {
      const notif = e.detail
      setNotifications((anciennes) => [...anciennes, notif])
      setTimeout(() => {
        setNotifications((anciennes) => anciennes.filter((n) => n.id !== notif.id))
      }, 4000)
    }
    window.addEventListener('yuna-notification', gererNotification)
    return () => window.removeEventListener('yuna-notification', gererNotification)
  }, [])

  if (notifications.length === 0) return null

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-[380px] pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="rounded-2xl px-4 py-3 text-[11.5px] font-medium shadow-lg pointer-events-auto animate-[fadeSlideUp_0.3s_ease]"
          style={{
           // Dans le style du toast, remplace la ligne "background:" par :
                background: notif.type === 'erreur' ? '#3E2723' : notif.type === 'info' ? 'var(--color-espresso)' : '#4ade80',
                color: notif.type === 'erreur' ? '#F4C9D6' : notif.type === 'info' ? 'var(--color-peony)' : '#1a3a1a',
          }}
        >
          {notif.message}
        </div>
      ))}
    </div>
  )
}

export default NotificationHost