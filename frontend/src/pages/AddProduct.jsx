import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Package, Tag, MapPin, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui';
import api from '../lib/api';

export default function AddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    min_stock: '5',
    price: '',
    shelf: '',
    supplier: ''
  });

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Nome deve ter pelo menos 2 caracteres';
    if (!form.category) e.category = 'Selecione ou crie uma categoria';
    if (form.quantity === '' || Number(form.quantity) < 0 || !Number.isInteger(Number(form.quantity)))
      e.quantity = 'Quantidade deve ser um inteiro ≥ 0';
    if (form.min_stock === '' || Number(form.min_stock) < 0 || !Number.isInteger(Number(form.min_stock)))
      e.min_stock = 'Stock mínimo deve ser um inteiro ≥ 0';
    if (form.price === '' || Number(form.price) < 0 || isNaN(Number(form.price)))
      e.price = 'Preço deve ser um valor ≥ 0';
    if (!form.shelf || form.shelf.trim().length === 0) e.shelf = 'Localização (prateleira) é obrigatória';
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
      const finalCategory = form.category === '__new__' ? newCat.trim() : form.category;
      const { data } = await api.post('/products', {
        ...form,
        category: finalCategory,
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        price: Number(form.price)
      });
      toast.success(`Produto "${data.name}" criado com sucesso!`);
      navigate(`/app/stock/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar produto');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, required, error, hint, children }) => (
    <div>
      <label className="label">
        {label} {required && <span className="text-brand-red-500">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 text-xs text-brand-red-500 mt-1.5">
          <AlertCircle size={12} /> {error}
        </div>
      )}
      {hint && !error && <p className="text-xs text-neutral-500 mt-1.5">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/app/stock')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-red-500 mb-4 font-semibold"
      >
        <ArrowLeft size={16} /> Voltar ao stock
      </button>

      <PageHeader
        title="Adicionar Produto"
        subtitle="Preencha os detalhes do novo produto. O SKU e QR Code são gerados automaticamente."
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Info principal */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-xl bg-brand-red-500 flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold">Informação do Produto</h3>
              <p className="text-xs text-neutral-500">Dados principais</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Nome do produto" required error={errors.name}>
              <input
                type="text"
                className={`input ${errors.name ? 'border-brand-red-500' : ''}`}
                placeholder="Ex: Portátil HP Pavilion 15"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>

            <Field label="Descrição">
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Descrição detalhada do produto (opcional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Categoria" required error={errors.category}>
                <select
                  className={`input ${errors.category ? 'border-brand-red-500' : ''}`}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__new__">+ Criar nova categoria</option>
                </select>
                {form.category === '__new__' && (
                  <input
                    type="text"
                    className="input mt-2"
                    placeholder="Nome da nova categoria"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  />
                )}
              </Field>

              <Field label="Fornecedor">
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do fornecedor (opcional)"
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-xl bg-brand-yellow-500 flex items-center justify-center text-neutral-900">
              <Hash size={20} />
            </div>
            <div>
              <h3 className="font-bold">Stock e Preço</h3>
              <p className="text-xs text-neutral-500">Quantidades e valores</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Quantidade inicial" required error={errors.quantity}>
              <input
                type="number"
                min="0"
                step="1"
                className={`input ${errors.quantity ? 'border-brand-red-500' : ''}`}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </Field>

            <Field label="Stock mínimo" required error={errors.min_stock} hint="Alerta abaixo deste valor">
              <input
                type="number"
                min="0"
                step="1"
                className={`input ${errors.min_stock ? 'border-brand-red-500' : ''}`}
                placeholder="5"
                value={form.min_stock}
                onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))}
              />
            </Field>

            <Field label="Preço unitário (€)" required error={errors.price}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`input ${errors.price ? 'border-brand-red-500' : ''}`}
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        {/* Localização */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold">Localização no Armazém</h3>
              <p className="text-xs text-neutral-500">Prateleira onde o produto fica</p>
            </div>
          </div>

          <Field
            label="Prateleira"
            required
            error={errors.shelf}
            hint="Formato sugerido: Secção-Corredor-Prateleira (ex: A-01-03)"
          >
            <input
              type="text"
              className={`input font-mono ${errors.shelf ? 'border-brand-red-500' : ''}`}
              placeholder="A-01-03"
              value={form.shelf}
              onChange={(e) => setForm((f) => ({ ...f, shelf: e.target.value.toUpperCase() }))}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end sticky bottom-0 bg-neutral-50 dark:bg-neutral-950 py-4 -mx-4 px-4 border-t border-neutral-200 dark:border-neutral-800 md:static md:bg-transparent md:border-0 md:mx-0 md:py-0">
          <button type="button" onClick={() => navigate('/app/stock')} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'A guardar...' : (<><Save size={18} /> Guardar produto</>)}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
