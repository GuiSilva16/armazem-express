import { Router, Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../database';
import crypto from 'crypto';

const router = Router();

// Hash de password (simples - em produção usar bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verificar password
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nomeEmpresa, email, password, plano } = req.body;

    // Validação
    if (!nomeEmpresa || !email || !password || !plano) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password deve ter pelo menos 8 caracteres' });
    }

    const pool = getPool();
    const hashedPassword = hashPassword(password);

    // Verificar se email já existe
    const checkEmail = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ error: 'Email já registado' });
    }

    // Inserir novo utilizador
    const result = await pool
      .request()
      .input('nomeEmpresa', sql.NVarChar, nomeEmpresa)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .input('plano', sql.NVarChar, plano)
      .query(
        `INSERT INTO Usuarios (NomeEmpresa, Email, PasswordHash, Plano, Ativo)
         VALUES (@nomeEmpresa, @email, @passwordHash, @plano, 1)
         SELECT SCOPE_IDENTITY() as UsuarioID`
      );

    const usuarioID = result.recordset[0].UsuarioID;

    res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso',
      usuario: {
        id: usuarioID,
        nome: nomeEmpresa,
        email: email,
        plano: plano
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validação
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    const pool = getPool();

    // Procurar utilizador
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(
        `SELECT UsuarioID, NomeEmpresa, Email, PasswordHash, Plano, Ativo
         FROM Usuarios WHERE Email = @email`
      );

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email ou password incorretos' });
    }

    const usuario = result.recordset[0];

    // Verificar se está ativo
    if (!usuario.Ativo) {
      return res.status(401).json({ error: 'Utilizador inativo' });
    }

    // Verificar password
    if (!verifyPassword(password, usuario.PasswordHash)) {
      return res.status(401).json({ error: 'Email ou password incorretos' });
    }

    // Atualizar último login
    await pool
      .request()
      .input('usuarioID', sql.Int, usuario.UsuarioID)
      .query('UPDATE Usuarios SET DataUltimoLogin = GETDATE() WHERE UsuarioID = @usuarioID');

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      usuario: {
        id: usuario.UsuarioID,
        nome: usuario.NomeEmpresa,
        email: usuario.Email,
        plano: usuario.Plano
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/usuario/:id
router.get('/usuario/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pool = getPool();
    const result = await pool
      .request()
      .input('usuarioID', sql.Int, parseInt(id))
      .query(
        `SELECT UsuarioID, NomeEmpresa, Email, Plano, DataRegistro
         FROM Usuarios WHERE UsuarioID = @usuarioID`
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({
      success: true,
      usuario: result.recordset[0]
    });
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
});

export default router;
