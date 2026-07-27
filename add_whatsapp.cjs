const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

const whatsappFunc = `  const handleWhatsAppReminder = (item: BookingItem) => {
    const message = \`Hello \${item.clientName}! This is a friendly reminder for your appointment at Nexora Salon.\\n\\nService: \${item.service}\\nTime: \${item.time}\\nStylist: \${item.stylist}\\n\\nనమస్కారం! నెక్సోరా సెలూన్లో మీ అపాయింట్మెంట్ గురించి గుర్తు చేస్తున్నాము.\\n\\nWe look forward to seeing you!\`;
    const encodedMessage = encodeURIComponent(message);
    window.open(\`https://wa.me/?text=\${encodedMessage}\`, '_blank');
  };
`;

content = content.replace("const [checkoutBooking, setCheckoutBooking] = useState<BookingItem | null>(null);", whatsappFunc + "\n  const [checkoutBooking, setCheckoutBooking] = useState<BookingItem | null>(null);");

content = content.replace("<button className=\"flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors flex justify-center items-center gap-1\"><MessageSquare className=\"w-3.5 h-3.5 text-emerald-600\" /> WhatsApp</button>", "<button onClick={(e) => { e.stopPropagation(); handleWhatsAppReminder(item); }} className=\"flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors flex justify-center items-center gap-1\"><MessageSquare className=\"w-3.5 h-3.5 text-emerald-600\" /> WhatsApp</button>");

fs.writeFileSync(file, content);
