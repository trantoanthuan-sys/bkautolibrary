/**
 * script.js — Thư viện Kỹ thuật Hộp số U340E
 * SPA + Dynamic Section Loading (fetch)
 * ĐH Bách Khoa TP.HCM — Khoa Cơ khí Động lực
 *
 * Kiến trúc file:
 *   index.html          → Shell chung (header, dashboard, sidebar khung)
 *   sections/
 *     section-1.html    → Kết cấu hộp số U340E
 *     section-2.html    → Hệ thống Điều khiển & Thủy lực
 *     section-3.html    → Nguyên lý làm việc
 *     section-4.html    → Quy trình tháo lắp
 *     section-5.html    → Chẩn đoán lỗi & Bảo dưỡng
 *
 * Luồng: click card → fetch() file section → inject #content-body → show panel
 * Cache: file đã fetch được lưu lại, không tải lại lần thứ hai.
 */

"use strict";

/* =====================================================
   1. DATA — Cấu trúc danh mục
   ► Chỉnh sửa label / icon tại đây khi cần
===================================================== */
const SECTIONS = [
  {
    id: 1,
    title: "Kết cấu hộp số U340E",
    icon: "fa-solid fa-cubes",
    color: "var(--primary)",
    iconBg: "#E8F0FB",
    file: "sections/section-1.html",   // ← đường dẫn tới file nội dung
    subs: [
      { sub: "1.1", label: "Kết cấu chung",                                      icon: "fa-solid fa-drafting-compass" },
      { sub: "1.2", label: "Biến mô thủy lực",                                   icon: "fa-solid fa-circle-nodes"     },
      { sub: "1.3", label: "Bơm dầu thủy lực",                                   icon: "fa-solid fa-droplet"          },
      { sub: "1.4", label: "Bộ truyền bánh răng hành tinh",                      icon: "fa-solid fa-asterisk"         },
      { sub: "1.5", label: "Phần tử điều khiển: ly hợp - phanh - khớp 1 chiều", icon: "fa-solid fa-circle-dot"       },
    ],
  },
  {
    id: 2,
    title: "Hệ thống Điều khiển & Thủy lực",
    icon: "fa-solid fa-sliders",
    color: "#0277BD",
    iconBg: "#E1F5FE",
    file: "sections/section-2.html",
    subs: [
      { sub: "2.1", label: "Hệ Thống Điều Khiển Thủy Lực", icon: "fa-solid fa-water"     },
      { sub: "2.2", label: "Hệ Thống Điều Khiển Điện Tử",  icon: "fa-solid fa-microchip" },
    ],
  },
  {
    id: 3,
    title: "Nguyên lý Làm việc",
    icon: "fa-solid fa-gears",
    color: "#00796B",
    iconBg: "#E0F2F1",
    file: "sections/section-3.html",
    subs: [
      { sub: "3.1", label: "Tay số 1 (D/3/2) và (L) — Khuếch đại mômen lớn nhất",       icon: "fa-solid fa-1"           },
      { sub: "3.2", label: "Tay số 2 (dải D/3 và dải 2) — Chuyển tiếp, cân bằng",       icon: "fa-solid fa-2"           },
      { sub: "3.3", label: "Tay số 3 (dải D/3) — Truyền gần trực tiếp",                 icon: "fa-solid fa-3"           },
      { sub: "3.4", label: "Tay số 4 OD (dải D) — Số truyền tăng, giảm tua máy",        icon: "fa-solid fa-4"           },
      { sub: "3.5", label: "Tay số lùi (R) — Đảo chiều quay đầu ra",                    icon: "fa-solid fa-rotate-left" },
      { sub: "3.6", label: "Tính toán tỉ số truyền các tay số",                          icon: "fa-solid fa-calculator"  },
    ],
  },
  {
    id: 4,
    title: "Quy trình Tháo lắp",
    icon: "fa-solid fa-screwdriver-wrench",
    color: "#6A1B9A",
    iconBg: "#F3E5F5",
    file: "sections/section-4.html",
    subs: [
      { sub: "4.1", label: "Quy trình Tháo", icon: "fa-solid fa-wrench" },
      { sub: "4.2", label: "Quy trình Lắp",  icon: "fa-solid fa-hammer" },
    ],
  },
  {
    id: 5,
    title: "Chẩn đoán Lỗi & Hướng Bảo dưỡng",
    icon: "fa-solid fa-triangle-exclamation",
    color: "var(--accent)",
    iconBg: "#FFF3E0",
    isAccent: true,
    file: "sections/section-5.html",
    subs: [
      { sub: "5.1", label: "Chẩn đoán & Bảo dưỡng", icon: "fa-solid fa-triangle-exclamation" },
    ],
  },
];

/* =====================================================
   2. CACHE — Lưu HTML đã fetch, tránh tải lại
===================================================== */
const sectionCache = new Map(); // Map<sectionId: number, html: string>

/* =====================================================
   3. STATE
===================================================== */
const state = {
  currentView:    "home",   // "home" | "detail"
  currentSection: null,     // 1–5
  currentSubIdx:  0,        // index trong mảng subs
};

/* =====================================================
   4. DOM REFERENCES
===================================================== */
const $ = id => document.getElementById(id);

const DOM = {
  body:            document.body,
  btnBack:         $("btn-back"),
  breadcrumbBar:   $("breadcrumb-bar"),
  bcCurrent:       $("bc-current"),
  mobileSubmenu:   $("mobile-submenu"),
  viewHome:        $("view-home"),
  viewDetail:      $("view-detail"),
  sidebarNav:      $("sidebar-nav"),
  contentIconWrap: $("content-icon-wrap"),
  sectionLabel:    $("content-section-label"),
  contentTitle:    $("content-title"),
  contentBody:     $("content-body"),
  btnPrev:         $("btn-prev"),
  btnNext:         $("btn-next"),
  subnavIndicator: $("subnav-indicator"),
  toast:           $("toast"),
};

/* =====================================================
   5. FETCH & INJECT SECTION CONTENT
===================================================== */

/**
 * Tải file section HTML, inject vào #content-body.
 * Dùng cache để tránh fetch lại lần hai.
 */
async function loadSectionContent(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return;

  showLoading(true);

  try {
    let html;

    if (sectionCache.has(sectionId)) {
      // Lấy từ cache — không cần fetch lại
      html = sectionCache.get(sectionId);
    } else {
      // Fetch file section từ thư mục sections/
      const res = await fetch(section.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
      sectionCache.set(sectionId, html);  // lưu vào cache
    }

    // Inject HTML (giữ lại loading div ở trên)
    DOM.contentBody.innerHTML =
      `<div class="section-loading" id="section-loading" style="display:none"></div>` +
      html;

  } catch (err) {
    console.error("[U340E] Lỗi tải section:", err);
    DOM.contentBody.innerHTML = `
      <div class="section-loading" id="section-loading" style="display:none"></div>
      <div class="placeholder-block" style="border-color:#ffcc80;background:#fffbf6;margin-top:1rem">
        <i class="fa-solid fa-circle-exclamation placeholder-icon" style="color:var(--accent)"></i>
        <h4 style="color:var(--accent-dark)">Không thể tải nội dung</h4>
        <p class="placeholder-hint">
          ⚠️ Không tìm thấy <strong>${section.file}</strong>.<br>
          Kiểm tra thư mục <code>sections/</code> nằm cùng cấp với <code>index.html</code>.
        </p>
      </div>`;
    showToast("⚠️ Không tải được section " + sectionId);
  }

  showLoading(false);
}

/** Hiện / ẩn loading spinner */
function showLoading(visible) {
  const el = $("section-loading");
  if (el) el.style.display = visible ? "flex" : "none";
}

/* =====================================================
   6. VIEW TRANSITIONS
===================================================== */

/**
 * Mở section: chuyển view → fetch nội dung → kích hoạt panel đầu
 */
async function openSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return;

  state.currentSection = sectionId;
  state.currentSubIdx  = 0;

  // Hiện header elements
  DOM.breadcrumbBar.style.display = "flex";
  DOM.btnBack.style.display       = "flex";
  DOM.body.classList.add("in-detail");
  DOM.bcCurrent.textContent = section.title;

  // Render sidebar & mobile menu ngay (không cần chờ fetch)
  renderSidebar(section);
  renderMobileSubmenu(section);

  // Chuyển sang view Detail
  switchView("detail");

  // Fetch nội dung section từ file
  await loadSectionContent(sectionId);

  // Kích hoạt sub-panel đầu tiên
  activateSubPanel(section, 0);
}

/** Quay về trang chủ */
function goHome() {
  state.currentSection = null;
  state.currentSubIdx  = 0;

  DOM.breadcrumbBar.style.display = "none";
  DOM.btnBack.style.display       = "none";
  DOM.body.classList.remove("in-detail");
  DOM.mobileSubmenu.style.display = "none";

  switchView("home");
}

/** Animate chuyển giữa 2 views */
function switchView(targetView) {
  const from = DOM[`view${capitalize(state.currentView)}`];
  const to   = DOM[`view${capitalize(targetView)}`];

  from.classList.remove("is-active");
  from.setAttribute("aria-hidden", "true");

  requestAnimationFrame(() => {
    setTimeout(() => {
      to.classList.add("is-active");
      to.removeAttribute("aria-hidden");
      state.currentView = targetView;
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (targetView === "detail") {
        const content = document.querySelector(".detail-content");
        if (content) content.focus({ preventScroll: true });
      }
    }, 60);
  });
}

/* =====================================================
   7. SIDEBAR
===================================================== */
function renderSidebar(section) {
  DOM.sidebarNav.innerHTML = "";

  section.subs.forEach((sub, idx) => {
    const btn = document.createElement("button");
    btn.className = `sidebar-btn${section.isAccent ? " accent-btn" : ""}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("data-idx", idx);
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    btn.setAttribute("tabindex", idx === 0 ? "0" : "-1");
    btn.setAttribute("aria-label", `${sub.sub} — ${sub.label}`);
    btn.innerHTML = `
      <span class="sub-num">${sub.sub}</span>
      <span class="sub-label">${sub.label}</span>`;

    btn.addEventListener("click", () => selectSubByIndex(idx));
    btn.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        selectSubByIndex(Math.min(idx + 1, section.subs.length - 1));
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        selectSubByIndex(Math.max(idx - 1, 0));
      }
    });

    DOM.sidebarNav.appendChild(btn);
  });
}

/* =====================================================
   8. MOBILE SUBMENU
===================================================== */
function renderMobileSubmenu(section) {
  DOM.mobileSubmenu.innerHTML = "";

  section.subs.forEach((sub, idx) => {
    const btn = document.createElement("button");
    btn.className = "mobile-sub-btn";
    btn.setAttribute("role", "tab");
    btn.setAttribute("data-idx", idx);
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    btn.title = sub.label;
    btn.innerHTML = `<i class="${sub.icon}" aria-hidden="true"></i><span>${sub.sub}</span>`;

    btn.addEventListener("click", () => {
      selectSubByIndex(idx);
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });

    DOM.mobileSubmenu.appendChild(btn);
  });

  DOM.mobileSubmenu.style.display = "";
}

/* =====================================================
   9. SUB-PANEL ACTIVATION
===================================================== */
function selectSubByIndex(idx) {
  const section = SECTIONS.find(s => s.id === state.currentSection);
  if (!section) return;

  idx = Math.max(0, Math.min(idx, section.subs.length - 1));
  state.currentSubIdx = idx;

  activateSubPanel(section, idx);
  syncSidebarActive(idx);
  syncMobileActive(idx);
}

function activateSubPanel(section, idx) {
  const sub = section.subs[idx];

  // Ẩn tất cả sub-panel đang có trong DOM
  document.querySelectorAll(".sub-panel").forEach(el => el.classList.remove("is-active"));

  // Hiện panel đúng (đã được inject bởi loadSectionContent)
  const panelId = `sub-${sub.sub.replace(".", "-")}`;
  const panel   = document.getElementById(panelId);
  if (panel) {
    panel.classList.add("is-active");
  } else {
    // Fallback: hiện panel đầu tiên của section nếu không tìm thấy
    const fallback = document.querySelector(`.sub-panel[data-section="${section.id}"]`);
    if (fallback) fallback.classList.add("is-active");
  }

  updateContentHeader(section, sub);
  DOM.subnavIndicator.textContent = `${idx + 1} / ${section.subs.length}`;
  updateNavButtons(section, idx);
}

function updateContentHeader(section, sub) {
  const iconEl = DOM.contentIconWrap.querySelector("i");
  iconEl.className = sub.icon;
  DOM.contentIconWrap.style.background = section.iconBg;
  iconEl.style.color = section.color;
  DOM.sectionLabel.textContent = `Mục ${sub.sub}`;
  DOM.contentTitle.textContent = sub.label;
}

function syncSidebarActive(activeIdx) {
  DOM.sidebarNav.querySelectorAll(".sidebar-btn").forEach((btn, i) => {
    const isActive = i === activeIdx;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) btn.focus({ preventScroll: true });
  });
}

function syncMobileActive(activeIdx) {
  DOM.mobileSubmenu.querySelectorAll(".mobile-sub-btn").forEach((btn, i) => {
    const isActive = i === activeIdx;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function updateNavButtons(section, idx) {
  DOM.btnPrev.disabled = idx === 0;
  DOM.btnNext.disabled = idx === section.subs.length - 1;
}

/* =====================================================
   10. NAVIGATION Prev / Next
===================================================== */
function navigateSub(direction) {
  const section = SECTIONS.find(s => s.id === state.currentSection);
  if (!section) return;

  const newIdx = state.currentSubIdx + direction;
  if (newIdx < 0 || newIdx >= section.subs.length) return;

  selectSubByIndex(newIdx);

  const sidebarBtns = DOM.sidebarNav.querySelectorAll(".sidebar-btn");
  if (sidebarBtns[newIdx]) {
    sidebarBtns[newIdx].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/* =====================================================
   11. KEYBOARD ACCESSIBILITY
===================================================== */
function keyActivate(event, sectionId) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openSection(sectionId);
  }
}

/* =====================================================
   12. TOAST NOTIFICATION
===================================================== */
let toastTimer = null;

function showToast(message, duration = 2500) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("show"), duration);
}

/* =====================================================
   13. HELPERS
===================================================== */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =====================================================
   14. CSS — Loading state (inject vào style.css nếu chưa có)
===================================================== */
(function injectLoadingStyle() {
  if (document.getElementById("u340e-loading-style")) return;
  const style = document.createElement("style");
  style.id = "u340e-loading-style";
  style.textContent = `
    .section-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 16px;
      color: var(--text-muted);
      font-size: 14px;
    }
    .section-loading .loading-spinner {
      font-size: 32px;
      color: var(--primary);
    }
    .section-loading .loading-spinner i {
      animation: spin-slow 1.2s linear infinite;
    }
  `;
  document.head.appendChild(style);
})();

/* =====================================================
   15. INIT
===================================================== */
function init() {
  DOM.viewHome.classList.add("is-active");
  DOM.viewDetail.setAttribute("aria-hidden", "true");
  DOM.breadcrumbBar.style.display = "none";
  DOM.btnBack.style.display       = "none";

  // Swipe phải từ cạnh trái để về Home (mobile)
  let touchStartX = 0;
  document.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener("touchend", e => {
    if (state.currentView !== "detail") return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 80 && touchStartX < 60) goHome();
  }, { passive: true });

  // Browser back button
  window.addEventListener("popstate", () => {
    if (state.currentView === "detail") goHome();
  });
  history.replaceState({ view: "home" }, "", window.location.pathname);

  console.info(
    "%c[U340E] %cKhởi động thành công ✓  |  Dynamic Section Loading",
    "color:#003F8A;font-weight:bold",
    "color:#00796B"
  );
}

/* =====================================================
   16. EXPORTS — cho onclick trong HTML
===================================================== */
window.openSection  = openSection;
window.goHome       = goHome;
window.navigateSub  = navigateSub;
window.keyActivate  = keyActivate;
window.showToast    = showToast;

document.addEventListener("DOMContentLoaded", init);
