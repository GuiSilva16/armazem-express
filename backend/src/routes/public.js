import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Mascara o nome do destinatário por privacidade: "João Silva" -> "João S."
function maskName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * GET /api/track/:code
 * Rastreio PÚBLICO de uma encomenda pelo número de tracking (sem login).
 * Devolve apenas informação não sensível.
 */
router.get('/:code', (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    const order = db
      .prepare(
        `SELECT o.id, o.tracking_number, o.recipient_name, o.recipient_city,
                o.status, o.created_at, o.updated_at, o.company_id
         FROM orders o WHERE o.tracking_number = ?`
      )
      .get(code);

    if (!order) {
      return res.status(404).json({ error: 'Não encontrámos nenhuma encomenda com esse número.' });
    }

    const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(order.company_id);
    const itemCount = db
      .prepare('SELECT COALESCE(SUM(quantity), 0) as c FROM order_items WHERE order_id = ?')
      .get(order.id).c;
    const events = db
      .prepare(
        `SELECT status, location, description, created_at
         FROM tracking_events WHERE order_id = ? ORDER BY created_at ASC`
      )
      .all(order.id);

    res.json({
      tracking_number: order.tracking_number,
      recipient_name: maskName(order.recipient_name),
      recipient_city: order.recipient_city,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      company: company?.name || 'Armazém Express',
      item_count: itemCount,
      tracking: events
    });
  } catch (error) {
    console.error('Erro no tracking público:', error);
    res.status(500).json({ error: 'Erro ao consultar o rastreio' });
  }
});

export default router;
