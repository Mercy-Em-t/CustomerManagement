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

function normalizeCategory(category) {
  return String(category || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseTags(rawTags) {
  return String(rawTags || '')
    .split(/[|,]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeRow(row) {
  const category = normalizeCategory(row.category);
  const tags = parseTags(row.tags);
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

function parseMessyProductList(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const chunks = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.split(',').map((part) => part.trim()).filter(Boolean));

  return chunks.map((entry, idx) => {
    const match = entry.match(/^(.*?)(?:\s+|[-:])(\d+(?:\.\d+)?)$/);
    const name = (match ? match[1] : entry).trim();
    const price = Number(match ? match[2] : 0) || 0;
    const lower = name.toLowerCase();
    const inferredCategory = lower.includes('tea')
      ? 'teas'
      : lower.includes('oat') || lower.includes('cereal')
        ? 'cereals'
        : lower.includes('seed')
          ? 'seeds'
          : lower.includes('nut')
            ? 'nuts'
            : lower.includes('powder') || lower.includes('supplement')
              ? 'supplements'
              : lower.includes('spice') || lower.includes('cinnamon')
                ? 'spices'
                : 'wellness';

    return {
      id: `manual_${idx + 1}`,
      name,
      description: null,
      price,
      stock: 0,
      category: normalizeCategory(inferredCategory),
      tags: [],
    };
  });
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
  parseMessyProductList,
  normalizeCategory,
  parseTags,
};
