import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Logo from '../components/Logo';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Sessão de pagamento não encontrada.');
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 8;
    const poll = async () => {
      try {
        const { data } = await api.get(`/billing/session/${sessionId}`);
        if (data.paid && data.credentials) {
          setData(data);
          setLoading(false);
          return;
        }
        if (++attempts >= maxAttempts) {
          setData(data);
          setLoading(false);
          return;
        }
        setTimeout(poll, 1500);
      } catch (err) {
        setError(err.response?.data?.error || 'Erro a verificar pagamento.');
        setLoading(false);
      }
    };
    poll();
  }, [sessionId]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-yellow-50 via-white to-brand-red-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-brutal p-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin mx-auto text-brand-yellow-500" />
            <h1 className="font-display text-2xl font-bold mt-4">A confirmar pagamento…</h1>
            <p className="text-sm text-neutral-500 mt-2">Aguarde enquanto ativamos a sua conta.</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <h1 className="font-display text-2xl font-bold text-red-600">Algo correu mal</h1>
            <p className="text-sm text-neutral-500 mt-2">{error}</p>
            <Link to="/" className="btn-primary mt-6 inline-flex">Voltar ao início</Link>
          </div>
        )}

        {!loading && data?.credentials && (
          <>
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 size={64} className="text-green-500" />
              <h1 className="font-display text-3xl font-bold mt-4">Pagamento confirmado!</h1>
              <p className="text-sm text-neutral-500 mt-2">
                A sua subscrição do plano <strong>{data.credentials.plan_name}</strong> está ativa.
              </p>
            </div>

            <div className="mt-6 p-4 bg-brand-yellow-50 dark:bg-brand-yellow-900/20 border-2 border-brand-yellow-300 dark:border-brand-yellow-800 rounded-2xl">
              <div className="text-xs font-bold text-brand-yellow-700 dark:text-brand-yellow-300 uppercase tracking-wider mb-3">
                Credenciais de acesso (guarde já!)
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Email</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-neutral-800 px-3 py-2 rounded-lg text-sm">
                      {data.credentials.email}
                    </code>
                    <button onClick={() => copy(data.credentials.email)} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg" aria-label="Copiar email">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1">Password (gerada automaticamente)</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-neutral-800 px-3 py-2 rounded-lg text-sm font-mono">
                      {data.credentials.password}
                    </code>
                    <button onClick={() => copy(data.credentials.password)} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg" aria-label="Copiar password">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-500 mt-3">
                Esta password é mostrada uma única vez. Pode alterá-la nas definições depois de entrar.
              </p>
            </div>

            <Link to="/login" className="btn-primary w-full mt-6 justify-center">
              Entrar no painel <ArrowRight size={18} />
            </Link>
          </>
        )}

        {!loading && !error && !data?.credentials && (
          <div className="text-center py-8">
            <h1 className="font-display text-2xl font-bold">Pagamento recebido</h1>
            <p className="text-sm text-neutral-500 mt-2">
              A processar a sua conta. Pode demorar alguns segundos — verifique o seu email em breve.
            </p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">Ir para login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
