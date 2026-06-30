import express from 'express';
import db from '../database/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/suppliers
 * Lista os fornecedores da empresa (com nº de produtos associados).
 */
router.get('/', authenticate, (req, res) => {
  try {
    const suppliers = db
      .prepare(
        `SELECT s.*,
          (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) as product_count
         FROM suppliers s
         WHERE s.company_id = ?
         ORDER BY s.name COLLATE NOCASE ASC`
      )
      .all(req.user.company_id);
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao listar fornecedores' });
  }
});

/**
 * POST /api/suppliers — criar fornecedor (admin)
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, email, phone, nif, address, notes } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome do fornecedor inválido (mín. 2 caracteres)' });
    }
    const result = db
      .prepare(
        `INSERT INTO suppliers (company_id, name, email, phone, nif, address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.company_id,
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        nif?.trim() || null,
        address?.trim() || null,
        notes?.trim() || null
      );
    const created = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

/**
 * PUT /api/suppliers/:id — atualizar fornecedor (admin)
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const supplier = db
      .prepare('SELECT * FROM suppliers WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);
    if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado' });

    const { name, email, phone, nif, address, notes } = req.body;
    db.prepare(
      `UPDATE suppliers SET name = ?, email = ?, phone = ?, nif = ?, address = ?, notes = ? WHERE id = ?`
    ).run(
      name?.trim() || supplier.name,
      email?.trim() ?? supplier.email,
      phone?.trim() ?? supplier.phone,
      nif?.trim() ?? supplier.nif,
      address?.trim() ?? supplier.address,
      notes?.trim() ?? supplier.notes,
      req.params.id
    );
    res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id));
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

/**
 * DELETE /api/suppliers/:id — eliminar fornecedor (admin).
 * Os produtos associados ficam sem fornecedor (supplier_id = NULL).
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const supplier = db
      .prepare('SELECT id FROM suppliers WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);
    if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado' });

    db.prepare('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?').run(req.params.id);
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao eliminar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao eliminar fornecedor' });
  }
});

export default router;
