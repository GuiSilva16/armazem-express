import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 rounded-full border-4 border-brand-yellow-200 dark:border-neutral-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-red-500 border-r-brand-red-500"></div>
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest"
        >
          Armazém Express
        </motion.div>
      </div>
    </div>
  );
}
