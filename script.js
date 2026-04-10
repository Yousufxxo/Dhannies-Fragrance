// PRODUCT DATA
const DEMO_PRODUCTS = [
    {id:'p1',name:'Midnight Oud',price:55000,gender:'men',scent:'woody',stock:0,sold:true,eco:false,bestseller:true,image:'',vibe:'Dark, smoldering power',topNotes:['Black Pepper','Cardamom'],heartNotes:['Oud Wood','Rose'],baseNotes:['Amber','Musk'],sizes:['30ml','50ml','100ml'],createdAt:1700000000000},
    {id:'p2',name:'Rose Éclat',price:38000,gender:'women',scent:'floral',stock:25,sold:false,eco:true,bestseller:true,image:'',vibe:'Soft morning light',topNotes:['Pink Pepper','Citrus'],heartNotes:['Damask Rose','Jasmine'],baseNotes:['White Musk','Sandalwood'],sizes:['30ml','50ml'],createdAt:1690000000000},
    // ... rest of products
];
let products = [];
function loadProducts() {
  const s = localStorage.getItem("dhannies_products");
  if (s) {
    products = JSON.parse(s);
  } else {
    products = DEMO_PRODUCTS;
    saveProducts();
  }
}
function saveProducts() {
  localStorage.setItem("dhannies_products", JSON.stringify(products));
}
loadProducts();

function getWaNum() {
  return localStorage.getItem("dhannies_wa") || "+2348012345678";
}
function saveWaNumber() {
  const num = document.getElementById("wa-number-input").value;
  localStorage.setItem("dhannies_wa", num);
  updateWaLinks();
  showToast("WhatsApp number saved");
}
function updateWaLinks() {
  const msg = "Hello! I would like to order from Dhannies Fragrance.";
  const link = `https://wa.me/${getWaNum().replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  ["hero-wa-btn", "contact-wa-btn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = link;
  });
}

function getWishlist() {
  return JSON.parse(localStorage.getItem("dhannies_wishlist") || "[]");
}
function saveWishlist(w) {
  localStorage.setItem("dhannies_wishlist", JSON.stringify(w));
}
function toggleWishlist(id) {
  let w = getWishlist();
  if (w.includes(id)) {
    w = w.filter((x) => x !== id);
    showToast("Removed from wishlist");
  } else {
    w.push(id);
    showToast("Added to wishlist");
  }
  saveWishlist(w);
  renderAll();
  renderWishlist();
}

let filters = { gender: 'all', scent: 'all', minPrice: 0, search: '' };
function getFiltered() { 
    return products.filter(p => { 
        if(filters.gender!=='all' && p.gender!==filters.gender) return false; 
        if(filters.scent!=='all' && p.scent!==filters.scent) return false; 
        if(p.price < filters.minPrice) return false;  // Changed: now filters minimum price
        if(filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false; 
        return true; 
    }); 
}

function renderGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const list = getFiltered();
  const wl = getWishlist();
  container.innerHTML = list
    .map((p) => {
      const isSold = p.sold || p.stock === 0;
      const inWl = wl.includes(p.id);
      return `<div class="product-card" onclick="openQV('${p.id}')"><div class="card-img">${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);display:flex;align-items:center;justify-content:center;font-size:2rem">✦</div>`}<div class="card-badges">${p.bestseller && !isSold ? '<span class="badge badge-bestseller">BESTSELLER</span>' : ""}${isSold ? '<span class="badge badge-sold">SOLD OUT</span>' : ""}${p.eco && !isSold ? '<span class="badge badge-eco">ECO</span>' : ""}</div><button class="card-wish ${inWl ? "active" : ""}" onclick="event.stopPropagation();toggleWishlist('${p.id}')"><i class="${inWl ? "fas" : "far"} fa-heart"></i></button><div class="card-qv">Quick View</div></div><div class="card-body"><h3 class="card-name">${p.name}</h3><p class="card-cat">${p.gender} · ${p.scent}</p><div class="card-footer"><span class="card-price">₦${p.price.toLocaleString()}</span>${!isSold ? `<button class="btn-wa-sm" onclick="event.stopPropagation();startWaOrder('${p.id}')"><i class="fab fa-whatsapp"></i> Order</button>` : '<span style="font-size:0.7rem;color:var(--gray-mid)">Unavailable</span>'}</div></div></div>`;
    })
    .join("");
}
function renderAll() {
  renderGrid("home-grid");
  renderGrid("shop-grid");
  renderWishlist();
}

function handleSearch(v) {
  filters.search = v;
  const ac = document.getElementById("ac-list");
  if (!v.trim()) {
    ac.classList.add("hidden");
    renderAll();
    return;
  }
  const hits = products
    .filter((p) => p.name.toLowerCase().includes(v.toLowerCase()))
    .slice(0, 5);
  if (!hits.length) ac.classList.add("hidden");
  else {
    ac.classList.remove("hidden");
    ac.innerHTML = hits
      .map((p) => `<li onclick="selectSearch('${p.id}')">${p.name}</li>`)
      .join("");
  }
  renderAll();
}
function selectSearch(id) {
  const p = products.find((x) => x.id === id);
  if (p) {
    document.getElementById("search-input").value = p.name;
    filters.search = p.name;
    document.getElementById("ac-list").classList.add("hidden");
    renderAll();
    openQV(id);
  }
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast("Voice search not supported");
    return;
  }
  const r = new SR();
  r.lang = "en-US";
  r.start();
  showToast("Listening...");
  r.onresult = (e) => {
    const t = e.results[0][0].transcript;
    document.getElementById("search-input").value = t;
    handleSearch(t);
  };
}

let currentProduct = null,
  selectedSize = null;
function openQV(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  currentProduct = p;
  selectedSize = p.sizes ? p.sizes[0] : "50ml";
  document.getElementById("m-name").innerHTML = p.name;
  document.getElementById("m-price").innerHTML = `₦${p.price.toLocaleString()}`;
  document.getElementById("m-vibe").innerHTML =
    `"${p.vibe || "A signature scent for the bold"}"`;
  const imgEl = document.getElementById("m-img"),
    placeholder = document.getElementById("m-placeholder");
  if (p.image) {
    imgEl.src = p.image;
    imgEl.style.display = "block";
    placeholder.style.display = "none";
  } else {
    imgEl.style.display = "none";
    placeholder.style.display = "flex";
    placeholder.innerHTML = "✦";
  }
  document.getElementById("m-top").innerHTML = (p.topNotes || [])
    .map((n) => `<span class="note-chip">${n}</span>`)
    .join("");
  document.getElementById("m-heart").innerHTML = (p.heartNotes || [])
    .map((n) => `<span class="note-chip">${n}</span>`)
    .join("");
  document.getElementById("m-base").innerHTML = (p.baseNotes || [])
    .map((n) => `<span class="note-chip">${n}</span>`)
    .join("");
  document.getElementById("m-sizes").innerHTML = (p.sizes || ["50ml"])
    .map(
      (s) =>
        `<button class="size-btn ${s === selectedSize ? "sel" : ""}" onclick="selectSize('${s}',this)">${s}</button>`,
    )
    .join("");
  const isSold = p.sold || p.stock === 0;
  document.getElementById("m-actions").innerHTML = isSold
    ? '<p style="color:var(--gray-mid)">Sold out — join waitlist on WhatsApp</p>'
    : `<button class="btn-wa" onclick="startWaOrder('${p.id}')"><i class="fab fa-whatsapp"></i> Order on WhatsApp</button><button class="btn-outline" onclick="toggleWishlist('${p.id}');closeQV()"><i class="far fa-heart"></i> Save</button>`;
  document.getElementById("modal-overlay").classList.add("active");
  document.getElementById("main-overlay").classList.add("active");
}
function selectSize(s, btn) {
  selectedSize = s;
  document
    .querySelectorAll(".size-btn")
    .forEach((b) => b.classList.remove("sel"));
  btn.classList.add("sel");
}
function closeQV() {
  document.getElementById("modal-overlay").classList.remove("active");
  document.getElementById("main-overlay").classList.remove("active");
  currentProduct = null;
}

function startWaOrder(productId) {
  const p = products.find((x) => x.id === productId);
  if (!p) return;
  const size = selectedSize || (p.sizes ? p.sizes[0] : "50ml");
  const msg = `Hello Dhannies! I'd like to order:\n\n*${p.name}*\nSize: ${size}\nPrice: ₦${p.price.toLocaleString()}\n\nPlease help me complete my order.`;
  const url = `https://wa.me/${getWaNum().replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
  showToast("Redirecting to WhatsApp...");
}

let loggedIn = false,
  editingId = null,
  uploadedImage = "";
function adminLogin() {
  const e = document.getElementById("a-email").value,
    p = document.getElementById("a-pass").value;
  if (e === "dhannie" && p === "dhannie123") {
    loggedIn = true;
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";
    renderAdminStats();
    renderAdminTable();
    document.getElementById("wa-number-input").value = getWaNum();
  } else {
    showToast("Invalid credentials");
  }
}
function adminLogout() {
  loggedIn = false;
  document.getElementById("admin-login").style.display = "flex";
  document.getElementById("admin-dashboard").style.display = "none";
  showPage("home");
}
function renderAdminStats() {
  const total = products.length,
    sold = products.filter((p) => p.sold || p.stock === 0).length,
    eco = products.filter((p) => p.eco).length;
  document.getElementById("admin-stats").innerHTML =
    `<div class="stat-card"><div class="stat-val">${total}</div><div>Total Products</div></div><div class="stat-card"><div class="stat-val">${total - sold}</div><div>In Stock</div></div><div class="stat-card"><div class="stat-val">${sold}</div><div>Sold Out</div></div><div class="stat-card"><div class="stat-val">${eco}</div><div>Eco Friendly</div></div>`;
}
function renderAdminTable() {
  document.getElementById("admin-tbody").innerHTML = products
    .map(
      (p, i) =>
        `<tr><td><div style="width:40px;height:40px;background:var(--dark-gray);border-radius:8px;display:flex;align-items:center;justify-content:center">${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : "✦"}</div></td><td>${p.name}</td><td>₦${p.price.toLocaleString()}</td><td>${p.stock}</td><td><button class="btn-e" onclick="openForm('${p.id}')"><i class="fas fa-edit"></i></button><button class="btn-d" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button></td></tr>`,
    )
    .join("");
}
function openForm(id = null) {
  editingId = id;
  uploadedImage = "";
  document.getElementById("admin-form-overlay")?.remove();
  const modal = document.createElement("div");
  modal.id = "admin-form-overlay";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:20px";
  modal.innerHTML = `<div style="background:var(--black);border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto"><div style="padding:24px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between"><h3 style="font-weight:600">${id ? "Edit" : "Add"} Product</h3><button class="icon-btn" onclick="this.closest('#admin-form-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="padding:24px"><div class="img-upload-area" onclick="document.getElementById('f-img-file').click()"><input type="file" id="f-img-file" accept="image/*" style="display:none" onchange="handleImageUpload(this)"><img id="img-preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;display:none"><p><i class="fas fa-cloud-upload-alt"></i> Click to upload image</p></div><input id="f-name" placeholder="Product Name" style="width:100%;margin:12px 0;padding:12px"><input id="f-price" type="number" placeholder="Price (₦)" style="width:100%;margin:12px 0;padding:12px"><input id="f-stock" type="number" placeholder="Stock" style="width:100%;margin:12px 0;padding:12px"><select id="f-gender" style="width:100%;margin:12px 0;padding:12px"><option value="men">Men</option><option value="women">Women</option><option value="unisex">Unisex</option></select><select id="f-scent" style="width:100%;margin:12px 0;padding:12px"><option value="floral">Floral</option><option value="woody">Woody</option><option value="fresh">Fresh</option><option value="oriental">Oriental</option></select><input id="f-vibe" placeholder="Vibe description" style="width:100%;margin:12px 0;padding:12px"><input id="f-sizes" placeholder="Sizes (comma separated)" style="width:100%;margin:12px 0;padding:12px"><label style="display:flex;align-items:center;gap:12px;margin:12px 0"><input type="checkbox" id="f-sold"> <span>Sold Out</span></label><label style="display:flex;align-items:center;gap:12px;margin:12px 0"><input type="checkbox" id="f-eco"> <span>Eco Friendly</span></label><label style="display:flex;align-items:center;gap:12px;margin:12px 0"><input type="checkbox" id="f-bestseller"> <span>Bestseller</span></label></div><div style="padding:24px;display:flex;gap:12px"><button class="btn-outline" onclick="this.closest('#admin-form-overlay').remove()">Cancel</button><button class="btn-primary" onclick="saveProductForm()">Save Product</button></div></div>`;
  document.body.appendChild(modal);
  if (id) {
    const p = products.find((x) => x.id === id);
    if (p) {
      document.getElementById("f-name").value = p.name;
      document.getElementById("f-price").value = p.price;
      document.getElementById("f-stock").value = p.stock;
      document.getElementById("f-gender").value = p.gender;
      document.getElementById("f-scent").value = p.scent;
      document.getElementById("f-vibe").value = p.vibe || "";
      document.getElementById("f-sizes").value = (p.sizes || []).join(", ");
      document.getElementById("f-sold").checked = p.sold;
      document.getElementById("f-eco").checked = p.eco;
      document.getElementById("f-bestseller").checked = p.bestseller || false;
      if (p.image) {
        uploadedImage = p.image;
        const prev = document.getElementById("img-preview");
        prev.src = p.image;
        prev.style.display = "block";
      }
    }
  }
}
function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImage = e.target.result;
    const prev = document.getElementById("img-preview");
    prev.src = uploadedImage;
    prev.style.display = "block";
  };
  reader.readAsDataURL(file);
}
function saveProductForm() { 
    const data = { 
        id: editingId || 'p'+Date.now(), 
        name: document.getElementById('f-name').value, 
        price: parseInt(document.getElementById('f-price').value) || 0, 
        stock: parseInt(document.getElementById('f-stock').value) || 0, 
        gender: document.getElementById('f-gender').value, 
        scent: document.getElementById('f-scent').value, 
        vibe: document.getElementById('f-vibe').value, 
        sizes: document.getElementById('f-sizes').value.split(',').map(s=>s.trim()), 
        sold: document.getElementById('f-sold').checked, 
        eco: document.getElementById('f-eco').checked, 
        bestseller: document.getElementById('f-bestseller').checked, 
        image: uploadedImage, 
        topNotes: [], 
        heartNotes: [], 
        baseNotes: [],
        createdAt: Date.now()  // Add this line
    }; 
    if(editingId) { 
        const idx = products.findIndex(x=>x.id===editingId); 
        if(idx !== -1) products[idx] = {...products[idx], ...data}; 
    } else { 
        products.unshift(data);  // Change from push() to unshift() - adds to TOP
    } 
    saveProducts(); 
    renderAdminStats(); 
    renderAdminTable(); 
    renderAll(); 
    document.getElementById('admin-form-overlay')?.remove(); 
    showToast('Product saved'); 
}
function deleteProduct(id) {
  if (confirm("Delete this product?")) {
    products = products.filter((x) => x.id !== id);
    saveProducts();
    renderAdminStats();
    renderAdminTable();
    renderAll();
    showToast("Product deleted");
  }
}

function renderWishlist() {
  const wl = getWishlist();
  const items = products.filter((p) => wl.includes(p.id));
  const container = document.getElementById("wish-body");
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px"><i class="far fa-heart" style="font-size:3rem;opacity:0.3"></i><p style="margin-top:15px;color:var(--gray-mid)">No saved items yet.<br>Tap the heart on any product to save it.</p></div>';
    return;
  }
  container.innerHTML = items
    .map(
      (p) =>
        `<div class="wish-item"><div class="wish-item-img">${p.image ? `<img src="${p.image}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%">✦</div>`}</div><div><h4 style="font-weight:600">${p.name}</h4><p class="card-price">₦${p.price.toLocaleString()}</p><button class="btn-wa-sm" onclick="startWaOrder('${p.id}')"><i class="fab fa-whatsapp"></i> Order</button></div><button class="icon-btn" onclick="toggleWishlist('${p.id}')" style="margin-left:auto"><i class="fas fa-trash"></i></button></div>`,
    )
    .join("");
}
function openWishDrawer() {
  document.getElementById("wish-drawer").classList.add("open");
  document.getElementById("main-overlay").classList.add("active");
  renderWishlist();
}
function closeWishDrawer() {
  document.getElementById("wish-drawer").classList.remove("open");
  document.getElementById("main-overlay").classList.remove("active");
}
function closeAll() {
  closeQV();
  closeWishDrawer();
}

let quizState = {};
document.querySelectorAll("[data-q1]").forEach((b) =>
  b.addEventListener("click", function () {
    document
      .querySelectorAll("[data-q1]")
      .forEach((x) => x.classList.remove("sel"));
    this.classList.add("sel");
    quizState.q1 = this.dataset.q1;
    document.getElementById("quiz-s1").style.display = "none";
    document.getElementById("quiz-s2").style.display = "block";
  }),
);
document.querySelectorAll("[data-q2]").forEach((b) =>
  b.addEventListener("click", function () {
    document
      .querySelectorAll("[data-q2]")
      .forEach((x) => x.classList.remove("sel"));
    this.classList.add("sel");
    let match =
      products.find((p) => {
        if (quizState.q1 === "confident" || quizState.q1 === "mysterious")
          return p.scent === "woody" || p.scent === "oriental";
        if (quizState.q1 === "romantic") return p.scent === "floral";
        return p.scent === "fresh";
      }) || products[0];
    document.getElementById("quiz-result").innerHTML =
      `<h3>${match.name}</h3><p>${match.vibe || "A signature scent for you"}</p><button class="btn-primary" onclick="openQV('${match.id}')">Explore</button><button class="btn-wa" onclick="startWaOrder('${match.id}')" style="margin-left:12px"><i class="fab fa-whatsapp"></i> Order</button>`;
    document.getElementById("quiz-result").classList.add("show");
    document.getElementById("quiz-reset").style.display = "inline-block";
  }),
);
function resetQuiz() {
  quizState = {};
  document
    .querySelectorAll(".quiz-opt")
    .forEach((b) => b.classList.remove("sel"));
  document.getElementById("quiz-s1").style.display = "block";
  document.getElementById("quiz-s2").style.display = "none";
  document.getElementById("quiz-result").classList.remove("show");
  document.getElementById("quiz-reset").style.display = "none";
}

function showPage(page) {
  document
    .querySelectorAll(".page-section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(`${page}-section`).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "admin" && !loggedIn) {
    document.getElementById("admin-login").style.display = "flex";
    document.getElementById("admin-dashboard").style.display = "none";
  } else if (page === "admin" && loggedIn) {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";
    renderAdminStats();
    renderAdminTable();
  }
}
function updatePrice(v) { 
    filters.minPrice = parseInt(v); 
    document.getElementById('price-disp').innerText = `₦${parseInt(v).toLocaleString()}+`; 
    renderAll(); 
}
document.querySelectorAll("[data-f]").forEach((btn) =>
  btn.addEventListener("click", function () {
    const type = this.dataset.f;
    const val = this.dataset.v;
    document
      .querySelectorAll(`[data-f="${type}"]`)
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    filters[type] = val;
    renderAll();
  }),
);
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
function toggleMobileMenu() {
  document.getElementById("mobile-nav").classList.toggle("active");
}
function closeMobileMenu() {
  document.getElementById("mobile-nav").classList.remove("active");
}

updateWaLinks();
renderAll();
