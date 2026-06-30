const DB = "https://somsa-c5ae4-default-rtdb.firebaseio.com";
const btn = document.querySelector(".bbtn");

let currentOrderId = null;
let statusTimer = null;

// ══════════════════════════════
//  E'LON BANNER
// ══════════════════════════════
// E'lon uchun animatsiya CSS
(function() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();

async function loadElon() {
  try {
    const res  = await fetch(DB + "/elon.json");
    const data = await res.json();
    if (!data || !data.title) return;
    const icons  = { aksiya:"🔥", yangi:"✨", xabar:"📢" };
    const colors = {
      aksiya: { bg:"#fff8e1", border:"#ffcc80", color:"#e65100" },
      yangi:  { bg:"#e8f5e9", border:"#a5d6a7", color:"#2e7d32" },
      xabar:  { bg:"#e3f2fd", border:"#90caf9", color:"#1565c0" },
    };
    const style = colors[data.tur] || colors.xabar;
    const icon  = icons[data.tur]  || "📢";
    const banner = document.createElement("div");
    banner.id = "elon-banner";
    banner.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;z-index:998;
      background:${style.bg};border-top:2px solid ${style.border};
      padding:12px 24px;display:flex;align-items:center;gap:12px;
      font-family:'Inter',sans-serif;
      box-shadow:0 -4px 20px rgba(0,0,0,0.1);
      animation:slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1);
    `;
    banner.innerHTML = `
      <span style="font-size:20px;flex-shrink:0">${icon}</span>
      <div style="flex:1">
        <span style="font-size:14px;font-weight:700;color:${style.color}">${data.title}</span>
        ${data.text ? `<span style="font-size:13px;color:#6B5A44;margin-left:8px">${data.text}</span>` : ""}
      </div>
      <button onclick="document.getElementById('elon-banner').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#9C8268;padding:4px 8px;flex-shrink:0">✕</button>
    `;
    // Body ga qo'shamiz (sticky bottom)
    document.body.appendChild(banner);
    // Body pastiga joy berish
    document.body.style.paddingBottom = "60px";
  } catch(err) { console.log("E'lon xatolik:", err); }
}

// ══════════════════════════════
//  NARX KO'RSATISH
// ══════════════════════════════
const DEFAULT_NARXLAR_NOMI = {
  goshtli:"Go'shtli somsa"
};

async function loadNarxlar() {
  try {
    const res  = await fetch(DB + "/narxlar.json");
    const data = await res.json();
    if (!data) return;
    const existing = document.getElementById("narx-panel");
    if (existing) existing.remove();
    const panel = document.createElement("div");
    panel.id = "narx-panel";
    panel.style.cssText = `background:#fff;border-radius:12px;padding:20px 22px;box-shadow:0 2px 12px rgba(26,18,8,0.07);margin-bottom:16px;font-family:'Inter',sans-serif;`;
    panel.innerHTML = `
      <div style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9C8268;margin-bottom:14px">💰 Narxlar</div>
      ${Object.entries(data).map(([id, narx]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F0E8D8">
          <span style="font-size:14px;color:#4A3F2F">🫓 ${DEFAULT_NARXLAR_NOMI[id] || id}</span>
          <span style="font-size:15px;font-weight:700;color:#8B3A1C">${Number(narx).toLocaleString()} so'm</span>
        </div>`).join("")}`;
    const formCard = document.getElementById("form");
    if (formCard) formCard.insertAdjacentElement("beforebegin", panel);
  } catch(err) { console.log("Narxlarni yuklashda xatolik:", err); }
}

// ══════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════
const zakazDiv    = document.querySelector(".zakaz1");
const dastavkaDiv = document.querySelector(".dastavka1");
const zakazBtn    = document.querySelector(".zakaz");
const dastavkaBtn = document.querySelector(".dastavka");
let activeTab = "zakaz";

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
//  BUYURTMA YUBORISH
// ══════════════════════════════
btn.addEventListener("click", async function () {
  if (activeTab === "zakaz") await submitZakaz();
  else await submitDastavka();
});

async function submitZakaz() {
  const ismInput  = document.querySelector("#zak .input-Som-Ism");
  const sonInput  = document.querySelector("#zak .input-Som-Son");
  const xonaInput = document.querySelector("#zak .input-Som-Xon");
  const ism = ismInput.value.trim(), son = sonInput.value.trim(), xona = xonaInput.value.trim();
  if (!ism || !son || !xona) { showToast("⚠️ Barcha maydonlarni to'ldiring!", "#e65100"); return; }
  btn.disabled = true; btn.textContent = "Yuborilmoqda...";
  const order = { tur:"zakaz", ism, son:Number(son), xona:Number(xona), status:"pending", vaqt:new Date().toISOString() };
  try {
    const res  = await fetch(DB + "/buyurtmalar.json", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(order) });
    const data = await res.json();
    currentOrderId = data.name;
    btn.textContent = "✅ Yuborildi!";
    showToast("🫓 Buyurtmangiz yuborildi! Admin tasdiqlashini kuting...", "#1565c0", 6000);
    watchStatus(() => { showNotification(ism, son, xona+"-xona"); ismInput.value=""; sonInput.value=""; xonaInput.value=""; });
  } catch(err) { showToast("❌ Xatolik yuz berdi!", "crimson"); resetBtn("Zakaz Qilish →"); }
}

async function submitDastavka() {
  const ismInput=document.querySelector("#das .das-ism"), telefonInput=document.querySelector("#das .das-telefon");
  const sonInput=document.querySelector("#das .das-son"), manzilInput=document.querySelector("#das .das-manzil");
  const ism=ismInput.value.trim(), telefon=telefonInput.value.trim(), son=sonInput.value.trim(), manzil=manzilInput.value.trim();
  if (!ism||!telefon||!son||!manzil) { showToast("⚠️ Barcha maydonlarni to'ldiring!", "#e65100"); return; }
  btn.disabled=true; btn.textContent="Yuborilmoqda...";
  const order={tur:"dastavka",ism,telefon,son:Number(son),manzil,status:"pending",vaqt:new Date().toISOString()};
  try {
    const res=await fetch(DB+"/buyurtmalar.json",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(order)});
    const data=await res.json(); currentOrderId=data.name;
    btn.textContent="✅ Yuborildi!";
    showToast("🛵 Dastavka zakazingiz yuborildi!","#1565c0",6000);
    watchStatus(()=>{ showNotification(ism,son,manzil); ismInput.value=""; telefonInput.value=""; sonInput.value=""; manzilInput.value=""; });
  } catch(err) { showToast("❌ Xatolik yuz berdi!","crimson"); resetBtn("Dastavka Qilish →"); }
}

function watchStatus(onAccepted) {
  if (statusTimer) clearInterval(statusTimer);
  statusTimer = setInterval(async function() {
    try {
      const res=await fetch(DB+"/buyurtmalar/"+currentOrderId+"/status.json");
      const status=await res.json();
      if (status==="accepted") { clearInterval(statusTimer); onAccepted(); resetBtn(activeTab==="zakaz"?"Zakaz Qilish →":"Dastavka Qilish →"); }
      if (status==="rejected") { clearInterval(statusTimer); showToast("❌ Zakazingiz rad etildi","crimson",5000); resetBtn(activeTab==="zakaz"?"Zakaz Qilish →":"Dastavka Qilish →"); }
    } catch(err) {}
  }, 2000);
}
function resetBtn(text) { btn.disabled=false; btn.textContent=text; }

function showNotification(ism,son,joy) {
  const old=document.getElementById("zakaz-notif"); if(old) old.remove();
  const box=document.createElement("div"); box.id="zakaz-notif";
  box.style.cssText=`position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:9999;background:#1b5e20;color:#fff;border-radius:14px;padding:18px 28px;font-family:Inter,sans-serif;font-size:15px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.22);text-align:center;min-width:300px;`;
  box.innerHTML=`<div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-size:17px;font-weight:700;margin-bottom:4px">Zakaz qabul qilindi!</div><div style="font-size:13px;opacity:0.85">${ism} — ${son} ta somsa, ${joy}</div><div style="font-size:12px;opacity:0.7;margin-top:6px">Tez orada yetkazib beramiz 🫓</div>`;
  document.body.appendChild(box);
  setTimeout(()=>box.remove(), 8000);
}

function showToast(msg,color="#1A1208",duration=3000) {
  const old=document.getElementById("toast-notif"); if(old) old.remove();
  const t=document.createElement("div"); t.id="toast-notif";
  t.style.cssText=`position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:${color};color:#fff;border-radius:10px;padding:12px 24px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 4px 18px rgba(0,0,0,0.18);white-space:nowrap;`;
  t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), duration);
}

// ══════════════════════════════
//  IZOX + REYTING (birlashgan)
// ══════════════════════════════
let selectedStar = 0;

window.selectStar = function(n) {
  selectedStar = n;
  const labels = ["","Yomon 😞","Qoniqarsiz 😕","Yaxshi 🙂","Zo'r 😊","Ajoyib! 🤩"];
  const starLabel = document.getElementById("star-label");
  if (starLabel) starLabel.textContent = labels[n];
  document.querySelectorAll("#star-selector span").forEach((s,i) => {
    s.textContent = i < n ? "⭐" : "☆";
    s.style.transform = i < n ? "scale(1.15)" : "scale(1)";
  });
};

function getInitial(name) { return name ? name.trim()[0].toUpperCase() : "?"; }

// Izox kartasini yaratish — yulduz bilan
function createCard(key, item) {
  const card = document.createElement("div");
  card.classList.add("izox-card");
  card.setAttribute("id", key);
  const starsHtml = item.baho
    ? `<div style="display:flex;gap:2px;margin-top:6px">${"⭐".repeat(item.baho)}${"☆".repeat(5-item.baho)}</div>`
    : "";
  card.innerHTML = `
    <div class="izox-header">
      <div class="izox-avatar">${getInitial(item.ism)}</div>
      <div class="izox-meta">
        <div class="izox-name">${item.ism || "Anonim"}${starsHtml}</div>
        <div class="izox-time">${item.timestamp
          ? new Date(item.timestamp).toLocaleString("uz-UZ",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})
          : ""}</div>
      </div>
    </div>
    <div class="izox-body">${item.comment}</div>`;
  return card;
}

// O'rtacha reyting badge (izoxlar sarlavhasi yonida)
async function loadReytingBadge() {
  try {
    const res  = await fetch(DB + "/commentlar.json");
    const data = await res.json();
    if (!data) return;
    const baholar = Object.values(data).map(r => r.baho).filter(Boolean);
    if (!baholar.length) return;
    const ort = (baholar.reduce((a,b)=>a+b,0)/baholar.length).toFixed(1);
    const badge = document.getElementById("reyting-badge");
    if (badge) {
      badge.textContent = `⭐ ${ort} / 5`;
      badge.style.display = "inline-block";
    }
  } catch(err) {}
}

function getData() {
  const izoxList = document.querySelector(".izoxlar-list");
  if (!izoxList) return;
  izoxList.innerHTML = "";
  fetch(DB + "/commentlar.json")
    .then(res => res.json())
    .then(data => {
      const malumotlar = data ? Object.entries(data).reverse() : [];
      if (!malumotlar.length) {
        izoxList.innerHTML = `<div class="izox-empty"><span class="izox-empty-icon">💬</span><h3>Hali izox yo'q</h3><p>Birinchi izoxni siz qoldiring!</p></div>`;
        return;
      }
      malumotlar.forEach(([key, item]) => izoxList.appendChild(createCard(key, item)));
      loadReytingBadge();
    })
    .catch(err => console.log(err));
}

// Izox + yulduz birgalikda yuborish
function setupIzoxForm() {
  // Yulduz tanlash formaga qo'shamiz
  const izoxFormDiv = document.querySelector(".izox-form");
  if (!izoxFormDiv) return;

  // Yulduzcha qatorini yaratish (tugmadan oldin, textareadan keyin)
  const starRow = document.createElement("div");
  starRow.style.cssText = "margin-bottom:16px;";
  starRow.innerHTML = `
    <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#1A1208;margin-bottom:8px">Baho (ixtiyoriy)</div>
    <div id="star-selector" style="display:flex;gap:6px;margin-bottom:4px">
      ${[1,2,3,4,5].map(i=>`<span data-star="${i}" onclick="selectStar(${i})" style="font-size:28px;cursor:pointer;transition:transform 0.15s;user-select:none">☆</span>`).join("")}
    </div>
    <div id="star-label" style="font-size:12px;color:#C4B49A;height:16px;"></div>`;

  const formFooter = izoxFormDiv.querySelector(".form-footer");
  if (formFooter) izoxFormDiv.insertBefore(starRow, formFooter);

  // Yuborish tugmasini ulash
  const izoxBtn = document.getElementById("izoxBtn");
  const textarea = document.getElementById("izoxText");
  const izoxInp  = document.getElementById("izoxTextism");
  if (!izoxBtn) return;

  izoxBtn.addEventListener("click", async () => {
    const comment = textarea.value.trim();
    const ism     = izoxInp.value.trim();
    if (!comment || !ism) { showToast("⚠️ Ism va izoxni to'ldiring!", "#e65100"); return; }

    izoxBtn.disabled = true; izoxBtn.textContent = "Yuborilmoqda...";
    try {
      await fetch(DB + "/commentlar.json", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ism, comment, baho: selectedStar || null, timestamp: Date.now() })
      });
      izoxInp.value = ""; textarea.value = "";
      selectedStar = 0;
      document.querySelectorAll("#star-selector span").forEach(s => { s.textContent="☆"; s.style.transform="scale(1)"; });
      const lbl = document.getElementById("star-label"); if(lbl) lbl.textContent="";
      getData();
      showToast("✅ Izoxingiz yuborildi!", "#2e7d32");
    } catch(err) {
      showToast("❌ Xatolik yuz berdi!", "crimson");
    } finally {
      izoxBtn.disabled = false; izoxBtn.textContent = "Izoxni yuborish";
    }
  });
}

// O'rtacha reyting badge ni sarlavhaga qo'shish
function addReytingBadgeToHeader() {
  const sectionTitle = document.querySelector("#izoxlar .section-title");
  if (!sectionTitle) return;
  const badge = document.createElement("span");
  badge.id = "reyting-badge";
  badge.style.cssText = `display:none;margin-left:12px;background:#fff8e1;color:#C8860A;border:1px solid #ffcc80;border-radius:20px;padding:3px 12px;font-size:14px;font-weight:600;vertical-align:middle;`;
  sectionTitle.appendChild(badge);
}

// ══════════════════════════════
//  ISH VAQTI
// ══════════════════════════════
async function checkWorkStatus() {
  try {
    const res=await fetch(DB+"/ishVaqti.json"); const data=await res.json();
    const open=data?.open??4, close=data?.close??11, isActive=data?.isActive??true;
    const now=new Date().getHours(), isOpen=isActive&&now>=open&&now<close;
    const old=document.getElementById("work-status"); if(old) old.remove();
    const box=document.createElement("div"); box.id="work-status";
    box.style.cssText=`position:fixed;top:70px;right:20px;z-index:999;background:${isOpen?"#1b5e20":"#b71c1c"};color:#fff;border-radius:12px;padding:10px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;`;
    box.innerHTML=isOpen
      ?`<span style="width:8px;height:8px;border-radius:50%;background:#4caf50;display:inline-block"></span> Ochiq — ${open}:00 dan ${close}:00 gacha`
      :`<span style="width:8px;height:8px;border-radius:50%;background:#ef9a9a;display:inline-block"></span> ${isActive?`Yopiq — ${open}:00 — ${close}:00`:"Hozircha yopiq"}`;
    document.body.appendChild(box);
    if (btn) {
      btn.disabled=!isOpen;
      if (!isOpen) { btn.textContent="🕐 Yopiq"; btn.style.opacity="0.5"; btn.style.cursor="not-allowed"; }
      else { btn.textContent=activeTab==="zakaz"?"Zakaz Qilish →":"Dastavka Qilish →"; btn.style.opacity="1"; btn.style.cursor="pointer"; }
    }
  } catch(err) {}
}

// ══════════════════════════════
//  START
// ══════════════════════════════
loadElon();
loadNarxlar();
addReytingBadgeToHeader();
setupIzoxForm();
getData();
checkWorkStatus();
setInterval(checkWorkStatus, 60000);
