import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset URLs in the built output. This keeps the bundle
  // portable across deployment paths — whether it's served from `/`,
  // `/wp-content/plugins/mbk-configurator/dist/`, or a CDN sub-path, the
  // lazy-loaded chunks (pdfmake, vfs_fonts) resolve correctly relative to
  // the entry script. Required for embedding inside the customer's
  // WordPress site (concept §3.1).
  base: './',
  plugins: [
    vue({
      // Compile every .vue file in custom-element mode so scoped styles are
      // inlined into the Shadow Root of <mbk-configurator>, not the host
      // document <head> (which the Shadow DOM is isolated from).
      customElement: true,
    }),
  ],
})
