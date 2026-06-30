import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, Plus, Pencil, Trash2, Mail, Phone, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, Modal, EmptyState } from '../components/ui';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', email: '', phone: '', nif: '', address: '', notes: '' };

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { ...supplier } (id presente = edição)
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/suppliers').then(({ data }) => setSuppliers(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!modal.name || modal.name.trim().length < 2) {
      toast.error('Indique o nome do fornecedor');
      return;
    }
    setSaving(true);
    try {
      if (modal.id) await api.put(`/suppliers/${modal.id}`, modal);
      else await api.post('/suppliers', modal);
      toast.success(modal.id ? 'Fornecedor atualizado' : 'Fornecedor criado');
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Eliminar o fornecedor "${s.name}"? Os produtos associados ficam sem fornecedor.`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      toast.success('Fornecedor eliminado');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao eliminar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Fornecedores"
        subtitle="Gerir os fornecedores da empresa e associá-los aos produtos."
        actions={isAdmin && (
          <button onClick={() => setModal({ ...EMPTY })} className="btn-primary">
            <Plus size={18} /> Novo fornecedor
          </button>
        )}
      />

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Ainda não há fornecedores"
          description="Crie fornecedores para organizar as suas reposições de stock."
          action={isAdmin && (
            <button onClick={() => setModal({ ...EMPTY })} className="btn-primary"><Plus size={18}/> Criar o primeiro</button>
          )}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-brand-red-500/10 text-brand-red-500 flex items-center justify-center">
                  <Factory size={20} />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ ...EMPTY, ...s })} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => remove(s)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-brand-red-500" title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
              <h3 className="font-bold mt-3">{s.name}</h3>
              {s.nif && <p className="text-xs text-neutral-500">NIF {s.nif}</p>}
              <div className="mt-3 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                {s.email && <div className="flex items-center gap-2 truncate"><Mail size={14} className="text-neutral-400 flex-shrink-0"/> <span className="truncate">{s.email}</span></div>}
                {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-neutral-400"/> {s.phone}</div>}
              </div>
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-neutral-500">
                <Package size={13} /> {s.product_count} produto(s)
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar fornecedor' : 'Novo fornecedor'}>
        {modal && (
          <div className="space-y-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Email</label>
                <input className="input" value={modal.email || ''} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></div>
              <div><label className="label">Telefone</label>
                <input className="input" value={modal.phone || ''} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /></div>
              <div><label className="label">NIF</label>
                <input className="input" value={modal.nif || ''} onChange={(e) => setModal({ ...modal, nif: e.target.value })} /></div>
              <div><label className="label">Morada</label>
                <input className="input" value={modal.address || ''} onChange={(e) => setModal({ ...modal, address: e.target.value })} /></div>
            </div>
            <div><label className="label">Notas</label>
              <textarea className="input" rows={2} value={modal.notes || ''} onChange={(e) => setModal({ ...modal, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal(null)} className="btn-ghost">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
