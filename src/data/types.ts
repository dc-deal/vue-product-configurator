// TypeScript interfaces for the configurator.
// Full specification in docs/konzept.md §3.3.

export type OptionType = 'power' | 'control' | 'drive' | 'tool' | 'addon' | 'service'

export interface RuleCondition {
  whenOptionId: string
  hasValue: string
}

export interface ProductOption {
  id: string
  labelKey: string
  type: OptionType
  priceNet: number
  priceReference?: string
  availability: 'available' | 'unavailable'
  specificationUrl?: string
  helpKey?: string // i18n key for onboarding-tour coachmark text (post v1, see §3.9)
  imageUrl?: string // overlay/preview image URL for product visualization (see §3.11)
  imageZIndex?: number // stacking order in the image layer engine (post v1, see §3.11)
  meta?: Record<string, unknown>
  allowedWhen?: RuleCondition[]
  excludes?: string[]
}

export interface ConfigurationStep {
  id: string
  labelKey: string
  options: ProductOption[]
  helpKey?: string // i18n key for step-level coachmark text (post v1, see §3.9)
  optional?: boolean // default false (= required). PDF generation only allowed if all required steps have a selection (see §3.5).
  selectionMode?: 'single' | 'multiple' // default 'single'; 'multiple' is post v1 (see §3.12)
}

export interface Configuration {
  steps: ConfigurationStep[]
  basePriceNet: number
  currency: 'EUR'
  billingCountry: 'DE'
  vatRate: number
  baseImageUrl?: string // base/body image rendered as layer 0 in the image layer engine (post v1, see §3.11)
}

export type Language = 'de' | 'en'

export interface TranslationEntry {
  id: string
  category: 'ui' | 'error' | 'product' | 'legal'
  de: string
  en: string
  description?: string
}
