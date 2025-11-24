import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config
export default defineConfig({
  base: './',
  plugins: [vue()],
  // Désactiver la génération de sourcemaps côté build/dev pour éviter les warnings
  build: {
    sourcemap: false,
  },
  css: {
    devSourcemap: false,
  },
  optimizeDeps: {
    // Force une re-optimisation à chaque démarrage pour éviter les 504 "Outdated Optimize Dep"
    force: true,
    esbuildOptions: {
      sourcemap: false,
    },
  },
});
