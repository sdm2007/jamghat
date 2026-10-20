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
// Small JSON limit everywhere; only the admin photo upload route may send a large body.
const PHOTO_ROUTE = /^\/api\/businesses\/\d+\/photos$/;
app.use((req, res, next) => express.json({ limit: PHOTO_ROUTE.test(req.path) ? '8mb' : '100kb' })(req, res, next));

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set to your Supabase Postgres connection string.');
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(
      path.join(__dirname, 'supabase-prod-ca.crt'),
      'utf8'
    ),
  },
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// All uploaded business photos live in Supabase Storage, never on the web server's temporary disk.
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'business-photos';
async function storageRequest(endpoint, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable Supabase photo storage.');
  const response = await fetch(`${SUPABASE_URL}/storage/v1${endpoint}`, { ...options, headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, ...(options.body && !(options.body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase Storage error (${response.status}): ${body.slice(0, 300)}`);
  try { return body ? JSON.parse(body) : {}; } catch { return {}; }
}
async function ensurePhotoBucket() {
  try { await storageRequest('/bucket', { method: 'POST', body: JSON.stringify({ id: SUPABASE_STORAGE_BUCKET, name: SUPABASE_STORAGE_BUCKET, public: true, file_size_limit: 5242880, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'] }) }); }
  catch (e) { if (!/already exists|duplicate|409/i.test(e.message)) throw e; }
}
function storageObjectPath(imageUrl) {
  try { const u = new URL(imageUrl); const marker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`; const i = u.pathname.indexOf(marker); return i >= 0 ? decodeURIComponent(u.pathname.slice(i + marker.length)) : null; } catch { return null; }
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
  const idTables = new Set(['users','businesses','items','special_hours','business_photos','demand_insights']);
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
function formatTime(hhmm) { if (!hhmm) return ''; const [h, m] = hhmm.split(':').map(Number); const d = new Date(2000,0,1,h,m); return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
function distanceRank(d) { return Number(d || 999); }
function haversineKm(lat1, lon1, lat2, lon2) { const toRad = n => n * Math.PI / 180; const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1); const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2; return 6371 * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }

const SMTP_HOST = String(process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '');
const EMAIL_FROM = String(process.env.EMAIL_FROM || SMTP_USER).trim();
const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
function mailConfigured() { return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && EMAIL_FROM); }
function mailTransport() {
  if (!mailConfigured()) throw new Error('Email verification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM in backend/.env.');
  return nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}
function verificationToken() { return crypto.randomBytes(32).toString('hex'); }
function tokenDigest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
async function sendVerificationEmail(email, name, rawToken) {
  const link = `${PUBLIC_APP_URL}/?verify_email=${encodeURIComponent(rawToken)}`;
  await mailTransport().sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your Market Hub email',
    text: `Hello ${name},\n\nVerify your email address to sign in to Market Hub: ${link}\n\nThis link expires in 24 hours. If you did not register, you can ignore this email.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Verify your email address to sign in to Market Hub.</p><p><a href="${link}">Verify my email address</a></p><p>This link expires in 24 hours. If you did not register, you can ignore this email.</p>`
  });
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function init() {
  const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schema);
  await ensurePhotoBucket();
  await ensureAdmin();
}
async function ensureAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || password.length < 12) {
    if (IS_PROD) throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before deploying.');
    console.warn('Admin account not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env to enable admin access.');
    return;
  }
  const found = await get('SELECT id FROM users WHERE lower(email)=lower(?)', [email]);
  if (!found) await run('INSERT INTO users(name,email,password_hash,role,location,created_at,email_verified,email_verified_at) VALUES(?,?,?,?,?,?,TRUE,?)', ['Market Hub Admin', email, hashPassword(password), 'ADMIN', '', now(), now()]);
  else await run('UPDATE users SET password_hash=?,role=?,email_verified=TRUE,email_verified_at=COALESCE(email_verified_at,?) WHERE id=?', [hashPassword(password), 'ADMIN', now(), found.id]);
}

async function currentHours(businessId, date = new Date()) {
  const todayKey = new Intl.DateTimeFormat('en-CA', {timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const special = await get(`SELECT * FROM special_hours WHERE business_id=? AND date=?`,[businessId,todayKey]);
  if (special?.is_closed) return {open:false,closesAt:null,nextOpen:null,label:`Closed today${special.note?` · ${special.note}`:''}`,closedToday:true,specialNote:special.note||''};
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const day=dayName(date); const idx=days.indexOf(day); const current=mins(timeInIndia(date));
  const row=await get(`SELECT * FROM business_hours WHERE business_id=? AND day=?`,[businessId,day]);
  if(row && !row.is_closed){
    const open=mins(row.open_time),close=mins(row.close_time); const overnight=close<open;
    const isOpen=overnight ? (current>=open || current<close) : (current>=open && current<close);
    if(isOpen){ const closeMinutes=overnight&&current>=open ? close+1440 : close; const nowMinutes=overnight&&current<close ? current+1440 : current; const soon=closeMinutes-nowMinutes<=60; return {open:true,closesAt:formatTime(row.close_time),nextOpen:null,label:soon?`Open now · closes soon at ${formatTime(row.close_time)}`:`Open now · closes at ${formatTime(row.close_time)}`}; }
    return {open:false,closesAt:null,nextOpen:formatTime(row.open_time),label:`Closed · opens at ${formatTime(row.open_time)}`};
  }
  // If today's schedule is closed, or if a previous-day schedule runs past midnight, inspect it.
  const prev=days[(idx+6)%7]; const prevRow=await get(`SELECT * FROM business_hours WHERE business_id=? AND day=?`,[businessId,prev]);
  if(prevRow && !prevRow.is_closed && mins(prevRow.close_time)<mins(prevRow.open_time) && current<mins(prevRow.close_time)){ const soon=mins(prevRow.close_time)-current<=60; return {open:true,closesAt:formatTime(prevRow.close_time),nextOpen:null,label:soon?`Open now · closes soon at ${formatTime(prevRow.close_time)}`:`Open now · closes at ${formatTime(prevRow.close_time)}`}; }
  for(let offset=1;offset<=7;offset++){const next=days[(idx+offset)%7];const n=await get(`SELECT * FROM business_hours WHERE business_id=? AND day=?`,[businessId,next]);if(n&&!n.is_closed)return {open:false,closesAt:null,nextOpen:`${offset===1?'tomorrow':next} at ${formatTime(n.open_time)}`,label:`Closed today · opens ${offset===1?'tomorrow':next} at ${formatTime(n.open_time)}`};}
  return {open:false,closesAt:null,nextOpen:null,label:'Closed'};
}
function comparableItemName(value) { return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
let marketPriceCache = null, marketPriceCacheAt = 0;
async function getMarketPriceIndex() {
  if (marketPriceCache && Date.now() - marketPriceCacheAt < 20000) return marketPriceCache;
  const priced = await all(`SELECT i.name,i.price,i.price_min,i.price_max,i.type FROM items i JOIN businesses b ON b.id=i.business_id WHERE COALESCE(i.price,i.price_min,i.price_max) IS NOT NULL AND COALESCE(b.verification_status,'UNCLAIMED') NOT IN ('PENDING','REJECTED')`);
  const market = new Map();
  for (const p of priced) { const nameKey = comparableItemName(p.name); if (!nameKey) continue; const key = `${String(p.type || 'PRODUCT').toUpperCase()}:${nameKey}`; const lo = Number(p.price_min ?? p.price); const hi = Number(p.price_max ?? p.price); if (!Number.isFinite(lo) || lo <= 0) continue; const entry = market.get(key) || { min: Infinity, max: -Infinity, count: 0 }; entry.min = Math.min(entry.min, lo); entry.max = Math.max(entry.max, Number.isFinite(hi) && hi > 0 ? hi : lo); entry.count++; market.set(key, entry); }
  marketPriceCache = market; marketPriceCacheAt = Date.now(); return market;
}
async function enrichBusiness(b) {
  const hours = await currentHours(b.id);
  const items = await all(`SELECT id,name,price,type,status,quantity,description,price_type,price_min,price_max,updated_at,category_attributes FROM items WHERE business_id=? ORDER BY id`, [b.id]);
  const market = await getMarketPriceIndex();
  return {...b,is_open:hours.open?1:0,closes_at:hours.closesAt||'',status_label:hours.label,next_open:hours.nextOpen,items:items.map(i=>{const m=market.get(`${String(i.type || 'PRODUCT').toUpperCase()}:${comparableItemName(i.name)}`);return {...i,market_price_min:m?.count>=2?m.min:null,market_price_max:m?.count>=2?m.max:null,market_price_count:m?.count||0,status:i.quantity<=0?'OUT_OF_STOCK':i.quantity<5?'LOW_STOCK':i.status==='OUT_OF_STOCK'?'OUT_OF_STOCK':i.quantity<10?'MEDIUM_STOCK':'IN_STOCK',availability_verified:Date.now()-new Date(i.updated_at).getTime() < 3*864e5}})};
}
async function getBusiness(id) { const b=await get(`SELECT * FROM businesses WHERE id=?`,[id]); return b?enrichBusiness(b):null; }
async function getBusinessPhotos(id) { return all(`SELECT id,business_id,image_url,caption,created_at FROM business_photos WHERE business_id=? AND status='VISIBLE' ORDER BY created_at DESC`,[id]); }
const PUBLIC_FILTER = `COALESCE(verification_status,'UNCLAIMED') <> 'REJECTED'`;

// Tiny in-memory rate limiter (per IP) so anonymous endpoints can't be hammered.
function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const k = req.ip, t = Date.now();
    const arr = (hits.get(k) || []).filter(x => t - x < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    arr.push(t); hits.set(k, arr); next();
  };
}

function widen(q,cat){const synonyms={barber:['hair','haircut','salon'],mechanic:['bike','puncture','repair'],books:['book','books','ncert'],stationery:['notebook','pen'],electrician:['electrical','electric'],tailor:['stitching','alteration']};return Object.entries(synonyms).some(([k,vals])=>q.includes(k)&&vals.some(v=>String(cat||'').toLowerCase().includes(v)));}
async function auth(req,res,next) {
  try {
    const cookieToken=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('mh_session='))?.slice('mh_session='.length);
    const raw=(req.headers.authorization||'').replace(/^Bearer\s+/i,'') || decodeURIComponent(cookieToken||'');
    if(!raw) return res.status(401).json({error:'Authentication required'});
    const s=await get(`SELECT s.*,u.id user_id,u.name,u.email,u.role,u.location,u.avatar FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?`,[raw,now()]);
    if(!s) return res.status(401).json({error:'Session expired'});
    req.user={id:s.user_id,name:s.name,email:s.email,role:s.role,location:s.location,avatar:s.avatar,token:raw}; next();
  } catch(e){res.status(500).json({error:e.message});}
}
function requireRole(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:'Not authorized'});}
async function ownerFor(req,businessId){
  const owner=await get(`SELECT * FROM business_owners WHERE business_id=? AND user_id=? AND claim_status='VERIFIED'`,[businessId,req.user.id]);
  return !!owner;
}

// ---------- public (no login, no writes) ----------
app.get('/api/health',(req,res)=>res.json({ok:true,name:'Market Hub'}));

app.get('/api/businesses',async(req,res)=>{try{
  const q=String(req.query.q||'').trim().toLowerCase();const category=String(req.query.category||'').trim();
  const userLat=Number(req.query.lat),userLng=Number(req.query.lng);
  const hasUserLocation=req.query.lat!==''&&req.query.lng!==''&&Number.isFinite(userLat)&&Number.isFinite(userLng);
  let rows=await Promise.all((await all(`SELECT * FROM businesses WHERE ${PUBLIC_FILTER} ORDER BY distance ASC`)).map(enrichBusiness));
  if(hasUserLocation){rows=rows.map(b=>({...b,distance:b.latitude!=null&&b.longitude!=null?Number(haversineKm(userLat,userLng,b.latitude,b.longitude).toFixed(1)):Number(b.distance||999)}));}
  if(q){const words=q.split(/\s+/).filter(Boolean);rows=rows.filter(b=>{const hay=`${b.name} ${b.category} ${b.description} ${b.address} ${b.items.map(i=>i.name+' '+(i.description||'')).join(' ')}`.toLowerCase();return words.every(w=>hay.includes(w))||hay.includes(q)||widen(q,b.category);});}
  if(category)rows=rows.filter(b=>b.category===category);
  rows.sort((a,b)=>Number(b.is_open)-Number(a.is_open)||distanceRank(a.distance)-distanceRank(b.distance));
  res.json(rows);
}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/businesses/:id',async(req,res)=>{try{
  const b=await getBusiness(req.params.id);
  if(!b||['PENDING','REJECTED'].includes(b.verification_status))return res.status(404).json({error:'Business not found'});
  res.json({...b,photos:await getBusinessPhotos(b.id),hours:await all(`SELECT * FROM business_hours WHERE business_id=? ORDER BY CASE day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END`,[b.id])});
}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/businesses/:id/photos',async(req,res)=>{try{
  const b=await get(`SELECT id FROM businesses WHERE id=?`,[req.params.id]);
  if(!b)return res.status(404).json({error:'Business not found'});
  res.json(await getBusinessPhotos(b.id));
}catch(e){res.status(500).json({error:e.message});}});

// ---------- login + business registration ----------
const loginLimit=rateLimit(15,10*60*1000), registerLimit=rateLimit(5,60*60*1000);

app.post('/api/auth/login',loginLimit,async(req,res)=>{try{
  const {email,password}=req.body||{};
  const u=await get(`SELECT * FROM users WHERE lower(email)=lower(?)`,[String(email||'').trim()]);
  if(!u||!verifyPassword(String(password||''),u.password_hash))return res.status(401).json({error:'Invalid email or password'});
  if(u.role!=='ADMIN' && !u.email_verified)return res.status(403).json({error:'Please verify your email before signing in. Check your inbox or resend the verification email.',code:'EMAIL_NOT_VERIFIED'});
  const t=token();
  await run(`INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)`,[t,u.id,new Date(Date.now()+7*864e5).toISOString()]);
  res.cookie('mh_session', t, { httpOnly:true, secure:IS_PROD, sameSite:'lax', path:'/', maxAge:7*864e5 });
  res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role}});
}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/auth/logout',auth,async(req,res)=>{await run(`DELETE FROM sessions WHERE token=?`,[req.user.token]);res.clearCookie('mh_session',{httpOnly:true,secure:IS_PROD,sameSite:'lax',path:'/'});res.json({ok:true});});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/auth/verify-email', async (req,res)=>{try{
  const raw=String(req.query.token||'');
  if(!/^[a-f0-9]{64}$/i.test(raw))return res.status(400).json({error:'This verification link is invalid. Request a new email.'});
  const row=await get('SELECT user_id,expires_at FROM email_verifications WHERE token_hash=?',[tokenDigest(raw)]);
  if(!row)return res.status(400).json({error:'This verification link is invalid or has already been used. Request a new email.'});
  if(new Date(row.expires_at).getTime()<Date.now()){await run('DELETE FROM email_verifications WHERE token_hash=?',[tokenDigest(raw)]);return res.status(400).json({error:'This verification link has expired. Please request a new one.'});}
  await run('UPDATE users SET email_verified=TRUE,email_verified_at=? WHERE id=?',[now(),row.user_id]);
  await run('DELETE FROM email_verifications WHERE user_id=?',[row.user_id]);
  res.json({ok:true,message:'Email verified successfully. You can now sign in to Market Hub.'});
}catch(e){console.error(e);res.status(500).json({error:'Could not verify email. Please try again.'});}});

const resendLimit=rateLimit(3,60*60*1000);
app.post('/api/auth/resend-verification',resendLimit,async(req,res)=>{try{
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const u=await get('SELECT id,name,email,role,email_verified FROM users WHERE lower(email)=?', [email]);
  if(!u || u.role==='ADMIN' || u.email_verified)return res.json({ok:true,message:'If this account needs verification, an email will be sent shortly.'});
  const raw=verificationToken();
  await run('DELETE FROM email_verifications WHERE user_id=?',[u.id]);
  await run('INSERT INTO email_verifications(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?)',[u.id,tokenDigest(raw),new Date(Date.now()+24*60*60*1000).toISOString(),now()]);
  await sendVerificationEmail(u.email,u.name,raw);
  res.json({ok:true,message:'A new verification email has been sent. Check your inbox and spam folder.'});
}catch(e){console.error(e);res.status(500).json({error:e.message.includes('Email verification is not configured')?e.message:'Could not send verification email. Check the SMTP settings and try again.'});}});

// Shopkeeper self-registration: listings go live immediately; the admin can hide spam or incorrect listings.
app.post('/api/business/register',registerLimit,async(req,res)=>{try{
  if(!mailConfigured())return res.status(503).json({error:'Email verification is not configured yet. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM to backend/.env first.'});
  if(IS_PROD && !PUBLIC_APP_URL.startsWith('https://'))return res.status(503).json({error:'Set PUBLIC_APP_URL to your public HTTPS website URL before enabling registration in production.'});
  const b=req.body||{};
  const clean=(v,n)=>String(v??'').trim().slice(0,n);
  const ownerName=clean(b.owner_name,80),email=clean(b.email,120).toLowerCase(),password=String(b.password||'');
  const name=clean(b.business_name,120),category=clean(b.category,60),phone=clean(b.phone,30),address=clean(b.address,200),description=clean(b.description,400);
  if(!ownerName||!name||!category||!phone||!address)return res.status(400).json({error:'Your name, shop name, category, phone and address are required'});
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return res.status(400).json({error:'Please enter a valid email address'});
  if(password.length<8)return res.status(400).json({error:'Password must be at least 8 characters'});
  if(await get('SELECT id FROM users WHERE lower(email)=?',[email]))return res.status(400).json({error:'This email is already registered. If you have not verified it, use the resend verification option on the login form.'});
  const lat=Number(b.latitude),lng=Number(b.longitude);const hasCoords=b.latitude!==''&&b.longitude!==''&&b.latitude!=null&&b.longitude!=null&&Number.isFinite(lat)&&Number.isFinite(lng);
  const homeVisit=category==='Home Services'?1:0;
  const client=await db.connect();
  let userId,businessId,rawToken;
  try {
    await client.query('BEGIN');
    const userResult=await client.query('INSERT INTO users(name,email,password_hash,role,location,created_at,email_verified,email_verified_at) VALUES($1,$2,$3,$4,$5,$6,FALSE,NULL) RETURNING id',[ownerName,email,hashPassword(password),'BUSINESS_OWNER',address,now()]);
    userId=userResult.rows[0].id;
    const bizResult=await client.query('INSERT INTO businesses(name,category,phone,address,distance,description,verified,verification_status,profile_completeness,profile_updated_at,created_at,home_visit,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id',[name,category,phone,address,999,description,1,'VERIFIED',60,now(),now(),homeVisit,hasCoords?lat:null,hasCoords?lng:null]);
    businessId=bizResult.rows[0].id;
    await client.query("INSERT INTO business_owners(business_id,user_id,claim_status) VALUES($1,$2,'VERIFIED')",[businessId,userId]);
    for(const d of ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']) await client.query('INSERT INTO business_hours(business_id,day,is_closed,open_time,close_time,periods_json) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(business_id,day) DO NOTHING',[businessId,d,d==='Sunday'?1:0,d==='Sunday'?null:'09:00',d==='Sunday'?null:'20:00',JSON.stringify(d==='Sunday'?[]:[{open:'09:00',close:'20:00'}])]);
    rawToken=verificationToken();
    await client.query('INSERT INTO email_verifications(user_id,token_hash,expires_at,created_at) VALUES($1,$2,$3,$4)',[userId,tokenDigest(rawToken),new Date(Date.now()+24*60*60*1000).toISOString(),now()]);
    // Send before commit so an SMTP failure can roll back the new account and listing.
    await sendVerificationEmail(email,ownerName,rawToken);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    throw err;
  } finally { client.release(); }
  res.status(201).json({ok:true,business_id:businessId,message:'Registration saved. We sent a verification link to your email. Verify your email before signing in.'});
}catch(e){console.error(e);res.status(500).json({error:e.message.includes('Email verification is not configured')?e.message:'Registration could not be completed or the verification email could not be sent. Check the SMTP settings and try again.'});}});

// ---------- shopkeeper dashboard (own business only) ----------
app.get('/api/business/me',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  const own=await get(`SELECT business_id FROM business_owners WHERE user_id=?`,[req.user.id]);
  if(!own)return res.status(404).json({error:'No business found for this account'});
  const b=await getBusiness(own.business_id);
  const hours=await all(`SELECT * FROM business_hours WHERE business_id=? ORDER BY rowid`,[b.id]);
  res.json({...b,photos:await getBusinessPhotos(b.id),hours});
}catch(e){res.status(500).json({error:e.message});}});

app.patch('/api/business/:id',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  if(!await ownerFor(req,req.params.id))return res.status(403).json({error:'You do not own this business'});
  const b=await get(`SELECT * FROM businesses WHERE id=?`,[req.params.id]);if(!b)return res.status(404).json({error:'Business not found'});
  const fields=['name','category','phone','address','description','service_area','max_service_radius','home_visit','visit_charge','emergency_service','appointment_required','latitude','longitude'];
  const vals=fields.map(k=>req.body[k]!==undefined?req.body[k]:b[k]);
  const completeness=Math.round(fields.filter((k,i)=>String(vals[i]??'').trim()!=='').length/fields.length*100);
  await run(`UPDATE businesses SET name=?,category=?,phone=?,address=?,description=?,service_area=?,max_service_radius=?,home_visit=?,visit_charge=?,emergency_service=?,appointment_required=?,latitude=?,longitude=?,profile_completeness=?,profile_updated_at=? WHERE id=?`,[...vals,completeness,now(),b.id]);
  res.json(await getBusiness(b.id));
}catch(e){res.status(500).json({error:e.message});}});

app.put('/api/business/:id/hours',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  if(!await ownerFor(req,req.params.id))return res.status(403).json({error:'You do not own this business'});
  for(const h of req.body.hours||[]){await run(`INSERT INTO business_hours(business_id,day,is_closed,open_time,close_time,periods_json) VALUES(?,?,?,?,?,?) ON CONFLICT(business_id,day) DO UPDATE SET is_closed=excluded.is_closed,open_time=excluded.open_time,close_time=excluded.close_time,periods_json=excluded.periods_json`,[req.params.id,h.day,h.is_closed?1:0,h.open_time||null,h.close_time||null,JSON.stringify(h.periods||[])]);}
  await run(`UPDATE businesses SET profile_updated_at=? WHERE id=?`,[now(),req.params.id]);res.json({ok:true});
}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/business/:id/special-hours/today',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  if(!await ownerFor(req,req.params.id))return res.status(403).json({error:'You do not own this business'});
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  res.json(await get(`SELECT date,is_closed,note FROM special_hours WHERE business_id=? AND date=?`,[req.params.id,date])||{date,is_closed:0,note:''});
}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/business/:id/special-hours/today',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  if(!await ownerFor(req,req.params.id))return res.status(403).json({error:'You do not own this business'});
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const closed=req.body.is_closed?1:0;const note=String(req.body.note||'').trim().slice(0,160);
  if(closed)await run(`INSERT INTO special_hours(business_id,date,is_closed,note) VALUES(?,?,1,?) ON CONFLICT(business_id,date) DO UPDATE SET is_closed=1,note=excluded.note`,[req.params.id,date,note]);
  else await run(`DELETE FROM special_hours WHERE business_id=? AND date=?`,[req.params.id,date]);
  res.json({date,is_closed:closed,note});
}catch(e){res.status(500).json({error:e.message});}});

const stockFromQty=q=>q<1?'OUT_OF_STOCK':q<5?'LOW_STOCK':q<10?'MEDIUM_STOCK':'IN_STOCK';
app.post('/api/items',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  const {business_id,name,price,type='PRODUCT',quantity=0,description='',price_type='FIXED',price_min,price_max,category_attributes={}}=req.body;
  if(!business_id||!String(name||'').trim())return res.status(400).json({error:'Business and item name are required'});
  if(!await ownerFor(req,business_id))return res.status(403).json({error:'You do not own this business'});
  const qty=Math.max(0,Number(quantity)||0);
  const r=await run(`INSERT INTO items(business_id,name,price,type,status,quantity,description,price_type,price_min,price_max,category_attributes,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,[business_id,String(name).trim().slice(0,160),price||null,type==='SERVICE'?'SERVICE':'PRODUCT',stockFromQty(qty),qty,description,price_type,price_min||null,price_max||null,JSON.stringify(category_attributes),now()]);
  marketPriceCache = null;
  res.json({id:r.lastID});
}catch(e){res.status(500).json({error:e.message});}});
app.patch('/api/items/:id',auth,requireRole('BUSINESS_OWNER'),async(req,res)=>{try{
  const item=await get(`SELECT * FROM items WHERE id=?`,[req.params.id]);if(!item)return res.status(404).json({error:'Item not found'});
  if(!await ownerFor(req,item.business_id))return res.status(403).json({error:'You do not own this business'});
  const allowed=['name','price','type','status','quantity','description','price_type','price_min','price_max','category_attributes'];
  const data={...item,...Object.fromEntries(allowed.filter(k=>req.body[k]!==undefined).map(k=>[k,req.body[k]]))};
  await run(`UPDATE items SET name=?,price=?,type=?,status=?,quantity=?,description=?,price_type=?,price_min=?,price_max=?,category_attributes=?,updated_at=? WHERE id=?`,[data.name,data.price,data.type,data.status,Math.max(0,Number(data.quantity)||0),data.description,data.price_type,data.price_min,data.price_max,typeof data.category_attributes==='string'?data.category_attributes:JSON.stringify(data.category_attributes),now(),item.id]);
  marketPriceCache = null;
  res.json({ok:true});
}catch(e){res.status(500).json({error:e.message});}});

// Demand tips shown to shopkeepers. Curated by the admin in the demand_insights table (no user tracking).
app.get('/api/demand',auth,requireRole('BUSINESS_OWNER','ADMIN'),async(req,res)=>{try{
  res.json(await all(`SELECT * FROM demand_insights ORDER BY searches DESC`));
}catch(e){res.status(500).json({error:e.message});}});

// ---------- admin: approvals + photos (only the admin can upload photos) ----------
app.get('/api/admin/overview',auth,requireRole('ADMIN'),async(req,res)=>{try{
  const [total,pending,photos]=await Promise.all([get(`SELECT COUNT(*) c FROM businesses WHERE ${PUBLIC_FILTER}`),get(`SELECT COUNT(*) c FROM businesses WHERE verification_status='PENDING'`),get(`SELECT COUNT(*) c FROM business_photos`)]);
  res.json({liveBusinesses:total.c,pendingRegistrations:pending.c,photos:photos.c});
}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/admin/businesses',auth,requireRole('ADMIN'),async(req,res)=>res.json(await all(`SELECT b.id,b.name,b.category,b.phone,b.address,b.verification_status,b.created_at,u.name owner_name,u.email owner_email FROM businesses b LEFT JOIN business_owners o ON o.business_id=b.id LEFT JOIN users u ON u.id=o.user_id ORDER BY CASE b.verification_status WHEN 'PENDING' THEN 0 ELSE 1 END,b.id DESC`)));

app.patch('/api/admin/businesses/:id/status',auth,requireRole('ADMIN'),async(req,res)=>{try{
  const status=req.body.status;if(!['VERIFIED','REJECTED','PENDING'].includes(status))return res.status(400).json({error:'Invalid status'});
  const r=await run(`UPDATE businesses SET verification_status=?,verified=? WHERE id=?`,[status,status==='VERIFIED'?1:0,req.params.id]);
  if(!r.changes)return res.status(404).json({error:'Business not found'});res.json({ok:true});
}catch(e){res.status(500).json({error:e.message});}});

app.post('/api/businesses/:id/photos',auth,requireRole('ADMIN'),async(req,res)=>{try{
  const business=await get(`SELECT id FROM businesses WHERE id=?`,[req.params.id]);
  if(!business)return res.status(404).json({error:'Business not found'});
  const raw=String(req.body.image_data||'');
  const match=raw.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if(!match)return res.status(400).json({error:'Please choose a JPG, PNG, or WebP image.'});
  const mime=match[1].toLowerCase()==='image/jpg'?'image/jpeg':match[1].toLowerCase();
  const buffer=Buffer.from(match[2],'base64');
  if(buffer.length>5*1024*1024)return res.status(400).json({error:'Image is too large. Please choose a smaller photo.'});
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
  const objectPath=`business-${business.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  await storageRequest(`/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: { 'Content-Type': mime, 'x-upsert': 'false', 'cache-control': '31536000' }, body: buffer });
  const imageUrl=`${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
  try {
    const r=await run(`INSERT INTO business_photos(business_id,user_id,image_url,storage_path,caption,status,created_at) VALUES(?,?,?,?,?,?,?)`,[business.id,req.user.id,imageUrl,objectPath,String(req.body.caption||'').trim().slice(0,180),'VISIBLE',now()]);
    res.json(await get(`SELECT id,business_id,image_url,caption,created_at FROM business_photos WHERE id=?`,[r.lastID]));
  } catch (dbError) {
    await storageRequest('/object/' + encodeURIComponent(SUPABASE_STORAGE_BUCKET), { method: 'DELETE', body: JSON.stringify({ prefixes: [objectPath] }) }).catch(() => {});
    throw dbError;
  }
}catch(e){console.error(e);res.status(500).json({error:e.message});}});

app.delete('/api/business-photos/:id',auth,requireRole('ADMIN'),async(req,res)=>{try{
  const photo=await get(`SELECT * FROM business_photos WHERE id=?`,[req.params.id]);
  if(!photo)return res.status(404).json({error:'Photo not found'});
  const objectPath=photo.storage_path || storageObjectPath(photo.image_url);
  if(objectPath) await storageRequest('/object/' + encodeURIComponent(SUPABASE_STORAGE_BUCKET), { method: 'DELETE', body: JSON.stringify({ prefixes: [objectPath] }) });
  await run(`DELETE FROM business_photos WHERE id=?`,[photo.id]);res.json({ok:true});
}catch(e){res.status(500).json({error:e.message});}});

// ---------- serve the built frontend from the same server (single-service hosting) ----------
const distDir=path.join(__dirname,'..','frontend','dist');
if(fs.existsSync(path.join(distDir,'index.html'))){
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/|uploads\/).*/,(req,res)=>res.sendFile(path.join(distDir,'index.html')));
}

app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({error:err.status===413?'Request too large':'Unexpected server error'});});

init().then(()=>app.listen(PORT,()=>console.log(`Market Hub backend running on port ${PORT}`))).catch(e=>{console.error('Startup failed',e);process.exit(1);});
process.on('SIGTERM', async()=>{await db.end();process.exit(0)});
process.on('SIGINT', async()=>{await db.end();process.exit(0)});
