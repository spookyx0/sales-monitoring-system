import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Package, DollarSign, TrendingUp, AlertTriangle, Users, LogOut, Menu, X, Plus, Edit, Trash2, Search, Calendar, ShoppingCart, Minus, FileText, CheckCircle, XCircle, Loader2, Bell, RefreshCw, ChevronsUpDown, ChevronUp, ChevronDown, ArrowUp, ArrowDown, RotateCw, User, Lock, Mail, MessageSquare, Send, Building, Target, Linkedin, Github, Instagram, Facebook, KeyRound, Printer, Download, Sun, Moon } from 'lucide-react';
import api from './api';

const StatusContext = React.createContext();

function App() {
  const [auth, setAuth] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [publicPage, setPublicPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ isOpen: false, type: '', message: '' });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  
  const showStatus = useCallback((type, message) => {
    setStatus({ isOpen: true, type, message });
  }, []);

  const closeStatus = () => {
    setStatus({ isOpen: false, type: '', message: '' });
  };

  useEffect(() => {
    if (status.isOpen) {
      const timer = setTimeout(() => closeStatus(), 3000);
      return () => clearTimeout(timer);
    }
  }, [status.isOpen]); // useCallback for closeStatus is not needed here

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle routing for public pages like /reset-password?token=...
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setPublicPage('reset-password');
    }
  }, []);

  const handlePublicNavigate = (page) => {
    setPublicPage(page);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const admin = await api.getMe();
        if (admin) {
          setAuth({ admin });
        }
      } catch (error) {
        console.error("Auth check failed", error);
        api.logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      // This is a mock implementation. Ideally, this would be a single API call.
      const { items } = await api.getItems({ limit: 1000 });
      const lowStockNotifications = items
        .filter(item => item.qty_in_stock <= item.reorder_level)
        .map(item => ({
          id: `low-stock-${item.item_id}`,
          message: `${item.name} is low on stock (${item.qty_in_stock} left).`,
          type: 'low_stock',
          read: false,
          createdAt: new Date().toISOString(),
        }));
      setNotifications(lowStockNotifications);
    } catch (error) { console.error("Failed to fetch notifications", error); }
  }, []);

  const handleLogin = (authData) => {
    setAuth(authData);
  };

  const handleLogout = () => {
    api.logout();
    setAuth(null);
  };

  const handleRefresh = () => {
    fetchNotifications();
    setRefreshKey(prevKey => prevKey + 1);
    setLastRefreshed(new Date());
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (auth) fetchNotifications();
  }, [auth, fetchNotifications]);

  return (
    <StatusContext.Provider value={showStatus}>
      {loading ? (
        <div className="flex h-screen items-center justify-center">Loading...</div>
      ) : !auth ? (
        publicPage === 'login' ? (
          <LoginPage onLogin={handleLogin} onNavigate={handlePublicNavigate} />
        ) : publicPage === 'contact' ? (
          <ContactPage onNavigate={handlePublicNavigate} />
        ) : publicPage === 'reset-password' ? (
          <ResetPasswordPage onNavigate={handlePublicNavigate} />
        ) : publicPage === 'about' ? (
          <AboutPage onNavigate={setPublicPage} />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigate={setPublicPage} />
        )
      ) : (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar open={sidebarOpen} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar 
              user={auth.admin} 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
              theme={theme}
              onToggleTheme={toggleTheme}
              notifications={notifications} 
              setNotifications={setNotifications} 
              onNavigate={handleNavigate}
              onRefresh={handleRefresh}
              lastRefreshed={lastRefreshed} />
            
            <main className="flex-1 overflow-y-auto p-6">
              {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />}
              {currentPage === 'inventory' && <Inventory setNotifications={setNotifications} user={auth.admin} refreshKey={refreshKey} />}
              {currentPage === 'sales' && <Sales setNotifications={setNotifications} user={auth.admin} refreshKey={refreshKey} />}
              {currentPage === 'analytics' && <Analytics refreshKey={refreshKey} />}
              {currentPage === 'audits' && <Audits refreshKey={refreshKey} />}
              {currentPage === 'expenses' && <Expenses setNotifications={setNotifications} user={auth.admin} refreshKey={refreshKey} />}
            </main>
          </div>
          {status.isOpen && <StatusModal type={status.type} message={status.message} onClose={closeStatus} />}
        </div>
      )}
    </StatusContext.Provider>
  );
}

function PublicNav({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'about', label: 'ABOUT' },
    { id: 'contact', label: 'CONTACT' },
    { id: 'login', label: 'SIGN IN' },
  ];

  const baseLinkClasses = "transition-colors text-sm tracking-wide";
  const activeLinkClasses = "bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all";
  const inactiveLinkClasses = "text-white hover:text-cyan-400 font-light";

  return (
    <>
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 animate-in fade-in-0 slide-in-from-top-5 duration-700">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('login')}>
          <BarChart3 className="w-8 h-8 text-cyan-400" />
          <span className="text-white font-semibold text-xl tracking-wider">
            Sales Monitoring
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map(item => (
            <a
              key={item.id}
              href="#!"
              onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
              className={`${baseLinkClasses} ${activePage === item.id ? activeLinkClasses : inactiveLinkClasses}`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-indigo-950/95 backdrop-blur-lg z-20 p-6 space-y-4">
          {navItems.map(item => (
             <a key={item.id} href="#!" onClick={(e) => { e.preventDefault(); onNavigate(item.id); setMobileMenuOpen(false); }} className={`block text-center p-2 rounded-full ${baseLinkClasses} ${activePage === item.id ? 'bg-cyan-500 text-white' : 'text-white'}`}>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function LoginPage({ onLogin, onNavigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const showStatus = React.useContext(StatusContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const authData = await api.login(username, password);
      setIsFadingOut(true);
      setTimeout(() => {
        onLogin(authData);
      }, 700); // Duration should match the animation
    } catch (err) {
      console.error(err);
      showStatus('error', err.message || 'Login failed. Please check your credentials.');
      setError(true);
      setTimeout(() => setError(false), 500);
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden transition-opacity duration-700 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated background blur effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <PublicNav activePage="login" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-x-20 px-6 md:px-12 py-12 md:py-0 min-h-[calc(100vh-100px)]">
        {/* Login Form - Added slide-in animation */}
        <div className="w-full md:w-auto mb-12 md:mb-0 animate-in fade-in-0 slide-in-from-left-10 duration-1000">
          <div className={`bg-indigo-950/40 backdrop-blur-xl rounded-3xl p-8 md:p-10 w-full md:w-96 border border-indigo-800/30 shadow-2xl ${error ? 'animate-shake' : ''}`}>
            <div className="flex justify-center mb-8 animate-in fade-in-0 zoom-in-90 duration-500 delay-300">
              <div className="w-20 h-20 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-indigo-900/50">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="relative animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-400">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Password Input */}
              <div className="relative animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-500">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all text-sm tracking-wider disabled:opacity-50"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs animate-in fade-in-0 duration-500 delay-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-indigo-700 bg-indigo-900/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-indigo-950"
                  />
                  <span className="text-gray-300">Remember me</span>
                </label>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="w-full md:w-auto text-center md:text-left md:ml-20">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-in fade-in-0 slide-in-from-right-10 duration-1000">
            Monitor Your Sales,<br />
            Boost Your Success.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-md mb-8 animate-in fade-in-0 slide-in-from-right-10 duration-1000 delay-300">
            Sign in to access your dashboard and gain valuable insights into your business performance.
          </p>
        </div>
      </div>
    </div>
    {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </>
  );
}

function ContactPage({ onNavigate }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showStatus = React.useContext(StatusContext);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      // In a real app, you would have an API endpoint for this.
      // await api.sendContactEmail(form); 
      await new Promise(resolve => setTimeout(resolve, 1500)); // Mock API call
      showStatus('success', "Your message has been sent! We'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      showStatus('error', err.message || 'Failed to send message. Please try again later.');
      setError(true);
      setTimeout(() => setError(false), 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
      {/* Animated background blur effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <PublicNav activePage="contact" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 md:px-12 py-12 md:py-0 min-h-[calc(100vh-100px)]">
        <div className="w-full md:w-auto text-center mb-12 animate-in fade-in-0 slide-in-from-top-10 duration-1000">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Get In Touch
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto">
            Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="w-full md:w-auto mb-12 md:mb-0 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000">
          <div className={`bg-indigo-950/40 backdrop-blur-xl rounded-3xl p-8 md:p-10 w-full max-w-lg border border-indigo-800/30 shadow-2xl ${error ? 'animate-shake' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text" name="name" placeholder="YOUR NAME" value={form.name} onChange={handleChange} required
                    className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                {/* Email Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email" name="email" placeholder="YOUR EMAIL" value={form.email} onChange={handleChange} required
                    className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Message Textarea */}
              <div className="relative">
                <div className="absolute left-4 top-4 text-gray-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  name="message" placeholder="YOUR MESSAGE" value={form.message} onChange={handleChange} required rows="5"
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-2xl px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all text-sm tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SENDING...
                  </>
                ) : (
                  <>
                    SEND MESSAGE <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const showStatus = React.useContext(StatusContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // For security, we show the same success state even if the API fails.
      // This prevents attackers from checking which emails are registered.
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-in fade-in-0">
      <div className="relative bg-indigo-950/60 backdrop-blur-xl rounded-3xl p-8 md:p-10 w-full max-w-md border border-indigo-800/30 shadow-2xl animate-in fade-in-0 zoom-in-95 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-indigo-900/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        {submitted ? (
          <div>
            <CheckCircle className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
            <h2 className="text-3xl font-bold text-white">Check Your Email</h2>
            <p className="text-gray-300 mt-4">
              If an account with that email exists, a password reset link has been sent. Please check your inbox (and spam folder).
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm tracking-wider"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Forgot Password?</h2>
              <p className="text-gray-300 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all text-sm tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> SENDING...</>
                ) : (
                  <>SEND RESET LINK <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const showStatus = React.useContext(StatusContext);
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showStatus('error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showStatus('error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(false);
    try {
      await api.resetPassword(token, password);
      showStatus('success', 'Your password has been reset successfully! You can now log in.');
      // Redirect to login page by removing token from URL and navigating
      window.history.pushState({}, '', window.location.pathname);
      onNavigate('login');
    } catch (err) {
      console.error(err);
      showStatus('error', err.message || 'Failed to reset password. The link may be invalid or expired.');
      setError(true);
      setTimeout(() => setError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <PublicNav activePage="" onNavigate={onNavigate} />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-100px)]">
        <div className="w-full md:w-auto animate-in fade-in-0 slide-in-from-bottom-10 duration-1000">
          <div className={`bg-indigo-950/40 backdrop-blur-xl rounded-3xl p-8 md:p-10 w-full max-w-md border border-indigo-800/30 shadow-2xl ${error ? 'animate-shake' : ''}`}>
            <div className="text-center mb-8">
              <KeyRound className="w-12 h-12 mx-auto text-cyan-400 mb-4" />
              <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
              <p className="text-gray-300 mt-2">Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" placeholder="NEW PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" placeholder="CONFIRM NEW PASSWORD" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className="w-full bg-indigo-900/50 border border-indigo-700/50 rounded-full px-12 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all text-sm tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> UPDATING...</>
                ) : (
                  'RESET PASSWORD'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage({ onNavigate }) {
  const developer = {
    name: 'Quinnreeve Lobos',
    role: 'Full-Stack Developer & UI/UX Designer',
    bio: 'The sole architect and designer of this system. Passionate about creating efficient, elegant, and user-friendly solutions from the ground up. Feel free to connect!',
    avatar: '/avatar.jpg', // Make sure to place your image file in the `public` directory
    socials: { 
      linkedin: 'https://www.linkedin.com/in/quinnreeve-lobos/', 
      github: 'https://github.com/spookyx0', 
      instagram: 'https://www.instagram.com/kennwithahoodie/', 
      facebook: 'https://www.facebook.com/lil.kenkernel1/' 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden text-white">
      {/* Animated background blur effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <PublicNav activePage="about" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center animate-in fade-in-0 slide-in-from-top-10 duration-1000">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">About Sales Monitoring</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            An innovative platform designed to provide real-time insights and analytics for your business, empowering you to make data-driven decisions.
          </p>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-12 mt-24">
          {/* Left Column: Mission & Vision */}
          <div className="space-y-12 text-center md:text-left">
            <div className="animate-in fade-in-0 slide-in-from-left-20 duration-1000 delay-200">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Building className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-gray-300 leading-relaxed max-w-lg mx-auto md:mx-0">
                To simplify sales tracking and provide powerful, accessible analytics for businesses of all sizes. We believe that every business deserves the tools to understand their performance and unlock their full potential.
              </p>
            </div>
            <div className="animate-in fade-in-0 slide-in-from-left-20 duration-1000 delay-300">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Target className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-gray-300 leading-relaxed max-w-lg mx-auto md:mx-0">
                To become the leading platform for sales analytics, known for our commitment to user-centric design, data accuracy, and continuous innovation that helps our clients thrive in a competitive marketplace.
              </p>
            </div>
            {/* Social Links */}
            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-400 pt-4">
              <h3 className="text-lg font-semibold text-center md:text-left mb-4 text-cyan-400">Connect with me</h3>
              <div className="flex justify-center md:justify-start gap-6">
                <a href={developer.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" aria-label="LinkedIn"><Linkedin className="w-7 h-7" /></a>
                <a href={developer.socials.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" aria-label="GitHub"><Github className="w-7 h-7" /></a>
                <a href={developer.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" aria-label="Instagram"><Instagram className="w-7 h-7" /></a>
                <a href={developer.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:scale-110 transition-all" aria-label="Facebook"><Facebook className="w-7 h-7" /></a>
              </div>
            </div>
          </div>

          {/* Right Column: Developer Card */}
          <div className="flex flex-col items-center md:items-start md:ml-24">
            <h2 className="text-4xl font-bold text-center md:text-left mb-8 animate-in fade-in-0 duration-1000 delay-400">Meet the Developer</h2>
            <div className="animate-in fade-in-0 zoom-in-90 duration-1000 delay-500 w-full max-w-sm bg-indigo-950/40 backdrop-blur-xl rounded-2xl border border-indigo-800/30 p-8 text-center group hover:border-cyan-400/50 transition-all">
              <img src={developer.avatar} alt={developer.name} className="w-32 h-32 rounded-full border-4 border-cyan-400 mb-6 mx-auto transition-transform duration-300 group-hover:scale-105" />
              <h3 className="text-2xl font-bold">{developer.name}</h3>
              <p className="text-cyan-400 font-medium mb-4">{developer.role}</p>
              <p className="text-gray-300 text-sm">{developer.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ open, currentPage, onNavigate, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audits', label: 'Audits', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: AlertTriangle }
  ];

  if (!open) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sales Monitoring</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function useTimeAgo(date) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!date) {
      setTimeAgo('');
      return;
    }

    const update = () => {
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 5) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        setTimeAgo(date.toLocaleTimeString());
      }
    };

    update();
    const intervalId = setInterval(update, 5000); // Update every 5 seconds
    return () => clearInterval(intervalId);
  }, [date]);

  return timeAgo;
}

function Topbar({ user, onToggleSidebar, notifications, setNotifications, onNavigate, onRefresh, lastRefreshed, theme, onToggleTheme }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const notificationsRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeAgo = useTimeAgo(lastRefreshed);


  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsRef]);

  const handleNotificationClick = (notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 ml-8">
            {lastRefreshed && (
              <span className="text-xs text-gray-500 dark:text-gray-400 w-24 text-right">Refreshed {timeAgo}</span>
            )}
            <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition active:scale-90">
              <RefreshCw className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
          <div className="relative" ref={notificationsRef}>
            <button onClick={() => setShowNotifications(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition relative">
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center dark:border-2 dark:border-gray-800">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 animate-in fade-in-0 zoom-in-95">
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-sm text-indigo-600 hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <a
                        key={n.id}
                        href="#!"
                        onClick={(e) => { e.preventDefault(); handleNotificationClick(n); }} className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full ${!n.read ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 p-8">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Administrator</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ onNavigate, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const overviewData = await api.getOverview();
        setData(overviewData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]); // This should call the new getOverview endpoint

  if (loading || !data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="This Month's Revenue"
          value={`PHP ${data.stats.monthRevenue.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={data.stats.monthRevenue.change}
          trendData={data.stats.monthRevenue.trend}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="This Month's Expenses"
          value={`PHP ${data.stats.monthExpenses.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={data.stats.monthExpenses.change}
          trendData={data.stats.monthExpenses.trend}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Earnings Today"
          value={`PHP ${data.stats.todayEarnings.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={null}
          trendData={data.stats.todayEarnings.trend}
          icon={DollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Items"
          value={data.stats.totalItems.value}
          change={data.stats.totalItems.change}
          trendData={data.stats.totalItems.trend}
          changeSuffix=" new this month"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Stock Quantity"
          value={data.stats.totalStock.value.toLocaleString()}
          change={null}
          trendData={data.stats.totalStock.trend}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Low Stock Items"
          value={data.stats.lowStockCount.value}
          onClick={() => setShowLowStockModal(true)}
          trendData={data.stats.lowStockCount.trend}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {showLowStockModal && (
        <LowStockModal onClose={() => setShowLowStockModal(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrendChart data={data.trends} />
        <TopSellingItems items={data.topItems} onNavigate={onNavigate} />
        <TopStockItems items={data.topStockItems} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxValue = Math.max(...data.revenue, ...data.expenses, 1); // Avoid division by zero

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">6-Month Performance</h3>
      <div className="h-64 flex items-end justify-between gap-2 relative">
        {data.months.map((month, i) => (
          <div 
            key={i} 
            className="flex-1 flex flex-col items-center gap-2 relative h-full justify-end group"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-full h-full flex items-end justify-center gap-1">
              <div className="w-1/2 bg-green-400 rounded-t transition-all group-hover:bg-green-500" style={{ height: `${(data.revenue[i] / maxValue) * 100}%` }} />
              <div className="w-1/2 bg-red-400 rounded-t transition-all group-hover:bg-red-500" style={{ height: `${(data.expenses[i] / maxValue) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{month}</span>
            {hoveredIndex === i && (
              <div className="absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 pointer-events-none animate-in fade-in-0">
                <div className="font-bold text-center mb-1">{month}</div>
                <div className="flex justify-between"><span className="text-green-400">Revenue:</span> PHP {data.revenue[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="flex justify-between"><span className="text-red-400">Expenses:</span> PHP {data.expenses[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> Revenue</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Expenses</div>
      </div>
    </div>
  );
}

function MiniTrendChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data, 1);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d / maxValue) * 100}`).join(' ');

  const colors = {
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    red: 'stroke-red-500',
    purple: 'stroke-purple-500'
  };

  return (
    <div className="h-8 mt-2">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          className={`${colors[color]}`}
          strokeWidth="5"
          points={points}
        />
      </svg>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, change, changeSuffix = '%', trendData, onClick }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  const cardClasses = `bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all' : ''}`;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-200 flex-grow">{value}</div>
      {change !== null && change !== undefined && (
        <div className={`mt-1 flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
          <span>
            {changeSuffix === '%' ? (
              <>
                <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span> vs last month
              </>
            ) : (
              <>
                <span className="font-semibold">{Math.abs(change)}</span>{changeSuffix}
              </>
            )}
          </span>
        </div>
      )}
      <MiniTrendChart data={trendData} color={color} />
    </div>
  );
}

function TopSellingItems({ items, onNavigate }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Selling Items</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales data for this month yet.</p>
      </div>
    );
  }

  const maxQty = items[0]?.qty || 1;
  const rankColors = [
    'bg-yellow-400 text-yellow-800',
    'bg-gray-300 text-gray-700',
    'bg-yellow-600 text-yellow-100',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Selling Items (Current Month)</h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.item_id} className="group">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${rankColors[i] || 'bg-gray-100 text-gray-600'}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{item.name}</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.qty} sold</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300 group-hover:bg-indigo-600" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopStockItems({ items, onNavigate }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Items by Stock</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No items in inventory.</p>
      </div>
    );
  }

  const maxQty = items[0]?.qty_in_stock || 1;
  const rankColors = [
    'bg-blue-400 text-blue-800',
    'bg-blue-300 text-blue-700',
    'bg-blue-200 text-blue-600',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Items by Stock Level</h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.item_id} className="group">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${rankColors[i] || 'bg-gray-100 text-gray-600'}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{item.name}</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.qty_in_stock.toLocaleString()} in stock</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300 group-hover:bg-blue-600" style={{ width: `${(item.qty_in_stock / maxQty) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Inventory({ setNotifications, user, refreshKey }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 9; // Define how many items per page
  const [statusFilter, setStatusFilter] = useState('active');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const showStatus = React.useContext(StatusContext);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      const data = await api.getItems(params);
      setItems(data.items);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Failed to fetch items", error);
      showStatus('error', "Failed to fetch items.");
    }
    setLoading(false);
  }, [search, currentPage, showStatus, statusFilter, sortConfig]); // fetchItems depends on 'search' and 'currentPage'

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]); // Now fetchItems is a stable dependency

  // Handlers for item creation/update/deletion
  const handleSave = async (itemId, formData) => {
    try {
      if (itemId) {
        await api.updateItem(itemId, formData);
        setNotifications(prev => [{
          id: `update-item-${itemId}-${Date.now()}`,
          message: `${user.full_name} updated item: ${formData.name}.`,
          type: 'item_update',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        showStatus('success', 'Item updated successfully!');
      } else {
        const newItem = await api.createItem(formData);
        showStatus('success', 'Item created successfully!');
        setNotifications(prev => [{
          id: `create-item-${newItem.item_id}-${Date.now()}`,
          message: `${user.full_name} created a new item: ${formData.name}.`,
          type: 'item_create',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      setShowForm(false);
      fetchItems(); // Refresh list
    } catch (error) {
      console.error("Failed to save item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    const itemToDelete = items.find(i => i.item_id === itemId);
    try {
      await api.deleteItem(itemId);
      setItemToDelete(null); // Close modal
      fetchItems(); // Refresh list
      setNotifications(prev => [{
        id: `delete-item-${itemId}-${Date.now()}`,
        message: `${user.full_name} deleted item: ${itemToDelete.name}.`,
        type: 'item_delete',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Item deleted successfully.');
    } catch (error) {
      console.error("Failed to delete item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const handleRestore = async (itemId) => {
    const itemToRestore = items.find(i => i.item_id === itemId);
    try {
      await api.restoreItem(itemId);
      setItemToRestore(null); // Close modal
      fetchItems(); // Refresh list
      setNotifications(prev => [{
        id: `restore-item-${itemId}-${Date.now()}`,
        message: `${user.full_name} restored item: ${itemToRestore.name}.`,
        type: 'item_restore',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Item restored successfully.');
    } catch (error) {
      console.error("Failed to restore item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 ml-1" />;
    }
    return <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Inventory Management</h2>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-gray-50 dark:bg-gray-900/50">
            {['active', 'inactive', 'all'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search items by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('item_number')} className="flex items-center">Item # {getSortIcon('item_number')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('name')} className="flex items-center">Name {getSortIcon('name')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('category')} className="flex items-center">Category {getSortIcon('category')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('qty_in_stock')} className="flex items-center">Stock {getSortIcon('qty_in_stock')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('selling_price')} className="flex items-center">Price {getSortIcon('selling_price')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <button onClick={() => requestSort('created_at')} className="flex items-center">Date Added {getSortIcon('created_at')}</button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading items...</td></tr>
              ) : items.length > 0 ? (
                items.map(item => (
                  <tr key={item.item_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-300">{item.item_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.qty_in_stock <= item.reorder_level
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.qty_in_stock || 0}
                      </span> 
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">PHP {parseFloat(item.selling_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {item.status === 'active' ? (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setItemToRestore(item)}
                            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-4 text-gray-500 dark:text-gray-400">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-center items-center border-t border-gray-200 dark:border-gray-700 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Logic to show only a few page numbers around the current page
              const showPage = Math.abs(page - currentPage) < 2 || page === 1 || page === totalPages;
              const showEllipsis = Math.abs(page - currentPage) === 2 && page > 1 && page < totalPages;

              if (showEllipsis) {
                return <span key={`ellipsis-${page}`} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>;
              }

              if (showPage) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-lg text-sm ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ItemFormModal
          item={editItem}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">Delete Item?</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Are you sure you want to make{' '}
                <span className="font-semibold">{itemToDelete.name}</span> inactive? It will no longer be available for new sales,
                but will remain in historical records.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(itemToDelete.item_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  Delete
                </button>
            </div>
          </div>
        </div>
      )}

      {itemToRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <RotateCw className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">Restore Item?</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Are you sure you want to restore{' '}
                <span className="font-semibold">{itemToRestore.name}</span>? It will become active and available for new sales again.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setItemToRestore(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore(itemToRestore.item_id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors">
                  Restore
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPeriodDateRange(timePeriod, selectedMonth = new Date().getMonth()) {
  const now = new Date();
  if (timePeriod === 'daily') {
    const start = new Date(now.getFullYear(), selectedMonth, 1);
    const end = new Date(now.getFullYear(), selectedMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (timePeriod === 'weekly') {
    const start = new Date(now.getFullYear(), selectedMonth, 1);
    const end = new Date(now.getFullYear(), selectedMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (timePeriod === 'monthly') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  // yearly
  const start = new Date(2024, 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function Analytics({ refreshKey }) {
  const [timePeriod, setTimePeriod] = useState('monthly'); // daily, weekly, monthly, yearly
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const showStatus = React.useContext(StatusContext);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => { // eslint-disable-line react-hooks/exhaustive-deps
      setLoading(true);
      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const periodRange = getPeriodDateRange(timePeriod, selectedMonth);

        const allTimeStartDate = new Date(2024, 0, 1).toISOString().split('T')[0];
        const [allSales, allExpenses] = await Promise.all([
          api.getSales({ limit: 10000, start_date: allTimeStartDate }),
          // Assuming getExpenses also supports limit and start_date
          api.getExpenses({ limit: 10000, start_date: allTimeStartDate }),
        ]);

        const periodSales = allSales.sales.filter(s => { const d = new Date(s.created_at); return d >= periodRange.start && d <= periodRange.end; });
        const periodExpenses = allExpenses.expenses.filter(e => { const d = new Date(e.date); return d >= periodRange.start && d <= periodRange.end; });

        const totalRevenue = periodSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
        const totalExpenses = periodExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const getWeekOfMonth = (date) => {
          const start = new Date(date.getFullYear(), date.getMonth(), 1);
          const day = date.getDate() + start.getDay() - 1;
          return Math.ceil(day / 7);
        }

        const topSellingProducts = periodSales
          .flatMap(s => s.items)
          .reduce((acc, item) => {
            const existing = acc.find(i => i.name === item.name);
            if (existing) {
              existing.total_quantity += item.quantity;
            } else {
              acc.push({ name: item.name, total_quantity: item.quantity });
            }
            return acc;
          }, [])
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, 5);

        // Process sales trend data
        const salesByPeriod = allSales.sales.reduce((acc, sale) => {
          const date = new Date(sale.created_at);
          const key = date.toISOString().split('T')[0];
          acc[key] = (acc[key] || 0) + parseFloat(sale.total_amount);
          return acc;
        }, {});

        let trendLabels = [];
        let trendDataPoints = [];
        const currentYear = now.getFullYear();
        const currentMonth = selectedMonth;

        if (timePeriod === 'daily') {
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            trendLabels.push(`Day ${day}`);
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            trendDataPoints.push(salesByPeriod[dateKey] || 0);
          }
        } else if (timePeriod === 'weekly') {
          const weeksInMonth = Math.ceil(new Date(currentYear, currentMonth + 1, 0).getDate() / 7);
          const weeklySales = {};
          for (const dateStr in salesByPeriod) {
            const date = new Date(dateStr + 'T00:00:00');
            if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
              const week = getWeekOfMonth(date);
              weeklySales[week] = (weeklySales[week] || 0) + salesByPeriod[dateStr];
            }
          }
          for (let week = 1; week <= 5; week++) {
            trendLabels.push(`Week ${week}`);
            trendDataPoints.push(weeklySales[week] || 0);
          }
        } else if (timePeriod === 'monthly') {
          const monthlySales = {};
          for (const dateStr in salesByPeriod) {
            const date = new Date(dateStr + 'T00:00:00');
            if (date.getFullYear() === currentYear) {
              const month = date.getMonth();
              monthlySales[month] = (monthlySales[month] || 0) + salesByPeriod[dateStr];
            }
          }
          for (let month = 0; month < 12; month++) {
            trendLabels.push(new Date(currentYear, month).toLocaleString('default', { month: 'short' }));
            trendDataPoints.push(monthlySales[month] || 0);
          }
        } else if (timePeriod === 'yearly') {
          const yearlySales = {};
          for (const dateStr in salesByPeriod) {
            const year = new Date(dateStr + 'T00:00:00').getFullYear();
            yearlySales[year] = (yearlySales[year] || 0) + salesByPeriod[dateStr];
          }
          for (let year = 2024; year <= currentYear; year++) {
            trendLabels.push(String(year));
            trendDataPoints.push(yearlySales[year] || 0);
          }
        }

        const salesTrend = {
          labels: trendLabels,
          data: trendDataPoints,
        };

        setData({
          totalRevenue,
          totalExpenses,
          topSellingProducts,
          salesTrend,
          allSales: allSales.sales, // Pass raw data for export
          allExpenses: allExpenses.expenses, // Pass raw data for export
        });

      } catch (error) {
        console.error("Failed to fetch analytics data", error);
        showStatus('error', 'Could not load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [timePeriod, showStatus, selectedMonth, refreshKey]);

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>Could not load analytics data.</div>;

  const handleExportSales = () => {
    const { start, end } = getPeriodDateRange(timePeriod, selectedMonth);
    const periodSales = data.allSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= start && saleDate <= end;
    });

    if (periodSales.length === 0) {
      showStatus('error', 'No sales data to export for this period.');
      return;
    }

    const headers = ['Sale Number', 'Date', 'Admin', 'Payment Method', 'Total Amount'];
    const rows = periodSales.map(s => [s.sale_number, new Date(s.created_at).toLocaleString(), s.username, s.payment_method, s.total_amount]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `sales-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportExpenses = () => {
    const { start, end } = getPeriodDateRange(timePeriod, selectedMonth);
    const periodExpenses = data.allExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });

    if (periodExpenses.length === 0) {
      showStatus('error', 'No expense data to export for this period.');
      return;
    }

    const headers = ['Date', 'Category', 'Amount', 'Notes', 'Admin'];
    const rows = periodExpenses.map(e => [e.date, e.category, e.amount, `"${e.notes || ''}"`, e.username]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `expenses-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportInventory = async () => {
    setIsExporting(true);
    try {
      // Fetch all items for the report, regardless of status
      const { items } = await api.getItems({ limit: 10000, status: 'all' });

      if (items.length === 0) {
        showStatus('error', 'No inventory data to export.');
        return;
      }

      const headers = ['Item Number', 'Name', 'Category', 'Status', 'Quantity In Stock', 'Reorder Level', 'Purchase Price', 'Selling Price', 'Date Added'];
      const rows = items.map(item => [
        item.item_number,
        `"${item.name.replace(/"/g, '""')}"`, // Handle quotes in name
        `"${item.category || ''}"`,
        item.status,
        item.qty_in_stock,
        item.reorder_level,
        parseFloat(item.purchase_price || 0).toFixed(2),
        parseFloat(item.selling_price || 0).toFixed(2),
        new Date(item.created_at).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      downloadCSV(csvContent, `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error("Failed to export inventory", error);
      showStatus('error', 'Failed to export inventory report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReport = () => {
    setIsPrinting(true);
  };

  const trendData = data.salesTrend || { labels: [], data: [] };
  const maxTrendValue = Math.max(...trendData.data, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Analytics & Reports</h2>
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-gray-50 dark:bg-gray-900/50">
          {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                timePeriod === period
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})</div>
          <div className="text-3xl font-bold text-green-600">PHP {data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})</div>
          <div className="text-3xl font-bold text-red-600">PHP {data.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
           <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Profit ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})</div>
          <div className="text-3xl font-bold text-indigo-600">
            PHP {(data.totalRevenue - data.totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-200">Sales Trend ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} View)</h3>
            {(timePeriod === 'daily' || timePeriod === 'weekly') && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            )}
          </div>
          <div className="h-64 relative flex pt-4" onMouseLeave={() => setHoveredIndex(null)}>
            <div className="w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 text-left">
              <span>PHP {maxTrendValue.toLocaleString()}</span>
              <span>PHP {(maxTrendValue / 2).toLocaleString()}</span>
              <span>PHP 0</span>
            </div>
            <div className="flex-grow h-full relative">
            {trendData.data.length > 0 ? (
              <>
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 200" >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#salesGradient)"
                    points={`0,200 ${trendData.data.map((d, i) => `${(i / (trendData.data.length - 1 || 1)) * 500},${200 - (d / maxTrendValue) * 180}`).join(' ')} 500,200`}
                  />
                  <polyline
                    fill="none" stroke="#4f46e5" strokeWidth="2"
                    points={trendData.data.map((d, i) => `${(i / (trendData.data.length - 1 || 1)) * 500},${200 - (d / maxTrendValue) * 180}`).join(' ')}
                  />
                  {trendData.data.map((d, i) => (
                    <circle
                      key={i}
                      cx={(i / (trendData.data.length - 1 || 1)) * 500}
                      cy={200 - (d / maxTrendValue) * 180}
                      r="8"
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  ))}
                  {hoveredIndex !== null && (
                    <>
                      <line
                        x1={(hoveredIndex / (trendData.data.length - 1 || 1)) * 500}
                        y1="0"
                        x2={(hoveredIndex / (trendData.data.length - 1 || 1)) * 500}
                        y2="200"
                        stroke="#9ca3af"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                      <circle
                        cx={(hoveredIndex / (trendData.data.length - 1 || 1)) * 500}
                        cy={200 - (trendData.data[hoveredIndex] / maxTrendValue) * 180}
                        r="4"
                        fill="#4f46e5"
                      />
                      <foreignObject x={(hoveredIndex / (trendData.data.length - 1 || 1)) * 500 - 50} y={200 - (trendData.data[hoveredIndex] / maxTrendValue) * 180 - 60} width="100" height="50">
                        <div className="bg-gray-800 text-white text-xs rounded-md p-2 text-center shadow-lg">
                          <div>{trendData.labels[hoveredIndex]}</div>
                          <div className="font-bold">PHP {trendData.data[hoveredIndex].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      </foreignObject>
                    </>
                  )}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
                  {trendData.labels.map((label, i) => (trendData.labels.length < 15 || i % Math.floor(trendData.labels.length / 10) === 0) && <span key={i}>{label}</span>)}
                </div>
              </>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 pt-20">No sales trend data for this period.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Top Products by Sales Volume ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})</h3>
          <div className="space-y-2">
            {data.topSellingProducts.length > 0 ? (
              data.topSellingProducts.map((item, i) => {
                const rankColors = [
                  'bg-yellow-400 text-yellow-800',
                  'bg-gray-300 text-gray-700',
                  'bg-yellow-600 text-yellow-100',
                ];
                const maxQty = data.topSellingProducts[0].total_quantity || 1;
                return (
                  <div key={i} className="group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${rankColors[i] || 'bg-gray-100 text-gray-600'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-300">{item.name}</span>
                          <span className="font-bold text-gray-600 dark:text-gray-400">{item.total_quantity} units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sales data for this period yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 dark:text-gray-200">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={handleExportSales} className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left flex justify-between items-start dark:border-gray-600 dark:hover:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-300">{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Sales</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Export sales data as CSV</div>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={handleExportExpenses} className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left flex justify-between items-start dark:border-gray-600 dark:hover:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-300">{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Expenses</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Export expenses data as CSV</div>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={handleExportInventory} disabled={isExporting} className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left flex justify-between items-start disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-300">Inventory</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Export current stock levels</div>
              </div>
              {isExporting ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          <button onClick={handlePrintReport} className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex flex-col items-center justify-center gap-2 transition dark:bg-indigo-500 dark:hover:bg-indigo-600">
            <Printer className="w-6 h-6" />
            <span>Print Full Report</span>
          </button>
        </div>
      </div>
      {isPrinting && <PrintableReport data={data} timePeriod={timePeriod} onClose={() => setIsPrinting(false)} />}
    </div>
  );
}

function PrintableReport({ data, timePeriod, onClose }) {
  useEffect(() => {
    const handleAfterPrint = () => onClose();
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onClose]);

  const handlePrint = () => {
    // This triggers the browser's print dialog
    window.print();
  };

  const { start, end } = getPeriodDateRange(timePeriod);
  const periodSales = data.allSales.filter(s => new Date(s.created_at) >= start && new Date(s.created_at) <= end);
  const periodExpenses = data.allExpenses.filter(e => new Date(e.date) >= start && new Date(e.date) <= end);

  const totalRevenue = periodSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 print:h-auto print:max-h-none">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Report Preview</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* This is the div that will be printed */}
        <div className="printable-report-area printable-content p-8 overflow-y-auto print:overflow-visible bg-white text-gray-900">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-8">
            <img src="/logo.png" alt="Company Logo" className="h-12" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Business Report
              </h1>
              <p className="text-right text-gray-500 text-sm">
                {start.toLocaleDateString()} - {end.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="p-4 bg-green-50 rounded-lg"><div className="text-sm text-green-800">Total Revenue</div><div className="text-2xl font-bold text-green-600">PHP {totalRevenue.toFixed(2)}</div></div>
            <div className="p-4 bg-red-50 rounded-lg"><div className="text-sm text-red-800">Total Expenses</div><div className="text-2xl font-bold text-red-600">PHP {totalExpenses.toFixed(2)}</div></div>
            <div className="p-4 bg-indigo-50 rounded-lg"><div className="text-sm text-indigo-800">Net Profit</div><div className="text-2xl font-bold text-indigo-600">PHP {netProfit.toFixed(2)}</div></div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Sales Details</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="p-2 text-left font-semibold">Date</th><th className="p-2 text-left font-semibold">Sale #</th><th className="p-2 text-left font-semibold">Admin</th><th className="p-2 text-right font-semibold">Amount</th></tr></thead>
              <tbody>{periodSales.map(s => <tr key={s.sale_id} className="border-b border-gray-200"><td className="p-2">{new Date(s.created_at).toLocaleDateString()}</td><td className="p-2">{s.sale_number}</td><td className="p-2">{s.username}</td><td className="p-2 text-right">PHP {parseFloat(s.total_amount).toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Expenses Details</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="p-2 text-left font-semibold">Date</th><th className="p-2 text-left font-semibold">Category</th><th className="p-2 text-left font-semibold">Admin</th><th className="p-2 text-right font-semibold">Amount</th></tr></thead>
              <tbody>{periodExpenses.map(e => <tr key={e.expense_id} className="border-b border-gray-200"><td className="p-2">{e.date}</td><td className="p-2">{e.category}</td><td className="p-2">{e.username}</td><td className="p-2 text-right">PHP {parseFloat(e.amount).toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end gap-3 no-print">
          <button onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200">Cancel</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>
    </div>
  );
}

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function Audits({ refreshKey }) {
  const [audits, setAudits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAudits, setTotalAudits] = useState(0);
  const [filter, setFilter] = useState({ action: '', resource: '' });
  const [search, setSearch] = useState('');
  const [viewingAudit, setViewingAudit] = useState(null);
  const auditsPerPage = 7;
  const debouncedSearch = useDebounce(search, 300);

  const fetchAudits = useCallback(async () => {
    try {
      const params = { page: currentPage, limit: auditsPerPage, ...filter, search: debouncedSearch };
      const data = await api.getAudits(params);
      setAudits(data.audits || []);
      setTotalAudits(data.total);
    } catch (error) {
      console.error("Failed to fetch audits", error);
    }
  }, [currentPage, filter, debouncedSearch, auditsPerPage]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits, refreshKey]);

  const actionColors = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    SALE: 'bg-purple-100 text-purple-700',
    EXPENSE: 'bg-orange-100 text-orange-700'
  };

  const totalPages = Math.ceil(totalAudits / auditsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Audit Logs</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter.action}
              onChange={(e) => setFilter({...filter, action: e.target.value})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="SALE">Sale</option>
              <option value="EXPENSE">Expenses</option>
            </select>
            <select
              value={filter.resource}
              onChange={(e) => setFilter({...filter, resource: e.target.value})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            >
              <option value="">All Resources</option>
              <option value="items">Items</option>
              <option value="sales">Sales</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {audits.map(audit => (
            <div key={audit.audit_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${actionColors[audit.action]}`}>
                      {audit.action}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{audit.resource}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">by {audit.username}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(audit.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setViewingAudit(audit)}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {viewingAudit && (
        <AuditDetailsModal audit={viewingAudit} onClose={() => setViewingAudit(null)} />
      )}
    </div>
  );
}

function Expenses({ setNotifications, user, refreshKey }) {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expenseStats, setExpenseStats] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ date: '', category: '', amount: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const expensesPerPage = 8;
  const showStatus = React.useContext(StatusContext);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await api.getExpenses({ page: currentPage, limit: expensesPerPage, search: debouncedSearch });
      setExpenses(data.expenses || []);
      setTotalExpenses(data.total);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      showStatus('error', "Could not load expenses.");
    }
  }, [currentPage, debouncedSearch, showStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await api.getExpenseStats();
      setExpenseStats(stats);
    } catch (err) {
      console.error("Failed to fetch expense stats", err);
      showStatus('error', 'Could not load expense statistics.');
    }
  }, [showStatus]);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [fetchExpenses, fetchStats, refreshKey]);

  const validateForm = () => {
    const errors = {};
    if (!form.date) errors.date = 'Date is required.';
    else if (new Date(form.date) > new Date()) errors.date = 'Date cannot be in the future.';
    
    if (!form.category) errors.category = 'Category is required.';

    if (!form.amount) errors.amount = 'Amount is required.';
    else if (parseFloat(form.amount) <= 0) errors.amount = 'Amount must be a positive number.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingExpense(null);
    setForm({ date: '', category: '', amount: '', notes: '' });
    setFormErrors({});
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setForm({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      notes: expense.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    const apiCall = editingExpense
      ? api.updateExpense(editingExpense.expense_id, form)
      : api.createExpense(form);
    const successMessage = editingExpense
      ? 'Expense updated successfully!'
      : 'Expense added successfully!';

    try {
      await apiCall;
      if (editingExpense) {
        setNotifications(prev => [{
          id: `update-expense-${editingExpense.expense_id}-${Date.now()}`,
          message: `${user.full_name} updated an expense of ${form.amount} for ${form.category}.`,
          type: 'expense_update',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      } else {
        setNotifications(prev => [{
          id: `create-expense-${Date.now()}`,
          message: `${user.full_name} added a new expense of ${form.amount} for ${form.category}.`,
          type: 'expense_create',
          read: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      fetchExpenses(); // Refresh the list of expenses
      fetchStats(); // Refresh the statistics cards
      handleCloseModal();
      showStatus('success', successMessage);
    } catch (error) {
      showStatus('error', `Failed to add expense: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId) => {
    const expense = expenses.find(e => e.expense_id === expenseId);
    try {
      await api.deleteExpense(expenseId);
      setExpenseToDelete(null);
      fetchExpenses(); // Refresh list
      fetchStats(); // Refresh the statistics cards
      setNotifications(prev => [{
        id: `delete-expense-${expenseId}-${Date.now()}`,
        message: `${user.full_name} deleted an expense: ${expense.category} for PHP ${expense.amount}.`,
        type: 'expense_delete',
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showStatus('success', 'Expense deleted successfully.');
    } catch (error) {
      showStatus('error', `Error: ${error.message}`);
    }
  };

    const totalPages = Math.ceil(totalExpenses / expensesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Expenses Tracking</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search in notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>
          <button onClick={() => {
            setEditingExpense(null);
            setShowForm(true);
          }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-600">
            <Plus className="w-5 h-5" />
            Add Expenses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.today.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Week's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.week.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.month.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Year's Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {expenseStats ? `PHP ${expenseStats.year.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map(expense => (
                <tr key={expense.expense_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{expense.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">PHP {parseFloat(expense.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{expense.notes}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{expense.username}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(expense)}
                        className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={handleCloseModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
                  required
                />
                {formErrors.date && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={form.amount}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
                  required
                />
                {formErrors.amount && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-32 flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    editingExpense ? 'Save Changes' : 'Add Expense'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">Delete Expense?</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the expense for{' '}
                <span className="font-semibold">{expenseToDelete.category}</span> amounting to{' '}
                <span className="font-semibold">PHP {parseFloat(expenseToDelete.amount).toFixed(2)}</span>?
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(expenseToDelete.expense_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors">
                  Delete
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditDetailsModal({ audit, onClose }) {
  const formatJson = (jsonString) => {
    if (typeof jsonString === 'object' && jsonString !== null) {
      return JSON.stringify(jsonString, null, 2);
    }
    if (typeof jsonString === 'string') {
      try { return JSON.stringify(JSON.parse(jsonString), null, 2); } catch (e) { return jsonString; }
    }
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Audit Log Details</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Action:</span> {audit.action}</div>
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Resource:</span> {audit.resource} (ID: {audit.resource_id || 'N/A'})</div>
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">User:</span> {audit.username}</div>
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">IP Address:</span> {audit.ip_address}</div>
            <div className="col-span-2 dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Timestamp:</span> {new Date(audit.created_at).toLocaleString()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Before State</h4>
              <pre className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-300">
                <code>
                  {formatJson(audit.before_state)}
                </code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">After State</h4>
              <pre className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-300">
                <code>
                  {formatJson(audit.after_state)}
                </code>
              </pre>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
}

function StatusModal({ type, message, onClose }) {
  const styles = {
    success: {
      Icon: CheckCircle,
      title: 'Success!',
      iconColor: 'text-green-500',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      Icon: XCircle,
      title: 'Error!',
      iconColor: 'text-red-500',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
  };
  const { Icon, title, iconColor, buttonColor } = styles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-8 text-center transform transition-all animate-in fade-in-0 zoom-in-95">
        <Icon className={`w-16 h-16 mx-auto ${iconColor}`} />
        <h3 className={`mt-4 text-2xl font-bold text-gray-800 dark:text-gray-200`}>{title}</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
        <button
          onClick={onClose}
          className={`mt-6 w-full px-4 py-2 text-white rounded-lg font-semibold transition ${buttonColor}`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function LowStockModal({ onClose }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const showStatus = React.useContext(StatusContext);

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await api.getItems({ limit: 1000 });
      const lowStock = items.filter(item => item.qty_in_stock <= item.reorder_level && item.status === 'active');
      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Failed to fetch low stock items", error);
      showStatus('error', 'Could not load low stock items.');
    } finally {
      setLoading(false);
    }
  }, [showStatus]);

  useEffect(() => {
    fetchLowStockItems();
  }, [fetchLowStockItems]);

  const handleSave = async (itemId, formData) => {
    try {
      await api.updateItem(itemId, formData);
      showStatus('success', 'Item stock updated successfully!');
      setEditingItem(null);
      fetchLowStockItems(); // Refresh the list
    } catch (error) {
      console.error("Failed to save item", error);
      showStatus('error', `Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              Low Stock Items
            </h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 dark:text-gray-300">Loading items...</div>
            ) : lowStockItems.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Reorder At</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {lowStockItems.map(item => (
                    <tr key={item.item_id} className="dark:text-gray-300">
                      <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{item.name}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600">{item.qty_in_stock}</td>
                      <td className="px-4 py-3 text-sm">{item.reorder_level}</td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => setEditingItem(item)} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded"><Edit className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No items are currently low on stock.</p>
            )}
          </div>
        </div>
      </div>
      {editingItem && <ItemFormModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSave} />}
    </>
  );
}

function ReceiptModal({ sale, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const subtotal = sale.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price_at_sale)), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Receipt Preview</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POS-style Receipt */}
        <div ref={printRef} className="receipt printable-content p-6 overflow-y-auto font-mono text-sm text-black bg-white">
          <div className="text-center">
            <img src="/logo.png" alt="Company Logo" className="w-24 h-auto mx-auto mb-2" />
            <h2 className="text-xl font-bold">Sales Monitoring Inc.</h2>
            <p>123 Business Rd.</p>
            <p>Business City, 12345</p>
            <p className="mt-2">--- SALE RECEIPT ---</p>
          </div>

          <div className="my-4 border-t border-b border-dashed border-black py-2">
            <p>Sale #: {sale.sale_number || 'N/A'}</p>
            <p>Date: {new Date(sale.created_at || Date.now()).toLocaleString()}</p>
            <p>Cashier: {sale.username || 'Admin'}</p>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">ITEM</th>
                <th className="text-center">QTY</th>
                <th className="text-right">PRICE</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(item => (
                <tr key={item.item_id}>
                  <td>{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{(item.quantity * item.price_at_sale).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-4 border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between"><p>Subtotal:</p> <p>PHP {subtotal.toFixed(2)}</p></div>
            <div className="flex justify-between"><p>Tax (8%):</p> <p>PHP {sale.tax_amount.toFixed(2)}</p></div>
            <div className="flex justify-between font-bold text-base"><p>TOTAL:</p> <p>PHP {sale.total_amount.toFixed(2)}</p></div>
          </div>

          <div className="text-center mt-6">
            <p>Thank you for your purchase!</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end gap-3 no-print">
          <button onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>
    </div>
  );
}

export default App;

function ItemFormModal({ item, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    item_number: item?.item_number || '',
    name: item?.name || '',
    category: item?.category || '',
    qty_in_stock: item?.qty_in_stock || 0,
    reorder_level: item?.reorder_level || 0,
    purchase_price: item?.purchase_price || '',
    selling_price: item?.selling_price || ''
  });

  const validate = () => {
    const errors = {};
    if (!form.item_number.trim()) errors.item_number = 'Item Number is required.';
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.selling_price) errors.selling_price = 'Selling Price is required.';
    else if (parseFloat(form.selling_price) <= 0) errors.selling_price = 'Selling Price must be positive.';

    if (form.purchase_price && parseFloat(form.purchase_price) < 0) {
      errors.purchase_price = 'Purchase Price cannot be negative.';
    }
    if (parseInt(form.qty_in_stock, 10) < 0) {
      errors.qty_in_stock = 'Quantity cannot be negative.';
    }
    if (parseInt(form.reorder_level, 10) < 0) {
      errors.reorder_level = 'Reorder Level cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(item ? item.item_id : null, { ...form, purchase_price: form.purchase_price || 0 });
      // The onClose will be called by the parent, unmounting this component.
    } catch (error) {
      // If there's an error, the modal stays open, so we stop the saving indicator.
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{item ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Number</label>
              <input
                name="item_number"
                type="text"
                value={form.item_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.item_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
                required
              />
              {formErrors.item_number && (
                <p className="mt-1 text-xs text-red-600">{formErrors.item_number}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                name="qty_in_stock"
                type="number"
                value={form.qty_in_stock}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.qty_in_stock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
              />
              {formErrors.qty_in_stock && (
                <p className="mt-1 text-xs text-red-600">{formErrors.qty_in_stock}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reorder Level</label>
              <input
                name="reorder_level"
                type="number"
                value={form.reorder_level}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.reorder_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
              />
              {formErrors.reorder_level && (
                <p className="mt-1 text-xs text-red-600">{formErrors.reorder_level}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
              <input
                name="purchase_price"
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.purchase_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
              />
              {formErrors.purchase_price && (
                <p className="mt-1 text-xs text-red-600">{formErrors.purchase_price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
              <input
                name="selling_price"
                type="number"
                step="0.01"
                value={form.selling_price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${formErrors.selling_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200`}
              />
              {formErrors.selling_price && (
                <p className="mt-1 text-xs text-red-600">{formErrors.selling_price}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-28 flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Save Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sales({ setNotifications, user, refreshKey }) {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [saleForReceipt, setSaleForReceipt] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const salesPerPage = 11; // Define how many sales per page

  const fetchSales = useCallback(async () => {
    try {
      const data = await api.getSales({ page: currentPage, limit: salesPerPage, search: debouncedSearch });
      setSales(data.sales || []);
      setTotalSales(data.total);
    } catch (error) {
      console.error("Failed to fetch sales", error);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales, refreshKey]);

  const handleSaleCreated = (newSale) => { // This function is called after a new sale is successfully created
    setShowSaleModal(false); // Close the modal
    setSaleForReceipt(newSale); // Show the receipt for the new sale
    setCurrentPage(1); // Go back to the first page to see the new sale
    setSearch(''); // Clear search
    setNotifications(prev => [{
      id: `new-sale-${Date.now()}`,
      message: `${user.full_name} made a new sale.`,
      type: 'sale_create',
      read: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    fetchSales(); // Refresh the sales list
  };

  const totalPages = Math.ceil(totalSales / salesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sales Transactions</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by Sale # or Admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>
          <button onClick={() => setShowSaleModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-600">
            <Plus className="w-5 h-5" />
            New Sale
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Sale #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sales.length > 0 ? (
                sales.map(sale => (
                  <tr key={sale.sale_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">{sale.sale_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sale.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sale.payment_method}</td> 
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">PHP {parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        <FileText className="w-4 h-4" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500 dark:text-gray-400">No sales transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {showSaleModal && (
        <NewSaleModal
          onClose={() => setShowSaleModal(false)}
          onSaleCreated={handleSaleCreated}
        />
      )}
      {viewingSale && (
        <SaleDetailsModal sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}
      {saleForReceipt && (
        <ReceiptModal sale={saleForReceipt} onClose={() => setSaleForReceipt(null)} />
      )}
    </div>
  );
}

function SaleDetailsModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sale Details: {sale.sale_number}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Date:</span> {new Date(sale.created_at).toLocaleString()}</div>
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Admin:</span> {sale.username}</div>
            <div className="dark:text-gray-300"><span className="font-semibold text-gray-600 dark:text-gray-400">Payment:</span> {sale.payment_method}</div>
          </div>

          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Items Sold</h4>
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {sale.items.map(item => (
                  <tr key={item.item_id}>
                    <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{item.name}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">{item.quantity}</td> 
                    <td className="px-4 py-3 text-sm dark:text-gray-300">PHP {parseFloat(item.price_at_sale).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">PHP {parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span> <span className="dark:text-gray-200">PHP {(parseFloat(sale.total_amount) - parseFloat(sale.tax_amount) + parseFloat(sale.discount_amount)).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tax:</span> <span className="dark:text-gray-200">PHP {parseFloat(sale.tax_amount).toFixed(2)}</span></div>
              {parseFloat(sale.discount_amount) > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Discount:</span> <span className="text-red-600">-${parseFloat(sale.discount_amount).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t dark:border-gray-700 pt-2 mt-2"><span className="dark:text-gray-200">Total:</span> <span className="dark:text-gray-200">PHP {parseFloat(sale.total_amount).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSaleModal({ onClose, onSaleCreated }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const showStatus = React.useContext(StatusContext);

  useEffect(() => {
    // Fetch all items for the sale modal
    api.getItems({ limit: 1000 }).then(data => setInventoryItems(data.items));
  }, []);

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    !cart.some(cartItem => cartItem.item_id === item.item_id)
  );

  const addToCart = (item) => {
    setCart([...cart, { ...item, quantity: 1, price_at_sale: item.selling_price }]);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.item_id !== itemId));
    } else {
      setCart(cart.map(item => item.item_id === itemId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price_at_sale)), 0);
  const tax = subtotal * 0.08; // Example 8% tax
  const total = subtotal + tax;

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      showStatus('error', 'Cart is empty. Please add items to proceed.');
      return;
    }
    setLoading(true);
    try {
      const saleData = {
        items: cart.map(({ item_id, quantity, price_at_sale }) => ({ item_id, quantity, price_at_sale })),
        payment_method: paymentMethod,
        tax_amount: tax,
        discount_amount: 0,
        total_amount: total,
      };
      await api.createSale(saleData);
      onSaleCreated(saleData); // Pass sale data to parent to show receipt
      showStatus('success', 'Sale created successfully!');
    } catch (error) {
      console.error('Failed to create sale', error);
      showStatus('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Create New Sale</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Item Selection */}
          <div className="w-1/2 border-r dark:border-gray-700 overflow-y-auto">
            <div className="p-4 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div className="divide-y dark:divide-gray-700">
              {filteredItems.map(item => (
                <div key={item.item_id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <div className="font-medium dark:text-gray-200">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">In Stock: {item.qty_in_stock}</div>
                  </div>
                  <button onClick={() => addToCart(item)} className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900"><Plus className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b dark:border-gray-700 flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-gray-600 dark:text-gray-300" /> <h4 className="text-lg font-semibold dark:text-gray-200">Current Sale</h4></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? <div className="text-center text-gray-500 dark:text-gray-400 py-8">Cart is empty</div> :
                cart.map(item => (
                  <div key={item.item_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium dark:text-gray-200">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">PHP {parseFloat(item.price_at_sale).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.item_id, item.quantity - 1)} className="p-1 border dark:border-gray-600 rounded dark:text-gray-300"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center font-medium dark:text-gray-200">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.item_id, item.quantity + 1)} className="p-1 border dark:border-gray-600 rounded dark:text-gray-300"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-medium dark:text-gray-200">PHP {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Tax (8%)</span><span className="font-medium dark:text-gray-200">PHP {tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span className="dark:text-gray-200">Total</span><span className="dark:text-gray-200">PHP {total.toFixed(2)}</span></div>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full mt-2 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
              </select>
              <button
                onClick={handleCreateSale}
                disabled={loading || cart.length === 0}
                className="w-full mt-2 flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}