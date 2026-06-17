export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatMileage(miles: number): string {
  return new Intl.NumberFormat("en-US").format(miles);
}
