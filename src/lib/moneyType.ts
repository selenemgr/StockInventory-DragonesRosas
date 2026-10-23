export type MoneyType = 'limpio' | 'negro'

export const MONEY_TYPES: Record<MoneyType, { label: string; emoji: string; cls: string }> = {
  limpio: { label: 'Dinero limpio', emoji: '💵', cls: 'clean' },
  negro: { label: 'Dinero negro', emoji: '🖤', cls: 'dark' },
}
