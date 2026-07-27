const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add MessageSquare and FileText to imports
content = content.replace("ArrowLeft, X } from 'lucide-react';", "ArrowLeft, X, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';");

// Add state for checkout modal
content = content.replace("const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);", `const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<BookingItem | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);`);

// Update the confirmed bookings actions
const confirmedActionsStr = `<button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors">{t('reschedule')}</button>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">{t('details')}</button>`;

const confirmedActionsNewStr = `<button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors flex justify-center items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp</button>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">{t('details')}</button>`;

content = content.replace(confirmedActionsStr, confirmedActionsNewStr);

// Update In-Progress actions
const inProgressStr = `<button className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-medium hover:opacity-90 transition-colors shadow-xs">{t('checkout')}</button>`;
const inProgressNewStr = `<button onClick={(e) => { e.stopPropagation(); setCheckoutBooking(item); }} className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-medium hover:opacity-90 transition-colors shadow-xs">{t('checkout')}</button>`;
content = content.replace(inProgressStr, inProgressNewStr);

fs.writeFileSync(file, content);
