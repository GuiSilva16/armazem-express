import express from 'express';
import db from '../database/db.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { generateTrackingNumber } from '../utils/generators.js';
import {
  isValidEmail,
  isValidName,
  isValidPhonePT,
  isValidPostalCodePT,
  isPositiveInteger
} from '../utils/validators.js';

const router = express.Router();

// Converte o parâmetro "period" num SQL fragment + valor
// Aceita: 1w, 2w, 1m, 2m, 1y, all (default)
const periodToDays = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
  '2m': 60,
  '1y': 365
};

const buildPeriodClause = (period) => {
  const days = periodToDays[period];
  if (!days) return { clause: '', days: null };
  return { clause: ` AND o.created_at >= date('now', ?)`, days: `-${days} days` };
};

/**
 * GET /api/orders
 * Listar todas as encomendas da empresa
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { search, status, period } = req.query;
    let query = `SELECT o.*, u.name as created_by_name,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o
                LEFT JOIN users u ON o.created_by = u.id
                WHERE o.company_id = ?`;
    const params = [req.user.company_id];

    if (search) {
      query += ` AND (LOWER(o.tracking_number) LIKE ? OR LOWER(o.recipient_name) LIKE ? OR LOWER(o.recipient_city) LIKE ?)`;
      const p = `%${search.toLowerCase()}%`;
      params.push(p, p, p);
    }

    if (status && status !== 'all') {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    const pc = buildPeriodClause(period);
    if (pc.clause) {
      query += pc.clause;
      params.push(pc.days);
    }

    query += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar encomendas:', error);
    res.status(500).json({ error: 'Erro ao obter encomendas' });
  }
});

/**
 * GET /api/orders/export
 * Exporta encomendas em CSV
 */
router.get('/export', authenticate, requireFeature('csv_export'), (req, res) => {
  try {
    const { period } = req.query;
    let sql = `SELECT o.tracking_number, o.recipient_name, o.recipient_address,
                o.recipient_city, o.recipient_postal_code, o.recipient_phone,
                o.recipient_email, o.status, o.total_value, o.created_at,
                u.name as created_by_name,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
         FROM orders o
         LEFT JOIN users u ON o.created_by = u.id
         WHERE o.company_id = ?`;
    const params = [req.user.company_id];

    const pc = buildPeriodClause(period);
    if (pc.clause) {
      sql += pc.clause;
      params.push(pc.days);
    }
    sql += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(sql).all(...params);

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };

    const statusLabel = {
      pending: 'Pendente',
      shipped: 'Expedida',
      in_transit: 'Em trânsito',
      delivered: 'Entregue',
      cancelled: 'Cancelada'
    };

    const headers = [
      'Tracking', 'Destinatário', 'Morada', 'Cidade', 'Código Postal',
      'Telefone', 'Email', 'Estado', 'Nº Itens', 'Valor (EUR)',
      'Criado por', 'Criado em'
    ];
    const rows = orders.map((o) =>
      [o.tracking_number, o.recipient_name, o.recipient_address, o.recipient_city,
       o.recipient_postal_code, o.recipient_phone, o.recipient_email,
       statusLabel[o.status] || o.status, o.item_count,
       Number(o.total_value).toFixed(2), o.created_by_name, o.created_at].map(escape).join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');

    const periodSuffix = period && period !== 'all' ? `-${period}` : '';
    const filename = `encomendas${periodSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Erro no export CSV de encomendas:', error);
    res.status(500).json({ error: 'Erro ao exportar CSV' });
  }
});

/**
 * GET /api/orders/stats
 */
router.get('/stats', authenticate, (req, res) => {
  try {
    const stats = db
      .prepare(
        `SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END), 0) as shipped,
          COALESCE(SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END), 0) as inTransit,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered,
          COALESCE(SUM(total_value), 0) as totalValue
        FROM orders WHERE company_id = ?`
      )
      .get(req.user.company_id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db
      .prepare(
        `SELECT o.*, u.name as created_by_name
         FROM orders o
         LEFT JOIN users u ON o.created_by = u.id
         WHERE o.id = ? AND o.company_id = ?`
      )
      .get(req.params.id, req.user.company_id);

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada' });
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(order.id);

    const events = db
      .prepare(
        `SELECT te.*, u.name as user_name, u.role as user_role
         FROM tracking_events te
         LEFT JOIN users u ON te.user_id = u.id
         WHERE te.order_id = ? ORDER BY te.created_at ASC`
      )
      .all(order.id);

    res.json({ ...order, items, tracking: events });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter encomenda' });
  }
});

/**
 * GET /api/orders/tracking/:code
 * Consultar estado pelo tracking number (pode ser público)
 */
router.get('/tracking/:code', authenticate, (req, res) => {
  try {
    const order = db
      .prepare(
        'SELECT * FROM orders WHERE tracking_number = ? AND company_id = ?'
      )
      .get(req.params.code, req.user.company_id);

    if (!order) {
      return res.status(404).json({ error: 'Tracking não encontrado' });
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(order.id);

    const events = db
      .prepare(
        'SELECT * FROM tracking_events WHERE order_id = ? ORDER BY created_at ASC'
      )
      .all(order.id);

    res.json({ ...order, items, tracking: events });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar tracking' });
  }
});

/**
 * POST /api/orders
 * Criar nova encomenda
 * Body: { recipient*, items: [{product_id, quantity}] }
 */
router.post('/', authenticate, (req, res) => {
  try {
    const {
      recipient_name,
      recipient_address,
      recipient_city,
      recipient_postal_code,
      recipient_phone,
      recipient_email,
      notes,
      items
    } = req.body;

    // Validações de destinatário
    if (!isValidName(recipient_name)) {
      return res
        .status(400)
        .json({ error: 'Nome do destinatário inválido (apenas letras, 2-100 caracteres)' });
    }

    if (!recipient_address || recipient_address.trim().length < 5) {
      return res.status(400).json({ error: 'Morada inválida (mín. 5 caracteres)' });
    }

    if (!recipient_city || recipient_city.trim().length < 2) {
      return res.status(400).json({ error: 'Cidade inválida' });
    }

    if (!isValidPostalCodePT(recipient_postal_code)) {
      return res
        .status(400)
        .json({ error: 'Código postal inválido. Use o formato XXXX-XXX' });
    }

    if (!isValidPhonePT(recipient_phone)) {
      return res
        .status(400)
        .json({ error: 'Telefone inválido. Use um número português válido (9 dígitos).' });
    }

    if (recipient_email && !isValidEmail(recipient_email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Adicione pelo menos um produto' });
    }

    // Validar items e verificar stock
    const productCache = new Map();
    let totalValue = 0;

    for (const item of items) {
      if (!item.product_id || !isPositiveInteger(item.quantity) || Number(item.quantity) <= 0) {
        return res.status(400).json({ error: 'Item de encomenda inválido' });
      }

      const product = db
        .prepare('SELECT * FROM products WHERE id = ? AND company_id = ?')
        .get(item.product_id, req.user.company_id);

      if (!product) {
        return res.status(404).json({ error: `Produto ID ${item.product_id} não encontrado` });
      }

      if (product.quantity < Number(item.quantity)) {
        return res.status(400).json({
          error: `Stock insuficiente para "${product.name}". Disponível: ${product.quantity}`
        });
      }

      productCache.set(product.id, product);
      totalValue += product.price * Number(item.quantity);
    }

    // Transação
    let trackingNumber;
    const createOrder = db.transaction(() => {
      trackingNumber = generateTrackingNumber();

      const orderResult = db
        .prepare(
          `INSERT INTO orders (
            company_id, tracking_number, recipient_name, recipient_address,
            recipient_city, recipient_postal_code, recipient_phone, recipient_email,
            status, total_value, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
        )
        .run(
          req.user.company_id,
          trackingNumber,
          recipient_name.trim(),
          recipient_address.trim(),
          recipient_city.trim(),
          recipient_postal_code.trim(),
          recipient_phone.replace(/\s+/g, ''),
          recipient_email?.trim() || null,
          totalValue,
          notes?.trim() || null,
          req.user.id
        );

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`
      );

      const updateStock = db.prepare(
        'UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );

      const insertMovement = db.prepare(
        `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
         VALUES (?, ?, 'ship', ?, ?, ?)`
      );

      for (const item of items) {
        const product = productCache.get(Number(item.product_id));
        insertItem.run(orderId, product.id, product.name, Number(item.quantity), product.price);
        updateStock.run(Number(item.quantity), product.id);
        insertMovement.run(
          req.user.company_id,
          product.id,
          Number(item.quantity),
          `Expedição ${trackingNumber}`,
          req.user.id
        );
      }

      // Evento inicial de tracking
      db.prepare(
        `INSERT INTO tracking_events (order_id, status, location, description, user_id)
         VALUES (?, 'created', 'Armazém Central', 'Encomenda registada no sistema', ?)`
      ).run(orderId, req.user.id);

      db.prepare(
        `INSERT INTO tracking_events (order_id, status, location, description, user_id)
         VALUES (?, 'pending', 'Armazém Central', 'A preparar expedição', ?)`
      ).run(orderId, req.user.id);

      // Notificação
      db.prepare(
        `INSERT INTO notifications (company_id, type, title, message)
         VALUES (?, 'info', ?, ?)`
      ).run(
        req.user.company_id,
        'Nova Encomenda 📦',
        `Encomenda ${trackingNumber} criada para ${recipient_name.trim()} (${totalValue.toFixed(2)}€)`
      );

      return orderId;
    });

    const orderId = createOrder();
    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar encomenda:', error);
    res.status(500).json({ error: 'Erro ao criar encomenda' });
  }
});

/**
 * POST /api/orders/:id/status
 * Atualizar estado de encomenda
 */
router.post('/:id/status', authenticate, (req, res) => {
  try {
    const { status, location, description } = req.body;

    const validStatuses = ['pending', 'shipped', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada' });
    }

    db.prepare(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, req.params.id);

    const locationMap = {
      pending: 'Armazém Central',
      shipped: 'Centro de Expedição',
      in_transit: 'Em Trânsito',
      delivered: 'Entregue',
      cancelled: 'Cancelada'
    };

    const descMap = {
      pending: 'A preparar expedição',
      shipped: 'Encomenda expedida do armazém',
      in_transit: 'Encomenda em trânsito para o destinatário',
      delivered: 'Encomenda entregue ao destinatário',
      cancelled: 'Encomenda cancelada'
    };

    db.prepare(
      `INSERT INTO tracking_events (order_id, status, location, description, user_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      req.params.id,
      status,
      location?.trim() || locationMap[status],
      description?.trim() || descMap[status],
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar estado:', error);
    res.status(500).json({ error: 'Erro ao atualizar estado' });
  }
});

export default router;
