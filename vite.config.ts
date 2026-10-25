import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

export default defineConfig({
  // HTTPS=1 serves over a self-signed cert: phones on the LAN need a secure
  // context for WebGPU, which the Spline scene requires
  plugins: [tailwindcss(), react(), ...(process.env.HTTPS ? [basicSsl()] : [])],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    sourcemap: 'hidden',
  },
})
