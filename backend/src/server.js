import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import './database/db.js'; // inicializa base de dados
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import billingRoutes, { webhookHandler } from './routes/billing.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS + logs
app.use(cors());
app.use(morgan('dev'));

// IMPORTANTE: webhook do Stripe usa raw body (verificação de assinatura).
// Tem de ser registado ANTES do express.json().
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// JSON para o resto das rotas
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Armazém Express API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   🏭  ARMAZÉM EXPRESS - Backend API                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   ✅ Servidor a correr em http://localhost:${PORT}      ║`);
  console.log('║   📦 Sistema de Gestão de Armazém (WMS)              ║');
  console.log('║   🎓 PAP - Guilherme Silva (2223243)                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});
