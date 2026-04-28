import bcrypt from 'bcryptjs';
import db from './db.js';
import {
  generateTrackingNumber,
  generateSKU,
  generateQRCode
} from '../utils/generators.js';

console.log('🌱 A popular a base de dados com dados de demonstração...');

// Limpar dados (opcional - comentar em produção)
const shouldReset = process.argv.includes('--reset');
if (shouldReset) {
  db.exec(`
    DELETE FROM tracking_events;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM stock_movements;
    DELETE FROM notifications;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM companies;
  `);
  console.log('🗑️  Dados anteriores removidos.');
}

// Verificar se já existe demo
const existing = db.prepare('SELECT id FROM companies WHERE email = ?').get('demo@armazem-express.pt');
if (existing && !shouldReset) {
  console.log('ℹ️  Empresa demo já existe. Use --reset para recriar.');
  process.exit(0);
}

// Criar empresa demo
const passwordHash = bcrypt.hashSync('Demo@2025!', 10);
const subscriptionEnd = new Date();
subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

const companyResult = db
  .prepare(
    `INSERT INTO companies (name, email, plan_id, subscription_status, subscription_end)
     VALUES (?, ?, ?, 'active', ?)`
  )
  .run('Demo PME Logística', 'demo@armazem-express.pt', 2, subscriptionEnd.toISOString());

const companyId = companyResult.lastInsertRowid;

// Criar admin demo
const adminResult = db
  .prepare(
    `INSERT INTO users (company_id, email, password_hash, name, role)
     VALUES (?, 'demo@armazem-express.pt', ?, 'Administrador Demo', 'admin')`
  )
  .run(companyId, passwordHash);

// Criar funcionário demo
const empHash = bcrypt.hashSync('Trabalhador@2025', 10);
db.prepare(
  `INSERT INTO users (company_id, email, password_hash, name, role)
   VALUES (?, 'funcionario@armazem-express.pt', ?, 'João Funcionário', 'employee')`
).run(companyId, empHash);

// Categorias
const categories = ['Eletrónica', 'Vestuário', 'Alimentação', 'Livros', 'Desporto', 'Casa'];
const insertCat = db.prepare('INSERT INTO categories (company_id, name) VALUES (?, ?)');
categories.forEach((c) => insertCat.run(companyId, c));

// Produtos de exemplo
const sampleProducts = [
  { name: 'Portátil HP Pavilion 15"', category: 'Eletrónica', quantity: 25, min_stock: 5, price: 749.99, shelf: 'A-01-03', description: 'Portátil Intel i5, 16GB RAM, 512GB SSD', supplier: 'HP Portugal' },
  { name: 'Rato Logitech MX Master 3', category: 'Eletrónica', quantity: 3, min_stock: 10, price: 89.90, shelf: 'A-02-01', description: 'Rato sem fios premium', supplier: 'Logitech' },
  { name: 'Teclado Mecânico Keychron K2', category: 'Eletrónica', quantity: 0, min_stock: 5, price: 119.00, shelf: 'A-02-02', description: 'Teclado mecânico 75%', supplier: 'Keychron' },
  { name: 'T-Shirt Unisex Algodão', category: 'Vestuário', quantity: 150, min_stock: 30, price: 12.99, shelf: 'B-01-01', description: '100% algodão orgânico', supplier: 'Têxteis Norte' },
  { name: 'Calças de Ganga Slim', category: 'Vestuário', quantity: 45, min_stock: 20, price: 39.99, shelf: 'B-02-01', description: 'Denim stretch azul escuro', supplier: 'Denim Portugal' },
  { name: 'Tenis Running Nike Air', category: 'Desporto', quantity: 18, min_stock: 8, price: 129.00, shelf: 'E-01-02', description: 'Sapatilhas desportivas unissexo', supplier: 'Nike' },
  { name: 'Bola de Futebol Tamanho 5', category: 'Desporto', quantity: 40, min_stock: 10, price: 24.90, shelf: 'E-02-03', description: 'Bola oficial', supplier: 'Adidas' },
  { name: 'Café Delta Lote 35 (250g)', category: 'Alimentação', quantity: 200, min_stock: 50, price: 4.49, shelf: 'C-01-01', description: 'Café torrado em grão', supplier: 'Delta Cafés' },
  { name: 'Azeite Virgem Extra 750ml', category: 'Alimentação', quantity: 85, min_stock: 25, price: 8.99, shelf: 'C-01-02', description: 'Azeite virgem extra do Alentejo', supplier: 'Oliveira da Serra' },
  { name: 'Chocolate Negro 70% (100g)', category: 'Alimentação', quantity: 8, min_stock: 20, price: 3.50, shelf: 'C-02-01', description: 'Chocolate negro premium', supplier: 'Regina' },
  { name: 'Livro - Os Maias (Eça de Queirós)', category: 'Livros', quantity: 22, min_stock: 5, price: 14.95, shelf: 'D-01-01', description: 'Edição de bolso', supplier: 'Porto Editora' },
  { name: 'Livro - O Alquimista', category: 'Livros', quantity: 15, min_stock: 5, price: 12.50, shelf: 'D-01-02', description: 'Paulo Coelho', supplier: 'Bertrand' },
  { name: 'Cafeteira Elétrica Krups', category: 'Casa', quantity: 12, min_stock: 4, price: 59.99, shelf: 'F-01-01', description: 'Cafeteira de filtro 1.25L', supplier: 'Krups' },
  { name: 'Aspirador Dyson V11', category: 'Casa', quantity: 5, min_stock: 3, price: 449.00, shelf: 'F-02-01', description: 'Aspirador sem fios', supplier: 'Dyson' },
  { name: 'Toalha de Banho 100% Algodão', category: 'Casa', quantity: 78, min_stock: 20, price: 14.90, shelf: 'F-03-02', description: 'Toalha 100x150cm', supplier: 'Têxteis Norte' }
];

const insertProduct = db.prepare(
  `INSERT INTO products (company_id, sku, name, description, category, quantity, min_stock, price, shelf, supplier, qr_code)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const insertMovement = db.prepare(
  `INSERT INTO stock_movements (company_id, product_id, type, quantity, reason, user_id)
   VALUES (?, ?, 'add', ?, 'Stock inicial', ?)`
);

const productIds = [];
for (const p of sampleProducts) {
  const sku = generateSKU(p.category);
  const result = insertProduct.run(
    companyId,
    sku,
    p.name,
    p.description,
    p.category,
    p.quantity,
    p.min_stock,
    p.price,
    p.shelf,
    p.supplier,
    generateQRCode(Date.now(), sku)
  );
  const pid = result.lastInsertRowid;
  // Atualizar QR Code com ID
  db.prepare('UPDATE products SET qr_code = ? WHERE id = ?').run(
    generateQRCode(pid, sku),
    pid
  );
  insertMovement.run(companyId, pid, p.quantity, adminResult.lastInsertRowid);
  productIds.push(pid);
}

// Encomendas de exemplo
const sampleOrders = [
  {
    recipient_name: 'Maria Santos',
    recipient_address: 'Rua das Flores 123, 3ºD',
    recipient_city: 'Lisboa',
    recipient_postal_code: '1200-456',
    recipient_phone: '912345678',
    recipient_email: 'maria.santos@exemplo.pt',
    status: 'delivered',
    items: [{ idx: 0, qty: 1 }, { idx: 1, qty: 2 }]
  },
  {
    recipient_name: 'Pedro Martins',
    recipient_address: 'Avenida da Liberdade 45',
    recipient_city: 'Porto',
    recipient_postal_code: '4000-123',
    recipient_phone: '934567890',
    recipient_email: 'pedro.m@exemplo.pt',
    status: 'in_transit',
    items: [{ idx: 3, qty: 5 }, { idx: 4, qty: 2 }]
  },
  {
    recipient_name: 'Ana Costa',
    recipient_address: 'Rua do Comércio 78',
    recipient_city: 'Coimbra',
    recipient_postal_code: '3000-789',
    recipient_phone: '961122334',
    status: 'shipped',
    items: [{ idx: 7, qty: 10 }, { idx: 8, qty: 3 }]
  },
  {
    recipient_name: 'Rui Oliveira',
    recipient_address: 'Praça do Rossio 10',
    recipient_city: 'Lisboa',
    recipient_postal_code: '1100-200',
    recipient_phone: '925544332',
    status: 'pending',
    items: [{ idx: 5, qty: 1 }]
  },
  {
    recipient_name: 'Carla Fernandes',
    recipient_address: 'Rua de Santa Catarina 200',
    recipient_city: 'Porto',
    recipient_postal_code: '4000-300',
    recipient_phone: '913344556',
    recipient_email: 'carla.f@exemplo.pt',
    status: 'delivered',
    items: [{ idx: 10, qty: 2 }, { idx: 11, qty: 1 }]
  }
];

const insertOrder = db.prepare(
  `INSERT INTO orders (
    company_id, tracking_number, recipient_name, recipient_address,
    recipient_city, recipient_postal_code, recipient_phone, recipient_email,
    status, total_value, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const insertOrderItem = db.prepare(
  `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
   VALUES (?, ?, ?, ?, ?)`
);

const insertTracking = db.prepare(
  `INSERT INTO tracking_events (order_id, status, location, description, created_at)
   VALUES (?, ?, ?, ?, ?)`
);

sampleOrders.forEach((o, orderIdx) => {
  let total = 0;
  const itemsInfo = o.items.map((it) => {
    const pid = productIds[it.idx];
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(pid);
    total += product.price * it.qty;
    return { product, qty: it.qty };
  });

  const tracking = generateTrackingNumber();
  const daysAgo = (sampleOrders.length - orderIdx) * 2;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  const orderResult = insertOrder.run(
    companyId,
    tracking,
    o.recipient_name,
    o.recipient_address,
    o.recipient_city,
    o.recipient_postal_code,
    o.recipient_phone,
    o.recipient_email || null,
    o.status,
    total,
    adminResult.lastInsertRowid
  );

  const orderId = orderResult.lastInsertRowid;

  // Atualizar created_at
  db.prepare('UPDATE orders SET created_at = ?, updated_at = ? WHERE id = ?').run(
    createdAt.toISOString(),
    createdAt.toISOString(),
    orderId
  );

  itemsInfo.forEach((it) => {
    insertOrderItem.run(orderId, it.product.id, it.product.name, it.qty, it.product.price);
  });

  // Tracking events baseado no estado
  const baseTime = createdAt.getTime();
  const hour = 3600 * 1000;
  insertTracking.run(
    orderId,
    'created',
    'Armazém Central',
    'Encomenda registada no sistema',
    new Date(baseTime).toISOString()
  );
  insertTracking.run(
    orderId,
    'pending',
    'Armazém Central',
    'A preparar expedição',
    new Date(baseTime + 1 * hour).toISOString()
  );

  if (['shipped', 'in_transit', 'delivered'].includes(o.status)) {
    insertTracking.run(
      orderId,
      'shipped',
      'Centro de Expedição - Lisboa',
      'Encomenda expedida do armazém',
      new Date(baseTime + 5 * hour).toISOString()
    );
  }
  if (['in_transit', 'delivered'].includes(o.status)) {
    insertTracking.run(
      orderId,
      'in_transit',
      `Em trânsito para ${o.recipient_city}`,
      'Encomenda em trânsito para o destinatário',
      new Date(baseTime + 12 * hour).toISOString()
    );
  }
  if (o.status === 'delivered') {
    insertTracking.run(
      orderId,
      'delivered',
      o.recipient_city,
      'Encomenda entregue ao destinatário',
      new Date(baseTime + 24 * hour).toISOString()
    );
  }
});

// Notificações
const insertNotif = db.prepare(
  `INSERT INTO notifications (company_id, type, title, message)
   VALUES (?, ?, ?, ?)`
);

insertNotif.run(
  companyId,
  'success',
  'Bem-vindo ao Armazém Express! 🎉',
  'A sua subscrição do plano Business foi ativada com sucesso.'
);
insertNotif.run(
  companyId,
  'warning',
  'Stock Baixo ⚠️',
  'O produto "Rato Logitech MX Master 3" está com stock baixo (3 unidades).'
);
insertNotif.run(
  companyId,
  'error',
  'Sem Stock ❌',
  'O produto "Teclado Mecânico Keychron K2" está esgotado.'
);
insertNotif.run(
  companyId,
  'info',
  'Nova Encomenda 📦',
  'Encomenda expedida com sucesso para Maria Santos (Lisboa).'
);

console.log('');
console.log('✅ Base de dados populada com sucesso!');
console.log('');
console.log('📝 Credenciais de demonstração:');
console.log('   🔹 Admin:       demo@armazem-express.pt / Demo@2025!');
console.log('   🔹 Funcionário: funcionario@armazem-express.pt / Trabalhador@2025');
console.log('');
console.log(`📊 Dados criados:`);
console.log(`   • 1 Empresa (Demo PME Logística - Plano Business)`);
console.log(`   • 2 Utilizadores (1 admin + 1 funcionário)`);
console.log(`   • ${sampleProducts.length} Produtos`);
console.log(`   • ${sampleOrders.length} Encomendas`);
console.log(`   • ${categories.length} Categorias`);
console.log('');

process.exit(0);
