ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS external_api_url TEXT,
  ADD COLUMN IF NOT EXISTS external_api_key TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_external
  ON products (business_id, external_id)
  WHERE external_id IS NOT NULL;
