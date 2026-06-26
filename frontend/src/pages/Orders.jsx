import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Search, Plus, Package, MapPin, User, Download, Printer, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState } from '../components/ui';
import PrintReport from '../components/PrintReport';
import DateRange, { filterByRange } from '../components/DateRange';
import Select from '../components/Select';
import api from '../lib/api';
import { formatCurrency, timeAgo, formatDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { planHasFeature } from '../lib/planFeatures';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const periodOptions = [
    { value: '1w', label: '1 semana' },
    { value: '2w', label: '2 semanas' },
    { value: '1m', label: '1 mês' },
    { value: '2m', label: '2 meses' },
    { value: '1y', label: '1 ano' },
    { value: 'all', label: 'Todas' }
  ];
  const navigate = useNavigate();
  const { plan } = useAuth();
  const canExport = planHasFeature(plan?.name, 'csv_export');

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/orders/export', {
        params: period !== 'all' ? { period } : {},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      const suffix = period !== 'all' ? `-${period}` : '';
      a.download = `encomendas${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV descarregado');
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const buildParams = () => {
    const params = {};
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (period !== 'all') params.period = period;
    return params;
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: buildParams() });
      setOrders(data);
    } catch {
      toast.error('Erro ao carregar encomendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, status, period]);

  // Tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/orders', { params: buildParams() }).then(({ data }) => setOrders(data)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [search, status, period]);

  const STATUS_PT = { pending: 'Pendente', shipped: 'Expedida', in_transit: 'Em trânsito', delivered: 'Entregue', cancelled: 'Cancelada' };

  // Filtro de datas (aplicado a ecrã e relatório)
  const view = filterByRange(orders, 'created_at', dateFrom, dateTo);

  const copySummary = () => {
    const total = view.reduce((s, o) => s + (o.total_value || 0), 0);
    const byStatus = Object.entries(STATUS_PT)
      .map(([k, v]) => `${v}: ${view.filter((o) => o.status === k).length}`)
      .join(' | ');
    const text = [
      `📦 Resumo de Encomendas · ${new Date().toLocaleDateString('pt-PT')}`,
      `Total: ${view.length} encomendas · Valor: ${formatCurrency(total)}`,
      byStatus
    ].join('\n');
    navigator.clipboard.writeText(text).then(
      () => toast.success('Resumo copiado'),
      () => toast.error('Não foi possível copiar')
    );
  };

  return (
    <>
    <div className="screen-only">
      <PageHeader
        title="Encomendas"
        subtitle={`${view.length} ${view.length === 1 ? 'encomenda' : 'encomendas'}`}
        actions={
          <>
            <button
              onClick={copySummary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm"
              title="Copiar resumo"
            >
              <ClipboardList size={16} /> Resumo
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm"
              title="Exportar PDF"
            >
              <Printer size={16} /> PDF
            </button>
            {canExport ? (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm disabled:opacity-50"
              >
                <Download size={16} /> {exporting ? 'A gerar...' : 'Exportar'}
              </button>
            ) : (
              <button
                onClick={() => toast('Exportar CSV requer plano Business ou superior', { icon: '🔒' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 opacity-60 font-semibold transition text-sm cursor-not-allowed"
              >
                <Download size={16} /> Exportar 🔒
              </button>
            )}
            <button onClick={() => navigate('/app/orders/new')} className="btn-primary !py-2 !px-4 text-sm">
              <Plus size={16} /> Nova encomenda
            </button>
          </>
        }
      />

      <div className="card p-4 mb-4 space-y-3">
        <div className="grid md:grid-cols-[1fr_200px_200px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar por tracking, nome ou cidade..."
              className="input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Todos os estados' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'shipped', label: 'Expedidas' },
              { value: 'in_transit', label: 'Em trânsito' },
              { value: 'delivered', label: 'Entregues' },
              { value: 'cancelled', label: 'Canceladas' }
            ]}
          />
          <Select
            value={period}
            onChange={setPeriod}
            options={periodOptions.map((p) => ({ value: p.value, label: p.label }))}
          />
        </div>

        {/* Atalhos rápidos de período */}
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                period === p.value
                  ? 'bg-brand-red-500 text-white shadow-brand'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Intervalo de datas personalizado */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <DateRange from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : view.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Truck}
            title="Sem encomendas"
            description={search || status !== 'all' ? 'Tente ajustar os filtros.' : 'Comece por criar a sua primeira encomenda.'}
            action={
              <button onClick={() => navigate('/app/orders/new')} className="btn-primary">
                <Plus size={18} /> Nova encomenda
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {view.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/app/orders/${o.id}`)}
              className="card p-5 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-neutral-500 mb-1">{o.tracking_number}</div>
                  <div className="font-bold truncate flex items-center gap-1"><User size={14}/>{o.recipient_name}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
                <MapPin size={12}/> {o.recipient_city} · {o.recipient_postal_code}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Package size={12}/> {o.item_count} {o.item_count === 1 ? 'item' : 'itens'}
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-red-500">{formatCurrency(o.total_value)}</div>
                  <div className="text-xs text-neutral-400">{timeAgo(o.created_at)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>

    <PrintReport
      title="Relatório de Encomendas"
      columns={[
        { label: 'Tracking', render: (o) => o.tracking_number },
        { label: 'Destinatário', render: (o) => o.recipient_name },
        { label: 'Cidade', render: (o) => o.recipient_city },
        { label: 'Estado', render: (o) => STATUS_PT[o.status] || o.status },
        { label: 'Itens', align: 'right', render: (o) => o.item_count },
        { label: 'Valor', align: 'right', render: (o) => formatCurrency(o.total_value) },
        { label: 'Data', render: (o) => formatDate(o.created_at) }
      ]}
      rows={view}
      summary={[
        { label: 'Encomendas', value: view.length },
        { label: 'Entregues', value: view.filter((o) => o.status === 'delivered').length },
        { label: 'Valor total', value: formatCurrency(view.reduce((s, o) => s + (o.total_value || 0), 0)) }
      ]}
      breakdown={[
        { label: 'Pendentes', value: view.filter((o) => o.status === 'pending').length, color: '#f4b01d' },
        { label: 'Expedidas', value: view.filter((o) => o.status === 'shipped').length, color: '#3b82f6' },
        { label: 'Em trânsito', value: view.filter((o) => o.status === 'in_transit').length, color: '#a855f7' },
        { label: 'Entregues', value: view.filter((o) => o.status === 'delivered').length, color: '#22c55e' },
        { label: 'Canceladas', value: view.filter((o) => o.status === 'cancelled').length, color: '#e63946' }
      ].filter((b) => b.value > 0)}
    />
    </>
  );
}
