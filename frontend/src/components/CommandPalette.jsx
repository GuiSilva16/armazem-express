import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Package, Plus, Send, Truck,
  QrCode, Users, Settings, Trash2, ArrowRight, Command as CmdIcon,
  Activity as ActivityIcon, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { planHasFeature } from '../lib/planFeatures';

const baseCommands = [
  { id: 'dashboard', label: 'Ir para Dashboard', hint: 'Resumo geral', icon: LayoutDashboard, to: '/app', keywords: 'home inicio dash' },
  { id: 'stock', label: 'Ver Stock', hint: 'Listar produtos', icon: Package, to: '/app/stock', keywords: 'produtos inventario' },
  { id: 'add', label: 'Adicionar Produto', hint: 'Novo item de stock', icon: Plus, to: '/app/stock/add', keywords: 'novo criar produto' },
  { id: 'orders', label: 'Ver Encomendas', hint: 'Lista de expedições', icon: Truck, to: '/app/orders', keywords: 'shipping envios' },
  { id: 'neworder', label: 'Nova Encomenda', hint: 'Enviar para cliente', icon: Send, to: '/app/orders/new', keywords: 'enviar expedir novo' },
  { id: 'tracking', label: 'Rastrear Encomenda', hint: 'Procurar tracking', icon: Search, to: '/app/tracking', keywords: 'seguir procurar' },
  { id: 'scanner', label: 'QR Scanner', hint: 'Ler código via câmara', icon: QrCode, to: '/app/scanner', keywords: 'qr codigo digitalizar', feature: 'qr_scanner' }
];

const adminCommands = [
  { id: 'remove', label: 'Remover Stock', hint: 'Apagar produtos', icon: Trash2, to: '/app/stock/remove', keywords: 'apagar delete' },
  { id: 'team', label: 'Gestão de Equipa', hint: 'Funcionários e admins', icon: Users, to: '/app/team', keywords: 'utilizadores users' },
  { id: 'activity', label: 'Registo de Atividade', hint: 'Auditoria', icon: ActivityIcon, to: '/app/activity', keywords: 'auditoria log historial', feature: 'activity_log' },
  { id: 'settings', label: 'Definições', hint: 'Conta e plano', icon: Settings, to: '/app/settings', keywords: 'config plano' }
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, plan } = useAuth();

  const commands = (user?.role === 'admin' ? [...baseCommands, ...adminCommands] : baseCommands)
    .map((c) => ({ ...c, locked: c.feature ? !planHasFeature(plan?.name, c.feature) : false }));

  const filteredNav = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords.includes(q) || c.hint.toLowerCase().includes(q);
      })
    : commands;

  // Debounced global search
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSearchResults({ products: [], orders: [] });
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/dashboard/search', { params: { q: query } });
        setSearchResults(data);
      } catch {
        setSearchResults({ products: [], orders: [] });
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  // Build a flat list for keyboard navigation
  const productCmds = searchResults.products.map((p) => ({
    id: `p-${p.id}`,
    label: p.name,
    hint: `${p.sku} · ${p.quantity} un. · ${p.category || 'sem categoria'}`,
    icon: Package,
    to: `/app/stock/${p.id}`,
    section: 'Produtos'
  }));
  const orderCmds = searchResults.orders.map((o) => ({
    id: `o-${o.id}`,
    label: o.recipient_name,
    hint: `${o.tracking_number} · ${o.status} · ${Number(o.total_value).toFixed(2)}€`,
    icon: Truck,
    to: `/app/orders/${o.id}`,
    section: 'Encomendas'
  }));
  const navCmds = filteredNav.map((c) => ({ ...c, section: 'Navegação' }));

  const filtered = [...productCmds, ...orderCmds, ...navCmds];

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const run = (cmd) => {
    if (!cmd) return;
    navigate(cmd.to);
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(filtered[selected]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-[70]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800">
                <Search size={18} className="text-neutral-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Procurar ação, página, atalho..."
                  className="flex-1 py-4 bg-transparent outline-none text-sm placeholder:text-neutral-400"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    {searching ? 'A pesquisar...' : <>Sem resultados para "<span className="font-semibold">{query}</span>"</>}
                  </div>
                ) : (
                  (() => {
                    let lastSection = null;
                    return filtered.map((cmd, i) => {
                      const isSel = i === selected;
                      const showHeader = cmd.section !== lastSection;
                      lastSection = cmd.section;
                      return (
                        <div key={cmd.id}>
                          {showHeader && (
                            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 mt-2 mb-1">
                              {cmd.section}
                            </div>
                          )}
                          <button
                            onMouseEnter={() => setSelected(i)}
                            onClick={() => run(cmd)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                              isSel
                                ? 'bg-brand-red-500 text-white'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSel ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-800'
                            }`}>
                              <cmd.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                                {cmd.label}
                                {cmd.locked && <Lock size={11} className={isSel ? 'text-white/80' : 'text-neutral-400'} />}
                              </div>
                              <div className={`text-xs truncate ${isSel ? 'text-white/80' : 'text-neutral-500'}`}>
                                {cmd.locked ? `Requer plano superior` : cmd.hint}
                              </div>
                            </div>
                            {isSel && <ArrowRight size={14} />}
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">↵</kbd>
                    abrir
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <CmdIcon size={11} /> Armazém Express
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
