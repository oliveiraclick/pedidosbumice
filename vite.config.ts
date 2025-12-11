```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'Pedidos Bumn Ice',
        short_name: 'Pedidos Bumn Ice',
      }
    })
  ],
})
```
