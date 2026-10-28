CREATE TABLE artworks (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  year TEXT,
  medium TEXT,
  dimensions TEXT,
  price TEXT,
  description TEXT,
  artist_notes TEXT,
  purchase_instructions TEXT,
  availability TEXT NOT NULL DEFAULT 'available'
    CHECK (availability IN ('available', 'inquire', 'reserved', 'sold', 'not_for_sale')),
  -- ordered JSON array of {id, ext, w, h, alt}; first entry is the primary image
  images TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX artworks_public ON artworks (published, sort_order);

CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  artwork_slug TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempts (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);

CREATE INDEX login_attempts_ip ON login_attempts (ip, attempted_at);
