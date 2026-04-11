/* ================================================================
   DHANNIE'S FRAGRANCE — script.js
   Supabase DB + Storage | localStorage fallback
   ================================================================ */

/* ================================================================
   1. SUPABASE — HARDCODED CREDENTIALS (auto-connects on load)
   ================================================================ */

const SUPABASE_URL = 'https://yqskkeuxzhcyxspfleka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxc2trZXV4emhjeXhzcGZsZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ5NjIsImV4cCI6MjA5MTQyMDk2Mn0.tapAGr2A3i6lmdzepTXrPbbuhRSzOvwp0q7Txa-_9pY';

/*
  NOTE: `supabase` below refers to the GLOBAL object exposed by the
  CDN <script> tag in index.html:
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  This gives us window.supabase = { createClient, ... }
  We do NOT use ES module imports here.
*/

let supabaseClient = null;

function initSupabase() {
  try {
    // `supabase` is the CDN global — window.supabase
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase connected');
    updateDbStatusUI(true);
  } catch (e) {
    console.error('❌ Supabase init failed:', e);
    supabaseClient = null;
    updateDbStatusUI(false);
  }
}

/** Update the green/red pill in the admin bar */
function updateDbStatusUI(connected) {
  const dot  = document.getElementById('db-dot');
  const text = document.getElementById('db-status-text');
  const pill = document.getElementById('db-status-pill');
  if (!dot) return;
  dot.style.background = connected ? '#25D366' : '#e74c3c';
  if (text) text.textContent = connected ? 'DB Connected' : 'Local Only';
  if (pill) {
    if (connected) pill.classList.add('connected');
    else pill.classList.remove('connected');
  }
}

/* ================================================================
   2. DEMO PRODUCTS (shown if DB is empty / unreachable)
   ================================================================ */

const DEMO_PRODUCTS = [
  {
    id: 'p1', name: 'Midnight Oud', price: 55000, gender: 'men', scent: 'woody',
    stock: 0, sold: true, eco: false, bestseller: true,
    vibe: 'Dark, smoldering power — the scent of a CEO who owns the room.',
    topNotes: ['Black Pepper', 'Cardamom'], heartNotes: ['Oud Wood', 'Rose'], baseNotes: ['Amber', 'Musk'],
    sizes: ['30ml', '50ml', '100ml'], image_url: '', image_storage_path: '', createdAt: 1700000000000
  },
  {
    id: 'p2', name: 'Rose Éclat', price: 38000, gender: 'women', scent: 'floral',
    stock: 25, sold: false, eco: true, bestseller: true,
    vibe: 'Soft morning light on fresh petals — effortlessly feminine.',
    topNotes: ['Pink Pepper', 'Citrus'], heartNotes: ['Damask Rose', 'Jasmine'], baseNotes: ['White Musk', 'Sandalwood'],
    sizes: ['30ml', '50ml'], image_url: '', image_storage_path: '', createdAt: 1690000000000
  },
  {
    id: 'p3', name: 'Aqua Verde', price: 28000, gender: 'unisex', scent: 'fresh',
    stock: 40, sold: false, eco: true, bestseller: false,
    vibe: 'The first breath of ocean air — clean, free, and impossibly alive.',
    topNotes: ['Sea Salt', 'Bergamot'], heartNotes: ['Green Tea', 'Mint'], baseNotes: ['Cedar', 'Musk'],
    sizes: ['30ml', '50ml', '100ml'], image_url: '', image_storage_path: '', createdAt: 1680000000000
  },
  {
    id: 'p4', name: 'Amber Mystique', price: 47000, gender: 'women', scent: 'oriental',
    stock: 12, sold: false, eco: false, bestseller: false,
    vibe: 'Velvet nights and candlelit whispers — sensual warmth that lingers.',
    topNotes: ['Saffron', 'Bergamot'], heartNotes: ['Amber Resin', 'Tuberose'], baseNotes: ['Vanilla', 'Patchouli'],
    sizes: ['50ml', '100ml'], image_url: '', image_storage_path: '', createdAt: 1670000000000
  },
];

/* ================================================================
   3. PRODUCT STORE
   Table: products
   Key columns: id, name, price, stock, gender, scent, vibe,
                sizes (text[]), sold, eco, bestseller,
                top_notes, heart_notes, base_notes (text[]),
                image_url, image_storage_path, created_at
   ================================================================ */

let products = [];

/** Pull products from Supabase, fall back to localStorage / demo data */
async function fetchProducts() {
  showSyncSpinner(true);

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      products = (data || []).map(dbRowToProduct);
      // Cache locally for offline use
      localStorage.setItem('dhannies_products', JSON.stringify(products));
    } catch (err) {
      console.error('Supabase fetch error:', err);
      showToast('Using local data');
      products = loadLocalProducts();
    }
  } else {
    products = loadLocalProducts();
  }

  showSyncSpinner(false);
  renderAll();
  if (loggedIn) { renderAdminStats(); renderAdminTable(); }
}

function loadLocalProducts() {
  const s = localStorage.getItem('dhannies_products');
  return s ? JSON.parse(s) : DEMO_PRODUCTS;
}

/** DB row (snake_case) → JS object (camelCase) */
function dbRowToProduct(row) {
  return {
    id:                 row.id,
    name:               row.name,
    price:              row.price,
    stock:              row.stock,
    gender:             row.gender,
    scent:              row.scent,
    vibe:               row.vibe || '',
    sizes:              row.sizes || ['30ml', '50ml', '100ml'],
    sold:               row.sold || false,
    eco:                row.eco || false,
    bestseller:         row.bestseller || false,
    topNotes:           row.top_notes    || [],
    heartNotes:         row.heart_notes  || [],
    baseNotes:          row.base_notes   || [],
    image_url:          row.image_url    || '',
    image_storage_path: row.image_storage_path || '',
    createdAt:          row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

/** JS object (camelCase) → DB row (snake_case) */
function productToDbRow(p) {
  return {
    id:                 p.id,
    name:               p.name,
    price:              p.price,
    stock:              p.stock,
    gender:             p.gender,
    scent:              p.scent,
    vibe:               p.vibe || '',
    sizes:              p.sizes || [],
    sold:               p.sold || false,
    eco:                p.eco || false,
    bestseller:         p.bestseller || false,
    top_notes:          p.topNotes   || [],
    heart_notes:        p.heartNotes || [],
    base_notes:         p.baseNotes  || [],
    image_url:          p.image_url  || '',
    image_storage_path: p.image_storage_path || '',
  };
}

/** Save (upsert) one product to Supabase + localStorage */
async function persistProduct(p) {
  // Update local state immediately
  const idx = products.findIndex(x => x.id === p.id);
  if (idx !== -1) products[idx] = p;
  else products.unshift(p);
  localStorage.setItem('dhannies_products', JSON.stringify(products));

  if (supabaseClient) {
    showSyncSpinner(true);
    const { error } = await supabaseClient
      .from('products')
      .upsert(productToDbRow(p), { onConflict: 'id' });
    showSyncSpinner(false);

    if (error) {
      console.error('Upsert error:', error);
      showToast('Saved locally — DB sync failed');
    } else {
      showToast('Product saved to database ✦');
    }
  } else {
    showToast('Saved locally (DB not connected)');
  }
}

/** Delete a product from Supabase + localStorage */
async function removeProduct(id) {
  const p = products.find(x => x.id === id);

  products = products.filter(x => x.id !== id);
  localStorage.setItem('dhannies_products', JSON.stringify(products));

  if (supabaseClient) {
    showSyncSpinner(true);
    // Remove image file from storage first
    if (p && p.image_storage_path) {
      await supabaseClient.storage
        .from('product-images')
        .remove([p.image_storage_path]);
    }
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    showSyncSpinner(false);
    if (error) console.error('Delete error:', error);
    else showToast('Product deleted');
  } else {
    showToast('Product deleted');
  }

  renderAdminStats();
  renderAdminTable();
  renderAll();
}

/* ================================================================
   4. IMAGE UPLOAD — Supabase Storage bucket: "product-images"
   Falls back to base64 dataURL if no DB connected.
   ================================================================ */

let uploadedImageUrl    = '';
let uploadedStoragePath = '';

/** Called when admin selects a file in the product form */
async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('Image too large — max 10 MB'); return; }

  const preview = document.getElementById('img-preview');
  const hint    = document.getElementById('upload-hint');
  const actions = document.getElementById('upload-actions');

  if (supabaseClient) {
    // ── Upload to Supabase Storage ────────────────────────────
    showToast('Uploading...');
    const ext      = file.name.split('.').pop().toLowerCase();
    const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upError } = await supabaseClient.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (upError) {
      console.error('Storage upload error:', upError);
      showToast('Upload failed — saving locally instead');
      readAsBase64(file, preview, hint, actions);
      return;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('product-images')
      .getPublicUrl(filePath);

    uploadedImageUrl    = urlData.publicUrl;
    uploadedStoragePath = filePath;

    if (preview) { preview.src = uploadedImageUrl; preview.style.display = 'block'; }
    if (hint)    hint.style.display    = 'none';
    if (actions) actions.style.display = 'block';
    showToast('Image uploaded to Supabase ✦');

  } else {
    // ── Fallback: base64 ──────────────────────────────────────
    readAsBase64(file, preview, hint, actions);
    uploadedStoragePath = '';
  }
}

function readAsBase64(file, preview, hint, actions) {
  const reader = new FileReader();
  reader.onload = e => {
    uploadedImageUrl = e.target.result;
    if (preview) { preview.src = uploadedImageUrl; preview.style.display = 'block'; }
    if (hint)    hint.style.display    = 'none';
    if (actions) actions.style.display = 'block';
    showToast('Image ready (stored locally)');
  };
  reader.readAsDataURL(file);
}

function removeUploadedImage() {
  uploadedImageUrl    = '';
  uploadedStoragePath = '';
  const preview = document.getElementById('img-preview');
  const hint    = document.getElementById('upload-hint');
  const actions = document.getElementById('upload-actions');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (hint)    hint.style.display    = 'block';
  if (actions) actions.style.display = 'none';
}

/* ================================================================
   5. WHATSAPP NUMBER
   ================================================================ */

function getWaNum() {
  return localStorage.getItem('dhannies_wa') || '+2349138072441';
}

// ADD THIS NEW FUNCTION (find saveWaNumber() and replace it)
async function saveWaNumber() {
    const waInput = document.getElementById('wa-number-input');
    const waNum = waInput.value.trim();
    
    if (!waNum) {
        showToast('Please enter a valid WhatsApp number');
        return;
    }
    
    try {
        // Save to localStorage (fallback)
        localStorage.setItem('wa_number', waNum);
        
        // IMPORTANT: Save to Supabase
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('config')  // Create this table in Supabase
                .upsert(
                    { key: 'wa_number', value: waNum },
                    { onConflict: 'key' }
                );
            
            if (error) {
                console.error('Supabase save error:', error);
                showToast('Saved locally only. Check Supabase connection.');
            } else {
                showToast('✓ WhatsApp number saved to database!');
            }
        } else {
            showToast('Database not connected. Saved locally only.');
        }
        
        waInput.value = '';
    } catch (err) {
        console.error('Save error:', err);
        showToast('❌ Error saving number');
    }
}

// ADD THIS FUNCTION to load from Supabase on page load
async function loadWaNumber() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('config')
                .select('value')
                .eq('key', 'wa_number')
                .single();
            
            if (data?.value) {
                localStorage.setItem('wa_number', data.value);
                return data.value;
            }
        } catch (err) {
            console.log('Loading from Supabase...');
        }
    }
    
    // Fallback to localStorage
    return localStorage.getItem('wa_number') || '';
}

// CALL THIS on admin dashboard load
async function initAdminDashboard() {
    // ...existing code...
    const waNum = await loadWaNumber();
    if (waNum) {
        document.getElementById('wa-number-input').value = waNum;
    }
}

function updateWaLinks() {
  const num  = getWaNum().replace(/\D/g, '');
  const msg  = 'Hello! I would like to order from Dhannies Fragrance.';
  const link = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  ['hero-wa-btn', 'contact-wa-btn', 'footer-wa-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = link;
  });
}

/* ================================================================
   6. WISHLIST
   ================================================================ */

function getWishlist()   { return JSON.parse(localStorage.getItem('dhannies_wishlist') || '[]'); }
function saveWishlist(w) { localStorage.setItem('dhannies_wishlist', JSON.stringify(w)); }

function toggleWishlist(id) {
  let w = getWishlist();
  if (w.includes(id)) {
    w = w.filter(x => x !== id);
    showToast('Removed from wishlist');
  } else {
    w.push(id);
    showToast('Added to wishlist ♥');
  }
  saveWishlist(w);
  renderAll();
  renderWishlist();
}

/* ================================================================
   7. FILTERS
   ================================================================ */

let filters = { gender: 'all', scent: 'all', minPrice: 0, search: '' };

function getFiltered() {
  return products.filter(p => {
    if (filters.gender !== 'all' && p.gender !== filters.gender) return false;
    if (filters.scent  !== 'all' && p.scent  !== filters.scent)  return false;
    if (p.price < filters.minPrice) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

function updatePrice(v) {
  filters.minPrice = parseInt(v);
  const el = document.getElementById('price-disp');
  if (el) el.textContent = `₦${parseInt(v).toLocaleString()}+`;
  renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-f]').forEach(btn =>
    btn.addEventListener('click', function () {
      document.querySelectorAll(`[data-f="${this.dataset.f}"]`).forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filters[this.dataset.f] = this.dataset.v;
      renderAll();
    })
  );
});

/* ================================================================
   8. SEARCH + AUTOCOMPLETE
   ================================================================ */

function handleSearch(v) {
  filters.search = v;
  const ac = document.getElementById('ac-list');
  if (!v.trim()) {
    if (ac) ac.classList.add('hidden');
    renderAll();
    return;
  }
  const hits = products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())).slice(0, 5);
  if (!ac) { renderAll(); return; }
  if (!hits.length) {
    ac.classList.add('hidden');
  } else {
    ac.classList.remove('hidden');
    ac.innerHTML = hits.map(p => `<li onclick="selectSearch('${p.id}')">${p.name}</li>`).join('');
  }
  renderAll();
}

function selectSearch(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const si = document.getElementById('search-input');
  const ac = document.getElementById('ac-list');
  if (si) si.value = p.name;
  filters.search = p.name;
  if (ac) ac.classList.add('hidden');
  renderAll();
  openQV(id);
}

document.addEventListener('click', e => {
  const wrap = document.getElementById('search-wrap');
  const ac   = document.getElementById('ac-list');
  if (wrap && ac && !wrap.contains(e.target)) ac.classList.add('hidden');
});

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice search not supported in this browser'); return; }
  const r = new SR();
  r.lang = 'en-US';
  r.start();
  showToast('🎤 Listening...');
  r.onresult = e => {
    const t = e.results[0][0].transcript;
    const si = document.getElementById('search-input');
    if (si) si.value = t;
    handleSearch(t);
  };
  r.onerror = () => showToast('Voice error — try typing instead');
}

/* ================================================================
   9. RENDER PRODUCT GRIDS
   ================================================================ */

function imgSrc(p) {
  return p.image_url || '';
}

function renderGrid(containerId, skeletonId) {
  const container = document.getElementById(containerId);
  const skeleton  = document.getElementById(skeletonId);
  if (!container) return;
  if (skeleton) skeleton.style.display = 'none';

  const list = getFiltered();
  const wl   = getWishlist();

  if (!list.length) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--gray-mid);padding:60px 0;font-size:.9rem">No fragrances match your filters.</p>';
    return;
  }

  container.innerHTML = list.map(p => {
    const isSold = p.sold || p.stock === 0;
    const inWl   = wl.includes(p.id);
    const src    = imgSrc(p);

    return `
    <div class="product-card" onclick="openQV('${p.id}')">
      <div class="card-img">
        ${src
          ? `<img src="${src}" alt="${p.name}" loading="lazy">`
          : `<div class="card-placeholder">✦</div>`}
        <div class="card-badges">
          ${p.bestseller && !isSold ? '<span class="badge badge-bestseller">BESTSELLER</span>' : ''}
          ${isSold                  ? '<span class="badge badge-sold">SOLD OUT</span>'         : ''}
          ${p.eco && !isSold        ? '<span class="badge badge-eco">ECO</span>'               : ''}
        </div>
        <button class="card-wish ${inWl ? 'active' : ''}"
                onclick="event.stopPropagation();toggleWishlist('${p.id}')"
                title="${inWl ? 'Remove from wishlist' : 'Save to wishlist'}">
          <i class="${inWl ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <div class="card-qv">Quick View</div>
      </div>
      <div class="card-body">
        <h3 class="card-name">${p.name}</h3>
        <p class="card-cat">${p.gender} · ${p.scent}</p>
        <div class="card-footer">
          <span class="card-price">₦${p.price.toLocaleString()}</span>
          ${!isSold
            ? `<button class="btn-wa-sm" onclick="event.stopPropagation();startWaOrder('${p.id}')">
                 <i class="fab fa-whatsapp"></i> Order
               </button>`
            : '<span style="font-size:.7rem;color:var(--gray-mid)">Unavailable</span>'}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderAll() {
  renderGrid('home-grid', 'home-skeleton');
  renderGrid('shop-grid', 'shop-skeleton');
}

/* ================================================================
   10. QUICK VIEW MODAL
   ================================================================ */

let currentProduct = null;
let selectedSize   = null;

function openQV(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  selectedSize   = p.sizes ? p.sizes[0] : '50ml';

  document.getElementById('m-name').textContent  = p.name;
  document.getElementById('m-price').textContent = `₦${p.price.toLocaleString()}`;
  document.getElementById('m-vibe').textContent  = `"${p.vibe || 'A signature scent for the bold'}"`;

  const imgEl = document.getElementById('m-img');
  const ph    = document.getElementById('m-placeholder');
  const src   = imgSrc(p);
  if (src) {
    imgEl.src = src; imgEl.style.display = 'block';
    if (ph) ph.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    if (ph) { ph.style.display = 'flex'; ph.textContent = '✦'; }
  }

  const chip = n => `<span class="note-chip">${n}</span>`;
  document.getElementById('m-top').innerHTML   = (p.topNotes   || []).map(chip).join('');
  document.getElementById('m-heart').innerHTML = (p.heartNotes || []).map(chip).join('');
  document.getElementById('m-base').innerHTML  = (p.baseNotes  || []).map(chip).join('');

  document.getElementById('m-sizes').innerHTML = (p.sizes || ['50ml']).map(s =>
    `<button class="size-btn ${s === selectedSize ? 'sel' : ''}" onclick="selectSize('${s}',this)">${s}</button>`
  ).join('');

  const isSold = p.sold || p.stock === 0;
  document.getElementById('m-actions').innerHTML = isSold
    ? `<p style="color:var(--gray-mid);font-size:.88rem">Sold out — join waitlist on WhatsApp</p>`
    : `<button class="btn-wa" onclick="startWaOrder('${p.id}')"><i class="fab fa-whatsapp"></i> Order on WhatsApp</button>
       <button class="btn-outline" onclick="toggleWishlist('${p.id}');closeQV()"><i class="far fa-heart"></i> Save</button>`;

  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('main-overlay').classList.add('active');
}

function selectSize(s, btn) {
  selectedSize = s;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function closeQV() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('main-overlay').classList.remove('active');
  currentProduct = null;
}

/* ================================================================
   11. WHATSAPP ORDER FLOW
   ================================================================ */

function buildProductUrl(productId) {
  return `${window.location.href.split('?')[0]}?view=${productId}`;
}

function startWaOrder(productId) {
  const p    = products.find(x => x.id === productId);
  if (!p) return;
  const size = selectedSize || (p.sizes ? p.sizes[0] : '50ml');
  const url  = buildProductUrl(productId);

  const msg = `Hello Dhannies! 👋\n\nI'd like to order:\n\n*${p.name}*\nSize: ${size}\nPrice: ₦${p.price.toLocaleString()}\n\n🔗 Product Link: ${url}\n\nPlease help me complete my order. Thank you!`;
  const waLink = `https://wa.me/${getWaNum().replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

  // Populate confirm modal
  const preview = document.getElementById('wa-preview');
  if (preview) {
    preview.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
      <div style="font-size:.78rem;color:var(--gray-mid);margin-bottom:6px">${size} · ${p.scent} · ${p.gender}</div>
      <div style="font-size:1rem;font-weight:600;color:var(--gold)">₦${p.price.toLocaleString()}</div>`;
  }
  const confirmBtn = document.getElementById('wa-confirm-btn');
  if (confirmBtn) confirmBtn.href = waLink;

  document.getElementById('wa-overlay').classList.add('active');
  closeQV();
}

function closeWaModal() {
  const el = document.getElementById('wa-overlay');
  if (el) el.classList.remove('active');
}

/** Deep-link: ?view=<id> → auto-open that product on page load */
function checkUrlParams() {
  const id = new URLSearchParams(window.location.search).get('view');
  if (id) {
    const p = products.find(x => x.id === id);
    if (p) setTimeout(() => { showPage('home'); openQV(id); }, 700);
  }
}

/* ================================================================
   12. WISHLIST DRAWER
   ================================================================ */

function renderWishlist() {
  const wl        = getWishlist();
  const items     = products.filter(p => wl.includes(p.id));
  const container = document.getElementById('wish-body');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:50px 20px">
        <i class="far fa-heart" style="font-size:3rem;opacity:.2"></i>
        <p style="margin-top:15px;color:var(--gray-mid);font-size:.88rem">
          No saved items yet.<br>Tap the ♥ on any product to save it.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = items.map(p => {
    const src = imgSrc(p);
    return `
    <div class="wish-item">
      <div class="wish-item-img">
        ${src
          ? `<img src="${src}" alt="${p.name}">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;color:rgba(255,255,255,.1)">✦</div>`}
      </div>
      <div style="flex:1">
        <h4 style="font-weight:600;margin-bottom:4px;font-size:.92rem">${p.name}</h4>
        <p class="card-price" style="margin-bottom:8px">₦${p.price.toLocaleString()}</p>
        <button class="btn-wa-sm" onclick="startWaOrder('${p.id}')">
          <i class="fab fa-whatsapp"></i> Order
        </button>
      </div>
      <button class="icon-btn" onclick="toggleWishlist('${p.id}')" style="margin-left:auto;flex-shrink:0" title="Remove">
        <i class="fas fa-trash"></i>
      </button>
    </div>`;
  }).join('');
}

function openWishDrawer() {
  document.getElementById('wish-drawer').classList.add('open');
  document.getElementById('main-overlay').classList.add('active');
  renderWishlist();
}

function closeWishDrawer() {
  document.getElementById('wish-drawer').classList.remove('open');
  document.getElementById('main-overlay').classList.remove('active');
}

function closeAll() {
  closeQV();
  closeWishDrawer();
  closeWaModal();
}

/* ================================================================
   13. ADMIN AUTH
   ================================================================ */

const ADMIN_USER = 'dhannie';
const ADMIN_PASS = 'dhannie123';
let loggedIn = false;

function adminLogin() {
  const e    = document.getElementById('a-email').value.trim();
  const p    = document.getElementById('a-pass').value;
  const errEl = document.getElementById('login-error');

  if (e === ADMIN_USER && p === ADMIN_PASS) {
    loggedIn = true;
    if (errEl) errEl.classList.add('hidden');
    document.getElementById('admin-login').style.display     = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    const waInput = document.getElementById('wa-number-input');
    if (waInput) waInput.value = getWaNum();
    fetchProducts();
  } else {
    if (errEl) errEl.classList.remove('hidden');
    showToast('Invalid credentials');
  }
}

function adminLogout() {
  loggedIn = false;
  document.getElementById('admin-login').style.display     = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
  showPage('home');
}

/* ================================================================
   14. ADMIN STATS & TABLE
   ================================================================ */

function renderAdminStats() {
  const total = products.length;
  const sold  = products.filter(p => p.sold || p.stock === 0).length;
  const eco   = products.filter(p => p.eco).length;
  const el    = document.getElementById('admin-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><span class="stat-val">${total}</span><div>Total</div></div>
    <div class="stat-card"><span class="stat-val" style="color:#25D366">${total - sold}</span><div>In Stock</div></div>
    <div class="stat-card"><span class="stat-val" style="color:#e74c3c">${sold}</span><div>Sold Out</div></div>
    <div class="stat-card"><span class="stat-val">${eco}</span><div>Eco</div></div>`;
}

function renderAdminTable() {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = products.map(p => {
    const src        = imgSrc(p);
    const hasStorage = !!p.image_storage_path;
    return `
    <tr>
      <td>
        <div style="width:44px;height:44px;background:var(--dark-gray);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:rgba(255,255,255,.15)">
          ${src ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : '✦'}
        </div>
      </td>
      <td style="font-weight:500">${p.name}</td>
      <td>₦${p.price.toLocaleString()}</td>
      <td>${p.stock}</td>
      <td>
        ${hasStorage
          ? '<span style="color:#25D366;font-size:.72rem"><i class="fas fa-cloud"></i> Supabase</span>'
          : '<span style="color:var(--gray-mid);font-size:.72rem"><i class="fas fa-hdd"></i> Local</span>'}
      </td>
      <td>
        <button class="btn-e" onclick="openForm('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-d" onclick="confirmDelete('${p.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function confirmDelete(id) {
  const p = products.find(x => x.id === id);
  if (confirm(`Delete "${p ? p.name : 'this product'}"?\nThis cannot be undone.`)) {
    removeProduct(id);
  }
}

/* ================================================================
   15. ADMIN PRODUCT FORM (Add / Edit)
   ================================================================ */

let editingId = null;

function openForm(id = null) {
  editingId           = id;
  uploadedImageUrl    = '';
  uploadedStoragePath = '';

  // Remove any existing form modal
  document.getElementById('admin-form-overlay')?.remove();

  const p    = id ? products.find(x => x.id === id) : null;
  const modal = document.createElement('div');
  modal.id = 'admin-form-overlay';
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';

  modal.innerHTML = `
    <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto">

      <!-- Header -->
      <div style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--black);z-index:1">
        <h3 style="font-weight:600">${id ? 'Edit' : 'Add'} Product</h3>
        <button class="icon-btn" onclick="document.getElementById('admin-form-overlay').remove()"><i class="fas fa-times"></i></button>
      </div>

      <div style="padding:24px">

        <!-- Image upload -->
        <p style="font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-mid);margin-bottom:8px">Product Image</p>
        <div class="img-upload-area" id="upload-area">
          <input type="file" id="f-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(this)">
          <img id="img-preview" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;display:none;margin-bottom:10px">
          <div id="upload-hint" style="text-align:center;padding:10px 0">
            <i class="fas fa-cloud-upload-alt" style="font-size:2rem;color:var(--gold);display:block;margin-bottom:8px"></i>
            <p style="font-size:.82rem;color:var(--gray-light)">
              ${supabaseClient
                ? '<i class="fas fa-database" style="color:#25D366"></i> Uploads to <strong>Supabase Storage</strong>'
                : '<i class="fas fa-hdd" style="color:var(--gray-mid)"></i> Stored <strong>locally</strong>'}
            </p>
            <p style="font-size:.7rem;color:var(--gray-mid);margin-top:4px">Max 10MB · JPG, PNG, WEBP</p>
          </div>
          <div id="upload-actions" style="display:none;text-align:center;margin-top:8px">
            <button class="btn-outline" style="padding:6px 16px;font-size:.75rem" onclick="event.stopPropagation();removeUploadedImage()">
              <i class="fas fa-trash"></i> Remove Image
            </button>
          </div>
          <!-- Invisible clickable layer -->
          <div onclick="document.getElementById('f-img-file').click()" style="position:absolute;inset:0;cursor:pointer;border-radius:12px"></div>
        </div>

        <!-- Fields -->
        <div style="margin-top:18px;display:flex;flex-direction:column;gap:12px">
          <div>
            <label class="form-label">Product Name *</label>
            <input id="f-name" placeholder="e.g. Midnight Oud" value="${p?.name || ''}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label class="form-label">Price (₦) *</label>
              <input id="f-price" type="number" min="0" placeholder="25000" value="${p?.price || ''}">
            </div>
            <div>
              <label class="form-label">Stock Qty *</label>
              <input id="f-stock" type="number" min="0" placeholder="10" value="${p?.stock ?? ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label class="form-label">Gender</label>
              <select id="f-gender">
                <option value="men"    ${p?.gender==='men'    ?'selected':''}>Men</option>
                <option value="women"  ${p?.gender==='women'  ?'selected':''}>Women</option>
                <option value="unisex" ${p?.gender==='unisex' ?'selected':''}>Unisex</option>
              </select>
            </div>
            <div>
              <label class="form-label">Scent Family</label>
              <select id="f-scent">
                <option value="floral"   ${p?.scent==='floral'   ?'selected':''}>Floral</option>
                <option value="woody"    ${p?.scent==='woody'    ?'selected':''}>Woody</option>
                <option value="fresh"    ${p?.scent==='fresh'    ?'selected':''}>Fresh</option>
                <option value="oriental" ${p?.scent==='oriental' ?'selected':''}>Oriental</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label">Vibe Description</label>
            <input id="f-vibe" placeholder="e.g. Dark, smoldering power for a bold night" value="${p?.vibe || ''}">
          </div>
          <div>
            <label class="form-label">Top Notes (comma separated)</label>
            <input id="f-top" placeholder="Bergamot, Black Pepper" value="${(p?.topNotes || []).join(', ')}">
          </div>
          <div>
            <label class="form-label">Heart Notes</label>
            <input id="f-heart" placeholder="Rose, Oud Wood" value="${(p?.heartNotes || []).join(', ')}">
          </div>
          <div>
            <label class="form-label">Base Notes</label>
            <input id="f-base" placeholder="Amber, Musk, Sandalwood" value="${(p?.baseNotes || []).join(', ')}">
          </div>
          <div>
            <label class="form-label">Sizes (comma separated)</label>
            <input id="f-sizes" placeholder="30ml, 50ml, 100ml" value="${(p?.sizes || ['30ml','50ml','100ml']).join(', ')}">
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:4px">
            <label class="toggle-label"><input type="checkbox" id="f-sold"       ${p?.sold       ?'checked':''}> Sold Out</label>
            <label class="toggle-label"><input type="checkbox" id="f-eco"        ${p?.eco        ?'checked':''}> Eco Friendly 🌿</label>
            <label class="toggle-label"><input type="checkbox" id="f-bestseller" ${p?.bestseller ?'checked':''}> Bestseller ⭐</label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px 24px;display:flex;gap:12px">
        <button class="btn-outline" onclick="document.getElementById('admin-form-overlay').remove()" style="flex:1">Cancel</button>
        <button class="btn-primary" onclick="saveProductForm()" style="flex:1">Save Product</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Pre-fill image if editing
  if (p && p.image_url) {
    uploadedImageUrl    = p.image_url;
    uploadedStoragePath = p.image_storage_path || '';
    const prev    = document.getElementById('img-preview');
    const hint    = document.getElementById('upload-hint');
    const actions = document.getElementById('upload-actions');
    if (prev)    { prev.src = p.image_url; prev.style.display = 'block'; }
    if (hint)    hint.style.display    = 'none';
    if (actions) actions.style.display = 'block';
  }
}

async function saveProductForm() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('Product name is required'); return; }

  const split  = s => s.split(',').map(x => x.trim()).filter(Boolean);
  const stock  = parseInt(document.getElementById('f-stock').value) || 0;
  const isSold = document.getElementById('f-sold').checked || stock === 0;

  const productData = {
    id:                 editingId || ('p' + Date.now()),
    name,
    price:              parseInt(document.getElementById('f-price').value) || 0,
    stock,
    gender:             document.getElementById('f-gender').value,
    scent:              document.getElementById('f-scent').value,
    vibe:               document.getElementById('f-vibe').value.trim(),
    sizes:              split(document.getElementById('f-sizes').value).length
                          ? split(document.getElementById('f-sizes').value)
                          : ['30ml', '50ml', '100ml'],
    sold:               isSold,
    eco:                document.getElementById('f-eco').checked,
    bestseller:         document.getElementById('f-bestseller').checked,
    topNotes:           split(document.getElementById('f-top').value),
    heartNotes:         split(document.getElementById('f-heart').value),
    baseNotes:          split(document.getElementById('f-base').value),
    image_url:          uploadedImageUrl,
    image_storage_path: uploadedStoragePath,
    createdAt:          editingId
                          ? (products.find(x => x.id === editingId)?.createdAt || Date.now())
                          : Date.now(),
  };

  document.getElementById('admin-form-overlay')?.remove();

  await persistProduct(productData);
  renderAdminStats();
  renderAdminTable();
  renderAll();
}

/* ================================================================
   16. QUIZ
   ================================================================ */

let quizState = {};

// Quiz listeners are attached after DOM is ready (see DOMContentLoaded below)
function initQuiz() {
  document.querySelectorAll('[data-q1]').forEach(b =>
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-q1]').forEach(x => x.classList.remove('sel'));
      this.classList.add('sel');
      quizState.q1 = this.dataset.q1;
      document.getElementById('quiz-s1').style.display = 'none';
      document.getElementById('quiz-s2').style.display = 'block';
    })
  );

  document.querySelectorAll('[data-q2]').forEach(b =>
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-q2]').forEach(x => x.classList.remove('sel'));
      this.classList.add('sel');

      let match = products.find(p => {
        if (quizState.q1 === 'confident' || quizState.q1 === 'mysterious')
          return p.scent === 'woody' || p.scent === 'oriental';
        if (quizState.q1 === 'romantic') return p.scent === 'floral';
        return p.scent === 'fresh';
      }) || products[0];

      if (!match) return;

      const resultEl = document.getElementById('quiz-result');
      resultEl.innerHTML = `
        <h3>${match.name}</h3>
        <p>${match.vibe || 'A signature scent crafted for you'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
          <button class="btn-primary" onclick="openQV('${match.id}')">Explore</button>
          <button class="btn-wa" onclick="startWaOrder('${match.id}')">
            <i class="fab fa-whatsapp"></i> Order Now
          </button>
        </div>`;
      resultEl.classList.add('show');
      const resetBtn = document.getElementById('quiz-reset');
      if (resetBtn) resetBtn.style.display = 'inline-block';
    })
  );
}

function resetQuiz() {
  quizState = {};
  document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('sel'));
  const s1 = document.getElementById('quiz-s1');
  const s2 = document.getElementById('quiz-s2');
  const r  = document.getElementById('quiz-result');
  const rb = document.getElementById('quiz-reset');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
  if (r)  r.classList.remove('show');
  if (rb) rb.style.display = 'none';
}

/* ================================================================
   17. PAGE NAVIGATION
   ================================================================ */

const ALL_PAGES = ['home', 'shop', 'about', 'contact', 'admin'];

function showPage(page) {
  ALL_PAGES.forEach(p => {
    const section = document.getElementById(`${p}-section`);
    if (section) section.classList.toggle('active', p === page);
    const btn = document.getElementById(`nav-${p}`);
    if (btn) btn.classList.toggle('active', p === page);
  });

  if (page === 'admin') {
    if (!loggedIn) {
      document.getElementById('admin-login').style.display     = 'flex';
      document.getElementById('admin-dashboard').style.display = 'none';
    } else {
      document.getElementById('admin-login').style.display     = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      initAdminDashboard();  // ← ADD THIS LINE
      renderAdminStats();
      renderAdminTable();
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   18. MOBILE MENU
   ================================================================ */

function toggleMobileMenu() {
  document.getElementById('mobile-nav')?.classList.toggle('active');
}
function closeMobileMenu() {
  document.getElementById('mobile-nav')?.classList.remove('active');
}

/* ================================================================
   19. TOAST
   ================================================================ */

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ================================================================
   20. SYNC SPINNER
   ================================================================ */

function showSyncSpinner(show) {
  const el = document.getElementById('sync-spinner');
  if (el) el.style.display = show ? 'inline' : 'none';
}

/* ================================================================
   21. LOADER
   ================================================================ */

function animateLoader() {
  const fill = document.getElementById('loader-fill');
  const text = document.getElementById('loader-text');
  if (!fill) return;
  const steps = [
    { pct: 25,  msg: 'Connecting to database...' },
    { pct: 55,  msg: 'Loading fragrances...' },
    { pct: 80,  msg: 'Almost ready...' },
    { pct: 100, msg: "Welcome to Dhannie's ✦" },
  ];
  let i = 0;
  const next = () => {
    if (i >= steps.length) return;
    fill.style.width = steps[i].pct + '%';
    if (text) text.textContent = steps[i].msg;
    i++;
    if (i < steps.length) setTimeout(next, 480);
  };
  next();
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.style.opacity    = '0';
  loader.style.transition = 'opacity .5s ease';
  setTimeout(() => { loader.style.display = 'none'; }, 500);
}

/* ================================================================
   22. INIT — runs when page loads
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Animate loading bar
  animateLoader();

  // Connect Supabase (hardcoded credentials)
  initSupabase();

  // Update all WhatsApp links
  updateWaLinks();

  // Attach filter chip listeners
  document.querySelectorAll('[data-f]').forEach(btn =>
    btn.addEventListener('click', function () {
      document.querySelectorAll(`[data-f="${this.dataset.f}"]`).forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filters[this.dataset.f] = this.dataset.v;
      renderAll();
    })
  );

  // Attach quiz listeners
  initQuiz();

  // Fetch + render products
  await fetchProducts();

  // Check for deep-link ?view=<id>
  checkUrlParams();

  // Hide loader
  setTimeout(hideLoader, 1900);
});
