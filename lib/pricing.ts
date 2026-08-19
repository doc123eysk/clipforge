export const PRO_PRICING = {
  monthly: { price: 399, months: 1, discount: 0, label: "1 месяц" },
  quarterly: { price: 1077, months: 3, discount: 10, label: "3 месяца", saveLabel: "-10%" },
  halfyear: { price: 2035, months: 6, discount: 15, label: "6 месяцев", saveLabel: "-15%" },
  yearly: { price: 3352, months: 12, discount: 30, label: "12 месяцев", saveLabel: "-30%" },
} as const;

export type ProTier = keyof typeof PRO_PRICING;

export function getRenewDate(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
