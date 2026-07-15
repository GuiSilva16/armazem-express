import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { generateStrongPassword } from '../utils/generators.js';
import { isValidEmail, isValidName, isStrongPassword } from '../utils/validators.js';
import { sendEmail, isEmailConfigured, passwordResetEmail, welcomeCredentialsEmail } from '../utils/email.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Rate limiting do login (proteção contra força bruta, em memória) ──
const loginAttempts = new Map(); // chave (ip+email) -> { count, firstAt }
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;

const attemptKey = (req) =>
  `${req.ip || 'unknown'}:${(req.body?.email || '').toLowerCase().trim()}`;

function rateLimitLogin(req, res, next) {
  const rec = loginAttempts.get(attemptKey(req));
  const now = Date.now();
  if (rec && now - rec.firstAt < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((WINDOW_MS - (now - rec.firstAt)) / 60000);
    return res
      .status(429)
      .json({ error: `Demasiadas tentativas de login. Tente novamente dentro de ~${mins} min.` });
  }
  next();
}

function registerFailedLogin(req) {
  const key = attemptKey(req);
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || now - rec.firstAt >= WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
  } else {
    rec.count += 1;
  }
}

const clearLoginAttempts = (req) => loginAttempts.delete(attemptKey(req));

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
router.post('/subscribe', async (req, res) => {
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

    // Envia email de boas-vindas com as credenciais
    if (isEmailConfigured()) {
      try {
        const mail = welcomeCredentialsEmail({
          email: email.toLowerCase().trim(),
          password: generatedPassword,
          companyName: companyName.trim(),
          planName: plan.name,
          loginUrl: `${FRONTEND_URL}/login`
        });
        await sendEmail({ to: email.toLowerCase().trim(), ...mail });
      } catch (e) {
        console.error('Erro ao enviar email de boas-vindas:', e.message);
      }
    }

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
router.post('/login', rateLimitLogin, (req, res) => {
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
      registerFailedLogin(req);
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
      registerFailedLogin(req);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    clearLoginAttempts(req);

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
 * POST /api/auth/forgot-password
 * Gera um token de recuperação (válido 1h). Responde sempre 200 para não revelar
 * se o email existe. Em desenvolvimento devolve o token para se poder testar o fluxo
 * (num sistema real seria enviado por email).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = db
      .prepare('SELECT id FROM users WHERE email = ? AND active = 1')
      .get(cleanEmail);

    // Resposta genérica (não revela se o email existe)
    const response = { message: 'Se o email existir, foi enviado um link de recuperação.' };

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Invalida pedidos anteriores e cria o novo
      db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);
      db.prepare(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
      ).run(user.id, tokenHash, expiresAt);

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

      if (isEmailConfigured()) {
        // Envia o email com o link de recuperação
        try {
          const mail = passwordResetEmail(resetUrl);
          await sendEmail({ to: cleanEmail, ...mail });
        } catch (mailErr) {
          console.error('Erro ao enviar email de recuperação:', mailErr.message);
        }
      } else if (process.env.NODE_ENV !== 'production') {
        // Sem SMTP configurado, em desenvolvimento devolve o token para testar
        response.devToken = token;
        response.devNote = 'SMTP não configurado — token devolvido apenas em desenvolvimento.';
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Erro no forgot-password:', error);
    res.status(500).json({ error: 'Erro ao processar o pedido' });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password } — define uma nova palavra-passe a partir de um token válido.
 */
router.post('/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova palavra-passe são obrigatórios' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Palavra-passe fraca: mín. 8 caracteres, com maiúscula, minúscula, número e símbolo.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = db
      .prepare(
        `SELECT * FROM password_resets
         WHERE token_hash = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP`
      )
      .get(tokenHash);

    if (!reset) {
      return res.status(400).json({ error: 'Token inválido ou expirado. Peça um novo link.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, reset.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    res.json({ success: true, message: 'Palavra-passe alterada com sucesso. Já pode entrar.' });
  } catch (error) {
    console.error('Erro no reset-password:', error);
    res.status(500).json({ error: 'Erro ao redefinir a palavra-passe' });
  }
});

/**
 * POST /api/auth/change-password
 * Altera a própria palavra-passe (autenticado). Body: { currentPassword, newPassword }
 */
router.post('/change-password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Preencha a palavra-passe atual e a nova' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Palavra-passe fraca: mín. 8 caracteres, com maiúscula, minúscula, número e símbolo.'
      });
    }
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'A palavra-passe atual está incorreta' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ success: true, message: 'Palavra-passe alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar palavra-passe:', error);
    res.status(500).json({ error: 'Erro ao alterar a palavra-passe' });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do utilizador autenticado
 */
router.get('/me', authenticate, (req, res) => {
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.user.plan_id);
  const company = db
    .prepare('SELECT id, name, created_at, subscription_status, address, postal_code, city, phone, vat, logo, email FROM companies WHERE id = ?')
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
    company: {
      name: company?.name,
      email: company?.email,
      address: company?.address || '',
      postal_code: company?.postal_code || '',
      city: company?.city || '',
      phone: company?.phone || '',
      vat: company?.vat || '',
      logo: company?.logo || ''
    },
    plan: plan ? { ...plan, features: JSON.parse(plan.features || '[]') } : null
  });
});

/**
 * PUT /api/auth/company
 * Atualiza os dados de perfil da empresa (apenas admin).
 */
router.put('/company', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem editar a empresa' });
    }
    const { address, postal_code, city, phone, vat, logo } = req.body;

    // Logo: data URL de imagem (já redimensionada no cliente). '' = remover.
    let logoValue;
    if (logo !== undefined) {
      const l = (logo || '').trim();
      if (l && !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(l)) {
        return res.status(400).json({ error: 'Formato de logótipo inválido' });
      }
      if (l.length > 800000) {
        return res.status(400).json({ error: 'Logótipo demasiado grande (máx. ~500KB)' });
      }
      logoValue = l;
    }

    if (logoValue !== undefined) {
      db.prepare(
        'UPDATE companies SET address = ?, postal_code = ?, city = ?, phone = ?, vat = ?, logo = ? WHERE id = ?'
      ).run(
        (address || '').trim(), (postal_code || '').trim(), (city || '').trim(),
        (phone || '').trim(), (vat || '').trim(), logoValue, req.user.company_id
      );
    } else {
      db.prepare(
        'UPDATE companies SET address = ?, postal_code = ?, city = ?, phone = ?, vat = ? WHERE id = ?'
      ).run(
        (address || '').trim(), (postal_code || '').trim(), (city || '').trim(),
        (phone || '').trim(), (vat || '').trim(), req.user.company_id
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados da empresa' });
  }
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
