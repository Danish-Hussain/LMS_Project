export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(Number(amount))) return '₹0.00'
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount))
  } catch {
    // Fallback if Intl not available
    const n = Math.round(Number(amount) * 100) / 100
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}
