import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon, Package, Truck, User, Filter,
  ArrowRight, RefreshCw, Shield
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui';
import api from '../lib/api';
import { timeAgo, formatDate } from '../lib/format';

const TYPE_LABEL = {
  add: { label: 'Adicionado', color: 'green' },
  remove: { label: 'Removido', color: 'red' },
  adjust: { label: 'Ajustado', color: 'blue' },
  ship: { label: 'Expedição', color: 'red' },
  created: { label: 'Criada', color: 'blue' },
  pending: { label: 'Pendente', color: 'yellow' },
  shipped: { label: 'Expedida', color: 'blue' },
  in_transit: { label: 'Em Trânsito', color: 'purple' },
  delivered: { label: 'Entregue', color: 'green' },
  cancelled: { label: 'Cancelada', color: 'red' }
};

const COLOR = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  yellow: 'bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
};

export default function Activity() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get('/dashboard/activity', {
        params: { user_id: userFilter, type: typeFilter, limit: 200 }
      });
      setEvents(data.events);
      setUsers(data.users);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [userFilter, typeFilter]);
  useEffect(() => {
    const i = setInterval(() => load(true), 20000);
    return () => clearInterval(i);
  }, [userFilter, typeFilter]);

  const stats = useMemo(() => {
    const byUser = {};
    events.forEach((e) => {
      const key = e.user_name || '—';
      byUser[key] = (byUser[key] || 0) + 1;
    });
    const top = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return { top, total: events.length };
  }, [events]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-red-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-1">
              <Shield size={12} /> Auditoria · Admin
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ActivityIcon size={26} /> Registo de Atividade
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Todas as ações dos funcionários com autoria e timestamp. Atualiza a cada 20s.
            </p>
          </div>
          <button
            onClick={() => load()}
            disabled={refreshing}
            className="btn-outline !py-2 !px-3 text-xs"
            title="Atualizar"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* Stats: top users */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs font-semibold text-neutral-500">Eventos totais</div>
          <div className="font-display text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        {stats.top.map(([name, count], i) => (
          <div key={name} className="card p-4">
            <div className="text-xs font-semibold text-neutral-500">
              {i === 0 ? '🥇 Mais ativo' : i === 1 ? '🥈 Segundo' : '🥉 Terceiro'}
            </div>
            <div className="font-bold mt-1 truncate">{name}</div>
            <div className="text-xs text-neutral-500">{count} ações</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
          <Filter size={14} /> Filtros:
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="input !py-1.5 !px-3 text-sm !w-auto"
        >
          <option value="all">Todos os utilizadores</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.role === 'admin' ? '(admin)' : ''}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input !py-1.5 !px-3 text-sm !w-auto"
        >
          <option value="all">Tudo</option>
          <option value="stock">Só Stock</option>
          <option value="order">Só Encomendas</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-500">
            Sem atividade nos filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {events.map((e, i) => {
              const info = TYPE_LABEL[e.type] || { label: e.type, color: 'neutral' };
              const isStock = e.source === 'stock';
              const target = isStock
                ? `/app/stock/${e.product_id}`
                : `/app/orders/${e.order_id}`;
              return (
                <motion.div
                  key={`${e.source}-${e.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  onClick={() => navigate(target)}
                  className="flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isStock
                      ? 'bg-brand-red-100 dark:bg-brand-red-900/30 text-brand-red-600 dark:text-brand-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                  }`}>
                    {isStock ? <Package size={18} /> : <Truck size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR[info.color] || COLOR.neutral}`}>
                        {info.label}
                      </span>
                      <span className="text-sm font-semibold truncate">
                        {isStock ? e.product_name : e.recipient_name}
                      </span>
                      {isStock && (
                        <span className="text-xs font-mono text-neutral-400">
                          {e.product_sku}
                        </span>
                      )}
                      {!isStock && (
                        <span className="text-xs font-mono text-neutral-400 truncate">
                          {e.tracking_number}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                      {isStock && e.quantity != null && (
                        <span className="font-semibold">
                          {e.type === 'add' ? '+' : e.type === 'remove' || e.type === 'ship' ? '-' : ''}
                          {e.quantity} un.
                        </span>
                      )}
                      {e.reason && <span className="italic">"{e.reason}"</span>}
                      {e.user_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <User size={10} />
                          {e.user_name}
                          {e.user_role === 'admin' && (
                            <span className="text-brand-red-500 font-bold ml-0.5">· admin</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-neutral-400">sistema</span>
                      )}
                      <span className="text-neutral-400">· {timeAgo(e.created_at)}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-neutral-400 flex-shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
