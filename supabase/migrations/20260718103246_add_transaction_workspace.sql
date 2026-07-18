-- A shared, auditable post-sale workspace for each completed auction.
ALTER TABLE public.escrow_transactions
  ADD COLUMN IF NOT EXISTS title_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS handoff_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS transport_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delivery_method text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS seller_vehicle_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_handoff_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_delivery_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS dispute_opened_at timestamptz;

ALTER TABLE public.escrow_transactions
  DROP CONSTRAINT IF EXISTS escrow_transactions_title_status_check,
  ADD CONSTRAINT escrow_transactions_title_status_check
    CHECK (title_status IN ('not_requested', 'requested', 'submitted', 'verified', 'released')),
  DROP CONSTRAINT IF EXISTS escrow_transactions_handoff_status_check,
  ADD CONSTRAINT escrow_transactions_handoff_status_check
    CHECK (handoff_status IN ('not_ready', 'ready', 'seller_confirmed', 'buyer_confirmed')),
  DROP CONSTRAINT IF EXISTS escrow_transactions_transport_status_check,
  ADD CONSTRAINT escrow_transactions_transport_status_check
    CHECK (transport_status IN ('not_requested', 'requested', 'scheduled', 'in_transit', 'delivered')),
  DROP CONSTRAINT IF EXISTS escrow_transactions_dispute_status_check,
  ADD CONSTRAINT escrow_transactions_dispute_status_check
    CHECK (dispute_status IN ('none', 'open', 'resolved')),
  DROP CONSTRAINT IF EXISTS escrow_transactions_delivery_method_check,
  ADD CONSTRAINT escrow_transactions_delivery_method_check
    CHECK (delivery_method IS NULL OR delivery_method IN ('pickup', 'transport'));

CREATE TABLE IF NOT EXISTS public.transaction_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  document_type text NOT NULL CHECK (document_type IN ('title', 'bill_of_sale', 'bill_of_lading', 'inspection', 'other')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction
  ON public.transaction_documents(transaction_id, created_at DESC);

ALTER TABLE public.transaction_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transaction participants can view document records"
ON public.transaction_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id = transaction_documents.transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Transaction participants can add their own document records"
ON public.transaction_documents
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id = transaction_documents.transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS public.transaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id),
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_events_transaction
  ON public.transaction_events(transaction_id, created_at DESC);

ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transaction participants can view events"
ON public.transaction_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id = transaction_events.transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Transaction participants can add events"
ON public.transaction_events
FOR INSERT
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id = transaction_events.transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-documents',
  'transaction-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Transaction participants upload their own documents" ON storage.objects;
CREATE POLICY "Transaction participants upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id::text = (storage.foldername(name))[2]
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Transaction participants manage their own documents" ON storage.objects;
CREATE POLICY "Transaction participants manage their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE escrow_transactions.id::text = (storage.foldername(name))[2]
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);
