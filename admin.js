const DB = "https://somsa-c5ae4-default-rtdb.firebaseio.com";

// ══════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════
window.switchTab = function(tab, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");
};

// ══════════════════════════════
//  TOAST
// ══════════════════════════════
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ══════════════════════════════
//  BUYURTMALAR (ORDERS)
// ══════════════════════════════
let orders = [];
let currentFilter = "all";
let oldIds = [];
let firstTime = true;

async function loadOrders() {
  try {
    const res = await fetch(DB + "/buyurtmalar.json");
    const data = await res.json();

    orders = [];

    if (data) {
      for (let id in data) {
        let order = data[id];
        order.id = id;
        orders.push(order);

        if (!firstTime && !oldIds.includes(id) && order.status === "pending") {
          playSound();
          showNotif(order);
        }

        if (!oldIds.includes(id)) oldIds.push(id);
      }
    }

    orders.reverse();
    firstTime = false;
    renderOrders();

  } catch (error) {
    console.log("Xatolik:", error);
  }
}

window.setFilter = function(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".fbtn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderOrders();
};

function renderOrders() {
  let filtered = currentFilter === "all"
    ? orders
    : orders.filter(o => o.status === currentFilter);

  document.getElementById("totalCount").textContent = orders.length;
  document.getElementById("pendingCount").textContent = orders.filter(o => o.status === "pending").length;
  document.getElementById("acceptedCount").textContent = orders.filter(o => o.status === "accepted").length;

  const list = document.getElementById("ordersList");

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty"><span class="icon">📭</span>Buyurtma yo'q</div>`;
    return;
  }

  list.innerHTML = filtered.map(order => {
    const initials = order.ism.charAt(0).toUpperCase();
    const vaqt = order.vaqt
      ? new Date(order.vaqt).toLocaleString("uz-UZ", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })
      : "";

    return `
      <div class="card">
        <div class="avatar">${initials}</div>
        <div class="info">
          <div class="name">${order.ism}</div>
          <div class="meta">${order.tur === "dastavka"
            ? `🛵 Dastavka · 🫓 ${order.son} ta · 📍 ${order.manzil} · 📞 ${order.telefon}`
            : `🏠 Xona zakazi · 🫓 ${order.son} ta somsa · 🚪 ${order.xona}-xona`
          }</div>
          <div class="time">🕐 ${vaqt}</div>
        </div>
        <span class="pill ${order.status === "accepted" ? "accepted" : "pending"}">
          ${order.status === "accepted" ? "✅ Qabul qilindi" : "⏳ Kutilmoqda"}
        </span>
        ${order.status === "pending"
          ? `<button class="abtn" onclick="acceptOrder('${order.id}', this)">✔ Qabul qilish</button>`
          : ""}
        <button class="dbtn" onclick="deleteOrder('${order.id}', this)">🗑️</button>
      </div>
    `;
  }).join("");
}

window.acceptOrder = async function(id, btn) {
  btn.disabled = true;
  btn.textContent = "...";
  try {
    await fetch(DB + "/buyurtmalar/" + id + ".json", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" })
    });
    showToast("✅ Buyurtma qabul qilindi!");
    loadOrders();
  } catch (error) {
    console.log("Qabul qilishda xatolik:", error);
    btn.disabled = false;
    btn.textContent = "✔ Qabul qilish";
  }
};

window.deleteOrder = async function(id, btn) {
  if (!confirm("Bu zakazni o'chirishni tasdiqlaysizmi?")) return;

  btn.disabled = true;
  btn.textContent = "...";

  try {
    await fetch(DB + "/buyurtmalar/" + id + ".json", { method: "DELETE" });
    showToast("🗑️ Zakaz o'chirildi!");
    loadOrders();
  } catch (error) {
    console.log("O'chirishda xatolik:", error);
    btn.disabled = false;
    btn.textContent = "🗑️";
  }
};

  function showNotif(order){
  const popup = document.getElementById("notif-popup");
  document.getElementById("notif-body").textContent = order.tur === "dastavka"
    ? `${order.ism} — ${order.son} ta somsa, 📍 ${order.manzil}`
    : `${order.ism} — ${order.son} ta somsa, ${order.xona}-xona`;
  popup.style.display = "block";
  clearTimeout(window.notifTimer);
  window.notifTimer = setTimeout(() => popup.style.display = "none", 8000);
}

window.closeNotif = function() {
  document.getElementById("notif-popup").style.display = "none";
};

function playSound() {
  try {
    new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3").play();
  } catch(e) {}
}

// ══════════════════════════════
//  IZOXLAR (COMMENTS)
// ══════════════════════════════
async function loadComments() {
  try {
    const res = await fetch(DB + "/commentlar.json");
    const data = await res.json();

    const list = document.getElementById("commentsList");
    const countBadge = document.getElementById("commentCount");

    if (!data) {
      countBadge.textContent = "0";
      list.innerHTML = `
        <div class="empty">
          <span class="icon">💬</span>
          Hali hech qanday izox yo'q
        </div>`;
      return;
    }

    const entries = Object.entries(data).reverse(); // yangi tepada
    countBadge.textContent = entries.length;

    list.innerHTML = entries.map(([key, item]) => {
      const initial = item.ism ? item.ism.trim()[0].toUpperCase() : "?";
      const vaqt = item.timestamp
        ? new Date(item.timestamp).toLocaleString("uz-UZ", {
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })
        : "Noma'lum vaqt";

      return `
        <div class="ccard" id="ccard-${key}">
          <div class="ccard-top">
            <div class="cavatar">${initial}</div>
            <div class="cmeta">
              <div class="cname">${item.ism || "Anonim"}</div>
              <div class="ctime">🕐 ${vaqt}</div>
            </div>
          </div>
          <div class="cbody">${item.comment || ""}</div>
          <div class="ccard-actions">
            <button class="del-btn" onclick="deleteComment('${key}', this)">
              <svg viewBox="0 0 24 24"><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>
              O'chirish
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.log("Izoxlarni yuklashda xatolik:", err);
  }
}

window.deleteComment = async function(key, btn) {
  if (!confirm("Bu izoxni o'chirishni tasdiqlaysizmi?")) return;

  btn.disabled = true;
  btn.textContent = "O'chirilmoqda...";

  try {
    await fetch(DB + "/commentlar/" + key + ".json", { method: "DELETE" });

    // Kartani animatsiya bilan o'chirish
    const card = document.getElementById("ccard-" + key);
    if (card) {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "translateX(20px)";
      setTimeout(() => card.remove(), 300);
    }

    showToast("🗑️ Izox o'chirildi");

    // Countni yangilash
    setTimeout(() => {
      const remaining = document.querySelectorAll(".ccard").length;
      document.getElementById("commentCount").textContent = remaining;
      if (remaining === 0) {
        document.getElementById("commentsList").innerHTML = `
          <div class="empty">
            <span class="icon">💬</span>
            Hali hech qanday izox yo'q
          </div>`;
      }
    }, 320);

  } catch (err) {
    console.log("O'chirishda xatolik:", err);
    btn.disabled = false;
    btn.textContent = "O'chirish";
    showToast("❌ Xatolik yuz berdi");
  }
};

// ══════════════════════════════
//  ISH VAQTI BOSHQARUVI
// ══════════════════════════════
async function loadWorkHours() {
  try {
    const res = await fetch(DB + "/ishVaqti.json");
    const data = await res.json();

    const open   = data?.open   ?? 4;
    const close  = data?.close  ?? 11;
    const active = data?.isActive ?? true;

    // Inputlarni to'ldirish
    document.getElementById("openHour").value  = open;
    document.getElementById("closeHour").value = close;
    document.getElementById("isActiveToggle").checked = active;

    updateToggleLabel(active);
    updateStatusBadge(open, close, active);

  } catch(err) {
    console.log("Ish vaqtini yuklashda xatolik:", err);
  }
}

function updateToggleLabel(active) {
  document.getElementById("toggleLabel").textContent = active ? "Ochiq ✅" : "Yopiq 🔴";
}

function updateStatusBadge(open, close, active) {
  const now    = new Date().getHours();
  const isOpen = active && now >= open && now < close;

  const box  = document.getElementById("vaqtStatus");
  const text = document.getElementById("vaqtStatusText");

  box.className = "vaqt-status " + (isOpen ? "open" : "closed");
  text.textContent = isOpen
    ? `Hozir OCHIQ — ${open}:00 dan ${close}:00 gacha`
    : active
      ? `Hozir YOPIQ — ish vaqti ${open}:00 — ${close}:00`
      : `Sayt to'xtatilgan (admin tomonidan yopiq)`;
}

// Toggle o'zgarganda label yangilansin
document.getElementById("isActiveToggle").addEventListener("change", function() {
  updateToggleLabel(this.checked);
});

window.saveWorkHours = async function() {
  const openHour  = Number(document.getElementById("openHour").value);
  const closeHour = Number(document.getElementById("closeHour").value);
  const isActive  = document.getElementById("isActiveToggle").checked;

  // Validatsiya
  if (isNaN(openHour) || isNaN(closeHour) || openHour < 0 || closeHour > 23) {
    showToast("❌ Soat 0 dan 23 gacha bo'lishi kerak!");
    return;
  }
  if (openHour >= closeHour) {
    showToast("❌ Ochilish vaqti yopilishdan oldin bo'lishi kerak!");
    return;
  }

  const btn = document.getElementById("saveVaqtBtn");
  btn.disabled = true;
  btn.textContent = "Saqlanmoqda...";

  try {
    await fetch(DB + "/ishVaqti.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: openHour, close: closeHour, isActive })
    });

    updateStatusBadge(openHour, closeHour, isActive);
    showToast(`✅ Saqlandi! Ish vaqti: ${openHour}:00 — ${closeHour}:00`);

  } catch(err) {
    console.log("Saqlashda xatolik:", err);
    showToast("❌ Xatolik yuz berdi!");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Saqlash";
  }
};

// ══════════════════════════════
//  START
// ══════════════════════════════
loadOrders();
loadComments();
loadWorkHours();

// Buyurtmalar har 2 sekundda yangilanadi
setInterval(loadOrders, 2000);

// Izoxlar har 10 sekundda yangilanadi
setInterval(loadComments, 10000);