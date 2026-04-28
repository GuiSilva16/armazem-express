import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from '../src/database/db.js';
import authRoutes from '../src/routes/auth.js';
import productsRoutes from '../src/routes/products.js';
import ordersRoutes from '../src/routes/orders.js';

dotenv.config();

// Setup app para testes
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Dados de teste
let testCompanyId;
let testUserId;
let testToken;
let testProductId;

beforeAll(async () => {
  // Limpa e cria dados de teste isolados
  const companyId = 'test-company-' + Date.now();
  const userId = 'test-user-' + Date.now();

  // Criar plano (ignora se já existe)
  const plan = db.prepare('SELECT id FROM plans LIMIT 1').get();

  db.prepare(`
    INSERT INTO companies (id, name, email, plan_id, subscription_status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(companyId, 'Empresa Teste', `test-${Date.now()}@test.pt`, plan.id);

  const hash = bcrypt.hashSync('TestPass@2025', 10);
  db.prepare(`
    INSERT INTO users (id, company_id, name, email, password_hash, role, active)
    VALUES (?, ?, ?, ?, ?, 'admin', 1)
  `).run(userId, companyId, 'Admin Teste', `admin-${Date.now()}@test.pt`, hash);

  testCompanyId = companyId;
  testUserId = userId;
  testToken = jwt.sign(
    { userId, companyId, role: 'admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(() => {
  // Limpeza
  db.prepare('DELETE FROM products WHERE company_id = ?').run(testCompanyId);
  db.prepare('DELETE FROM users WHERE company_id = ?').run(testCompanyId);
  db.prepare('DELETE FROM companies WHERE id = ?').run(testCompanyId);
});

describe('API /auth', () => {
  it('GET /plans retorna lista de planos', async () => {
    const res = await request(app).get('/api/auth/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('price');
  });

  it('POST /login com credenciais erradas retorna 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao-existe@test.pt', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /me sem token retorna 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me com token válido retorna user + plan', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('plan');
    expect(res.body.user.role).toBe('admin');
  });
});

describe('API /products', () => {
  it('GET / sem token retorna 401', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('POST / cria produto válido', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Produto Teste',
        category: 'Teste',
        quantity: 100,
        min_stock: 10,
        price: 25.50,
        shelf: 'T-01-01'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('sku');
    expect(res.body).toHaveProperty('qr_code');
    expect(res.body.quantity).toBe(100);
    testProductId = res.body.id;
  });

  it('POST / rejeita produto sem nome', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        category: 'Teste',
        quantity: 10,
        price: 5,
        shelf: 'A-01-01'
      });
    expect(res.status).toBe(400);
  });

  it('POST / rejeita quantidade negativa', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Teste',
        category: 'Teste',
        quantity: -5,
        price: 10,
        shelf: 'A-01-01'
      });
    expect(res.status).toBe(400);
  });

  it('GET /:id retorna produto com movimentos', async () => {
    const res = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('movements');
    expect(Array.isArray(res.body.movements)).toBe(true);
  });

  it('POST /:id/adjust adiciona stock', async () => {
    const res = await request(app)
      .post(`/api/products/${testProductId}/adjust`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ type: 'add', amount: 50, reason: 'Teste' });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(150);
  });

  it('POST /:id/adjust remove stock', async () => {
    const res = await request(app)
      .post(`/api/products/${testProductId}/adjust`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ type: 'remove', amount: 30, reason: 'Teste' });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(120);
  });

  it('POST /:id/adjust bloqueia remover mais do que stock', async () => {
    const res = await request(app)
      .post(`/api/products/${testProductId}/adjust`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ type: 'remove', amount: 9999, reason: 'Teste' });

    expect(res.status).toBe(400);
  });

  it('GET /stats retorna estatísticas', async () => {
    const res = await request(app)
      .get('/api/products/stats')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('inStock');
    expect(res.body).toHaveProperty('lowStock');
    expect(res.body).toHaveProperty('outOfStock');
  });
});

describe('API /orders', () => {
  it('POST / rejeita telefone inválido', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        recipient_name: 'Cliente Teste',
        recipient_address: 'Rua Teste 123',
        recipient_city: 'Lisboa',
        recipient_postal_code: '1200-456',
        recipient_phone: '123', // inválido
        items: [{ product_id: testProductId, quantity: 1 }]
      });

    expect(res.status).toBe(400);
  });

  it('POST / rejeita código postal inválido', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        recipient_name: 'Cliente',
        recipient_address: 'Rua Teste',
        recipient_city: 'Lisboa',
        recipient_postal_code: '12345', // inválido
        recipient_phone: '912345678',
        items: [{ product_id: testProductId, quantity: 1 }]
      });

    expect(res.status).toBe(400);
  });

  it('POST / cria encomenda válida e desconta stock', async () => {
    const before = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${testToken}`);
    const stockBefore = before.body.quantity;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        recipient_name: 'Maria Silva',
        recipient_address: 'Rua das Flores 123',
        recipient_city: 'Lisboa',
        recipient_postal_code: '1200-456',
        recipient_phone: '912345678',
        items: [{ product_id: testProductId, quantity: 5 }]
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('tracking_number');
    expect(res.body.tracking_number).toMatch(/^AE\d{12}PT$/);

    const after = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(after.body.quantity).toBe(stockBefore - 5);
  });
});
