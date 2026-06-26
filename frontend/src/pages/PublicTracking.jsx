import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { StatusBadge } from '../components/ui';
import api from '../lib/api';
import { formatDate } from '../lib/format';

const STATUSES = [
  { key: 'pending', label: 'Pendente', icon: Clock },
  { key: 'shipped', label: 'Expedida', icon: Package },
  { key: 'in_transit', label: 'Em Trânsito', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle2 }
];

export default function PublicTracking() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeParam || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const lookup = async (value) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);
    try {
      const { data } = await api.get(`/track/${value.trim().toUpperCase()}`);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Encomenda não encontrada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) lookup(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/track/${code.trim().toUpperCase()}`);
    lookup(code);
  };

  const cancelled = order?.status === 'cancelled';
  const currentIdx = order ? STATUSES.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size="md" animated={false} />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold tracking-tight text-lg text-neutral-900 dark:text-white">Armazém</span>
              <span className="font-bold uppercase text-brand-red-500 text-[9px] tracking-[0.3em]">Express</span>
            </div>
          </Link>
          <Link to="/" className="text-sm font-medium text-neutral-500 hover:text-brand-red-500 transition flex items-center gap-1">
            <ArrowLeft size={15} /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-red-500 text-white mb-4 shadow-brand">
            <Truck size={26} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Rastrear encomenda</h1>
          <p className="text-neutral-500 mt-2">Introduza o número de rastreio para ver o estado da sua entrega.</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="card p-4 mb-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              className="input pl-11 font-mono uppercase"
              placeholder="AE1234567890PT"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || !code.trim()} className="btn-primary">
            {loading ? 'A procurar...' : (<><Search size={18} /> Rastrear</>)}
          </button>
        </motion.form>

        {searched && !loading && error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-red-100 dark:bg-brand-red-900/30 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-brand-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-1">Sem resultados</h3>
            <p className="text-sm text-neutral-500">{error}</p>
            <p className="text-xs text-neutral-400 mt-3">Confirme o número (formato AE + 12 dígitos + PT) e tente de novo.</p>
          </motion.div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Cabeçalho */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-56 h-56 bg-brand-yellow-500/20 rounded-full blur-3xl" />
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={order.status} size="lg" />
                    <span className="chip bg-neutral-100 dark:bg-neutral-800 font-mono">{order.tracking_number}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold">{order.recipient_name}</h2>
                  <div className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {order.recipient_city} · {order.item_count} {order.item_count === 1 ? 'item' : 'itens'}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-neutral-500">Expedido por</div>
                  <div className="font-semibold">{order.company}</div>
                  <div className="text-xs text-neutral-400 mt-1">Criada {formatDate(order.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Stepper / estado */}
            <div className="card p-6">
              {cancelled ? (
                <div className="flex items-center gap-3 text-brand-red-500">
                  <XCircle size={28} />
                  <div>
                    <div className="font-bold">Encomenda cancelada</div>
                    <div className="text-sm text-neutral-500">Esta encomenda foi cancelada e não será entregue.</div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-bold mb-6">Progresso da entrega</h3>
                  <div className="relative flex justify-between mb-2">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800" />
                    <motion.div
                      className="absolute top-5 left-0 h-0.5 bg-brand-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentIdx / (STATUSES.length - 1)) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                    {STATUSES.map((s, i) => {
                      const done = i <= currentIdx;
                      const current = i === currentIdx;
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
                          <div className={`mt-2 text-xs font-semibold text-center ${done ? '' : 'text-neutral-400'}`}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Histórico */}
            {order.tracking?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold mb-4">Histórico de rastreio</h3>
                <div className="space-y-3">
                  {[...order.tracking].reverse().map((e, i, arr) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`h-4 w-4 rounded-full ${i === 0 ? 'bg-brand-red-500 ring-4 ring-brand-red-100 dark:ring-brand-red-900' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                        {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 my-1 min-h-[30px]" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="text-sm font-semibold">{e.description}</div>
                        {e.location && (
                          <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {e.location}
                          </div>
                        )}
                        <div className="text-xs text-neutral-400 mt-0.5">{formatDate(e.created_at)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500">
        © 2026 Armazém Express · Rastreio de encomendas
      </footer>
    </div>
  );
}
