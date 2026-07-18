-- Seller-reported sale terms make a listing's risk and documentation easier to scan.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS sale_light text,
  ADD COLUMN IF NOT EXISTS condition_grade numeric(2, 1),
  ADD COLUMN IF NOT EXISTS title_present boolean,
  ADD COLUMN IF NOT EXISTS seller_announcements text;

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_sale_light_check,
  ADD CONSTRAINT vehicles_sale_light_check
    CHECK (sale_light IS NULL OR sale_light IN ('green', 'yellow', 'red'));

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_condition_grade_check,
  ADD CONSTRAINT vehicles_condition_grade_check
    CHECK (condition_grade IS NULL OR (condition_grade >= 0 AND condition_grade <= 5));
