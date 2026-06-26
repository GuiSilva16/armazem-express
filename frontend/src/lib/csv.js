// Normaliza um cabeçalho (minúsculas, sem acentos)
const norm = (s) =>
  s.toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const HEADER_MAP = {
  nome: 'name', name: 'name', produto: 'name',
  categoria: 'category', category: 'category',
  quantidade: 'quantity', quantity: 'quantity', qtd: 'quantity', stock: 'quantity',
  'stock minimo': 'min_stock', min_stock: 'min_stock', minimo: 'min_stock', 'minimo de stock': 'min_stock',
  preco: 'price', price: 'price', 'preco (eur)': 'price', 'preco eur': 'price',
  prateleira: 'shelf', shelf: 'shelf', localizacao: 'shelf',
  fornecedor: 'supplier', supplier: 'supplier',
  sku: 'sku'
};

// Divide uma linha CSV respeitando aspas. sep = ';' ou ','
function splitLine(line, sep) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/**
 * Converte texto CSV em array de objetos { name, category, quantity, min_stock, price, shelf, supplier, sku }.
 * Aceita separador ';' ou ',' e ignora o BOM.
 */
export function parseProductsCSV(text) {
  const clean = text.replace(/^﻿/, '').replace(/\r/g, '');
  const lines = clean.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const headers = splitLine(lines[0], sep).map((h) => HEADER_MAP[norm(h)] || null);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], sep);
    const obj = {};
    headers.forEach((key, idx) => {
      if (key) obj[key] = cells[idx] ?? '';
    });
    if (obj.name || obj.category) rows.push(obj);
  }
  return rows;
}

export const CSV_TEMPLATE =
  'Nome;Categoria;Quantidade;Stock Mínimo;Preço;Prateleira;Fornecedor\n' +
  'Teclado Mecânico;Eletrónica;50;10;29.99;A-01-02;Logitech\n' +
  'Caderno A4;Papelaria;200;30;1.50;B-03-01;Ambar';
