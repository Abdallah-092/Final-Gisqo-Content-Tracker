
import React, { useState } from 'react';
import { User, AppSettings } from '../types';

interface LoginProps {
  onLogin: (u: User) => void;
  availableUsers: User[];
  settings: AppSettings;
}

const Login: React.FC<LoginProps> = ({ onLogin, availableUsers, settings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      const foundUser = availableUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (foundUser) {
        if (!foundUser.active) {
          setError('This account has been deactivated. Contact admin.');
        } else {
          onLogin(foundUser);
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for modern feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-slate-800/30 p-12 rounded-[3.5rem] border border-slate-700/50 backdrop-blur-3xl animate-in fade-in zoom-in duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] z-10">
        <div className="text-center mb-12">
          {/* Logo Section */}
          <div className="flex items-center justify-center mx-auto mb-10 animate-in slide-in-from-top-4 duration-1000">
            {settings.logo ? (
              <img 
                src={settings.logo} 
                alt="Brand Logo" 
                className="max-h-24 max-w-full w-auto object-contain drop-shadow-2xl" 
              />
            ) : (
              <div className="w-20 h-20 bg-orange-600 rounded-[1.8rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(234,88,12,0.6)]">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">
            {settings.appName || 'GisqoTracker'}
          </h1>
          <p className="text-slate-500 font-bold text-lg">Content Production Control</p>
        </div>

        <form onSubmit={handleFormLogin} className="space-y-6">
          <div className="space-y-2 animate-in slide-in-from-left duration-500 delay-100">
            <input 
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-6 py-5 text-white font-bold transition-all duration-300 shadow-inner placeholder:text-slate-600 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 active:scale-[0.99]"
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-left duration-500 delay-200 relative">
            <input 
              required
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-6 py-5 text-white font-bold transition-all duration-300 shadow-inner placeholder:text-slate-600 pr-14 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 active:scale-[0.99]"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-[50%] -translate-y-[50%] text-slate-500 hover:text-white transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-black text-center uppercase tracking-widest animate-pulse">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-6 rounded-2xl font-black text-white text-xl uppercase tracking-[0.2em] transition-all shadow-2xl shadow-orange-900/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3 ${isSubmitting ? 'bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
