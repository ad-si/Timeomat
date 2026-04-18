import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'source'),
  base: './',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'build'),
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'scripts/timeomat.js',
				chunkFileNames: 'scripts/[name].js',
				assetFileNames: (assetInfo) => {
					if(assetInfo.name && assetInfo.name.endsWith('.css'))
						return 'styles/screen.css';

					return 'assets/[name]-[hash][extname]';
				}
			}
		}
  }
});
