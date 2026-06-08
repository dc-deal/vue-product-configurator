import { defineStore } from 'pinia'
import type { Configuration, ConfigurationStep, ProductOption } from '../data/types'
import { productService } from '../services/productService'
import { useUrlState } from '../composables/useUrlState'

// Pinia store for the configurator. Holds the loaded configuration, the user's
// current selection (one option-id per step), the active step index, the
// last UX error key (for i18n lookup), and the derived totals + validation
// flags. The rule engine (`evaluateRule`) enforces `allowedWhen` against the
// current selection (concept §3.4 + appendix B.6 tests #3/#4).
//
// API mirror in concept appendix B.2.
export const useConfiguratorStore = defineStore('configurator', {
  state: () => ({
    configuration: null as Configuration | null,
    currentSelection: {} as Record<string, string>,
    currentStep: 0,
    lastError: null as string | null,
  }),

  getters: {
    /** All configuration steps (or empty array when no configuration loaded). */
    steps(state): ConfigurationStep[] {
      return state.configuration?.steps ?? []
    },

    /** The selected option per step, resolved from currentSelection. */
    selectedOptions(state): Record<string, ProductOption | undefined> {
      const result: Record<string, ProductOption | undefined> = {}
      const steps = state.configuration?.steps ?? []
      for (const step of steps) {
        const selectedId = state.currentSelection[step.id]
        result[step.id] = selectedId ? step.options.find((o) => o.id === selectedId) : undefined
      }
      return result
    },

    /** basePriceNet + Σ priceNet of selected options. Live-updated via reactivity. */
    totalPriceNet(state): number {
      const cfg = state.configuration
      if (!cfg) return 0
      let total = cfg.basePriceNet
      for (const step of cfg.steps) {
        const selectedId = state.currentSelection[step.id]
        if (!selectedId) continue
        const option = step.options.find((o) => o.id === selectedId)
        if (option) total += option.priceNet
      }
      return total
    },

    /** IDs of required steps that still need a selection. */
    missingRequiredSteps(state): string[] {
      const cfg = state.configuration
      if (!cfg) return []
      return cfg.steps
        .filter((step) => !step.optional && !state.currentSelection[step.id])
        .map((step) => step.id)
    },

    /**
     * IDs of steps whose current selection has become invalid — typically
     * because a prerequisite option was changed after the dependent option
     * was picked, or because the option turned unavailable. Independent of
     * `missingRequiredSteps`: a step is either missing OR invalid, not both.
     */
    invalidSelectionSteps(state): string[] {
      const cfg = state.configuration
      if (!cfg) return []
      const result: string[] = []
      for (const step of cfg.steps) {
        const selectedId = state.currentSelection[step.id]
        if (!selectedId) continue
        const option = step.options.find((o) => o.id === selectedId)
        if (!option) {
          result.push(step.id) // option no longer in schema
          continue
        }
        if (option.availability === 'unavailable') {
          result.push(step.id)
          continue
        }
        if (option.allowedWhen?.length) {
          const ok = option.allowedWhen.every(
            (cond) => state.currentSelection[cond.whenOptionId] === cond.hasValue,
          )
          if (!ok) result.push(step.id)
        }
      }
      return result
    },

    /**
     * True iff all required steps have a selection AND no current selection
     * has been invalidated by a later change. Both gates must pass before
     * PDF generation is offered (concept §3.5).
     */
    canGeneratePdf(): boolean {
      return (
        this.configuration !== null &&
        this.missingRequiredSteps.length === 0 &&
        this.invalidSelectionSteps.length === 0
      )
    },
  },

  actions: {
    /**
     * Load the configuration for a product slug via the service layer.
     * After loading, replays the shareable-URL state (concept §3.6 + B.3):
     * selections referenced in `?k=` are applied in step-declaration order,
     * so prerequisites pass the rule engine before dependent options try.
     * Conflicting/unavailable values are silently dropped — only valid
     * selections survive and the URL is rewritten to reflect that.
     */
    async loadProduct(productSlug: string): Promise<void> {
      this.configuration = await productService.loadConfiguration(productSlug)
      this.currentSelection = {}
      this.currentStep = 0
      this.lastError = null
      this.replayUrlState()
    },

    replayUrlState(): void {
      const cfg = this.configuration
      if (!cfg) return
      const urlState = useUrlState()
      const incoming = urlState.read()
      if (Object.keys(incoming).length === 0) return
      let dropped = false
      for (const step of cfg.steps) {
        const optionId = incoming[step.id]
        if (!optionId) continue
        const accepted = this.select(step.id, optionId)
        if (!accepted) dropped = true
      }
      urlState.write(this.currentSelection)
      // Reset the per-call lastError set during replay; surface only the
      // generic banner so the UI doesn't blame a specific step.
      this.lastError = dropped ? 'errors.urlInvalid' : null

      // Land the user where it's useful: review screen if everything's
      // filled, otherwise the first still-unfilled required step.
      if (this.canGeneratePdf) {
        this.currentStep = cfg.steps.length
        return
      }
      const firstMissing = cfg.steps.findIndex(
        (step) => !step.optional && !this.currentSelection[step.id],
      )
      if (firstMissing >= 0) this.currentStep = firstMissing
    },

    /**
     * Record the user's selection for a step. Enforces rule-engine and
     * availability. Returns `true` iff the selection was accepted; `false`
     * iff the option is unavailable or its `allowedWhen` rules are unmet.
     * Sets `lastError` to the matching i18n key on rejection.
     */
    select(stepId: string, optionId: string): boolean {
      const step = this.configuration?.steps.find((s) => s.id === stepId)
      const option = step?.options.find((o) => o.id === optionId)
      if (!step || !option) return false

      if (option.availability === 'unavailable') {
        this.lastError = 'errors.optionUnavailable'
        return false
      }
      if (!this.evaluateRule(option)) {
        this.lastError = 'errors.ruleConflict'
        return false
      }

      this.currentSelection[stepId] = optionId
      this.lastError = null
      useUrlState().write(this.currentSelection)
      return true
    },

    /**
     * Validate that PDF generation is allowed. Returns `true` iff
     * `canGeneratePdf`; otherwise sets `lastError` to the more specific
     * cause — `errors.invalidSelection` if a prior choice has been
     * invalidated, else `errors.requiredStepsMissing`. Called by the
     * review screen before triggering the actual `usePdfExport.exportPdf`.
     */
    requestPdfExport(): boolean {
      if (this.canGeneratePdf) {
        this.lastError = null
        return true
      }
      this.lastError =
        this.invalidSelectionSteps.length > 0
          ? 'errors.invalidSelection'
          : 'errors.requiredStepsMissing'
      return false
    },

    /** Clear the selection (and jump back to the first step). */
    reset(): void {
      this.currentSelection = {}
      this.currentStep = 0
      this.lastError = null
      useUrlState().write({})
    },

    /**
     * Navigate to a step by index (used by progress-bar tabs).
     * Valid range is `[0, steps.length]` — the index equal to `steps.length`
     * represents the review screen (concept §3.5: review = (n+1)th stop).
     */
    goToStep(index: number): void {
      const totalSteps = this.configuration?.steps.length ?? 0
      if (index < 0 || index > totalSteps) return
      this.currentStep = index
    },

    /** Move to the next step if possible. */
    nextStep(): void {
      this.goToStep(this.currentStep + 1)
    },

    /** Move to the previous step if possible. */
    previousStep(): void {
      this.goToStep(this.currentStep - 1)
    },

    /**
     * Rule-engine evaluation for a single option. Returns `true` iff every
     * `allowedWhen` condition matches the current selection. Availability is
     * checked separately in `select` so the UI can still render unavailable
     * options as disabled cards (concept §3.4).
     */
    evaluateRule(option: ProductOption): boolean {
      if (!option.allowedWhen || option.allowedWhen.length === 0) return true
      return option.allowedWhen.every(
        (cond) => this.currentSelection[cond.whenOptionId] === cond.hasValue,
      )
    },
  },
})
