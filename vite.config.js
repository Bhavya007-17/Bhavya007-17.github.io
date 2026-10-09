import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 600 }, // the lazy ArmHero chunk (Three.js) is about 530 kB
});
