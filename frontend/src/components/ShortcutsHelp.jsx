import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const groups = [
  {
    title: 'Geral',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Abrir pesquisa rápida / comandos' },
      { keys: ['?'], label: 'Mostrar esta ajuda' },
      { keys: ['Esc'], label: 'Fechar diálogo aberto' }
    ]
  },
  {
    title: 'Navegação',
    items: [
      { keys: ['G', 'D'], label: 'Ir para Dashboard' },
      { keys: ['G', 'S'], label: 'Ir para Stock' },
      { keys: ['G', 'E'], label: 'Ir para Encomendas' },
      { keys: ['G', 'T'], label: 'Ir para Tracking' }
    ]
  },
  {
    title: 'Ações rápidas',
    items: [
      { keys: ['N', 'P'], label: 'Novo produto' },
      { keys: ['N', 'E'], label: 'Nova encomenda' }
    ]
  }
];

export default function ShortcutsHelp({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[95%] max-w-xl z-[70]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-red-500 text-white flex items-center justify-center">
                    <Keyboard size={16} />
                  </div>
                  <div>
                    <div className="font-bold">Atalhos de teclado</div>
                    <div className="text-xs text-neutral-500">Pressione <kbd className="font-mono px-1 rounded bg-neutral-100 dark:bg-neutral-800">?</kbd> a qualquer momento</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
                {groups.map((g) => (
                  <div key={g.title}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                      {g.title}
                    </div>
                    <div className="space-y-1.5">
                      {g.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <span className="text-sm">{it.label}</span>
                          <div className="flex items-center gap-1">
                            {it.keys.map((k, j) => (
                              <kbd
                                key={j}
                                className="px-2 py-1 text-[11px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-sm"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
