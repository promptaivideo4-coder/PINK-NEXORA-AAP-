import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PASSWORD_MIN_LENGTH, unmetPasswordRules } from '../lib/passwordValidation';
import PasswordRequirements from './PasswordRequirements';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
  /** Live checklist of Supabase's mandatory password rules (a-z, A-Z, 0-9, length). */
  showRules?: boolean;
  error?: string;
}

export default function PasswordField({
  label,
  value,
  onChange,
  showStrength,
  showRules,
  error,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Simple password strength calculation
  const strength = () => {
    let score = 0;
    if (value.length >= PASSWORD_MIN_LENGTH) score++;
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
  const missingRules = unmetPasswordRules(value);

  return (
    <div className="space-y-1 w-full">
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type={isVisible ? 'text' : 'password'}
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 bg-surface border rounded-xl px-4 text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none ${
            error ? 'border-error' : 'border-outline-variant/60'
          }`}
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
      {showRules && <PasswordRequirements value={value} />}
      {error ? (
        <p className="mt-1 text-[10px] font-bold text-error">{error}</p>
      ) : (
        showRules && value.length > 0 && missingRules.length === 0 && (
          <p className="mt-1 text-[10px] font-bold text-emerald-600">Password meets all requirements.</p>
        )
      )}
    </div>
  );
}
