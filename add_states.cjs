const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = "const [selectedBooking, setSelectedBooking] = useState<null | any>(null);";
const newStates = `const [selectedBooking, setSelectedBooking] = useState<null | any>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<null | BookingItem>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [assignBooking, setAssignBooking] = useState<null | BookingItem>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>('');

  const handleWhatsAppReminder = (item: BookingItem) => {
    const message = \`Hello \${item.clientName}! This is a friendly reminder for your appointment at Nexora Salon.\\n\\nService: \${item.service}\\nTime: \${item.time}\\nStylist: \${item.stylist}\\n\\nनमस्ते! हम आपको नेक्सोरा सैलून में आपकी अपॉइंटमेंट की याद दिला रहे हैं।\\n\\nWe look forward to seeing you!\`;
    const encodedMessage = encodeURIComponent(message);
    window.open(\`https://wa.me/?text=\${encodedMessage}\`, '_blank');
  };
`;

content = content.replace(targetStr, newStates);
fs.writeFileSync(file, content);
