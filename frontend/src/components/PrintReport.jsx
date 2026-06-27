import { useAuth } from '../context/AuthContext';

/**
 * Relatório limpo para impressão / exportação em PDF.
 * Fica escondido no ecrã (.print-only) e só aparece ao imprimir.
 *
 * props:
 *  - title, subtitle
 *  - columns: [{ label, align?, render(row) }]
 *  - rows: array de dados
 *  - summary: [{ label, value }] (cartões em destaque no topo)
 *  - breakdown: [{ label, value, color }] (barra de distribuição visual)
 */
export default function PrintReport({ title, subtitle, columns, rows, summary = [], breakdown = [] }) {
  const { user, company } = useAuth();
  const now = new Date();
  const breakdownTotal = breakdown.reduce((s, b) => s + b.value, 0) || 1;

  const addressLine = [company?.address, [company?.postal_code, company?.city].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ');
  const contactLine = [company?.phone, company?.vat ? `NIF ${company.vat}` : ''].filter(Boolean).join(' · ');

  return (
    <div className="print-only text-black text-[12px] leading-snug">
      {/* Cabeçalho com logo */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Armazém Express" className="w-14 h-14 rounded-lg" />
          <div>
            <div className="text-[22px] font-bold leading-tight">{title}</div>
            <div className="text-sm text-black/70 font-semibold">{user?.companyName}</div>
            {addressLine && <div className="text-[11px] text-black/60">{addressLine}</div>}
            {contactLine && <div className="text-[11px] text-black/60">{contactLine}</div>}
            <div className="text-[11px] text-black/60">
              {subtitle ? `${subtitle} · ` : ''}{rows.length} {rows.length === 1 ? 'registo' : 'registos'}
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-black/70">
          <div>{now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div>{now.toLocaleTimeString('pt-PT')}</div>
        </div>
      </div>

      {/* Resumo visual no topo */}
      {summary.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {summary.map((s, i) => (
            <div key={i} className="border border-black/25 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wide text-black/60">{s.label}</div>
              <div className="text-xl font-bold mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de distribuição */}
      {breakdown.length > 0 && (
        <div className="mb-5">
          <div className="flex h-4 rounded-full overflow-hidden border border-black/20">
            {breakdown.map((b, i) => (
              <div key={i} style={{ width: `${(b.value / breakdownTotal) * 100}%`, backgroundColor: b.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[10px]">
            {breakdown.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                {b.label}: <strong>{b.value}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabela */}
      {rows.length === 0 ? (
        <div className="text-sm italic">Sem registos para apresentar.</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black/40 text-left">
              {columns.map((c, i) => (
                <th key={i} className={`py-1 pr-2 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-b border-black/10">
                {columns.map((c, ci) => (
                  <td key={ci} className={`py-1 pr-2 align-top ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="text-[10px] text-black/50 border-t border-black/20 pt-2 mt-4">
        Armazém Express · Relatório gerado em {now.toLocaleString('pt-PT')}
      </div>
    </div>
  );
}
