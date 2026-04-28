import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../database/db.js';

dotenv.config();

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.company_id, u.active,
                c.name as company_name, c.plan_id, c.subscription_status
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.id = ?`
      )
      .get(decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Utilizador inválido ou inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
  }
  next();
};

import { planHasFeature, MIN_PLAN_FOR, FEATURE_LABEL } from '../utils/planFeatures.js';

export const requireFeature = (feature) => (req, res, next) => {
  const plan = db.prepare('SELECT name FROM plans WHERE id = ?').get(req.user.plan_id);
  if (!plan || !planHasFeature(plan.name, feature)) {
    return res.status(403).json({
      error: `"${FEATURE_LABEL[feature] || feature}" não está disponível no plano ${plan?.name || 'atual'}. Faça upgrade para ${MIN_PLAN_FOR[feature] || 'um plano superior'}.`,
      feature,
      currentPlan: plan?.name,
      requiredPlan: MIN_PLAN_FOR[feature]
    });
  }
  next();
};
