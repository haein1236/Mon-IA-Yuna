import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// StrictMode retiré : il double intentionnellement certains useEffect
// en développement pour détecter des bugs, ce qui donnait l'impression
// que l'app "s'ouvrait deux fois" ou envoyait des messages en double.
// Aucun impact sur le comportement réel en production (npm run build).
createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)