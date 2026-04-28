import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, MapPin, Phone, Mail, Package, Truck,
  CheckCircle2, Clock, Circle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner, StatusBadge } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';

const STATUSES = [
  { key: 'pending', label: 'Pendente', icon: Clock },
  { key: 'shipped', label: 'Expedida', icon: Package },
  { key: 'in_transit', label: 'Em Trânsito', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle2 }
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch {
      toast.error('Encomenda não encontrada');
      navigate('/app/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.post(`/orders/${id}/status`, { status });
      toast.success('Estado atualizado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!order) return null;

  const currentIdx = STATUSES.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate('/app/orders')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-red-500 mb-4 font-semibold">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-red-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge status={order.status} size="lg" />
              <span className="chip bg-neutral-100 dark:bg-neutral-800 font-mono">{order.tracking_number}</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{order.recipient_name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Criada em {formatDate(order.created_at)}
              {order.created_by_name && <> · por <span className="font-semibold">{order.created_by_name}</span></>}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-neutral-500">Total</div>
            <div className="font-display text-3xl font-bold text-brand-red-500">{formatCurrency(order.total_value)}</div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6">
            <h3 className="font-bold mb-6">Progresso da encomenda</h3>

            {/* Stepper horizontal */}
            <div className="relative flex justify-between mb-8">
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

            {/* Atualizar estado */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="flex gap-2 flex-wrap">
                {STATUSES.slice(currentIdx + 1).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => updateStatus(s.key)}
                    disabled={updating}
                    className="btn-outline !py-2 !px-3 text-xs"
                  >
                    <s.icon size={14} /> Marcar como {s.label.toLowerCase()}
                  </button>
                ))}
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={updating}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-brand-red-200 text-brand-red-500 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 text-xs font-semibold"
                >
                  <XCircle size={14} /> Cancelar
                </button>
              </div>
            )}

            {/* Timeline detalhada */}
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold mb-4">Histórico de rastreio</h4>
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
                      <div className="h-3 w-3 rounded-full bg-brand-red-500" />
                      {i < order.tracking.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 my-1 min-h-[30px]" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="text-sm font-semibold">{e.description}</div>
                      <div className="text-xs text-neutral-500">📍 {e.location}</div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{formatDate(e.created_at)}</span>
                        {e.user_name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            <User size={10} />
                            {e.user_name}
                            {e.user_role === 'admin' && <span className="text-brand-red-500 font-bold">· admin</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Itens */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card p-6">
            <h3 className="font-bold mb-4">Produtos da encomenda</h3>
            <div className="space-y-2">
              {order.items?.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <div>
                    <div className="font-semibold text-sm">{it.product_name}</div>
                    <div className="text-xs text-neutral-500">{formatCurrency(it.unit_price)} × {it.quantity}</div>
                  </div>
                  <div className="font-bold">{formatCurrency(it.unit_price * it.quantity)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Info destinatário */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-6 h-fit">
          <h3 className="font-bold mb-4">Destinatário</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><User size={12}/> Nome</dt>
              <dd className="font-semibold">{order.recipient_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Morada</dt>
              <dd>{order.recipient_address}</dd>
              <dd className="text-neutral-500 mt-0.5">{order.recipient_postal_code} {order.recipient_city}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><Phone size={12}/> Telefone</dt>
              <dd className="font-mono">{order.recipient_phone}</dd>
            </div>
            {order.recipient_email && (
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><Mail size={12}/> Email</dt>
                <dd className="break-all">{order.recipient_email}</dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Notas</dt>
                <dd className="italic">"{order.notes}"</dd>
              </div>
            )}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}
