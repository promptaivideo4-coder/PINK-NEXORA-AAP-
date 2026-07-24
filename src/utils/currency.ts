export function getCurrencySymbol(): string {
  const currency = localStorage.getItem('nexora_currency') || 'USD';
  return currency === 'INR' ? '₹' : '$';
}

export function formatPrice(amount: number | string, isBaseInr: boolean = false): string {
  const symbol = getCurrencySymbol();
  const currency = localStorage.getItem('nexora_currency') || 'USD';
  
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
  
  if (isBaseInr) {
    if (currency === 'USD') {
      num = num / 80;
    }
  } else {
    if (currency === 'INR' && num < 2000) {
      num = num * 80;
    }
  }
  
  if (currency === 'INR') {
    return `${symbol}${Math.round(num).toLocaleString('en-IN')}`;
  }
  
  return `${symbol}${num % 1 === 0 ? num.toLocaleString('en-US') : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
