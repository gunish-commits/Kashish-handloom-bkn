export function getStockBadge(stock: number, threshold: number = 5) {
  if (stock === 0) {
    return { label: 'Out of Stock', variant: 'red', pulse: false };
  }
  if (stock === 1) {
    return { label: 'Last piece!', variant: 'orange', pulse: true };
  }
  if (stock <= threshold) {
    // Pulse if stock is extremely low (<= 2)
    return { label: `Only ${stock} left!`, variant: 'orange', pulse: stock <= 2 };
  }
  return { label: 'In Stock', variant: 'green', pulse: false };
}
