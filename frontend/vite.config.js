import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),

    // only enable HTTPS in production mode
    ...(mode === 'production' ? [basicSsl()] : []),
  ],

  server: {
    host: true,
    port: 3000,
  },
}));