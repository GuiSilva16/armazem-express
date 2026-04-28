import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Plus,
  Send,
  Search,
  QrCode,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Truck,
  Trash2,
  Search as SearchIcon,
  Activity as ActivityIcon,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import { useAuth } from '../context/AuthContext';
import { planHasFeature } from '../lib/planFeatures';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import { timeAgo } from '../lib/format';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/stock', icon: Package, label: 'Stock' },
  { to: '/app/stock/add', icon: Plus, label: 'Adicionar' },
  { to: '/app/orders', icon: Truck, label: 'Encomendas' },
  { to: '/app/orders/new', icon: Send, label: 'Enviar' },
  { to: '/app/tracking', icon: Search, label: 'Tracking' },
  { to: '/app/scanner', icon: QrCode, label: 'QR Scanner', feature: 'qr_scanner' }
];

const adminItems = [
  { to: '/app/stock/remove', icon: Trash2, label: 'Remover Stock' },
  { to: '/app/team', icon: Users, label: 'Equipa' },
  { to: '/app/activity', icon: ActivityIcon, label: 'Atividade', feature: 'activity_log' },
  { to: '/app/settings', icon: Settings, label: 'Definições' }
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const { user, plan, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setNotifsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let prefix = null;
    let prefixTimer = null;

    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
      }
      if (isTyping()) return;

      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      const key = e.key.toLowerCase();

      if (prefix) {
        const routes = {
          g: { d: '/app', s: '/app/stock', e: '/app/orders', t: '/app/tracking' },
          n: { p: '/app/stock/add', e: '/app/orders/new' }
        };
        const dest = routes[prefix]?.[key];
        if (dest) {
          e.preventDefault();
          navigate(dest);
        }
        prefix = null;
        if (prefixTimer) clearTimeout(prefixTimer);
        return;
      }

      if (key === 'g' || key === 'n') {
        prefix = key;
        if (prefixTimer) clearTimeout(prefixTimer);
        prefixTimer = setTimeout(() => { prefix = null; }, 1000);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (prefixTimer) clearTimeout(prefixTimer);
    };
  }, [navigate]);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/dashboard/notifications');
      setNotifications(data);
    } catch (e) {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await api.patch('/dashboard/notifications/read-all');
    loadNotifications();
  };

  const handleLogout = () => {
    logout();
    toast.success('Sessão terminada');
    navigate('/');
  };

  const allNav = user?.role === 'admin' ? [...navItems, ...adminItems] : navItems;
  const planName = plan?.name;
  const isLocked = (item) => item.feature && !planHasFeature(planName, item.feature);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* Sidebar mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isDesktop || sidebarOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col"
      >
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <NavLink to="/app" end className="rounded-xl -m-1 p-1 hover:opacity-80 transition-opacity" title="Ir para Dashboard">
            <Logo size="md" />
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 px-3">
            Principal
          </div>
          {navItems.map((item) => {
            const locked = isLocked(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={locked ? `Disponível em planos superiores` : item.label}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-red-500 text-white shadow-brand'
                      : locked
                      ? 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`
                }
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock size={13} className="opacity-60" />}
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 mt-6 px-3">
                Administração
              </div>
              {adminItems.map((item) => {
                const locked = isLocked(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={locked ? 'Disponível em planos superiores' : item.label}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-yellow-500 text-neutral-900 shadow-brand-yellow'
                          : locked
                          ? 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {locked && <Lock size={13} className="opacity-60" />}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-sm">{user?.name}</div>
                <div className="text-xs opacity-80 truncate">{user?.companyName}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full bg-white/20 font-semibold">
                {user?.role === 'admin' ? 'Admin' : 'Funcionário'}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <Menu size={22} />
            </button>

            <NavLink to="/app" end className="lg:hidden">
              <Logo size="sm" showText={false} animated={false} />
            </NavLink>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 transition"
                title="Pesquisa rápida (Ctrl+K)"
              >
                <SearchIcon size={14} />
                <span>Procurar</span>
                <kbd className="ml-2 px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded">Ctrl+K</kbd>
              </button>
              <button
                onClick={() => setCmdOpen(true)}
                className="md:hidden p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                title="Pesquisa rápida"
              >
                <SearchIcon size={20} />
              </button>
              <button
                onClick={() => setHelpOpen(true)}
                className="hidden sm:inline-flex items-center justify-center h-9 w-9 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                title="Atalhos de teclado (?)"
              >
                ?
              </button>
              <button
                onClick={toggleTheme}
                className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifsOpen((o) => !o)}
                  className="relative p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-brand-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {notifsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="font-bold">Notificações</div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs font-semibold text-brand-red-500 hover:underline"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-neutral-500">
                            Sem notificações
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${
                                !n.read ? 'bg-brand-yellow-50 dark:bg-brand-yellow-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                    n.type === 'error'
                                      ? 'bg-brand-red-500'
                                      : n.type === 'warning'
                                      ? 'bg-brand-yellow-500'
                                      : n.type === 'success'
                                      ? 'bg-green-500'
                                      : 'bg-blue-500'
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{n.title}</div>
                                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                                    {n.message}
                                  </div>
                                  <div className="text-xs text-neutral-400 mt-1">
                                    {timeAgo(n.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu desktop */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-semibold leading-tight">{user?.name}</div>
                    <div className="text-xs text-neutral-500 leading-tight">
                      {user?.role === 'admin' ? 'Admin' : 'Funcionário'}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-neutral-500" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="font-semibold text-sm">{user?.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{user?.email}</div>
                      </div>
                      <button
                        onClick={() => navigate('/app/settings')}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                      >
                        <Settings size={16} /> Definições
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-brand-red-500"
                      >
                        <LogOut size={16} /> Terminar sessão
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
