import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  let outputDirectory: string;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'version-pwa-service-worker',
        apply: 'build',
        configResolved(config) {
          outputDirectory = path.resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
          const indexPath = path.join(outputDirectory, 'index.html');
          const serviceWorkerPath = path.join(outputDirectory, 'sw.js');
          const [indexHtml, serviceWorker] = await Promise.all([
            readFile(indexPath, 'utf8'),
            readFile(serviceWorkerPath, 'utf8'),
          ]);
          const buildId = createHash('sha256').update(indexHtml).digest('hex').slice(0, 12);
          await writeFile(
            serviceWorkerPath,
            serviceWorker.replaceAll('__PWA_BUILD_ID__', buildId),
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
