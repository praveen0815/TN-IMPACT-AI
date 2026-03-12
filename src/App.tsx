import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  AlertTriangle, 
  Package, 
  Settings, 
  MessageSquare,
  Activity,
  ShieldAlert,
  Menu,
  X,
  Zap,
  LogOut,
  LogIn
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGoogleRedirect, logout } from './firebase';
import Dashboard from './pages/Dashboard';
import RiskMap from './pages/RiskMap';
import AlertsPage from './pages/AlertsPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import AIChat from './components/AIChat';
import SimulationPage from './pages/SimulationPage';

// Auth Context
interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link 
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Login = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);

    // Set a timeout to reset the state if it gets stuck (e.g. popup blocked but no error thrown)
    loginTimeoutRef.current = setTimeout(() => {
      if (isLoggingIn) {
        setIsLoggingIn(false);
        setError('Sign in is taking longer than expected. Please check if a popup was blocked or is hidden behind this window.');
      }
    }, 15000);

    try {
      await signInWithGoogle();
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    } catch (err: any) {
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      
      if (err.code === 'auth/cancelled-popup-request') {
        console.log('Login popup request was cancelled.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login window was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError(`Sign in failed: ${err.message || 'Please try again.'}`);
        console.error('Login error:', err);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    };
  }, []);

  const handleLoginRedirect = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setError(`Redirect sign-in failed: ${err.message}`);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldAlert className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SentinelChain</h1>
          <p className="text-slate-400 mt-2">Secure Supply Chain Intelligence</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoggingIn ? (
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          )}
          {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {isLoggingIn ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-center text-slate-400 text-xs animate-pulse">
              A sign-in window should have opened. If you don't see it, check if your browser blocked the popup.
            </p>
            <button 
              onClick={() => {
                setIsLoggingIn(false);
                if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
                setError('Sign in reset. Please ensure popups are allowed for this site.');
              }}
              className="text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-4"
            >
              Still stuck? Click here to reset
            </button>
          </div>
        ) : (
          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col items-center gap-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Alternative Method</p>
            <button 
              onClick={handleLoginRedirect}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-2"
            >
              <LogIn size={14} /> Try Redirect Sign-in (If popups are blocked)
            </button>
          </div>
        )}
        
        <p className="text-center text-slate-500 text-xs mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SentinelChain</h1>
              <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Risk Intel Platform</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
            <SidebarItem icon={MapIcon} label="Global Risk Map" to="/map" active={location.pathname === '/map'} />
            <SidebarItem icon={AlertTriangle} label="Disruptions" to="/alerts" active={location.pathname === '/alerts'} />
            <SidebarItem icon={Package} label="Inventory" to="/inventory" active={location.pathname === '/inventory'} />
            <SidebarItem icon={Activity} label="Suppliers" to="/suppliers" active={location.pathname === '/suppliers'} />
            <SidebarItem icon={Zap} label="Simulations" to="/simulations" active={location.pathname === '/simulations'} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 space-y-2">
            <SidebarItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
            
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/30 border border-slate-700/30 mb-2">
              <img src={user?.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user?.displayName}</p>
                <button onClick={logout} className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1">
                  <LogOut size={10} /> Sign Out
                </button>
              </div>
            </div>

            <div className="px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-slate-300">System Live</span>
              </div>
              <p className="text-[10px] text-slate-500">Last sync: Just now</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Real-time Monitoring Active
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
              <MessageSquare size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>

        {/* AI Chat Drawer */}
        <AIChat />
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Login />;
  
  return <>{children}</>;
};

import { RealTimeProvider } from './context/RealTimeContext';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect results
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <RealTimeProvider>
        <Router>
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<RiskMap />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/simulations" element={<SimulationPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        </Router>
      </RealTimeProvider>
    </AuthContext.Provider>
  );
}
