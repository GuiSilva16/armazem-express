import express from 'express';
import db from '../database/db.js';
import { authenticate, requireAdmin, requireFeature } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/dashboard/activity
 * Feed unificado de atividade da empresa (stock + encomendas).
 * Admin only.
 */
router.get('/activity', authenticate, requireAdmin, requireFeature('activity_log'), (req, res) => {
  try {
    const { limit = 100, user_id, type } = req.query;
    const companyId = req.user.company_id;
    const cap = Math.min(Number(limit) || 100, 500);

    const movements = db
      .prepare(
        `SELECT
            'stock' as source,
            sm.id,
            sm.type,
            sm.quantity,
            sm.reason,
            sm.created_at,
            sm.user_id,
            u.name as user_name,
            u.role as user_role,
            p.id as product_id,
            p.name as product_name,
            p.sku as product_sku
         FROM stock_movements sm
         LEFT JOIN users u ON sm.user_id = u.id
         LEFT JOIN products p ON sm.product_id = p.id
         WHERE sm.company_id = ?
         ORDER BY sm.created_at DESC
         LIMIT ?`
      )
      .all(companyId, cap);

    const events = db
      .prepare(
        `SELECT
            'order' as source,
            te.id,
            te.status as type,
            te.description as reason,
            te.location,
            te.created_at,
            te.user_id,
            u.name as user_name,
            u.role as user_role,
            o.id as order_id,
            o.tracking_number,
            o.recipient_name
         FROM tracking_events te
         LEFT JOIN users u ON te.user_id = u.id
         LEFT JOIN orders o ON te.order_id = o.id
         WHERE o.company_id = ?
         ORDER BY te.created_at DESC
         LIMIT ?`
      )
      .all(companyId, cap);

    let combined = [...movements, ...events].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    if (user_id && user_id !== 'all') {
      combined = combined.filter((e) => String(e.user_id) === String(user_id));
    }
    if (type && type !== 'all') {
      combined = combined.filter((e) => e.source === type);
    }

    combined = combined.slice(0, cap);

    const users = db
      .prepare(
        `SELECT id, name, role FROM users WHERE company_id = ? ORDER BY name ASC`
      )
      .all(companyId);

    res.json({ events: combined, users });
  } catch (error) {
    console.error('Erro no activity feed:', error);
    res.status(500).json({ error: 'Erro ao obter atividade' });
  }
});

/**
 * GET /api/dashboard/search?q=
 * Pesquisa global: produtos + encomendas
 */
router.get('/search', authenticate, (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 2) return res.json({ products: [], orders: [] });

    const companyId = req.user.company_id;
    const like = `%${q}%`;

    const products = db
      .prepare(
        `SELECT id, name, sku, quantity, category
         FROM products
         WHERE company_id = ?
           AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?)
         ORDER BY name ASC LIMIT 6`
      )
      .all(companyId, like, like, like);

    const orders = db
      .prepare(
        `SELECT id, tracking_number, recipient_name, status, total_value
         FROM orders
         WHERE company_id = ?
           AND (LOWER(tracking_number) LIKE ? OR LOWER(recipient_name) LIKE ? OR LOWER(recipient_city) LIKE ?)
         ORDER BY created_at DESC LIMIT 6`
      )
      .all(companyId, like, like, like);

    res.json({ products, orders });
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    res.status(500).json({ error: 'Erro na pesquisa' });
  }
});

/**
 * GET /api/dashboard
 * Dados agregados para o dashboard
 */
router.get('/', authenticate, (req, res) => {
  try {
    const companyId = req.user.company_id;

    // Stock stats
    const stockStats = db
      .prepare(
        `SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN quantity > min_stock THEN 1 ELSE 0 END), 0) as inStock,
          COALESCE(SUM(CASE WHEN quantity > 0 AND quantity <= min_stock THEN 1 ELSE 0 END), 0) as lowStock,
          COALESCE(SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END), 0) as outOfStock,
          COALESCE(SUM(quantity * price), 0) as totalValue,
          COALESCE(SUM(quantity), 0) as totalUnits
        FROM products WHERE company_id = ?`
      )
      .get(companyId);

    // Order stats
    const orderStats = db
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
      .get(companyId);

    // Top produtos por quantidade
    const topProducts = db
      .prepare(
        `SELECT id, name, category, quantity, price, shelf
         FROM products WHERE company_id = ?
         ORDER BY quantity DESC LIMIT 5`
      )
      .all(companyId);

    // Produtos com stock baixo
    const lowStockProducts = db
      .prepare(
        `SELECT id, name, category, quantity, min_stock, shelf
         FROM products
         WHERE company_id = ? AND quantity > 0 AND quantity <= min_stock
         ORDER BY quantity ASC LIMIT 5`
      )
      .all(companyId);

    // Encomendas recentes
    const recentOrders = db
      .prepare(
        `SELECT id, tracking_number, recipient_name, recipient_city,
                status, total_value, created_at
         FROM orders WHERE company_id = ?
         ORDER BY created_at DESC LIMIT 5`
      )
      .all(companyId);

    // Movimentos últimos 7 dias
    const movementsByDay = db
      .prepare(
        `SELECT
          date(created_at) as day,
          SUM(CASE WHEN type = 'add' THEN quantity ELSE 0 END) as added,
          SUM(CASE WHEN type = 'remove' OR type = 'ship' THEN quantity ELSE 0 END) as removed
         FROM stock_movements
         WHERE company_id = ? AND created_at >= date('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY day ASC`
      )
      .all(companyId);

    // Produtos por categoria
    const byCategory = db
      .prepare(
        `SELECT category, COUNT(*) as count, SUM(quantity) as totalUnits
         FROM products WHERE company_id = ?
         GROUP BY category
         ORDER BY count DESC`
      )
      .all(companyId);

    // Sugestões de reposição: produtos em stock baixo ou esgotados
    // com quantidade sugerida baseada na rotação dos últimos 30 dias.
    const reorderRaw = db
      .prepare(
        `SELECT p.id, p.name, p.sku, p.category, p.quantity, p.min_stock,
                p.supplier, p.shelf, p.price,
                COALESCE((
                  SELECT SUM(sm.quantity)
                  FROM stock_movements sm
                  WHERE sm.product_id = p.id
                    AND sm.type IN ('remove', 'ship')
                    AND sm.created_at >= date('now', '-30 days')
                ), 0) as consumed_30d
         FROM products p
         WHERE p.company_id = ? AND p.quantity <= p.min_stock
         ORDER BY (p.min_stock - p.quantity) DESC, consumed_30d DESC
         LIMIT 8`
      )
      .all(companyId);

    const reorderSuggestions = reorderRaw.map((p) => {
      // Sugestão = cobre 30 dias de consumo + um buffer de min_stock, menos o que já há
      const projected = Math.max(p.consumed_30d, p.min_stock * 2);
      const suggested = Math.max(projected - p.quantity, p.min_stock);
      return {
        ...p,
        suggested_qty: suggested,
        estimated_cost: Number((suggested * p.price).toFixed(2)),
        urgency: p.quantity === 0 ? 'critical' : p.quantity < p.min_stock / 2 ? 'high' : 'medium'
      };
    });

    res.json({
      stockStats,
      orderStats,
      topProducts,
      lowStockProducts,
      recentOrders,
      movementsByDay,
      byCategory,
      reorderSuggestions
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao obter dados do dashboard' });
  }
});

/**
 * GET /api/dashboard/notifications
 */
router.get('/notifications', authenticate, (req, res) => {
  try {
    const notifications = db
      .prepare(
        `SELECT * FROM notifications
         WHERE company_id = ?
         ORDER BY created_at DESC LIMIT 20`
      )
      .all(req.user.company_id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter notificações' });
  }
});

/**
 * PATCH /api/dashboard/notifications/:id/read
 */
router.patch('/notifications/:id/read', authenticate, (req, res) => {
  try {
    db.prepare(
      'UPDATE notifications SET read = 1 WHERE id = ? AND company_id = ?'
    ).run(req.params.id, req.user.company_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

/**
 * PATCH /api/dashboard/notifications/read-all
 */
router.patch('/notifications/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE company_id = ?').run(
      req.user.company_id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
});

export default router;
