import express from 'express';
import db from '../database/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/purchase-orders
 * Lista as encomendas de compra/reposição da empresa.
 */
router.get('/', authenticate, (req, res) => {
  try {
    const orders = db
      .prepare(
        `SELECT po.*, s.name as supplier_name,
          (SELECT COUNT(*) FROM purchase_order_items i WHERE i.purchase_order_id = po.id) as item_count,
          (SELECT COALESCE(SUM(i.quantity),0) FROM purchase_order_items i WHERE i.purchase_order_id = po.id) as total_units
         FROM purchase_orders po
         LEFT JOIN suppliers s ON po.supplier_id = s.id
         WHERE po.company_id = ?
         ORDER BY po.created_at DESC`
      )
      .all(req.user.company_id);
    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar encomendas de compra:', error);
    res.status(500).json({ error: 'Erro ao listar encomendas de compra' });
  }
});

/**
 * GET /api/purchase-orders/:id — detalhe com itens
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db
      .prepare(
        `SELECT po.*, s.name as supplier_name, s.email as supplier_email
         FROM purchase_orders po
         LEFT JOIN suppliers s ON po.supplier_id = s.id
         WHERE po.id = ? AND po.company_id = ?`
      )
      .get(req.params.id, req.user.company_id);
    if (!order) return res.status(404).json({ error: 'Encomenda de compra não encontrada' });

    order.items = db
      .prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?')
      .all(order.id);
    res.json(order);
  } catch (error) {
    console.error('Erro ao obter encomenda de compra:', error);
    res.status(500).json({ error: 'Erro ao obter encomenda de compra' });
  }
});

/**
 * POST /api/purchase-orders — criar encomenda de compra (admin)
 * Body: { supplier_id?, notes?, items: [{ product_id, quantity, unit_cost? }] }
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { supplier_id, notes, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'A encomenda tem de ter pelo menos um produto' });
    }

    // Valida os produtos e calcula o total
    const resolved = [];
    for (const it of items) {
      const product = db
        .prepare('SELECT id, name, cost_price FROM products WHERE id = ? AND company_id = ?')
        .get(it.product_id, req.user.company_id);
      if (!product) return res.status(400).json({ error: `Produto ${it.product_id} inválido` });
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ error: `Quantidade inválida para ${product.name}` });
      }
      const unitCost = it.unit_cost != null ? Number(it.unit_cost) : Number(product.cost_price || 0);
      resolved.push({ product, qty, unitCost });
    }

    const reference = `PO-${Date.now().toString().slice(-6)}`;
    const total = resolved.reduce((s, r) => s + r.qty * r.unitCost, 0);

    const create = db.transaction(() => {
      const poRes = db
        .prepare(
          `INSERT INTO purchase_orders (company_id, supplier_id, reference, status, total_cost, notes, created_by)
           VALUES (?, ?, ?, 'pending', ?, ?, ?)`
        )
        .run(req.user.company_id, supplier_id || null, reference, total, notes?.trim() || null, req.user.id);
      const poId = poRes.lastInsertRowid;
      const insItem = db.prepare(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, unit_cost)
         VALUES (?, ?, ?, ?, ?)`
      );
      for (const r of resolved) insItem.run(poId, r.product.id, r.product.name, r.qty, r.unitCost);
      return poId;
    });

    const poId = create();
    const created = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    created.items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(poId);
    res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar encomenda de compra:', error);
    res.status(500).json({ error: 'Erro ao criar encomenda de compra' });
  }
});

/**
 * POST /api/purchase-orders/:id/receive — rececionar (admin)
 * Adiciona o stock de cada item e regista os movimentos.
 */
router.post('/:id/receive', authenticate, requireAdmin, (req, res) => {
  try {
    const order = db
      .prepare('SELECT * FROM purchase_orders WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);
    if (!order) return res.status(404).json({ error: 'Encomenda de compra não encontrada' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Esta encomenda já foi rececionada ou cancelada' });
    }

    const items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(order.id);

    const receive = db.transaction(() => {
      for (const it of items) {
        db.prepare('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(it.quantity, it.product_id);
        db.prepare(
          `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
           VALUES (?, ?, 'add', ?, ?, ?)`
        ).run(req.user.company_id, it.product_id, it.quantity, `Reposição (${order.reference})`, req.user.id);
      }
      db.prepare(`UPDATE purchase_orders SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(order.id);
    });
    receive();

    res.json({ success: true, message: 'Stock reposto com sucesso' });
  } catch (error) {
    console.error('Erro ao rececionar encomenda:', error);
    res.status(500).json({ error: 'Erro ao rececionar encomenda' });
  }
});

/**
 * POST /api/purchase-orders/:id/cancel — cancelar (admin)
 */
router.post('/:id/cancel', authenticate, requireAdmin, (req, res) => {
  try {
    const order = db
      .prepare('SELECT * FROM purchase_orders WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);
    if (!order) return res.status(404).json({ error: 'Encomenda de compra não encontrada' });
    if (order.status === 'received') {
      return res.status(400).json({ error: 'Não é possível cancelar uma encomenda já rececionada' });
    }
    db.prepare(`UPDATE purchase_orders SET status = 'cancelled' WHERE id = ?`).run(order.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar encomenda de compra:', error);
    res.status(500).json({ error: 'Erro ao cancelar encomenda de compra' });
  }
});

export default router;
