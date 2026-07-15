import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Package, AlertTriangle, CheckCircle2, XCircle,
  Truck, Clock, DollarSign, TrendingUp, ArrowRight, Plus, RefreshCw,
  ShoppingCart, Copy, MapPin, ArrowUpRight, HeartPulse, Printer, ClipboardList, Trophy, BellRing
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
  const [days, setDays] = useState(7);
  const { user, plan } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get('/dashboard', { params: { days } });
      setData(data);
      setLastUpdate(new Date());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    // Tempo real: refresh automático a cada 15 segundos
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!data) return null;

  const { stockStats, orderStats, lowStockProducts, recentOrders, movementsByDay, byCategory, reorderSuggestions = [], topByValue = [], comparison, expiringProducts = [] } = data;

  // Saudação consoante a hora de Portugal (Europe/Lisbon), independente do fuso do dispositivo
  const ptHour = parseInt(
    new Date().toLocaleString('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', hour12: false }),
    10
  ) % 24;
  const greeting =
    ptHour >= 6 && ptHour < 13 ? 'Bom dia'
    : ptHour >= 13 && ptHour < 20 ? 'Boa tarde'
    : 'Boa noite';

  // Saúde do inventário: % de produtos com stock saudável
  const healthPct = stockStats.total > 0
    ? Math.round((stockStats.inStock / stockStats.total) * 100)
    : 100;
  const health =
    healthPct >= 80 ? { label: 'Saudável', color: '#22c55e', text: 'text-green-500' }
    : healthPct >= 50 ? { label: 'Requer atenção', color: '#f4b01d', text: 'text-brand-yellow-500' }
    : { label: 'Crítico', color: '#e63946', text: 'text-brand-red-500' };
  const ringCirc = 2 * Math.PI * 52;

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

  // Copiar resumo do dia (para email/mensagem)
  const copyDailySummary = () => {
    const date = new Date().toLocaleDateString('pt-PT');
    const text = [
      `📊 Resumo do dia · ${user?.companyName} · ${date}`,
      ``,
      `STOCK`,
      `• Total: ${stockStats.total} produtos (${stockStats.totalUnits} unidades)`,
      `• Em stock: ${stockStats.inStock} | Baixo: ${stockStats.lowStock} | Sem stock: ${stockStats.outOfStock}`,
      `• Valor do inventário: ${formatCurrency(stockStats.totalValue)}`,
      `• Saúde do inventário: ${healthPct}% (${health.label})`,
      ``,
      `ENCOMENDAS`,
      `• Total: ${orderStats.total} | Pendentes: ${orderStats.pending} | Em trânsito: ${orderStats.inTransit} | Entregues: ${orderStats.delivered}`,
      ``,
      reorderSuggestions.length
        ? `⚠️ ${reorderSuggestions.length} produto(s) a precisar de reposição`
        : `✅ Sem reposições urgentes`
    ].join('\n');
    navigator.clipboard.writeText(text).then(
      () => toast.success('Resumo do dia copiado'),
      () => toast.error('Não foi possível copiar')
    );
  };

  // Alertas consolidados (com ações)
  const alerts = [
    stockStats.outOfStock > 0 && {
      icon: XCircle, tone: 'red',
      text: `${stockStats.outOfStock} produto(s) sem stock`,
      action: 'Repor', to: '/app/stock?status=out_of_stock'
    },
    stockStats.lowStock > 0 && {
      icon: AlertTriangle, tone: 'yellow',
      text: `${stockStats.lowStock} produto(s) com stock baixo`,
      action: 'Ver', to: '/app/stock?status=low_stock'
    },
    orderStats.pending > 0 && {
      icon: Clock, tone: 'yellow',
      text: `${orderStats.pending} encomenda(s) por processar`,
      action: 'Processar', to: '/app/orders?status=pending'
    },
    reorderSuggestions.length > 0 && {
      icon: ShoppingCart, tone: 'red',
      text: `${reorderSuggestions.length} produto(s) sugeridos para reposição`,
      action: 'Repor', to: '/app/purchasing'
    },
    expiringProducts.filter((p) => p.days_left < 0).length > 0 && {
      icon: XCircle, tone: 'red',
      text: `${expiringProducts.filter((p) => p.days_left < 0).length} produto(s) fora da validade`,
      action: 'Ver', to: '/app/stock?status=expiring'
    },
    expiringProducts.filter((p) => p.days_left >= 0).length > 0 && {
      icon: Clock, tone: 'yellow',
      text: `${expiringProducts.filter((p) => p.days_left >= 0).length} produto(s) a expirar em breve`,
      action: 'Ver', to: '/app/stock?status=expiring'
    }
  ].filter(Boolean);

  const maxValue = Math.max(...topByValue.map((p) => p.total_value), 1);

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
    { icon: DollarSign, label: 'Valor Stock', value: formatCurrency(stockStats.totalValue), subtitle: `Margem ${stockStats.marginPct ?? 0}% · custo ${formatCurrency(stockStats.totalCost || 0)}`, color: 'neutral' }
  ];

  return (
    <>
    <div className="space-y-5 screen-only">
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
              {greeting}, {user?.name?.split(' ')[0]} 👋
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
          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={() => load()}
              disabled={refreshing}
              className="p-2.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={copyDailySummary}
              className="p-2.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl hover:bg-white/20 transition"
              title="Copiar resumo do dia"
            >
              <ClipboardList size={16} />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl hover:bg-white/20 transition"
              title="Imprimir / exportar relatório (PDF)"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
        {lastUpdate && (
          <div className="relative mt-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Em tempo real · atualizado {lastUpdate.toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon' })}
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

      {/* Saúde do Inventário + Ações Rápidas */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Saúde do Inventário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5 flex items-center gap-5"
        >
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-100 dark:text-neutral-800" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke={health.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringCirc}
                initial={{ strokeDashoffset: ringCirc }}
                animate={{ strokeDashoffset: ringCirc - (ringCirc * healthPct) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold font-display ${health.text}`}>{healthPct}%</span>
              <span className="text-[10px] text-neutral-500 -mt-0.5">saudável</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse size={18} className={health.text} />
              <h3 className="font-bold">Saúde do Inventário</h3>
            </div>
            <div className={`text-sm font-semibold ${health.text} mb-3`}>{health.label}</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400"><span className="h-2 w-2 rounded-full bg-green-500" /> Em stock</span>
                <span className="font-bold">{stockStats.inStock}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400"><span className="h-2 w-2 rounded-full bg-brand-yellow-500" /> Stock baixo</span>
                <span className="font-bold">{stockStats.lowStock}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400"><span className="h-2 w-2 rounded-full bg-brand-red-500" /> Sem stock</span>
                <span className="font-bold">{stockStats.outOfStock}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 card p-5"
        >
          <h3 className="font-bold mb-1">Ações Rápidas</h3>
          <p className="text-xs text-neutral-500 mb-4">Atalhos para as tarefas mais comuns</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Plus, label: 'Novo produto', to: '/app/stock/add', color: 'bg-brand-red-500' },
              { icon: Truck, label: 'Nova encomenda', to: '/app/orders/new', color: 'bg-blue-500' },
              { icon: AlertTriangle, label: 'Stock baixo', to: '/app/stock?status=low_stock', color: 'bg-brand-yellow-500' },
              { icon: MapPin, label: 'Tracking', to: '/app/tracking', color: 'bg-green-500' }
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-red-500/50 hover:shadow-md transition-all text-left"
              >
                <div className={`h-10 w-10 rounded-lg ${a.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <a.icon size={20} />
                </div>
                <span className="text-sm font-semibold flex items-center gap-1">
                  {a.label}
                  <ArrowUpRight size={14} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Painel de alertas consolidado */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <BellRing size={18} className="text-brand-red-500" />
            <h3 className="font-bold">Alertas</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-300 text-xs font-bold">
              {alerts.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  a.tone === 'red'
                    ? 'bg-brand-red-50 dark:bg-brand-red-900/15 border-brand-red-200 dark:border-brand-red-900/40'
                    : 'bg-brand-yellow-50 dark:bg-brand-yellow-900/15 border-brand-yellow-200 dark:border-brand-yellow-900/40'
                }`}
              >
                <a.icon size={18} className={a.tone === 'red' ? 'text-brand-red-500 flex-shrink-0' : 'text-brand-yellow-600 flex-shrink-0'} />
                <span className="text-sm font-medium flex-1 min-w-0">{a.text}</span>
                <button
                  onClick={() => a.to ? navigate(a.to) : document.getElementById('reorder')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-semibold text-brand-red-500 hover:underline flex items-center gap-0.5 flex-shrink-0 no-print"
                >
                  {a.action} <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts lado a lado */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card p-5"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-bold">Movimento de Stock</h3>
              <p className="text-xs text-neutral-500">Últimos {days} dias</p>
              {comparison && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]">
                  {[
                    { label: 'Encomendas', d: comparison.orders },
                    { label: 'Saídas', d: comparison.outgoing },
                    { label: 'Receita', d: comparison.revenue }
                  ].map(({ label, d }) => {
                    const up = d.pct >= 0;
                    return (
                      <span key={label} className="inline-flex items-center gap-1 text-neutral-500">
                        {label}
                        <span className={`inline-flex items-center font-bold ${up ? 'text-green-500' : 'text-brand-red-500'}`}>
                          {up ? '↑' : '↓'} {Math.abs(d.pct)}%
                        </span>
                      </span>
                    );
                  })}
                  <span className="text-neutral-400">vs período anterior</span>
                </div>
              )}
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
              {/* Toggle de período */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 no-print">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      days === d
                        ? 'bg-white dark:bg-neutral-700 text-brand-red-500 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
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
              <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto pr-3">
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

      {/* Top produtos por valor */}
      {topByValue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-brand-yellow-500" />
            <h3 className="font-bold">Top Produtos por Valor</h3>
            <span className="text-xs text-neutral-500 hidden sm:inline">os mais valiosos em inventário</span>
          </div>
          <div className="space-y-3">
            {topByValue.map((p, i) => (
              <div key={p.id} onClick={() => navigate(`/app/stock/${p.id}`)} className="cursor-pointer group">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-brand-yellow-400 text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}>{i + 1}</span>
                    <span className="font-semibold text-sm truncate group-hover:text-brand-red-500 transition-colors">{p.name}</span>
                    <span className="text-xs text-neutral-400 hidden md:inline">{p.quantity} un. × {formatCurrency(p.price)}</span>
                  </div>
                  <span className="font-bold text-sm flex-shrink-0">{formatCurrency(p.total_value)}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.total_value / maxValue) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-yellow-400 to-brand-red-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sugestões de reposição */}
      {reorderSuggestions.length > 0 && (
        <motion.div
          id="reorder"
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
            <table className="modern-table table-fixed w-full min-w-[760px]">
              <thead>
                <tr>
                  <th className="w-[32%]">Produto</th>
                  <th className="w-[11%]">Stock</th>
                  <th className="w-[12%]">Sugestão</th>
                  <th className="w-[19%]">Fornecedor</th>
                  <th className="w-[15%]">Custo est.</th>
                  <th className="w-[11%]">Urgência</th>
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
                    <td className="font-semibold">{formatCurrency(p.estimated_cost)}</td>
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

    {/* ===== Relatório limpo (só impressão / PDF) ===== */}
    <div className="print-only text-black text-[12px] leading-snug">
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
        <div>
          <div className="text-2xl font-bold">Relatório do Armazém</div>
          <div className="text-sm">{user?.companyName} · Plano {plan?.name || '-'}</div>
        </div>
        <div className="text-right text-sm">
          <div>{new Date().toLocaleDateString('pt-PT', { timeZone: 'Europe/Lisbon', day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div>{new Date().toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="font-bold text-sm uppercase tracking-wide border-b border-black/30 pb-1 mb-2">Stock</div>
          <table className="w-full">
            <tbody>
              <tr><td className="py-0.5">Total de produtos</td><td className="py-0.5 text-right font-semibold">{stockStats.total} ({stockStats.totalUnits} un.)</td></tr>
              <tr><td className="py-0.5">Em stock</td><td className="py-0.5 text-right font-semibold">{stockStats.inStock}</td></tr>
              <tr><td className="py-0.5">Stock baixo</td><td className="py-0.5 text-right font-semibold">{stockStats.lowStock}</td></tr>
              <tr><td className="py-0.5">Sem stock</td><td className="py-0.5 text-right font-semibold">{stockStats.outOfStock}</td></tr>
              <tr><td className="py-0.5">Valor do inventário</td><td className="py-0.5 text-right font-semibold">{formatCurrency(stockStats.totalValue)}</td></tr>
              <tr><td className="py-0.5">Saúde do inventário</td><td className="py-0.5 text-right font-semibold">{healthPct}% ({health.label})</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="font-bold text-sm uppercase tracking-wide border-b border-black/30 pb-1 mb-2">Encomendas</div>
          <table className="w-full">
            <tbody>
              <tr><td className="py-0.5">Total</td><td className="py-0.5 text-right font-semibold">{orderStats.total}</td></tr>
              <tr><td className="py-0.5">Pendentes</td><td className="py-0.5 text-right font-semibold">{orderStats.pending}</td></tr>
              <tr><td className="py-0.5">Em trânsito</td><td className="py-0.5 text-right font-semibold">{orderStats.inTransit}</td></tr>
              <tr><td className="py-0.5">Entregues</td><td className="py-0.5 text-right font-semibold">{orderStats.delivered}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {topByValue.length > 0 && (
        <div className="mb-6">
          <div className="font-bold text-sm uppercase tracking-wide border-b border-black/30 pb-1 mb-2">Top Produtos por Valor</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/40 text-left">
                <th className="py-1">Produto</th><th className="py-1 text-right">Qtd.</th><th className="py-1 text-right">Preço</th><th className="py-1 text-right">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {topByValue.map((p) => (
                <tr key={p.id} className="border-b border-black/10">
                  <td className="py-1">{p.name}</td>
                  <td className="py-1 text-right">{p.quantity}</td>
                  <td className="py-1 text-right">{formatCurrency(p.price)}</td>
                  <td className="py-1 text-right font-semibold">{formatCurrency(p.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reorderSuggestions.length > 0 && (
        <div className="mb-6">
          <div className="font-bold text-sm uppercase tracking-wide border-b border-black/30 pb-1 mb-2">Sugestões de Reposição</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/40 text-left">
                <th className="py-1">Produto</th><th className="py-1 text-right">Stock</th><th className="py-1 text-right">Sugestão</th><th className="py-1">Fornecedor</th><th className="py-1 text-right">Custo est.</th><th className="py-1">Urgência</th>
              </tr>
            </thead>
            <tbody>
              {reorderSuggestions.map((p) => (
                <tr key={p.id} className="border-b border-black/10">
                  <td className="py-1">{p.name}</td>
                  <td className="py-1 text-right">{p.quantity} / {p.min_stock}</td>
                  <td className="py-1 text-right font-semibold">{p.suggested_qty} un.</td>
                  <td className="py-1">{p.supplier || '—'}</td>
                  <td className="py-1 text-right">{formatCurrency(p.estimated_cost)}</td>
                  <td className="py-1">{p.urgency === 'critical' ? 'Crítica' : p.urgency === 'high' ? 'Alta' : 'Média'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-[10px] text-black/50 border-t border-black/20 pt-2 mt-6">
        Armazém Express · Relatório gerado automaticamente · {new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}
      </div>
    </div>
    </>
  );
}
