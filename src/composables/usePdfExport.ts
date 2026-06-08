import type { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces'
import type { Language } from '../data/types'
import { useI18n } from './useI18n'
import { useConfiguratorStore } from '../stores/configurator'

// pdfmake wrapper for the configuration PDF (concept §3.7).
// Generation runs entirely client-side — no data leaves the device (concept
// §3.7 DSGVO). pdfmake + Roboto-VFS are lazy-loaded to keep the initial bundle
// small (pdfmake is ~700 kB minified).
export function usePdfExport() {
  async function exportPdf(language: Language = 'de'): Promise<void> {
    const store = useConfiguratorStore()
    const cfg = store.configuration
    if (!cfg) return

    const { t } = useI18n(language)
    const locale = language === 'de' ? 'de-DE' : 'en-US'
    const formatPrice = (value: number): string =>
      value.toLocaleString(locale, {
        style: 'currency',
        currency: cfg.currency,
        maximumFractionDigits: 0,
      })

    const tableBody: TableCell[][] = [
      [
        { text: t('pdf.step'), bold: true },
        { text: t('pdf.selection'), bold: true },
        { text: t('pdf.priceNet'), bold: true, alignment: 'right' },
      ],
    ]
    for (const step of store.steps) {
      const opt = store.selectedOptions[step.id]
      const label = step.optional
        ? `${t(step.labelKey)} ${t('ui.summary.optional')}`
        : t(step.labelKey)
      if (!opt) {
        tableBody.push([
          label,
          { text: t('pdf.notSelected'), italics: true, color: '#9aa0a6' },
          { text: '—', alignment: 'right' },
        ])
      } else {
        tableBody.push([
          label,
          t(opt.labelKey),
          {
            text: opt.priceNet > 0 ? `+ ${formatPrice(opt.priceNet)}` : t('ui.summary.basePrice'),
            alignment: 'right',
          },
        ])
      }
    }

    const docDefinition: TDocumentDefinitions = {
      info: {
        title: t('pdf.title'),
        author: 'Maschinenbau-Konfigurator',
        creator: 'Maschinenbau-Konfigurator',
      },
      pageSize: 'A4',
      pageMargins: [48, 56, 48, 64],
      defaultStyle: { font: 'Roboto', fontSize: 10, color: '#111827' },
      content: [
        { text: t('pdf.title'), style: 'h1' },
        {
          text: `${t('pdf.dateLabel')}: ${new Date().toLocaleDateString(locale)}`,
          style: 'meta',
          margin: [0, 0, 0, 16],
        },
        {
          style: 'tableBlock',
          table: { headerRows: 1, widths: ['*', '*', 'auto'], body: tableBody },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
            vLineWidth: () => 0,
            hLineColor: () => '#cbd5e1',
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
        {
          columns: [
            { text: t('pdf.basePrice'), style: 'totalLabel' },
            {
              text: formatPrice(cfg.basePriceNet),
              style: 'totalValue',
              alignment: 'right',
            },
          ],
          margin: [0, 8, 0, 0],
        },
        {
          columns: [
            { text: t('pdf.total'), style: 'grandTotalLabel' },
            {
              text: formatPrice(store.totalPriceNet),
              style: 'grandTotalValue',
              alignment: 'right',
            },
          ],
          margin: [0, 12, 0, 4],
        },
        { text: t('ui.summary.vatNote'), style: 'meta', alignment: 'right' },
        {
          text: t('ui.summary.disclaimer'),
          style: 'note',
          italics: true,
          margin: [0, 16, 0, 0],
        },
        { text: t('pdf.requestNote'), style: 'note', italics: true, margin: [0, 6, 0, 0] },
        {
          text: `${t('pdf.configurationUrl')}:`,
          style: 'meta',
          margin: [0, 20, 0, 2],
        },
        { text: window.location.href, style: 'url' },
      ],
      styles: {
        h1: { fontSize: 20, bold: true, color: '#111827', margin: [0, 0, 0, 4] },
        meta: { fontSize: 9, color: '#6b7280' },
        tableBlock: { margin: [0, 0, 0, 4] },
        totalLabel: { fontSize: 10, color: '#6b7280' },
        totalValue: { fontSize: 10, color: '#6b7280' },
        grandTotalLabel: { fontSize: 14, bold: true, color: '#111827' },
        grandTotalValue: { fontSize: 14, bold: true, color: '#111827' },
        note: { fontSize: 9, color: '#6b7280' },
        url: { fontSize: 8, color: '#1d4ed8' },
      },
    }

    const [pdfModule, vfsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ])
    // pdfmake 0.3.x ships as a CJS UMD bundle; under Vite the actual mutable
    // pdfMake instance (a `browser_extensions_pdfmake` class instance) lives
    // on `.default`. Its `addVirtualFileSystem(vfs)` method iterates the
    // entries and writes each font into pdfmake's internal singleton VFS
    // (`new VirtualFileSystem()` in pdfmake.js) — assigning `pdfMake.vfs`
    // directly does NOT reach that singleton, which is why `createPdf`
    // would otherwise fail with „Roboto-Medium.ttf not found".
    type PdfApi = {
      addVirtualFileSystem: (vfs: Record<string, string>) => void
      createPdf: (def: TDocumentDefinitions) => {
        // pdfmake 0.3.x: getBlob is the canonical async API — returns a real
        // Promise<Blob>. The high-level `download()` wrapper internally uses
        // FileSaver, which on some browsers triggers `window.open(blob)`
        // (opens in a new tab) instead of a real download, and also discards
        // any callback argument — so we bypass it and trigger the download
        // ourselves with an <a download> element below.
        getBlob: () => Promise<Blob>
      }
    }
    const pdfMake =
      (pdfModule as unknown as { default?: PdfApi }).default ?? (pdfModule as unknown as PdfApi)
    const vfsData =
      (vfsModule as unknown as { default?: Record<string, string> }).default ??
      (vfsModule as unknown as Record<string, string>)
    pdfMake.addVirtualFileSystem(vfsData)

    const blob = await pdfMake.createPdf(docDefinition).getBlob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = t('pdf.filename')
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return { exportPdf }
}
