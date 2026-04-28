import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, MapPin, Phone, Mail, Package,
  Plus, Minus, Search, X, AlertCircle, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui';
import api from '../lib/api';
import { formatCurrency } from '../lib/format';

export default function SendOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_city: '',
    recipient_postal_code: '',
    recipient_phone: '',
    recipient_email: '',
    notes: ''
  });

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data.filter((p) => p.quantity > 0)));
  }, []);

  const filtered = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const addToCart = (product) => {
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error(`Stock máximo atingido (${product.quantity})`);
        return;
      }
      setCart(cart.map((c) =>
        c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { product_id: product.id, product, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map((c) => {
      if (c.product_id !== id) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > c.product.quantity) {
        toast.error(`Stock máximo: ${c.product.quantity}`);
        return c;
      }
      return { ...c, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(cart.filter((c) => c.product_id !== id));

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const validatePhone = (p) => {
    const c = p.replace(/\s+/g, '').replace(/^\+351/, '');
    return /^[23]\d{8}$/.test(c) || /^9[1236]\d{7}$/.test(c);
  };
  const validatePostal = (cp) => /^\d{4}-\d{3}$/.test(cp.trim());
  const validateEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validate = () => {
    const e = {};
    if (!form.recipient_name || form.recipient_name.trim().length < 2) e.recipient_name = 'Nome inválido';
    else if (!/^[A-Za-zÀ-ÿ\s'.-]+$/.test(form.recipient_name.trim())) e.recipient_name = 'Só letras permitidas';
    if (!form.recipient_address || form.recipient_address.trim().length < 5) e.recipient_address = 'Morada demasiado curta';
    if (!form.recipient_city || form.recipient_city.trim().length < 2) e.recipient_city = 'Cidade obrigatória';
    if (!validatePostal(form.recipient_postal_code)) e.recipient_postal_code = 'Formato: XXXX-XXX';
    if (!validatePhone(form.recipient_phone)) e.recipient_phone = 'Nº português inválido (9 dígitos)';
    if (form.recipient_email && !validateEmail(form.recipient_email)) e.recipient_email = 'Email inválido';
    if (cart.length === 0) e.cart = 'Adicione pelo menos um produto';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Corrija os campos destacados');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/orders', {
        ...form,
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity }))
      });
      toast.success(`Encomenda ${data.tracking_number} criada!`);
      navigate(`/app/orders/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar encomenda');
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (v) => v.replace(/[^\d+]/g, '').slice(0, 13);
  const formatPostal = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 7);
    return clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean;
  };

  const Err = ({ m }) => m ? (
    <div className="flex items-center gap-1 text-xs text-brand-red-500 mt-1.5">
      <AlertCircle size={12} /> {m}
    </div>
  ) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate('/app/orders')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-red-500 mb-4 font-semibold">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader
        title="Nova Encomenda"
        subtitle="Dados do destinatário + produtos. O stock é descontado automaticamente."
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {/* Destinatário */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-10 w-10 rounded-xl bg-brand-red-500 flex items-center justify-center text-white">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold">Destinatário</h3>
                <p className="text-xs text-neutral-500">Dados do cliente</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nome completo *</label>
                <input type="text" className={`input ${errors.recipient_name ? 'border-brand-red-500' : ''}`}
                  placeholder="Maria Santos" value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
                <Err m={errors.recipient_name} />
              </div>
              <div>
                <label className="label">Morada *</label>
                <input type="text" className={`input ${errors.recipient_address ? 'border-brand-red-500' : ''}`}
                  placeholder="Rua das Flores 123, 3ºD" value={form.recipient_address}
                  onChange={(e) => setForm({ ...form, recipient_address: e.target.value })} />
                <Err m={errors.recipient_address} />
              </div>
              <div className="grid sm:grid-cols-[1fr_180px] gap-4">
                <div>
                  <label className="label">Cidade *</label>
                  <input type="text" className={`input ${errors.recipient_city ? 'border-brand-red-500' : ''}`}
                    placeholder="Lisboa" value={form.recipient_city}
                    onChange={(e) => setForm({ ...form, recipient_city: e.target.value })} />
                  <Err m={errors.recipient_city} />
                </div>
                <div>
                  <label className="label">Cód. postal *</label>
                  <input type="text" className={`input font-mono ${errors.recipient_postal_code ? 'border-brand-red-500' : ''}`}
                    placeholder="1200-456" maxLength={8} value={form.recipient_postal_code}
                    onChange={(e) => setForm({ ...form, recipient_postal_code: formatPostal(e.target.value) })} />
                  <Err m={errors.recipient_postal_code} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefone *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="tel" className={`input pl-11 font-mono ${errors.recipient_phone ? 'border-brand-red-500' : ''}`}
                      placeholder="912345678" value={form.recipient_phone}
                      onChange={(e) => setForm({ ...form, recipient_phone: formatPhone(e.target.value) })} />
                  </div>
                  <Err m={errors.recipient_phone} />
                  {!errors.recipient_phone && <p className="text-xs text-neutral-500 mt-1">9 dígitos. Só números.</p>}
                </div>
                <div>
                  <label className="label">Email (opcional)</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="email" className={`input pl-11 ${errors.recipient_email ? 'border-brand-red-500' : ''}`}
                      placeholder="cliente@exemplo.pt" value={form.recipient_email}
                      onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} />
                  </div>
                  <Err m={errors.recipient_email} />
                </div>
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea rows={2} className="input resize-none" placeholder="Instruções especiais..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </motion.div>

          {/* Selecionar produtos */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-10 w-10 rounded-xl bg-brand-yellow-500 flex items-center justify-center text-neutral-900">
                <Package size={20} />
              </div>
              <div>
                <h3 className="font-bold">Produtos</h3>
                <p className="text-xs text-neutral-500">Escolha itens para expedir</p>
              </div>
            </div>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" className="input pl-11" placeholder="Pesquisar por nome ou SKU..."
                value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-6">Sem produtos disponíveis</p>
              ) : (
                filtered.map((p) => (
                  <div key={p.id} onClick={() => addToCart(p)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-neutral-500">{p.category} · {p.quantity} disp. · {formatCurrency(p.price)}</div>
                    </div>
                    <button type="button" className="ml-2 p-2 rounded-lg bg-brand-red-500 text-white hover:bg-brand-red-600 flex-shrink-0">
                      <Plus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Resumo - sticky */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-24 h-fit">
          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Send size={18} /> Resumo
            </h3>
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">Carrinho vazio</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((c) => (
                    <div key={c.product_id} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{c.product.name}</div>
                        <div className="text-xs text-neutral-500">{formatCurrency(c.product.price)} × {c.quantity}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateQty(c.product_id, -1)}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{c.quantity}</span>
                        <button type="button" onClick={() => updateQty(c.product_id, 1)}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                          <Plus size={12} />
                        </button>
                        <button type="button" onClick={() => removeFromCart(c.product_id)}
                          className="p-1 hover:bg-brand-red-100 text-brand-red-500 rounded ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Produtos</span>
                    <span>{cart.reduce((s, c) => s + c.quantity, 0)} unidades</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-brand-red-500">{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            )}
            {errors.cart && <Err m={errors.cart} />}
            <button type="submit" disabled={saving || cart.length === 0} className="w-full btn-primary mt-4">
              {saving ? 'A criar encomenda...' : (<><Send size={18} /> Criar encomenda</>)}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
