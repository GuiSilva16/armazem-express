import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'armazem_cookie_consent';

/**
 * Banner de consentimento de cookies.
 * Guarda a escolha em localStorage para não voltar a aparecer.
 * Valores guardados: 'all' (aceitou tudo) ou 'essential' (apenas essenciais).
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Só mostra se ainda não houver decisão guardada
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // pequeno atraso para não competir com o carregamento da página
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem(`${STORAGE_KEY}_at`, new Date().toISOString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 md:bottom-5 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-2xl md:w-[calc(100%-2rem)]"
        >
          <div className="bg-neutral-900/95 backdrop-blur-xl text-white rounded-2xl border border-neutral-700/60 shadow-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
              <div className="flex-shrink-0 hidden sm:flex">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-yellow-400 to-brand-red-500 flex items-center justify-center shadow-lg shadow-brand-red-500/20">
                  <Cookie size={24} className="text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Cookie size={18} className="text-brand-yellow-400 sm:hidden" />
                  <h3 className="font-bold text-base">Usamos cookies</h3>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  O Armazém Express utiliza cookies para garantir a melhor experiência possível. Os
                  cookies essenciais são necessários para o funcionamento do site (autenticação, sessão).{' '}
                  <button
                    onClick={() => setShowDetails((s) => !s)}
                    className="text-brand-yellow-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    {showDetails ? 'Esconder detalhes' : 'Saber mais'}
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </p>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 border-t border-neutral-700/60 pt-4">
                        <div className="flex items-start gap-2.5">
                          <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold">Cookies essenciais (obrigatórios)</div>
                            <div className="text-xs text-neutral-400">
                              Autenticação, sessão de utilizador, preferências básicas. Sem estes, o site não funciona.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="h-4 w-4 rounded-full border-2 border-neutral-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold">Cookies analíticos (opcionais)</div>
                            <div className="text-xs text-neutral-400">
                              Ajudam-nos a perceber como usas a plataforma para melhorar a experiência.
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                  <button
                    onClick={() => decide('all')}
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-brand-red-500 to-brand-red-600 hover:from-brand-red-600 hover:to-brand-red-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-brand-red-500/20 order-1 sm:order-2"
                  >
                    Aceitar tudo
                  </button>
                  <button
                    onClick={() => decide('essential')}
                    className="flex-1 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold text-sm transition border border-neutral-700 order-2 sm:order-1"
                  >
                    Apenas essenciais
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
