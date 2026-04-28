import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhonePT,
  isValidPostalCodePT,
  isValidName,
  isStrongPassword,
  isPositiveNumber,
  isPositiveInteger
} from '../src/utils/validators.js';
import {
  generateStrongPassword,
  generateTrackingNumber,
  generateSKU,
  generateQRCode
} from '../src/utils/generators.js';

describe('Validadores', () => {
  describe('isValidEmail', () => {
    it('aceita emails válidos', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('teste.user+tag@subdomain.pt')).toBe(true);
    });

    it('rejeita emails inválidos', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@dot')).toBe(false);
      expect(isValidEmail('@no-local.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('isValidPhonePT', () => {
    it('aceita telemóveis portugueses', () => {
      expect(isValidPhonePT('912345678')).toBe(true);
      expect(isValidPhonePT('932345678')).toBe(true);
      expect(isValidPhonePT('962345678')).toBe(true);
    });

    it('aceita fixos portugueses', () => {
      expect(isValidPhonePT('212345678')).toBe(true);
      expect(isValidPhonePT('312345678')).toBe(true);
    });

    it('aceita com indicativo +351', () => {
      expect(isValidPhonePT('+351912345678')).toBe(true);
      expect(isValidPhonePT('+351 912 345 678')).toBe(true);
    });

    it('rejeita números inválidos', () => {
      expect(isValidPhonePT('')).toBe(false);
      expect(isValidPhonePT('123')).toBe(false);
      expect(isValidPhonePT('abc123456')).toBe(false);
      expect(isValidPhonePT('812345678')).toBe(false); // não começa em 2/3/9
      expect(isValidPhonePT('9123456789')).toBe(false); // 10 dígitos
    });
  });

  describe('isValidPostalCodePT', () => {
    it('aceita códigos portugueses válidos', () => {
      expect(isValidPostalCodePT('1200-456')).toBe(true);
      expect(isValidPostalCodePT('4000-100')).toBe(true);
      expect(isValidPostalCodePT('0000-000')).toBe(true);
    });

    it('rejeita códigos inválidos', () => {
      expect(isValidPostalCodePT('')).toBe(false);
      expect(isValidPostalCodePT('1234')).toBe(false);
      expect(isValidPostalCodePT('12345-678')).toBe(false);
      expect(isValidPostalCodePT('abcd-efg')).toBe(false);
      expect(isValidPostalCodePT('1234 567')).toBe(false);
      expect(isValidPostalCodePT('1234567')).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('aceita nomes com letras e acentos', () => {
      expect(isValidName('João Silva')).toBe(true);
      expect(isValidName('Maria Conceição')).toBe(true);
      expect(isValidName("José O'Brien")).toBe(true);
      expect(isValidName('Ana-Maria')).toBe(true);
    });

    it('rejeita nomes com números ou símbolos', () => {
      expect(isValidName('')).toBe(false);
      expect(isValidName('A')).toBe(false); // muito curto
      expect(isValidName('João123')).toBe(false);
      expect(isValidName('@user')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('aceita passwords fortes', () => {
      expect(isStrongPassword('Abcdef1!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd123')).toBe(true);
    });

    it('rejeita passwords fracas', () => {
      expect(isStrongPassword('abc')).toBe(false);
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('PASSWORD123')).toBe(false); // sem minúsculas
      expect(isStrongPassword('password1')).toBe(false); // sem maiúsculas
      expect(isStrongPassword('Password!')).toBe(false); // sem números
      expect(isStrongPassword('Password1')).toBe(false); // sem símbolos
    });
  });

  describe('isPositiveNumber', () => {
    it('aceita números positivos e zero', () => {
      expect(isPositiveNumber(0)).toBe(true);
      expect(isPositiveNumber(1.5)).toBe(true);
      expect(isPositiveNumber('10.99')).toBe(true);
    });

    it('rejeita negativos e não-números', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(undefined)).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('aceita inteiros positivos e zero', () => {
      expect(isPositiveInteger(0)).toBe(true);
      expect(isPositiveInteger(5)).toBe(true);
      expect(isPositiveInteger('100')).toBe(true);
    });

    it('rejeita decimais e negativos', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger('abc')).toBe(false);
    });
  });
});

describe('Geradores', () => {
  describe('generateStrongPassword', () => {
    it('gera password com tamanho default de 14 caracteres', () => {
      const pw = generateStrongPassword();
      expect(pw).toHaveLength(14);
    });

    it('respeita tamanho personalizado', () => {
      expect(generateStrongPassword(20)).toHaveLength(20);
      expect(generateStrongPassword(8)).toHaveLength(8);
    });

    it('inclui pelo menos uma maiúscula, minúscula, número e símbolo', () => {
      for (let i = 0; i < 20; i++) {
        const pw = generateStrongPassword(14);
        expect(pw).toMatch(/[A-Z]/);
        expect(pw).toMatch(/[a-z]/);
        expect(pw).toMatch(/\d/);
        expect(pw).toMatch(/[^A-Za-z0-9]/);
      }
    });

    it('gera passwords diferentes a cada chamada', () => {
      const passwords = new Set();
      for (let i = 0; i < 50; i++) {
        passwords.add(generateStrongPassword());
      }
      expect(passwords.size).toBe(50);
    });

    it('passwords geradas passam no isStrongPassword', () => {
      for (let i = 0; i < 20; i++) {
        expect(isStrongPassword(generateStrongPassword())).toBe(true);
      }
    });
  });

  describe('generateTrackingNumber', () => {
    it('gera no formato AE + 12 dígitos + PT', () => {
      const tn = generateTrackingNumber();
      expect(tn).toMatch(/^AE\d{12}PT$/);
    });

    it('gera números diferentes a cada chamada', () => {
      const nums = new Set();
      for (let i = 0; i < 50; i++) {
        nums.add(generateTrackingNumber());
      }
      expect(nums.size).toBe(50);
    });
  });

  describe('generateSKU', () => {
    it('gera SKU com prefixo baseado na categoria', () => {
      const sku = generateSKU('Eletrónica');
      expect(sku).toMatch(/^ELE-/);
    });

    it('usa GEN- quando categoria é vazia', () => {
      expect(generateSKU('')).toMatch(/^GEN-/);
      expect(generateSKU(null)).toMatch(/^GEN-/);
    });

    it('gera SKUs diferentes', () => {
      const skus = new Set();
      for (let i = 0; i < 50; i++) {
        skus.add(generateSKU('Teste'));
      }
      expect(skus.size).toBe(50);
    });
  });

  describe('generateQRCode', () => {
    it('gera QR code com formato correto', () => {
      const qr = generateQRCode('prod-123', 'ELE-ABC123');
      expect(qr).toBe('AEX-QR-prod-123-ELE-ABC123');
    });

    it('é determinístico com os mesmos inputs', () => {
      expect(generateQRCode('id1', 'sku1')).toBe(generateQRCode('id1', 'sku1'));
    });
  });
});
