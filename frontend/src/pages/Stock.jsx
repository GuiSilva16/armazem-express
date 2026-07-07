import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, Trash2, Eye, Edit3, MapPin, Download, Printer, ClipboardList, QrCode, Upload, FileUp, CheckCircle2, AlertTriangle, Star, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, Modal } from '../components/ui';
import PrintReport from '../components/PrintReport';
import DateRange, { filterByRange } from '../components/DateRange';
import Select from '../components/Select';
import api from '../lib/api';
import { formatCurrency, getStockStatus } from '../lib/format';
import { parseProductsCSV, CSV_TEMPLATE } from '../lib/csv';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [pinned, setPinned] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('armazem_pinned') || '[]')); } catch { return new Set(); }
  });

  const togglePin = (id, e) => {
    e?.stopPropagation();
    setPinned((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('armazem_pinned', JSON.stringify([...next]));
      return next;
    });
  };
  const navigate = useNavigate();
  const { user, plan } = useAuth();
  const canExport = planHasFeature(plan?.name, 'csv_export');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (status !== 'all' && status !== 'expiring') params.status = status;
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
      if (status !== 'all' && status !== 'expiring') params.status = status;
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

  // Vista filtrada por datas (created_at), com ordenação por coluna e favoritos no topo
  let view = filterByRange(products, 'created_at', dateFrom, dateTo);
  // Filtro "a expirar": produtos com validade nos próximos 30 dias (tratado no cliente)
  if (status === 'expiring') {
    const limit = Date.now() + 30 * 24 * 3600 * 1000;
    view = view.filter((p) => p.expiry_date && new Date(p.expiry_date).getTime() <= limit);
  }

  const statusRank = (p) => (p.quantity === 0 ? 2 : p.quantity <= p.min_stock ? 1 : 0);
  const sortAccessors = {
    name: (p) => (p.name || '').toLowerCase(),
    category: (p) => (p.category || '').toLowerCase(),
    shelf: (p) => (p.shelf || '').toLowerCase(),
    quantity: (p) => p.quantity,
    price: (p) => p.price,
    status: (p) => statusRank(p)
  };
  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const sortedView = [...view];
  if (sort.key && sortAccessors[sort.key]) {
    const acc = sortAccessors[sort.key];
    sortedView.sort((a, b) => {
      const va = acc(a), vb = acc(b);
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  // favoritos sempre no topo (mantém a ordenação dentro de cada grupo)
  sortedView.sort((a, b) => (pinned.has(b.id) ? 1 : 0) - (pinned.has(a.id) ? 1 : 0));

  const SortTh = ({ label, k, align }) => (
    <th className={align === 'right' ? 'text-right' : ''}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 font-semibold hover:text-brand-red-500 transition ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {sort.key === k
          ? (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)
          : <ArrowUpDown size={13} className="opacity-30" />}
      </button>
    </th>
  );

  const copySummary = () => {
    const totalValue = view.reduce((s, p) => s + p.quantity * p.price, 0);
    const low = view.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock).length;
    const out = view.filter((p) => p.quantity === 0).length;
    const text = [
      `📦 Resumo de Stock · ${new Date().toLocaleDateString('pt-PT')}`,
      `Produtos: ${view.length} · Unidades: ${view.reduce((s, p) => s + p.quantity, 0)}`,
      `Valor do inventário: ${formatCurrency(totalValue)}`,
      `Stock baixo: ${low} · Sem stock: ${out}`
    ].join('\n');
    navigator.clipboard.writeText(text).then(
      () => toast.success('Resumo copiado'),
      () => toast.error('Não foi possível copiar')
    );
  };

  // Etiquetas com QR — abre uma janela nova pronta a imprimir
  const printLabels = () => {
    if (view.length === 0) { toast.error('Sem produtos para etiquetar'); return; }
    const labels = view.map((p) => {
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=0&data=${encodeURIComponent(p.qr_code || p.sku)}`;
      return `<div class="label">
        <img src="${qr}" alt="QR" />
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="sku">${p.sku}</div>
          <div class="meta">${p.category} · ${p.shelf || '-'}</div>
          <div class="price">${formatCurrency(p.price)}</div>
        </div>
      </div>`;
    }).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas · Armazém Express</title>
      <style>
        *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
        body{margin:0;padding:12mm;color:#111}
        h1{font-size:16px;margin:0 0 10px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .label{border:1px solid #bbb;border-radius:8px;padding:8px;display:flex;gap:8px;align-items:center;break-inside:avoid}
        .label img{width:64px;height:64px}
        .info{min-width:0}
        .name{font-weight:700;font-size:11px;line-height:1.1}
        .sku{font-family:monospace;font-size:9px;color:#666;margin-top:2px}
        .meta{font-size:9px;color:#888;margin-top:2px}
        .price{font-weight:700;font-size:11px;color:#e63946;margin-top:3px}
        @media print{@page{margin:10mm}}
      </style></head><body>
      <h1>Etiquetas de Produtos · ${view.length} · ${new Date().toLocaleDateString('pt-PT')}</h1>
      <div class="grid">${labels}</div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),400)}</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Permita pop-ups para imprimir as etiquetas'); return; }
    w.document.write(html);
    w.document.close();
  };

  // Importar produtos por CSV
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  };

  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'modelo-produtos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const parsed = parseProductsCSV(importText);
    if (parsed.length === 0) {
      toast.error('Não foi possível ler produtos. Verifique o formato do CSV.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const { data } = await api.post('/products/import', { products: parsed });
      setImportResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} produto(s) importado(s)`);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
    <div className="screen-only">
      <PageHeader
        title="Stock"
        subtitle={`${view.length} ${view.length === 1 ? 'produto' : 'produtos'} em inventário`}
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
              onClick={printLabels}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm"
              title="Imprimir etiquetas QR"
            >
              <QrCode size={16} /> Etiquetas
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
            <button
              onClick={() => { setImportResult(null); setImportText(''); setImportOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm"
              title="Importar produtos por CSV"
            >
              <Upload size={16} /> Importar
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/app/stock/remove')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-red-200 dark:border-brand-red-900 text-brand-red-500 font-semibold hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 transition text-sm"
              >
                <Trash2 size={16} /> Eliminar
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
          <Select
            value={category}
            onChange={setCategory}
            options={[{ value: 'all', label: 'Todas as categorias' }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Todos os estados' },
              { value: 'in_stock', label: 'Em Stock' },
              { value: 'low_stock', label: 'Stock Baixo' },
              { value: 'out_of_stock', label: 'Sem Stock' },
              { value: 'expiring', label: 'A expirar (30 dias)' }
            ]}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <DateRange from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : view.length === 0 ? (
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
          {/* Ordenação (telemóvel) */}
          <div className="md:hidden flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <span className="text-xs text-neutral-500 flex-shrink-0">Ordenar:</span>
            {[
              { k: 'name', label: 'Nome' },
              { k: 'quantity', label: 'Qtd.' },
              { k: 'price', label: 'Preço' },
              { k: 'status', label: 'Estado' }
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => toggleSort(o.k)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 transition ${
                  sort.key === o.k
                    ? 'border-brand-red-500 text-brand-red-500 bg-brand-red-500/5'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                }`}
              >
                {o.label}
                {sort.key === o.k && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              </button>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sortedView.map((p, i) => {
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
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <button onClick={(e) => togglePin(p.id, e)} className="flex-shrink-0">
                        <Star size={15} className={pinned.has(p.id) ? 'text-brand-yellow-500 fill-brand-yellow-500' : 'text-neutral-300 dark:text-neutral-600'} />
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        <div className="text-xs text-neutral-500 font-mono truncate">{p.sku}</div>
                      </div>
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
                    <SortTh label="Produto" k="name" />
                    <SortTh label="Categoria" k="category" />
                    <SortTh label="Localização" k="shelf" />
                    <SortTh label="Quantidade" k="quantity" />
                    <SortTh label="Preço" k="price" />
                    <SortTh label="Estado" k="status" />
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedView.map((p, i) => {
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
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => togglePin(p.id, e)} title={pinned.has(p.id) ? 'Desafixar' : 'Fixar no topo'} className="flex-shrink-0">
                              <Star size={15} className={pinned.has(p.id) ? 'text-brand-yellow-500 fill-brand-yellow-500' : 'text-neutral-300 dark:text-neutral-600 hover:text-brand-yellow-500'} />
                            </button>
                            <div className="min-w-0">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-xs text-neutral-500 font-mono">{p.sku}</div>
                            </div>
                          </div>
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

      {/* Modal importar CSV */}
      <Modal open={importOpen} onClose={() => !importing && setImportOpen(false)} title="Importar produtos (CSV)" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Carregue um ficheiro <strong>.csv</strong> ou cole o conteúdo. Colunas: <span className="font-mono text-xs">Nome; Categoria; Quantidade; Stock Mínimo; Preço; Prateleira; Fornecedor</span>.
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm cursor-pointer">
              <FileUp size={16} /> Escolher ficheiro
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500 font-semibold transition text-sm">
              <Download size={16} /> Modelo
            </button>
          </div>

          <textarea
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportResult(null); }}
            placeholder={CSV_TEMPLATE}
            rows={6}
            className="input font-mono text-xs !rounded-xl"
          />

          {importText && !importResult && (
            <div className="text-xs text-neutral-500">{parseProductsCSV(importText).length} linha(s) detetada(s).</div>
          )}

          {importResult && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle2 size={16} /> {importResult.created} importados</span>
                {importResult.failed > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-brand-red-500 font-semibold"><AlertTriangle size={16} /> {importResult.failed} ignorados</span>
                )}
              </div>
              {importResult.errors?.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-neutral-500">Linha {e.row}{e.name ? ` (${e.name})` : ''}: <span className="text-brand-red-500">{e.error}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setImportOpen(false)} disabled={importing} className="btn-ghost !py-2 !px-4">Fechar</button>
            <button onClick={handleImport} disabled={importing || !importText.trim()} className="btn-primary !py-2 !px-4">
              {importing ? 'A importar...' : (<><Upload size={16} /> Importar</>)}
            </button>
          </div>
        </div>
      </Modal>
    </div>

    <PrintReport
      title="Relatório de Stock"
      columns={[
        { label: 'Produto', render: (p) => p.name },
        { label: 'SKU', render: (p) => p.sku },
        { label: 'Categoria', render: (p) => p.category },
        { label: 'Prateleira', render: (p) => p.shelf },
        { label: 'Quantidade', align: 'right', render: (p) => `${p.quantity} / min ${p.min_stock}` },
        { label: 'Preço', align: 'right', render: (p) => formatCurrency(p.price) },
        { label: 'Valor total', align: 'right', render: (p) => formatCurrency(p.quantity * p.price) },
        { label: 'Estado', render: (p) => getStockStatus(p).label }
      ]}
      rows={view}
      summary={[
        { label: 'Produtos', value: view.length },
        { label: 'Unidades em stock', value: view.reduce((s, p) => s + p.quantity, 0) },
        { label: 'Valor do inventário', value: formatCurrency(view.reduce((s, p) => s + p.quantity * p.price, 0)) }
      ]}
      breakdown={[
        { label: 'Em stock', value: view.filter((p) => p.quantity > p.min_stock).length, color: '#22c55e' },
        { label: 'Stock baixo', value: view.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock).length, color: '#f4b01d' },
        { label: 'Sem stock', value: view.filter((p) => p.quantity === 0).length, color: '#e63946' }
      ].filter((b) => b.value > 0)}
    />
    </>
  );
}
