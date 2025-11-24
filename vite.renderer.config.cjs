// Export an async config that dynamically imports ESM-only plugins (if needed).
// This avoids calling `require()` on packages that are ESM-only (like @vitejs/plugin-vue).
const { defineConfig } = require('vite');

module.exports = async () => {
  let plugins = [];
  try {
    // Dynamic import works for ESM-only packages even from CJS files.
    const mod = await import('@vitejs/plugin-vue');
    const vuePlugin = mod && mod.default ? mod.default : mod;
    if (vuePlugin) plugins.push(vuePlugin());
  } catch (e) {
    // If import fails, we continue with no plugin and log a warning.
    // eslint-disable-next-line no-console
    console.warn('Could not dynamically import @vitejs/plugin-vue; continuing without the plugin', e && e.message);
  }

  return defineConfig({
    base: './',
    plugins,
    build: { sourcemap: false },
    css: { devSourcemap: false },
    optimizeDeps: { force: true, esbuildOptions: { sourcemap: false } },
  });
};
