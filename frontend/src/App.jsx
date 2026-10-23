import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Phone, ArrowLeft, TrendingUp, Plus, Compass, Camera, X, Store, Clock3, Moon, Sun, Monitor,
  LogOut, LogIn, Package, ShieldCheck, ChevronRight, SlidersHorizontal, BarChart3, LocateFixed, Navigation,
  ExternalLink, Edit3, Save, AlertTriangle, RefreshCw, CalendarClock, Sparkles, Trash2, Route
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_LOCATION = { lat: 22.7196, lng: 75.8577, label: 'Bada Bazaar, Indore' };

const registerCategories = [
  'Grocery', 'Books & Stationery', 'Beauty & Barber', 'Tailor', 'Mobile Repair', 'Bakery',
  'Hardware', 'Home Services', 'Agriculture & Tools', 'Dairy & Sweets', 'Fruits & Vegetables',
  'Footwear', 'Household & Kitchen', 'Mobile Accessories', 'Kids & Toys', 'Tea & Snacks', 'Other'
];

const i18n = {
  en: {
    tagline: 'Know price. Know stock. Buy nearby.',
    search: 'Search products, services, or local shops…',
    nearby: 'Nearby local businesses',
    localOptions: 'local options',
    open: 'Open now',
    closed: 'Closed',
    closedToday: 'Closed today',
    opensAt: 'Opens',
    closesAt: 'Closes',
    login: 'Business login',
    register: 'List your shop',
    catalog: 'Catalog & pricing',
    hours: 'Opening hours',
    weeklyHours: 'Weekly hours',
    dashboard: 'Business dashboard',
    home: 'Home',
    admin: 'Admin',
    myShop: 'My shop',
    logout: 'Log out',
    localDiscovery: 'LOCAL DISCOVERY',
    heroTitle1: 'Find what you need,',
    heroTitle2: 'nearby.',
    heroSubtitle: 'Compare local prices, availability and opening hours before you go.',
    yourLocation: 'YOUR LOCATION',
    chooseLocation: 'Choose your location',
    useMyLocation: 'Use my location',
    locating: 'Locating…',
    locationNotSet: 'Location not set',
    pinnedLocation: 'Pinned map location',
    currentLocationText: 'Your current location',
    exploreMap: 'EXPLORE ON MAP',
    liveLocationMap: 'LIVE LOCATION MAP',
    whoServesArea: 'Who serves this area?',
    whatIsNearby: 'What is nearby & shortest route',
    tapToExplore: 'Tap to explore nearby shops and route',
    tapToHide: 'Tap to hide the map.',
    homeServiceRadar: 'HOME SERVICE RADAR',
    whoCanCome: 'Who can come to your area?',
    radarSubtitle: 'Coverage, live availability, visit charge and contact details',
    yourArea: 'Your area',
    nearbyShort: 'Nearby',
    visit: 'Visit',
    viewServiceDetails: 'View service details',
    viewDetails: 'View details',
    listed: 'listed',
    listedItems: 'listed items',
    backToDiscovery: 'Back to discovery',
    about: 'About',
    callBusiness: 'Call business',
    contact: 'Contact',
    serviceCoverage: 'Route & Location',
    serviceArea: 'Service area',
    areaNotSpecified: 'Area not specified',
    maxRadius: 'Maximum radius',
    visitCharge: 'Visit charge',
    availability: 'Availability',
    availableNow: 'Available now',
    currentlyClosed: 'Currently closed',
    emergency: 'Emergency',
    appointment: 'Appointment',
    inStock: 'In stock',
    lowStock: 'Low stock',
    mediumStock: 'Medium stock',
    outOfStock: 'Out of stock',
    unverified: 'Unverified',
    availabilityUnverified: 'Availability unverified',
    onlyLeft: 'Only {n} left',
    itemsMatching: 'Items matching “{query}”',
    comparePricesBeforeVisit: 'Compare listed prices and shops before visiting',
    noItemsFound: 'No exact item listing found for this search.',
    emptyNearby: "We couldn't find this nearby. Try another search or expand your area.",
    loadingInfo: 'Loading local information…',
    priceOnRequest: 'Price on request',
    startingAt: 'Starting at ₹{p}',
    fromPrice: 'From ₹{p}',
    contactForPrice: 'Contact for price',
    marketPriceRange: 'Market price range: ₹{min}–₹{max} ({count} listings)',
    notEnoughListings: 'Market price range: Not enough comparable listings yet',
    checkWithShop: 'Check availability with shop',
    shopPhotos: 'Shop photos',
    noPhotosYet: 'No photos yet.',
    overview: 'Overview',
    inventory: 'Inventory',
    demandTips: 'Demand tips',
    oneTimeChange: 'One-time change for today',
    save: 'Save',
    saveChanges: 'Save changes',
    addDescription: 'Add a description to improve your listing.',
    itemsCount: 'Items',
    enterExactQty: 'Enter the exact quantity.',
    addItem: 'Add item',
    noTips: 'No tips right now.',
    profileComplete: '% profile complete',
    insideCoverage: 'Shortest route found',
    outsideCoverage: 'Route not available',
    customerLocationNotSet: 'Customer location not set',
    shortestRoute: 'Shortest Route',
    deleteAccount: 'Delete account',
    deleteAccountConfirm: 'Are you sure you want to permanently delete your profile and shop listing? This action cannot be undone.',
    deletingAccount: 'Deleting account…',
    adminShops: 'Shops & Services',
    adminDeleteListing: 'Delete Listing',
    adminDeleteConfirm: 'Are you sure you want to permanently remove "{name}"? All associated catalog items and photos will be deleted.',
    adminApprove: 'Approve',
    adminReject: 'Reject',
    adminStatus: 'Status',
    allCategory: 'All',
    booksCategory: 'Books',
    groceryCategory: 'Grocery',
    salonCategory: 'Salon',
    tailorCategory: 'Tailor',
    mobileCategory: 'Mobile',
    bakeryCategory: 'Bakery',
    hardwareCategory: 'Hardware',
    servicesCategory: 'Services',
    kisanCategory: 'Kisan'
  },
  hi: {
    tagline: 'दुकान पास, भाव साफ़, सामान पक्का।',
    search: 'सामान, सेवा या स्थानीय दुकान खोजें…',
    nearby: 'आपके आस-पास की दुकानें',
    localOptions: 'स्थानीय विकल्प',
    open: 'अभी खुला है',
    closed: 'बंद है',
    closedToday: 'आज बंद है',
    opensAt: 'खुलने का समय',
    closesAt: 'बंद होने का समय',
    login: 'दुकानदार लॉग इन',
    register: 'अपनी दुकान जोड़ें',
    catalog: 'कैटलॉग और भाव',
    hours: 'खुलने का समय',
    weeklyHours: 'साप्ताहिक समय',
    dashboard: 'दुकानदार डैशबोर्ड',
    home: 'होम',
    admin: 'व्यवस्थापक',
    myShop: 'मेरी दुकान',
    logout: 'लॉग आउट',
    localDiscovery: 'स्थानीय खोज',
    heroTitle1: 'ज़रूरी सामान पाएं,',
    heroTitle2: 'अपने पास।',
    heroSubtitle: 'दुकान जाने से पहले आस-पास के भाव, स्टॉक और खुलने का समय जांचें।',
    yourLocation: 'आपकी लोकेशन',
    chooseLocation: 'अपनी लोकेशन चुनें',
    useMyLocation: 'मेरी लोकेशन का उपयोग करें',
    locating: 'लोकेशन खोजी जा रही है…',
    locationNotSet: 'लोकेशन सेट नहीं है',
    pinnedLocation: 'मैप पर चुनी लोकेशन',
    currentLocationText: 'आपकी वर्तमान लोकेशन',
    exploreMap: 'नक्शे पर देखें',
    liveLocationMap: 'लाइव लोकेशन मैप',
    whoServesArea: 'इस क्षेत्र में कौन सी सेवाएं उपलब्ध हैं?',
    whatIsNearby: 'आस-पास की दुकानें और सबसे छोटा रास्ता',
    tapToExplore: 'नक्शा और रास्ता देखने के लिए टैप करें',
    tapToHide: 'नक्शा छिपाने के लिए टैप करें',
    homeServiceRadar: 'होम सर्विस रडार',
    whoCanCome: 'आपके घर तक कौन सी सर्विस आ सकती है?',
    radarSubtitle: 'सर्विस कवरेज, उपलब्धता, विजिट चार्ज और संपर्क नंबर',
    yourArea: 'आपका क्षेत्र',
    nearbyShort: 'आस-पास',
    visit: 'विजिट',
    viewServiceDetails: 'सर्विस का विवरण देखें',
    viewDetails: 'विवरण देखें',
    listed: 'लिस्टेड',
    listedItems: 'लिस्टेड आइटम',
    backToDiscovery: 'वापस खोज पर जाएं',
    about: 'दुकान के बारे में',
    callBusiness: 'कॉल करें',
    contact: 'संपर्क करें',
    serviceCoverage: 'रास्ता और लोकेशन',
    serviceArea: 'सर्विस क्षेत्र',
    areaNotSpecified: 'क्षेत्र निर्दिष्ट नहीं है',
    maxRadius: 'अधिकतम दायरा',
    visitCharge: 'विजिट चार्ज',
    availability: 'उपलब्धता',
    availableNow: 'अभी उपलब्ध है',
    currentlyClosed: 'अभी बंद है',
    emergency: 'आपातकालीन',
    appointment: 'अपॉइंटमेंट',
    inStock: 'उपलब्ध है',
    lowStock: 'कम स्टॉक',
    mediumStock: 'मध्यम स्टॉक',
    outOfStock: 'स्टॉक समाप्त',
    unverified: 'असत्यापित',
    availabilityUnverified: 'उपलब्धता असत्यापित',
    onlyLeft: 'केवल {n} बचे हैं',
    itemsMatching: '“{query}” से जुड़े सामान',
    comparePricesBeforeVisit: 'दुकान जाने से पहले भाव और स्टॉक जांच लें',
    noItemsFound: 'इस खोज के लिए कोई सामान नहीं मिला।',
    emptyNearby: 'आस-पास कोई दुकान नहीं मिली। दूसरा शब्द खोजें या दायरा बढ़ाएं।',
    loadingInfo: 'जानकारी लोड हो रही है…',
    priceOnRequest: 'पूछने पर भाव',
    startingAt: 'शुरुआती भाव ₹{p}',
    fromPrice: 'न्यूनतम ₹{p}',
    contactForPrice: 'भाव के लिए संपर्क करें',
    marketPriceRange: 'बाज़ार भाव दायरा: ₹{min}–₹{max} ({count} दुकानें)',
    notEnoughListings: 'बाज़ार भाव दायरा: अभी पर्याप्त तुलनात्मक लिस्टिंग नहीं हैं',
    checkWithShop: 'दुकान से उपलब्धता की पुष्टि करें',
    shopPhotos: 'दुकान की तस्वीरें',
    noPhotosYet: 'अभी कोई तस्वीर नहीं है।',
    overview: 'विवरण',
    inventory: 'स्टॉक सूची',
    demandTips: 'मांग के सुझाव',
    oneTimeChange: 'केवल आज के लिए बदलाव',
    save: 'सेव करें',
    saveChanges: 'बदलाव सेव करें',
    addDescription: 'लिस्टिंग बेहतर बनाने के लिए विवरण जोड़ें।',
    itemsCount: 'सामान',
    enterExactQty: 'सटीक मात्रा दर्ज करें।',
    addItem: 'सामान जोड़ें',
    noTips: 'अभी कोई सुझाव उपलब्ध नहीं हैं।',
    profileComplete: '% प्रोफ़ाइल पूर्ण',
    insideCoverage: 'सबसे छोटा रास्ता मिल गया',
    outsideCoverage: 'रास्ता उपलब्ध नहीं है',
    customerLocationNotSet: 'ग्राहक लोकेशन सेट नहीं है',
    shortestRoute: 'सबसे छोटा रास्ता',
    deleteAccount: 'खाता डिलीट करें',
    deleteAccountConfirm: 'क्या आप वाकई अपना प्रोफाइल और दुकान हमेशा के लिए हटाना चाहते हैं? यह वापस नहीं हो सकता।',
    deletingAccount: 'खाता हटाया जा रहा है…',
    adminShops: 'दुकानें व सेवाएं',
    adminDeleteListing: 'लिस्टिंग हटाएं',
    adminDeleteConfirm: 'क्या आप वाकई "{name}" की लिस्टिंग हमेशा के लिए हटाना चाहते हैं? इसके सभी आइटम व तस्वीरें हटा दी जाएंगी।',
    adminApprove: 'मंजूरी दें',
    adminReject: 'अस्वीकार करें',
    adminStatus: 'स्थिति',
    allCategory: 'सब',
    booksCategory: 'किताबें',
    groceryCategory: 'किराना',
    salonCategory: 'सैलून',
    tailorCategory: 'टेलर',
    mobileCategory: 'मोबाइल रिपेयर',
    bakeryCategory: 'बेकरी',
    hardwareCategory: 'हार्डवेयर',
    servicesCategory: 'होम सर्विसेज',
    kisanCategory: 'किसान उपकरण'
  }
};

const getCategoryList = t => [
  ['ALL', t.allCategory, '🏪'],
  ['Books & Stationery', t.booksCategory, '📚'],
  ['Grocery', t.groceryCategory, '🛒'],
  ['Beauty & Barber', t.salonCategory, '✂️'],
  ['Tailor', t.tailorCategory, '🧵'],
  ['Mobile Repair', t.mobileCategory, '📱'],
  ['Bakery', t.bakeryCategory, '🥐'],
  ['Hardware', t.hardwareCategory, '🔧'],
  ['Home Services', t.servicesCategory, '🏠'],
  ['Agriculture & Tools', t.kisanCategory, '🚜']
];

const distText = b => {
  const d = Number(b?.distance);
  return Number.isFinite(d) && d < 900 ? `${d} km` : '';
};

function priceText(i, t) {
  if (i.price_type === 'ON_REQUEST') return t.priceOnRequest;
  if (i.price_type === 'STARTING') return t.startingAt.replace('{p}', i.price_min ?? i.price);
  if (i.price_type === 'FROM') return t.fromPrice.replace('{p}', i.price_min ?? i.price);
  if (i.price_type === 'RANGE') return `₹${i.price_min}–₹${i.price_max}`;
  return i.price == null ? t.contactForPrice : `₹${i.price}`;
}

function marketPriceText(i, t) {
  if (i.market_price_count >= 2 && i.market_price_min != null && i.market_price_max != null) {
    return t.marketPriceRange
      .replace('{min}', Number(i.market_price_min).toLocaleString('en-IN'))
      .replace('{max}', Number(i.market_price_max).toLocaleString('en-IN'))
      .replace('{count}', i.market_price_count);
  }
  return t.notEnoughListings;
}

function stockLabel(i, t) {
  if (!i.availability_verified) return t.unverified;
  if (i.quantity > 0 && i.quantity < 5) return t.onlyLeft.replace('{n}', i.quantity);
  if (i.status === 'IN_STOCK') return t.inStock;
  if (i.status === 'MEDIUM_STOCK') return t.mediumStock;
  if (i.status === 'LOW_STOCK') return t.lowStock;
  return t.outOfStock;
}

function relative(ts) {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} day ago`;
}

function formatTime(v) {
  if (!v) return '';
  const [h, m] = v.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('mh-theme') || 'system');
  const [lang, setLang] = useState(localStorage.getItem('mh-lang') || 'en');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [notice, setNotice] = useState('');
  const [customerLocation, setCustomerLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mh-location')) || DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const t = i18n[lang] || i18n.en;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mh-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mh-lang', lang);
  }, [lang]);

  useEffect(() => {
    api('/auth/me')
      .then(x => {
        setUser(x.user);
        setPage(x.user.role === 'ADMIN' ? 'admin' : 'dashboard');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verificationToken = params.get('verify_email');
    if (!verificationToken) return;
    api(`/auth/verify-email?token=${encodeURIComponent(verificationToken)}`)
      .then(x => setNotice(x.message || 'Email verified. You can now sign in.'))
      .catch(e => setNotice(e.message))
      .finally(() => {
        params.delete('verify_email');
        const qs = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
      });
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [query, category, customerLocation?.lat, customerLocation?.lng]);

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const r = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: 'include' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = new Error(data.error || 'Request failed');
      err.code = data.code;
      throw err;
    }
    return data;
  }

  async function loadBusinesses() {
    setLoading(true);
    setError('');
    try {
      setBusinesses(
        await api(
          `/businesses?q=${encodeURIComponent(query)}&category=${encodeURIComponent(
            category === 'ALL' ? '' : category
          )}&lat=${encodeURIComponent(customerLocation?.lat || '')}&lng=${encodeURIComponent(customerLocation?.lng || '')}`
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function chooseCustomerLocation(next) {
    setCustomerLocation(next);
    localStorage.setItem('mh-location', JSON.stringify(next));
  }

  async function useMyLocation() {
    setLocationMessage('');
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const next = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          label: t.currentLocationText
        };
        chooseCustomerLocation(next);
        setLocationMessage(t.currentLocationText);
        setLocating(false);
      },
      err => {
        setLocationMessage(err.code === 1 ? 'Location permission was denied.' : 'Unable to get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function login(email, password) {
    const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(d.user);
    setAuthMode(null);
    setPage(d.user.role === 'ADMIN' ? 'admin' : 'dashboard');
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setPage('home');
  }

  async function openBusiness(b) {
    try {
      setSelected(await api(`/businesses/${b.id}`));
      setPage('business');
    } catch (e) {
      setError(e.message);
    }
  }

  const homeOfUser = user ? (user.role === 'ADMIN' ? 'admin' : 'dashboard') : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setPage('home');
            setSelected(null);
          }}
        >
          <span className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
            <img
              src="/logo.png"
              alt="Jamghat"
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.textContent = 'J';
              }}
            />
          </span>
          <span>
            <b>Jamghat</b>
            <small>{t.tagline}</small>
          </span>
        </button>
        <div className="top-actions">
          <button className="icon-btn" title="Language" onClick={() => setLang(x => (x === 'en' ? 'hi' : 'en'))}>
            {lang === 'en' ? 'हिन्दी' : 'EN'}
          </button>
          <ThemeButton theme={theme} setTheme={setTheme} />
          {user ? (
            <>
              <button className="primary small" onClick={() => setPage(homeOfUser)}>
                {user.role === 'ADMIN' ? t.admin : t.myShop}
              </button>
              <button className="icon-btn" title="Log out" onClick={logout}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="secondary small" onClick={() => setAuthMode('login')}>
              {t.login}
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div className="notice" style={{ margin: '12px 24px 0' }}>
          {notice}
          <button style={{ float: 'right', border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}
      <main className="content">
        {page === 'home' && (
          <Home
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            businesses={businesses}
            loading={loading}
            openBusiness={openBusiness}
            t={t}
            customerLocation={customerLocation}
            locating={locating}
            useMyLocation={useMyLocation}
            locationMessage={locationMessage}
            onRegister={() => setAuthMode('register')}
            showRegister={!user}
          />
        )}
        {page === 'business' && selected && (
          <Business
            business={selected}
            businesses={businesses}
            onBack={() => setPage('home')}
            t={t}
            customerLocation={customerLocation}
            locating={locating}
            useMyLocation={useMyLocation}
            locationMessage={locationMessage}
            setCustomerLocation={chooseCustomerLocation}
            openBusiness={openBusiness}
          />
        )}
        {page === 'dashboard' && user?.role === 'BUSINESS_OWNER' && <BusinessDashboard api={api} logout={logout} t={t} />}
        {page === 'admin' && user?.role === 'ADMIN' && <AdminDashboard api={api} logout={logout} t={t} />}
      </main>
      <nav className="bottom-nav">
        <NavButton
          icon={<Compass />}
          label={t.home}
          active={page === 'home'}
          onClick={() => {
            setPage('home');
            setSelected(null);
          }}
        />
        {user ? (
          <>
            <NavButton
              icon={<Store />}
              label={user.role === 'ADMIN' ? t.admin : t.myShop}
              active={page === homeOfUser}
              onClick={() => setPage(homeOfUser)}
            />
            <NavButton icon={<LogOut />} label={t.logout} onClick={logout} />
          </>
        ) : (
          <>
            <NavButton icon={<Plus />} label={t.register} active={false} onClick={() => setAuthMode('register')} />
            <NavButton icon={<LogIn />} label={t.login} active={false} onClick={() => setAuthMode('login')} />
          </>
        )}
      </nav>
      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onLogin={login}
          t={t}
          onResend={async email => api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })}
          onRegister={async d => {
            const result = await api('/business/register', { method: 'POST', body: JSON.stringify(d) });
            setAuthMode(null);
            setNotice(result.message || 'Check your email to verify your account.');
          }}
        />
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button className={active ? 'nav-btn active' : 'nav-btn'} onClick={onClick}>
      {React.cloneElement(icon, { size: 20 })}
      <span>{label}</span>
    </button>
  );
}

function ThemeButton({ theme, setTheme }) {
  return (
    <button
      className="icon-btn"
      title="Theme"
      onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
    >
      {theme === 'dark' ? <Moon size={17} /> : theme === 'light' ? <Sun size={17} /> : <Monitor size={17} />}
    </button>
  );
}

function Home({
  query,
  setQuery,
  category,
  setCategory,
  businesses,
  loading,
  openBusiness,
  t,
  customerLocation,
  locating,
  useMyLocation,
  locationMessage,
  onRegister,
  showRegister
}) {
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="eyebrow">{t.localDiscovery}</span>
          <h1>
            {t.heroTitle1}
            <br />
            <span>{t.heroTitle2}</span>
          </h1>
          <p>{t.heroSubtitle}</p>
          {showRegister && (
            <button type="button" className="hero-cta" onClick={onRegister}>
              <Store size={16} /> {t.register}
            </button>
          )}
        </div>
        <div className="hero-orb">⌁</div>
      </section>

      <div className="search-wrap">
        <Search size={19} />
        <input id="market-search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} />
        {query && (
          <button onClick={() => setQuery('')}>
            <X size={17} />
          </button>
        )}
      </div>

      {/* Front page location selector */}
      <LocationBar
        location={customerLocation}
        locating={locating}
        onLocate={useMyLocation}
        message={locationMessage}
        t={t}
      />

      <div className="chips">
        {getCategoryList(t).map(([id, label, icon]) => (
          <button key={id} className={category === id ? 'chip active' : 'chip'} onClick={() => setCategory(id)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>
      {category === 'Home Services' && !query && <HomeServiceRadar businesses={businesses} openBusiness={openBusiness} t={t} />}
      <section>
        <div className="section-head">
          <div>
            <h2>{t.nearby}</h2>
            <small>
              {businesses.length} {t.localOptions}
            </small>
          </div>
          <SlidersHorizontal size={18} />
        </div>
        {loading ? (
          <Loading text={t.loadingInfo} />
        ) : businesses.length === 0 ? (
          <Empty text={t.emptyNearby} />
        ) : (
          <div className="business-grid">
            {businesses.map(b => (
              <BusinessCard key={b.id} b={b} openBusiness={openBusiness} t={t} />
            ))}
          </div>
        )}
      </section>
      {query.trim() && <ProductSearchListings query={query} businesses={businesses} openBusiness={openBusiness} t={t} />}
    </div>
  );
}

function LocationBar({ location, locating, onLocate, message, t }) {
  const lat = location?.lat || DEFAULT_LOCATION.lat;
  const lng = location?.lng || DEFAULT_LOCATION.lng;
  return (
    <section className="location-bar panel" style={{ margin: '4px 0' }}>
      <div className="location-main">
        <div className="location-icon">
          <Navigation size={18} />
        </div>
        <div>
          <span className="eyebrow">{t.yourLocation}</span>
          <b>{location?.label || t.chooseLocation}</b>
          <small>
            {location?.lat && location?.lng
              ? `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`
              : t.locationNotSet}
          </small>
        </div>
      </div>
      <div className="location-actions">
        <button className="secondary small" onClick={onLocate} disabled={locating}>
          {locating ? <RefreshCw size={15} className="spin" /> : <LocateFixed size={15} />}{' '}
          {locating ? t.locating : t.useMyLocation}
        </button>
        <a
          className="icon-btn"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`}
          target="_blank"
          rel="noreferrer"
          title="Open location in Google Maps"
        >
          <ExternalLink size={15} />
        </a>
      </div>
      {message && <small className="location-message">{message}</small>}
    </section>
  );
}

function SingleShopRouteMap({ business, businesses = [], customerLocation, onBack, t, openBusiness }) {
  const [expanded, setExpanded] = useState(true);
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const infoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  const provider = { lat: Number(business.latitude), lng: Number(business.longitude) };
  const customer = { lat: Number(customerLocation?.lat), lng: Number(customerLocation?.lng) };
  const hasValidCustomerCoords = Number.isFinite(customer.lat) && Number.isFinite(customer.lng);
  const hasValidProviderCoords = Number.isFinite(provider.lat) && Number.isFinite(provider.lng);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env to enable map.');
      return;
    }
    if (window.google?.maps) {
      setReady(true);
      return;
    }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      const onLoad = () => !cancelled && setReady(true);
      const onError = () => !cancelled && setMapError('Google Maps could not be loaded.');
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => !cancelled && setReady(true);
    script.onerror = () => !cancelled && setMapError('Google Maps could not be loaded.');
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!expanded) {
      mapRef.current = null;
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
      return;
    }

    if (!ready || !ref.current || !window.google?.maps || !hasValidProviderCoords) return;

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(ref.current, {
        center: provider,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy'
      });
      // NOTE: Removed click listener so clicking the map does not shift your location pin!
    }

    // Clean up previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (infoRef.current) infoRef.current.close();

    // 1. Plot current shop pin
    const shopMarker = new window.google.maps.Marker({
      map: mapRef.current,
      position: provider,
      title: business.name,
      label: { text: business.name.slice(0, 1), color: '#ffffff', fontWeight: '800' }
    });
    markersRef.current.push(shopMarker);

    // 2. Plot customer location pin
    if (hasValidCustomerCoords) {
      const customerMarker = new window.google.maps.Marker({
        map: mapRef.current,
        position: customer,
        title: t.currentLocationText,
        label: { text: 'You', color: '#ffffff', fontWeight: '800' },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#e65f20',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      markersRef.current.push(customerMarker);
    }

    // 3. Plot other nearby shops
    const otherShops = businesses.filter(
      b => b.id !== business.id && Number.isFinite(Number(b.latitude)) && Number.isFinite(Number(b.longitude))
    );

    otherShops.forEach(b => {
      const pos = { lat: Number(b.latitude), lng: Number(b.longitude) };
      const m = new window.google.maps.Marker({
        map: mapRef.current,
        position: pos,
        title: b.name,
        opacity: 0.7,
        label: { text: b.name.slice(0, 1), color: '#ffffff', fontWeight: '700' }
      });
      m.addListener('click', () => {
        if (infoRef.current) infoRef.current.close();
        const contentStr =
          '<div style="min-width:200px;font-family:Arial,sans-serif">' +
          '<strong>' + escapeHtml(b.name) + '</strong>' +
          '<div style="margin-top:4px;color:#666">' + escapeHtml(b.category) + '</div>' +
          '<button id="map-goto-' + b.id + '" style="margin-top:8px;padding:5px 9px;border:0;border-radius:6px;background:#e65f20;color:#fff;font-weight:700;cursor:pointer">' +
          escapeHtml(t.viewDetails) +
          '</button>' +
          '</div>';
        infoRef.current = new window.google.maps.InfoWindow({ content: contentStr });
        infoRef.current.open({ map: mapRef.current, anchor: m });
        window.setTimeout(() => {
          document.getElementById(`map-goto-${b.id}`)?.addEventListener('click', () => openBusiness(b));
        }, 0);
      });
      markersRef.current.push(m);
    });

    // 4. Calculate and draw shortest route without replacing custom markers
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true, // keeps our custom labeled markers intact
        polylineOptions: {
          strokeColor: '#e65f20',
          strokeWeight: 5,
          strokeOpacity: 0.85
        }
      });
    }

    if (hasValidCustomerCoords) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: customer,
          destination: provider,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg) {
              setRouteInfo({
                distance: leg.distance?.text,
                duration: leg.duration?.text
              });
            }
          } else {
            setRouteInfo(null);
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(provider);
            bounds.extend(customer);
            mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }
        }
      );
    } else {
      mapRef.current.setCenter(provider);
      mapRef.current.setZoom(14);
    }
  }, [ready, expanded, business.id, business.latitude, business.longitude, customerLocation?.lat, customerLocation?.lng, businesses, hasValidCustomerCoords, hasValidProviderCoords, t]);

  if (!GOOGLE_MAPS_API_KEY) return null;

  return (
    <section className={`map-panel panel map-collapsible ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="map-collapse-trigger"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className="map-collapse-icon">
          <MapPin size={22} />
        </span>
        <span className="map-collapse-copy">
          <span className="eyebrow">{expanded ? t.liveLocationMap : t.exploreMap}</span>
          <b>{t.whatIsNearby}</b>
          <small>{expanded ? t.tapToHide : t.tapToExplore}</small>
        </span>
        <span className="map-collapse-chevron">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <>
          {mapError ? (
            <div className="error-banner">{mapError}</div>
          ) : (
            <div ref={ref} className="google-map" style={{ height: '360px', marginTop: '10px' }} aria-label="Google map" />
          )}

          <div
            className={
              !hasValidCustomerCoords
                ? 'coverage-result unknown'
                : routeInfo
                ? 'coverage-result inside'
                : 'coverage-result outside'
            }
            style={{ marginTop: '12px' }}
          >
            <span className="coverage-dot" />
            <div>
              <b>
                {!hasValidCustomerCoords
                  ? t.customerLocationNotSet
                  : routeInfo
                  ? `${t.shortestRoute}: ${routeInfo.distance} (~${routeInfo.duration})`
                  : t.outsideCoverage}
              </b>
              <small>
                {!hasValidCustomerCoords
                  ? t.chooseLocation
                  : `Calculated shortest path to ${business.name}.`}
              </small>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function HomeServiceRadar({ businesses, openBusiness, t }) {
  const providers = businesses.filter(b => b.home_visit).slice(0, 10);
  const angleFor = index => -90 + (index * 360) / Math.max(providers.length, 1);
  return (
    <section className="service-radar panel">
      <div className="section-head">
        <div>
          <span className="eyebrow">{t.homeServiceRadar}</span>
          <h2>{t.whoCanCome}</h2>
          <small>{t.radarSubtitle}</small>
        </div>
        <span className="radar-live">
          <span /> LIVE
        </span>
      </div>
      <div className="radar-layout">
        <div className="radar-map">
          <div className="radar-ring ring-1" />
          <div className="radar-ring ring-2" />
          <div className="radar-ring ring-3" />
          <div className="radar-sweep" />
          <div className="radar-center">
            <MapPin size={18} />
            <b>{t.yourArea}</b>
            <small>{t.nearbyShort}</small>
          </div>
          {providers.map((b, i) => {
            const angle = angleFor(i);
            const coverage = Math.min(
              43,
              Math.max(18, (Number(b.distance || 1) / (Number(b.max_service_radius || 10) || 10)) * 43)
            );
            return (
              <button
                key={b.id}
                className="radar-dot-wrap"
                style={{ transform: `rotate(${angle}deg) translateY(-${coverage}%)` }}
                onClick={() => openBusiness(b)}
              >
                <span className="radar-dot" />
                <span className="radar-label" style={{ transform: `rotate(${-angle}deg)` }}>
                  {b.category.replace('Home Services', '')}
                </span>
              </button>
            );
          })}
        </div>
        <div className="service-provider-list">
          {providers.map(b => (
            <article
              className="service-provider"
              key={b.id}
              onClick={() => openBusiness(b)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openBusiness(b);
                }
              }}
            >
              <div className="service-provider-top">
                <div className="biz-avatar">{b.name.slice(0, 1)}</div>
                <div className="biz-main">
                  <div className="biz-title">
                    <h3>{b.name}</h3>
                    {b.verified ? <ShieldCheck size={14} /> : null}
                  </div>
                  <p>
                    {distText(b) ? `${distText(b)} · ` : ''}
                    {b.max_service_radius || '—'} km
                  </p>
                </div>
              </div>
              <div className="service-meta">
                <span>
                  <MapPin size={13} />
                  {b.service_area || t.areaNotSpecified}
                </span>
                <span>
                  <Clock3 size={13} />
                  {b.status_label}
                </span>
                <span>
                  <Phone size={13} />
                  <a href={`tel:${b.phone}`} onClick={e => e.stopPropagation()}>
                    {b.phone}
                  </a>
                </span>
                <strong>
                  {t.visit} ₹{Number(b.visit_charge || 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="service-tags">
                <span>{b.is_open ? t.availableNow : t.currentlyClosed}</span>
                {b.emergency_service ? <span>{t.emergency}</span> : null}
                {b.appointment_required ? <span>{t.appointment}</span> : null}
              </div>
              <button
                type="button"
                className="details-btn"
                onClick={e => {
                  e.stopPropagation();
                  openBusiness(b);
                }}
              >
                {t.viewServiceDetails} <ChevronRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessCard({ b, openBusiness, t }) {
  const go = () => openBusiness(b);
  return (
    <article
      className="business-card"
      onClick={go}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="card-top">
        <div className="biz-avatar">{b.name.slice(0, 1)}</div>
        <div className="biz-main">
          <div className="biz-title">
            <h3>{b.name}</h3>
            {b.verified ? <ShieldCheck size={15} /> : null}
          </div>
          <p>{b.category}{distText(b) ? ` · ${distText(b)}` : ''}</p>
        </div>
      </div>
      <div className="status-row">
        <span className={b.is_open ? 'status open' : 'status closed'}>
          {b.is_open ? '● ' + t.open : '● ' + t.closed}
        </span>
        <span>{b.status_label}</span>
      </div>
      <div className="mini-items">
        {b.items?.slice(0, 2).map(i => (
          <div key={i.id}>
            <span>{i.name}</span>
            <b>{priceText(i, t)}</b>
            <small className="market-price-range">{marketPriceText(i, t)}</small>
            <em className={`stock ${i.status.toLowerCase()}`}>{stockLabel(i, t)}</em>
          </div>
        ))}
      </div>
      <div className="card-foot">
        <span>
          <Package size={14} /> {b.items?.length || 0} {t.listed}
        </span>
        <button
          type="button"
          className="details-btn"
          onClick={e => {
            e.stopPropagation();
            go();
          }}
        >
          {t.viewDetails} <ChevronRight size={15} />
        </button>
      </div>
    </article>
  );
}

function Business({
  business,
  businesses,
  onBack,
  t,
  customerLocation,
  locating,
  useMyLocation,
  locationMessage,
  setCustomerLocation,
  openBusiness
}) {
  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={17} /> {t.backToDiscovery}
      </button>
      <section className="profile-hero">
        <div className="profile-avatar">{business.name.slice(0, 1)}</div>
        <div className="profile-copy">
          <div className="biz-title">
            <h1>{business.name}</h1>
            {business.verified ? <ShieldCheck size={18} /> : null}
          </div>
          <p>{business.category}{distText(business) ? ` · ${distText(business)} away` : ''}</p>
          <div className={business.is_open ? 'status open' : 'status closed'}>{business.status_label}</div>
        </div>
      </section>

      {/* Single Unified Map: Shows nearby shops + Shortest route without duplicate map or pointer jumping */}
      {business.latitude != null && business.longitude != null && (
        <SingleShopRouteMap
          business={business}
          businesses={businesses}
          customerLocation={customerLocation}
          onBack={onBack}
          t={t}
          openBusiness={openBusiness}
        />
      )}

      <div className="info-grid">
        <div>
          <MapPin size={17} />
          <span>{business.address}</span>
        </div>
        <div>
          <Phone size={17} />
          <a href={`tel:${business.phone}`}>{business.phone}</a>
        </div>
        <div>
          <Package size={17} />
          <span>
            {business.items?.length || 0} {t.listedItems}
          </span>
        </div>
        <div>
          <Clock3 size={17} />
          <span>
            {business.is_open
              ? `${t.closesAt} ${business.closes_at}`
              : business.next_open
              ? `${t.opensAt} ${business.next_open}`
              : t.closedToday}
          </span>
        </div>
      </div>

      {business.home_visit ? (
        <section className="service-detail-panel panel">
          <div className="section-head">
            <div>
              <span className="eyebrow">{t.servicesCategory.toUpperCase()}</span>
              <h2>{t.serviceCoverage}</h2>
            </div>
            <MapPin size={18} />
          </div>
          <div className="service-detail-grid">
            <div>
              <small>{t.serviceArea}</small>
              <b>{business.service_area || t.areaNotSpecified}</b>
            </div>
            <div>
              <small>{t.maxRadius}</small>
              <b>{business.max_service_radius || '—'} km</b>
            </div>
            <div>
              <small>{t.visitCharge}</small>
              <b>₹{Number(business.visit_charge || 0).toLocaleString('en-IN')}</b>
            </div>
            <div>
              <small>{t.availability}</small>
              <b>{business.status_label}</b>
            </div>
          </div>
          <a className="primary call" href={`tel:${business.phone}`}>
            <Phone size={16} /> {t.contact} {business.phone}
          </a>
        </section>
      ) : null}

      {business.photos?.length ? <PhotoGallery photos={business.photos} name={business.name} t={t} /> : null}

      {business.description && (
        <section className="panel">
          <h2>{t.about}</h2>
          <p>{business.description}</p>
        </section>
      )}

      <section className="panel">
        <div className="section-head">
          <h2>{t.catalog}</h2>
        </div>
        <div className="catalog">
          {business.items?.map(i => (
            <div className="catalog-row" key={i.id}>
              <div>
                <b>{i.name}</b>
                <small>
                  {i.type === 'SERVICE' ? 'Service' : 'Product'} ·{' '}
                  {i.availability_verified ? 'Updated ' + relative(i.updated_at) : t.availabilityUnverified}
                </small>
                {i.description && <p>{i.description}</p>}
              </div>
              <div className="catalog-right">
                <div className="catalog-price-wrap">
                  <strong>{priceText(i, t)}</strong>
                  <small className="market-price-range">{marketPriceText(i, t)}</small>
                  <span className={`stock ${i.status.toLowerCase()}`}>{stockLabel(i, t)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>{t.hours}</h2>
          <Clock3 size={18} />
        </div>
        <div className="hours-list">
          {business.hours?.map(h => (
            <div key={h.day}>
              <span>{h.day}</span>
              <b>{h.is_closed ? t.closed : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}</b>
            </div>
          ))}
        </div>
      </section>

      <a className="primary call" href={`tel:${business.phone}`}>
        <Phone size={17} /> {t.callBusiness}
      </a>
    </div>
  );
}

function ProductSearchListings({ query, businesses, openBusiness, t }) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const listings = businesses.flatMap(b =>
    (b.items || [])
      .filter(i => {
        const hay = `${i.name} ${i.description || ''}`.toLowerCase();
        return words.every(w => hay.includes(w)) || hay.includes(query.toLowerCase());
      })
      .map(i => ({ item: i, business: b }))
  );

  return (
    <section className="panel product-search-results">
      <div className="section-head">
        <div>
          <h2>{t.itemsMatching.replace('{query}', query)}</h2>
          <small>{t.comparePricesBeforeVisit}</small>
        </div>
        <Package size={18} />
      </div>
      {listings.length ? (
        listings.map(({ item, business }) => (
          <button
            className="product-listing"
            key={`${business.id}-${item.id}`}
            onClick={() => openBusiness(business)}
          >
            <span className="product-listing-icon">
              <Package size={18} />
            </span>
            <span className="product-listing-copy">
              <b>{item.name}</b>
              <small>
                {business.name} · {business.address}
              </small>
              <em>
                {business.is_open ? t.open : t.closed} ·{' '}
                {item.status === 'OUT_OF_STOCK'
                  ? t.outOfStock
                  : item.quantity > 0 && item.quantity < 5
                  ? t.onlyLeft.replace('{n}', item.quantity)
                  : t.checkWithShop}
              </em>
            </span>
            <span className="product-listing-price">
              <strong>{priceText(item, t)}</strong>
              <small className="market-price-range">{marketPriceText(item, t)}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))
      ) : (
        <p className="muted">{t.noItemsFound}</p>
      )}
    </section>
  );
}

function BusinessDashboard({ api, t, logout }) {
  const [biz, setBiz] = useState(null);
  const [demand, setDemand] = useState(null);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [hours, setHours] = useState([]);
  const [closedToday, setClosedToday] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await api('/business/me');
        setBiz(b);
        setForm(b);
        setHours(b.hours || []);
        try {
          const special = await api(`/business/${b.id}/special-hours/today`);
          setClosedToday(!!special.is_closed);
          setSpecialNote(special.note || '');
        } catch {}
        setDemand(await api('/demand').catch(() => []));
      } catch (e) {
        setMsg(e.message);
      }
    })();
  }, []);

  if (!biz) return <Loading text={t.loadingInfo} />;

  async function saveBiz() {
    await api(`/business/${biz.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    setBiz(await api('/business/me'));
    setEditing(false);
    setMsg('Business profile updated.');
  }

  async function saveHours() {
    await api(`/business/${biz.id}/hours`, { method: 'PUT', body: JSON.stringify({ hours }) });
    setBiz(await api('/business/me'));
    setMsg('Weekly opening hours updated.');
  }

  async function saveSpecialHours() {
    await api(`/business/${biz.id}/special-hours/today`, {
      method: 'PUT',
      body: JSON.stringify({ is_closed: closedToday, note: specialNote })
    });
    setBiz(await api('/business/me'));
    setMsg(closedToday ? 'Your shop is marked closed for today only.' : 'Normal hours resume.');
  }

  async function saveQuantity(i, value) {
    const quantity = Math.max(0, Number(value) || 0);
    await api(`/items/${i.id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    setBiz(await api('/business/me'));
    setMsg(`${i.name} stock updated.`);
  }

  async function handleDeleteProfile() {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    setDeleting(true);
    try {
      await api('/auth/me', { method: 'DELETE' });
      logout();
    } catch (e) {
      setMsg(e.message || 'Failed to delete account.');
      setDeleting(false);
    }
  }

  return (
    <div className="stack">
      <PageTitle title={t.dashboard} icon={<Store />} />
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">SHOP OWNER</span>
          <h1>{biz.name}</h1>
          <p>
            {biz.profile_completeness}
            {t.profileComplete}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="danger-outline" onClick={handleDeleteProfile} disabled={deleting}>
            <Trash2 size={16} />
            {deleting ? t.deletingAccount : t.deleteAccount}
          </button>
          <button className="secondary small" onClick={logout}>
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </div>
      <div className="tabs">
        {[
          ['overview', t.overview],
          ['inventory', t.inventory],
          ['hours', t.hours],
          ['demand', t.demandTips]
        ].map(x => (
          <button className={tab === x[0] ? 'tab active' : 'tab'} onClick={() => setTab(x[0])} key={x[0]}>
            {x[1]}
          </button>
        ))}
      </div>
      {msg && <div className="notice">{msg}</div>}

      {tab === 'overview' && (
        <>
          <div className="metric-grid">
            <Metric
              label="Listing"
              value={biz.verification_status === 'PENDING' ? 'Pending' : biz.verification_status === 'REJECTED' ? 'Hidden' : 'Live'}
            />
            <Metric label={t.itemsCount} value={biz.items.length} />
            <Metric label="Status" value={biz.is_open ? t.open : t.closed} />
          </div>
          <section className="panel">
            <div className="section-head">
              <h2>Business profile</h2>
              <button className="icon-btn" onClick={() => setEditing(!editing)}>
                <Edit3 size={16} />
              </button>
            </div>
            {editing ? (
              <div className="form-grid">
                {[
                  'name',
                  'category',
                  'phone',
                  'address',
                  'description',
                  'service_area',
                  'max_service_radius',
                  'visit_charge',
                  'latitude',
                  'longitude'
                ].map(k => (
                  <label key={k}>
                    {k.replace('_', ' ')}
                    <input
                      type={['max_service_radius', 'visit_charge'].includes(k) ? 'number' : 'text'}
                      value={form[k] ?? ''}
                      onChange={e => setForm({ ...form, [k]: e.target.value })}
                    />
                  </label>
                ))}
                <button className="primary" onClick={saveBiz}>
                  <Save size={16} />
                  {t.saveChanges}
                </button>
              </div>
            ) : (
              <p>{biz.description || t.addDescription}</p>
            )}
          </section>
        </>
      )}

      {tab === 'inventory' && (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>{t.inventory}</h2>
              <small>{t.enterExactQty}</small>
            </div>
            <AddItem api={api} businessId={biz.id} refresh={async () => setBiz(await api('/business/me'))} t={t} />
          </div>
          {biz.items.map(i => (
            <div className="inventory-row" key={i.id}>
              <div>
                <b>{i.name}</b>
                <small>
                  {priceText(i, t)} · Updated {relative(i.updated_at)}
                </small>
              </div>
              <div className="inventory-controls">
                <label>
                  <span>{t.itemsCount}</span>
                  <input
                    type="number"
                    min="0"
                    value={i.quantity ?? 0}
                    onChange={e =>
                      setBiz({
                        ...biz,
                        items: biz.items.map(x => (x.id === i.id ? { ...x, quantity: e.target.value } : x))
                      })
                    }
                    onBlur={e => saveQuantity(i, e.target.value)}
                  />
                </label>
                <span className={`stock-button ${i.status.toLowerCase()}`}>{stockLabel(i, t)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'hours' && (
        <>
          <section className="panel special-hours-panel">
            <div className="section-head">
              <div>
                <h2>{t.oneTimeChange}</h2>
              </div>
              <CalendarClock size={20} />
            </div>
            <label className="check-field closed-today-toggle">
              <input type="checkbox" checked={closedToday} onChange={e => setClosedToday(e.target.checked)} />
              <span>
                <b>{t.closedToday}</b>
              </span>
            </label>
            <button className="primary" onClick={saveSpecialHours}>
              <Save size={16} />
              {t.save}
            </button>
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>{t.weeklyHours}</h2>
              <button className="primary small" onClick={saveHours}>
                <Save size={15} />
                {t.save}
              </button>
            </div>
            {hours.map((h, idx) => (
              <div className="hour-editor" key={h.day}>
                <b>{h.day}</b>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!h.is_closed}
                    onChange={e =>
                      setHours(hours.map((x, i) => (i === idx ? { ...x, is_closed: !e.target.checked } : x)))
                    }
                  />
                  <span />
                </label>
                {!h.is_closed && (
                  <>
                    <input
                      type="time"
                      value={h.open_time || ''}
                      onChange={e =>
                        setHours(hours.map((x, i) => (i === idx ? { ...x, open_time: e.target.value } : x)))
                      }
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={h.close_time || ''}
                      onChange={e =>
                        setHours(hours.map((x, i) => (i === idx ? { ...x, close_time: e.target.value } : x)))
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {tab === 'demand' && (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>{t.demandTips}</h2>
            </div>
            <BarChart3 />
          </div>
          {demand?.length ? (
            demand.map(x => (
              <div className="demand-row" key={x.id}>
                <div>
                  <b>{x.item}</b>
                  <small>{x.action}</small>
                </div>
                <strong>{x.increase}</strong>
              </div>
            ))
          ) : (
            <Empty text={t.noTips} />
          )}
        </section>
      )}
    </div>
  );
}

function AdminDashboard({ api, logout, t }) {
  const [data, setData] = useState(null);
  const [shops, setShops] = useState([]);
  const [tab, setTab] = useState('registrations');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setData(await api('/admin/overview'));
      setShops(await api('/admin/businesses'));
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    try {
      await api(`/admin/businesses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function deleteListing(id, name) {
    const promptText = t.adminDeleteConfirm.replace('{name}', name);
    if (!window.confirm(promptText)) return;
    try {
      await api(`/admin/businesses/${id}`, { method: 'DELETE' });
      setMsg(`Listing "${name}" removed successfully.`);
      await load();
    } catch (e) {
      setMsg(e.message || 'Failed to delete business.');
    }
  }

  if (!data) return msg ? <div className="error-banner">{msg}</div> : <Loading text={t.loadingInfo} />;

  return (
    <div className="stack">
      <PageTitle title={t.admin} icon={<ShieldCheck />} />
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">JAMGHAT ADMIN</span>
          <h1>Registrations & photos</h1>
        </div>
        <button className="danger-outline" onClick={logout}>
          <LogOut size={16} />
          {t.logout}
        </button>
      </div>
      <div className="metric-grid">
        <Metric label="Live shops" value={data.liveBusinesses} />
        <Metric label="Pending" value={data.pendingRegistrations} />
        <Metric label="Photos" value={data.photos} />
      </div>
      {msg && <div className="notice">{msg}</div>}
      <div className="tabs">
        {[
          ['registrations', t.adminShops],
          ['photos', t.shopPhotos]
        ].map(x => (
          <button className={tab === x[0] ? 'tab active' : 'tab'} onClick={() => setTab(x[0])} key={x[0]}>
            {x[1]}
          </button>
        ))}
      </div>
      {tab === 'registrations' && (
        <section className="panel">
          <h2>{t.adminShops}</h2>
          {shops.length ? (
            shops.map(s => (
              <div className="admin-row" key={s.id}>
                <div>
                  <b>{s.name}</b>
                  <small>
                    {s.category} · {s.phone || 'no phone'} · {t.adminStatus}: {s.verification_status}
                  </small>
                </div>
                <div className="inline-form">
                  {s.verification_status !== 'VERIFIED' && (
                    <button className="primary small" onClick={() => setStatus(s.id, 'VERIFIED')}>
                      {t.adminApprove}
                    </button>
                  )}
                  {s.verification_status === 'PENDING' && (
                    <button className="secondary small" onClick={() => setStatus(s.id, 'REJECTED')}>
                      {t.adminReject}
                    </button>
                  )}
                  <button
                    className="danger-outline small"
                    onClick={() => deleteListing(s.id, s.name)}
                    title={t.adminDeleteListing}
                  >
                    <Trash2 size={13} /> {t.adminDeleteListing}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty text="No shops yet." />
          )}
        </section>
      )}
      {tab === 'photos' && <AdminPhotos api={api} shops={shops} t={t} />}
    </div>
  );
}

function AdminPhotos({ api, shops, t }) {
  const [shopId, setShopId] = useState('');
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const inputRef = useRef(null);

  async function loadPhotos(id) {
    setPhotos(id ? await api(`/businesses/${id}/photos`) : []);
  }

  useEffect(() => {
    loadPhotos(shopId).catch(e => setMsg(e.message));
  }, [shopId]);

  async function choose(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPreview(await compressImage(f));
    } catch {
      setMsg('Could not read this image.');
    }
  }

  async function upload() {
    if (!preview || !shopId) return;
    setBusy(true);
    setMsg('');
    try {
      await api(`/businesses/${shopId}/photos`, { method: 'POST', body: JSON.stringify({ image_data: preview, caption }) });
      setPreview('');
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
      setMsg('Photo uploaded.');
      await loadPhotos(shopId);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this shop photo?')) return;
    try {
      await api(`/business-photos/${id}`, { method: 'DELETE' });
      await loadPhotos(shopId);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <section className="panel photo-panel">
      <div className="section-head">
        <div>
          <h2>
            <Camera size={18} /> {t.shopPhotos}
          </h2>
        </div>
      </div>
      <label className="special-note-label">
        Shop
        <select
          value={shopId}
          onChange={e => {
            setShopId(e.target.value);
            setMsg('');
          }}
        >
          <option value="">Choose a shop…</option>
          {shops.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {msg && <div className="notice">{msg}</div>}
      {shopId && (
        <div className="photo-uploader">
          <input
            ref={inputRef}
            className="photo-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={choose}
          />
          <div className="inline-form photo-actions">
            <button type="button" className="secondary small" onClick={() => inputRef.current?.click()}>
              <Camera size={15} />
              Choose photo
            </button>
            <button type="button" className="primary small" disabled={!preview || busy} onClick={upload}>
              {busy ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
          <input
            className="caption-input"
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={180}
          />
        </div>
      )}
      {shopId &&
        (photos.length ? (
          <div className="photo-grid">
            {photos.map(p => (
              <figure className="shop-photo" key={p.id}>
                <img src={p.image_url} alt={p.caption || 'Shop photo'} />
                <figcaption>
                  {p.caption && <p>{p.caption}</p>}
                  <button className="photo-remove" onClick={() => remove(p.id)}>
                    <X size={14} />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Empty text={t.noPhotosYet} />
        ))}
    </section>
  );
}

function PhotoGallery({ photos, name, t }) {
  return (
    <section className="panel photo-panel">
      <div className="section-head">
        <div>
          <h2>
            <Camera size={18} /> {t.shopPhotos}
          </h2>
        </div>
      </div>
      <div className="photo-grid">
        {photos.map(p => (
          <figure className="shop-photo" key={p.id}>
            <img loading="lazy" src={p.image_url} alt={p.caption || `Photo of ${name}`} />
            {p.caption && (
              <figcaption>
                <p>{p.caption}</p>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function AddItem({ api, businessId, refresh, t }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('PRODUCT');

  if (!open)
    return (
      <button className="primary small" onClick={() => setOpen(true)}>
        <Plus size={15} />
        {t.addItem}
      </button>
    );

  return (
    <div className="inline-form">
      <input placeholder="Item/service" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="₹ price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
      <input
        placeholder="Items in stock"
        type="number"
        min="0"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
      />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option>PRODUCT</option>
        <option>SERVICE</option>
      </select>
      <button
        className="primary small"
        onClick={async () => {
          await api('/items', {
            method: 'POST',
            body: JSON.stringify({
              business_id: businessId,
              name,
              price: Number(price),
              quantity: Number(quantity) || 0,
              type
            })
          });
          setOpen(false);
          setName('');
          setPrice('');
          setQuantity('');
          refresh();
        }}
      >
        {t.save}
      </button>
      <button className="icon-btn" onClick={() => setOpen(false)}>
        <X size={16} />
      </button>
    </div>
  );
}

function AuthModal({ initialMode = 'login', onClose, onLogin, onRegister, onResend, t }) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [f, setF] = useState({
    email: '',
    password: '',
    owner_name: '',
    business_name: '',
    category: 'Grocery',
    phone: '',
    address: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  const set = k => e => setF({ ...f, [k]: e.target.value });

  function locate() {
    setErr('');
    if (!navigator.geolocation) {
      setErr('Location not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p =>
        setF(x => ({
          ...x,
          latitude: Number(p.coords.latitude.toFixed(6)),
          longitude: Number(p.coords.longitude.toFixed(6))
        })),
      () => setErr('Could not get your location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setResendMessage('');
    setNeedsVerification(false);
    setBusy(true);
    try {
      if (mode === 'login') await onLogin(f.email, f.password);
      else await onRegister(f);
    } catch (x) {
      setErr(x.message);
      setNeedsVerification(x.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setErr('');
    setResendMessage('');
    try {
      const result = await onResend(f.email);
      setResendMessage(result.message || 'Verification email sent.');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="auth-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X />
        </button>
        <span className="eyebrow">JAMGHAT</span>
        <h2>{mode === 'login' ? t.login : t.register}</h2>
        <p>{mode === 'login' ? 'Sign in to update your shop.' : 'Free for shopkeepers.'}</p>
        {err && <div className="error-banner">{err}</div>}
        {resendMessage && <div className="notice">{resendMessage}</div>}
        {mode === 'register' && (
          <>
            <input placeholder="Your name" value={f.owner_name} onChange={set('owner_name')} required />
            <input placeholder="Shop name" value={f.business_name} onChange={set('business_name')} required />
            <select value={f.category} onChange={set('category')}>
              {registerCategories.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="tel" placeholder="Shop phone number" value={f.phone} onChange={set('phone')} required />
            <input placeholder="Shop address / area" value={f.address} onChange={set('address')} required />
            <textarea
              placeholder="Description (optional)"
              value={f.description}
              onChange={set('description')}
              maxLength={400}
            />
            <button type="button" className="secondary small" onClick={locate}>
              <LocateFixed size={15} />{' '}
              {f.latitude !== '' ? `Location saved (${f.latitude}, ${f.longitude})` : t.useMyLocation}
            </button>
          </>
        )}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input
          type="password"
          placeholder="Password"
          value={f.password}
          onChange={set('password')}
          minLength={mode === 'register' ? 8 : undefined}
          required
        />
        <button className="primary full" disabled={busy}>
          {busy ? t.locating : mode === 'login' ? 'Sign in' : 'Register my shop'}
        </button>
        {mode === 'login' && needsVerification && (
          <button type="button" className="link-btn" disabled={busy || !f.email} onClick={resend}>
            Resend verification email
          </button>
        )}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setErr('');
            setResendMessage('');
            setNeedsVerification(false);
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          {mode === 'login' ? 'New here? List your shop' : 'Already registered? Sign in'}
        </button>
      </form>
    </div>
  );
}

function PageTitle({ title, icon }) {
  return (
    <div className="page-title">
      <span>{icon}</span>
      <h1>{title}</h1>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Loading({ text = 'Loading local information…' }) {
  return (
    <div className="loading">
      <RefreshCw className="spin" size={18} />
      {text}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <Search size={22} />
      <b>{text}</b>
    </div>
  );
}

export default App;