export function getStockBadge(stock: number, threshold: number = 5) {
  if (stock === 0) {
    return { label: 'Out of Stock', variant: 'red', pulse: false };
  }
  if (stock <= threshold) {
    // Show 'Low Stock' instead of exact count to hide inventory depth
    return { label: 'Low Stock', variant: 'orange', pulse: stock <= 2 };
  }
  return { label: 'In Stock', variant: 'green', pulse: false };
}
