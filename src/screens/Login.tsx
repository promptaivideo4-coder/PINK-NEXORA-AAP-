import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower2, Mail, Lock, Eye, EyeOff, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';

export default function Login({ navigate }: NavigationProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        navigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) throw resetError;
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-container-lowest">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary-fixed blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-tertiary-fixed blur-[120px] opacity-30"></div>
      </div>

      <main className="w-full max-w-md px-5 relative z-10 mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/85 backdrop-blur-[24px] border border-white/40 shadow-[0px_10px_40px_rgba(0,0,0,0.04),inset_0px_1px_0px_rgba(255,255,255,0.6)] rounded-[24px] p-8 md:p-10 w-full flex flex-col gap-8"
        >
          {/* Header */}
          <header className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-secondary-container text-white flex items-center justify-center shadow-lg shadow-primary-container/20 mb-2">
              <Flower2 className="w-8 h-8" />
            </div>
            <h1 className="text-[32px] font-bold text-on-surface leading-tight tracking-tight">Login to Nexora</h1>
            <p className="text-base text-on-surface-variant">Manage your luxury salon with ease.</p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-2 group">
              <label className="text-[13px] font-medium text-on-surface-variant ml-1">Email Address</label>
              <div className="relative rounded-[18px] bg-surface-container-low border border-outline-variant/30 transition-all duration-300 focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-fixed-dim">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@yoursalon.com"
                  className="w-full bg-transparent border-none focus:ring-0 rounded-[18px] pl-12 pr-4 py-4 text-base text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[13px] font-medium text-on-surface-variant">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)}
                  className="text-[13px] font-medium text-primary-container hover:text-primary transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-[18px] bg-surface-container-low border border-outline-variant/30 transition-all duration-300 focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-fixed-dim">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none focus:ring-0 rounded-[18px] pl-12 pr-12 py-4 text-base text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors focus:outline-none"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center mt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 rounded-[6px] border border-outline-variant peer-checked:bg-primary-container peer-checked:border-primary-container transition-colors flex items-center justify-center bg-surface-container-lowest">
                    <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-base text-on-surface-variant group-hover:text-on-surface transition-colors">Remember Me</span>
              </label>
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-primary-container hover:bg-primary text-white text-xl font-semibold py-4 rounded-[18px] shadow-[0_8px_24px_rgba(230,0,126,0.25)] hover:shadow-[0_12px_32px_rgba(230,0,126,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Sign Up Prompt */}
          <div className="text-center mt-4">
            <p className="text-base text-on-surface-variant">
              Don't have an account?{' '}
              <button onClick={() => navigate('register-stepper')} className="text-primary-container font-semibold hover:text-primary transition-colors">Request Access</button>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Desktop Contextual Image */}
      <div 
        className="hidden lg:block absolute right-0 top-0 w-1/2 h-full z-0 opacity-80 bg-cover bg-center"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQ26zAVvRda8RomS1yC6KjU2xpsNoCSfEHjLx8e-P41mg6Zt_VxvmL40xYUUU1uufouum5nsemf2_i-SNTM7VujKkktaHINki_1abigLrGyGpQCaDz0eZyxTfLDhywEbBfrj73otmRKgnB8zk6otzDk1_k1DC7TG2yvYYI_e-vLkcAMT_YXxbGBw81tsvabcv35XtIz2-vDR9eB2vIQlxIAwO4a7eOserwTbVDDaiTPNFnT89wDFB0L0pKdvfJ5OLLZuk_lCEgM1s')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-on-surface">Reset Password</h3>
                <button 
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!forgotSuccess ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-on-surface-variant">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-12 px-4 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-12 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-on-surface">Email Sent!</h4>
                  <p className="text-sm text-on-surface-variant">
                    Check your inbox for instructions on how to reset your password.
                  </p>
                  <button 
                    onClick={() => setShowForgotModal(false)}
                    className="w-full h-12 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
