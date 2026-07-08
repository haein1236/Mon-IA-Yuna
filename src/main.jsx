import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext' // ⬅️ nouveau

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ThemeProvider entoure toute l'app pour que le thème
        soit accessible partout, même dans la Sidebar */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)