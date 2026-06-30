import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, X, PackageCheck, Ban, AlertTriangle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/ui';
import Select from '../components/Select';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  pending: { label: 'Pendente', cls: 'bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-300' },
  received: { label: 'Rececionada', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Cancelada', cls: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' }
};

export default function Purchasing() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // { product_id, name, quantity, unit_cost }
  const [supplierId, setSupplierId] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOrders = () => api.get('/purchase-orders').then(({ data }) => setOrders(data));

  useEffect(() => {
    Promise.all([
      api.get('/products').then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || [])),
      api.get('/suppliers').then(({ data }) => setSuppliers(data)),
      loadOrders()
    ]).finally(() => setLoading(false));
  }, []);

  const lowStock = products
    .filter((p) => p.quantity <= p.min_stock)
    .sort((a, b) => (a.quantity - a.min_stock) - (b.quantity - b.min_stock));

  const suggestQty = (p) => Math.max(p.min_stock * 2 - p.quantity, p.min_stock || 1);

  const addToCart = (p) => {
    if (cart.some((c) => c.product_id === p.id)) return;
    setCart([...cart, { product_id: p.id, name: p.name, quantity: suggestQty(p), unit_cost: p.cost_price || 0 }]);
  };
  const updateCart = (id, field, value) =>
    setCart(cart.map((c) => (c.product_id === id ? { ...c, [field]: value } : c)));
  const removeFromCart = (id) => setCart(cart.filter((c) => c.product_id !== id));

  const cartTotal = cart.reduce((s, c) => s + (Number(c.quantity) || 0) * (Number(c.unit_cost) || 0), 0);

  const createOrder = async () => {
    if (cart.length === 0) return;
    setCreating(true);
    try {
      await api.post('/purchase-orders', {
        supplier_id: supplierId || null,
        items: cart.map((c) => ({ product_id: c.product_id, quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) }))
      });
      toast.success('Encomenda de compra criada');
      setCart([]);
      setSupplierId('');
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar encomenda');
    } finally {
      setCreating(false);
    }
  };

  const receive = async (po) => {
    if (!window.confirm(`Rececionar a ${po.reference}? O stock dos produtos será reposto.`)) return;
    try {
      await api.post(`/purchase-orders/${po.id}/receive`);
      toast.success('Stock reposto com sucesso');
      await Promise.all([loadOrders(), api.get('/products').then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || []))]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao rececionar');
    }
  };

  const cancel = async (po) => {
    if (!window.confirm(`Cancelar a ${po.reference}?`)) return;
    try {
      await api.post(`/purchase-orders/${po.id}/cancel`);
      toast.success('Encomenda cancelada');
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Reposição" subtitle="Encomendas de compra a fornecedores." />
        <EmptyState icon={ClipboardList} title="Acesso restrito" description="Apenas administradores podem gerir reposições." />
      </div>
    );
  }

  const supplierOptions = [{ value: '', label: 'Sem fornecedor' }, ...suppliers.map((s) => ({ value: String(s.id), label: s.name }))];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Reposição" subtitle="Crie encomendas de compra a partir dos produtos com stock baixo e reponha o stock num clique." />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sugestões de reposição */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-brand-yellow-500" />
            <h3 className="font-bold">Sugestões de reposição</h3>
            <span className="chip bg-neutral-100 dark:bg-neutral-800 ml-auto">{lowStock.length}</span>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">Nenhum produto com stock baixo. 🎉</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {lowStock.map((p) => {
                const inCart = cart.some((c) => c.product_id === p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-neutral-500">Stock {p.quantity} / mín. {p.min_stock} · sugestão +{suggestQty(p)}</div>
                    </div>
                    <button disabled={inCart} onClick={() => addToCart(p)}
                      className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-40">
                      {inCart ? 'Adicionado' : <><Plus size={14}/> Adicionar</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Carrinho / nova encomenda */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} className="text-brand-red-500" />
            <h3 className="font-bold">Nova encomenda de compra</h3>
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">Adicione produtos das sugestões ao lado.</p>
          ) : (
            <>
              <div className="mb-3">
                <label className="label">Fornecedor</label>
                <Select value={supplierId} onChange={setSupplierId} options={supplierOptions} />
              </div>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div key={c.product_id} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="min-w-0 flex-1 text-sm font-medium truncate">{c.name}</div>
                    <input type="number" min="1" value={c.quantity}
                      onChange={(e) => updateCart(c.product_id, 'quantity', e.target.value)}
                      className="input !py-1 !px-2 w-16 text-center" title="Quantidade" />
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" step="0.01" value={c.unit_cost}
                        onChange={(e) => updateCart(c.product_id, 'unit_cost', e.target.value)}
                        className="input !py-1 !px-2 w-20 text-right" title="Custo unitário" />
                      <span className="text-xs text-neutral-400">€</span>
                    </div>
                    <button onClick={() => removeFromCart(c.product_id)} className="p-1 text-neutral-400 hover:text-brand-red-500"><X size={15}/></button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">Total estimado</span>
                <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
              </div>
              <button onClick={createOrder} disabled={creating} className="btn-primary w-full mt-3">
                {creating ? 'A criar...' : 'Criar encomenda de compra'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Histórico de encomendas de compra */}
      <div className="card p-5 mt-6">
        <h3 className="font-bold mb-4">Encomendas de compra</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">Ainda não há encomendas de compra.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((po) => {
              const st = STATUS[po.status] || STATUS.pending;
              return (
                <div key={po.id} className="flex items-center gap-3 flex-wrap p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div className="font-mono text-sm font-semibold">{po.reference}</div>
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  <div className="text-sm text-neutral-500">{po.supplier_name || 'Sem fornecedor'}</div>
                  <div className="text-sm text-neutral-500">{po.total_units} un. · {formatCurrency(po.total_cost)}</div>
                  <div className="text-xs text-neutral-400">{formatDate(po.created_at)}</div>
                  {po.status === 'pending' && (
                    <div className="flex gap-2 ml-auto">
                      <button onClick={() => receive(po)} className="btn-primary !py-1.5 !px-3 text-xs"><PackageCheck size={14}/> Rececionar</button>
                      <button onClick={() => cancel(po)} className="btn-ghost !py-1.5 !px-3 text-xs"><Ban size={14}/> Cancelar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
