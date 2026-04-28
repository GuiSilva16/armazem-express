import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, Trash2, Eye, Edit3, MapPin, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, Modal } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, getStockStatus } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { planHasFeature } from '../lib/planFeatures';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const { user, plan } = useAuth();
  const canExport = planHasFeature(plan?.name, 'csv_export');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.status = status;
      const [{ data: prods }, { data: cats }] = await Promise.all([
        api.get('/products', { params }),
        api.get('/products/categories')
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, category, status]);

  // Tempo real - refresh a cada 10s
  useEffect(() => {
    const interval = setInterval(() => {
      // Recarrega em silêncio, sem mostrar spinner
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.status = status;
      api.get('/products', { params }).then(({ data }) => setProducts(data)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [search, category, status]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    if (status !== 'all') params.status = status;
    setSearchParams(params, { replace: true });
  }, [search, category, status]);

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success('Produto removido');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover');
    }
  };

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${products.length} ${products.length === 1 ? 'produto' : 'produtos'} em inventário`}
        actions={
          <>
            {canExport ? (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm disabled:opacity-50"
                title="Descarregar CSV"
              >
                <Download size={16} /> {exporting ? 'A gerar...' : 'Exportar'}
              </button>
            ) : (
              <button
                onClick={() => toast('Exportar CSV requer plano Business ou superior', { icon: '🔒' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 opacity-60 font-semibold transition text-sm cursor-not-allowed"
                title="Disponível em planos superiores"
              >
                <Download size={16} /> Exportar 🔒
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/app/stock/remove')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-red-200 dark:border-brand-red-900 text-brand-red-500 font-semibold hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 transition text-sm"
              >
                <Trash2 size={16} /> Remover
              </button>
            )}
            <button onClick={() => navigate('/app/stock/add')} className="btn-primary !py-2 !px-4 text-sm">
              <Plus size={16} /> Novo produto
            </button>
          </>
        }
      />

      {/* Filtros */}
      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-[1fr_200px_200px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar por nome, SKU ou descrição..."
              className="input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos os estados</option>
            <option value="in_stock">Em Stock</option>
            <option value="low_stock">Stock Baixo</option>
            <option value="out_of_stock">Sem Stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="Sem produtos"
            description={search || category !== 'all' || status !== 'all' ? 'Tente ajustar os filtros.' : 'Comece por adicionar o seu primeiro produto.'}
            action={
              <button onClick={() => navigate('/app/stock/add')} className="btn-primary">
                <Plus size={18} /> Adicionar produto
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p, i) => {
              const s = getStockStatus(p);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/app/stock/${p.id}`)}
                  className="card p-4 cursor-pointer active:scale-[0.98] transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{p.name}</div>
                      <div className="text-xs text-neutral-500 font-mono truncate">{p.sku}</div>
                    </div>
                    <StatusBadge status={s.key} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div>
                      <div className="text-neutral-500">Quantidade</div>
                      <div className="font-bold text-base">{p.quantity}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">Preço</div>
                      <div className="font-bold">{formatCurrency(p.price)}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 flex items-center gap-1"><MapPin size={10}/> Loc.</div>
                      <div className="font-bold truncate">{p.shelf}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Localização</th>
                    <th>Quantidade</th>
                    <th>Preço</th>
                    <th>Estado</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const s = getStockStatus(p);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="cursor-pointer"
                        onClick={() => navigate(`/app/stock/${p.id}`)}
                      >
                        <td>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-neutral-500 font-mono">{p.sku}</div>
                        </td>
                        <td>{p.category}</td>
                        <td>
                          <span className="inline-flex items-center gap-1 font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            <MapPin size={10} /> {p.shelf}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold">{p.quantity}</span>
                          <span className="text-xs text-neutral-400 ml-1">/ min {p.min_stock}</span>
                        </td>
                        <td className="font-semibold">{formatCurrency(p.price)}</td>
                        <td><StatusBadge status={s.key} /></td>
                        <td>
                          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/app/stock/${p.id}`)}
                              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                              title="Ver detalhes"
                            >
                              <Eye size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="p-2 hover:bg-brand-red-100 dark:hover:bg-brand-red-900/30 text-brand-red-500 rounded-lg"
                                title="Remover"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover produto"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Tem a certeza que quer remover <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost !py-2 !px-4">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-brand-red-500 text-white rounded-full font-semibold hover:bg-brand-red-600 transition">
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
