const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 5000);
const TZ = 'Asia/Kolkata';

const IS_PROD = process.env.NODE_ENV === 'production';
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true, credentials: true }));

const PHOTO_ROUTE = /^\/api\/businesses\/\d+\/photos$/;
app.use((req, res, next) => express.json({ limit: PHOTO_ROUTE.test(req.path) ? '8mb' : '100kb' })(req, res, next));

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set to your Supabase Postgres connection string.');

const caCertPath = path.join(__dirname, 'supabase-prod-ca.crt');
let sslConfig = { rejectUnauthorized: false };
if (fs.existsSync(caCertPath)) {
  try {
    sslConfig = { rejectUnauthorized: true, ca: fs.readFileSync(caCertPath, 'utf8') };
  } catch (err) {
    console.warn('Could not read supabase-prod-ca.crt, falling back to default SSL:', err.message);
  }
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : sslConfig,
  max: Number(process.env.PG_POOL_MAX || 15),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'business-photos';

async function storageRequest(endpoint, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  const response = await fetch(`${SUPABASE_URL}/storage/v1${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.body && !(options.body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase Storage error (${response.status}): ${body.slice(0, 300)}`);
  try { return body ? JSON.parse(body) : {}; } catch { return {}; }
}

async function ensurePhotoBucket() {
  try {
    await storageRequest('/bucket', {
      method: 'POST',
      body: JSON.stringify({
        id: SUPABASE_STORAGE_BUCKET,
        name: SUPABASE_STORAGE_BUCKET,
        public: true,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
      })
    });
  } catch (e) {
    if (!/already exists|duplicate|409/i.test(e.message)) throw e;
  }
}

function pgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`).replace(/ORDER BY rowid/g, 'ORDER BY day');
}

async function run(sql, params = []) {
  const ignore = /INSERT OR IGNORE INTO/i.test(sql);
  let q = sql.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
  if (ignore && !/ON CONFLICT/i.test(q)) q += ' ON CONFLICT DO NOTHING';
  const table = (q.match(/^\s*INSERT\s+INTO\s+([a-z_]+)/i) || [])[1]?.toLowerCase();
  const idTables = new Set(['users', 'businesses', 'items', 'special_hours', 'business_photos', 'demand_insights']);
  if (table && idTables.has(table) && !/RETURNING\s/i.test(q)) q += ' RETURNING id';
  const result = await db.query(pgSql(q), params);
  return { lastID: result.rows?.[0]?.id, changes: result.rowCount || 0, rows: result.rows };
}

async function get(sql, params = []) { const r = await db.query(pgSql(sql), params); return r.rows[0]; }
async function all(sql, params = []) { const r = await db.query(pgSql(sql), params); return r.rows; }
const now = () => new Date().toISOString();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function token() { return crypto.randomBytes(32).toString('hex'); }
function dayName(date = new Date()) { return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(date); }
function timeInIndia(date = new Date()) { return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date); }
function mins(hhmm) { const [h, m] = String(hhmm || '00:00').split(':').map(Number); return h * 60 + m; }
function formatTime(hhmm) { if (!hhmm) return ''; const [h, m] = hhmm.split(':').map(Number); const d = new Date(2000, 0, 1, h, m); return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
function distanceRank(d) { return Number(d || 999); }
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = n => n * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SMTP_HOST = String(process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '');
const EMAIL_FROM = String(process.env.EMAIL_FROM || SMTP_USER).trim();
const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

function mailConfigured() { return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && EMAIL_FROM); }

function mailTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email);
}

function verificationToken() { return crypto.randomBytes(32).toString('hex'); }
function tokenDigest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

async function sendVerificationEmail(email, name, rawToken) {
  const link = `${PUBLIC_APP_URL}/?verify_email=${encodeURIComponent(rawToken)}`;
  await mailTransport().sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your Jamghat email',
    text: `Hello ${name},\n\nPlease click the link below to verify your email address:\n${link}\n\nOnce verified, your shop will be sent to the Jamghat administrator for review.`,
    html: `<p>Hello <b>${escapeHtml(name)}</b>,</p><p>Please verify your email address to submit your shop for activation:</p><p><a href="${link}" style="background-color:#e65f20;color:#fff;padding:9px 16px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a></p><p>This link expires in 24 hours.</p>`
  });
}

async function sendResetPasswordEmail(email, name, rawToken) {
  const link = `${PUBLIC_APP_URL}/?reset_token=${encodeURIComponent(rawToken)}`;
  await mailTransport().sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Reset your Jamghat password',
    text: `Hello ${name},\n\nClick the link below to reset your password:\n\n${link}\n\nThis link expires in 1 hour.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Click the link below to reset your password:</p><p><a href="${link}" style="background-color:#e65f20;color:#fff;padding:9px 16px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p><p>This link expires in 1 hour.</p>`
  });
}

async function sendShopApprovedEmail(email, name, shopName) {
  await mailTransport().sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: `Your shop "${shopName}" is approved on Jamghat!`,
    text: `Hello ${name},\n\nYour shop "${shopName}" has been approved and is now live on Jamghat.\n\nSign in to manage inventory: ${PUBLIC_APP_URL}\n\nTeam Jamghat`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #e65f20;">Shop Approved! 🎉</h2><p>Hello <b>${escapeHtml(name)}</b>,</p><p>Your shop <strong>"${escapeHtml(shopName)}"</strong> is now live on Jamghat.</p><p><a href="${PUBLIC_APP_URL}" style="background-color: #e65f20; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to My Shop</a></p></div>`
  });
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

async function init() {
  const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
  }
  await ensurePhotoBucket();
  await ensureAdmin();
}

async function ensureAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || password.length < 12) return;
  const found = await get('SELECT id FROM users WHERE lower(email)=lower(?)', [email]);
  if (!found) {
    await run('INSERT INTO users(name,email,password_hash,role,location,created_at,email_verified,email_verified_at) VALUES(?,?,?,?,?,?,TRUE,?)', ['Jamghat Admin', email, hashPassword(password), 'ADMIN', '', now(), now()]);
  } else {
    await run('UPDATE users SET password_hash=?,role=?,email_verified=TRUE,email_verified_at=COALESCE(email_verified_at,?) WHERE id=?', [hashPassword(password), 'ADMIN', now(), found.id]);
  }
}

function calculateShopHours(hoursRows, specialRows, date = new Date()) {
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const special = (specialRows || []).find(s => s.date === todayKey);
  if (special?.is_closed) return { open: false, closesAt: null, nextOpen: null, label: `Closed today${special.note ? ` · ${special.note}` : ''}`, closedToday: true, specialNote: special.note || '' };

  const day = dayName(date);
  const current = mins(timeInIndia(date));
  const row = (hoursRows || []).find(h => h.day === day);

  if (row && !row.is_closed) {
    const open = mins(row.open_time), close = mins(row.close_time);
    const overnight = close < open;
    const isOpen = overnight ? (current >= open || current < close) : (current >= open && current < close);
    if (isOpen) {
      return { open: true, closesAt: formatTime(row.close_time), nextOpen: null, label: `Open now · closes at ${formatTime(row.close_time)}` };
    }
    return { open: false, closesAt: null, nextOpen: formatTime(row.open_time), label: `Closed · opens at ${formatTime(row.open_time)}` };
  }
  return { open: false, closesAt: null, nextOpen: null, label: 'Closed' };
}

function comparableItemName(value) { return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
let marketPriceCache = null, marketPriceCacheAt = 0;

async function getMarketPriceIndex() {
  if (marketPriceCache && Date.now() - marketPriceCacheAt < 60000) return marketPriceCache;
  const priced = await all(`SELECT i.name,i.price,i.price_min,i.price_max,i.type FROM items i JOIN businesses b ON b.id=i.business_id WHERE COALESCE(i.price,i.price_min,i.price_max) IS NOT NULL AND b.verification_status='VERIFIED'`);
  const market = new Map();
  for (const p of priced) {
    const nameKey = comparableItemName(p.name);
    if (!nameKey) continue;
    const key = `${String(p.type || 'PRODUCT').toUpperCase()}:${nameKey}`;
    const lo = Number(p.price_min ?? p.price);
    const hi = Number(p.price_max ?? p.price);
    if (!Number.isFinite(lo) || lo <= 0) continue;
    const entry = market.get(key) || { min: Infinity, max: -Infinity, count: 0 };
    entry.min = Math.min(entry.min, lo);
    entry.max = Math.max(entry.max, Number.isFinite(hi) && hi > 0 ? hi : lo);
    entry.count++;
    market.set(key, entry);
  }
  marketPriceCache = market;
  marketPriceCacheAt = Date.now();
  return market;
}

const PUBLIC_FILTER = `verification_status = 'VERIFIED'`;

function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const k = req.ip, t = Date.now();
    const arr = (hits.get(k) || []).filter(x => t - x < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    arr.push(t);
    hits.set(k, arr);
    next();
  };
}

async function auth(req, res, next) {
  try {
    const cookieToken = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('jg_session='))?.slice('jg_session='.length);
    const raw = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || decodeURIComponent(cookieToken || '');
    if (!raw) return res.status(401).json({ error: 'Authentication required' });
    const s = await get(`SELECT s.*,u.id user_id,u.name,u.email,u.role,u.location,u.avatar FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?`, [raw, now()]);
    if (!s) return res.status(401).json({ error: 'Session expired' });
    req.user = { id: s.user_id, name: s.name, email: s.email, role: s.role, location: s.location, avatar: s.avatar, token: raw };
    next();
  } catch (e) { res.status(500).json({ error: e.message }); }
}

function requireRole(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Not authorized' }); }

async function ownerFor(req, businessId) {
  const owner = await get(`SELECT * FROM business_owners WHERE business_id=? AND user_id=?`, [businessId, req.user.id]);
  return !!owner;
}

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Jamghat' }));

app.get('/api/businesses', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const userLat = Number(req.query.lat), userLng = Number(req.query.lng);
    const hasUserLocation = req.query.lat !== '' && req.query.lng !== '' && Number.isFinite(userLat) && Number.isFinite(userLng);

    const [bizRows, itemRows, hoursRows, specialRows, market] = await Promise.all([
      all(`SELECT * FROM businesses WHERE ${PUBLIC_FILTER} ORDER BY distance ASC`),
      all(`SELECT i.* FROM items i JOIN businesses b ON b.id=i.business_id WHERE b.${PUBLIC_FILTER} ORDER BY i.id`),
      all(`SELECT h.* FROM business_hours h JOIN businesses b ON b.id=h.business_id WHERE b.${PUBLIC_FILTER}`),
      all(`SELECT s.* FROM special_hours s JOIN businesses b ON b.id=s.business_id WHERE b.${PUBLIC_FILTER}`),
      getMarketPriceIndex()
    ]);

    const itemsByBiz = new Map();
    for (const item of itemRows) {
      if (!itemsByBiz.has(item.business_id)) itemsByBiz.set(item.business_id, []);
      const m = market.get(`${String(item.type || 'PRODUCT').toUpperCase()}:${comparableItemName(item.name)}`);
      itemsByBiz.get(item.business_id).push({
        ...item,
        market_price_min: m?.count >= 2 ? m.min : null,
        market_price_max: m?.count >= 2 ? m.max : null,
        market_price_count: m?.count || 0,
        status: item.quantity <= 0 ? 'OUT_OF_STOCK' : item.quantity < 5 ? 'LOW_STOCK' : item.status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : item.quantity < 10 ? 'MEDIUM_STOCK' : 'IN_STOCK',
        availability_verified: Date.now() - new Date(item.updated_at).getTime() < 3 * 864e5
      });
    }

    const hoursByBiz = new Map(), specialsByBiz = new Map();
    hoursRows.forEach(h => {
      if (!hoursByBiz.has(h.business_id)) hoursByBiz.set(h.business_id, []);
      hoursByBiz.get(h.business_id).push(h);
    });
    specialRows.forEach(s => {
      if (!specialsByBiz.has(s.business_id)) specialsByBiz.set(s.business_id, []);
      specialsByBiz.get(s.business_id).push(s);
    });

    let rows = bizRows.map(b => {
      const hCalc = calculateShopHours(hoursByBiz.get(b.id), specialsByBiz.get(b.id));
      const dist = hasUserLocation && b.latitude != null && b.longitude != null
        ? Number(haversineKm(userLat, userLng, b.latitude, b.longitude).toFixed(1))
        : Number(b.distance || 999);
      return {
        ...b,
        distance: dist,
        is_open: hCalc.open ? 1 : 0,
        closes_at: hCalc.closesAt || '',
        status_label: hCalc.label,
        next_open: hCalc.nextOpen,
        items: itemsByBiz.get(b.id) || []
      };
    });

    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      rows = rows.filter(b => {
        const hay = `${b.name} ${b.category} ${b.description} ${b.address} ${b.items.map(i => i.name + ' ' + (i.description || '')).join(' ')}`.toLowerCase();
        return words.every(w => hay.includes(w)) || hay.includes(q);
      });
    }
    if (category) rows = rows.filter(b => b.category === category);
    rows.sort((a, b) => Number(b.is_open) - Number(a.is_open) || distanceRank(a.distance) - distanceRank(b.distance));
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/businesses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [b, items, hours, photos, special, market] = await Promise.all([
      get(`SELECT * FROM businesses WHERE id=?`, [id]),
      all(`SELECT * FROM items WHERE business_id=? ORDER BY id`, [id]),
      all(`SELECT * FROM business_hours WHERE business_id=? ORDER BY CASE day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END`, [id]),
      all(`SELECT id,business_id,image_url,caption,created_at FROM business_photos WHERE business_id=? AND status='VISIBLE' ORDER BY created_at DESC`, [id]),
      all(`SELECT * FROM special_hours WHERE business_id=?`, [id]),
      getMarketPriceIndex()
    ]);

    if (!b || b.verification_status !== 'VERIFIED') return res.status(404).json({ error: 'Business not found' });
    const hCalc = calculateShopHours(hours, special);

    res.json({
      ...b,
      is_open: hCalc.open ? 1 : 0,
      closes_at: hCalc.closesAt || '',
      status_label: hCalc.label,
      next_open: hCalc.nextOpen,
      photos,
      hours,
      items: items.map(i => {
        const m = market.get(`${String(i.type || 'PRODUCT').toUpperCase()}:${comparableItemName(i.name)}`);
        return {
          ...i,
          market_price_min: m?.count >= 2 ? m.min : null,
          market_price_max: m?.count >= 2 ? m.max : null,
          market_price_count: m?.count || 0,
          status: i.quantity <= 0 ? 'OUT_OF_STOCK' : i.quantity < 5 ? 'LOW_STOCK' : i.status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : i.quantity < 10 ? 'MEDIUM_STOCK' : 'IN_STOCK',
          availability_verified: Date.now() - new Date(i.updated_at).getTime() < 3 * 864e5
        };
      })
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const loginLimit = rateLimit(30, 10 * 60 * 1000), registerLimit = rateLimit(15, 60 * 60 * 1000);

app.post('/api/auth/login', loginLimit, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const u = await get(`SELECT * FROM users WHERE lower(email)=lower(?)`, [cleanEmail]);
    if (!u || !verifyPassword(String(password || ''), u.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });

    if (u.role !== 'ADMIN' && !u.email_verified) {
      return res.status(403).json({ error: 'Please click the link in your email to verify your address first.', code: 'EMAIL_NOT_VERIFIED' });
    }

    const t = token();
    await run(`INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)`, [t, u.id, new Date(Date.now() + 7 * 864e5).toISOString()]);
    res.cookie('jg_session', t, { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 7 * 864e5 });
    res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/logout', auth, async (req, res) => {
  await run(`DELETE FROM sessions WHERE token=?`, [req.user.token]);
  res.clearCookie('jg_session', { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

app.patch('/api/auth/me', auth, async (req, res) => {
  try {
    const { name, email, current_password, new_password } = req.body || {};
    const u = await get('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!u) return res.status(404).json({ error: 'User not found' });

    let updatedPasswordHash = u.password_hash;
    if (new_password) {
      if (!current_password || !verifyPassword(current_password, u.password_hash)) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
      if (String(new_password).length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
      }
      updatedPasswordHash = hashPassword(new_password);
    }

    const nextName = String(name || u.name).trim().slice(0, 80);
    const nextEmail = String(email || u.email).trim().toLowerCase();

    if (nextEmail !== u.email) {
      if (!isValidEmail(nextEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
      const existing = await get('SELECT id FROM users WHERE lower(email)=? AND id!=?', [nextEmail, u.id]);
      if (existing) return res.status(400).json({ error: 'This email is already in use.' });
    }

    await run('UPDATE users SET name=?, email=?, password_hash=? WHERE id=?', [nextName, nextEmail, updatedPasswordHash, u.id]);
    res.json({ ok: true, user: { id: u.id, name: nextName, email: nextEmail, role: u.role } });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Could not update profile' });
  }
});

app.post('/api/auth/forgot-password', rateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Enter your registered email address.' });
    const u = await get('SELECT id, name, email FROM users WHERE lower(email)=?', [email]);
    if (u && mailConfigured()) {
      const raw = verificationToken();
      await run('DELETE FROM password_resets WHERE user_id=?', [u.id]);
      await run('INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES(?,?,?)', [
        u.id,
        tokenDigest(raw),
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
      ]);
      sendResetPasswordEmail(u.email, u.name, raw).catch(err => console.error('SMTP Error (forgot-pwd):', err.message));
    }
    res.json({ ok: true, message: 'If an account matches that email, a password reset link has been sent.' });
  } catch (e) {
    res.status(500).json({ error: 'Could not send reset password email.' });
  }
});

app.post('/api/auth/reset-password', rateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const { token: raw, password } = req.body || {};
    if (!raw || !password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    const row = await get('SELECT user_id, expires_at FROM password_resets WHERE token_hash=?', [tokenDigest(raw)]);
    if (!row) return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await run('DELETE FROM password_resets WHERE token_hash=?', [tokenDigest(raw)]);
      return res.status(400).json({ error: 'This reset link has expired.' });
    }
    await run('UPDATE users SET password_hash=? WHERE id=?', [hashPassword(password), row.user_id]);
    await run('DELETE FROM password_resets WHERE user_id=?', [row.user_id]);
    await run('DELETE FROM sessions WHERE user_id=?', [row.user_id]);
    res.json({ ok: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (e) {
    res.status(500).json({ error: 'Could not reset password.' });
  }
});

app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const raw = String(req.query.token || '');
    if (!/^[a-f0-9]{64}$/i.test(raw)) return res.status(400).json({ error: 'This verification link is invalid.' });
    const row = await get('SELECT user_id,expires_at FROM email_verifications WHERE token_hash=?', [tokenDigest(raw)]);
    if (!row) return res.status(400).json({ error: 'Invalid or already used verification link.' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await run('DELETE FROM email_verifications WHERE token_hash=?', [tokenDigest(raw)]);
      return res.status(400).json({ error: 'Verification link expired.' });
    }

    // Step 1: Mark user as verified
    await run('UPDATE users SET email_verified=TRUE,email_verified_at=? WHERE id=?', [now(), row.user_id]);
    await run('DELETE FROM email_verifications WHERE user_id=?', [row.user_id]);

    // Step 2: Transition shop status from EMAIL_UNVERIFIED to PENDING so it appears in Admin review
    const ownerBiz = await get('SELECT business_id FROM business_owners WHERE user_id=?', [row.user_id]);
    if (ownerBiz) {
      await run("UPDATE businesses SET verification_status='PENDING' WHERE id=? AND verification_status='EMAIL_UNVERIFIED'", [ownerBiz.business_id]);
    }

    res.json({ ok: true, message: 'Email verified! Your shop details have been sent to the administrator for review.' });
  } catch (e) { res.status(500).json({ error: 'Could not verify email.' }); }
});

app.post('/api/auth/resend-verification', rateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const u = await get('SELECT id,name,email,role,email_verified FROM users WHERE lower(email)=?', [email]);
    if (!u || u.role === 'ADMIN' || u.email_verified) return res.json({ ok: true, message: 'Verification email sent if eligible.' });
    if (!mailConfigured()) {
      await run('UPDATE users SET email_verified=TRUE,email_verified_at=? WHERE id=?', [now(), u.id]);
      const ownerBiz = await get('SELECT business_id FROM business_owners WHERE user_id=?', [u.id]);
      if (ownerBiz) await run("UPDATE businesses SET verification_status='PENDING' WHERE id=? AND verification_status='EMAIL_UNVERIFIED'", [ownerBiz.business_id]);
      return res.json({ ok: true, message: 'Account automatically verified! You can now log in.' });
    }
    const raw = verificationToken();
    await run('DELETE FROM email_verifications WHERE user_id=?', [u.id]);
    await run('INSERT INTO email_verifications(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?)', [u.id, tokenDigest(raw), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now()]);
    sendVerificationEmail(u.email, u.name, raw).catch(err => console.error('SMTP resend error:', err.message));
    res.json({ ok: true, message: 'A new verification email has been sent.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/business/register', registerLimit, async (req, res) => {
  let client;
  try {
    const b = req.body || {};
    const clean = (v, n) => String(v ?? '').trim().slice(0, n);
    const ownerName = clean(b.owner_name, 80);
    const email = clean(b.email, 120).toLowerCase();
    const password = String(b.password || '');
    const name = clean(b.business_name, 120);
    const category = clean(b.category, 60);
    const phone = clean(b.phone, 30);
    const address = clean(b.address, 200);
    const description = clean(b.description, 400);

    if (!ownerName || !name || !category || !phone || !address) {
      return res.status(400).json({ error: 'Name, shop name, category, phone, and address are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await get('SELECT id FROM users WHERE lower(email)=?', [email]);
    if (existing) return res.status(400).json({ error: 'This email is already registered.' });

    const lat = Number(b.latitude), lng = Number(b.longitude);
    const hasCoords = b.latitude !== '' && b.longitude !== '' && b.latitude != null && b.longitude != null && Number.isFinite(lat) && Number.isFinite(lng);
    const homeVisit = category === 'Services & Repairs' ? 1 : 0;
    const canSendMail = mailConfigured();

    client = await db.connect();
    let userId, businessId, rawToken;

    await client.query('BEGIN');
    const userResult = await client.query(
      'INSERT INTO users(name,email,password_hash,role,location,created_at,email_verified,email_verified_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [ownerName, email, hashPassword(password), 'BUSINESS_OWNER', address, now(), !canSendMail, !canSendMail ? now() : null]
    );
    userId = userResult.rows[0].id;

    // Shop begins as EMAIL_UNVERIFIED until email is verified, or PENDING if mail is unconfigured
    const initialShopStatus = canSendMail ? 'EMAIL_UNVERIFIED' : 'PENDING';
    const bizResult = await client.query(
      'INSERT INTO businesses(name,category,phone,address,distance,description,verified,verification_status,profile_completeness,profile_updated_at,created_at,home_visit,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id',
      [name, category, phone, address, 999, description, 0, initialShopStatus, 60, now(), now(), homeVisit, hasCoords ? lat : null, hasCoords ? lng : null]
    );
    businessId = bizResult.rows[0].id;

    await client.query("INSERT INTO business_owners(business_id,user_id,claim_status) VALUES($1,$2,'VERIFIED')", [businessId, userId]);
    for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      await client.query(
        'INSERT INTO business_hours(business_id,day,is_closed,open_time,close_time,periods_json) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(business_id,day) DO NOTHING',
        [businessId, d, d === 'Sunday' ? 1 : 0, d === 'Sunday' ? null : '09:00', d === 'Sunday' ? null : '20:00', JSON.stringify(d === 'Sunday' ? [] : [{ open: '09:00', close: '20:00' }])]
      );
    }

    if (canSendMail) {
      rawToken = verificationToken();
      await client.query(
        'INSERT INTO email_verifications(user_id,token_hash,expires_at,created_at) VALUES($1,$2,$3,$4)',
        [userId, tokenDigest(rawToken), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now()]
      );
    }

    await client.query('COMMIT');
    client.release();
    client = null;

    if (canSendMail) {
      sendVerificationEmail(email, ownerName, rawToken).catch(mailErr => {
        console.error('SMTP Delivery error on registration:', mailErr.message);
      });
    }

    res.status(201).json({
      ok: true,
      business_id: businessId,
      message: canSendMail
        ? 'Please check your email and verify your address. Once verified, your shop will be submitted for approval.'
        : 'Registration successful! Your shop is pending approval.'
    });
  } catch (e) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
    res.status(500).json({ error: e.message || 'Registration failed.' });
  }
});

app.get('/api/business/me', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    const own = await get(`SELECT business_id FROM business_owners WHERE user_id=?`, [req.user.id]);
    if (!own) return res.status(404).json({ error: 'No business found' });
    const b = await get(`SELECT * FROM businesses WHERE id=?`, [own.business_id]);
    const hours = await all(`SELECT * FROM business_hours WHERE business_id=? ORDER BY day`, [b.id]);
    const photos = await all(`SELECT id, business_id, image_url, caption, status, created_at FROM business_photos WHERE business_id=? ORDER BY created_at DESC`, [b.id]);
    const items = await all(`SELECT * FROM items WHERE business_id=? ORDER BY id`, [b.id]);
    res.json({ ...b, items, photos, hours });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/business/:id', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    if (!await ownerFor(req, req.params.id)) return res.status(403).json({ error: 'You do not own this business' });
    const b = await get(`SELECT * FROM businesses WHERE id=?`, [req.params.id]);
    if (!b) return res.status(404).json({ error: 'Business not found' });
    const fields = ['name', 'category', 'phone', 'address', 'description', 'service_area', 'max_service_radius', 'home_visit', 'visit_charge', 'emergency_service', 'appointment_required', 'latitude', 'longitude'];
    const vals = fields.map(k => req.body[k] !== undefined ? req.body[k] : b[k]);
    const completeness = Math.round(fields.filter((k, i) => String(vals[i] ?? '').trim() !== '').length / fields.length * 100);
    await run(`UPDATE businesses SET name=?,category=?,phone=?,address=?,description=?,service_area=?,max_service_radius=?,home_visit=?,visit_charge=?,emergency_service=?,appointment_required=?,latitude=?,longitude=?,profile_completeness=?,profile_updated_at=? WHERE id=?`, [...vals, completeness, now(), b.id]);
    res.json(await get(`SELECT * FROM businesses WHERE id=?`, [b.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/business/:id/hours', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    if (!await ownerFor(req, req.params.id)) return res.status(403).json({ error: 'Unauthorized' });
    for (const h of req.body.hours || []) {
      await run(`INSERT INTO business_hours(business_id,day,is_closed,open_time,close_time,periods_json) VALUES(?,?,?,?,?,?) ON CONFLICT(business_id,day) DO UPDATE SET is_closed=excluded.is_closed,open_time=excluded.open_time,close_time=excluded.close_time,periods_json=excluded.periods_json`, [req.params.id, h.day, h.is_closed ? 1 : 0, h.open_time || null, h.close_time || null, JSON.stringify(h.periods || [])]);
    }
    await run(`UPDATE businesses SET profile_updated_at=? WHERE id=?`, [now(), req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/business/:id/special-hours/today', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    if (!await ownerFor(req, req.params.id)) return res.status(403).json({ error: 'Unauthorized' });
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    res.json(await get(`SELECT date,is_closed,note FROM special_hours WHERE business_id=? AND date=?`, [req.params.id, date]) || { date, is_closed: 0, note: '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/business/:id/special-hours/today', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    if (!await ownerFor(req, req.params.id)) return res.status(403).json({ error: 'Unauthorized' });
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const closed = req.body.is_closed ? 1 : 0;
    const note = String(req.body.note || '').trim().slice(0, 160);
    if (closed) await run(`INSERT INTO special_hours(business_id,date,is_closed,note) VALUES(?,?,1,?) ON CONFLICT(business_id,date) DO UPDATE SET is_closed=1,note=excluded.note`, [req.params.id, date, note]);
    else await run(`DELETE FROM special_hours WHERE business_id=? AND date=?`, [req.params.id, date]);
    res.json({ date, is_closed: closed, note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const stockFromQty = q => q < 1 ? 'OUT_OF_STOCK' : q < 5 ? 'LOW_STOCK' : q < 10 ? 'MEDIUM_STOCK' : 'IN_STOCK';

app.post('/api/items', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    const { business_id, name, price, type = 'PRODUCT', quantity = 0, description = '', price_type = 'FIXED', price_min, price_max, category_attributes = {} } = req.body;
    if (!business_id || !String(name || '').trim()) return res.status(400).json({ error: 'Name is required' });
    if (!await ownerFor(req, business_id)) return res.status(403).json({ error: 'Unauthorized' });
    const qty = Math.max(0, Number(quantity) || 0);
    const r = await run(`INSERT INTO items(business_id,name,price,type,status,quantity,description,price_type,price_min,price_max,category_attributes,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [business_id, String(name).trim().slice(0, 160), price || null, type === 'SERVICE' ? 'SERVICE' : 'PRODUCT', stockFromQty(qty), qty, description, price_type, price_min || null, price_max || null, JSON.stringify(category_attributes), now()]);
    marketPriceCache = null;
    res.json({ id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/items/:id', auth, requireRole('BUSINESS_OWNER'), async (req, res) => {
  try {
    const item = await get(`SELECT * FROM items WHERE id=?`, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!await ownerFor(req, item.business_id)) return res.status(403).json({ error: 'Unauthorized' });
    const allowed = ['name', 'price', 'type', 'status', 'quantity', 'description', 'price_type', 'price_min', 'price_max', 'category_attributes'];
    const data = { ...item, ...Object.fromEntries(allowed.filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]])) };
    await run(`UPDATE items SET name=?,price=?,type=?,status=?,quantity=?,description=?,price_type=?,price_min=?,price_max=?,category_attributes=?,updated_at=? WHERE id=?`, [data.name, data.price, data.type, data.status, Math.max(0, Number(data.quantity) || 0), data.description, data.price_type, data.price_min, data.price_max, typeof data.category_attributes === 'string' ? data.category_attributes : JSON.stringify(data.category_attributes), now(), item.id]);
    marketPriceCache = null;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/demand', auth, requireRole('BUSINESS_OWNER', 'ADMIN'), async (req, res) => {
  try { res.json(await all(`SELECT * FROM demand_insights ORDER BY searches DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/overview', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [total, pending, photos] = await Promise.all([
      get(`SELECT COUNT(*) c FROM businesses WHERE verification_status='VERIFIED'`),
      get(`SELECT COUNT(*) c FROM businesses WHERE verification_status='PENDING'`),
      get(`SELECT COUNT(*) c FROM business_photos WHERE status='PENDING'`)
    ]);
    res.json({ liveBusinesses: total.c, pendingRegistrations: pending.c, pendingPhotos: photos.c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin ONLY sees verified emails that are awaiting approval or already reviewed
app.get('/api/admin/businesses', auth, requireRole('ADMIN'), async (req, res) => {
  res.json(await all(`
    SELECT b.id, b.name, b.category, b.phone, b.address, b.verification_status, b.created_at, u.name owner_name, u.email owner_email 
    FROM businesses b 
    JOIN business_owners o ON o.business_id = b.id 
    JOIN users u ON u.id = o.user_id 
    WHERE b.verification_status != 'EMAIL_UNVERIFIED'
    ORDER BY CASE b.verification_status WHEN 'PENDING' THEN 0 ELSE 1 END, b.id DESC
  `));
});

// Admin status approvals run immediately; emails dispatch in background
app.patch('/api/admin/businesses/:id/status', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const status = req.body.status;
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const r = await run(`UPDATE businesses SET verification_status=?, verified=? WHERE id=?`, [status, status === 'VERIFIED' ? 1 : 0, req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Business not found' });
    marketPriceCache = null;

    // Fast-path immediate response to Admin
    res.json({ ok: true, message: `Status updated to ${status}.` });

    // Background delivery without blocking client response
    if (status === 'VERIFIED' && mailConfigured()) {
      get(`SELECT u.name, u.email, b.name as business_name FROM businesses b JOIN business_owners o ON o.business_id = b.id JOIN users u ON u.id = o.user_id WHERE b.id = ?`, [req.params.id])
        .then(owner => {
          if (owner?.email) sendShopApprovedEmail(owner.email, owner.name, owner.business_name).catch(() => {});
        })
        .catch(() => {});
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/businesses/:id', auth, requireRole('ADMIN'), async (req, res) => {
  const client = await db.connect();
  try {
    const bizId = req.params.id;
    await client.query('BEGIN');
    await client.query('DELETE FROM businesses WHERE id = $1', [bizId]);
    await client.query('COMMIT');
    marketPriceCache = null;
    res.json({ ok: true, message: 'Business listing permanently deleted.' });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: e.message || 'Could not delete business' });
  } finally {
    client.release();
  }
});

app.post('/api/businesses/:id/photos', auth, async (req, res) => {
  try {
    const isOwner = await ownerFor(req, req.params.id);
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    const business = await get(`SELECT id FROM businesses WHERE id=?`, [req.params.id]);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    const raw = String(req.body.image_data || '');
    const match = raw.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) return res.status(400).json({ error: 'Please choose a JPG, PNG, or WebP image.' });
    const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image is too large.' });
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `business-${business.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    await storageRequest(`/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: { 'Content-Type': mime, 'x-upsert': 'false', 'cache-control': '31536000' }, body: buffer });
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;

    const photoStatus = isAdmin ? 'VISIBLE' : 'PENDING';
    const r = await run(`INSERT INTO business_photos(business_id,user_id,image_url,storage_path,caption,status,created_at) VALUES(?,?,?,?,?,?,?)`, [business.id, req.user.id, imageUrl, objectPath, String(req.body.caption || '').trim().slice(0, 180), photoStatus, now()]);
    res.json(await get(`SELECT id,business_id,image_url,caption,status,created_at FROM business_photos WHERE id=?`, [r.lastID]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/pending-photos', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const photos = await all(`SELECT p.id, p.business_id, p.image_url, p.caption, p.status, p.created_at, b.name as business_name FROM business_photos p JOIN businesses b ON b.id = p.business_id WHERE p.status = 'PENDING' ORDER BY p.created_at DESC`);
    res.json(photos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/photos/:id/status', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['VISIBLE', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await run('UPDATE business_photos SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.status === 413 ? 'Request too large' : 'Unexpected server error' });
});

init().then(() => app.listen(PORT, () => console.log(`Jamghat backend running on port ${PORT}`))).catch(e => {
  console.error('Startup failed', e);
  process.exit(1);
});

process.on('SIGTERM', async () => { await db.end(); process.exit(0); });
process.on('SIGINT', async () => { await db.end(); process.exit(0); });