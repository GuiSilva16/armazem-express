import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Mail, Shield, Copy, CheckCircle2, UserCheck, UserX, AlertCircle, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, Modal, EmptyState } from '../components/ui';
import api from '../lib/api';
import { formatDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Team() {
  const { user, plan } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Acesso restrito a administradores');
      navigate('/app');
      return;
    }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Nome inválido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreating(true);
    try {
      const { data } = await api.post('/users', form);
      setCredentials({ email: form.email, password: data.password, name: form.name });
      setForm({ name: '', email: '', role: 'employee' });
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar utilizador');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      toast.success('Estado atualizado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('Utilizador removido');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    }
  };

  const usedSlots = users.length;
  const maxSlots = plan?.max_employees === -1 ? '∞' : (plan?.max_employees || 0);
  const canAdd = plan?.max_employees === -1 || usedSlots < (plan?.max_employees || 0);

  return (
    <div>
      <PageHeader
        title="Equipa"
        subtitle={`${usedSlots} de ${maxSlots} ${maxSlots === 1 ? 'utilizador' : 'utilizadores'} · Plano ${plan?.name}`}
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!canAdd}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            <Plus size={16} /> Adicionar funcionário
          </button>
        }
      />

      {!canAdd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card p-4 mb-4 border-2 border-brand-yellow-300 dark:border-brand-yellow-700 bg-brand-yellow-50 dark:bg-brand-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-brand-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-brand-yellow-700 dark:text-brand-yellow-300">Limite atingido</div>
              <p className="text-sm text-brand-yellow-700/90 dark:text-brand-yellow-300/90 mt-1">
                O seu plano <strong>{plan?.name}</strong> permite até {maxSlots} utilizadores. Faça upgrade para adicionar mais.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="Sem utilizadores"
            description="Adicione o primeiro funcionário à sua empresa."
            action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={18}/> Adicionar</button>}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                <div className={`h-14 w-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg ${
                  u.role === 'admin' ? 'bg-gradient-to-br from-brand-yellow-500 to-brand-red-500' : 'bg-gradient-to-br from-brand-red-500 to-brand-red-700'
                }`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold truncate">{u.name}</div>
                    {u.role === 'admin' && (
                      <span className="chip bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-400">
                        <Crown size={10} /> Admin
                      </span>
                    )}
                    {!u.active && (
                      <span className="chip bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-500 flex items-center gap-1 mt-1 truncate">
                    <Mail size={12} /> {u.email}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Criado {formatDate(u.created_at)}
                  </div>
                </div>
              </div>

              {u.id !== user.id && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleToggle(u.id)}
                    className="flex-1 btn-outline !py-2 text-sm"
                  >
                    {u.active ? (<><UserX size={14}/> Desativar</>) : (<><UserCheck size={14}/> Ativar</>)}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="px-3 py-2 rounded-lg border border-brand-red-200 text-brand-red-500 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 text-sm font-semibold"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {u.id === user.id && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 italic text-center">
                  ↑ Esta é a sua conta
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Criar */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Adicionar funcionário" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-brand-red-500' : ''}`}
              placeholder="João Silva"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            {errors.name && <div className="text-xs text-brand-red-500 mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className={`input ${errors.email ? 'border-brand-red-500' : ''}`}
              placeholder="joao@minhaempresa.pt"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <div className="text-xs text-brand-red-500 mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="label">Permissões</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Funcionário (operar stock e encomendas)</option>
              <option value="admin">Administrador (acesso total)</option>
            </select>
          </div>
          <div className="p-3 bg-brand-yellow-50 dark:bg-brand-yellow-900/20 border border-brand-yellow-200 rounded-xl text-xs text-brand-yellow-700 dark:text-brand-yellow-300">
            🔑 Uma password forte será gerada automaticamente. Mostraremos uma única vez — guarde bem.
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost !py-2">Cancelar</button>
            <button type="submit" disabled={creating} className="btn-primary !py-2 !px-4">
              {creating ? 'A criar...' : 'Criar utilizador'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credenciais geradas */}
      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="🔐 Utilizador criado" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl flex items-start gap-2">
            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Conta de <strong>{credentials?.name}</strong> criada com sucesso. <strong>Guarde estas credenciais e partilhe-as de forma segura.</strong>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Email</div>
            <div className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">{credentials?.email}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Password gerada</div>
            <div className="font-mono text-sm bg-brand-yellow-100 dark:bg-brand-yellow-900/30 border border-brand-yellow-300 p-3 rounded-lg font-bold break-all">
              {credentials?.password}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(credentials.password);
                toast.success('Password copiada');
              }}
              className="text-xs text-brand-red-500 font-semibold mt-2 hover:underline flex items-center gap-1"
            >
              <Copy size={12} /> Copiar password
            </button>
          </div>
          <button onClick={() => setCredentials(null)} className="w-full btn-primary">Fechar</button>
        </div>
      </Modal>

      {/* Confirmar delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover utilizador" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm">
            Tem a certeza que quer remover <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? Esta ação é irreversível.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost !py-2">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-brand-red-500 text-white rounded-full font-semibold hover:bg-brand-red-600 transition">
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
