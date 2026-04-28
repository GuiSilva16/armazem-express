import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Package, AlertTriangle, CheckCircle2, XCircle,
  Truck, Clock, DollarSign, TrendingUp, ArrowRight, Plus, RefreshCw,
  ShoppingCart, Copy
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { StatCard, LoadingSpinner, StatusBadge } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#e63946', '#f4b01d', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { user, plan } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get('/dashboard');
      setData(data);
      setLastUpdate(new Date());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Tempo real: refresh automático a cada 15 segundos
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!data) return null;

  const { stockStats, orderStats, lowStockProducts, recentOrders, movementsByDay, byCategory, reorderSuggestions = [] } = data;

  const copyOrderList = () => {
    if (reorderSuggestions.length === 0) return;
    const lines = reorderSuggestions.map(
      (p) => `• ${p.name} (${p.sku}) — ${p.suggested_qty} un.${p.supplier ? ` · fornecedor: ${p.supplier}` : ''}`
    );
    const total = reorderSuggestions.reduce((s, p) => s + (p.estimated_cost || 0), 0);
    const text = `Lista de reposição — ${new Date().toLocaleDateString('pt-PT')}\n\n${lines.join('\n')}\n\nTotal estimado: ${formatCurrency(total)}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success('Lista copiada para a área de transferência'),
      () => toast.error('Não foi possível copiar')
    );
  };

  const movementData = (movementsByDay || []).map((m) => ({
    day: new Date(m.day).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
    Adicionado: m.added,
    Removido: m.removed
  }));

  const categoryData = (byCategory || []).slice(0, 6).map((c) => ({
    name: c.category,
    value: c.count
  }));

  const stats = [
    { icon: Package, label: 'Total Produtos', value: stockStats.total, subtitle: `${stockStats.totalUnits} unidades`, color: 'red' },
    { icon: CheckCircle2, label: 'Em Stock', value: stockStats.inStock, subtitle: 'Saudável', color: 'green' },
    { icon: AlertTriangle, label: 'Stock Baixo', value: stockStats.lowStock, subtitle: 'Atenção', color: 'yellow' },
    { icon: XCircle, label: 'Sem Stock', value: stockStats.outOfStock, subtitle: 'Urgente', color: 'red' },
    { icon: Truck, label: 'Encomendas', value: orderStats.total, subtitle: `${orderStats.delivered} entregues`, color: 'blue' },
    { icon: Clock, label: 'Pendentes', value: orderStats.pending, subtitle: 'A processar', color: 'yellow' },
    { icon: TrendingUp, label: 'Em Trânsito', value: orderStats.inTransit, subtitle: 'A caminho', color: 'red' },
    { icon: DollarSign, label: 'Valor Stock', value: formatCurrency(stockStats.totalValue), subtitle: 'Inventário', color: 'neutral' }
  ];

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-red-500 via-brand-red-600 to-brand-red-700 p-6 md:p-7 text-white"
      >
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-yellow-500/30 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold opacity-90">
              Olá, {user?.name?.split(' ')[0]} 👋
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">
              {user?.companyName}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/80 flex-wrap">
              <span>Plano <strong>{plan?.name || '-'}</strong></span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{stockStats.total} produtos</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{orderStats.total} encomendas</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => load()}
              disabled={refreshing}
              className="p-2.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => navigate('/app/stock/add')}
              className="px-4 py-2.5 bg-white text-brand-red-600 rounded-xl font-semibold hover:bg-brand-yellow-300 transition text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Novo produto
            </button>
            <button
              onClick={() => navigate('/app/orders/new')}
              className="px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition text-sm flex items-center gap-2"
            >
              <Truck size={16} /> Enviar
            </button>
          </div>
        </div>
        {lastUpdate && (
          <div className="relative mt-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Em tempo real · atualizado {lastUpdate.toLocaleTimeString('pt-PT')}
            </span>
          </div>
        )}
      </motion.div>

      {/* Stats - único grid de 8 */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Charts lado a lado */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Movimento de Stock</h3>
              <p className="text-xs text-neutral-500">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Adicionado
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-brand-red-500" />
                Removido
              </div>
            </div>
          </div>
          {movementData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-neutral-500">
              Sem movimentos recentes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={movementData}>
                <defs>
                  <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="removedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e63946" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.3} />
                <XAxis dataKey="day" fontSize={11} stroke="#888" />
                <YAxis fontSize={11} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 12
                  }}
                />
                <Area type="monotone" dataKey="Adicionado" stroke="#22c55e" strokeWidth={2} fill="url(#addedGrad)" />
                <Area type="monotone" dataKey="Removido" stroke="#e63946" strokeWidth={2} fill="url(#removedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h3 className="font-bold mb-1">Por Categoria</h3>
          <p className="text-xs text-neutral-500 mb-4">Distribuição de produtos</p>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-500">
              Sem dados
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 12
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-bold flex-shrink-0">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Sugestões de reposição */}
      {reorderSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 gap-3 flex-wrap">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <ShoppingCart size={18} className="text-brand-red-500" />
                Sugestões de Reposição
              </h3>
              <p className="text-xs text-neutral-500">Quantidade recomendada com base no consumo dos últimos 30 dias</p>
            </div>
            <button
              onClick={copyOrderList}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-brand-red-500 text-white rounded-full hover:bg-brand-red-600 transition"
            >
              <Copy size={12} /> Copiar lista p/ fornecedor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Stock</th>
                  <th>Sugestão</th>
                  <th>Fornecedor</th>
                  <th className="text-right">Custo estimado</th>
                  <th>Urgência</th>
                </tr>
              </thead>
              <tbody>
                {reorderSuggestions.map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/app/stock/${p.id}`)}>
                    <td>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{p.sku}</div>
                    </td>
                    <td>
                      <span className="font-bold">{p.quantity}</span>
                      <span className="text-xs text-neutral-400 ml-1">/ min {p.min_stock}</span>
                    </td>
                    <td className="font-bold text-brand-red-500">{p.suggested_qty} un.</td>
                    <td className="text-sm">{p.supplier || <span className="text-neutral-400 italic">—</span>}</td>
                    <td className="text-right font-semibold">{formatCurrency(p.estimated_cost)}</td>
                    <td>
                      <span className={`chip ${
                        p.urgency === 'critical' ? 'bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-300'
                        : p.urgency === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        : 'bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-300'
                      }`}>
                        {p.urgency === 'critical' ? 'Crítica' : p.urgency === 'high' ? 'Alta' : 'Média'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Listas em 2 colunas */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-brand-yellow-500" />
                Stock Baixo
              </h3>
              <p className="text-xs text-neutral-500">Produtos a acabar</p>
            </div>
            <button
              onClick={() => navigate('/app/stock?status=low_stock')}
              className="text-xs font-semibold text-brand-red-500 hover:underline flex items-center gap-1"
            >
              Ver tudo <ArrowRight size={12} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                ✅ Todos os produtos com stock saudável
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/app/stock/${p.id}`)}
                  className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.category} · {p.shelf}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="font-bold text-brand-yellow-600">{p.quantity} un.</div>
                    <div className="text-xs text-neutral-400">min. {p.min_stock}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Truck size={18} className="text-brand-red-500" />
                Encomendas Recentes
              </h3>
              <p className="text-xs text-neutral-500">Últimas expedições</p>
            </div>
            <button
              onClick={() => navigate('/app/orders')}
              className="text-xs font-semibold text-brand-red-500 hover:underline flex items-center gap-1"
            >
              Ver tudo <ArrowRight size={12} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                Sem encomendas ainda
              </div>
            ) : (
              recentOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/app/orders/${o.id}`)}
                  className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{o.recipient_name}</div>
                    <div className="text-xs text-neutral-500 font-mono truncate">{o.tracking_number}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={o.status} />
                    <div className="text-xs text-neutral-400 mt-1">{timeAgo(o.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
