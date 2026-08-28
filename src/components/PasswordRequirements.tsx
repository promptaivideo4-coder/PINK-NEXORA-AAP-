import React from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '../lib/passwordValidation';

/**
 * Live checklist showing which of Supabase's mandatory password rules
 * (length, a-z, A-Z, 0-9) the current value already satisfies.
 */
export default function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-[10px] font-semibold transition-colors ${
              met ? 'text-emerald-600' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                met ? 'bg-emerald-500 text-white' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {met ? <Check className="w-2.5 h-2.5" strokeWidth={4} /> : <X className="w-2.5 h-2.5" strokeWidth={4} />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
