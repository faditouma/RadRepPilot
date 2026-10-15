import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: { '/api/education': 'http://127.0.0.1:8787', '/api/quiz': 'http://127.0.0.1:8788', '/quiz-images': 'http://127.0.0.1:8788' } },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
