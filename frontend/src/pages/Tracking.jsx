import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../lib/api';
import { formatDate, formatCurrency } from '../lib/format';

const STATUSES = [
  { key: 'pending', label: 'Pendente', icon: Clock },
  { key: 'shipped', label: 'Expedida', icon: Package },
  { key: 'in_transit', label: 'Em Trânsito', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle2 }
];

export default function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);
    try {
      const { data } = await api.get(`/orders/tracking/${trackingNumber.trim().toUpperCase()}`);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Encomenda não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = order ? STATUSES.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Rastreamento"
        subtitle="Consulte o estado de qualquer encomenda usando o número de tracking."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              className="input pl-11 font-mono uppercase"
              placeholder="AE1234567890PT"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || !trackingNumber.trim()} className="btn-primary">
            {loading ? 'A procurar...' : (<><Search size={18} /> Rastrear</>)}
          </button>
        </form>
        <p className="text-xs text-neutral-500 mt-3">
          💡 Formato: <span className="font-mono">AE</span> + 12 dígitos + <span className="font-mono">PT</span>
        </p>
      </motion.div>

      {searched && !loading && error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-red-100 dark:bg-brand-red-900/30 flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-brand-red-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Não encontrámos essa encomenda</h3>
          <p className="text-sm text-neutral-500">{error}</p>
          <p className="text-xs text-neutral-400 mt-4">
            Verifique o número e tente novamente.
          </p>
        </motion.div>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header da encomenda */}
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-yellow-500/20 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={order.status} size="lg" />
                  <span className="chip bg-neutral-100 dark:bg-neutral-800 font-mono">{order.tracking_number}</span>
                </div>
                <h2 className="font-display text-2xl font-bold">{order.recipient_name}</h2>
                <div className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {order.recipient_city} · {order.recipient_postal_code}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Criada em</div>
                <div className="font-semibold">{formatDate(order.created_at)}</div>
                {order.total_value && (
                  <div className="text-lg font-bold text-brand-red-500 mt-2">{formatCurrency(order.total_value)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="card p-6">
            <h3 className="font-bold mb-6">Progresso</h3>
            <div className="relative flex justify-between mb-6">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800" />
              <motion.div
                className="absolute top-5 left-0 h-0.5 bg-brand-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${order.status === 'cancelled' ? 0 : (currentIdx / (STATUSES.length - 1)) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {STATUSES.map((s, i) => {
                const done = i <= currentIdx && order.status !== 'cancelled';
                const current = i === currentIdx && order.status !== 'cancelled';
                return (
                  <div key={s.key} className="relative flex flex-col items-center z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        done ? 'bg-brand-red-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                      } ${current ? 'ring-4 ring-brand-red-200 dark:ring-brand-red-900' : ''}`}
                    >
                      <s.icon size={18} />
                    </motion.div>
                    <div className={`mt-2 text-xs font-semibold text-center ${done ? '' : 'text-neutral-400'}`}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico */}
          <div className="card p-6">
            <h3 className="font-bold mb-4">Histórico de rastreio</h3>
            <div className="space-y-3">
              {order.tracking?.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${i === 0 ? 'bg-brand-red-500 ring-4 ring-brand-red-100 dark:ring-brand-red-900' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                    {i < order.tracking.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 my-1 min-h-[30px]" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="text-sm font-semibold">{e.description}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {e.location}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{formatDate(e.created_at)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!searched && (
        <div className="grid sm:grid-cols-3 gap-3 mt-8">
          {[
            { n: 'AE1', label: 'Pendente', color: 'yellow', desc: 'Encomenda recebida' },
            { n: 'AE2', label: 'Em trânsito', color: 'red', desc: 'A caminho do destino' },
            { n: 'AE3', label: 'Entregue', color: 'green', desc: 'Chegou ao destinatário' }
          ].map((c) => (
            <div key={c.n} className="card p-5 text-center">
              <div className={`h-10 w-10 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                c.color === 'yellow' ? 'bg-brand-yellow-500 text-neutral-900' :
                c.color === 'red' ? 'bg-brand-red-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                <Package size={20} />
              </div>
              <div className="font-bold">{c.label}</div>
              <div className="text-xs text-neutral-500 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
