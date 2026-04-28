import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criar tabelas
const initDb = () => {
  // Tabela de planos de subscrição
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      max_products INTEGER NOT NULL,
      max_employees INTEGER NOT NULL,
      features TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela de empresas (tenants)
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      plan_id INTEGER NOT NULL,
      subscription_status TEXT DEFAULT 'active',
      subscription_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );
  `);

  // Tabela de utilizadores
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);

  // Tabela de categorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      UNIQUE (company_id, name)
    );
  `);

  // Tabela de produtos
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      price REAL NOT NULL DEFAULT 0,
      shelf TEXT,
      qr_code TEXT UNIQUE,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      UNIQUE (company_id, sku)
    );
  `);

  // Tabela de encomendas/expedições
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      tracking_number TEXT UNIQUE NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      recipient_city TEXT NOT NULL,
      recipient_postal_code TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      recipient_email TEXT,
      status TEXT DEFAULT 'pending',
      total_value REAL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // Tabela de itens da encomenda
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Tabela de eventos de tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      description TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migração: adicionar user_id em tracking_events se não existir
  const trackingCols = db.prepare(`PRAGMA table_info(tracking_events)`).all();
  if (!trackingCols.some((c) => c.name === 'user_id')) {
    db.exec(`ALTER TABLE tracking_events ADD COLUMN user_id INTEGER REFERENCES users(id)`);
  }

  // Tabela auxiliar: credenciais geradas pelo webhook, lidas na página de sucesso
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkout_credentials (
      session_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migração: colunas Stripe em companies
  const companyCols = db.prepare(`PRAGMA table_info(companies)`).all();
  if (!companyCols.some((c) => c.name === 'stripe_customer_id')) {
    db.exec(`ALTER TABLE companies ADD COLUMN stripe_customer_id TEXT`);
  }
  if (!companyCols.some((c) => c.name === 'stripe_subscription_id')) {
    db.exec(`ALTER TABLE companies ADD COLUMN stripe_subscription_id TEXT`);
  }

  // Migração: stripe_price_id em plans
  const planCols = db.prepare(`PRAGMA table_info(plans)`).all();
  if (!planCols.some((c) => c.name === 'stripe_price_id')) {
    db.exec(`ALTER TABLE plans ADD COLUMN stripe_price_id TEXT`);
  }

  // Tabela de movimentos de stock (histórico)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Tabela de notificações
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);

  // Inserir planos padrão se não existirem
  const planCount = db.prepare('SELECT COUNT(*) as count FROM plans').get();
  if (planCount.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (name, price, max_products, max_employees, features, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertPlan.run(
      'Starter',
      19.99,
      100,
      2,
      JSON.stringify([
        'Até 100 produtos em stock',
        '2 contas de utilizador',
        'Gestão básica de stock',
        'Processamento de encomendas',
        'Sistema de tracking',
        'Suporte por email'
      ]),
      'Ideal para pequenos negócios a começar a digitalizar o seu armazém.'
    );

    insertPlan.run(
      'Business',
      49.99,
      1000,
      10,
      JSON.stringify([
        'Até 1000 produtos em stock',
        '10 contas de utilizador',
        'Gestão avançada de stock',
        'Processamento de encomendas',
        'Sistema de tracking completo',
        'QR Code scanning',
        'Relatórios e dashboards',
        'Suporte prioritário'
      ]),
      'A escolha mais popular para PMEs em crescimento.'
    );

    insertPlan.run(
      'Enterprise',
      99.99,
      999999,
      999,
      JSON.stringify([
        'Produtos ilimitados',
        'Utilizadores ilimitados',
        'Gestão avançada de stock',
        'Processamento de encomendas',
        'Sistema de tracking completo',
        'QR Code scanning',
        'Relatórios avançados',
        'API de integração',
        'Multi-armazém',
        'Suporte dedicado 24/7'
      ]),
      'Solução completa para empresas com grandes volumes de operação.'
    );
  }

  // Sincronizar stripe_price_id dos planos a partir do .env
  const priceMap = {
    Starter: process.env.STRIPE_PRICE_STARTER,
    Business: process.env.STRIPE_PRICE_BUSINESS,
    Enterprise: process.env.STRIPE_PRICE_ENTERPRISE
  };
  const updatePrice = db.prepare('UPDATE plans SET stripe_price_id = ? WHERE name = ?');
  for (const [name, priceId] of Object.entries(priceMap)) {
    if (priceId) updatePrice.run(priceId, name);
  }

  // Migração: subscrições com validade > 2 meses são corrigidas para +1 mês
  // (o seed antigo criava assinaturas de 12 meses)
  try {
    const companies = db.prepare('SELECT id, subscription_end FROM companies').all();
    const now = Date.now();
    const twoMonths = 62 * 24 * 3600 * 1000;
    for (const c of companies) {
      if (c.subscription_end) {
        const t = new Date(c.subscription_end).getTime();
        if (t - now > twoMonths) {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          db.prepare('UPDATE companies SET subscription_end = ? WHERE id = ?').run(d.toISOString(), c.id);
        }
      }
    }
  } catch (e) {}

  console.log('✅ Base de dados inicializada com sucesso');
};

initDb();

export default db;
