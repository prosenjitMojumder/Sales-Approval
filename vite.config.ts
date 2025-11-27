import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Explicitly declare process to avoid TS2580 error without needing @types/node
declare const process: any;

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so it works in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevents "process is not defined" error in some libraries
      'process.env': {} 
    }
  };
});