const foods = [
  {id:1,name:"Paneer Tikka Pizza",category:"Pizza",price:179,emoji:"🍕",rating:4.8,desc:"Smoky paneer, peppers & melty cheese",popular:true},
  {id:2,name:"Campus Smash Burger",category:"Burgers",price:149,emoji:"🍔",rating:4.9,desc:"Crispy patty, cheese & secret sauce",popular:true},
  {id:3,name:"Masala Dosa",category:"South Indian",price:89,emoji:"🥞",rating:4.7,desc:"Crispy dosa with chutney & sambar",popular:true},
  {id:4,name:"Cold Coffee",category:"Drinks",price:79,emoji:"🥤",rating:4.8,desc:"Creamy chilled coffee with a kick",popular:true},
  {id:5,name:"Peri Peri Fries",category:"Snacks",price:99,emoji:"🍟",rating:4.6,desc:"Golden fries with fiery seasoning"},
  {id:6,name:"Veg Hakka Noodles",category:"Snacks",price:119,emoji:"🍜",rating:4.7,desc:"Wok-tossed noodles & crunchy veggies"},
  {id:7,name:"Chocolate Waffle",category:"Desserts",price:109,emoji:"🧇",rating:4.8,desc:"Warm waffle with chocolate drizzle"},
  {id:8,name:"Mango Smoothie",category:"Drinks",price:99,emoji:"🥭",rating:4.7,desc:"Fresh mango, yoghurt & sunshine"},
  {id:9,name:"Cheese Maggi",category:"Snacks",price:69,emoji:"🍝",rating:4.9,desc:"The ultimate late-night campus comfort"},
  {id:10,name:"Idli Sambar",category:"South Indian",price:69,emoji:"🍚",rating:4.6,desc:"Soft idlis with warm homestyle sambar"},
  {id:11,name:"Margherita Pizza",category:"Pizza",price:149,emoji:"🍕",rating:4.5,desc:"Tomato, basil & stretchy mozzarella"},
  {id:12,name:"Brownie Sundae",category:"Desserts",price:129,emoji:"🍨",rating:4.9,desc:"Fudgy brownie, ice cream & chocolate"}
];

const categories = ["All","Pizza","Burgers","South Indian","Snacks","Drinks","Desserts"];
let activeCategory = "All";
let searchTerm = "";
let cart = JSON.parse(localStorage.getItem("campusBiteCart") || "[]");
let favorites = JSON.parse(localStorage.getItem("campusBiteFavorites") || "[]");

const $ = id => document.getElementById(id);
const foodGrid = $("foodGrid");
const favoriteGrid = $("favoriteGrid");
const favoritesEmpty = $("favoritesEmpty");
const cartDrawer = $("cartDrawer");
const overlay = $("overlay");
const checkoutModal = $("checkoutModal");
const toast = $("toast");

function saveState(){
  localStorage.setItem("campusBiteCart", JSON.stringify(cart));
  localStorage.setItem("campusBiteFavorites", JSON.stringify(favorites));
}

function renderCategories(){
  $("categoryRow").innerHTML = categories.map(cat =>
    `<button class="category-btn ${cat===activeCategory ? "active":""}" data-category="${cat}">${cat}</button>`
  ).join("");
}

function getVisibleFoods(){
  return foods.filter(food => {
    const matchesCategory = activeCategory === "All" || food.category === activeCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function foodCard(food){
  const liked = favorites.includes(food.id);
  return `
    <article class="food-card">
      <button class="heart-btn ${liked ? "liked":""}" data-favorite="${food.id}" aria-label="Favorite ${food.name}">${liked ? "♥":"♡"}</button>
      <div class="food-visual"><span class="food-emoji">${food.emoji}</span></div>
      <div class="food-info">
        <div class="food-top"><span class="food-name">${food.name}</span><span class="food-price">₹${food.price}</span></div>
        <p class="food-desc">${food.desc}</p>
        <div class="food-bottom">
          <div class="rating">★★★★★ <span>${food.rating}</span></div>
          <button class="add-btn" data-add="${food.id}">+ Add</button>
        </div>
      </div>
    </article>`;
}

function renderFoods(){
  const visible = getVisibleFoods();
  foodGrid.innerHTML = visible.length
    ? visible.map(foodCard).join("")
    : `<div class="favorites-empty" style="grid-column:1/-1"><div>🔎</div><h3>No bites found.</h3><p>Try another food name or category.</p></div>`;
}

function renderPopular(){
  $("popularGrid").innerHTML = foods.filter(f => f.popular).map(food => `
    <button class="popular-card" data-popular="${food.id}">
      <span class="emoji">${food.emoji}</span>
      <strong>${food.name}</strong>
      <small>${food.category} • ${food.rating}★</small>
      <b>₹${food.price} →</b>
    </button>`).join("");
}

function renderFavorites(){
  const likedFoods = foods.filter(f => favorites.includes(f.id));
  favoritesEmpty.style.display = likedFoods.length ? "none" : "block";
  favoriteGrid.innerHTML = likedFoods.map(foodCard).join("");
}

function cartCount(){
  return cart.reduce((sum,item) => sum + item.qty, 0);
}

function renderCart(){
  const count = cartCount();
  $("cartCount").textContent = count;
  $("drawerCount").textContent = `(${count})`;
  if(!cart.length){
    $("cartItems").innerHTML = `<div class="favorites-empty" style="border:0;padding:55px 10px"><div>🛒</div><h3>Your cart is waiting.</h3><p>Add a campus favourite to get started.</p></div>`;
  } else {
    $("cartItems").innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="mini-img">${item.emoji}</div>
        <div>
          <h4>${item.name}</h4>
          <small>₹${item.price} each</small>
          <div class="qty">
            <button data-minus="${item.id}">−</button><b>${item.qty}</b><button data-plus="${item.id}">+</button>
          </div>
        </div>
        <strong>₹${item.price * item.qty}</strong>
      </div>`).join("");
  }
  const subtotal = cart.reduce((sum,item) => sum + item.price * item.qty, 0);
  const fee = subtotal ? 10 : 0;
  $("subtotal").textContent = `₹${subtotal}`;
  $("serviceFee").textContent = `₹${fee}`;
  $("total").textContent = `₹${subtotal + fee}`;
  $("checkoutBtn").disabled = !cart.length;
  $("checkoutBtn").style.opacity = cart.length ? "1" : ".5";
  renderCheckoutSummary();
}

function addToCart(id){
  const food = foods.find(f => f.id === id);
  const existing = cart.find(item => item.id === id);
  if(existing) existing.qty++;
  else cart.push({...food, qty:1});
  saveState(); renderCart(); showToast(`${food.name} added to cart`);
}

function changeQty(id, amount){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += amount;
  if(item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveState(); renderCart();
}

function toggleFavorite(id){
  const food = foods.find(f => f.id === id);
  if(favorites.includes(id)){
    favorites = favorites.filter(x => x !== id);
    showToast(`${food.name} removed from favourites`);
  } else {
    favorites.push(id);
    showToast(`${food.name} saved to favourites ♥`);
  }
  saveState(); renderFoods(); renderFavorites();
}

function openCart(){cartDrawer.classList.add("open");overlay.classList.add("show")}
function closeCart(){cartDrawer.classList.remove("open");overlay.classList.remove("show")}
function openCheckout(){
  if(!cart.length){showToast("Add something to your cart first");return}
  closeCart(); checkoutModal.classList.add("show"); checkoutModal.setAttribute("aria-hidden","false");
}
function closeCheckout(){checkoutModal.classList.remove("show");checkoutModal.setAttribute("aria-hidden","true")}

function renderCheckoutSummary(){
  const subtotal = cart.reduce((sum,item)=>sum + item.price*item.qty,0);
  $("checkoutSummary").innerHTML = cart.length
    ? cart.map(i=>`<div><span>${i.name} × ${i.qty}</span><b>₹${i.price*i.qty}</b></div>`).join("") +
      `<div style="border-top:1px dashed #999;padding-top:8px;margin-top:8px"><b>Total</b><b>₹${subtotal+10}</b></div>`
    : `<div>Your cart is empty.</div>`;
}

let toastTimer;
function showToast(message){
  toast.querySelector("p").textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),2600);
}

$("categoryRow").addEventListener("click", e => {
  const btn = e.target.closest("[data-category]");
  if(!btn) return;
  activeCategory = btn.dataset.category;
  renderCategories(); renderFoods();
});

$("searchInput").addEventListener("input", e => {
  searchTerm = e.target.value;
  renderFoods();
});

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const fav = e.target.closest("[data-favorite]");
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  const popular = e.target.closest("[data-popular]");
  if(add) addToCart(Number(add.dataset.add));
  if(fav) toggleFavorite(Number(fav.dataset.favorite));
  if(plus) changeQty(Number(plus.dataset.plus), 1);
  if(minus) changeQty(Number(minus.dataset.minus), -1);
  if(popular) addToCart(Number(popular.dataset.popular));
});

$("cartBtn").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("checkoutBtn").addEventListener("click", openCheckout);
$("closeModal").addEventListener("click", closeCheckout);
$("themeBtn").addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("campusBiteTheme", document.body.classList.contains("dark") ? "dark":"light");
  $("themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
});
$("checkoutForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name = $("nameInput").value.trim();
  const phone = $("phoneInput").value.trim();
  if(phone.length !== 10){showToast("Please enter a valid 10-digit phone number");return}
  const orderNo = "CB" + Math.floor(1000 + Math.random()*9000);
  cart = []; saveState(); renderCart(); closeCheckout();
  e.target.reset();
  showToast(`Order ${orderNo} placed for ${name}! ✨`);
});
$("heroPopularBtn").addEventListener("click", ()=> $("popular").scrollIntoView({behavior:"smooth"}));
$("allPopularBtn").addEventListener("click", ()=> { activeCategory="All"; searchTerm=""; $("searchInput").value=""; renderCategories(); renderFoods(); $("menu").scrollIntoView({behavior:"smooth"}); });
$("menuBtn").addEventListener("click", ()=> {
  const links = $("navLinks");
  links.style.display = links.style.display === "flex" ? "" : "flex";
  links.style.position = "absolute"; links.style.top = "78px"; links.style.left = "0"; links.style.right = "0";
  links.style.padding = "18px 5%"; links.style.background = "var(--surface)"; links.style.flexDirection = "column";
});

window.addEventListener("scroll", ()=>{
  const max = document.documentElement.scrollHeight - innerHeight;
  $("scrollProgress").style.width = `${(scrollY/max)*100}%`;
});

if(localStorage.getItem("campusBiteTheme")==="dark"){document.body.classList.add("dark");$("themeBtn").textContent="☀"}
renderCategories(); renderFoods(); renderPopular(); renderFavorites(); renderCart();
