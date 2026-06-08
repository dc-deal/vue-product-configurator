// Shareable URL state: configuration as `?k=…` parameter, synced via
// `history.replaceState` so we don't pollute the browser history with every
// click (concept §3.6, appendix B.3). Read on mount, write on every
// successful selection.
//
// Format: `?k=stepA:optionA,stepB:optionB` — flat, URL-safe, human-readable.
// Invalid pairs are silently dropped (concept: „ungültige Werte → ignorieren,
// Default-Auswahl behalten").
export function useUrlState() {
  /** Parse the current `?k=` parameter into a `{stepId: optionId}` map. */
  function read(
    search: string = typeof window === 'undefined' ? '' : window.location.search,
  ): Record<string, string> {
    const k = new URLSearchParams(search).get('k')
    if (!k) return {}
    const result: Record<string, string> = {}
    for (const pair of k.split(',')) {
      const sep = pair.indexOf(':')
      if (sep <= 0 || sep === pair.length - 1) continue
      const stepId = pair.slice(0, sep).trim()
      const optionId = pair.slice(sep + 1).trim()
      if (stepId && optionId) result[stepId] = optionId
    }
    return result
  }

  /**
   * Encode a selection map into a `?k=` string (without the leading `?`).
   * Returns an empty string when no selections exist — useful for testing.
   */
  function encode(selection: Record<string, string>): string {
    const entries = Object.entries(selection).filter(([s, o]) => s && o)
    if (entries.length === 0) return ''
    return entries.map(([stepId, optionId]) => `${stepId}:${optionId}`).join(',')
  }

  /** Persist the selection to the current URL via `history.replaceState`. */
  function write(selection: Record<string, string>): void {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const encoded = encode(selection)
    if (encoded === '') url.searchParams.delete('k')
    else url.searchParams.set('k', encoded)
    window.history.replaceState({}, '', url.toString())
  }

  return { read, write, encode }
}
