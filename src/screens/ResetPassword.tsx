import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Flower2 } from 'lucide-react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function ResetPassword({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwords_not_match'));
      return;
    }
    if (password.length < 6) {
      setError(t('password_too_short'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      setSuccess(true);
      
      // Auto-navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate('dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('failed_update_password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-container-lowest">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary-fixed blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-tertiary-fixed blur-[120px] opacity-30"></div>
      </div>

      <main className="w-full max-w-md px-5 relative z-10 mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/85 backdrop-blur-[24px] border border-white/40 shadow-[0px_10px_40px_rgba(0,0,0,0.04),inset_0px_1px_0px_rgba(255,255,255,0.6)] rounded-[24px] p-8 md:p-10 w-full flex flex-col gap-8"
        >
          <header className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-secondary-container text-white flex items-center justify-center shadow-lg mb-2">
              <Flower2 className="w-8 h-8" />
            </div>
            <h1 className="text-[32px] font-bold text-on-surface leading-tight tracking-tight">{t('new_password_title')}</h1>
            <p className="text-base text-on-surface-variant">{t('new_password_desc')}</p>
          </header>

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-on-surface">{t('password_updated')}</h4>
              <p className="text-sm text-on-surface-variant">
                {t('password_updated_desc')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-on-surface-variant ml-1">{t('new_password_title')}</label>
                <div className="relative rounded-[18px] bg-surface-container-low border border-outline-variant/30 focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-fixed-dim">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none focus:ring-0 rounded-[18px] pl-12 pr-12 py-4 text-base text-on-surface outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-on-surface-variant ml-1">{t('confirm_password_label')}</label>
                <div className="relative rounded-[18px] bg-surface-container-low border border-outline-variant/30 focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-fixed-dim">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none focus:ring-0 rounded-[18px] pl-12 pr-4 py-4 text-base text-on-surface outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-primary-container hover:bg-primary text-white text-xl font-semibold py-4 rounded-[18px] transition-all disabled:opacity-50"
              >
                {loading ? t('updating') : t('update_password')}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
