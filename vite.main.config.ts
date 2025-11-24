import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	build: {
		rollupOptions: {
			external: ['mysql2', 'mysql2/promise', 'googleapis', 'google-auth-library'],
			output: {
				// Ensure each entry emits a file named after the entry (eg. main.js)
				entryFileNames: '[name].js',
			},
		}
	}
});
