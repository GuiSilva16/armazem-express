import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, MapPin, QrCode, Trash2, Plus, Minus,
  History, Edit3, Save, X, DollarSign, AlertTriangle, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner, StatusBadge, Modal } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, getStockStatus, formatDate, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' });
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setEditForm({
        name: data.name,
        description: data.description || '',
        category: data.category,
        min_stock: data.min_stock,
        price: data.price,
        shelf: data.shelf,
        supplier: data.supplier || ''
      });
    } catch {
      toast.error('Produto não encontrado');
      navigate('/app/stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/products/${id}`).then(({ data }) => {
        setProduct(data);
        setEditForm((f) => f ? {
          ...f,
          // Só atualiza campos que não estão a ser editados
        } : f);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.amount || Number(adjustForm.amount) <= 0) {
      toast.error('Quantidade inválida');
      return;
    }
    try {
      await api.post(`/products/${id}/adjust`, {
        type: adjustOpen,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason
      });
      toast.success(`Stock ${adjustOpen === 'add' ? 'adicionado' : 'removido'}`);
      setAdjustOpen(null);
      setAdjustForm({ amount: '', reason: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao ajustar stock');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/products/${id}`, editForm);
      toast.success('Produto atualizado');
      setEditMode(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto removido');
      navigate('/app/stock');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const printLabel = (p) => {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(p.qr_code)}`;
    const win = window.open('', '_blank', 'width=420,height=620');
    if (!win) {
      toast.error('Permita popups para imprimir etiquetas');
      return;
    }
    const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8"/>
<title>Etiqueta · ${p.sku}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; }
  .label { width: 320px; margin: 0 auto; background: #fff; border: 2px dashed #999; border-radius: 12px; padding: 18px; color: #111; }
  .brand { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #e63946; font-weight: 700; }
  h1 { font-size: 18px; line-height: 1.2; margin: 4px 0 8px; }
  .meta { font-size: 11px; color: #555; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
  .sku { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; font-weight: 700; background: #111; color: #fff; padding: 6px 10px; border-radius: 6px; display: inline-block; }
  .shelf { font-size: 22px; font-weight: 800; color: #111; }
  .shelf-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
  .qr { width: 110px; height: 110px; }
  .bottom { margin-top: 10px; display: flex; justify-content: space-between; align-items: end; font-size: 10px; color: #666; }
  .btns { text-align: center; margin-top: 18px; }
  button { background: #e63946; color: #fff; border: 0; padding: 10px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; }
  @media print {
    body { background: #fff; padding: 0; }
    .label { border: 1px solid #000; }
    .btns { display: none; }
  }
</style>
</head>
<body>
  <div class="label">
    <div class="brand">Armazém Express</div>
    <h1>${p.name.replace(/</g, '&lt;')}</h1>
    <div class="meta">${p.category || ''} ${p.supplier ? ' · ' + p.supplier.replace(/</g, '&lt;') : ''}</div>
    <div class="grid">
      <div>
        <div class="shelf-label">Localização</div>
        <div class="shelf">${p.shelf || '—'}</div>
        <div style="margin-top:10px"><span class="sku">${p.sku}</span></div>
      </div>
      <img class="qr" src="${qrSrc}" alt="QR"/>
    </div>
    <div class="bottom">
      <span>Preço: ${Number(p.price).toFixed(2)}€</span>
      <span>Min: ${p.min_stock}</span>
    </div>
  </div>
  <div class="btns">
    <button onclick="window.print()">Imprimir</button>
  </div>
</body>
</html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!product) return null;

  const status = getStockStatus(product);

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/app/stock')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-red-500 mb-4 font-semibold"
      >
        <ArrowLeft size={16} /> Voltar ao stock
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6 relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-yellow-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge status={status.key} size="lg" />
              <span className="chip bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                {product.sku}
              </span>
            </div>
            {editMode ? (
              <input
                className="input text-2xl font-bold font-display mb-2"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            ) : (
              <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>
            )}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {product.category} · Criado em {formatDate(product.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQrOpen(true)} className="btn-outline !py-2">
              <QrCode size={16} /> Ver QR
            </button>
            <button onClick={() => printLabel(product)} className="btn-outline !py-2" title="Imprimir etiqueta para prateleira">
              <Printer size={16} /> Etiqueta
            </button>
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); load(); }} className="btn-outline !py-2">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={handleSaveEdit} className="btn-primary !py-2 !px-4 text-sm">
                  <Save size={16} /> Guardar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)} className="btn-outline !py-2">
                  <Edit3 size={16} /> Editar
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-brand-red-500 text-white rounded-full text-sm font-semibold hover:bg-brand-red-600 transition flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Remover
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stock */}
          <div className="card p-6">
            <h3 className="font-bold mb-4">Stock atual</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 bg-gradient-to-br from-brand-red-500 to-brand-red-600 text-white rounded-xl">
                <div className="text-sm opacity-90">Disponível</div>
                <div className="text-4xl font-bold font-display mt-1">{product.quantity}</div>
                <div className="text-xs opacity-90 mt-1">unidades</div>
              </div>
              <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-sm text-neutral-500">Stock mínimo</div>
                {editMode ? (
                  <input
                    type="number"
                    min="0"
                    className="input mt-1 text-xl"
                    value={editForm.min_stock}
                    onChange={(e) => setEditForm({ ...editForm, min_stock: Number(e.target.value) })}
                  />
                ) : (
                  <div className="text-4xl font-bold font-display mt-1">{product.min_stock}</div>
                )}
              </div>
              <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-sm text-neutral-500">Valor total</div>
                <div className="text-2xl font-bold font-display mt-1 text-brand-red-500">
                  {formatCurrency(product.quantity * product.price)}
                </div>
                <div className="text-xs text-neutral-500">{formatCurrency(product.price)}/un.</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAdjustOpen('add')} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition">
                <Plus size={16} /> Adicionar stock
              </button>
              <button onClick={() => setAdjustOpen('remove')} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-brand-red-500 text-white rounded-xl font-semibold hover:bg-brand-red-600 transition">
                <Minus size={16} /> Remover stock
              </button>
            </div>
          </div>

          {/* Detalhes */}
          <div className="card p-6">
            <h3 className="font-bold mb-4">Detalhes</h3>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Prateleira</dt>
                {editMode ? (
                  <input className="input font-mono" value={editForm.shelf} onChange={(e) => setEditForm({ ...editForm, shelf: e.target.value.toUpperCase() })} />
                ) : (
                  <dd className="font-mono font-bold">{product.shelf}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><DollarSign size={12}/> Preço</dt>
                {editMode ? (
                  <input type="number" step="0.01" className="input" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                ) : (
                  <dd className="font-bold">{formatCurrency(product.price)}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Categoria</dt>
                {editMode ? (
                  <input className="input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                ) : (
                  <dd className="font-bold">{product.category}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Fornecedor</dt>
                {editMode ? (
                  <input className="input" value={editForm.supplier} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} />
                ) : (
                  <dd className="font-bold">{product.supplier || '—'}</dd>
                )}
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Descrição</dt>
                {editMode ? (
                  <textarea rows={3} className="input resize-none" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                ) : (
                  <dd>{product.description || '—'}</dd>
                )}
              </div>
            </dl>
          </div>
        </div>

        {/* Histórico */}
        <div className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <History size={18} /> Histórico
          </h3>
          {product.movements && product.movements.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {product.movements.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <div className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white ${
                    m.type === 'add' ? 'bg-green-500' :
                    m.type === 'ship' ? 'bg-blue-500' :
                    m.type === 'scan' ? 'bg-brand-yellow-500' :
                    'bg-brand-red-500'
                  }`}>
                    {m.type === 'add' ? <Plus size={14}/> : m.type === 'scan' ? <QrCode size={14}/> : <Minus size={14}/>}
                  </div>
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-semibold">
                      {m.type === 'add' ? '+' : m.type === 'scan' ? '👁' : '−'} {m.quantity} un.
                    </div>
                    <div className="text-xs text-neutral-500 truncate">{m.reason}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {m.user_name && `${m.user_name} · `}{timeAgo(m.created_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">Sem movimentos</p>
          )}
        </div>
      </div>

      {/* Modal ajuste de stock */}
      <Modal
        open={!!adjustOpen}
        onClose={() => { setAdjustOpen(null); setAdjustForm({ amount: '', reason: '' }); }}
        title={adjustOpen === 'add' ? 'Adicionar stock' : 'Remover stock'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="label">Quantidade</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              placeholder="0"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Motivo (opcional)</label>
            <input
              type="text"
              className="input"
              placeholder={adjustOpen === 'add' ? 'Ex: receção de encomenda' : 'Ex: perda, danificado'}
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdjustOpen(null)} className="btn-ghost !py-2">Cancelar</button>
            <button type="submit" className="btn-primary !py-2 !px-4">
              {adjustOpen === 'add' ? 'Adicionar' : 'Remover'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Código QR do produto" maxWidth="max-w-md">
        <div className="text-center">
          <div className="bg-white p-6 rounded-xl inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(product.qr_code)}`}
              alt="QR Code"
              className="w-60 h-60"
            />
          </div>
          <div className="mt-4 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg break-all">
            {product.qr_code}
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Imprima este QR e cole na prateleira. Funcionários podem digitalizar para identificar o produto.
          </p>
        </div>
      </Modal>

      {/* Confirmar remoção */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Remover produto" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-xl">
            <AlertTriangle size={20} className="text-brand-red-500 flex-shrink-0" />
            <div className="text-sm">
              Tem a certeza que quer remover <strong>{product.name}</strong>? Esta ação não pode ser desfeita e o histórico de movimentos será perdido.
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost !py-2">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-brand-red-500 text-white rounded-full font-semibold hover:bg-brand-red-600 transition">
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
