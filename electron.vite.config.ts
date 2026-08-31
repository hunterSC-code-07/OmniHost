import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
// import { reticle } from '@reticlehq/vite-plugin'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    optimizeDeps: {
      include: ['motion/react', 'lucide-react', 'react-icons', 'overlayscrollbars-react']
    },
    plugins: [react() /*, reticle() as any*/]
  }
})
