import crypto from 'crypto';

/**
 * Gera uma password forte aleatória
 * Inclui letras maiúsculas, minúsculas, números e símbolos
 */
export const generateStrongPassword = (length = 14) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*+=?';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Garantir pelo menos 1 de cada tipo
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Baralhar os caracteres
  return password
    .split('')
    .sort(() => crypto.randomInt(2) - 0.5)
    .join('');
};

/**
 * Gera um número de tracking único
 * Formato: AE + 12 dígitos + PT
 */
export const generateTrackingNumber = () => {
  const digits = Array.from({ length: 12 }, () => crypto.randomInt(10)).join('');
  return `AE${digits}PT`;
};

/**
 * Gera um SKU único baseado na categoria e timestamp
 */
export const generateSKU = (category) => {
  const clean = (category || '').toString().trim();
  const prefix = clean ? clean.substring(0, 3).toUpperCase() : 'GEN';
  const timestamp = Date.now().toString().slice(-6);
  // 4 bytes (8 hex) garante unicidade mesmo em criações em série
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Gera um código QR identificador
 */
export const generateQRCode = (productId, sku) => {
  return `AEX-QR-${productId}-${sku}`;
};
