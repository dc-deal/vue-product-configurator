<script setup lang="ts">
// Right column: running configuration summary + live price (concept §3.5, §5).
// Shows per step the selected option (or a "noch nicht gewählt" placeholder),
// the live net total, the VAT note, and the disclaimer — all from the i18n
// pool, so the column is automatically bilingual.
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useConfiguratorStore } from '../stores/configurator'

const props = defineProps<{
  language?: 'de' | 'en'
}>()

const { t } = useI18n(props.language ?? 'de')
const store = useConfiguratorStore()

const formattedTotal = computed(() =>
  store.totalPriceNet.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }),
)

const formattedBase = computed(() =>
  (store.configuration?.basePriceNet ?? 0).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }),
)
</script>

<template>
  <div class="configurator-summary">
    <h2>{{ t('ui.summary.title') }}</h2>

    <dl class="summary-list">
      <div class="summary-row summary-row--base">
        <dt>{{ t('ui.summary.basePrice') }}</dt>
        <dd>{{ formattedBase }}</dd>
      </div>

      <div
        v-for="step in store.steps"
        :key="step.id"
        class="summary-row"
        :class="{
          'summary-row--empty': !store.selectedOptions[step.id],
          'summary-row--invalid': store.invalidSelectionSteps.includes(step.id),
        }"
      >
        <dt>
          {{ t(step.labelKey) }}
          <small v-if="step.optional" class="summary-optional">{{
            t('ui.summary.optional')
          }}</small>
        </dt>
        <dd v-if="store.selectedOptions[step.id]">
          {{ t(store.selectedOptions[step.id]!.labelKey) }}
          <small v-if="store.selectedOptions[step.id]!.priceNet > 0" class="summary-price"
            >+ {{ store.selectedOptions[step.id]!.priceNet.toLocaleString('de-DE') }} €</small
          >
          <small v-if="store.invalidSelectionSteps.includes(step.id)" class="summary-invalid-hint"
            >⚠ {{ t('errors.invalidSelection') }}</small
          >
        </dd>
        <dd v-else class="summary-empty">{{ t('ui.summary.notSelected') }}</dd>
      </div>
    </dl>

    <div class="price-block" aria-live="polite">
      <span class="price-label">{{ t('ui.summary.total') }}</span>
      <span class="price-total">{{ formattedTotal }}</span>
      <small class="price-vat">{{ t('ui.summary.vatNote') }}</small>
    </div>

    <p class="disclaimer">
      <small>{{ t('ui.summary.disclaimer') }}</small>
    </p>
  </div>
</template>

<style scoped>
.configurator-summary {
  padding: 1.25rem;
  background: var(--mbk-color-surface, #ffffff);
  border-radius: var(--mbk-radius-base, 8px);
  border: 1px solid var(--color-border, #dadce0);
  position: sticky;
  top: 1rem;
}
.configurator-summary h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}
.summary-list {
  margin: 0 0 1rem;
  padding: 0;
}
.summary-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border, #dadce0);
}
.summary-row:last-child {
  border-bottom: none;
}
.summary-row dt {
  font-weight: 500;
  color: var(--color-muted, #5f6368);
  font-size: 0.9rem;
}
.summary-row dd {
  margin: 0;
  text-align: right;
  font-weight: 500;
}
.summary-row--base dt,
.summary-row--base dd {
  color: var(--color-muted, #5f6368);
  font-style: italic;
}
.summary-row--empty dd {
  font-style: italic;
  color: var(--color-muted, #9aa0a6);
  font-weight: 400;
}
.summary-row--invalid {
  background: rgba(185, 28, 28, 0.06);
  border-radius: var(--mbk-radius-sm, 6px);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-bottom-color: rgba(185, 28, 28, 0.18);
}
.summary-row--invalid dt,
.summary-row--invalid dd {
  color: var(--mbk-color-danger, #b91c1c);
}
.summary-invalid-hint {
  display: block;
  margin-top: 0.25rem;
  color: var(--mbk-color-danger, #b91c1c);
  font-weight: 500;
  font-size: 0.78rem;
  text-align: right;
  white-space: normal;
  line-height: 1.3;
}
.summary-optional {
  color: var(--color-muted, #9aa0a6);
  font-weight: 400;
  margin-left: 0.25rem;
}
.summary-empty {
  font-size: 0.85rem;
}
.summary-price {
  display: block;
  color: var(--color-muted, #5f6368);
  font-weight: 400;
  font-size: 0.85rem;
}
.price-block {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--mbk-color-text, #202124);
}
.price-label {
  font-weight: 600;
  font-size: 1.1rem;
}
.price-total {
  font-size: 1.5rem;
  font-weight: 700;
}
.price-vat {
  grid-column: 1 / -1;
  text-align: right;
  color: var(--color-muted, #5f6368);
}
.disclaimer {
  margin: 0.75rem 0 0;
  color: var(--color-muted, #5f6368);
}
</style>
