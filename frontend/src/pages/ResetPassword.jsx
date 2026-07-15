import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import api from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('As palavras-passe não coincidem');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Palavra-passe alterada com sucesso!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível redefinir. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-8"
      >
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>

        {!token ? (
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-2">Link inválido</h2>
            <p className="text-sm text-neutral-500 mb-6">Este link de recuperação não é válido. Peça um novo a partir do login.</p>
            <Link to="/login" className="btn-primary inline-flex">Ir para o login</Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold mb-2">Palavra-passe alterada!</h2>
            <p className="text-sm text-neutral-500">A redirecionar para o login…</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-1">Nova palavra-passe</h2>
            <p className="text-sm text-neutral-500 mb-6">Defina a sua nova palavra-passe.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Nova palavra-passe</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    required type={show ? 'text' : 'password'} className="input pl-11 pr-11"
                    placeholder="Mín. 8, maiúscula, número e símbolo"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar palavra-passe</label>
                <input
                  required type={show ? 'text' : 'password'} className="input"
                  placeholder="Repita a palavra-passe"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'A guardar...' : 'Redefinir palavra-passe'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
