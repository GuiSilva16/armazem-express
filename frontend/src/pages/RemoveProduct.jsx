import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Search, AlertTriangle, Package, ArrowLeft, CheckSquare, Square, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, StatusBadge, Modal, EmptyState } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, getStockStatus } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function RemoveProduct() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Apenas administradores podem remover produtos');
      navigate('/app/stock');
      return;
    }
    load();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    let success = 0;
    let failed = 0;
    for (const id of selected) {
      try {
        await api.delete(`/products/${id}`);
        success++;
      } catch {
        failed++;
      }
    }
    setDeleting(false);
    setConfirmOpen(false);
    setSelected(new Set());
    if (success) toast.success(`${success} ${success === 1 ? 'produto removido' : 'produtos removidos'}`);
    if (failed) toast.error(`${failed} não foi possível remover`);
    load();
  };

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const selectedValue = selectedProducts.reduce((s, p) => s + p.quantity * p.price, 0);

  return (
    <div>
      <button
        onClick={() => navigate('/app/stock')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-red-500 mb-4 font-semibold"
      >
        <ArrowLeft size={16} /> Voltar ao stock
      </button>

      <PageHeader
        title="Remover Produtos"
        subtitle="Selecione os produtos a remover do inventário. Esta ação é irreversível."
        actions={
          selected.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-500 text-white rounded-full text-sm font-semibold hover:bg-brand-red-600 transition shadow-brand"
            >
              <Trash2 size={16} /> Remover {selected.size} {selected.size === 1 ? 'produto' : 'produtos'}
            </motion.button>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar produtos a remover..."
            className="input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-brand-red-50 dark:bg-brand-red-900/20 border-2 border-brand-red-300 dark:border-brand-red-800 rounded-2xl flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-brand-red-500" />
            <div>
              <div className="font-bold text-brand-red-700 dark:text-brand-red-400">
                {selected.size} {selected.size === 1 ? 'produto selecionado' : 'produtos selecionados'}
              </div>
              <div className="text-xs text-brand-red-600 dark:text-brand-red-400">
                Valor total: {formatCurrency(selectedValue)}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm font-semibold text-brand-red-600 hover:underline inline-flex items-center gap-1"
          >
            <XCircle size={14} /> Limpar seleção
          </button>
        </motion.div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="Sem produtos"
            description={search ? 'Nenhum produto corresponde à pesquisa.' : 'Não há produtos no inventário.'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900">
            <button
              onClick={toggleAll}
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-brand-red-500 transition"
            >
              {selected.size === products.length && products.length > 0
                ? <CheckSquare size={18} />
                : <Square size={18} />}
              {selected.size === products.length && products.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <span className="text-xs text-neutral-500 ml-auto">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'} no inventário
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <AnimatePresence>
              {products.map((p, i) => {
                const isSelected = selected.has(p.id);
                const status = getStockStatus(p);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: Math.min(i, 10) * 0.02 }}
                    onClick={() => toggleSelect(p.id)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-red-50 dark:bg-brand-red-900/20'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-red-500 border-brand-red-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {isSelected && <CheckSquare size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold truncate">{p.name}</div>
                        <StatusBadge status={status.key} />
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono">{p.sku}</span>
                        <span>·</span>
                        <span>{p.category}</span>
                        <span>·</span>
                        <span className="font-mono">{p.shelf}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="font-bold">{p.quantity} un.</div>
                      <div className="text-xs text-neutral-500">{formatCurrency(p.price)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Modal confirmação */}
      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Confirmar remoção"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-xl">
            <AlertTriangle size={24} className="text-brand-red-500 flex-shrink-0" />
            <div>
              <div className="font-bold text-brand-red-700 dark:text-brand-red-400">Atenção: ação irreversível</div>
              <p className="text-sm text-brand-red-700/90 dark:text-brand-red-400/90 mt-1">
                Vai remover <strong>{selected.size}</strong> {selected.size === 1 ? 'produto' : 'produtos'} no valor de <strong>{formatCurrency(selectedValue)}</strong>. O histórico de movimentos será eliminado.
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 text-sm">
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">{p.quantity} un.</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="btn-ghost !py-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-brand-red-500 text-white rounded-full font-semibold hover:bg-brand-red-600 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {deleting ? 'A remover...' : (<><Trash2 size={16} /> Confirmar remoção</>)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
