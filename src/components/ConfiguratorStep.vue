<script setup lang="ts">
// Single configuration step with selectable options
// (concept §3.5, appendix B.5). Options that are unavailable or whose
// `allowedWhen` rules are unmet given the current selection are rendered
// as disabled cards with a contextual hint (e.g. „Benötigt: SPS Premium").
// The actual selection guard runs in `store.select()`; this component is
// purely the visual gate.
import { computed } from 'vue'
import type { ConfigurationStep, ProductOption } from '../data/types'
import { useI18n } from '../composables/useI18n'
import { useConfiguratorStore } from '../stores/configurator'

const props = defineProps<{
  step: ConfigurationStep
  language?: 'de' | 'en'
}>()

const { t } = useI18n(props.language ?? 'de')
const store = useConfiguratorStore()

function choose(optionId: string) {
  store.select(props.step.id, optionId)
}

function isSelected(optionId: string): boolean {
  return store.currentSelection[props.step.id] === optionId
}

function isUnavailable(option: ProductOption): boolean {
  return option.availability === 'unavailable'
}

function isRuleBlocked(option: ProductOption): boolean {
  if (isUnavailable(option)) return false
  return !store.evaluateRule(option)
}

const requirementHints = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}
  const cfg = store.configuration
  if (!cfg) return result
  for (const option of props.step.options) {
    if (!option.allowedWhen?.length) continue
    const parts: string[] = []
    for (const cond of option.allowedWhen) {
      const refStep = cfg.steps.find((s) => s.id === cond.whenOptionId)
      const refOption = refStep?.options.find((o) => o.id === cond.hasValue)
      parts.push(refOption ? t(refOption.labelKey) : cond.hasValue)
    }
    result[option.id] = `${t('ui.option.requires')}: ${parts.join(' + ')}`
  }
  return result
})
</script>

<template>
  <section class="configurator-step" :aria-labelledby="`step-${step.id}-title`">
    <h2 :id="`step-${step.id}-title`">{{ t(step.labelKey) }}</h2>
    <div class="options-grid">
      <button
        v-for="option in step.options"
        :key="option.id"
        type="button"
        class="option-card"
        :class="{
          'is-selected': isSelected(option.id),
          'is-unavailable': isUnavailable(option),
          'is-rule-blocked': isRuleBlocked(option),
        }"
        :disabled="isUnavailable(option) || isRuleBlocked(option)"
        :aria-pressed="isSelected(option.id)"
        :aria-describedby="isRuleBlocked(option) ? `${option.id}-hint` : undefined"
        @click="choose(option.id)"
      >
        <img
          v-if="option.imageUrl"
          :src="option.imageUrl"
          :alt="t(option.labelKey)"
          class="option-image"
        />
        <span class="option-label">{{ t(option.labelKey) }}</span>

        <small v-if="isUnavailable(option)" class="option-price option-price--unavailable">{{
          t('ui.option.unavailable')
        }}</small>
        <small v-else-if="isRuleBlocked(option)" :id="`${option.id}-hint`" class="option-hint">{{
          requirementHints[option.id]
        }}</small>
        <small v-else-if="option.priceNet > 0" class="option-price"
          >+ {{ option.priceNet.toLocaleString('de-DE') }} €</small
        >
        <small v-else class="option-price option-price--zero">inkl.</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.configurator-step {
  display: grid;
  gap: var(--space-2, 1rem);
}
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}
.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border: 2px solid var(--color-border, #dadce0);
  border-radius: var(--mbk-radius-base, 8px);
  background: var(--mbk-color-surface, #ffffff);
  color: var(--mbk-color-text, #202124);
  cursor: pointer;
  font: inherit;
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;
}
.option-card:hover:not(:disabled) {
  border-color: var(--mbk-color-primary, #1976d2);
}
.option-card.is-selected {
  border-color: var(--mbk-color-primary, #1976d2);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}
.option-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.option-card.is-rule-blocked {
  background: var(--mbk-color-bg, #f7f8fb);
  border-style: dashed;
}
.option-image {
  width: 80px;
  height: 80px;
  color: var(--mbk-color-text, #202124);
}
.option-card.is-unavailable .option-image,
.option-card.is-rule-blocked .option-image {
  filter: grayscale(1);
}
.option-label {
  font-weight: 600;
  text-align: center;
}
.option-price {
  color: var(--color-muted, #5f6368);
  font-size: 0.875rem;
}
.option-price--zero {
  font-style: italic;
}
.option-price--unavailable {
  color: #c62828;
  font-weight: 500;
}
.option-hint {
  color: var(--mbk-color-text-muted, #6b7280);
  font-size: 0.8rem;
  text-align: center;
  font-style: italic;
  line-height: 1.3;
}
</style>
