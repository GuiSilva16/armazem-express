import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { generateStrongPassword } from '../utils/generators.js';
import { isValidEmail, isValidName } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/users
 * Listar utilizadores da empresa (admin)
 */
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const users = db
      .prepare(
        `SELECT id, email, name, role, active, created_at
         FROM users WHERE company_id = ?
         ORDER BY created_at DESC`
      )
      .all(req.user.company_id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

/**
 * POST /api/users
 * Criar utilizador funcionário (admin)
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, email, role = 'employee' } = req.body;

    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Papel inválido' });
    }

    // Verificar limite do plano
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.user.plan_id);
    const count = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE company_id = ?')
      .get(req.user.company_id);

    if (count.count >= plan.max_employees) {
      return res.status(403).json({
        error: `Limite de utilizadores atingido para o plano ${plan.name} (${plan.max_employees}).`
      });
    }

    // Email único globalmente
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email.toLowerCase().trim());

    if (existing) {
      return res.status(409).json({ error: 'Email já registado' });
    }

    const password = generateStrongPassword(12);
    const hash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare(
        `INSERT INTO users (company_id, email, password_hash, name, role)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        req.user.company_id,
        email.toLowerCase().trim(),
        hash,
        name.trim(),
        role
      );

    res.status(201).json({
      user: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role
      },
      generatedPassword: password
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
});

/**
 * PATCH /api/users/:id/toggle
 * Ativar/desativar utilizador (admin)
 */
router.patch('/:id/toggle', authenticate, requireAdmin, (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Não pode desativar a sua própria conta' });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const newActive = user.active ? 0 : 1;
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(newActive, req.params.id);

    res.json({ id: user.id, active: newActive });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
});

/**
 * DELETE /api/users/:id
 * Remover utilizador (admin)
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Não pode remover a sua própria conta' });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.company_id);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Utilizador removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover utilizador' });
  }
});

export default router;
