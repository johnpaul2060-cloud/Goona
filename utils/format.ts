export function formatInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, '')
  if (!cleaned) return ''
  return Number(cleaned).toLocaleString('en-NG')
}

export function formatNaira(value: number): string {
  return '\u20A6' + value.toLocaleString('en-NG')
}

export function parseAmount(value: string): number {
  return parseInt(value.replace(/,/g, ''), 10) || 0
}
