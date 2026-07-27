export function getCurrencySymbol(): string {
  return '₹';
}

export function formatPrice(amount: number | string, isBaseInr: boolean = false): string {
  const symbol = getCurrencySymbol();
  
  // Remove any currency symbol or commas before parsing
  const cleanStr = String(amount).replace(/[₹$,]/g, '').trim();
  let num = parseFloat(cleanStr);

  if (isNaN(num)) {
    // If it's a range like "From 185" or has other text, just replace the symbol
    if (String(amount).includes('$')) {
      return String(amount).replace('$', symbol);
    }
    if (String(amount).includes('₹')) {
      return String(amount).replace('₹', symbol);
    }
    return `${symbol}${amount}`;
  }
  
  return `${symbol}${Math.round(num).toLocaleString('en-IN')}`;
}
