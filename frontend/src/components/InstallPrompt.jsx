import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Share, Plus, X, Check } from 'lucide-react';
import Logo from './Logo';

const STORAGE_KEY = 'armazem_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectDevice() {
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isMobile =
    isIOS ||
    isAndroid ||
    (window.matchMedia?.('(max-width: 768px)').matches && 'ontouchstart' in window);
  return { isIOS, isAndroid, isMobile };
}

/**
 * Deteta telemóvel e sugere "Adicionar ao Ecrã Principal" (PWA / A2HS).
 * iOS Safari: instruções manuais (Partilhar → Adicionar ao Ecrã Principal).
 * Android Chrome: usa o evento nativo beforeinstallprompt quando disponível.
 * A escolha de dispensar fica guardada em localStorage.
 */
export default function InstallPrompt() {
  const [device, setDevice] = useState({ isIOS: false, isAndroid: false, isMobile: false });
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0 = aviso inicial, 1 = instruções
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (isStandalone()) return; // já está instalado, não mostra
    if (localStorage.getItem(STORAGE_KEY)) return; // já dispensou

    const d = detectDevice();
    setDevice(d);
    if (!d.isMobile) return;

    // Android: captura o evento nativo de instalação
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const t = setTimeout(() => setVisible(true), 1500);
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const dismiss = (remember = true) => {
    if (remember) localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss(true);
      setDeferredPrompt(null);
    } else {
      setStep(1); // fallback: instruções manuais
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismiss(false)}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[111] md:hidden"
          >
            <div className="bg-neutral-900 text-white rounded-t-3xl border-t border-neutral-700/60 shadow-2xl p-6 pb-8">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-5" />

              <button
                onClick={() => dismiss(false)}
                aria-label="Fechar"
                className="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
              >
                <X size={18} />
              </button>

              {step === 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-yellow-400 to-brand-red-500 flex items-center justify-center shadow-lg">
                      <Smartphone size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-brand-yellow-400 font-bold uppercase tracking-wider">
                        Está a usar um telemóvel
                      </div>
                      <h3 className="font-bold text-lg leading-tight">Instala o Armazém Express</h3>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed mb-5">
                    Adiciona a aplicação ao ecrã principal do teu telemóvel para acederes mais rápido,
                    em ecrã inteiro, como se fosse uma app nativa.
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {['Acesso instantâneo num toque', 'Funciona em ecrã inteiro', 'Sem ocupar espaço como uma app'].map((b) => (
                      <div key={b} className="flex items-center gap-2.5 text-sm text-neutral-200">
                        <Check size={16} className="text-green-400 flex-shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={device.isAndroid ? handleAndroidInstall : () => setStep(1)}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white rounded-2xl font-bold transition shadow-lg shadow-brand-red-500/20 mb-2.5"
                  >
                    Adicionar ao ecrã principal
                  </button>
                  <button
                    onClick={() => dismiss(true)}
                    className="w-full py-3 text-neutral-400 font-semibold text-sm hover:text-white transition"
                  >
                    Agora não
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <Logo size="sm" animated={false} />
                  </div>

                  <h3 className="font-bold text-lg mb-1">Em 3 passos simples</h3>
                  <p className="text-sm text-neutral-400 mb-5">
                    {device.isIOS ? 'No Safari do teu iPhone:' : 'No teu navegador:'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-neutral-800/60 rounded-2xl">
                      <div className="h-7 w-7 rounded-full bg-brand-red-500 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                      <div className="text-sm flex items-center gap-1.5 flex-wrap">
                        Toca no botão
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md font-semibold">
                          Partilhar <Share size={13} />
                        </span>
                        {device.isIOS ? 'na barra do Safari.' : 'do navegador.'}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-neutral-800/60 rounded-2xl">
                      <div className="h-7 w-7 rounded-full bg-brand-red-500 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                      <div className="text-sm flex items-center gap-1.5 flex-wrap">
                        Desce e escolhe
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-700 rounded-md font-semibold">
                          Adicionar ao Ecrã Principal <Plus size={13} />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-neutral-800/60 rounded-2xl">
                      <div className="h-7 w-7 rounded-full bg-brand-red-500 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                      <div className="text-sm">
                        Confirma em <span className="font-semibold text-brand-yellow-400">"Adicionar"</span>. Pronto, já tens o Armazém Express no teu ecrã!
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => dismiss(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white rounded-2xl font-bold transition shadow-lg shadow-brand-red-500/20"
                  >
                    Percebido
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
