import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  email: string;
}

export default function OtpVerificationModal({ isOpen, onClose, onVerify, email }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Verify Email</span>
              </h3>
              <button onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-on-surface-variant">
              Enter the 6-digit verification code sent to {email.replace(/(.{2})(.*)(?=@)/, '$1****$3')}
            </p>

            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-bold bg-surface-container-low border border-outline-variant rounded-xl focus:border-primary outline-none"
                />
              ))}
            </div>

            <button
              onClick={() => onVerify(otp.join(''))}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm"
            >
              Verify OTP
            </button>

            <div className="text-center text-xs text-on-surface-variant">
              {timer > 0 ? `Resend code in 00:${timer.toString().padStart(2, '0')}` : <button className="text-primary font-bold">Resend Code</button>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
