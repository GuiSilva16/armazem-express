import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Truck } from 'lucide-react';
import { PageHeader } from '../components/ui';
import api from '../lib/api';

// Cores por estado da encomenda (marcadores do mapa)
const STATUS = {
  pending: { color: '#eab308', label: 'Pendente' },
  processing: { color: '#3b82f6', label: 'Em processamento' },
  shipped: { color: '#8b5cf6', label: 'Expedida' },
  delivered: { color: '#22c55e', label: 'Entregue' },
  cancelled: { color: '#ef4444', label: 'Cancelada' },
  returned: { color: '#f97316', label: 'Devolvida' }
};

function markerIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

export default function DeliveriesMap() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/utils/deliveries-map')
      .then(({ data }) => { if (!cancelled) setPoints(data || []); })
      .catch(() => { if (!cancelled) setError('Não foi possível carregar o mapa de entregas.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Inicializa o mapa uma vez
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView([39.5, -8.0], 6); // centro de Portugal
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Desenha marcadores quando os pontos chegam
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    const layer = L.layerGroup().addTo(map);
    const bounds = [];
    points.forEach((p) => {
      const st = STATUS[p.status] || { color: '#737373', label: p.status };
      L.marker([p.lat, p.lng], { icon: markerIcon(st.color) })
        .bindPopup(
          `<b>${p.recipient_name || ''}</b><br>${p.city || ''}<br>` +
          `<span style="color:${st.color}">${st.label}</span><br>` +
          `<code>${p.tracking_number || ''}</code>`
        )
        .addTo(layer);
      bounds.push([p.lat, p.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    return () => { layer.remove(); };
  }, [points]);

  return (
    <div>
      <PageHeader
        title="Mapa de Entregas"
        subtitle="Distribuição geográfica das encomendas por código postal (GeoAPI.pt + OpenStreetMap)."
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 border-b border-neutral-100 dark:border-neutral-800 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-neutral-500">
            <Truck size={14} /> {points.length} entrega{points.length === 1 ? '' : 's'} localizada{points.length === 1 ? '' : 's'}
          </span>
          {Object.values(STATUS).map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>

        <div className="relative">
          <div ref={mapEl} className="h-[60vh] w-full z-0" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 z-10">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 size={18} className="animate-spin" /> A geolocalizar entregas…
              </div>
            </div>
          )}
          {!loading && !error && points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 z-10">
              <div className="flex flex-col items-center gap-2 text-sm text-neutral-500">
                <MapPin size={28} /> Ainda não há entregas com código postal para mostrar.
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 z-10">
              <div className="text-sm text-brand-red-500">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
