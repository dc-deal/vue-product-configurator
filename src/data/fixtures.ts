import type { Configuration } from './types'

// Inline import of the motor SVG assets. Vite resolves these to hashed URLs at
// build time. The image-layering engine (concept §3.11) will use these per
// selection — in v1 we only show one image per selected option (no stacking).
import motor7_5kw from '../assets/motor-7-5kw.svg'
import motor11kw from '../assets/motor-11kw.svg'
import motor18_5kw from '../assets/motor-18-5kw.svg'
import motor30kw from '../assets/motor-30kw.svg'

// Werkzeugmaschine XR — illustrative fixture (concept §3.3).
// Five configuration steps, two rule patterns, one unavailable option.
export const machineToolXr: Configuration = {
  basePriceNet: 35000,
  currency: 'EUR',
  billingCountry: 'DE',
  vatRate: 0.19,
  steps: [
    // ── Step 1: Power class (required) ─────────────────────────────────────
    {
      id: 'power',
      labelKey: 'machine.power.title',
      options: [
        {
          id: 'power-7-5kw',
          labelKey: 'machine.power.kw7_5',
          type: 'power',
          priceNet: 0,
          availability: 'available',
          imageUrl: motor7_5kw,
          meta: { kw: 7.5 },
        },
        {
          id: 'power-11kw',
          labelKey: 'machine.power.kw11',
          type: 'power',
          priceNet: 2500,
          availability: 'available',
          imageUrl: motor11kw,
          meta: { kw: 11 },
        },
        {
          id: 'power-18-5kw',
          labelKey: 'machine.power.kw18_5',
          type: 'power',
          priceNet: 5500,
          availability: 'available',
          imageUrl: motor18_5kw,
          meta: { kw: 18.5 },
        },
        {
          id: 'power-30kw',
          labelKey: 'machine.power.kw30',
          type: 'power',
          priceNet: 9800,
          availability: 'available',
          imageUrl: motor30kw,
          meta: { kw: 30 },
        },
      ],
    },

    // ── Step 2: Control system (required) ──────────────────────────────────
    {
      id: 'control',
      labelKey: 'machine.control.title',
      options: [
        {
          id: 'control-manual',
          labelKey: 'machine.control.manual',
          type: 'control',
          priceNet: 0,
          availability: 'available',
        },
        {
          id: 'control-sps-standard',
          labelKey: 'machine.control.spsStandard',
          type: 'control',
          priceNet: 3500,
          availability: 'available',
        },
        {
          id: 'control-sps-premium',
          labelKey: 'machine.control.spsPremium',
          type: 'control',
          priceNet: 8500,
          availability: 'available',
        },
      ],
    },

    // ── Step 3: Drive (required, with rule pattern) ────────────────────────
    {
      id: 'drive',
      labelKey: 'machine.drive.title',
      options: [
        {
          id: 'drive-belt',
          labelKey: 'machine.drive.belt',
          type: 'drive',
          priceNet: 0,
          availability: 'available',
        },
        {
          id: 'drive-servo',
          labelKey: 'machine.drive.servo',
          type: 'drive',
          priceNet: 4500,
          availability: 'available',
        },
        {
          id: 'drive-highperf-servo',
          labelKey: 'machine.drive.highPerfServo',
          type: 'drive',
          priceNet: 8000,
          availability: 'available',
          // Demo rule pattern: nur bei höchster Leistungsklasse zulässig
          // (Konzept-Vereinfachung: numerische ">= 18.5 kW"-Regeln bräuchten
          // Schema-Erweiterung; s. §3.10 numerische Inputs post v1)
          allowedWhen: [{ whenOptionId: 'power', hasValue: 'power-30kw' }],
        },
      ],
    },

    // ── Step 4: Tool holder (required, with unavailable option) ────────────
    {
      id: 'tool',
      labelKey: 'machine.tool.title',
      options: [
        {
          id: 'tool-hsk40',
          labelKey: 'machine.tool.hsk40',
          type: 'tool',
          priceNet: 0,
          availability: 'available',
        },
        {
          id: 'tool-hsk63',
          labelKey: 'machine.tool.hsk63',
          type: 'tool',
          priceNet: 1200,
          availability: 'unavailable', // derzeit vergriffen
        },
        {
          id: 'tool-iso40',
          labelKey: 'machine.tool.iso40',
          type: 'tool',
          priceNet: 500,
          availability: 'available',
        },
      ],
    },

    // ── Step 5: Add-on (OPTIONAL, with rule pattern) ───────────────────────
    {
      id: 'addon',
      labelKey: 'machine.addon.title',
      optional: true,
      options: [
        {
          id: 'addon-none',
          labelKey: 'machine.addon.none',
          type: 'addon',
          priceNet: 0,
          availability: 'available',
        },
        {
          id: 'addon-pneumatic-chuck',
          labelKey: 'machine.addon.pneumaticChuck',
          type: 'addon',
          priceNet: 1800,
          availability: 'available',
        },
        {
          id: 'addon-hydraulic-chuck',
          labelKey: 'machine.addon.hydraulicChuck',
          type: 'addon',
          priceNet: 3200,
          availability: 'available',
        },
        {
          id: 'addon-tool-changer',
          labelKey: 'machine.addon.toolChanger',
          type: 'addon',
          priceNet: 12000,
          availability: 'available',
          // Demo rule pattern: Werkzeugwechsler nur bei SPS-Premium-Steuerung
          allowedWhen: [{ whenOptionId: 'control', hasValue: 'control-sps-premium' }],
        },
      ],
    },
  ],
}
