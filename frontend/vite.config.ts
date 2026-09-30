import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Config do Vite. So o plugin do React mesmo — docs em vite.dev/config
//
// base: na Hostinger o site fica na raiz do dominio ('/'), mas no GitHub
// Pages ele fica em /Academia24/. O workflow de deploy passa BASE_PATH;
// build local continua na raiz, sem precisar lembrar de nada.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // Em dev, /api vai pro PHP do Docker (backend/docker-compose.yml).
  // Em producao nao precisa: front e API ficam no mesmo dominio.
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
})
