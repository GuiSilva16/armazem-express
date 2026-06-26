import { Calendar } from 'lucide-react';

/**
 * Filtro de intervalo de datas (de / até).
 * Devolve strings 'YYYY-MM-DD'. Usar com filterByRange para filtrar por created_at.
 */
export default function DateRange({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={16} className="text-neutral-400" />
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="input !py-1.5 !px-2.5 text-sm w-auto"
        title="Data inicial"
      />
      <span className="text-neutral-400 text-sm">até</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="input !py-1.5 !px-2.5 text-sm w-auto"
        title="Data final"
      />
      {(from || to) && (
        <button
          onClick={() => onChange('', '')}
          className="text-xs font-semibold text-brand-red-500 hover:underline"
        >
          Limpar
        </button>
      )}
    </div>
  );
}

/** Filtra um array por um campo de data dentro do intervalo [from, to]. */
export function filterByRange(rows, field, from, to) {
  if (!from && !to) return rows;
  const start = from ? new Date(from + 'T00:00:00') : null;
  const end = to ? new Date(to + 'T23:59:59') : null;
  return rows.filter((r) => {
    const d = new Date(r[field]);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}
