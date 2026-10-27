CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'BUSINESS_OWNER', avatar TEXT,
  location TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE, email_verified_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS businesses (
  id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '',
  distance DOUBLE PRECISION DEFAULT 1.0, rating DOUBLE PRECISION DEFAULT 0, reviews_count INTEGER DEFAULT 0,
  is_open INTEGER DEFAULT 0, closes_at TEXT DEFAULT '', verified INTEGER DEFAULT 0, description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '', service_area TEXT DEFAULT '', max_service_radius DOUBLE PRECISION DEFAULT 0,
  home_visit INTEGER DEFAULT 0, visit_charge DOUBLE PRECISION DEFAULT 0, emergency_service INTEGER DEFAULT 0,
  appointment_required INTEGER DEFAULT 0, profile_updated_at TIMESTAMPTZ, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  verification_status TEXT DEFAULT 'VERIFIED', profile_completeness INTEGER DEFAULT 60, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY, business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, price DOUBLE PRECISION, type TEXT NOT NULL DEFAULT 'PRODUCT', status TEXT DEFAULT 'IN_STOCK',
  quantity INTEGER DEFAULT 0, description TEXT DEFAULT '', price_type TEXT DEFAULT 'FIXED', price_min DOUBLE PRECISION,
  price_max DOUBLE PRECISION, updated_at TIMESTAMPTZ DEFAULT NOW(), category_attributes TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS items_business_idx ON items(business_id);
CREATE INDEX IF NOT EXISTS items_name_idx ON items(lower(name));
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS email_verifications (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_verifications_expiry_idx ON email_verifications(expires_at);

CREATE TABLE IF NOT EXISTS business_owners (
  business_id BIGINT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, claim_status TEXT NOT NULL DEFAULT 'VERIFIED'
);
CREATE TABLE IF NOT EXISTS business_hours (
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, day TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0, open_time TEXT, close_time TEXT, periods_json TEXT DEFAULT '[]',
  PRIMARY KEY (business_id, day)
);
CREATE TABLE IF NOT EXISTS special_hours (
  id BIGSERIAL PRIMARY KEY, business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date TEXT NOT NULL, is_closed INTEGER DEFAULT 0, open_time TEXT, close_time TEXT, note TEXT DEFAULT '',
  UNIQUE (business_id, date)
);
CREATE TABLE IF NOT EXISTS business_photos (
  id BIGSERIAL PRIMARY KEY, business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, image_url TEXT NOT NULL, storage_path TEXT,
  caption TEXT DEFAULT '', status TEXT DEFAULT 'VISIBLE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS demand_insights (
  id BIGSERIAL PRIMARY KEY, item TEXT NOT NULL, increase TEXT NOT NULL, searches INTEGER NOT NULL,
  action TEXT NOT NULL, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ
);

ALTER TABLE business_photos ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_resets (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS password_resets_expiry_idx ON password_resets(expires_at);

-- Change default status for businesses to PENDING approval
ALTER TABLE businesses ALTER COLUMN verification_status SET DEFAULT 'PENDING';
ALTER TABLE businesses ALTER COLUMN verified SET DEFAULT 0;

-- Change default status for uploaded photos to PENDING approval
ALTER TABLE business_photos ALTER COLUMN status SET DEFAULT 'PENDING';

UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE email_verified = FALSE;