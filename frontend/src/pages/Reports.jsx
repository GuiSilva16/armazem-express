import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Package, AlertTriangle, Trophy, Activity, Clock, Printer } from 'lucide-react';
import { PageHeader } from '../components/ui';
import Skeleton from '../components/Skeleton';
import api from '../lib/api';
import { formatCurrency } from '../lib/format';

const COLORS = ['#e63946', '#f4b01d', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard', { params: { days } });
      setData(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Relatórios" subtitle="Análise visual do seu armazém." />
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { stockStats, orderStats, movementsByDay = [], byCategory = [], topByValue = [], reorderSuggestions = [] } = data;

  const movementData = movementsByDay.map((m) => ({
    day: new Date(m.day).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
    Adicionado: m.added,
    Removido: m.removed
  }));

  const categoryData = byCategory.slice(0, 6).map((c) => ({ name: c.category, value: c.count, units: c.totalUnits }));
  const topValueData = topByValue.map((p) => ({ name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name, valor: Number(p.total_value.toFixed(2)) }));

  const orderStatusData = [
    { name: 'Pendentes', value: orderStats.pending, color: '#f4b01d' },
    { name: 'Expedidas', value: orderStats.shipped, color: '#3b82f6' },
    { name: 'Em trânsito', value: orderStats.inTransit, color: '#a855f7' },
    { name: 'Entregues', value: orderStats.delivered, color: '#22c55e' }
  ].filter((s) => s.value > 0);

  const healthPct = stockStats.total > 0 ? Math.round((stockStats.inStock / stockStats.total) * 100) : 100;
  const healthData = [
    { name: 'Em stock', value: stockStats.inStock, color: '#22c55e' },
    { name: 'Baixo', value: stockStats.lowStock, color: '#f4b01d' },
    { name: 'Sem stock', value: stockStats.outOfStock, color: '#e63946' }
  ].filter((s) => s.value > 0);

  // Previsão de rutura: dias até acabar com base no consumo de 30 dias
  const forecast = reorderSuggestions
    .filter((p) => p.consumed_30d > 0 && p.quantity > 0)
    .map((p) => ({ ...p, days_left: Math.round(p.quantity / (p.consumed_30d / 30)) }))
    .sort((a, b) => a.days_left - b.days_left)
    .slice(0, 8);

  const tooltipStyle = { background: '#1a1a1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 };

  const Card = ({ title, subtitle, children, className = '' }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios"
        subtitle="Análise visual do desempenho do seu armazém."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {[7, 30].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${days === d ? 'bg-white dark:bg-neutral-700 text-brand-red-500 shadow-sm' : 'text-neutral-500'}`}>
                  {d} dias
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm">
              <Printer size={16} /> Imprimir
            </button>
          </div>
        }
      />

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Package, label: 'Produtos', value: stockStats.total, color: 'text-brand-red-500' },
          { icon: Activity, label: 'Valor do inventário', value: formatCurrency(stockStats.totalValue), color: 'text-green-500' },
          { icon: TrendingUp, label: 'Encomendas', value: orderStats.total, color: 'text-blue-500' },
          { icon: AlertTriangle, label: 'A precisar de reposição', value: reorderSuggestions.length, color: 'text-brand-yellow-500' }
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <k.icon size={18} className={k.color} />
            <div className={`text-2xl font-bold font-display mt-2 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Movimento de stock */}
        <Card title="Movimento de Stock" subtitle={`Últimos ${days} dias`} className="lg:col-span-2">
          {movementData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-neutral-500">Sem movimentos no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={movementData}>
                <defs>
                  <linearGradient id="rAdd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rRem" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e63946" stopOpacity={0.4} /><stop offset="100%" stopColor="#e63946" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.3} />
                <XAxis dataKey="day" fontSize={11} stroke="#888" />
                <YAxis fontSize={11} stroke="#888" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="Adicionado" stroke="#22c55e" strokeWidth={2} fill="url(#rAdd)" />
                <Area type="monotone" dataKey="Removido" stroke="#e63946" strokeWidth={2} fill="url(#rRem)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Saúde do inventário */}
        <Card title="Saúde do Inventário" subtitle={`${healthPct}% saudável`}>
          {healthData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-500">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={healthData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {healthData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Produtos por categoria */}
        <Card title="Produtos por Categoria" subtitle="Distribuição do inventário">
          {categoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-neutral-500">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.3} horizontal={false} />
                <XAxis type="number" fontSize={11} stroke="#888" />
                <YAxis type="category" dataKey="name" fontSize={11} stroke="#888" width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Produtos" radius={[0, 6, 6, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Encomendas por estado */}
        <Card title="Encomendas por Estado" subtitle="Distribuição atual">
          {orderStatusData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-neutral-500">Sem encomendas</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" outerRadius={80} label={(e) => e.name}>
                  {orderStatusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top produtos por valor */}
      {topValueData.length > 0 && (
        <Card title="Top Produtos por Valor" subtitle="Os mais valiosos em inventário (quantidade × preço)">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topValueData} margin={{ bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.3} />
              <XAxis dataKey="name" fontSize={10} stroke="#888" interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis fontSize={11} stroke="#888" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="valor" name="Valor" radius={[6, 6, 0, 0]} fill="#e63946" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Previsão de rutura */}
      <Card title="Previsão de Rutura" subtitle="Estimativa de dias até esgotar, com base no consumo dos últimos 30 dias">
        {forecast.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-500">
            <Clock size={28} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
            Sem produtos em risco de rutura no curto prazo. 👍
          </div>
        ) : (
          <div className="space-y-3">
            {forecast.map((p, i) => {
              const urgent = p.days_left <= 7;
              const warn = p.days_left <= 21;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-32 sm:w-48 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-neutral-500 font-mono">{p.sku}</div>
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (p.days_left / 30) * 100)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                      className={`h-full rounded-full ${urgent ? 'bg-brand-red-500' : warn ? 'bg-brand-yellow-500' : 'bg-green-500'}`}
                    />
                  </div>
                  <div className={`text-sm font-bold w-20 text-right ${urgent ? 'text-brand-red-500' : warn ? 'text-brand-yellow-600' : 'text-green-600'}`}>
                    ~{p.days_left} dias
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
