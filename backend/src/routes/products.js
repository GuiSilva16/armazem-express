import express from 'express';
import db from '../database/db.js';
import { authenticate, requireAdmin, requireFeature } from '../middleware/auth.js';
import {
  generateSKU,
  generateQRCode
} from '../utils/generators.js';
import {
  isPositiveInteger,
  isPositiveNumber
} from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/products/export
 * Exporta stock em CSV
 */
router.get('/export', authenticate, requireFeature('csv_export'), (req, res) => {
  try {
    const products = db
      .prepare(
        `SELECT sku, name, category, quantity, min_stock, price, shelf, supplier,
                (quantity * price) as total_value, created_at
         FROM products WHERE company_id = ? ORDER BY name ASC`
      )
      .all(req.user.company_id);

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };

    const headers = [
      'SKU', 'Nome', 'Categoria', 'Quantidade', 'Stock Mínimo',
      'Preço (EUR)', 'Prateleira', 'Fornecedor', 'Valor Total (EUR)', 'Criado em'
    ];
    const rows = products.map((p) =>
      [p.sku, p.name, p.category, p.quantity, p.min_stock,
       Number(p.price).toFixed(2), p.shelf, p.supplier,
       Number(p.total_value).toFixed(2), p.created_at].map(escape).join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');

    const filename = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Erro no export CSV:', error);
    res.status(500).json({ error: 'Erro ao exportar CSV' });
  }
});

/**
 * GET /api/products
 * Listar todos os produtos da empresa com filtros
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { search, category, status } = req.query;
    const companyId = req.user.company_id;

    let query = `SELECT * FROM products WHERE company_id = ?`;
    const params = [companyId];

    if (search) {
      query += ` AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(description) LIKE ?)`;
      const searchPattern = `%${search.toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (status && status !== 'all') {
      if (status === 'in_stock') {
        query += ` AND quantity > min_stock`;
      } else if (status === 'low_stock') {
        query += ` AND quantity > 0 AND quantity <= min_stock`;
      } else if (status === 'out_of_stock') {
        query += ` AND quantity = 0`;
      }
    }

    query += ` ORDER BY updated_at DESC`;

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

/**
 * GET /api/products/stats
 * Estatísticas de stock
 */
router.get('/stats', authenticate, (req, res) => {
  try {
    const companyId = req.user.company_id;

    const stats = db
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

    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter stats:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

/**
 * GET /api/products/categories
 * Listar categorias da empresa
 */
router.get('/categories', authenticate, (req, res) => {
  try {
    const categories = db
      .prepare('SELECT DISTINCT name FROM categories WHERE company_id = ? ORDER BY name')
      .all(req.user.company_id);
    res.json(categories.map((c) => c.name));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter categorias' });
  }
});

/**
 * GET /api/products/:id
 * Obter produto por ID
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const product = db
      .prepare('SELECT * FROM products WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const movements = db
      .prepare(
        `SELECT sm.*, u.name as user_name
         FROM stock_movements sm
         LEFT JOIN users u ON sm.user_id = u.id
         WHERE sm.product_id = ?
         ORDER BY sm.created_at DESC LIMIT 20`
      )
      .all(req.params.id);

    res.json({ ...product, movements });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

/**
 * GET /api/products/qr/:code
 * Obter produto por QR Code
 */
router.get('/qr/:code', authenticate, requireFeature('qr_scanner'), (req, res) => {
  try {
    const product = db
      .prepare('SELECT * FROM products WHERE qr_code = ? AND company_id = ?')
      .get(req.params.code, req.user.company_id);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado para este QR Code' });
    }

    // Registar scan como evento
    db.prepare(
      `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
       VALUES (?, ?, 'scan', 0, ?, ?)`
    ).run(
      req.user.company_id,
      product.id,
      `Scan de QR Code por ${req.user.name}`,
      req.user.id
    );

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler QR Code' });
  }
});

/**
 * POST /api/products
 * Adicionar novo produto
 */
router.post('/', authenticate, (req, res) => {
  try {
    const {
      name,
      description,
      category,
      quantity,
      min_stock,
      price,
      shelf,
      supplier,
      sku: providedSku
    } = req.body;

    // Validações
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome do produto inválido (mín. 2 caracteres)' });
    }

    if (!category || category.trim().length === 0) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    if (!isPositiveInteger(quantity)) {
      return res.status(400).json({ error: 'Quantidade deve ser um inteiro positivo' });
    }

    if (!isPositiveInteger(min_stock)) {
      return res.status(400).json({ error: 'Stock mínimo deve ser um inteiro positivo' });
    }

    if (!isPositiveNumber(price)) {
      return res.status(400).json({ error: 'Preço deve ser um número positivo' });
    }

    if (!shelf || shelf.trim().length === 0) {
      return res.status(400).json({ error: 'Localização (prateleira) é obrigatória' });
    }

    // Verificar limite do plano
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.user.plan_id);
    const current = db
      .prepare('SELECT COUNT(*) as count FROM products WHERE company_id = ?')
      .get(req.user.company_id);

    if (current.count >= plan.max_products) {
      return res.status(403).json({
        error: `Limite de produtos atingido para o plano ${plan.name} (${plan.max_products}). Faça upgrade.`
      });
    }

    const sku = providedSku?.trim() || generateSKU(category);

    // Verificar SKU único
    const existing = db
      .prepare('SELECT id FROM products WHERE company_id = ? AND sku = ?')
      .get(req.user.company_id, sku);

    if (existing) {
      return res.status(409).json({ error: 'Já existe um produto com este SKU' });
    }

    const result = db
      .prepare(
        `INSERT INTO products (company_id, sku, name, description, category, quantity, min_stock, price, shelf, supplier, qr_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.company_id,
        sku,
        name.trim(),
        description?.trim() || '',
        category.trim(),
        Number(quantity),
        Number(min_stock),
        Number(price),
        shelf.trim(),
        supplier?.trim() || '',
        generateQRCode(Date.now(), sku)
      );

    const productId = result.lastInsertRowid;

    // Atualizar QR code com ID real
    const qrCode = generateQRCode(productId, sku);
    db.prepare('UPDATE products SET qr_code = ? WHERE id = ?').run(qrCode, productId);

    // Registar categoria se nova
    try {
      db.prepare('INSERT OR IGNORE INTO categories (company_id, name) VALUES (?, ?)').run(
        req.user.company_id,
        category.trim()
      );
    } catch (e) {}

    // Registar movimento
    db.prepare(
      `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
       VALUES (?, ?, 'add', ?, ?, ?)`
    ).run(
      req.user.company_id,
      productId,
      Number(quantity),
      `Produto criado: ${name.trim()}`,
      req.user.id
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

/**
 * PUT /api/products/:id
 * Editar produto
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const product = db
      .prepare('SELECT * FROM products WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const {
      name,
      description,
      category,
      quantity,
      min_stock,
      price,
      shelf,
      supplier
    } = req.body;

    const newQty = quantity !== undefined ? Number(quantity) : product.quantity;
    const diff = newQty - product.quantity;

    db.prepare(
      `UPDATE products SET
        name = ?, description = ?, category = ?, quantity = ?,
        min_stock = ?, price = ?, shelf = ?, supplier = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      name?.trim() || product.name,
      description?.trim() ?? product.description,
      category?.trim() || product.category,
      newQty,
      min_stock !== undefined ? Number(min_stock) : product.min_stock,
      price !== undefined ? Number(price) : product.price,
      shelf?.trim() || product.shelf,
      supplier?.trim() ?? product.supplier,
      req.params.id
    );

    if (diff !== 0) {
      db.prepare(
        `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        req.user.company_id,
        req.params.id,
        diff > 0 ? 'add' : 'remove',
        Math.abs(diff),
        `Ajuste manual de stock por ${req.user.name}`,
        req.user.id
      );
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

/**
 * POST /api/products/:id/adjust
 * Adicionar ou remover quantidade de um produto
 */
router.post('/:id/adjust', authenticate, (req, res) => {
  try {
    const { amount, reason, type } = req.body;

    const product = db
      .prepare('SELECT * FROM products WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (!isPositiveInteger(amount) || Number(amount) === 0) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const delta = type === 'remove' ? -Number(amount) : Number(amount);
    const newQty = product.quantity + delta;

    if (newQty < 0) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponível: ${product.quantity}`
      });
    }

    db.prepare(
      'UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(newQty, req.params.id);

    db.prepare(
      `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.company_id,
      req.params.id,
      type === 'remove' ? 'remove' : 'add',
      Number(amount),
      reason?.trim() || `Ajuste de ${type === 'remove' ? 'saída' : 'entrada'}`,
      req.user.id
    );

    // Alerta de stock baixo
    if (newQty > 0 && newQty <= product.min_stock) {
      db.prepare(
        `INSERT INTO notifications (company_id, type, title, message)
         VALUES (?, 'warning', ?, ?)`
      ).run(
        req.user.company_id,
        'Stock Baixo ⚠️',
        `O produto "${product.name}" está com stock baixo (${newQty} unidades).`
      );
    } else if (newQty === 0) {
      db.prepare(
        `INSERT INTO notifications (company_id, type, title, message)
         VALUES (?, 'error', ?, ?)`
      ).run(
        req.user.company_id,
        'Sem Stock ❌',
        `O produto "${product.name}" está esgotado.`
      );
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao ajustar stock:', error);
    res.status(500).json({ error: 'Erro ao ajustar stock' });
  }
});

/**
 * DELETE /api/products/:id
 * Remover produto (apenas admin)
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const product = db
      .prepare('SELECT * FROM products WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Produto removido com sucesso', product });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
