const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

const modalStr = `      {/* Checkout / Billing Modal */}
      <AnimatePresence>
        {checkoutBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-variant/40 bg-surface-container-lowest">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Checkout & Billing</h3>
                  <p className="text-xs font-medium text-on-surface-variant">Process payment for {checkoutBooking.clientName}</p>
                </div>
                <button
                  onClick={() => { setCheckoutBooking(null); setIsInvoiceGenerated(false); }}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isInvoiceGenerated ? (
                <>
                  <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-surface-variant">
                        <div>
                          <p className="font-bold text-on-surface">{checkoutBooking.service}</p>
                          <p className="text-xs text-on-surface-variant">by {checkoutBooking.stylist}</p>
                        </div>
                        <span className="font-bold">{checkoutBooking.price}</span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Discount Code</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="e.g. FESTIVAL10"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-variant bg-surface-bright text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button className="px-4 py-2.5 bg-surface-container text-primary font-bold text-sm rounded-xl">Apply</button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-surface-variant/40">
                        <div className="flex justify-between text-lg font-black pt-2">
                          <span className="text-on-surface">Total Payable (Inclusive of all taxes)</span>
                          <span className="text-primary">{checkoutBooking.price}</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 block">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Cash', 'UPI', 'Card/POS'].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setPaymentMode(mode as 'UPI' | 'Card' | 'Cash')}
                              className={\`py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-1 \${
                                paymentMode === mode || (mode === 'Card/POS' && paymentMode === 'Card')
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                              }\`}
                            >
                              {(paymentMode === mode || (mode === 'Card/POS' && paymentMode === 'Card')) && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {mode}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-on-surface-variant text-center mt-2">UPI includes GPay, PhonePe, Paytm, etc.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-surface-container-lowest border-t border-surface-variant/40 flex gap-3">
                    <button
                      onClick={() => setCheckoutBooking(null)}
                      className="flex-1 py-3 rounded-xl border border-surface-variant font-bold text-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsInvoiceGenerated(true)}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Complete Payment
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface">Payment Successful!</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Invoice has been generated for {checkoutBooking.clientName}.</p>
                  </div>
                  
                  <div className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-4 mt-4 text-left">
                    <p className="text-xs text-on-surface-variant mb-1">Transaction ID: <span className="font-bold text-on-surface">TXN-{Math.floor(Math.random() * 1000000)}</span></p>
                    <p className="text-xs text-on-surface-variant">Amount Paid: <span className="font-bold text-on-surface">{checkoutBooking.price}</span> via {paymentMode === 'Card' ? 'Card/POS' : paymentMode}</p>
                  </div>

                  <div className="flex gap-3 w-full pt-4">
                    <button className="flex-1 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Share Invoice
                    </button>
                    <button
                      onClick={() => { setCheckoutBooking(null); setIsInvoiceGenerated(false); }}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace("{selectedBooking && (", modalStr + "\n      {selectedBooking && (");
content = content.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");

fs.writeFileSync(file, content);
