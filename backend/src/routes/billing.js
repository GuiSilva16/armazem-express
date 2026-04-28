import express from 'express';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { generateStrongPassword } from '../utils/generators.js';
import { isValidEmail, isValidName } from '../utils/validators.js';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function ensureStripe(res) {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe não está configurado no servidor (STRIPE_SECRET_KEY em falta).' });
    return false;
  }
  return true;
}

/**
 * POST /api/billing/checkout
 * Inicia checkout Stripe para nova subscrição (pré-registo).
 * Body: { companyName, email, planId }
 * Retorna: { url } para redirecionar o utilizador.
 */
router.post('/checkout', async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    const { companyName, email, planId } = req.body;

    if (!companyName || !email || !planId) {
      return res.status(400).json({ error: 'Nome da empresa, email e plano são obrigatórios' });
    }
    if (!isValidName(companyName)) {
      return res.status(400).json({ error: 'Nome da empresa inválido' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    if (!plan) return res.status(400).json({ error: 'Plano inválido' });
    if (!plan.stripe_price_id) {
      return res.status(500).json({ error: `Plano ${plan.name} não tem stripe_price_id configurado` });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCompany = companyName.trim();

    const existing = db
      .prepare('SELECT id FROM companies WHERE name = ? OR email = ?')
      .get(cleanCompany, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma empresa registada com este nome ou email' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      customer_email: cleanEmail,
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      metadata: {
        kind: 'new_subscription',
        companyName: cleanCompany,
        email: cleanEmail,
        planId: String(planId)
      },
      subscription_data: {
        metadata: {
          companyName: cleanCompany,
          email: cleanEmail,
          planId: String(planId)
        }
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Erro no checkout Stripe:', err);
    res.status(500).json({ error: 'Erro ao iniciar pagamento' });
  }
});

/**
 * GET /api/billing/session/:id
 * Confirma estado de uma sessão de checkout (após redirect success).
 * Devolve credenciais geradas se a empresa foi criada via webhook.
 */
router.get('/session/:id', async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });

    const email = session.metadata?.email || session.customer_email;
    const company = email
      ? db.prepare('SELECT id, name FROM companies WHERE email = ?').get(email)
      : null;

    const creds = db
      .prepare('SELECT email, password, company_name, plan_name FROM checkout_credentials WHERE session_id = ?')
      .get(session.id);

    res.json({
      paid: session.payment_status === 'paid',
      email,
      companyName: session.metadata?.companyName,
      companyCreated: !!company,
      credentials: creds || null
    });
  } catch (err) {
    console.error('Erro a verificar sessão:', err);
    res.status(500).json({ error: 'Erro a verificar sessão' });
  }
});

/**
 * POST /api/billing/change-plan
 * Atualiza a subscrição existente para outro plano (com proration).
 * Apenas admin.
 */
router.post('/change-plan', authenticate, async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar o plano' });
    }
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId é obrigatório' });

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
    if (!plan.stripe_price_id) {
      return res.status(500).json({ error: `Plano ${plan.name} não tem stripe_price_id configurado` });
    }

    const company = db
      .prepare('SELECT * FROM companies WHERE id = ?')
      .get(req.user.company_id);

    // Verifica limites antes de mudar
    const productCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE company_id = ?').get(company.id).c;
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE company_id = ?').get(company.id).c;
    if (plan.max_products !== -1 && productCount > plan.max_products) {
      return res.status(400).json({
        error: `O plano ${plan.name} permite ${plan.max_products} produtos, mas tem ${productCount}.`
      });
    }
    if (plan.max_employees !== -1 && userCount > plan.max_employees) {
      return res.status(400).json({
        error: `O plano ${plan.name} permite ${plan.max_employees} utilizadores, mas tem ${userCount}.`
      });
    }

    // Se a empresa não tem subscrição Stripe (foi criada antes da integração),
    // cria sessão de checkout para começar a cobrar — devolve URL.
    if (!company.stripe_subscription_id) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        customer_email: company.email,
        success_url: `${FRONTEND_URL}/app/settings?billing=success`,
        cancel_url: `${FRONTEND_URL}/app/settings?billing=cancel`,
        metadata: {
          kind: 'attach_existing_company',
          companyId: String(company.id),
          planId: String(planId)
        },
        subscription_data: {
          metadata: {
            companyId: String(company.id),
            planId: String(planId)
          }
        }
      });
      return res.json({ checkoutUrl: session.url });
    }

    // Caso normal: atualiza a subscrição existente com proration
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
    const itemId = subscription.items.data[0].id;

    await stripe.subscriptions.update(company.stripe_subscription_id, {
      items: [{ id: itemId, price: plan.stripe_price_id }],
      proration_behavior: 'create_prorations',
      metadata: { ...subscription.metadata, planId: String(planId), companyId: String(company.id) }
    });

    // Atualiza local (o webhook também atualiza, mas adiantamos para UX)
    db.prepare('UPDATE companies SET plan_id = ? WHERE id = ?').run(planId, company.id);

    res.json({
      success: true,
      plan: { ...plan, features: JSON.parse(plan.features || '[]') },
      message: `Plano alterado para ${plan.name}. A diferença é cobrada proporcionalmente.`
    });
  } catch (err) {
    console.error('Erro ao mudar plano:', err);
    res.status(500).json({ error: 'Erro ao mudar plano' });
  }
});

/**
 * POST /api/billing/cancel
 * Cancela a subscrição no fim do período atual (não emite reembolso).
 */
router.post('/cancel', authenticate, async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem cancelar' });
    }
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.user.company_id);
    if (!company.stripe_subscription_id) {
      return res.status(400).json({ error: 'Sem subscrição ativa para cancelar' });
    }

    await stripe.subscriptions.update(company.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    res.json({ success: true, message: 'Subscrição será cancelada no fim do período atual.' });
  } catch (err) {
    console.error('Erro ao cancelar subscrição:', err);
    res.status(500).json({ error: 'Erro ao cancelar subscrição' });
  }
});

/**
 * POST /api/billing/webhook
 * Recebe eventos da Stripe. Tem de ser registado com express.raw() no server.js.
 */
export const webhookHandler = async (req, res) => {
  if (!stripe) return res.status(503).end();

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (secret) {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } else {
      // Em dev, sem secret, aceita JSON cru (apenas para testes locais)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const meta = session.metadata || {};

        if (meta.kind === 'new_subscription') {
          await handleNewSubscription(session, meta);
        } else if (meta.kind === 'attach_existing_company') {
          await handleAttachToExistingCompany(session, meta);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const planId = sub.metadata?.planId ? Number(sub.metadata.planId) : null;
        const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'inactive';
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

        if (planId) {
          db.prepare(
            `UPDATE companies SET plan_id = ?, subscription_status = ?, subscription_end = ?
             WHERE stripe_subscription_id = ?`
          ).run(planId, status, periodEnd, sub.id);
        } else {
          db.prepare(
            `UPDATE companies SET subscription_status = ?, subscription_end = ?
             WHERE stripe_subscription_id = ?`
          ).run(status, periodEnd, sub.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        db.prepare(
          `UPDATE companies SET subscription_status = 'cancelled' WHERE stripe_subscription_id = ?`
        ).run(sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(
            `UPDATE companies SET subscription_status = 'past_due' WHERE stripe_subscription_id = ?`
          ).run(invoice.subscription);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Erro a processar webhook:', err);
    res.status(500).json({ error: 'Erro a processar webhook' });
  }
};

async function handleNewSubscription(session, meta) {
  const email = (meta.email || session.customer_email || '').toLowerCase().trim();
  const companyName = meta.companyName?.trim();
  const planId = Number(meta.planId);

  if (!email || !companyName || !planId) return;

  // Idempotência: se já existe, não recria
  const existing = db.prepare('SELECT id FROM companies WHERE email = ?').get(email);
  if (existing) return;

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
  if (!plan) return;

  const generatedPassword = generateStrongPassword(14);
  const passwordHash = bcrypt.hashSync(generatedPassword, 10);

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const trx = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO companies (name, email, plan_id, subscription_status, subscription_end,
                              stripe_customer_id, stripe_subscription_id)
       VALUES (?, ?, ?, 'active', ?, ?, ?)`
    ).run(companyName, email, planId, periodEnd.toISOString(), session.customer, session.subscription);

    const companyId = result.lastInsertRowid;

    db.prepare(
      `INSERT INTO users (company_id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, 'admin')`
    ).run(companyId, email, passwordHash, `Admin de ${companyName}`);

    const cats = ['Eletrónica', 'Vestuário', 'Alimentação', 'Outros'];
    const insertCat = db.prepare('INSERT INTO categories (company_id, name) VALUES (?, ?)');
    cats.forEach((c) => insertCat.run(companyId, c));

    db.prepare(
      `INSERT INTO notifications (company_id, type, title, message)
       VALUES (?, 'success', ?, ?)`
    ).run(
      companyId,
      'Bem-vindo ao Armazém Express! 🎉',
      `A sua subscrição do plano ${plan.name} foi ativada com sucesso.`
    );
  });
  trx();

  // Guardar password gerada num registo temporário, lido pela rota /session/:id
  // Solução simples: gravar na notificação ou tabela própria. Aqui usa-se uma tabela auxiliar.
  db.prepare(
    `INSERT OR REPLACE INTO checkout_credentials (session_id, email, password, company_name, plan_name, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(session.id, email, generatedPassword, companyName, plan.name);
}

async function handleAttachToExistingCompany(session, meta) {
  const companyId = Number(meta.companyId);
  const planId = Number(meta.planId);
  if (!companyId || !planId) return;

  db.prepare(
    `UPDATE companies SET plan_id = ?, stripe_customer_id = ?, stripe_subscription_id = ?,
                          subscription_status = 'active'
     WHERE id = ?`
  ).run(planId, session.customer, session.subscription, companyId);
}

export default router;
