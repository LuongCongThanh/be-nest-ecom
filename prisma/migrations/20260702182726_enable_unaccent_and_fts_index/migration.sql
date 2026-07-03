-- Enable unaccent so we can strip Vietnamese diacritics for search.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() is STABLE, not IMMUTABLE, so it cannot be used directly inside an
-- index expression. Wrap it in a thin IMMUTABLE function Postgres will accept.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Weighted, unaccented, case-insensitive full-text search index over
-- name (A) > description (B) > sku (C). Query time must use the exact same
-- expression for Postgres to use this index.
CREATE INDEX products_search_idx ON products USING GIN (
  (
    setweight(to_tsvector('simple', immutable_unaccent(name)), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(sku)), 'C')
  )
);
