/* FRONTEND script for Dr May Pharmacy - connected to backend API */

/* ========== CONFIG ========== */
const API_BASE = "http://localhost:8080"; // update after deployment

/* ========== Demo Products ========== */
const PRODUCTS = [
  { id:"med-001", name:"Paracetamol 500mg", price:3.5, category:"Medicines", rating:4.8, tags:["Pain Relief","Fever"], img:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop" },
  { id:"cos-001", name:"Hyaluronic Serum", price:12.9, category:"Cosmetics", rating:4.9, tags:["Hydration","Glow"], img:"https://images.unsplash.com/photo-1608248597279-d8e0c5a2d2b0?q=80&w=1200&auto=format&fit=crop" },
  { id:"cos-002", name:"SPF 50+ Sunscreen", price:9.5, category:"Cosmetics", rating:4.8, tags:["UV Protection"], img:"https://images.unsplash.com/photo-1608248596091-2e76aa87e311?q=80&w=1200&auto=format&fit=crop" },
  { id:"wel-001", name:"Omega-3 Fish Oil", price:14.5, category:"Wellness", rating:4.6, tags:["Heart","Brain"], img:"https://images.unsplash.com/photo-1595433562696-3d1a4a03a3ee?q=80&w=1200&auto=format&fit=crop" }
];

const DELIVERY_FEE = 2;

/* ======= DOM Elements ======= */
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");

const openCart = document.getElementById("openCart");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const checkoutBtn = document.getElementById("checkoutBtn");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckout = document.getElementById("closeCheckout");
const cancelCheckout = document.getElementById("cancelCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const paymentMethod = document.getElementById("paymentMethod");
const cardFields = document.getElementById("cardFields");
const summaryItems = document.getElementById("summaryItems");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryTotal = document.getElementById("summaryTotal");
const yearEl = document.getElementById("year");

const toast = document.getElementById("toast");
const backToTop = document.getElementById("backToTop");

/* ======= State ======= */
const CART_KEY = "drmay_cart_v1";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const money = n => `$${n.toFixed(2)}`;

function showToast(msg){
  if(!toast) return alert(msg);
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=> toast.classList.remove("show"), 1800);
}

/* ======= Products rendering ======= */
function productCard(p){
  const el = document.createElement("div");
  el.className = "card sr";
  el.innerHTML = `
    <div class="thumb"><img src="${p.img}" alt="${p.name}"><span class="badge">${p.category}</span></div>
    <div class="body">
      <h3>${p.name}</h3>
      <div class="meta"><span>⭐ ${p.rating.toFixed(1)}</span><strong>${money(p.price)}</strong></div>
      <div class="taglist">${p.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-outline" data-view="${p.id}">Details</button>
        <button class="btn btn-primary" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>`;
  el.querySelector(`[data-add="${p.id}"]`).addEventListener("click", ()=> { addToCart(p.id); showToast("Added to cart"); });
  el.querySelector(`[data-view="${p.id}"]`).addEventListener("click", ()=> quickView(p));
  return el;
}

function renderProducts(){
  if(!productGrid) return;
  const q = (searchInput?.value || "").toLowerCase().trim();
  const cat = categorySelect?.value || "All";
  const sort = sortSelect?.value || "featured";
  const maxPrice = parseFloat(priceRange?.value || 9999);

  let list = PRODUCTS.filter(p =>
    (cat === "All" || p.category === cat) &&
    p.price <= maxPrice &&
    (p.name.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
  );

  switch (sort){
    case "price-asc": list.sort((a,b)=> a.price - b.price); break;
    case "price-desc": list.sort((a,b)=> b.price - a.price); break;
    case "rating-desc": list.sort((a,b)=> b.rating - a.rating); break;
    default: break;
  }

  productGrid.innerHTML = "";
  list.forEach(p => productGrid.appendChild(productCard(p)));
  revealOnScroll();
}

/* ======= Filters & listeners ======= */
searchInput?.addEventListener("input", renderProducts);
categorySelect?.addEventListener("change", renderProducts);
sortSelect?.addEventListener("change", renderProducts);
priceRange?.addEventListener("input", ()=> {
  priceValue.textContent = `$${priceRange.value}`;
  renderProducts();
});
document.querySelectorAll(".chip").forEach(ch => ch.addEventListener("click", ()=>{
  categorySelect.value = ch.dataset.chip;
  renderProducts();
  document.getElementById("products").scrollIntoView({ behavior: "smooth", block:"start" });
}));

/* ======= Cart management ======= */
function addToCart(id){
  const item = PRODUCTS.find(p=> p.id===id);
  if(!item) return;
  const found = cart.find(c=> c.id===id);
  if(found) found.qty += 1; else cart.push({ id, qty:1 });
  saveCart(); updateCartUI();
}
function removeFromCart(id){ cart = cart.filter(c=> c.id !== id); saveCart(); updateCartUI(); }
function setQty(id, qty){ const it=cart.find(c=>c.id===id); if(!it) return; it.qty = Math.max(1, qty|0); saveCart(); updateCartUI(); }
function cartTotals(){ const items = cart.map(c=> ({...PRODUCTS.find(p=>p.id===c.id), qty: c.qty})); const subtotal = items.reduce((s,it)=> s + it.price*it.qty, 0); return { items, subtotal }; }

function updateCartUI(){
  if(!cartItemsEl) return;
  const { items, subtotal } = cartTotals();
  cartItemsEl.innerHTML = "";
  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `<img src="${it.img}" alt="${it.name}"><div><div class="title">${it.name}</div><div class="muted">${money(it.price)} · ${it.category}</div><div class="qty" style="margin-top:6px"><button data-dec="${it.id}">-</button><span>${it.qty}</span><button data-inc="${it.id}">+</button><button style="margin-left:auto" data-remove="${it.id}">Remove</button></div></div><div><strong>${money(it.price * it.qty)}</strong></div>`;
    row.querySelector(`[data-inc="${it.id}"]`)?.addEventListener("click", ()=> setQty(it.id, it.qty+1));
    row.querySelector(`[data-dec="${it.id}"]`)?.addEventListener("click", ()=> setQty(it.id, it.qty-1));
    row.querySelector(`[data-remove="${it.id}"]`)?.addEventListener("click", ()=> removeFromCart(it.id));
    cartItemsEl.appendChild(row);
  });

  const count = cart.reduce((s,c)=> s + c.qty, 0);
  cartCount && (cartCount.textContent = count);
  cartSubtotal && (cartSubtotal.textContent = money(subtotal));
}

openCart?.addEventListener("click", ()=> cartDrawer?.classList.add("open"));
closeCart?.addEventListener("click", ()=> cartDrawer?.classList.remove("open"));
cartOverlay?.addEventListener("click", ()=> cartDrawer?.classList.remove("open"));

/* ======= Quick view ======= */
function quickView(p){
  alert(`${p.name}\n\nCategory: ${p.category}\nPrice: ${money(p.price)}\nRating: ${p.rating.toFixed(1)}\n\nTags: ${p.tags.join(", ")}`);
}

/* ======= Checkout -> POST to backend (captures GPS) ======= */
checkoutBtn?.addEventListener("click", ()=> {
  const { items } = cartTotals();
  if(!items || items.length === 0){ showToast("Your cart is empty"); return; }
  summaryItems && (summaryItems.textContent = items.reduce((s,i)=> s + i.qty, 0));
  summarySubtotal && (summarySubtotal.textContent = money(cartTotals().subtotal));
  summaryTotal && (summaryTotal.textContent = money(cartTotals().subtotal + DELIVERY_FEE));
  checkoutModal?.showModal();
  document.body.style.overflow = "hidden";
});

function updatePaymentFields(){ cardFields && cardFields.classList.toggle("hidden", paymentMethod?.value !== "card"); }
paymentMethod?.addEventListener("change", updatePaymentFields);
updatePaymentFields();

/* ======= Checkout Modal Control (FIX) ======= */
closeCheckout?.addEventListener("click", () => {
  checkoutModal?.close();
  document.body.style.overflow = "auto";
});
cancelCheckout?.addEventListener("click", () => {
  checkoutModal?.close();
  document.body.style.overflow = "auto";
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && checkoutModal?.open) {
    checkoutModal.close();
    document.body.style.overflow = "auto";
  }
});
checkoutModal?.addEventListener("click", (e) => {
  const rect = checkoutModal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width;
  if (!inDialog) {
    checkoutModal.close();
    document.body.style.overflow = "auto";
  }
});
checkoutModal?.addEventListener("close", () => {
  document.body.style.overflow = "auto";
});

/* ======= Submit order ======= */
checkoutForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { items, subtotal } = cartTotals();
  if(!items || items.length === 0){ showToast("Your cart is empty"); return; }
  const order = {
    customer: {
      name: document.getElementById("custName").value.trim(),
      phone: document.getElementById("custPhone").value.trim(),
      address: document.getElementById("custAddress").value.trim()
    },
    payment: { method: paymentMethod.value },
    items: items.map(i=> ({ productId: i.id, name: i.name, category: i.category, price: i.price, qty: i.qty, img: i.img })),
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total: subtotal + DELIVERY_FEE,
    location: null
  };

  // try to get GPS
  const getPosition = () => new Promise((resolve) => {
    if(!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  order.location = await getPosition();

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data?.error || "Order failed");
    showToast("Order placed! You will get a WhatsApp confirmation soon.");
    cart = []; saveCart(); updateCartUI(); checkoutModal?.close(); cartDrawer?.classList.remove("open");
  } catch (err) {
    console.error("Order error:", err);
    showToast("Could not place the order. Try again.");
  }
});

/* ======= Misc UI ======= */
document.getElementById("newsletterForm")?.addEventListener("submit", (e)=> { e.preventDefault(); showToast("Subscribed!"); e.target.reset(); });
yearEl && (yearEl.textContent = new Date().getFullYear());

window.addEventListener("scroll", ()=> { if(window.scrollY > 500) backToTop?.classList.add("show"); else backToTop?.classList.remove("show"); });
backToTop?.addEventListener("click", ()=> window.scrollTo({ top:0, behavior:"smooth" }));

function revealOnScroll(){
  document.querySelectorAll(".sr").forEach(el=>{
    const rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight - 60) el.classList.add("in");
  });
}
window.addEventListener("scroll", revealOnScroll);
setTimeout(revealOnScroll, 300);

/* ======= Init ======= */
renderProducts();
updateCartUI();
/* ========== END ========== */