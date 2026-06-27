import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, BarChart3, QrCode, Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KEY = 'armazem_onboarded';

const STEPS = [
  { icon: Package, title: 'Gere o seu stock', desc: 'Adicione produtos com SKU e QR, ajuste quantidades e receba alertas de stock baixo.', color: 'bg-brand-red-500' },
  { icon: Truck, title: 'Expeça encomendas', desc: 'Crie envios com validação PT, desconto automático de stock e número de rastreio.', color: 'bg-blue-500' },
  { icon: BarChart3, title: 'Acompanhe tudo', desc: 'Dashboard e relatórios em tempo real, com gráficos e previsão de rutura.', color: 'bg-green-500' },
  { icon: QrCode, title: 'Digitalize com o telemóvel', desc: 'Leia o QR dos produtos pela câmara e imprima etiquetas num clique.', color: 'bg-brand-yellow-500' }
];

export default function Onboarding() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, [user]);

  const close = () => {
    localStorage.setItem(KEY, new Date().toISOString());
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[121] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-full max-w-lg my-auto"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="relative bg-gradient-to-br from-brand-red-500 to-brand-red-700 p-6 text-white">
                <button onClick={close} aria-label="Fechar" className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition">
                  <X size={16} />
                </button>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full mb-3">
                  <Sparkles size={12} /> Bem-vindo
                </div>
                <h2 className="font-display text-2xl font-bold">Olá, {user?.name?.split(' ')[0]}! 👋</h2>
                <p className="text-white/85 text-sm mt-1">Eis o que pode fazer com o Armazém Express:</p>
              </div>

              <div className="p-6 space-y-3">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center text-white flex-shrink-0`}>
                      <s.icon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{s.title}</div>
                      <div className="text-xs text-neutral-500">{s.desc}</div>
                    </div>
                  </motion.div>
                ))}

                <div className="flex gap-2 pt-3">
                  <button onClick={close} className="flex-1 btn-ghost !py-2.5">Explorar sozinho</button>
                  <button
                    onClick={() => { close(); navigate('/app/stock/add'); }}
                    className="flex-1 btn-primary !py-2.5"
                  >
                    Adicionar 1.º produto <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
