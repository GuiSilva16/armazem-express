/**
 * Valida formato de email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida número de telefone português
 * Aceita: 9 dígitos começando com 2, 3 ou 9, ou com +351
 */
export const isValidPhonePT = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+351/, '');
  return /^[23]\d{8}$/.test(cleaned) || /^9[1236]\d{7}$/.test(cleaned);
};

/**
 * Valida código postal português (formato XXXX-XXX)
 */
export const isValidPostalCodePT = (code) => {
  if (!code || typeof code !== 'string') return false;
  return /^\d{4}-\d{3}$/.test(code.trim());
};

/**
 * Valida que uma string contém apenas letras e espaços (para nomes)
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  return /^[A-Za-zÀ-ÿ\s'.-]+$/.test(trimmed);
};

/**
 * Valida password forte (mín. 8, 1 maiúscula, 1 minúscula, 1 número)
 */
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
};

/**
 * Valida que um valor é um número positivo
 */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0 && isFinite(num);
};

/**
 * Valida que um valor é um inteiro positivo
 */
export const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};
