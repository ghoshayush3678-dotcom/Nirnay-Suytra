import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

/**
 * Allows root /index.html to reference pre-built ./dist/assets/app.js and ./dist/assets/index.css
 * for zero-build static hosting (e.g., GitHub Pages serving root /), while seamlessly swapping to
 * /src/main.tsx when running `vite dev` or `vite build`.
 */
function staticRootCompatPlugin(): Plugin {
  return {
    name: 'static-root-compat',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/<link[^>]*href="\.\/dist\/assets\/index\.css"[^>]*>\s*/g, '')
          .replace(
            /<script[^>]*src="\.\/dist\/assets\/app\.js"[^>]*><\/script>/g,
            '<script type="module" src="/src/main.tsx"></script>'
          );
      },
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [staticRootCompatPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/index.css';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});
