export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value) || 0);
};

const TZ = 'Europe/Lisbon';

// A base de dados (SQLite) grava as horas em UTC no formato "YYYY-MM-DD HH:MM:SS"
// (sem indicador de fuso). É preciso marcá-lo como UTC para não ser lido como hora local.
export const parseDBDate = (dateStr) => {
  if (dateStr == null) return null;
  if (typeof dateStr === 'number') return new Date(dateStr);
  let s = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }
  return new Date(s);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = parseDBDate(dateStr);
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = parseDBDate(dateStr);
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '-';
  const diff = Date.now() - parseDBDate(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (s < 60) return 'agora mesmo';
  if (m < 60) return `há ${m} min`;
  if (h < 24) return `há ${h}h`;
  if (d < 7) return `há ${d} dias`;
  return formatDateShort(dateStr);
};

export const getStockStatus = (product) => {
  if (product.quantity === 0) return { label: 'Sem Stock', color: 'red', key: 'out_of_stock' };
  if (product.quantity <= product.min_stock)
    return { label: 'Stock Baixo', color: 'yellow', key: 'low_stock' };
  return { label: 'Em Stock', color: 'green', key: 'in_stock' };
};

export const getOrderStatusInfo = (status) => {
  const map = {
    pending: { label: 'Pendente', color: 'yellow', icon: 'Clock' },
    shipped: { label: 'Expedida', color: 'blue', icon: 'Package' },
    in_transit: { label: 'Em Trânsito', color: 'purple', icon: 'Truck' },
    delivered: { label: 'Entregue', color: 'green', icon: 'CheckCircle' },
    cancelled: { label: 'Cancelada', color: 'red', icon: 'XCircle' }
  };
  return map[status] || { label: status, color: 'gray', icon: 'Circle' };
};
