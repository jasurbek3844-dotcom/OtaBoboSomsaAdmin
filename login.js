const DB = "https://somsa-c5ae4-default-rtdb.firebaseio.com";
const btn = document.querySelector(".bbtn");

let currentOrderId = null;
let statusTimer = null;

// ══════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════
const zakazDiv   = document.querySelector(".zakaz1");
const dastavkaDiv = document.querySelector(".dastavka1");
const zakazBtn   = document.querySelector(".zakaz");
const dastavkaBtn = document.querySelector(".dastavka");

let activeTab = "zakaz"; // default

dastavkaBtn.addEventListener("click", () => {
  activeTab = "dastavka";
  dastavkaDiv.style.display = "block";
  zakazDiv.style.display = "none";
  btn.textContent = "Dastavka Qilish →";
  dastavkaBtn.style.color = "var(--saffron)";
  zakazBtn.style.color = "black";
});

zakazBtn.addEventListener("click", () => {
  activeTab = "zakaz";
  dastavkaDiv.style.display = "none";
  zakazDiv.style.display = "block";
  btn.textContent = "Zakaz Qilish →";
  zakazBtn.style.color = "var(--saffron)";
  dastavkaBtn.style.color = "black";
});

// ══════════════════════════════
//  TUGMA CLICK
// ══════════════════════════════
btn.addEventListener("click", async function () {
  if (activeTab === "zakaz") {
    await submitZakaz();
  } else {
    await submitDastavka();
  }
});

// ══════════════════════════════
//  XONA ZAKAZI
// ══════════════════════════════
async function submitZakaz() {
  const ismInput  = document.querySelector("#zak .input-Som-Ism");
  const sonInput  = document.querySelector("#zak .input-Som-Son");
  const xonaInput = document.querySelector("#zak .input-Som-Xon");

  const ism  = ismInput.value.trim();
  const son  = sonInput.value.trim();
  const xona = xonaInput.value.trim();

  if (!ism || !son || !xona) {
    showToast("⚠️ Barcha maydonlarni to'ldiring!", "#e65100");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Yuborilmoqda...";

  const order = {
    tur: "zakaz",
    ism,
    son: Number(son),
    xona: Number(xona),
    status: "pending",
    vaqt: new Date().toISOString()
  };

  try {
    const res  = await fetch(DB + "/buyurtmalar.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await res.json();
    currentOrderId = data.name;

    btn.textContent = "✅ Yuborildi!";
    showToast("🫓 Buyurtmangiz yuborildi! Admin tasdiqlashini kuting...", "#1565c0", 6000);

    watchStatus(() => {
      showNotification(ism, son, xona + "-xona");
      ismInput.value = "";
      sonInput.value = "";
      xonaInput.value = "";
    });

  } catch (err) {
    console.log("Zakaz xatolik:", err);
    showToast("❌ Xatolik yuz berdi!", "crimson");
    resetBtn("Zakaz Qilish →");
  }
}

// ══════════════════════════════
//  DASTAVKA ZAKAZI
// ══════════════════════════════
async function submitDastavka() {
  const ismInput     = document.querySelector("#das .das-ism");
  const telefonInput = document.querySelector("#das .das-telefon");
  const sonInput     = document.querySelector("#das .das-son");
  const manzilInput  = document.querySelector("#das .das-manzil");

  const ism     = ismInput.value.trim();
  const telefon = telefonInput.value.trim();
  const son     = sonInput.value.trim();
  const manzil  = manzilInput.value.trim();

  if (!ism || !telefon || !son || !manzil) {
    showToast("⚠️ Barcha maydonlarni to'ldiring!", "#e65100");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Yuborilmoqda...";

  const order = {
    tur: "dastavka",
    ism,
    telefon,
    son: Number(son),
    manzil,
    status: "pending",
    vaqt: new Date().toISOString()
  };

  try {
    const res  = await fetch(DB + "/buyurtmalar.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await res.json();
    currentOrderId = data.name;

    btn.textContent = "✅ Yuborildi!";
    showToast("🛵 Dastavka zakazingiz yuborildi!", "#1565c0", 6000);

    watchStatus(() => {
      showNotification(ism, son, manzil);
      ismInput.value = "";
      telefonInput.value = "";
      sonInput.value = "";
      manzilInput.value = "";
    });

  } catch (err) {
    console.log("Dastavka xatolik:", err);
    showToast("❌ Xatolik yuz berdi!", "crimson");
    resetBtn("Dastavka Qilish →");
  }
}

// ══════════════════════════════
//  STATUS KUZATISH
// ══════════════════════════════
function watchStatus(onAccepted) {
  if (statusTimer) clearInterval(statusTimer);

  statusTimer = setInterval(async function () {
    try {
      const res    = await fetch(DB + "/buyurtmalar/" + currentOrderId + "/status.json");
      const status = await res.json();

      if (status === "accepted") {
        clearInterval(statusTimer);
        onAccepted();
        resetBtn(activeTab === "zakaz" ? "Zakaz Qilish →" : "Dastavka Qilish →");
      }

      if (status === "rejected") {
        clearInterval(statusTimer);
        showToast("❌ Zakazingiz rad etildi", "crimson", 5000);
        resetBtn(activeTab === "zakaz" ? "Zakaz Qilish →" : "Dastavka Qilish →");
      }

    } catch (err) {
      console.log("Status tekshirishda xatolik:", err);
    }
  }, 2000);
}

function resetBtn(text) {
  btn.disabled = false;
  btn.textContent = text;
}

// ══════════════════════════════
//  NOTIFICATION
// ══════════════════════════════
function showNotification(ism, son, joy) {
  const old = document.getElementById("zakaz-notif");
  if (old) old.remove();

  const box = document.createElement("div");
  box.id = "zakaz-notif";
  box.style.cssText = `
    position: fixed; top: 24px; left: 50%;
    transform: translateX(-50%);
    z-index: 9999; background: #1b5e20; color: #fff;
    border-radius: 14px; padding: 18px 28px;
    font-family: Inter, sans-serif; font-size: 15px;
    font-weight: 500; box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    text-align: center; min-width: 300px;
  `;
  box.innerHTML = `
    <div style="font-size:32px;margin-bottom:8px">✅</div>
    <div style="font-size:17px;font-weight:700;margin-bottom:4px">Zakaz qabul qilindi!</div>
    <div style="font-size:13px;opacity:0.85">${ism} — ${son} ta somsa, ${joy}</div>
    <div style="font-size:12px;opacity:0.7;margin-top:6px">Tez orada yetkazib beramiz 🫓</div>
  `;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 8000);
}

// ══════════════════════════════
//  TOAST
// ══════════════════════════════
function showToast(msg, color = "#1A1208", duration = 3000) {
  const old = document.getElementById("toast-notif");
  if (old) old.remove();

  const t = document.createElement("div");
  t.id = "toast-notif";
  t.style.cssText = `
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%);
    background: ${color}; color: #fff;
    border-radius: 10px; padding: 12px 24px;
    font-family: Inter, sans-serif; font-size: 14px;
    font-weight: 500; z-index: 9999;
    box-shadow: 0 4px 18px rgba(0,0,0,0.18);
    white-space: nowrap;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ══════════════════════════════
//  IZOXLAR
// ══════════════════════════════
const textarea = document.querySelector(".izox-textarea");
const izoxInp  = document.querySelector(".izox-textarea-ism");
const izoxBtn  = document.querySelector(".izox-btn");
const izoxList = document.querySelector(".izoxlar-list");

function getInitial(name) {
  return name ? name.trim()[0].toUpperCase() : "?";
}

function createCard(key, item) {
  const card = document.createElement("div");
  card.classList.add("izox-card");
  card.setAttribute("id", key);
  card.innerHTML = `
    <div class="izox-header">
      <div class="izox-avatar">${getInitial(item.ism)}</div>
      <div class="izox-meta">
        <div class="izox-name">${item.ism}</div>
        <div class="izox-time">${item.timestamp
          ? new Date(item.timestamp).toLocaleString("uz-UZ", {
              day:"2-digit", month:"long", year:"numeric",
              hour:"2-digit", minute:"2-digit"
            })
          : ""
        }</div>
      </div>
    </div>
    <div class="izox-body">${item.comment}</div>
  `;
  return card;
}

function getData() {
  izoxList.innerHTML = "";
  fetch(DB + "/commentlar.json")
    .then(res => res.json())
    .then(data => {
      const malumotlar = data ? Object.entries(data).reverse() : [];
      if (malumotlar.length === 0) {
        izoxList.innerHTML = `
          <div class="izox-empty">
            <span class="izox-empty-icon">💬</span>
            <h3>Hali izox yo'q</h3>
            <p>Birinchi izoxni siz qoldiring!</p>
          </div>`;
        return;
      }
      malumotlar.forEach(([key, item]) => izoxList.appendChild(createCard(key, item)));
    })
    .catch(err => console.log(err, "error"));
}

izoxBtn.addEventListener("click", async () => {
  const comment    = textarea.value.trim();
  const commentIsm = izoxInp.value.trim();

  if (!comment || !commentIsm) {
    showToast("⚠️ Ism va izoxni to'ldiring!", "#e65100");
    return;
  }

  await fetch(DB + "/commentlar.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ism: commentIsm, comment, timestamp: Date.now() })
  });

  izoxInp.value = "";
  textarea.value = "";
  getData();
});

getData();

// ══════════════════════════════
//  ISH VAQTI
// ══════════════════════════════
async function checkWorkStatus() {
  try {
    const res  = await fetch(DB + "/ishVaqti.json");
    const data = await res.json();

    const open     = data?.open     ?? 4;
    const close    = data?.close    ?? 11;
    const isActive = data?.isActive ?? true;
    const now      = new Date().getHours();
    const isOpen   = isActive && now >= open && now < close;

    const old = document.getElementById("work-status");
    if (old) old.remove();

    const box = document.createElement("div");
    box.id = "work-status";
    box.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 999;
      background: ${isOpen ? "#1b5e20" : "#b71c1c"};
      color: #fff; border-radius: 12px; padding: 10px 18px;
      font-family: Inter, sans-serif; font-size: 13px; font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      display: flex; align-items: center; gap: 8px;
    `;
    box.innerHTML = isOpen
      ? `<span style="width:8px;height:8px;border-radius:50%;background:#4caf50;display:inline-block"></span> Ochiq — ${open}:00 dan ${close}:00 gacha`
      : `<span style="width:8px;height:8px;border-radius:50%;background:#ef9a9a;display:inline-block"></span> ${isActive ? `Yopiq — ${open}:00 — ${close}:00` : "Hozircha yopiq"}`;

    document.body.appendChild(box);

    if (btn) {
      btn.disabled = !isOpen;
      if (!isOpen) {
        btn.textContent = "🕐 Yopiq";
        btn.style.opacity = "0.5";
        btn.style.cursor  = "not-allowed";
      } else {
        btn.textContent = activeTab === "zakaz" ? "Zakaz Qilish →" : "Dastavka Qilish →";
        btn.style.opacity = "1";
        btn.style.cursor  = "pointer";
      }
    }
  } catch(err) {
    console.log("Ish vaqti xatolik:", err);
  }
}

checkWorkStatus();
setInterval(checkWorkStatus, 60000);