/*
  # Add Domain Caching for Performance

  1. Changes
    - Add `resolved_domain` column to users table for caching Unstoppable Domains / ENS names
    - Add `domain_resolved_at` column to track when domain was last resolved
    - Add `domain_resolution_failed` column to prevent repeated failed lookups
  
  2. Benefits
    - Avoid slow domain resolution on every page load
    - Cache resolved domains for 24 hours
    - Skip resolution for addresses that previously failed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'resolved_domain'
  ) THEN
    ALTER TABLE users ADD COLUMN resolved_domain text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'domain_resolved_at'
  ) THEN
    ALTER TABLE users ADD COLUMN domain_resolved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'domain_resolution_failed'
  ) THEN
    ALTER TABLE users ADD COLUMN domain_resolution_failed boolean DEFAULT false;
  END IF;
END $$;
