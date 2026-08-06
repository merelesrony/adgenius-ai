-- Visual Product DNA: persistent visual identity stored on the product itself
-- Analysis happens once; all future campaigns reuse it automatically.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS visual_dna          JSONB,
  ADD COLUMN IF NOT EXISTS master_visual_prompt TEXT,
  ADD COLUMN IF NOT EXISTS analyzed_at          TIMESTAMPTZ;

COMMENT ON COLUMN products.visual_dna           IS 'Structured visual identity extracted from product image via Claude Vision';
COMMENT ON COLUMN products.master_visual_prompt IS 'Cached masterPrompt from visual_dna for quick SQL access';
COMMENT ON COLUMN products.analyzed_at          IS 'Timestamp of the last visual identity analysis';
