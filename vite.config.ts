import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Third-party packages sometimes ship corrupted/invalid .map files
    // (seen with lucide-react's gpu.js.map: "Unexpected \x00 in source map").
    // esbuild's dependency pre-bundler reads those maps by default and throws
    // an UNCAUGHT exception that kills the whole dev/build process over one
    // icon nobody's even using yet. Disabling sourcemaps for the dep
    // optimizer avoids that entirely - it doesn't affect your own app code's
    // sourcemaps, only how pre-bundled node_modules deps are processed.
    optimizeDeps: {
      esbuildOptions: {
        sourcemap: false,
      },
    },
    build: {
      sourcemap: false,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true' ? {
        protocol: env.HTTPS === 'true' ? 'wss' : 'ws',
        host: 'localhost',
        port: 5173,
      } : false,
    },
  };
});
