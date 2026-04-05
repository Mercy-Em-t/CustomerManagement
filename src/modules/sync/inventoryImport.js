const fs = require('fs').promises;
const path = require('path');

const REQUIRED_COLUMNS = ['external_id', 'name', 'price', 'stock', 'category'];

function parseCsv(content) {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const parts = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx] || '';
    });
    return row;
  });
}

function normalizeRow(row) {
  const category = String(row.category || '').toLowerCase().replace(/\s+/g, '_');
  const tags = String(row.tags || '')
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    id: row.external_id,
    name: row.name,
    description: row.description || null,
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    category,
    tags,
  };
}

function validateHeaders(rows) {
  if (!rows.length) throw new Error('Inventory file has no data rows');
  const keys = Object.keys(rows[0] || {});
  for (const col of REQUIRED_COLUMNS) {
    if (!keys.includes(col)) {
      throw new Error(`Missing required inventory column: ${col}`);
    }
  }
}

async function importInventoryCsv(csvFilePath) {
  const fullPath = path.resolve(csvFilePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  const rows = parseCsv(raw);
  validateHeaders(rows);
  return rows.map(normalizeRow);
}

module.exports = {
  importInventoryCsv,
  parseCsv,
  normalizeRow,
};
