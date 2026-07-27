const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

const stateStr = `  const [assignBooking, setAssignBooking] = useState<BookingItem | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>('');`;

content = content.replace("const [discountCode, setDiscountCode] = useState('');", stateStr + "\n  const [discountCode, setDiscountCode] = useState('');");

const actionStr = `<button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-error hover:bg-error/5 transition-colors">{t('decline')}</button>`;

const newActionStr = `<button onClick={(e) => { e.stopPropagation(); setAssignBooking(item); }} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors">Assign Stylist</button>
                        <button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-error hover:bg-error/5 transition-colors">{t('decline')}</button>`;

content = content.replace(actionStr, newActionStr);

const modalStr = `      {/* Assign Stylist Modal */}
      <AnimatePresence>
        {assignBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-variant/40">
                <h3 className="text-xl font-bold text-on-surface">Assign Stylist</h3>
                <button
                  onClick={() => setAssignBooking(null)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-on-surface-variant mb-4">Assign a stylist for {assignBooking.clientName}'s {assignBooking.service}</p>
                <div className="space-y-2 mb-6">
                  {['Rohan V.', 'Ananya S.', 'Aditi M.'].map((stylist) => (
                    <button
                      key={stylist}
                      onClick={() => setSelectedStylist(stylist)}
                      className={\`w-full py-3 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-between \${
                        selectedStylist === stylist
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant text-on-surface hover:bg-surface-container'
                      }\`}
                    >
                      <span>{stylist}</span>
                      {selectedStylist === stylist && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    // Simulated assignment
                    setAssignBooking(null);
                    setSelectedStylist('');
                  }}
                  disabled={!selectedStylist}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace("{/* Checkout / Billing Modal */}", modalStr + "\n      {/* Checkout / Billing Modal */}");

fs.writeFileSync(file, content);
