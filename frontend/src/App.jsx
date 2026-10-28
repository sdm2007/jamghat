import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Phone, ArrowLeft, Plus, Compass, Camera, X, Store, Clock3, Moon, Sun, Monitor,
  LogOut, LogIn, Package, ShieldCheck, ChevronRight, SlidersHorizontal, BarChart3, LocateFixed, Navigation,
  ExternalLink, Edit3, Save, AlertTriangle, RefreshCw, CalendarClock, Trash2, User, Check, XCircle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const DEFAULT_LOCATION = { lat: 22.7196, lng: 75.8577, label: 'Bada Bazaar, Indore' };

const registerCategories = [
  'Electronics & Appliances',
  'Daily Needs & Kirana',
  'Food, Sweets & Bakery',
  'Clothing & Fashion',
  'Home & Hardware',
  'Personal Care & Salon',
  'Services & Repairs',
  'Books & Stationery',
  'Other'
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
    catalog: 'Catalog & products',
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
    heroSubtitle: 'Compare local options, availability and opening hours before you go.',
    yourLocation: 'YOUR LOCATION',
    chooseLocation: 'Choose your location',
    useMyLocation: 'Use my location',
    locating: 'Locating…',
    locationNotSet: 'Location not set',
    currentLocationText: 'Your current location',
    exploreMap: 'EXPLORE ON MAP',
    liveLocationMap: 'LIVE LOCATION MAP',
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
    comparePricesBeforeVisit: 'Check availability and shop details before visiting',
    noItemsFound: 'No exact item listing found for this search.',
    emptyNearby: "We couldn't find this nearby. Try another search or expand your area.",
    loadingInfo: 'Loading local information…',
    priceOnRequest: 'Price on request',
    priceOptionalPlaceholder: '₹ Price (Optional)',
    startingAt: 'Starting at ₹{p}',
    fromPrice: 'From ₹{p}',
    contactForPrice: 'Contact for price',
    marketPriceRange: 'Market price range: ₹{min}–₹{max} ({count} listings)',
    checkWithShop: 'Check availability with shop',
    shopPhotos: 'Shop photos',
    noPhotosYet: 'No photos yet.',
    overview: 'Overview',
    inventory: 'Inventory & Items',
    demandTips: 'Demand tips',
    myAccount: 'My account',
    photosTab: 'Photos',
    oneTimeChange: 'One-time change for today',
    save: 'Save',
    saveChanges: 'Save changes',
    addDescription: 'Add a description to improve your listing.',
    itemsCount: 'Items',
    enterExactQty: 'Enter stock or leave blank.',
    addItem: 'Add item / service',
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
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
    catAll: 'All',
    catElectronics: 'Electronics & Appliances',
    catGrocery: 'Daily Needs & Kirana',
    catFood: 'Food, Sweets & Bakery',
    catFashion: 'Clothing & Fashion',
    catHardware: 'Home & Hardware',
    catSalon: 'Personal Care & Salon',
    catServices: 'Services & Repairs',
    catBooks: 'Books & Stationery'
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
    catalog: 'कैटलॉग और सामान',
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
    heroSubtitle: 'दुकान जाने से पहले आस-पास की दुकानें, उपलब्धता और समय जांचें।',
    yourLocation: 'आपकी लोकेशन',
    chooseLocation: 'अपनी लोकेशन चुनें',
    useMyLocation: 'मेरी लोकेशन का उपयोग करें',
    locating: 'लोकेशन खोजी जा रही है…',
    locationNotSet: 'लोकेशन सेट नहीं है',
    currentLocationText: 'आपकी वर्तमान लोकेशन',
    exploreMap: 'नक्शे पर देखें',
    liveLocationMap: 'लाइव लोकेशन मैप',
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
    comparePricesBeforeVisit: 'दुकान जाने से पहले विवरण और उपलब्धता जांचें',
    noItemsFound: 'इस खोज के लिए कोई सामान नहीं मिला।',
    emptyNearby: 'आस-पास कोई दुकान नहीं मिली। दूसरा शब्द खोजें या दायरा बढ़ाएं।',
    loadingInfo: 'जानकारी लोड हो रही है…',
    priceOnRequest: 'पूछने पर भाव',
    priceOptionalPlaceholder: '₹ भाव (वैकल्पिक)',
    startingAt: 'शुरुआती भाव ₹{p}',
    fromPrice: 'न्यूनतम ₹{p}',
    contactForPrice: 'भाव के लिए संपर्क करें',
    marketPriceRange: 'बाज़ार भाव दायरा: ₹{min}–₹{max} ({count} दुकानें)',
    checkWithShop: 'दुकान से उपलब्धता की पुष्टि करें',
    shopPhotos: 'दुकान की तस्वीरें',
    noPhotosYet: 'अभी कोई तस्वीर नहीं है।',
    overview: 'विवरण',
    inventory: 'स्टॉक व सामान',
    demandTips: 'मांग के सुझाव',
    myAccount: 'मेरा खाता',
    photosTab: 'तस्वीरें',
    oneTimeChange: 'केवल आज के लिए बदलाव',
    save: 'सेव करें',
    saveChanges: 'बदलाव सेव करें',
    addDescription: 'लिस्टिंग बेहतर बनाने के लिए विवरण जोड़ें।',
    itemsCount: 'सामान',
    enterExactQty: 'स्टॉक मात्रा दर्ज करें या खाली छोड़ें।',
    addItem: 'सामान / सर्विस जोड़ें',
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
    forgotPassword: 'पासवर्ड भूल गए?',
    resetPassword: 'पासवर्ड बदलें',
    catAll: 'सब',
    catElectronics: 'इलेक्ट्रॉनिक्स व उपकरण',
    catGrocery: 'किराना व दैनिक सामान',
    catFood: 'भोजन, मिठाई व बेकरी',
    catFashion: 'कपड़े व फैशन',
    catHardware: 'घर व हार्डवेयर',
    catSalon: 'सैलून व पर्सनल केयर',
    catServices: 'सर्विस व मरम्मत',
    catBooks: 'किताबें व स्टेशनरी'
  }
};

const getCategoryList = t => [
  ['ALL', t.catAll, '🏪'],
  ['Electronics & Appliances', t.catElectronics, '⚡'],
  ['Daily Needs & Kirana', t.catGrocery, '🛒'],
  ['Food, Sweets & Bakery', t.catFood, '🍲'],
  ['Clothing & Fashion', t.catFashion, '👕'],
  ['Home & Hardware', t.catHardware, '🔧'],
  ['Personal Care & Salon', t.catSalon, '✂️'],
  ['Services & Repairs', t.catServices, '🛠️'],
  ['Books & Stationery', t.catBooks, '📚']
];

const distText = b => {
  const d = Number(b?.distance);
  return Number.isFinite(d) && d < 900 ? `${d} km` : '';
};

function priceText(i, t) {
  if (i.price_type === 'ON_REQUEST') return t.priceOnRequest;
  if (!i.price && !i.price_min && !i.price_max) return t.contactForPrice;
  if (i.price_type === 'STARTING') return t.startingAt.replace('{p}', i.price_min ?? i.price);
  if (i.price_type === 'FROM') return t.fromPrice.replace('{p}', i.price_min ?? i.price);
  if (i.price_type === 'RANGE') return `₹${i.price_min}–₹${i.price_max}`;
  return Number(i.price) > 0 ? `₹${i.price}` : t.contactForPrice;
}

function marketPriceText(i, t) {
  if (i.market_price_count >= 2 && i.market_price_min != null && i.market_price_max != null) {
    return t.marketPriceRange
      .replace('{min}', Number(i.market_price_min).toLocaleString('en-IN'))
      .replace('{max}', Number(i.market_price_max).toLocaleString('en-IN'))
      .replace('{count}', i.market_price_count);
  }
  return '';
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
  const [resetToken, setResetToken] = useState(null);
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
    const tokenForReset = params.get('reset_token');

    if (verificationToken) {
      api(`/auth/verify-email?token=${encodeURIComponent(verificationToken)}`)
        .then(x => setNotice(x.message || 'Email verified. Shop submitted for review.'))
        .catch(e => setNotice(e.message))
        .finally(() => {
          params.delete('verify_email');
          const qs = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
        });
    }

    if (tokenForReset) {
      setResetToken(tokenForReset);
      setAuthMode('reset-password');
      params.delete('reset_token');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    }
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

  // Instant opening UX: Immediately show the cached view then fetch extra details in background
  function openBusiness(b) {
    setSelected(b);
    setPage('business');
    window.scrollTo({ top: 0, behavior: 'instant' });

    api(`/businesses/${b.id}`)
      .then(full => setSelected(full))
      .catch(() => {});
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
            openBusiness={openBusiness}
          />
        )}
        {page === 'dashboard' && user?.role === 'BUSINESS_OWNER' && (
          <BusinessDashboard api={api} logout={logout} t={t} user={user} setUser={setUser} />
        )}
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
          resetToken={resetToken}
          onClose={() => { setAuthMode(null); setResetToken(null); }}
          onLogin={login}
          t={t}
          api={api}
          onResend={async email => api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })}
          onRegister={async d => {
            const result = await api('/business/register', { method: 'POST', body: JSON.stringify(d) });
            setAuthMode(null);
            setNotice(result.message);
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
      {category === 'Services & Repairs' && !query && <HomeServiceRadar businesses={businesses} openBusiness={openBusiness} t={t} />}
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
          href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=15/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          title="Open location in OpenStreetMap"
        >
          <ExternalLink size={15} />
        </a>
      </div>
      {message && <small className="location-message">{message}</small>}
    </section>
  );
}

function SingleShopRouteMap({ business, businesses = [], customerLocation, t, openBusiness }) {
  const [expanded, setExpanded] = useState(true);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const providerLat = Number(business.latitude);
  const providerLng = Number(business.longitude);
  const hasProviderCoords = Number.isFinite(providerLat) && Number.isFinite(providerLng);

  const customerLat = Number(customerLocation?.lat);
  const customerLng = Number(customerLocation?.lng);
  const hasCustomerCoords = Number.isFinite(customerLat) && Number.isFinite(customerLng);

  useEffect(() => {
    if (!expanded || !hasProviderCoords || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([providerLat, providerLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const shopIcon = L.divIcon({
      className: 'custom-shop-pin',
      html: `<div style="background:#e65f20;color:#fff;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;font-weight:bold;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;">${escapeHtml(business.name.slice(0, 1))}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([providerLat, providerLng], { icon: shopIcon })
      .addTo(map)
      .bindPopup(`<b>${escapeHtml(business.name)}</b><br/>${escapeHtml(business.address || '')}`);

    businesses
      .filter(b => b.id !== business.id && Number.isFinite(Number(b.latitude)) && Number.isFinite(Number(b.longitude)))
      .forEach(b => {
        const otherIcon = L.divIcon({
          className: 'custom-secondary-pin',
          html: `<div style="background:#64748b;color:#fff;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;font-size:11px;font-weight:bold;border:1.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.2);">${escapeHtml(b.name.slice(0, 1))}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const m = L.marker([Number(b.latitude), Number(b.longitude)], { icon: otherIcon, opacity: 0.75 }).addTo(map);
        m.bindPopup(`<b>${escapeHtml(b.name)}</b><br/>${escapeHtml(b.category)}`);
      });

    if (hasCustomerCoords) {
      const customerIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `<div style="background:#2563eb;color:#fff;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">You</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(t.currentLocationText);

      fetch(`https://router.project-osrm.org/route/v1/driving/${customerLng},${customerLat};${providerLng},${providerLat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const polyline = L.polyline(coordinates, { color: '#e65f20', weight: 5, opacity: 0.85 }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

            setRouteInfo({
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              duration: `${Math.round(route.duration / 60)} mins`
            });
          }
        })
        .catch(() => {
          map.fitBounds(L.latLngBounds([[customerLat, customerLng], [providerLat, providerLng]]), { padding: [40, 40] });
        });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [expanded, providerLat, providerLng, customerLat, customerLng, hasProviderCoords, hasCustomerCoords, businesses, business.id, t]);

  if (!hasProviderCoords) {
    return (
      <div className="panel" style={{ color: 'var(--muted)', fontSize: '13px' }}>
        Location coordinates are not registered for this shop.
      </div>
    );
  }

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
          <div ref={mapContainerRef} style={{ height: '360px', marginTop: '10px', borderRadius: '15px' }} />
          <div
            className={
              !hasCustomerCoords
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
                {!hasCustomerCoords
                  ? t.customerLocationNotSet
                  : routeInfo
                  ? `${t.shortestRoute}: ${routeInfo.distance} (~${routeInfo.duration})`
                  : t.outsideCoverage}
              </b>
              <small>
                {!hasCustomerCoords
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
                  {b.category}
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
                  {Number(b.visit_charge) > 0 ? `${t.visit} ₹${Number(b.visit_charge).toLocaleString('en-IN')}` : t.contactForPrice}
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

      {business.latitude != null && business.longitude != null && (
        <SingleShopRouteMap
          business={business}
          businesses={businesses}
          customerLocation={customerLocation}
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
              <span className="eyebrow">{t.catServices.toUpperCase()}</span>
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
              <b>{Number(business.visit_charge) > 0 ? `₹${Number(business.visit_charge).toLocaleString('en-IN')}` : t.contactForPrice}</b>
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

function BusinessDashboard({ api, t, logout, user, setUser }) {
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

  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const [accountName, setAccountName] = useState(user?.name || '');
  const [accountEmail, setAccountEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);

  async function loadData() {
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
  }

  useEffect(() => {
    loadData();
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

  async function handleAccountUpdate(e) {
    e.preventDefault();
    setAccountBusy(true);
    setMsg('');
    try {
      const res = await api('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: accountName,
          email: accountEmail,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined
        })
      });
      setUser(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Account details updated successfully.');
    } catch (err) {
      setMsg(err.message || 'Failed to update account details.');
    } finally {
      setAccountBusy(false);
    }
  }

  async function handlePhotoChoose(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPreview(await compressImage(f));
    } catch {
      setMsg('Could not read image file.');
    }
  }

  async function handlePhotoUpload() {
    if (!preview) return;
    setUploadingPhoto(true);
    setMsg('');
    try {
      await api(`/businesses/${biz.id}/photos`, {
        method: 'POST',
        body: JSON.stringify({ image_data: preview, caption })
      });
      setPreview('');
      setCaption('');
      if (photoInputRef.current) photoInputRef.current.value = '';
      setMsg('Photo submitted! It will appear publicly once approved by the administrator.');
      await loadData();
    } catch (err) {
      setMsg(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
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
            {t.profileComplete} · Status: <strong>{biz.verification_status}</strong>
          </p>
          {biz.verification_status === 'EMAIL_UNVERIFIED' && (
            <small style={{ color: 'var(--red)', display: 'block', marginTop: '4px' }}>
              Action required: Check your inbox and click the verification link to submit your shop for activation.
            </small>
          )}
          {biz.verification_status === 'PENDING' && (
            <small style={{ color: 'var(--brand)', display: 'block', marginTop: '4px' }}>
              Your email is verified! Your listing is now in queue awaiting admin activation.
            </small>
          )}
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
          ['photos', t.photosTab],
          ['account', t.myAccount],
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
              value={biz.verification_status === 'EMAIL_UNVERIFIED' ? 'Verify Email' : biz.verification_status === 'PENDING' ? 'Pending Approval' : biz.verification_status === 'REJECTED' ? 'Hidden' : 'Live'}
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

      {tab === 'photos' && (
        <section className="panel photo-panel">
          <div className="section-head">
            <div>
              <h2><Camera size={18} /> {t.shopPhotos}</h2>
              <small>Upload photos of your shop and products.</small>
            </div>
          </div>
          <div className="photo-uploader">
            <input
              ref={photoInputRef}
              className="photo-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChoose}
            />
            <div className="inline-form photo-actions">
              <button type="button" className="secondary small" onClick={() => photoInputRef.current?.click()}>
                <Camera size={15} />
                Choose photo
              </button>
              <button type="button" className="primary small" disabled={!preview || uploadingPhoto} onClick={handlePhotoUpload}>
                {uploadingPhoto ? 'Uploading…' : 'Submit photo for approval'}
              </button>
            </div>
            <input
              className="caption-input"
              placeholder="Photo caption (e.g., Front entrance, New stock)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={180}
            />
          </div>
          <div className="photo-grid">
            {biz.photos?.map(p => (
              <figure className="shop-photo" key={p.id}>
                <img src={p.image_url} alt={p.caption || 'Shop photo'} />
                <figcaption>
                  <p>{p.caption || 'Shop photo'}</p>
                  <span style={{ fontSize: '10px', color: p.status === 'VISIBLE' ? 'var(--green)' : 'var(--brand)' }}>
                    {p.status === 'VISIBLE' ? 'Approved (Live)' : 'Pending Review'}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {tab === 'account' && (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2><User size={18} /> {t.myAccount}</h2>
              <small>Edit your personal login email or password.</small>
            </div>
          </div>
          <form onSubmit={handleAccountUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', marginTop: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              Full Name
              <input value={accountName} onChange={e => setAccountName(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              Email address
              <input type="email" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} required />
            </label>
            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Change Password</span>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              Current Password
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              New Password (min 8 chars)
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
            </label>
            <button className="primary" disabled={accountBusy} style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
              <Save size={15} /> {accountBusy ? 'Saving…' : t.saveChanges}
            </button>
          </form>
        </section>
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
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [tab, setTab] = useState('registrations');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setData(await api('/admin/overview'));
      setShops(await api('/admin/businesses'));
      setPendingPhotos(await api('/admin/pending-photos'));
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Optimistic UI updates immediately eliminate the latency feel for admin clicks
  async function setStatus(id, status) {
    setShops(prev => prev.map(s => s.id === id ? { ...s, verification_status: status } : s));
    try {
      await api(`/admin/businesses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      setMsg(e.message);
      await load();
    }
  }

  async function setPhotoStatus(photoId, status) {
    setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await api(`/admin/photos/${photoId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      setMsg(e.message);
      await load();
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
          <h1>Verified Shop Registrations</h1>
          <small style={{ color: 'var(--muted)' }}>Only shops with verified emails are shown for review.</small>
        </div>
        <button className="danger-outline" onClick={logout}>
          <LogOut size={16} />
          {t.logout}
        </button>
      </div>
      <div className="metric-grid">
        <Metric label="Live shops" value={data.liveBusinesses} />
        <Metric label="Pending Approvals" value={data.pendingRegistrations} />
        <Metric label="Pending Photos" value={data.pendingPhotos} />
      </div>
      {msg && <div className="notice">{msg}</div>}
      <div className="tabs">
        {[
          ['registrations', t.adminShops],
          ['pending-photos', 'Pending Photos']
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
                    {s.category} · {s.phone || 'no phone'} · {t.adminStatus}:{' '}
                    <strong style={{ color: s.verification_status === 'VERIFIED' ? 'var(--green)' : 'var(--brand)' }}>
                      {s.verification_status}
                    </strong>
                  </small>
                </div>
                <div className="inline-form">
                  {s.verification_status !== 'VERIFIED' && (
                    <button className="primary small" onClick={() => setStatus(s.id, 'VERIFIED')}>
                      <Check size={14} /> {t.adminApprove}
                    </button>
                  )}
                  {s.verification_status === 'VERIFIED' && (
                    <button className="secondary small" onClick={() => setStatus(s.id, 'REJECTED')}>
                      Unpublish
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
            <Empty text="No pending shops awaiting approval." />
          )}
        </section>
      )}

      {tab === 'pending-photos' && (
        <section className="panel">
          <h2>Photos for Approval</h2>
          {pendingPhotos.length ? (
            <div className="photo-grid" style={{ marginTop: '14px' }}>
              {pendingPhotos.map(p => (
                <figure className="shop-photo" key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <img src={p.image_url} alt={p.caption || 'Pending review'} style={{ height: '180px', objectFit: 'cover' }} />
                  <figcaption style={{ padding: '8px' }}>
                    <b>{p.business_name}</b>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>{p.caption || 'No caption'}</p>
                    <div className="inline-form" style={{ marginTop: '6px' }}>
                      <button className="primary small" onClick={() => setPhotoStatus(p.id, 'VISIBLE')}>
                        <Check size={13} /> Approve
                      </button>
                      <button className="danger-outline small" onClick={() => setPhotoStatus(p.id, 'REJECTED')}>
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <Empty text="No pending photos to review." />
          )}
        </section>
      )}
    </div>
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
      <input placeholder="Item / service name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder={t.priceOptionalPlaceholder} type="number" value={price} onChange={e => setPrice(e.target.value)} />
      <input
        placeholder="Stock (optional)"
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
              price: price ? Number(price) : null,
              quantity: quantity ? Number(quantity) : 10,
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

function AuthModal({ initialMode = 'login', resetToken, onClose, onLogin, onRegister, onResend, t, api }) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [f, setF] = useState({
    email: '',
    password: '',
    owner_name: '',
    business_name: '',
    category: 'Daily Needs & Kirana',
    phone: '',
    address: '',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    setMsg('');
    setResendMessage('');
    setNeedsVerification(false);
    setBusy(true);

    try {
      if (mode === 'login') {
        await onLogin(f.email, f.password);
      } else if (mode === 'register') {
        await onRegister(f);
      } else if (mode === 'forgot') {
        const res = await api('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail })
        });
        setMsg(res.message);
      } else if (mode === 'reset-password') {
        const res = await api('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password: newPassword })
        });
        setMsg(res.message);
        setTimeout(() => setMode('login'), 2000);
      }
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
        <h2>
          {mode === 'login'
            ? t.login
            : mode === 'register'
            ? t.register
            : mode === 'forgot'
            ? t.forgotPassword
            : t.resetPassword}
        </h2>
        <p>
          {mode === 'login'
            ? 'Sign in to manage your shop and inventory.'
            : mode === 'register'
            ? 'Free registration for local shopkeepers.'
            : mode === 'forgot'
            ? 'Enter your registered email to receive a password reset link.'
            : 'Enter your new password below.'}
        </p>
        {err && <div className="error-banner">{err}</div>}
        {msg && <div className="notice">{msg}</div>}
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
            <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={f.password}
              onChange={set('password')}
              minLength={8}
              required
            />
          </>
        )}

        {mode === 'login' && (
          <>
            <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
            <input
              type="password"
              placeholder="Password"
              value={f.password}
              onChange={set('password')}
              required
            />
            <button
              type="button"
              className="link-btn"
              style={{ alignSelf: 'flex-start', padding: '0 0 4px', fontSize: '11px' }}
              onClick={() => { setErr(''); setMsg(''); setMode('forgot'); }}
            >
              {t.forgotPassword}
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <input
            type="email"
            placeholder="Your registered email address"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            required
          />
        )}

        {mode === 'reset-password' && (
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        )}

        <button className="primary full" disabled={busy}>
          {busy
            ? t.locating
            : mode === 'login'
            ? 'Sign in'
            : mode === 'register'
            ? 'Register my shop'
            : mode === 'forgot'
            ? 'Send reset link'
            : 'Save new password'}
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
            setMsg('');
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