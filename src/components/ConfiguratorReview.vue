<script setup lang="ts">
// Review screen: complete configuration overview + PDF download + share link
// (concept §3.5 final step, §3.7 PDF). Rendered by ConfiguratorShell when the
// user navigates past the last configuration step.
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { usePdfExport } from '../composables/usePdfExport'
import { useConfiguratorStore } from '../stores/configurator'

const props = defineProps<{
  language?: 'de' | 'en'
}>()

const lang = computed<'de' | 'en'>(() => props.language ?? 'de')
const { t } = useI18n(lang.value)
const store = useConfiguratorStore()
const { exportPdf } = usePdfExport()

const locale = computed(() => (lang.value === 'de' ? 'de-DE' : 'en-US'))
const formattedTotal = computed(() =>
  store.totalPriceNet.toLocaleString(locale.value, {
    style: 'currency',
    currency: store.configuration?.currency ?? 'EUR',
    maximumFractionDigits: 0,
  }),
)
const formattedBase = computed(() =>
  (store.configuration?.basePriceNet ?? 0).toLocaleString(locale.value, {
    style: 'currency',
    currency: store.configuration?.currency ?? 'EUR',
    maximumFractionDigits: 0,
  }),
)

const status = ref<{ kind: 'success' | 'error'; messageKey: string } | null>(null)
let statusTimeout: ReturnType<typeof setTimeout> | null = null
const isGenerating = ref(false)

function flashStatus(kind: 'success' | 'error', messageKey: string) {
  status.value = { kind, messageKey }
  if (statusTimeout) clearTimeout(statusTimeout)
  statusTimeout = setTimeout(() => {
    status.value = null
  }, 3000)
}

async function downloadPdf() {
  if (!store.requestPdfExport()) {
    flashStatus('error', store.lastError ?? 'ui.review.requiredMissing')
    return
  }
  isGenerating.value = true
  try {
    await exportPdf(lang.value)
  } catch {
    flashStatus('error', 'errors.pdfFailed')
  } finally {
    isGenerating.value = false
  }
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    flashStatus('success', 'ui.review.linkCopied')
  } catch {
    flashStatus('error', 'errors.urlInvalid')
  }
}

function backToEdit() {
  store.goToStep(0)
}
</script>

<template>
  <section class="configurator-review" :aria-labelledby="`review-title`">
    <header class="review-header">
      <h2 id="review-title">{{ t('ui.review.title') }}</h2>
      <p class="review-subtitle">{{ t('ui.review.subtitle') }}</p>
    </header>

    <div class="review-grid">
      <div class="overview">
        <h3 class="overview-heading">{{ t('ui.review.summaryHeading') }}</h3>
        <dl class="overview-list">
          <div class="overview-row overview-row--base">
            <dt>{{ t('ui.summary.basePrice') }}</dt>
            <dd>{{ formattedBase }}</dd>
          </div>
          <div
            v-for="step in store.steps"
            :key="step.id"
            class="overview-row"
            :class="{ 'overview-row--empty': !store.selectedOptions[step.id] }"
          >
            <dt>
              {{ t(step.labelKey) }}
              <small v-if="step.optional" class="overview-optional">{{
                t('ui.summary.optional')
              }}</small>
            </dt>
            <dd v-if="store.selectedOptions[step.id]">
              {{ t(store.selectedOptions[step.id]!.labelKey) }}
              <small v-if="store.selectedOptions[step.id]!.priceNet > 0" class="overview-price"
                >+ {{ store.selectedOptions[step.id]!.priceNet.toLocaleString(locale) }} €</small
              >
            </dd>
            <dd v-else class="overview-empty">{{ t('ui.summary.notSelected') }}</dd>
          </div>
        </dl>

        <div class="total-block" aria-live="polite">
          <span class="total-label">{{ t('ui.summary.total') }}</span>
          <span class="total-value">{{ formattedTotal }}</span>
          <small class="total-vat">{{ t('ui.summary.vatNote') }}</small>
        </div>

        <p class="disclaimer">
          {{ t('ui.summary.disclaimer') }}
        </p>
      </div>

      <aside class="actions">
        <button
          type="button"
          class="action action--primary"
          :class="{ 'is-loading': isGenerating }"
          :disabled="!store.canGeneratePdf || isGenerating"
          :aria-busy="isGenerating"
          @click="downloadPdf"
        >
          <span class="action__icon" aria-hidden="true">
            <span v-if="isGenerating" class="action__spinner"></span>
            <template v-else>⬇</template>
          </span>
          {{ isGenerating ? t('ui.review.pdfGenerating') : t('ui.review.downloadPdf') }}
        </button>
        <button type="button" class="action action--secondary" @click="copyShareLink">
          <span class="action__icon" aria-hidden="true">🔗</span>
          {{ t('ui.review.shareLink') }}
        </button>
        <button type="button" class="action action--ghost" @click="backToEdit">
          ← {{ t('ui.review.backToEdit') }}
        </button>

        <p
          v-if="isGenerating"
          class="status status--pending"
          role="status"
          aria-live="polite"
        >
          {{ t('ui.review.pdfGenerating') }}
        </p>
        <p
          v-else-if="status"
          class="status"
          :class="`status--${status.kind}`"
          role="status"
          aria-live="polite"
        >
          {{ t(status.messageKey) }}
        </p>
        <p
          v-else-if="store.invalidSelectionSteps.length > 0"
          class="status status--error"
          role="alert"
        >
          {{ t('errors.invalidSelection') }}
        </p>
        <p v-else-if="!store.canGeneratePdf" class="status status--hint" role="note">
          {{ t('ui.review.requiredMissing') }}
        </p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.configurator-review {
  display: grid;
  gap: var(--space-3, 1.5rem);
}
.review-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.review-subtitle {
  margin: 0;
  color: var(--mbk-color-text-muted, #6b7280);
}
.review-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .review-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: start;
  }
}

/* ── Overview card ────────────────────────────────────────────────────── */

.overview {
  padding: 1.5rem;
  background: var(--mbk-color-surface, #ffffff);
  border: 1px solid var(--mbk-color-border, #e5e7eb);
  border-radius: var(--mbk-radius-lg, 14px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.06));
}
.overview-heading {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--mbk-color-text-muted, #6b7280);
}
.overview-list {
  margin: 0 0 1rem;
  padding: 0;
}
.overview-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--mbk-color-border, #e5e7eb);
}
.overview-row:last-of-type {
  border-bottom: none;
}
.overview-row dt {
  font-weight: 500;
  color: var(--mbk-color-text, #111827);
}
.overview-row dd {
  margin: 0;
  text-align: right;
  font-weight: 500;
}
.overview-row--base dt,
.overview-row--base dd {
  color: var(--mbk-color-text-muted, #6b7280);
  font-style: italic;
}
.overview-row--empty dd {
  font-style: italic;
  color: #9aa0a6;
  font-weight: 400;
}
.overview-optional {
  color: #9aa0a6;
  font-weight: 400;
  margin-left: 0.25rem;
}
.overview-price {
  display: block;
  color: var(--mbk-color-text-muted, #6b7280);
  font-weight: 400;
  font-size: 0.85rem;
}
.overview-empty {
  font-size: 0.9rem;
}

/* ── Total block ──────────────────────────────────────────────────────── */

.total-block {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--mbk-color-text, #111827);
}
.total-label {
  font-weight: 600;
  font-size: 1.1rem;
}
.total-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--mbk-color-primary, #1d4ed8);
}
.total-vat {
  grid-column: 1 / -1;
  text-align: right;
  color: var(--mbk-color-text-muted, #6b7280);
}
.disclaimer {
  margin: 1rem 0 0;
  color: var(--mbk-color-text-muted, #6b7280);
  font-size: 0.85rem;
  font-style: italic;
}

/* ── Actions column ───────────────────────────────────────────────────── */

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--mbk-color-surface, #ffffff);
  border: 1px solid var(--mbk-color-border, #e5e7eb);
  border-radius: var(--mbk-radius-lg, 14px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.06));
  position: sticky;
  top: 1rem;
}
.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  border-radius: var(--mbk-radius-base, 10px);
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 150ms ease-out,
    border-color 150ms ease-out,
    transform 150ms ease-out;
}
.action:hover:not(:disabled) {
  transform: translateY(-1px);
}
.action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.action--primary {
  background: var(--mbk-color-primary, #1d4ed8);
  color: #ffffff;
  border-color: var(--mbk-color-primary, #1d4ed8);
}
.action--primary:hover:not(:disabled) {
  background: var(--mbk-color-primary-strong, #1e40af);
}
.action--secondary {
  background: var(--mbk-color-primary-soft, #eef2ff);
  color: var(--mbk-color-primary, #1d4ed8);
  border-color: var(--mbk-color-primary-soft, #eef2ff);
}
.action--secondary:hover:not(:disabled) {
  border-color: var(--mbk-color-primary, #1d4ed8);
}
.action--ghost {
  background: transparent;
  color: var(--mbk-color-text-muted, #6b7280);
  border-color: transparent;
  font-weight: 500;
}
.action--ghost:hover:not(:disabled) {
  color: var(--mbk-color-text, #111827);
}
.action__icon {
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action.is-loading:hover:not(:disabled) {
  transform: none;
}
.action.is-loading {
  /* disabled-opacity wirkt schon; aktiver Look bleibt erkennbar */
  opacity: 0.85;
  cursor: progress;
}
.action__spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: action-spinner-rotate 0.7s linear infinite;
}
@keyframes action-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .action__spinner {
    animation-duration: 1.8s;
  }
}
.status {
  margin: 0.25rem 0 0;
  padding: 0.6rem 0.75rem;
  border-radius: var(--mbk-radius-sm, 6px);
  font-size: 0.85rem;
}
.status--success {
  background: rgba(21, 128, 61, 0.1);
  color: var(--mbk-color-success, #15803d);
}
.status--error {
  background: rgba(185, 28, 28, 0.08);
  color: var(--mbk-color-danger, #b91c1c);
}
.status--pending {
  background: var(--mbk-color-primary-soft, #eef2ff);
  color: var(--mbk-color-primary, #1d4ed8);
}
.status--hint {
  background: transparent;
  color: var(--mbk-color-text-muted, #6b7280);
  font-style: italic;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
