import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    // Pre-optimiza TODAS las dependencias de PrimeNG que usarás
    include: [
      'primeng/**',
      '@primeuix/themes',
      '@primeuix/themes/material'
    ],
    // Fuerza la optimización en el primer inicio
    force: true
  },
  ssr: {
    // Evita que PrimeNG se externalice en SSR
    noExternal: ['primeng', '@primeuix/themes']
  },
  server: {
    // Reduce la sensibilidad del watch
    watch: {
      usePolling: false,
      interval: 300
    }
  }
});