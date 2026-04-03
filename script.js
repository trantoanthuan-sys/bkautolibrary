/**
 * script.js — Thư viện Kỹ thuật Hộp số U340E
 * SPA (Single Page Application) — Vanilla JavaScript
 * ĐH Bách Khoa TP.HCM — Khoa Cơ khí Động lực
 *
 * Chức năng:
 *  1. Quản lý chuyển trang Home ↔ Detail (fade + slide)
 *  2. Render Sidebar và Mobile Sub-menu theo section
 *  3. Điều hướng giữa các sub-panel (click sidebar / mobile btn / Prev-Next)
 *  4. Breadcrumb động
 *  5. Toast notification
 *  6. Keyboard accessibility
 */

"use strict";

/* =====================================================
   1. DATA — Cấu trúc danh mục
   ► Chỉnh sửa tại đây khi thêm / bớt mục
===================================================== */
const SECTIONS = [
  {
    id: 1,
    title: "Kết cấu hộp số U340E",
    icon: "fa-solid fa-cubes",
    color: "var(--primary)",
    iconBg: "#E8F0FB",
    subs: [
      { sub: "1.1", label: "Kết cấu chung",                                          icon: "fa-solid fa-drafting-compass" },
      { sub: "1.2", label: "Biến mô thủy lực",                                       icon: "fa-solid fa-circle-nodes"     },
      { sub: "1.3", label: "Bơm dầu thủy lực",                                       icon: "fa-solid fa-droplet"          },
      { sub: "1.4", label: "Bộ truyền bánh răng hành tinh",                          icon: "fa-solid fa-asterisk"         },
      { sub: "1.5", label: "Phần tử điều khiển: ly hợp - phanh - khớp 1 chiều",     icon: "fa-solid fa-circle-dot"       },
    ],
  },
  {
    id: 2,
    title: "Hệ thống Điều khiển & Thủy lực",
    icon: "fa-solid fa-sliders",
    color: "#0277BD",
    iconBg: "#E1F5FE",
    subs: [
      { sub: "2.1", label: "Hệ Thống Điều Khiển Thủy Lực",     icon: "fa-solid fa-water"    },
      { sub: "2.2", label: "Hệ Thống Điều Khiển Điện Tử",    icon: "fa-solid fa-microchip" },
    ],
  },
  {
    id: 3,
    title: "Nguyên lý Làm việc",
    icon: "fa-solid fa-gears",
    color: "#00796B",
    iconBg: "#E0F2F1",
    subs: [
      { sub: "3.1", label: "Tay số 1 (D/3/2) và tay số 1 (L) — Khuếch đại mômen lớn nhất",           icon: "fa-solid fa-1"           },
      { sub: "3.2", label: "Tay số 2 (dải D/3) và tay số 2 (dải 2) — Chuyển tiếp, cân bằng lực kéo và tốc độ", icon: "fa-solid fa-2"           },
      { sub: "3.3", label: "Tay số 3 (dải D/3) — Truyền gần trực tiếp (hiệu suất tốt)",                icon: "fa-solid fa-3"           },
      { sub: "3.4", label: "Tay số 4 (OD — dải D) — Số truyền tăng, giảm tua máy",                     icon: "fa-solid fa-4"           },
      { sub: "3.5", label: "Tay số lùi (R) — Đảo chiều quay đầu ra",                                   icon: "fa-solid fa-rotate-left" },
      { sub: "3.6", label: "Tính toán tỉ số truyền các tay số",                                         icon: "fa-solid fa-calculator"  },
    ],
  },
  {
    id: 4,
    title: "Quy trình Tháo lắp",
    icon: "fa-solid fa-screwdriver-wrench",
    color: "#6A1B9A",
    iconBg: "#F3E5F5",
    subs: [
      { sub: "4.1", label: "Tháo",   icon: "fa-solid fa-wrench"  },
      { sub: "4.2", label: "Lắp",    icon: "fa-solid fa-hammer"  },
    ],
  },
  {
    id: 5,
    title: "Chẩn đoán Lỗi & Hướng Bảo dưỡng",
    icon: "fa-solid fa-triangle-exclamation",
    color: "var(--accent)",
    iconBg: "#FFF3E0",
    isAccent: true,
    subs: [
      // Section 5 có 1 sub duy nhất (nội dung đầy đủ trong 1 panel)
      { sub: "5.1", label: "Chẩn đoán & Bảo dưỡng",          icon: "fa-solid fa-triangle-exclamation" },
    ],
  },
];

/* =====================================================
   2. STATE
===================================================== */
const state = {
  currentView:    "home",    // "home" | "detail"
  currentSection: null,      // 1–5
  currentSubIdx:  0,         // index vào mảng subs
};

/* =====================================================
   3. DOM REFERENCES
===================================================== */
const $ = id => document.getElementById(id);

const DOM = {
  body:            document.body,
  header:          $("site-header"),
  btnBack:         $("btn-back"),
  breadcrumbBar:   $("breadcrumb-bar"),
  bcCurrent:       $("bc-current"),
  mobileSubmenu:   $("mobile-submenu"),
  viewHome:        $("view-home"),
  viewDetail:      $("view-detail"),
  sidebarNav:      $("sidebar-nav"),
  contentHeader:   $("content-header"),
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
   4. VIEW TRANSITIONS
===================================================== */

/**
 * Chuyển sang trang chi tiết của một section
 * @param {number} sectionId — 1 to 5
 */
function openSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return;

  state.currentSection = sectionId;
  state.currentSubIdx  = 0;

  // Build sidebar & mobile submenu
  renderSidebar(section);
  renderMobileSubmenu(section);

  // Show breadcrumb & back button
  DOM.breadcrumbBar.style.display = "flex";
  DOM.btnBack.style.display       = "flex";
  DOM.body.classList.add("in-detail");

  // Update breadcrumb text
  DOM.bcCurrent.textContent = section.title;

  // Activate first sub-panel
  activateSubPanel(section, 0);

  // Page transition: Home → Detail
  switchView("detail");
}

/**
 * Quay về trang chủ
 */
function goHome() {
  state.currentSection = null;
  state.currentSubIdx  = 0;

  DOM.breadcrumbBar.style.display = "none";
  DOM.btnBack.style.display       = "none";
  DOM.body.classList.remove("in-detail");
  DOM.mobileSubmenu.style.display = "none";

  switchView("home");
}

/**
 * Animate giữa hai views
 * @param {"home"|"detail"} targetView
 */
function switchView(targetView) {
  const from = DOM[`view${capitalize(state.currentView)}`];
  const to   = DOM[`view${capitalize(targetView)}`];

  // Fade out current
  from.classList.remove("is-active");
  from.setAttribute("aria-hidden", "true");

  // Small delay then fade in target
  requestAnimationFrame(() => {
    setTimeout(() => {
      to.classList.add("is-active");
      to.removeAttribute("aria-hidden");
      state.currentView = targetView;

      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Focus content area for a11y
      if (targetView === "detail") {
        const content = document.querySelector(".detail-content");
        if (content) content.focus({ preventScroll: true });
      }
    }, 60);
  });
}

/* =====================================================
   5. SIDEBAR RENDERING
===================================================== */

/**
 * Render sidebar nav buttons cho section hiện tại
 */
function renderSidebar(section) {
  const nav = DOM.sidebarNav;
  nav.innerHTML = "";

  section.subs.forEach((sub, idx) => {
    const btn = document.createElement("button");
    btn.className  = `sidebar-btn${section.isAccent ? " accent-btn" : ""}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("data-idx", idx);
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    btn.setAttribute("tabindex", idx === 0 ? "0" : "-1");
    btn.setAttribute("aria-label", `${sub.sub} — ${sub.label}`);

    btn.innerHTML = `
      <span class="sub-num">${sub.sub}</span>
      <span class="sub-label">${sub.label}</span>
    `;

    btn.addEventListener("click", () => {
      selectSubByIndex(idx);
    });

    // Keyboard: arrow navigation in tablist
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

    nav.appendChild(btn);
  });
}

/* =====================================================
   6. MOBILE SUBMENU RENDERING
===================================================== */

/**
 * Render horizontal sub-menu pills cho mobile
 */
function renderMobileSubmenu(section) {
  const menu = DOM.mobileSubmenu;
  menu.innerHTML = "";

  section.subs.forEach((sub, idx) => {
    const btn = document.createElement("button");
    btn.className  = "mobile-sub-btn";
    btn.setAttribute("role", "tab");
    btn.setAttribute("data-idx", idx);
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");

    btn.innerHTML = `
      <i class="${sub.icon}" aria-hidden="true"></i>
      <span>${sub.sub}</span>
    `;

    btn.title = sub.label;

    btn.addEventListener("click", () => {
      selectSubByIndex(idx);
      // Scroll active pill into view
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });

    menu.appendChild(btn);
  });

  // Show on mobile (CSS media query controls display:flex)
  menu.style.display = "";
}

/* =====================================================
   7. SUB-PANEL ACTIVATION
===================================================== */

/**
 * Activate một sub-panel theo index
 * @param {number} idx
 */
function selectSubByIndex(idx) {
  const section = SECTIONS.find(s => s.id === state.currentSection);
  if (!section) return;

  idx = Math.max(0, Math.min(idx, section.subs.length - 1));
  state.currentSubIdx = idx;

  activateSubPanel(section, idx);
  updateNavButtons(section, idx);
  syncSidebarActive(idx);
  syncMobileActive(idx);
}

/**
 * Hiển thị sub-panel tương ứng, ẩn các panel còn lại
 */
function activateSubPanel(section, idx) {
  const sub = section.subs[idx];

  // Ẩn tất cả sub-panel
  document.querySelectorAll(".sub-panel").forEach(el => {
    el.classList.remove("is-active");
  });

  // Hiện panel cần thiết
  const panelId = `sub-${sub.sub.replace(".", "-")}`;
  const panel   = document.getElementById(panelId);

  if (panel) {
    panel.classList.add("is-active");
  } else {
    // Nếu chưa có panel — thông báo (dành cho section 5 chỉ có 5.1)
    const fallback = document.querySelector(`[data-section="${section.id}"]`);
    if (fallback) fallback.classList.add("is-active");
  }

  // Cập nhật content header
  updateContentHeader(section, sub);

  // Cập nhật indicator
  DOM.subnavIndicator.textContent = `${idx + 1} / ${section.subs.length}`;

  // Cập nhật Prev/Next buttons
  updateNavButtons(section, idx);
}

/**
 * Cập nhật icon và tiêu đề vùng content
 */
function updateContentHeader(section, sub) {
  // Icon
  const iconEl = DOM.contentIconWrap.querySelector("i");
  iconEl.className = sub.icon;
  DOM.contentIconWrap.style.background = section.iconBg;
  iconEl.style.color = section.color;

  // Labels
  DOM.sectionLabel.textContent = `Mục ${sub.sub}`;
  DOM.contentTitle.textContent = sub.label;
}

/**
 * Đồng bộ active state trên sidebar
 */
function syncSidebarActive(activeIdx) {
  const btns = DOM.sidebarNav.querySelectorAll(".sidebar-btn");
  btns.forEach((btn, i) => {
    const isActive = i === activeIdx;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) btn.focus({ preventScroll: true });
  });
}

/**
 * Đồng bộ active state trên mobile sub-menu
 */
function syncMobileActive(activeIdx) {
  const btns = DOM.mobileSubmenu.querySelectorAll(".mobile-sub-btn");
  btns.forEach((btn, i) => {
    const isActive = i === activeIdx;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

/**
 * Cập nhật trạng thái disabled của Prev/Next
 */
function updateNavButtons(section, idx) {
  DOM.btnPrev.disabled = idx === 0;
  DOM.btnNext.disabled = idx === section.subs.length - 1;
}

/* =====================================================
   8. NAVIGATION (Prev / Next)
===================================================== */

/**
 * Điều hướng Prev (-1) hoặc Next (+1)
 * @param {-1|1} direction
 */
function navigateSub(direction) {
  const section = SECTIONS.find(s => s.id === state.currentSection);
  if (!section) return;

  const newIdx = state.currentSubIdx + direction;
  if (newIdx < 0 || newIdx >= section.subs.length) return;

  selectSubByIndex(newIdx);

  // Auto-scroll sidebar button into view
  const sidebarBtns = DOM.sidebarNav.querySelectorAll(".sidebar-btn");
  if (sidebarBtns[newIdx]) {
    sidebarBtns[newIdx].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/* =====================================================
   9. KEYBOARD ACCESSIBILITY
===================================================== */

/**
 * Kích hoạt card bằng Enter / Space (keyboard)
 */
function keyActivate(event, sectionId) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openSection(sectionId);
  }
}

/* =====================================================
   10. TOAST NOTIFICATION
===================================================== */

let toastTimer = null;

/**
 * Hiển thị toast nhẹ
 * @param {string} message
 * @param {number} [duration=2500]
 */
function showToast(message, duration = 2500) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    DOM.toast.classList.remove("show");
  }, duration);
}

/* =====================================================
   11. HELPER UTILITIES
===================================================== */

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =====================================================
   12. INIT
===================================================== */

function init() {
  // Đảm bảo Home hiển thị đúng
  DOM.viewHome.classList.add("is-active");
  DOM.viewDetail.setAttribute("aria-hidden", "true");

  // Ẩn breadcrumb & back button ban đầu
  DOM.breadcrumbBar.style.display = "none";
  DOM.btnBack.style.display       = "none";

  // Swipe gesture (mobile) — trượt phải để quay lại Home
  let touchStartX = 0;

  document.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", e => {
    if (state.currentView !== "detail") return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    // Vuốt phải > 80px và bắt đầu từ cạnh trái 60px → quay home
    if (dx > 80 && touchStartX < 60) {
      goHome();
    }
  }, { passive: true });

  // Browser back button support (popstate)
  window.addEventListener("popstate", () => {
    if (state.currentView === "detail") {
      goHome();
    }
  });

  // Push initial state
  history.replaceState({ view: "home" }, "", window.location.pathname);

  console.info(
    "%c[U340E Library] %cKhởi động thành công ✓",
    "color: #003F8A; font-weight: bold;",
    "color: #00796B;"
  );
}

// Expose functions to HTML onclick attributes
window.openSection  = openSection;
window.goHome       = goHome;
window.navigateSub  = navigateSub;
window.keyActivate  = keyActivate;
window.showToast    = showToast;

// Run
document.addEventListener("DOMContentLoaded", init);
