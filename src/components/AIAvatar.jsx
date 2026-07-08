// ============================================================
// AVATAR DE YUNA
// Les couleurs utilisent maintenant var(--color-x) au lieu de codes
// hexadécimaux fixes : l'avatar change donc de couleur en même temps
// que le reste de l'app quand on change de thème.
// color-mix() calcule une teinte plus foncée de "peony" à la volée,
// pour garder le même effet d'ombre sur les antennes.
// ============================================================
function AIAvatar({ size = 112 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      {/* Bulle de dialogue */}
      <path d="M180 10 H300 a30 30 0 0 1 30 30 V90 a30 30 0 0 1 -30 30 H255 L235 165 L215 120 H180 a30 30 0 0 1 -30 -30 V40 a30 30 0 0 1 30 -30 Z" fill="var(--color-peony)"/>

      {/* Oreilles / antennes latérales */}
      <rect x="25" y="220" width="35" height="190" rx="17" fill="var(--color-peony-light)"/>
      <rect x="452" y="220" width="35" height="190" rx="17" fill="var(--color-peony-light)"/>
      <rect x="60" y="320" width="30" height="90" rx="15" fill="color-mix(in srgb, var(--color-peony), black 15%)"/>
      <rect x="422" y="320" width="30" height="90" rx="15" fill="color-mix(in srgb, var(--color-peony), black 15%)"/>

      {/* Tête du robot */}
      <rect x="70" y="215" width="372" height="280" rx="60" fill="var(--color-peony-light)"/>

      {/* Carré décoratif */}
      <rect x="216" y="215" width="80" height="80" rx="12" fill="var(--color-peony)"/>

      {/* Écran du visage */}
      <rect x="105" y="320" width="302" height="150" rx="35" fill="var(--color-espresso)"/>

      {/* Yeux */}
      <circle cx="195" cy="395" r="16" fill="var(--color-peony)"/>
      <circle cx="317" cy="395" r="16" fill="var(--color-peony)"/>

      {/* Sourire */}
      <path d="M232 425 Q256 445 280 425" stroke="var(--color-peony)" strokeWidth="8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default AIAvatar