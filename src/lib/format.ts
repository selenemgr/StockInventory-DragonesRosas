export const money = (n: number) => {
  const v = Number(n) || 0
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export const dateTime = (s: string) =>
  new Date(s).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
