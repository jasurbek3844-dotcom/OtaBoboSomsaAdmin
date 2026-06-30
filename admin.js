const DB = "https://somsa-c5ae4-default-rtdb.firebaseio.com";

// ══════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════
window.switchTab = function(tab, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");
  if (tab === "statistika") loadStatistika();
  if (tab === "narx") loadNarxlar();
  if (tab === "elon") loadElon();
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
//  BUYURTMALAR
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
  let filtered = currentFilter === "all" ? orders : orders.filter(o => o.status === currentFilter);
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
    btn.disabled = false;
    btn.textContent = "✔ Qabul qilish";
  }
};

window.deleteOrder = async function(id, btn) {
  if (!confirm("Bu zakazni o'chirishni tasdiqlaysizmi?")) return;
  btn.disabled = true;
  try {
    await fetch(DB + "/buyurtmalar/" + id + ".json", { method: "DELETE" });
    showToast("🗑️ Zakaz o'chirildi!");
    loadOrders();
  } catch (error) {
    btn.disabled = false;
  }
};

function showNotif(order) {
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
  try { new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3").play(); } catch(e) {}
}

// ══════════════════════════════
//  IZOXLAR
// ══════════════════════════════
async function loadComments() {
  try {
    const res = await fetch(DB + "/commentlar.json");
    const data = await res.json();
    const list = document.getElementById("commentsList");
    const countBadge = document.getElementById("commentCount");
    if (!data) {
      countBadge.textContent = "0";
      list.innerHTML = `<div class="empty"><span class="icon">💬</span>Hali hech qanday izox yo'q</div>`;
      return;
    }
    const entries = Object.entries(data).reverse();
    countBadge.textContent = entries.length;
    list.innerHTML = entries.map(([key, item]) => {
      const initial = item.ism ? item.ism.trim()[0].toUpperCase() : "?";
      const vaqt = item.timestamp
        ? new Date(item.timestamp).toLocaleString("uz-UZ", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })
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
    const card = document.getElementById("ccard-" + key);
    if (card) {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "translateX(20px)";
      setTimeout(() => card.remove(), 300);
    }
    showToast("🗑️ Izox o'chirildi");
    setTimeout(() => {
      const remaining = document.querySelectorAll(".ccard").length;
      document.getElementById("commentCount").textContent = remaining;
      if (remaining === 0) {
        document.getElementById("commentsList").innerHTML = `<div class="empty"><span class="icon">💬</span>Hali hech qanday izox yo'q</div>`;
      }
    }, 320);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "O'chirish";
    showToast("❌ Xatolik yuz berdi");
  }
};

// ══════════════════════════════
//  ISH VAQTI
// ══════════════════════════════
async function loadWorkHours() {
  try {
    const res = await fetch(DB + "/ishVaqti.json");
    const data = await res.json();
    const open   = data?.open   ?? 4;
    const close  = data?.close  ?? 11;
    const active = data?.isActive ?? true;
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
  const box    = document.getElementById("vaqtStatus");
  const text   = document.getElementById("vaqtStatusText");
  box.className = "vaqt-status " + (isOpen ? "open" : "closed");
  text.textContent = isOpen
    ? `Hozir OCHIQ — ${open}:00 dan ${close}:00 gacha`
    : active
      ? `Hozir YOPIQ — ish vaqti ${open}:00 — ${close}:00`
      : `Sayt to'xtatilgan (admin tomonidan yopiq)`;
}

document.getElementById("isActiveToggle").addEventListener("change", function() {
  updateToggleLabel(this.checked);
});

window.saveWorkHours = async function() {
  const openHour  = Number(document.getElementById("openHour").value);
  const closeHour = Number(document.getElementById("closeHour").value);
  const isActive  = document.getElementById("isActiveToggle").checked;
  if (isNaN(openHour) || isNaN(closeHour) || openHour < 0 || closeHour > 23) {
    showToast("❌ Soat 0 dan 23 gacha bo'lishi kerak!"); return;
  }
  if (openHour >= closeHour) {
    showToast("❌ Ochilish vaqti yopilishdan oldin bo'lishi kerak!"); return;
  }
  const btn = document.getElementById("saveVaqtBtn");
  btn.disabled = true; btn.textContent = "Saqlanmoqda...";
  try {
    await fetch(DB + "/ishVaqti.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: openHour, close: closeHour, isActive })
    });
    updateStatusBadge(openHour, closeHour, isActive);
    showToast(`✅ Saqlandi! Ish vaqti: ${openHour}:00 — ${closeHour}:00`);
  } catch(err) {
    showToast("❌ Xatolik yuz berdi!");
  } finally {
    btn.disabled = false; btn.textContent = "💾 Saqlash";
  }
};

// ══════════════════════════════
//  NARXLAR
// ══════════════════════════════

// Default somsa turlari
const DEFAULT_NARXLAR = [
  { id: "goshtli", nom: "Go'shtli somsa", icon: "🫓" },
];

let narxlarData = {};

async function loadNarxlar() {
  try {
    const res = await fetch(DB + "/narxlar.json");
    const data = await res.json();
    narxlarData = data || {};
    renderNarxlar();
  } catch(err) {
    console.log("Narxlarni yuklashda xatolik:", err);
    renderNarxlar();
  }
}

function renderNarxlar() {
  const grid = document.getElementById("narxGrid");
  grid.innerHTML = DEFAULT_NARXLAR.map(item => {
    const narx = narxlarData[item.id] ?? 0;
    return `
      <div class="narx-card">
        <div class="narx-icon">${item.icon}</div>
        <div class="narx-info">
          <div class="narx-name">${item.nom}</div>
          <div class="narx-input-wrap">
            <input class="narx-input" type="number" min="0" id="narx_${item.id}" value="${narx}" placeholder="0">
            <span class="narx-unit">so'm</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.saveNarxlar = async function() {
  const newNarxlar = {};
  DEFAULT_NARXLAR.forEach(item => {
    const val = Number(document.getElementById("narx_" + item.id).value);
    newNarxlar[item.id] = val;
  });
  const btn = document.querySelector(".save-narx-btn");
  btn.disabled = true; btn.textContent = "Saqlanmoqda...";
  try {
    await fetch(DB + "/narxlar.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNarxlar)
    });
    narxlarData = newNarxlar;
    showToast("✅ Narxlar saqlandi!");
  } catch(err) {
    showToast("❌ Xatolik yuz berdi!");
  } finally {
    btn.disabled = false; btn.textContent = "💾 Narxlarni saqlash";
  }
};

// ══════════════════════════════
//  E'LON
// ══════════════════════════════
async function loadElon() {
  try {
    const res = await fetch(DB + "/elon.json");
    const data = await res.json();
    if (data && data.title) {
      document.getElementById("elonTitle").value = data.title || "";
      document.getElementById("elonText").value  = data.text  || "";
      document.getElementById("elonTur").value   = data.tur   || "aksiya";
      showElonPreview(data);
    }
  } catch(err) {
    console.log("E'lonni yuklashda xatolik:", err);
  }
}

function showElonPreview(data) {
  if (!data || !data.title) {
    document.getElementById("elonPreview").style.display = "none";
    return;
  }
  const icons = { aksiya: "🔥 Aksiya", yangi: "✨ Yangilik", xabar: "📢 Xabar" };
  const badge = document.getElementById("elonBadge");
  badge.textContent = icons[data.tur] || "📢 Xabar";
  badge.className = "elon-badge " + (data.tur || "xabar");
  document.getElementById("elonPreviewText").textContent = data.title + (data.text ? " — " + data.text : "");
  document.getElementById("elonPreview").style.display = "block";
}

window.saveElon = async function() {
  const title = document.getElementById("elonTitle").value.trim();
  const text  = document.getElementById("elonText").value.trim();
  const tur   = document.getElementById("elonTur").value;
  if (!title) { showToast("⚠️ Sarlavhani kiriting!"); return; }
  const btn = document.querySelector(".save-elon-btn");
  btn.disabled = true; btn.textContent = "Saqlanmoqda...";
  try {
    const elon = { title, text, tur, vaqt: new Date().toISOString() };
    await fetch(DB + "/elon.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(elon)
    });
    showElonPreview(elon);
    showToast("📣 E'lon chiqarildi!");
  } catch(err) {
    showToast("❌ Xatolik yuz berdi!");
  } finally {
    btn.disabled = false; btn.textContent = "📣 E'lonni chiqarish";
  }
};

window.deleteElon = async function() {
  if (!confirm("E'lonni o'chirishni tasdiqlaysizmi?")) return;
  const btn = document.querySelector(".del-elon-btn");
  btn.disabled = true;
  try {
    await fetch(DB + "/elon.json", { method: "DELETE" });
    document.getElementById("elonTitle").value = "";
    document.getElementById("elonText").value  = "";
    document.getElementById("elonPreview").style.display = "none";
    showToast("🗑️ E'lon o'chirildi!");
  } catch(err) {
    showToast("❌ Xatolik yuz berdi!");
  } finally {
    btn.disabled = false;
  }
};

// ══════════════════════════════
//  STATISTIKA
// ══════════════════════════════
async function loadStatistika() {
  try {
    const res  = await fetch(DB + "/buyurtmalar.json");
    const data = await res.json();

    if (!data) {
      renderEmptyStats();
      return;
    }

    const allOrders = Object.values(data);
    const now       = new Date();
    const todayStr  = now.toDateString();

    // Asosiy raqamlar
    const jami     = allOrders.length;
    const bugun    = allOrders.filter(o => o.vaqt && new Date(o.vaqt).toDateString() === todayStr).length;
    const dastavka = allOrders.filter(o => o.tur === "dastavka").length;
    const xona     = allOrders.filter(o => o.tur === "zakaz").length;

    document.getElementById("statJami").textContent    = jami;
    document.getElementById("statBugun").textContent   = bugun;
    document.getElementById("statDastavka").textContent = dastavka;
    document.getElementById("statXona").textContent    = xona;

    // Tur foizlari
    const zakazPct    = jami > 0 ? Math.round((xona / jami) * 100) : 50;
    const dastavkaPct = jami > 0 ? 100 - zakazPct : 50;
    document.getElementById("zakazBar").style.width    = zakazPct + "%";
    document.getElementById("dastavkaBar").style.width = dastavkaPct + "%";
    document.getElementById("zakazPct").textContent    = zakazPct + "%";
    document.getElementById("dastavkaPct").textContent = dastavkaPct + "%";

    // So'nggi 7 kun grafigi
    const days7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const count  = allOrders.filter(o => o.vaqt && new Date(o.vaqt).toDateString() === dayStr).length;
      const label  = i === 0 ? "Bugun" : d.toLocaleDateString("uz-UZ", { weekday: "short" });
      days7.push({ label, count });
    }
    const maxDay = Math.max(...days7.map(d => d.count), 1);
    document.getElementById("barChart").innerHTML = days7.map(d => `
      <div class="bar-item">
        <div class="bar-val">${d.count}</div>
        <div class="bar-fill" style="height:${Math.round((d.count / maxDay) * 140) + 4}px"></div>
        <div class="bar-label">${d.label}</div>
      </div>
    `).join("");

    // Soatlik grafik (0-23)
    const hourCounts = new Array(24).fill(0);
    allOrders.forEach(o => {
      if (o.vaqt) {
        const h = new Date(o.vaqt).getHours();
        hourCounts[h]++;
      }
    });
    const maxHour = Math.max(...hourCounts, 1);
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    document.getElementById("hourChart").innerHTML = hourCounts.map((count, h) => `
      <div class="hour-item">
        <div class="hour-fill ${h === peakHour ? 'peak' : ''}" style="height:${Math.round((count / maxHour) * 140) + 2}px"></div>
        <div class="hour-label">${h}:00</div>
      </div>
    `).join("");

    // Top 4 faol soatlar
    const sortedHours = hourCounts
      .map((count, h) => ({ h, count }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const medals = ["🥇", "🥈", "🥉", "4️⃣"];
    document.getElementById("topHoursList").innerHTML = sortedHours.length > 0
      ? sortedHours.map((item, i) => `
          <div class="top-hour-row">
            <span class="top-hour-time">${medals[i]} ${item.h}:00 — ${item.h + 1}:00</span>
            <span class="top-hour-count">${item.count} buyurtma</span>
            <span class="top-hour-badge">${i === 0 ? "Eng faol" : ""}</span>
          </div>
        `).join("")
      : `<div style="color:#C4B49A;font-size:14px;text-align:center;padding:20px">Ma'lumot yo'q</div>`;

  } catch(err) {
    console.log("Statistika xatolik:", err);
  }
}

function renderEmptyStats() {
  ["statJami","statBugun","statDastavka","statXona"].forEach(id => {
    document.getElementById(id).textContent = "0";
  });
  document.getElementById("barChart").innerHTML = `<div style="color:#C4B49A;font-size:14px;margin:auto">Ma'lumot yo'q</div>`;
  document.getElementById("hourChart").innerHTML = "";
  document.getElementById("topHoursList").innerHTML = `<div style="color:#C4B49A;font-size:14px;text-align:center;padding:20px">Hali buyurtma yo'q</div>`;
}

// ══════════════════════════════
//  START
// ══════════════════════════════
loadOrders();
loadComments();
loadWorkHours();
setInterval(loadOrders, 2000);
setInterval(loadComments, 10000);
