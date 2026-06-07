import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { to: '/projects', label: 'Projects', icon: 'account_tree' },
  { to: '/deployments', label: 'Deployments', icon: 'rocket_launch' },
  { to: '/ai', label: 'AI Assistant', icon: 'psychology' },
  { to: '/monitoring', label: 'Monitoring', icon: 'monitoring' },
  { to: '/ai/logs', label: 'Logs', icon: 'terminal' },
];

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-low/40 backdrop-blur-2xl border-r border-outline/10 flex flex-col py-8 z-50">
        <Link to="/" className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center neon-glow">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          </div>
          <div>
            <h1 className="font-headline text-sm font-bold text-primary">DevOpsPilot AI</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">Enterprise Tier</p>
          </div>
        </Link>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(to)
                  ? 'bg-secondary-container/30 text-secondary border-r-4 border-secondary'
                  : 'text-on-surface-variant/70 hover:bg-white/5 hover:text-primary hover:translate-x-1'
              }`}>
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-8">
          <Link to="/projects" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-secondary-container to-primary-container text-white font-semibold neon-glow hover:brightness-110 active:scale-95 transition-all mb-4">
            <span className="material-symbols-outlined">add</span>
            <span className="font-mono text-xs uppercase tracking-widest">New Deployment</span>
          </Link>
        </div>
        <div className="mt-auto px-4 py-6 space-y-2">
          <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant/70">
            <span className="material-symbols-outlined text-sm">account_circle</span>
            <span className="font-mono text-xs">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant/70 hover:text-error transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-mono text-xs uppercase tracking-widest">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[280px] min-h-screen p-container-padding">
        {children}
      </main>

      {/* Glow effects */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
