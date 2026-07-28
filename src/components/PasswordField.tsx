import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
}

export default function PasswordField({ label, value, onChange, showStrength }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Simple password strength calculation
  const strength = () => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return { label: 'Weak', color: 'bg-error' };
    if (score < 3) return { label: 'Fair', color: 'bg-orange-500' };
    if (score < 5) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const currentStrength = getStrengthLabel(strength());

  return (
    <div className="space-y-1 w-full">
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type={isVisible ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-3 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1 mt-2">
            <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className={`h-full ${currentStrength.color}`} style={{ width: `${(strength() / 5) * 100}%` }}></div>
            </div>
            <div className={`text-[10px] font-bold ${currentStrength.color.replace('bg-', 'text-')}`}>
                {currentStrength.label}
            </div>
        </div>
      )}
    </div>
  );
}
