import { themeQuartz } from 'ag-grid-community'

/**
 * AG Grid theme wired to the app's CSS tokens (src/index.css), so light and dark follow
 * the page. VERIFY: parameter names are from the v33+ Theming API.
 */
export const gridTheme = themeQuartz.withParams({
  backgroundColor: 'var(--surface)',
  foregroundColor: 'var(--ink)',
  borderColor: 'var(--line)',
  headerBackgroundColor: 'var(--surface-2)',
  headerTextColor: 'var(--muted)',
  rowHoverColor: 'var(--hover)',
  accentColor: 'var(--accent)',
  fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
  fontSize: 14,
  headerFontSize: 12,
  headerFontWeight: 600,
  cellHorizontalPadding: 16,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
})
