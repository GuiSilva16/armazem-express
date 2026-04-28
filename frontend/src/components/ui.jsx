import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const StatCard = ({ icon: Icon, label, value, subtitle, color = 'red', trend, index = 0 }) => {
  const colors = {
    red: 'from-brand-red-500 to-brand-red-600 shadow-brand',
    yellow: 'from-brand-yellow-500 to-brand-yellow-600 shadow-brand-yellow',
    green: 'from-green-500 to-green-600 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.4)]',
    blue: 'from-blue-500 to-blue-600 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.4)]',
    neutral: 'from-neutral-700 to-neutral-900'
  };
  const textColors = {
    red: 'text-brand-red-500',
    yellow: 'text-brand-yellow-600',
    green: 'text-green-500',
    blue: 'text-blue-500',
    neutral: 'text-neutral-700 dark:text-neutral-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="card p-5 overflow-hidden relative group"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${colors[color]} opacity-20 group-hover:opacity-40 transition-opacity`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
            {Icon && <Icon size={22} />}
          </div>
          {trend !== undefined && trend !== null && (
            <div className={`text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-brand-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`text-3xl font-bold font-display ${textColors[color]}`}>
          {value}
        </div>
        <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
          {label}
        </div>
        {subtitle && (
          <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
};

export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`pointer-events-auto w-full ${maxWidth} bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

export const StatusBadge = ({ status, size = 'sm' }) => {
  const map = {
    in_stock: { label: 'Em Stock', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    low_stock: { label: 'Stock Baixo', classes: 'bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-400' },
    out_of_stock: { label: 'Sem Stock', classes: 'bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-400' },
    pending: { label: 'Pendente', classes: 'bg-brand-yellow-100 text-brand-yellow-700 dark:bg-brand-yellow-900/30 dark:text-brand-yellow-400' },
    shipped: { label: 'Expedida', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    in_transit: { label: 'Em Trânsito', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    delivered: { label: 'Entregue', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    cancelled: { label: 'Cancelada', classes: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400' }
  };
  const info = map[status] || { label: status, classes: 'bg-neutral-100 text-neutral-700' };
  const sizeCl = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${info.classes} ${sizeCl}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {info.label}
    </span>
  );
};

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold font-display">{title}</h1>
      {subtitle && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Icon size={32} className="text-neutral-400" />
      </div>
    )}
    <h3 className="text-lg font-bold mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-neutral-500 max-w-md mb-4">{description}</p>
    )}
    {action}
  </div>
);

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizes[size]} rounded-full border-4 border-brand-yellow-200 dark:border-neutral-800 border-t-brand-red-500 animate-spin`} />
    </div>
  );
};
