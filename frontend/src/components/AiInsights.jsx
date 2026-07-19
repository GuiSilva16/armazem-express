import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { formatDate } from '../lib/format';
import api from '../lib/api';

/**
 * Card de "Insights com IA". Funcionalidade opcional: se o servidor não tiver
 * chave de API configurada (AI_API_KEY), mostra uma nota discreta em vez do conteúdo.
 */
export default function AiInsights() {
  const [state, setState] = useState({ loading: true });

  const load = async (force = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await api.get('/insights', force ? { params: { t: Date.now() } } : {});
      setState({ loading: false, ...data });
    } catch {
      setState({ loading: false, error: 'Não foi possível gerar insights neste momento.' });
    }
  };

  useEffect(() => { load(); }, []);

  // Não configurado → nota discreta (não polui o dashboard)
  if (!state.loading && state.configured === false) {
    return (
      <div className="card p-5 border-dashed">
        <div className="flex items-center gap-2 text-sm font-bold mb-1">
          <Sparkles size={16} className="text-brand-yellow-500" /> Insights com IA
        </div>
        <p className="text-xs text-neutral-500">
          Funcionalidade opcional. Configure <code className="font-mono">AI_API_KEY</code> no servidor para receber
          análises automáticas do armazém (ruturas, validades e prioridades).
        </p>
      </div>
    );
  }

  const lines = (state.insights || '')
    .split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} className="text-brand-yellow-500" /> Insights com IA
        </div>
        <button
          onClick={() => load(true)}
          disabled={state.loading}
          className="btn-ghost !py-1.5 !px-2.5 text-xs disabled:opacity-50"
          title="Gerar novamente"
        >
          <RefreshCw size={14} className={state.loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {state.loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500 py-6">
          <Loader2 size={16} className="animate-spin" /> A analisar o armazém…
        </div>
      ) : state.error ? (
        <p className="text-sm text-brand-red-500">{state.error}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="text-brand-yellow-500 flex-shrink-0">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
          {state.generated_at && (
            <p className="text-[11px] text-neutral-400 mt-3">
              Gerado {formatDate(state.generated_at)}{state.cached ? ' · em cache' : ''} · IA
            </p>
          )}
        </>
      )}
    </div>
  );
}
