import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { productService } from '../src/services/productService'
import { useConfiguratorStore } from '../src/stores/configurator'
import { useI18n } from '../src/composables/useI18n'
import { useUrlState } from '../src/composables/useUrlState'

// Phase-1 smoke + structure + derived-state tests followed by the 8 mandatory
// tests from concept appendix B.6 and the 4 scenario tests from B.7.

describe('Boilerplate smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset shareable-URL state so selections from prior tests don't leak.
    window.history.replaceState({}, '', '/')
  })

  it('productService returns configuration for known product', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    expect(c.currency).toBe('EUR')
    expect(c.billingCountry).toBe('DE')
    expect(c.vatRate).toBeCloseTo(0.19)
    expect(c.basePriceNet).toBe(35000)
  })

  it('productService throws on unknown product', async () => {
    await expect(productService.loadConfiguration('something-else')).rejects.toThrow()
  })

  it('Pinia store initialises with default state', () => {
    const store = useConfiguratorStore()
    expect(store.currentStep).toBe(0)
    expect(store.currentSelection).toEqual({})
    expect(store.configuration).toBeNull()
  })

  it('useI18n returns fallback marker for missing key', () => {
    const { t } = useI18n('de')
    expect(t('nonexistent.key')).toBe('[missing: nonexistent.key]')
  })

  it('useI18n resolves the german power label', () => {
    const { t } = useI18n('de')
    expect(t('machine.power.kw11')).toBe('11 kW')
    expect(t('machine.power.title')).toBe('Leistungsklasse')
  })
})

describe('Fixture structure', () => {
  it('configuration has all 5 steps (power, control, drive, tool, addon)', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    expect(c.steps.map((s) => s.id)).toEqual(['power', 'control', 'drive', 'tool', 'addon'])
  })

  it('power step has 4 options, each with image URL and available', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    const powerStep = c.steps.find((s) => s.id === 'power')
    expect(powerStep!.options).toHaveLength(4)
    powerStep!.options.forEach((opt) => {
      expect(opt.imageUrl).toBeTruthy()
      expect(opt.availability).toBe('available')
    })
  })

  it('HSK63 tool holder is marked as unavailable', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    const toolStep = c.steps.find((s) => s.id === 'tool')
    const hsk63 = toolStep!.options.find((o) => o.id === 'tool-hsk63')
    expect(hsk63!.availability).toBe('unavailable')
  })

  it('addon step is marked as optional, the others are required', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    const required = c.steps.filter((s) => !s.optional).map((s) => s.id)
    const optional = c.steps.filter((s) => s.optional).map((s) => s.id)
    expect(required).toEqual(['power', 'control', 'drive', 'tool'])
    expect(optional).toEqual(['addon'])
  })

  it('high-perf servo has an allowedWhen rule on power-30kw', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    const driveStep = c.steps.find((s) => s.id === 'drive')
    const highPerf = driveStep!.options.find((o) => o.id === 'drive-highperf-servo')
    expect(highPerf!.allowedWhen).toEqual([{ whenOptionId: 'power', hasValue: 'power-30kw' }])
  })

  it('tool changer has an allowedWhen rule on control-sps-premium', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    const addonStep = c.steps.find((s) => s.id === 'addon')
    const toolChanger = addonStep!.options.find((o) => o.id === 'addon-tool-changer')
    expect(toolChanger!.allowedWhen).toEqual([
      { whenOptionId: 'control', hasValue: 'control-sps-premium' },
    ])
  })
})

describe('Store derived state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset shareable-URL state so selections from prior tests don't leak.
    window.history.replaceState({}, '', '/')
  })

  it('totalPriceNet returns basePriceNet when no selection made', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.totalPriceNet).toBe(35000)
  })

  it('totalPriceNet sums basePriceNet + priceNet of selected options', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-18-5kw') // +5500
    store.select('control', 'control-sps-premium') // +8500
    store.select('addon', 'addon-tool-changer') // +12000
    expect(store.totalPriceNet).toBe(35000 + 5500 + 8500 + 12000)
  })

  it('selectedOptions resolves stepId → ProductOption (or undefined)', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    expect(store.selectedOptions['power']!.id).toBe('power-11kw')
    expect(store.selectedOptions['control']).toBeUndefined()
  })

  it('canGeneratePdf is false until all required steps have a selection', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.canGeneratePdf).toBe(false)
    store.select('power', 'power-11kw')
    store.select('control', 'control-manual')
    store.select('drive', 'drive-belt')
    expect(store.canGeneratePdf).toBe(false) // tool fehlt noch
    store.select('tool', 'tool-hsk40')
    expect(store.canGeneratePdf).toBe(true) // addon ist optional
  })

  it('missingRequiredSteps lists required steps without selection', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    store.select('tool', 'tool-hsk40')
    expect(store.missingRequiredSteps.sort()).toEqual(['control', 'drive'])
  })

  it('addon step does not block PDF generation when left unselected', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-7-5kw')
    store.select('control', 'control-manual')
    store.select('drive', 'drive-belt')
    store.select('tool', 'tool-iso40')
    // addon bewusst nicht gewählt
    expect(store.canGeneratePdf).toBe(true)
    expect(store.missingRequiredSteps).toEqual([])
  })
})

describe('Store navigation actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset shareable-URL state so selections from prior tests don't leak.
    window.history.replaceState({}, '', '/')
  })

  it('goToStep navigates to the given index', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.goToStep(2)
    expect(store.currentStep).toBe(2)
  })

  it('goToStep clamps invalid indices (negative or out-of-bounds)', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.goToStep(-1)
    expect(store.currentStep).toBe(0)
    store.goToStep(999)
    expect(store.currentStep).toBe(0)
  })

  it('nextStep / previousStep navigate by one', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.nextStep()
    expect(store.currentStep).toBe(1)
    store.nextStep()
    store.nextStep()
    expect(store.currentStep).toBe(3)
    store.previousStep()
    expect(store.currentStep).toBe(2)
  })
})

describe('Store select + reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset shareable-URL state so selections from prior tests don't leak.
    window.history.replaceState({}, '', '/')
  })

  it('store loadProduct populates configuration and resets selection', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.configuration).not.toBeNull()
    expect(store.configuration!.steps.length).toBe(5)
    expect(store.currentSelection).toEqual({})
  })

  it('store select records the chosen option per step', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    expect(store.currentSelection['power']).toBe('power-11kw')
  })

  it('store reset clears selection and currentStep', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    store.goToStep(2)
    store.reset()
    expect(store.currentSelection).toEqual({})
    expect(store.currentStep).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Pflicht-Tests (Konzept Anhang B.6) — die 8 spezifizierten Mindest-Tests.
// ─────────────────────────────────────────────────────────────────────────

describe('Pflicht-Tests (Konzept B.6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.history.replaceState({}, '', '/')
  })

  it('B.6 #1 — Fixture laden: loadConfiguration returns 5 steps', async () => {
    const c = await productService.loadConfiguration('machine-tool-xr')
    expect(c.steps).toHaveLength(5)
    expect(c.steps.map((s) => s.id)).toEqual(['power', 'control', 'drive', 'tool', 'addon'])
  })

  it('B.6 #2 — Auswahl treffen: select updates currentSelection', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    const accepted = store.select('power', 'power-11kw')
    expect(accepted).toBe(true)
    expect(store.currentSelection['power']).toBe('power-11kw')
  })

  it('B.6 #3 — Regelwerk positiv: tool-changer allowed when control = SPS Premium', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-sps-premium')
    const accepted = store.select('addon', 'addon-tool-changer')
    expect(accepted).toBe(true)
    expect(store.currentSelection['addon']).toBe('addon-tool-changer')
    expect(store.lastError).toBeNull()
  })

  it('B.6 #4 — Regelwerk negativ: tool-changer rejected when control = Manuell', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-manual')
    const accepted = store.select('addon', 'addon-tool-changer')
    expect(accepted).toBe(false)
    expect(store.currentSelection['addon']).toBeUndefined()
    expect(store.lastError).toBe('errors.ruleConflict')
  })

  it('B.6 #5 — Gesamtpreis Netto: basePriceNet + Σ priceNet', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-30kw') // +9800
    store.select('control', 'control-sps-premium') // +8500
    store.select('drive', 'drive-highperf-servo') // +8000 (rule: power-30kw ✓)
    store.select('tool', 'tool-hsk40') // +0
    store.select('addon', 'addon-tool-changer') // +12000 (rule: SPS Premium ✓)
    expect(store.totalPriceNet).toBe(35000 + 9800 + 8500 + 8000 + 0 + 12000)
  })

  it('B.6 #6 — URL-Kodierung: selections are written to ?k=', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    store.select('control', 'control-manual')
    const k = new URLSearchParams(window.location.search).get('k')
    expect(k).toBe('power:power-11kw,control:control-manual')
  })

  it('B.6 #7 — URL-Dekodierung: ?k= initialises currentSelection', async () => {
    window.history.replaceState(
      {},
      '',
      '/?k=power:power-30kw,control:control-sps-premium,drive:drive-highperf-servo',
    )
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.currentSelection['power']).toBe('power-30kw')
    expect(store.currentSelection['control']).toBe('control-sps-premium')
    expect(store.currentSelection['drive']).toBe('drive-highperf-servo')
  })

  it('B.6 #8 — Unavailable: HSK63 cannot be selected', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    const accepted = store.select('tool', 'tool-hsk63')
    expect(accepted).toBe(false)
    expect(store.currentSelection['tool']).toBeUndefined()
    expect(store.lastError).toBe('errors.optionUnavailable')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Szenario-Tests (Konzept Anhang B.7) — Store-Level-Flows mit
// kombinierten Aktionen. Erwartung pro Szenario: entweder valider
// Gesamtpreis oder gesetzter errors.*-Key.
// ─────────────────────────────────────────────────────────────────────────

describe('Szenario-Tests (Konzept B.7)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.history.replaceState({}, '', '/')
  })

  it('B.7 #1 — Happy Path: full valid selection yields total + no error', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.select('power', 'power-11kw')).toBe(true)
    expect(store.select('control', 'control-sps-premium')).toBe(true)
    expect(store.select('drive', 'drive-servo')).toBe(true)
    expect(store.select('tool', 'tool-hsk40')).toBe(true)
    expect(store.select('addon', 'addon-tool-changer')).toBe(true)
    expect(store.lastError).toBeNull()
    expect(store.canGeneratePdf).toBe(true)
    expect(store.totalPriceNet).toBe(35000 + 2500 + 8500 + 4500 + 0 + 12000)
  })

  it('B.7 #2 — Regel-Verletzung: tool-changer at control=Manuell sets errors.ruleConflict', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-manual')
    const accepted = store.select('addon', 'addon-tool-changer')
    expect(accepted).toBe(false)
    expect(store.currentSelection['addon']).toBeUndefined()
    expect(store.lastError).toBe('errors.ruleConflict')
  })

  it('B.7 #3 — Vergriffen: HSK63 sets errors.optionUnavailable', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    const accepted = store.select('tool', 'tool-hsk63')
    expect(accepted).toBe(false)
    expect(store.currentSelection['tool']).toBeUndefined()
    expect(store.lastError).toBe('errors.optionUnavailable')
  })

  it('B.7 #4 — Pflicht-Schritt fehlt: requestPdfExport sets errors.requiredStepsMissing', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-manual')
    store.select('drive', 'drive-belt')
    store.select('tool', 'tool-hsk40')
    // Power deliberately not selected.
    const accepted = store.requestPdfExport()
    expect(accepted).toBe(false)
    expect(store.canGeneratePdf).toBe(false)
    expect(store.missingRequiredSteps).toEqual(['power'])
    expect(store.lastError).toBe('errors.requiredStepsMissing')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// URL-State Unit-Tests — composable in isolation, without the store.
// ─────────────────────────────────────────────────────────────────────────

describe('Retroactive invalidation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.history.replaceState({}, '', '/')
  })

  it('flags an addon as invalid when its prerequisite is changed away', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-sps-premium')
    store.select('addon', 'addon-tool-changer')
    expect(store.invalidSelectionSteps).toEqual([])
    // Swap the prerequisite — the previously valid addon now violates its rule.
    store.select('control', 'control-sps-standard')
    expect(store.invalidSelectionSteps).toEqual(['addon'])
    expect(store.canGeneratePdf).toBe(false)
  })

  it('requestPdfExport surfaces errors.invalidSelection over requiredStepsMissing', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('power', 'power-11kw')
    store.select('control', 'control-sps-premium')
    store.select('drive', 'drive-belt')
    store.select('tool', 'tool-hsk40')
    store.select('addon', 'addon-tool-changer')
    // All required filled — but now invalidate the addon.
    store.select('control', 'control-manual')
    const accepted = store.requestPdfExport()
    expect(accepted).toBe(false)
    expect(store.lastError).toBe('errors.invalidSelection')
  })

  it('clears invalid state once the conflicting step is corrected', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    store.select('control', 'control-sps-premium')
    store.select('addon', 'addon-tool-changer')
    store.select('control', 'control-manual')
    expect(store.invalidSelectionSteps).toEqual(['addon'])
    // Re-pick a valid addon → invalid flag clears.
    store.select('addon', 'addon-none')
    expect(store.invalidSelectionSteps).toEqual([])
  })
})

describe('URL-Replay positioning', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.history.replaceState({}, '', '/')
  })

  it('lands on first unfilled required step when URL has partial selection', async () => {
    window.history.replaceState({}, '', '/?k=power:power-11kw,control:control-manual')
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    // drive is the first still-missing required step (index 2).
    expect(store.currentStep).toBe(2)
  })

  it('lands on review screen when URL fully satisfies all required steps', async () => {
    window.history.replaceState(
      {},
      '',
      '/?k=power:power-11kw,control:control-manual,drive:drive-belt,tool:tool-hsk40',
    )
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.canGeneratePdf).toBe(true)
    expect(store.currentStep).toBe(store.steps.length) // review = n+1
  })

  it('stays on step 0 when no URL state is present', async () => {
    const store = useConfiguratorStore()
    await store.loadProduct('machine-tool-xr')
    expect(store.currentStep).toBe(0)
  })
})

describe('useUrlState', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('encode produces deterministic order from input map', () => {
    const { encode } = useUrlState()
    expect(encode({ power: 'power-11kw', control: 'control-manual' })).toBe(
      'power:power-11kw,control:control-manual',
    )
    expect(encode({})).toBe('')
  })

  it('read parses ?k= back into a step→option map', () => {
    const { read } = useUrlState()
    expect(read('?k=power:power-11kw,control:control-manual')).toEqual({
      power: 'power-11kw',
      control: 'control-manual',
    })
  })

  it('read silently drops malformed pairs', () => {
    const { read } = useUrlState()
    expect(read('?k=power:power-11kw,broken,:trailing,leading:')).toEqual({
      power: 'power-11kw',
    })
  })

  it('write replaces the ?k= parameter via history.replaceState', () => {
    const { write } = useUrlState()
    write({ power: 'power-11kw' })
    expect(window.location.search).toBe('?k=power%3Apower-11kw')
    write({})
    expect(window.location.search).toBe('')
  })
})
