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
            <div className="bg-neutral-900 text-white rounded-t-3xl border-t border-neutral-700/60 shadow-2xl p-6 pb-8 max-h-[92vh] overflow-y-auto">
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
                  <div className="text-[11px] text-brand-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Smartphone size={13} /> Está a usar um telemóvel
                  </div>
                  <h3 className="font-bold text-xl leading-tight">Instala o Armazém Express</h3>
                  <p className="text-sm text-neutral-400 mt-1 mb-5">
                    Acede mais rápido e em ecrã inteiro, como se fosse uma app nativa.
                  </p>

                  {/* Mockup de dois iPhones com a app (fotorrealista, completos) */}
                  <div className="relative h-[360px] mb-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow-400/15 via-brand-red-500/15 to-transparent blur-3xl" />
                    {/* sombra no "chão" para grounding */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-56 h-8 bg-black/70 blur-2xl rounded-[50%]" />

                    {/* iPhone de trás — lista de stock */}
                    <div className="absolute left-1/2 top-1 -translate-x-[90%] rotate-[8deg] w-[150px] aspect-[9/16] rounded-[2.2rem] bg-black p-[3px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                      <div className="relative h-full w-full rounded-[2.05rem] overflow-hidden bg-neutral-950">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-black rounded-full z-20" />
                        <div className="pt-7 px-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <img src="/logo.png" alt="" className="h-4 w-4 rounded-md" />
                            <span className="text-[8px] font-extrabold text-white">Stock</span>
                          </div>
                          <div className="rounded-md bg-neutral-800 h-4 flex items-center px-1.5"><span className="text-[6px] text-neutral-500">Pesquisar produto…</span></div>
                          {[['Chocolate Negro', '8', 'y'], ['Rato Logitech', '3', 'y'], ['Teclado K2', '0', 'r'], ['Azeite 750ml', '85', 'g'], ['Camisa Azul', '40', 'g']].map(([n, v, t], i) => (
                            <div key={i} className="flex items-center justify-between rounded-md bg-neutral-800 p-1.5">
                              <div className="min-w-0">
                                <div className="text-[6px] font-semibold text-neutral-200 truncate">{n}</div>
                                <div className="h-[3px] w-6 bg-neutral-700 rounded mt-0.5" />
                              </div>
                              <span className={`text-[7px] font-bold ml-1 ${t === 'g' ? 'text-green-400' : t === 'y' ? 'text-brand-yellow-400' : 'text-brand-red-400'}`}>{v} un.</span>
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 pointer-events-none" />
                      </div>
                    </div>

                    {/* iPhone da frente — dashboard */}
                    <div className="absolute left-1/2 top-4 -translate-x-[10%] -rotate-[6deg] w-[178px] aspect-[9/16] rounded-[2.5rem] bg-black p-[3px] shadow-[0_30px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/15 z-10">
                      <div className="relative h-full w-full rounded-[2.25rem] overflow-hidden bg-neutral-950">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20" />
                        <div className="pt-8 px-2.5 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <img src="/logo.png" alt="" className="h-5 w-5 rounded-md" />
                            <span className="text-[9px] font-extrabold text-white">Armazém <span className="text-brand-red-400">Express</span></span>
                          </div>
                          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-red-500 to-brand-red-700 p-2.5">
                            <div className="text-[7px] text-white/80">Boa noite, Guilherme 👋</div>
                            <div className="text-[12px] font-bold text-white leading-tight">Demo PME Logística</div>
                            <div className="text-[6px] text-white/70 mt-0.5">Plano Business · 1247 produtos</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[['1247', 'text-brand-red-400'], ['1180', 'text-green-400'], ['52', 'text-brand-yellow-400']].map(([v, c], i) => (
                              <div key={i} className="rounded-lg bg-neutral-800 p-1.5 text-center">
                                <div className={`text-[12px] font-bold leading-none ${c}`}>{v}</div>
                                <div className="text-[5px] text-neutral-500 mt-0.5">{['Produtos', 'Stock', 'Baixo'][i]}</div>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-lg bg-neutral-800 p-2">
                            <div className="text-[6px] text-neutral-500 mb-1">Movimento de Stock</div>
                            <svg viewBox="0 0 100 26" className="w-full h-6">
                              <path d="M0,20 C15,18 25,9 40,11 C55,13 65,5 80,7 C90,8 95,13 100,11" fill="none" stroke="#22c55e" strokeWidth="2.5" />
                              <path d="M0,23 C15,22 25,17 40,18 C55,19 65,14 80,15 C90,16 95,19 100,18" fill="none" stroke="#e63946" strokeWidth="2.5" />
                            </svg>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-neutral-800 p-1.5">
                            <div className="text-[6px] font-semibold text-neutral-200">João Silva</div>
                            <span className="text-[5px] font-bold px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-400">Entregue</span>
                          </div>
                        </div>
                        {/* reflexo de vidro */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/15 pointer-events-none" />
                        <div className="absolute -left-2 top-0 bottom-0 w-1/3 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {['Acesso instantâneo num toque', 'Funciona em ecrã inteiro', 'Sem ocupar espaço no telemóvel'].map((b) => (
                      <div key={b} className="flex items-center gap-2.5 text-sm text-neutral-200">
                        <Check size={16} className="text-green-400 flex-shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={device.isAndroid ? handleAndroidInstall : () => setStep(1)}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white rounded-2xl font-bold transition shadow-lg shadow-brand-red-500/20 mb-2"
                  >
                    Adicionar ao ecrã principal
                  </button>
                  <button
                    onClick={() => dismiss(true)}
                    className="w-full py-2.5 text-neutral-400 font-semibold text-sm hover:text-white transition"
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
