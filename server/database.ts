import sql from 'mssql';

const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'ArmazemExpress',
  authentication: {
    type: 'ntlm',
    options: {
      domain: '',
      userName: '',
      password: ''
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableKeepAlive: true,
    instancename: 'SQLEXPRESS'
  }
};

let pool: sql.ConnectionPool | null = null;

export async function initializeDatabase() {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado à base de dados SQL Server com sucesso!');
    return pool;
  } catch (error) {
    console.error('✗ Erro ao conectar à base de dados:', error);
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Base de dados não inicializada');
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.close();
    console.log('✓ Conexão com a base de dados fechada');
  }
}
