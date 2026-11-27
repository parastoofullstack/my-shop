import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const API = "/api";
let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "{}");

/* =========================================================
   ۱. بک‌گراند سه‌بعدی (ذرات شناور + پارالاکس ماوس)
   ========================================================= */
function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 40;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x8b5cf6,
    size: 0.06,
    transparent: true,
    opacity: 0.8,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // یک شکل شیشه‌ای شناور در پس‌زمینه
  const glass = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    })
  );
  glass.position.set(5, -1, -4);
  scene.add(glass);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.PointLight(0x8b5cf6, 2, 50);
  light.position.set(0, 5, 5);
  scene.add(light);

  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0007;
    points.rotation.x += 0.0003;
    glass.rotation.x += 0.003;
    glass.rotation.y += 0.004;

    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
}

/* =========================================================
   ۲. نمایشگر سه‌بعدی محصول
   ========================================================= */
const viewer = {};

function initViewer() {
  const canvas = document.getElementById("viewer-canvas");
  viewer.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  viewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  viewer.scene = new THREE.Scene();
  viewer.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  viewer.camera.position.set(0, 1.5, 6);

  viewer.controls = new OrbitControls(viewer.camera, canvas);
  viewer.controls.enableDamping = true;
  viewer.controls.enablePan = false;
  viewer.controls.minDistance = 3;
  viewer.controls.maxDistance = 10;

  viewer.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(3, 5, 4);
  viewer.scene.add(dir);
  const rim = new THREE.PointLight(0x06b6d4, 2, 30);
  rim.position.set(-4, 2, -3);
  viewer.scene.add(rim);

  resizeViewer();
  window.addEventListener("resize", resizeViewer);

  function loop() {
    requestAnimationFrame(loop);
    if (viewer.mesh) viewer.mesh.rotation.y += 0.006;
    viewer.controls.update();
    viewer.renderer.render(viewer.scene, viewer.camera);
  }
  loop();
}

function resizeViewer() {
  const canvas = viewer.renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  viewer.renderer.setSize(w, h, false);
  viewer.camera.aspect = w / h;
  viewer.camera.updateProjectionMatrix();
}

function makeGeometry(shape) {
  switch (shape) {
    case "knot":
      return new THREE.TorusKnotGeometry(1, 0.35, 160, 32);
    case "icosa":
      return new THREE.IcosahedronGeometry(1.4, 0);
    case "box":
      return new THREE.BoxGeometry(2, 2, 2);
    case "octa":
      return new THREE.OctahedronGeometry(1.5, 0);
    case "cone":
      return new THREE.ConeGeometry(1.2, 2.6, 64);
    case "sphere":
    default:
      return new THREE.SphereGeometry(1.3, 64, 64);
  }
}

function setViewerProduct(product) {
  if (viewer.mesh) {
    viewer.scene.remove(viewer.mesh);
    viewer.mesh.geometry.dispose();
    viewer.mesh.material.dispose();
  }

  const material = new THREE.MeshStandardMaterial({
    color: product.color,
    metalness: 0.7,
    roughness: 0.2,
    emissive: product.color,
    emissiveIntensity: 0.08,
  });
  viewer.mesh = new THREE.Mesh(makeGeometry(product.shape), material);
  viewer.scene.add(viewer.mesh);

  document.getElementById("viewer-title").textContent = product.name;
  document.getElementById("viewer-desc").textContent = product.description;
}

/* =========================================================
   ۳. دریافت و نمایش محصولات
   ========================================================= */
const formatPrice = (n) => n.toLocaleString("fa-IR") + " تومان";

async function loadProducts() {
  const res = await fetch(`${API}/products`);
  products = await res.json();
  renderProducts();
  if (products.length) setViewerProduct(products[0]);
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "glass product-card";
    card.innerHTML = `
      <div class="product-thumb" style="--c:${p.color}">◆</div>
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div class="product-price">${formatPrice(p.price)}</div>
      <button class="btn-primary add-btn">افزودن به سبد</button>
    `;

    card.addEventListener("click", () => setViewerProduct(p));

    card.querySelector(".add-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(p.id);
    });

    grid.appendChild(card);
  });
}

/* =========================================================
   ۴. سبد خرید
   ========================================================= */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  showToast("به سبد خرید اضافه شد ✔");
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
}

function getCartDetails() {
  return Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === Number(id));
      return product ? { product, qty } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const details = getCartDetails();
  const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById("cart-count").textContent = totalCount;

  if (!details.length) {
    container.innerHTML = `<p class="empty-msg">سبد خرید شما خالی است 🛍</p>`;
    document.getElementById("cart-total").textContent = formatPrice(0);
    return;
  }

  container.innerHTML = "";
  let total = 0;

  details.forEach(({ product, qty }) => {
    total += product.price * qty;
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <div>
        <strong>${product.name}</strong><br />
        <small>${formatPrice(product.price)}</small>
      </div>
      <div class="qty">
        <button data-act="minus">−</button>
        <span>${qty}</span>
        <button data-act="plus">+</button>
        <button data-act="remove" title="حذف">🗑</button>
        </div>
      `;
  
      item.querySelector('[data-act="minus"]').onclick = () => changeQty(product.id, -1);
      item.querySelector('[data-act="plus"]').onclick = () => changeQty(product.id, 1);
      item.querySelector('[data-act="remove"]').onclick = () => removeFromCart(product.id);
  
      container.appendChild(item);
    });
  
    document.getElementById("cart-total").textContent = formatPrice(total);
  }
  
  /* =========================================================
     ۵. ثبت سفارش
     ========================================================= */
  async function submitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
  
    const items = Object.entries(cart).map(([id, qty]) => ({
      product_id: Number(id),
      quantity: qty,
    }));
  
    if (!items.length) {
      showToast("سبد خرید خالیه!");
      return;
    }
  
    const body = {
      customer_name: fd.get("name"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      items,
    };
  
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
  
      if (res.ok) {
        showToast(`سفارش #${data.order_id} ثبت شد 🎉`);
        cart = {};
        saveCart();
        form.reset();
        toggleModal(false);
        toggleCart(false);
      } else {
        showToast(data.detail || "خطا در ثبت سفارش");
      }
    } catch {
      showToast("ارتباط با سرور برقرار نشد");
    }
  }
  
  /* =========================================================
     ۶. UI کمکی
     ========================================================= */
  function toggleCart(open) {
    document.getElementById("cart-drawer").classList.toggle("open", open);
  }
  
  function toggleModal(open) {
    document.getElementById("checkout-modal").classList.toggle("hidden", !open);
  }
  
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
  }
  
  function bindEvents() {
    document.getElementById("cart-btn").onclick = () => toggleCart(true);
    document.getElementById("close-cart").onclick = () => toggleCart(false);
  
    document.getElementById("checkout-btn").onclick = () => {
      if (!Object.keys(cart).length) {
        showToast("ابتدا محصولی به سبد اضافه کن");
        return;
      }
      toggleCart(false);
      toggleModal(true);
    };
  
    document.getElementById("close-modal").onclick = () => toggleModal(false);
    document.getElementById("checkout-form").addEventListener("submit", submitOrder);
  }
  
  /* =========================================================
     ۷. شروع برنامه
     ========================================================= */
  document.addEventListener("DOMContentLoaded", async () => {
    initBackground();
    initViewer();
    bindEvents();
    await loadProducts();
    renderCart();
  });
  