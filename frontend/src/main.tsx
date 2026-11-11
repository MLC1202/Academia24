// Ponto de entrada: pendura o App na div #root do index.html.

import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

const raiz = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Paginas pre-renderizadas (scripts/prerender.ts) ja vem com o HTML dentro da
// raiz: o React so "assume". Dev e /admin chegam com a raiz vazia.
if (raiz.hasChildNodes()) hydrateRoot(raiz, app)
else createRoot(raiz).render(app)
