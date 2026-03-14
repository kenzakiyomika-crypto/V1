import { defineConfig } from 'vite';
import { resolve } from 'path';

const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html') },
      output: {
        // Code-split per domain — each loads lazily
        manualChunks: {
          'chunk-strength':  [
            './src/domains/strength/domain/calcStrength',
            './src/domains/strength/domain/calcFatigue',
            './src/domains/strength/application/strengthUseCases',
          ],
          'chunk-endurance': [
            './src/domains/endurance/domain/calcEndurance',
            './src/domains/endurance/application/enduranceUseCases',
          ],
          'chunk-military':  [
            './src/domains/military/domain/militaryStandards',
            './src/domains/military/application/militaryUseCases',
          ],
          'chunk-planning':  [
            './src/domains/planning/domain/planningLogic',
            './src/domains/planning/application/planningUseCases',
          ],
          'chunk-recovery':  [
            './src/domains/recovery/domain/calcReadiness',
            './src/domains/recovery/application/recoveryUseCases',
          ],
          'chunk-infra': [
            './src/infra/persistence',
            './src/infra/migrations',
            './src/infra/storage',
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@core':    resolve(__dirname, 'src/core'),
      '@app':     resolve(__dirname, 'src/app'),
      '@infra':   resolve(__dirname, 'src/infra'),
      '@shared':  resolve(__dirname, 'src/shared'),
      '@domains': resolve(__dirname, 'src/domains'),
    },
  },
});
