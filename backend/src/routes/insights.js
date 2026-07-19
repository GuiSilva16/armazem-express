import express from 'express';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configuração opcional (como o SMTP/Stripe): só funciona se existir uma chave.
const AI_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';

// Cache simples por empresa (evita gastar tokens a cada abertura da página)
const cache = new Map(); // company_id -> { at, data }
const TTL = 10 * 60 * 1000; // 10 minutos

function isConfigured() {
  return AI_KEY.length > 0;
}

// Reúne um resumo do estado do armazém para dar contexto ao modelo
function buildSummary(companyId) {
  const products = db
    .prepare(
      `SELECT name, category, quantity, min_stock, price, cost_price, expiry_date
         FROM products WHERE company_id = ?`
    )
    .all(companyId);

  const now = Date.now();
  const DAY = 86400000;
  let stockUnits = 0;
  let stockValue = 0;
  const lowStock = [];
  let outOfStock = 0;
  const expiring = [];
  const expired = [];

  for (const p of products) {
    stockUnits += p.quantity;
    stockValue += p.quantity * (p.price || 0);
    if (p.quantity === 0) outOfStock++;
    else if (p.quantity <= p.min_stock) lowStock.push(`${p.name} (${p.quantity}/${p.min_stock})`);
    if (p.expiry_date) {
      const days = Math.ceil((new Date(p.expiry_date).getTime() - now) / DAY);
      if (days < 0) expired.push(`${p.name}`);
      else if (days <= 30) expiring.push(`${p.name} (${days}d)`);
    }
  }

  const ordersByStatus = db
    .prepare(
      `SELECT status, COUNT(*) n FROM orders WHERE company_id = ? GROUP BY status`
    )
    .all(companyId);

  const last30 = db
    .prepare(
      `SELECT COUNT(*) n, COALESCE(SUM(total_value),0) v
         FROM orders
        WHERE company_id = ? AND created_at >= datetime('now','-30 days')`
    )
    .get(companyId);

  const topProducts = db
    .prepare(
      `SELECT oi.product_name, SUM(oi.quantity) qty
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
        WHERE o.company_id = ?
        GROUP BY oi.product_name
        ORDER BY qty DESC
        LIMIT 5`
    )
    .all(companyId);

  return {
    totalProdutos: products.length,
    unidadesEmStock: stockUnits,
    valorStock: Math.round(stockValue * 100) / 100,
    semStock: outOfStock,
    stockBaixo: lowStock.slice(0, 15),
    expirados: expired.slice(0, 15),
    aExpirar30d: expiring.slice(0, 15),
    encomendasPorEstado: ordersByStatus,
    ultimos30dias: { encomendas: last30.n, receita: Math.round(last30.v * 100) / 100 },
    produtosMaisVendidos: topProducts
  };
}

async function askAI(summary) {
  const prompt =
    'És um analista de operações de armazém. Com base neste resumo (JSON) do armazém de uma empresa, ' +
    'escreve 3 a 5 insights curtos e acionáveis em português de Portugal para o gestor. ' +
    'Foca-te em riscos (ruturas de stock, validades), oportunidades e prioridades. ' +
    'Sê concreto e usa os números. Responde apenas com uma lista, cada linha a começar por "• ". ' +
    'Não inventes dados que não estejam no resumo.\n\nResumo:\n' +
    JSON.stringify(summary);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': AI_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`API IA respondeu ${r.status}: ${txt.slice(0, 200)}`);
  }
  const data = await r.json();
  return (data.content || []).map((b) => b.text || '').join('').trim();
}

/**
 * GET /api/insights
 * Gera insights automáticos sobre o armazém usando IA. Opcional: requer AI_API_KEY.
 */
router.get('/', authenticate, async (req, res) => {
  if (!isConfigured()) {
    return res.json({
      configured: false,
      message: 'Insights com IA desativados. Defina AI_API_KEY no servidor para ativar.'
    });
  }
  try {
    const companyId = req.user.company_id;
    const cached = cache.get(companyId);
    if (cached && Date.now() - cached.at < TTL) {
      return res.json({ configured: true, cached: true, ...cached.data });
    }
    const summary = buildSummary(companyId);
    const insights = await askAI(summary);
    const data = { insights, summary, generated_at: new Date().toISOString() };
    cache.set(companyId, { at: Date.now(), data });
    res.json({ configured: true, cached: false, ...data });
  } catch (e) {
    console.error('Erro nos insights com IA:', e.message);
    res.status(502).json({ error: 'Não foi possível gerar insights neste momento.' });
  }
});

export default router;
