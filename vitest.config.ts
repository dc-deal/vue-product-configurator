import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        // Bootstrap files — no business logic.
        'src/main.ts',
        'src/App.vue',
        // Fixtures / pure-data modules — no behaviour to test.
        'src/data/fixtures.ts',
        'src/data/translations.ts',
        'src/data/types.ts',
        // Vue components — Konzept B.6 specifies store-level tests, not
        // component mounts. Component behaviour is exercised through the
        // store/composable suite + manual browser walkthrough.
        'src/components/**',
        // pdfmake wrapper — pdfmake requires a real browser DOM (Blob,
        // Canvas); jsdom cannot drive it. Verified manually in the
        // checklist instead.
        'src/composables/usePdfExport.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})
