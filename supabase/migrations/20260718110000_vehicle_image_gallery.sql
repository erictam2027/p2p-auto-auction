-- Store a complete, ordered photo set while retaining image_url as the primary image.
-- Safe to re-run.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE vehicles
SET image_urls = ARRAY[image_url]
WHERE coalesce(cardinality(image_urls), 0) = 0
  AND nullif(btrim(image_url), '') IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_image_urls_limit'
      AND conrelid = 'public.vehicles'::regclass
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_image_urls_limit
      CHECK (cardinality(image_urls) <= 12);
  END IF;
END $$;
