import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    const v = localStorage.getItem('armazem_remember');
    return v === null ? true : v === 'true';
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  // Recuperação de palavra-passe (pede o email; o link chega por email)
  const [forgot, setForgot] = useState({ open: false, email: '', loading: false, sent: false });
  const submitForgot = async (e) => {
    e.preventDefault();
    setForgot((f) => ({ ...f, loading: true }));
    try {
      await api.post('/auth/forgot-password', { email: forgot.email.trim().toLowerCase() });
      setForgot((f) => ({ ...f, loading: false, sent: true }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar o pedido');
      setForgot((f) => ({ ...f, loading: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('armazem_remember', String(remember));
      await login(form.email.trim().toLowerCase(), form.password, remember);
      toast.success('Bem-vindo de volta! 👋');
      const redirect = sessionStorage.getItem('armazem_redirect');
      sessionStorage.removeItem('armazem_redirect');
      navigate(redirect || '/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') {
      setForm({ email: 'demo@armazem-express.pt', password: 'Demo@2025!' });
    } else {
      setForm({ email: 'funcionario@armazem-express.pt', password: 'Trabalhador@2025' });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado esquerdo - visual */}
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12">
        {/* Imagem de armazém de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/4481530/pexels-photo-4481530.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        />
        {/* Overlay vermelho da marca (leve, só para dar tom de marca) */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red-600/40 via-brand-red-700/30 to-brand-red-900/45 mix-blend-multiply" />
        {/* Escurecimento subtil em baixo para o texto se ler */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-brand-yellow-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-yellow-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-white">
          <Logo size="xl" showText={false} animated={false} />
          <h1 className="font-display text-5xl font-bold mt-8 leading-tight">
            Bem-vindo de volta.
          </h1>
          <p className="text-white/80 text-lg mt-4 leading-relaxed">
            Entre na sua conta e gira o seu armazém com a fluidez que sempre quis.
          </p>

          <div className="mt-12 space-y-4">
            {[
              'Stock em tempo real',
              'Expedições num clique',
              'Rastreio completo',
              'Equipa sincronizada'
            ].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-brand-yellow-300" />
                </div>
                <span className="font-semibold">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito - form */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 bg-white dark:bg-neutral-950 relative">
        <div className="absolute top-6 left-6">
          <Link to="/" className="text-sm font-semibold text-neutral-500 hover:text-brand-red-500 transition">
            ← Voltar ao site
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <h2 className="font-display text-4xl font-bold">Entrar</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Aceda à conta da sua empresa.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  required
                  type="email"
                  className="input pl-11"
                  placeholder="admin@minhaempresa.pt"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-11 pr-11"
                  placeholder="A sua password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-brand-red-500 focus:ring-brand-red-500 cursor-pointer"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => setForgot({ open: true, email: form.email, loading: false, sent: false })}
                className="text-sm font-semibold text-brand-red-500 hover:underline"
              >
                Esqueci-me da palavra-passe?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'A entrar...' : 'Entrar'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 p-4 bg-brand-yellow-50 dark:bg-brand-yellow-900/20 border border-brand-yellow-200 dark:border-brand-yellow-800 rounded-xl">
            <div className="text-xs font-bold text-brand-yellow-700 dark:text-brand-yellow-300 uppercase tracking-wider mb-2">
              🎯 Contas de demonstração
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 rounded-lg hover:bg-brand-red-500 hover:text-white transition"
              >
                Entrar como Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('employee')}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 rounded-lg hover:bg-brand-red-500 hover:text-white transition"
              >
                Entrar como Funcionário
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-neutral-500">
            Ainda não tem conta?{' '}
            <Link to="/#pricing" className="font-semibold text-brand-red-500 hover:underline">
              Ver planos
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Modal: pedir link de recuperação por email */}
      {forgot.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setForgot((f) => ({ ...f, open: false }))}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-neutral-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}>
            {forgot.sent ? (
              <div className="text-center py-2">
                <Mail size={40} className="text-brand-red-500 mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold mb-1">Verifique o seu email</h3>
                <p className="text-sm text-neutral-500">Se existir uma conta com esse email, enviámos um link para redefinir a palavra-passe. O link é válido durante 1 hora.</p>
                <button onClick={() => setForgot((f) => ({ ...f, open: false }))} className="btn-primary w-full mt-5">Fechar</button>
              </div>
            ) : (
              <form onSubmit={submitForgot}>
                <h3 className="font-display text-xl font-bold mb-1">Recuperar palavra-passe</h3>
                <p className="text-sm text-neutral-500 mb-4">Introduza o seu email e enviaremos um link para redefinir a palavra-passe.</p>
                <input type="email" required className="input" placeholder="o-seu@email.pt"
                  value={forgot.email} onChange={(e) => setForgot((f) => ({ ...f, email: e.target.value }))} />
                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" onClick={() => setForgot((f) => ({ ...f, open: false }))} className="btn-ghost">Cancelar</button>
                  <button type="submit" disabled={forgot.loading} className="btn-primary">{forgot.loading ? 'A enviar...' : 'Enviar link'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
