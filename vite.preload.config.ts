import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config

export default defineConfig({
	build: {
		outDir: '.vite/preload',
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, 'src/preload/preload.ts'),
			formats: ['cjs'],
			fileName: () => 'preload.js',
		},
		rollupOptions: {
			output: {
				entryFileNames: '[name].js',
			},
		},
	},
});
