
import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { User } from '../types.ts';
import { LOGO_SVG, APP_NAME } from '../constants.tsx';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('Test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const user = await api.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-luxury-cream dark:bg-luxury-black font-sans text-slate-900 dark:text-slate-100">
      <div className="md:w-1/2 bg-gold-600 flex flex-col items-center justify-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 text-center">
          <div className="mb-8 scale-150 flex justify-center text-gold-200">
            {LOGO_SVG}
          </div>
          <h1 className="text-5xl font-serif font-bold mb-4">{APP_NAME}</h1>
          <p className="text-xl font-light opacity-90 max-w-md mx-auto italic">
            "The artistry of fragrance meets the precision of technology."
          </p>
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-serif font-bold mb-2 text-slate-900 dark:text-white">Admin Access</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Please enter your credentials to manage the lab.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 uppercase tracking-wide">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                placeholder="email@essenceflow.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full p-4 bg-gold-600 hover:bg-gold-700 text-white font-bold rounded-xl shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Secure Cloud Access • v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
