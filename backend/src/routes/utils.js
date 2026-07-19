import express from 'express';
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

export { lookupCP };
export default router;
