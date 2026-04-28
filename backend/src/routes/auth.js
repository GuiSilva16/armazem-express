import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { generateStrongPassword } from '../utils/generators.js';
import { isValidEmail, isValidName } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/auth/plans
 * Listar todos os planos disponíveis (público)
 */
router.get('/plans', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans ORDER BY price ASC').all();
    const formatted = plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]')
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao obter planos' });
  }
});

/**
 * POST /api/auth/subscribe
 * Processa subscrição fictícia e cria empresa + conta admin
 * Body: { companyName, email, planId }
 */
router.post('/subscribe', (req, res) => {
  try {
    const { companyName, email, planId } = req.body;

    // Validações
    if (!companyName || !email || !planId) {
      return res.status(400).json({
        error: 'Nome da empresa, email e plano são obrigatórios'
      });
    }

    if (!isValidName(companyName)) {
      return res.status(400).json({
        error: 'Nome da empresa inválido (entre 2 e 100 caracteres)'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verifica se plano existe
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    // Verifica se empresa/email já existem
    const existingCompany = db
      .prepare('SELECT id FROM companies WHERE name = ? OR email = ?')
      .get(companyName.trim(), email.toLowerCase().trim());

    if (existingCompany) {
      return res.status(409).json({
        error: 'Já existe uma empresa registada com este nome ou email'
      });
    }

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email.toLowerCase().trim());

    if (existingUser) {
      return res.status(409).json({
        error: 'Este email já está registado no sistema'
      });
    }

    // Transação: criar empresa + user admin
    const generatedPassword = generateStrongPassword(14);
    const passwordHash = bcrypt.hashSync(generatedPassword, 10);

    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    const trx = db.transaction(() => {
      const companyResult = db
        .prepare(
          `INSERT INTO companies (name, email, plan_id, subscription_status, subscription_end)
           VALUES (?, ?, ?, 'active', ?)`
        )
        .run(
          companyName.trim(),
          email.toLowerCase().trim(),
          planId,
          subscriptionEnd.toISOString()
        );

      const companyId = companyResult.lastInsertRowid;

      db.prepare(
        `INSERT INTO users (company_id, email, password_hash, name, role)
         VALUES (?, ?, ?, ?, 'admin')`
      ).run(
        companyId,
        email.toLowerCase().trim(),
        passwordHash,
        `Admin de ${companyName.trim()}`
      );

      // Criar categorias padrão
      const defaultCategories = ['Eletrónica', 'Vestuário', 'Alimentação', 'Outros'];
      const insertCat = db.prepare(
        'INSERT INTO categories (company_id, name) VALUES (?, ?)'
      );
      defaultCategories.forEach((cat) => insertCat.run(companyId, cat));

      // Notificação de boas-vindas
      db.prepare(
        `INSERT INTO notifications (company_id, type, title, message)
         VALUES (?, 'success', ?, ?)`
      ).run(
        companyId,
        'Bem-vindo ao Armazém Express! 🎉',
        `A sua subscrição do plano ${plan.name} foi ativada com sucesso.`
      );

      return companyId;
    });

    trx();

    res.status(201).json({
      message: 'Subscrição ativada com sucesso!',
      credentials: {
        email: email.toLowerCase().trim(),
        password: generatedPassword,
        companyName: companyName.trim(),
        plan: plan.name
      }
    });
  } catch (error) {
    console.error('Erro na subscrição:', error);
    res.status(500).json({ error: 'Erro ao processar subscrição' });
  }
});

/**
 * POST /api/auth/login
 * Login de utilizador (admin ou funcionário)
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    const user = db
      .prepare(
        `SELECT u.*, c.name as company_name, c.subscription_status, c.plan_id
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.email = ?`
      )
      .get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Conta desativada. Contacte o administrador.' });
    }

    if (user.subscription_status !== 'active') {
      return res.status(403).json({
        error: 'Subscrição inativa. Renove o plano da empresa.'
      });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company_name,
        companyId: user.company_id,
        planId: user.plan_id
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do utilizador autenticado
 */
router.get('/me', authenticate, (req, res) => {
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.user.plan_id);
  const company = db
    .prepare('SELECT id, name, created_at, subscription_status FROM companies WHERE id = ?')
    .get(req.user.company_id);
  const userCount = db
    .prepare('SELECT COUNT(*) as c FROM users WHERE company_id = ?')
    .get(req.user.company_id);

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      companyId: req.user.company_id,
      companyName: req.user.company_name,
      companyCreatedAt: company?.created_at,
      companyUsers: userCount?.c || 0
    },
    plan: plan ? { ...plan, features: JSON.parse(plan.features || '[]') } : null
  });
});

/**
 * POST /api/auth/change-plan
 * Alterar o plano da empresa (apenas admin)
 * Body: { planId }
 */
router.post('/change-plan', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar o plano' });
    }
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId é obrigatório' });

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

    // Verifica limites: se o novo plano tem limite menor que o uso atual, bloqueia
    const productCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE company_id = ?').get(req.user.company_id).c;
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE company_id = ?').get(req.user.company_id).c;

    if (plan.max_products !== -1 && productCount > plan.max_products) {
      return res.status(400).json({
        error: `O plano ${plan.name} permite ${plan.max_products} produtos, mas tem ${productCount}. Remova produtos antes de mudar.`
      });
    }
    if (plan.max_employees !== -1 && userCount > plan.max_employees) {
      return res.status(400).json({
        error: `O plano ${plan.name} permite ${plan.max_employees} utilizadores, mas tem ${userCount}. Remova utilizadores antes de mudar.`
      });
    }

    db.prepare('UPDATE companies SET plan_id = ? WHERE id = ?').run(planId, req.user.company_id);

    res.json({
      success: true,
      plan: { ...plan, features: JSON.parse(plan.features || '[]') },
      message: `Plano alterado para ${plan.name}`
    });
  } catch (error) {
    console.error('Erro ao mudar plano:', error);
    res.status(500).json({ error: 'Erro ao mudar plano' });
  }
});

export default router;
