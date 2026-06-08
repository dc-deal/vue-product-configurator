<script setup lang="ts">
// Wrapper component: progress bar + layout, plus the loading state.
// The review screen is rendered as the (n+1)th stop in the same flow —
// no separate route, no extra mode flag. (concept §3.5, appendix B.4-B.5)
import { computed, onMounted } from 'vue'
import { useConfiguratorStore } from '../stores/configurator'
import { useI18n } from '../composables/useI18n'
import ConfiguratorStep from './ConfiguratorStep.vue'
import ConfiguratorSummary from './ConfiguratorSummary.vue'
import ConfiguratorReview from './ConfiguratorReview.vue'

const props = defineProps<{
  product?: string
  language?: 'de' | 'en'
}>()

const store = useConfiguratorStore()
const { t } = useI18n(props.language ?? 'de')

onMounted(async () => {
  if (props.product) {
    await store.loadProduct(props.product)
  }
})

const reviewIndex = computed(() => store.steps.length)
const isReview = computed(() => store.currentStep === reviewIndex.value)
const currentStep = computed(() => store.steps[store.currentStep])
const isFirst = computed(() => store.currentStep === 0)
const isLastConfigStep = computed(() => store.currentStep === store.steps.length - 1)
const nextLabel = computed(() =>
  isLastConfigStep.value ? t('ui.step.toReview') : t('ui.step.next'),
)

function isStepFilled(stepId: string): boolean {
  return Boolean(store.currentSelection[stepId])
}

function isStepInvalid(stepId: string): boolean {
  return store.invalidSelectionSteps.includes(stepId)
}
</script>

<template>
  <div class="configurator-shell">
    <header
      v-if="store.steps.length"
      class="progress-bar"
      role="tablist"
      aria-label="Konfigurationsschritte"
    >
      <button
        v-for="(step, index) in store.steps"
        :key="step.id"
        type="button"
        role="tab"
        class="step-tab"
        :class="{
          'is-active': index === store.currentStep,
          'is-filled': isStepFilled(step.id) && !isStepInvalid(step.id),
          'is-invalid': isStepInvalid(step.id),
          'is-optional': step.optional,
        }"
        :aria-current="index === store.currentStep ? 'step' : undefined"
        :aria-selected="index === store.currentStep"
        @click="store.goToStep(index)"
      >
        <span class="step-tab__index" aria-hidden="true">
          <template v-if="isStepInvalid(step.id)">!</template>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span
          class="step-tab__label"
          :data-text-bold="
            t(step.labelKey) + (step.optional ? ' ' + t('ui.summary.optional') : '')
          "
        >
          <span class="step-tab__label-visible">
            {{ t(step.labelKey) }}
            <small v-if="step.optional" class="step-tab__optional">{{
              t('ui.summary.optional')
            }}</small>
          </span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        class="step-tab step-tab--review"
        :class="{
          'is-active': isReview,
          'is-filled': store.canGeneratePdf,
          'is-invalid': store.invalidSelectionSteps.length > 0,
        }"
        :aria-current="isReview ? 'step' : undefined"
        :aria-selected="isReview"
        @click="store.goToStep(reviewIndex)"
      >
        <span class="step-tab__index" aria-hidden="true">
          <template v-if="store.invalidSelectionSteps.length > 0">!</template>
          <template v-else>✓</template>
        </span>
        <span class="step-tab__label" :data-text-bold="t('ui.review.title')">
          <span class="step-tab__label-visible">{{ t('ui.review.title') }}</span>
        </span>
      </button>
    </header>

    <main class="configurator-layout" :class="{ 'is-review': isReview }">
      <section class="options-column">
        <ConfiguratorReview v-if="isReview" :language="language" />
        <ConfiguratorStep v-else-if="currentStep" :step="currentStep" :language="language" />
        <p v-else class="loading">{{ t('ui.loading') }}</p>

        <nav v-if="currentStep && !isReview" class="step-nav">
          <button
            type="button"
            class="step-nav__btn"
            :disabled="isFirst"
            @click="store.previousStep()"
          >
            ← {{ t('ui.step.previous') }}
          </button>
          <button
            type="button"
            class="step-nav__btn step-nav__btn--primary"
            @click="store.nextStep()"
          >
            {{ nextLabel }} →
          </button>
        </nav>
      </section>

      <aside v-if="!isReview" class="summary-column">
        <ConfiguratorSummary :language="language" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.configurator-shell {
  display: flex;
  flex-direction: column;
  font-family: var(--mbk-font-family, system-ui, sans-serif);
  color: var(--mbk-color-text, #202124);
  gap: var(--space-3, 1.5rem);
}

/* ── Progress bar (step tabs) ──────────────────────────────────────────── */

.progress-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border, #dadce0);
}
.step-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border, #dadce0);
  border-radius: var(--mbk-radius-base, 8px);
  background: var(--mbk-color-surface, #ffffff);
  color: var(--mbk-color-text, #202124);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    border-color 150ms ease-out,
    background 150ms ease-out;
}
.step-tab:hover:not(.is-active) {
  border-color: var(--mbk-color-primary, #1976d2);
}
.step-tab.is-active {
  border-color: var(--mbk-color-primary, #1976d2);
  background: var(--mbk-color-primary, #1976d2);
  color: #ffffff;
  font-weight: 600;
}
.step-tab.is-filled:not(.is-active) {
  background: rgba(25, 118, 210, 0.08);
  border-color: var(--mbk-color-primary, #1976d2);
}
.step-tab.is-invalid:not(.is-active) {
  background: rgba(185, 28, 28, 0.08);
  border-color: var(--mbk-color-danger, #b91c1c);
  color: var(--mbk-color-danger, #b91c1c);
}
.step-tab.is-invalid.is-active {
  background: var(--mbk-color-danger, #b91c1c);
  border-color: var(--mbk-color-danger, #b91c1c);
  color: #ffffff;
}
.step-tab.is-invalid .step-tab__index {
  background: var(--mbk-color-danger, #b91c1c);
  color: #ffffff;
}
.step-tab.is-invalid.is-active .step-tab__index {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.step-tab__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  font-weight: 600;
}
.step-tab.is-active .step-tab__index {
  background: rgba(255, 255, 255, 0.25);
}
/* Reserve the bold-width of the label so toggling font-weight on the active
 * tab doesn't reflow the wrapped progress bar. Visible content and a hidden
 * bold ghost share the same grid cell — the cell sizes to the wider (bold)
 * variant, keeping pill widths constant across active / inactive states. */
.step-tab__label {
  display: inline-grid;
}
.step-tab__label-visible {
  grid-column: 1;
  grid-row: 1;
  white-space: nowrap;
}
.step-tab__label::after {
  content: attr(data-text-bold);
  grid-column: 1;
  grid-row: 1;
  font-weight: 600;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
}
.step-tab__optional {
  color: var(--color-muted, #9aa0a6);
  font-weight: 400;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}
.step-tab.is-active .step-tab__optional {
  color: rgba(255, 255, 255, 0.8);
}
.step-tab--review {
  margin-left: auto;
}
.step-tab--review .step-tab__index {
  background: rgba(21, 128, 61, 0.12);
  color: var(--mbk-color-success, #15803d);
  font-size: 0.85rem;
}
.step-tab--review.is-filled .step-tab__index {
  background: var(--mbk-color-success, #15803d);
  color: #ffffff;
}
.step-tab--review.is-active .step-tab__index {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* ── Layout ────────────────────────────────────────────────────────────── */

.configurator-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .configurator-layout {
    grid-template-columns: minmax(0, 60%) minmax(0, 40%);
  }
  .configurator-layout.is-review {
    grid-template-columns: 1fr;
  }
}
.loading {
  color: var(--color-muted, #5f6368);
  padding: var(--space-3, 1.5rem);
}

/* ── Step navigation ──────────────────────────────────────────────────── */

.step-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.step-nav__btn {
  padding: 0.6rem 1.25rem;
  border: 1px solid var(--color-border, #dadce0);
  border-radius: var(--mbk-radius-base, 8px);
  background: var(--mbk-color-surface, #ffffff);
  color: var(--mbk-color-text, #202124);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 150ms ease-out;
}
.step-nav__btn:hover:not(:disabled) {
  border-color: var(--mbk-color-primary, #1976d2);
}
.step-nav__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.step-nav__btn--primary {
  background: var(--mbk-color-primary, #1976d2);
  color: #ffffff;
  border-color: var(--mbk-color-primary, #1976d2);
}
.step-nav__btn--primary:hover:not(:disabled) {
  filter: brightness(0.95);
}
</style>
