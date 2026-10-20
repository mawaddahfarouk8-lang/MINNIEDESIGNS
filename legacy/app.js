
/* Minnie Design — Shared Script */
const CART_KEY = "cart_v3";

const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};

const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

/* CART */
const optPrice = (p, o) =>
  (p.options || []).reduce(
    (s, x) => s + ((x.choices.find(c => c.name === o[x.key]) || {}).add || 0),
    0
  );

const defaultOpts = p =>
  Object.fromEntries((p.options || []).map(x => [x.key, x.choices[0].name]));

const optText = o =>
  Object.entries(o)
    .filter(([, v]) => v)
    .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
    .join(" · ");

const Cart = {
  items: () =>
    read(CART_KEY, []).filter(i => PRODUCTS.some(p => p.id === i.id)),

  save(items) {
    write(CART_KEY, items);
    Cart.badge();
  },

  add(id, opts, qty = 1) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    opts = opts || defaultOpts(p);

    const key = id + "|" + JSON.stringify(opts);
    const c = Cart.items();
    const i = c.find(x => x.key === key);

    if (i) {
      i.qty += qty;
    } else {
      c.push({ key, id, opts, qty });
    }

    Cart.save(c);
  },

  setQty(key, q) {
    Cart.save(
      Cart.items()
        .map(i => i.key === key ? { ...i, qty: q } : i)
        .filter(i => i.qty > 0)
    );
  },

  clear() {
    Cart.save([]);
  },

  lines: () =>
    Cart.items().map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return {
        ...p,
        price: p.price + optPrice(p, i.opts),
        qty: i.qty,
        key: i.key,
        opts: i.opts
      };
    }),

  subtotal: () =>
    Cart.lines().reduce((s, l) => s + l.price * l.qty, 0),

  badge() {
    const el = document.getElementById("cart-count");
    if (!el) return;

    const n = Cart.items().reduce((s, i) => s + i.qty, 0);
    el.textContent = n;
    el.hidden = n === 0;
  }
};

function afterAdd() {
  const el = document.getElementById("cart-count");

  if (el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  showToast("Added to cart");
}

/* TOAST */
let toastTimer;

function showToast(msg) {
  let t = document.getElementById("toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.append(t);
  }

  t.textContent = msg;
  t.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
}

/* HEADER / FOOTER */
const NAV = [
  ["index.html", "Home"],
  ["shop.html", "Shop"],
  ["custom.html", "Custom design"]
];

function renderLayout() {
  const page = location.pathname.split("/").pop() || "index.html";

  const links = NAV.map(([h, t]) => `
    <li>
      <a href="${h}" ${
        h === page ? 'class="active" aria-current="page"' : ""
      }>${t}</a>
    </li>
  `).join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <header>
      <nav class="navbar">
        <a href="index.html" class="logo">
          Minnie<span>Design</span>
        </a>

        <ul class="nav-links">
          ${links}
        </ul>

        <div class="nav-icons">
          <a href="cart.html" class="cart-icon" aria-label="Cart">
            <i class="fa-solid fa-cart-shopping"></i>
            <span id="cart-count" hidden>0</span>
          </a>

          <div id="profile-area">
            <a href="login.php" class="profile-link">
              <i class="fa-regular fa-user"></i>
              Login
            </a>
          </div>

          <button
            id="themeBtn"
            type="button"
            aria-label="Toggle dark mode"
          >
            <i class="fa-solid fa-moon"></i>
          </button>
        </div>
      </nav>
    </header>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <footer>
      <h2>Minnie Design</h2>

      <p>
        <a href="shop.html">Shop</a> ·
        <a href="custom.html">Custom design</a> ·
        <a href="cart.html">Cart</a> ·
        <a href="track-order.php">Track order</a>
      </p>

      <a
        class="social"
        href="${WHATSAPP_OR_INSTAGRAM}"
        target="_blank"
        rel="noopener"
        aria-label="Instagram"
      >
        <i class="fab fa-instagram"></i>
      </a>

      <p class="copy">
        © 2026 Minnie Design. All rights reserved.
      </p>
    </footer>
  `);
}

/* USER PROFILE / LOGIN STATUS */
async function initProfile() {
  const area = document.getElementById("profile-area");
  if (!area) return;

  try {
    const response = await fetch("session_user.php", {
      cache: "no-store",
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error("Could not load profile");
    }

    const user = await response.json();

    if (user.loggedIn) {
      const firstName = (user.name || "My Account")
        .trim()
        .split(/\s+/)[0];

      area.innerHTML = `
        <details class="profile-menu">
          <summary>
            <i class="fa-regular fa-user"></i>
            <span>${esc(firstName)}</span>
            <i class="fa-solid fa-chevron-down"></i>
          </summary>

          <div class="profile-dropdown">
            <a href="account.php">
              <i class="fa-regular fa-user"></i>
              My Account
            </a>

            <a href="track-order.php">
              <i class="fa-solid fa-box"></i>
              My Orders
            </a>

            <a href="edit_profile.php">
              <i class="fa-solid fa-gear"></i>
              Edit Profile
            </a>

            <a href="logout.php">
              <i class="fa-solid fa-right-from-bracket"></i>
              Logout
            </a>
          </div>
        </details>
      `;
    } else {
      area.innerHTML = `
        <a href="login.php" class="profile-link">
          <i class="fa-regular fa-user"></i>
          Login
        </a>

        <a href="signup.php" class="profile-link">
          Sign Up
        </a>
      `;
    }
  } catch (error) {
    console.error("Profile loading failed:", error);
  }
}

/* DARK / LIGHT THEME */
function initTheme() {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  const apply = dark => {
    document.body.classList.toggle("dark", dark);

    btn.innerHTML = `
      <i class="fa-solid ${dark ? "fa-sun" : "fa-moon"}"></i>
    `;

    btn.setAttribute("aria-pressed", String(dark));
  };

  apply(localStorage.getItem("theme") === "dark");

  btn.onclick = () => {
    const dark = !document.body.classList.contains("dark");

    apply(dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };
}

/* PRODUCT CARD */
function productCard(p) {
  const cat = CATEGORIES.find(c => c.id === p.cat);
  const url = "product.html?id=" + p.id;

  return `
    <article class="project-card">
      <a class="stack" href="${url}" aria-label="View ${esc(p.name)}">
        ${p.images.slice(0, 3).map((s, i) => `
          <img
            src="${s}"
            class="stack-img img${i + 1}"
            alt=""
            loading="lazy"
          >
        `).join("")}
      </a>

      <span class="tag">${cat ? esc(cat.name) : ""}</span>

      <h3>
        <a href="${url}">${esc(p.name)}</a>
      </h3>

      <p>${esc(p.desc)}</p>

      <strong class="price">
        ${money(p.price)} <small>${esc(p.unit)}</small>
      </strong>

      <div class="project-buttons">
        <a class="btn btn-outline" href="${url}">Details</a>

        ${
          p.personalize
            ? `<a class="btn btn-solid" href="${url}">Personalize</a>`
            : `<button class="btn btn-solid" type="button" data-add="${p.id}">Add to cart</button>`
        }
      </div>
    </article>
  `;
}

/* ADD TO CART BUTTONS */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (!b) return;

  Cart.add(Number(b.dataset.add));
  afterAdd();
});

/* FORM VALIDATION */
const RULES = {
  required: v =>
    v.trim() !== "" || "This field is required.",

  min3: v =>
    v.trim().length >= 3 || "Enter at least 3 characters.",

  phone: v =>
    /^01[0125][0-9]{8}$/.test(v.trim()) ||
    "Enter an Egyptian mobile number, like 01012345678.",

  email: v =>
    v.trim() === "" ||
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ||
    "Enter a valid email address.",

  future: v =>
    v === "" ||
    new Date(v) >= new Date(new Date().toDateString()) ||
    "Pick today or a later date.",

  imgreq: (v, el) =>
    !!el.files?.[0] || "Upload a screenshot of your transfer.",

  image: (v, el) =>
    !el.files?.[0] ||
    (
      /^image\//.test(el.files[0].type) &&
      el.files[0].size <= 5 * 1024 * 1024
    ) ||
    "Upload an image under 5 MB."
};

function validateField(el) {
  const rules = (el.dataset.rule || "").split(" ").filter(Boolean);
  let msg = true;

  for (const r of rules) {
    if (!RULES[r]) continue;

    msg = RULES[r](el.value, el);
    if (msg !== true) break;
  }

  let err = el.parentElement.querySelector(".err");

  if (!err) {
    err = document.createElement("small");
    err.className = "err";
    el.parentElement.append(err);
  }

  err.textContent = msg === true ? "" : msg;
  el.classList.toggle("invalid", msg !== true);
  el.setAttribute("aria-invalid", String(msg !== true));

  return msg === true;
}

function validateForm(form) {
  const fields = [...form.querySelectorAll("[data-rule]")];
  const ok = fields.map(validateField).every(Boolean);

  if (!ok) {
    form.querySelector(".invalid")?.focus();
  }

  return ok;
}

function liveValidate(form) {
  form.querySelectorAll("[data-rule]").forEach(el => {
    el.addEventListener("blur", () => validateField(el));

    el.addEventListener("input", () => {
      if (el.classList.contains("invalid")) {
        validateField(el);
      }
    });

    el.addEventListener("change", () => {
      if (el.classList.contains("invalid")) {
        validateField(el);
      }
    });
  });
}

/* INITIALIZE WEBSITE */
document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  initTheme();
  Cart.badge();
  initProfile();
  document.body.classList.add("ready");
});
