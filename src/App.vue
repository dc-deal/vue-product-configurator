<script setup lang="ts">
import ConfiguratorShell from './components/ConfiguratorShell.vue'

defineProps<{
  product?: string
  language?: 'de' | 'en'
}>()
</script>

<template>
  <ConfiguratorShell :product="product" :language="language" />
</template>

<style>
:host {
  /* Public design tokens — overridable by the host page */
  --mbk-color-primary: #1d4ed8;
  --mbk-color-primary-strong: #1e40af;
  --mbk-color-primary-soft: #eef2ff;
  --mbk-color-surface: #ffffff;
  --mbk-color-bg: #f7f8fb;
  --mbk-color-text: #111827;
  --mbk-color-text-muted: #6b7280;
  --mbk-color-border: #e5e7eb;
  --mbk-color-border-strong: #cbd5e1;
  --mbk-color-success: #15803d;
  --mbk-color-danger: #b91c1c;
  --mbk-font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mbk-radius-sm: 6px;
  --mbk-radius-base: 10px;
  --mbk-radius-lg: 14px;

  /* Internal tokens (not part of the public API) */
  --color-muted: var(--mbk-color-text-muted);
  --color-border: var(--mbk-color-border);
  --color-focus: var(--mbk-color-primary);
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 2.5rem;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 2px 4px rgba(15, 23, 42, 0.05), 0 6px 16px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 4px 8px rgba(15, 23, 42, 0.08), 0 16px 32px rgba(15, 23, 42, 0.1);

  display: block;
  font-family: var(--mbk-font-family);
  color: var(--mbk-color-text);
  background: var(--mbk-color-bg);
  padding: var(--space-3);
  line-height: 1.5;
  box-sizing: border-box;
}

:host * {
  box-sizing: border-box;
}

:host button:focus-visible,
:host [role='tab']:focus-visible {
  outline: 2px solid var(--mbk-color-primary);
  outline-offset: 2px;
}

@media (min-width: 768px) {
  :host {
    padding: var(--space-4);
  }
}
</style>
