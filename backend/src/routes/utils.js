import express from 'express';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Cache simples de códigos postais (evita repetir chamadas ao GeoAPI)
const cpCache = new Map();

async function lookupCP(cp) {
  if (cpCache.has(cp)) return cpCache.get(cp);
  const r = await fetch(`https://json.geoapi.pt/cp/${cp}`, {
    headers: { 'User-Agent': 'ArmazemExpress/1.0 (PAP)' }
  });
  if (!r.ok) return null;
  const data = await r.json();
  const first = Array.isArray(data) ? data[0] : data;
  const ponto = (first?.pontos || [])[0];
  const result = {
    cp,
    city: first?.Localidade || first?.Concelho || '',
    municipality: first?.Concelho || '',
    district: first?.Distrito || '',
    lat: ponto?.coordenadas?.[0] ?? null,
    lng: ponto?.coordenadas?.[1] ?? null
  };
  cpCache.set(cp, result);
  return result;
}

/**
 * GET /api/utils/postal/:cp
 * Preenche a cidade (e coordenadas) a partir de um código postal PT. Fonte: GeoAPI.pt
 */
router.get('/postal/:cp', authenticate, async (req, res) => {
  try {
    const cp = (req.params.cp || '').trim();
    if (!/^\d{4}-\d{3}$/.test(cp)) {
      return res.status(400).json({ error: 'Código postal inválido (formato XXXX-XXX)' });
    }
    const result = await lookupCP(cp);
    if (!result) return res.status(404).json({ error: 'Código postal não encontrado' });
    res.json(result);
  } catch (e) {
    console.error('Erro no lookup de código postal:', e.message);
    res.status(500).json({ error: 'Erro ao consultar o código postal' });
  }
});

/**
 * GET /api/utils/deliveries-map
 * Devolve as encomendas da empresa com coordenadas (geocodificadas a partir do
 * código postal via GeoAPI.pt) para desenhar no mapa. Fonte: GeoAPI.pt + OpenStreetMap
 */
router.get('/deliveries-map', authenticate, async (req, res) => {
  try {
    const orders = db
      .prepare(
        `SELECT id, tracking_number, recipient_name, recipient_city,
                recipient_postal_code, status, created_at
           FROM orders
          WHERE company_id = ?
          ORDER BY created_at DESC
          LIMIT 200`
      )
      .all(req.user.company_id);

    // Geocodifica cada código postal (com cache; CPs repetidos não repetem chamadas)
    const points = [];
    for (const o of orders) {
      const cp = (o.recipient_postal_code || '').trim();
      if (!/^\d{4}-\d{3}$/.test(cp)) continue;
      let geo = null;
      try {
        geo = await lookupCP(cp);
      } catch { /* ignora CP que falhe */ }
      if (!geo || geo.lat == null || geo.lng == null) continue;
      points.push({
        id: o.id,
        tracking_number: o.tracking_number,
        recipient_name: o.recipient_name,
        city: o.recipient_city || geo.city,
        status: o.status,
        created_at: o.created_at,
        lat: geo.lat,
        lng: geo.lng
      });
    }
    res.json(points);
  } catch (e) {
    console.error('Erro no mapa de entregas:', e.message);
    res.status(500).json({ error: 'Erro ao gerar o mapa de entregas' });
  }
});

export { lookupCP };
export default router;
