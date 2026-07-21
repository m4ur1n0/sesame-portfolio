-- extend posts table to support artwork metadata
ALTER TABLE posts ADD COLUMN content_type TEXT NOT NULL DEFAULT 'post';
ALTER TABLE posts ADD COLUMN year TEXT;
ALTER TABLE posts ADD COLUMN medium TEXT;
ALTER TABLE posts ADD COLUMN dimensions TEXT;
ALTER TABLE posts ADD COLUMN price TEXT;
ALTER TABLE posts ADD COLUMN availability TEXT NOT NULL DEFAULT 'available';
ALTER TABLE posts ADD COLUMN gallery_visible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN purchase_visible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN additional_media_ids TEXT;
ALTER TABLE posts ADD COLUMN artist_notes TEXT;
ALTER TABLE posts ADD COLUMN purchase_instructions TEXT;

CREATE TABLE contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  artwork_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
