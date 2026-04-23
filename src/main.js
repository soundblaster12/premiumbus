/**
 * main.js — Application Entry Point v3
 * Platform detection, offline sync, OAuth config injection.
 */

import { router } from './services/Router.js';
import { AuthService } from './services/AuthService.js';
import { DataService } from './services/DataService.js';
import { OfflineQueue } from './services/OfflineQueue.js';
import { isApiAvailable } from './services/ApiClient.js';
import { showToast } from './components/Toast.js';

// Page imports
import { renderLoginPage } from './pages/LoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderTripsPage } from './pages/TripsPage.js';
import { renderPurchasePage } from './pages/PurchasePage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderAdminPage } from './pages/AdminPage.js';

// ── OAuth Client IDs (replace with your own) ─────
// These are injected as globals so LoginPage.js can use them
window.__GOOGLE_CLIENT_ID = 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
window.__FACEBOOK_APP_ID = 'TU_FACEBOOK_APP_ID';

// ── Platform Detection ───────────────────────────
function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function isInstalledAsPwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/**
 * Aplica clase CSS al body si es Android para activar android.css
 */
function applyPlatformClass() {
  const platform = detectPlatform();
  document.body.dataset.platform = platform;
  if (platform === 'android') {
    document.body.classList.add('android-native');
  }
}

// ── PWA Install Prompt ──────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallBanner();
});

function showInstallBanner() {
  if (sessionStorage.getItem('pwa_banner_dismissed')) return;
  if (isInstalledAsPwa()) return;

  const platform = detectPlatform();
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;
    background:linear-gradient(135deg,#1a3a6b,#2b5ea7);color:white;padding:12px 16px;
    display:flex;align-items:center;gap:12px;z-index:9999;font-family:'Inter',sans-serif;
    font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeSlideDown 0.4s ease forwards;
  `;

  if (platform === 'ios') {
    banner.innerHTML = `
      <span style="font-size:24px;">📱</span>
      <div style="flex:1;">
        <strong>Instala PremiumBus</strong>
        <div style="font-size:11px;opacity:0.85;margin-top:2px;">
          Toca <span style="font-size:16px;">⬆️</span> <strong>Compartir</strong> → <strong>"Agregar a pantalla de inicio"</strong>
        </div>
      </div>
      <button id="pwa-dismiss-btn" style="background:transparent;color:rgba(255,255,255,0.7);border:none;font-size:18px;cursor:pointer;padding:4px 8px;">✕</button>
    `;
  } else {
    banner.innerHTML = `
      <span style="font-size:24px;">📱</span>
      <span style="flex:1;"><strong>Instala PremiumBus</strong> en tu ${platform === 'android' ? 'teléfono' : 'dispositivo'}</span>
      <button id="pwa-install-btn" style="background:white;color:#1a3a6b;border:none;padding:6px 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;">Instalar</button>
      <button id="pwa-dismiss-btn" style="background:transparent;color:rgba(255,255,255,0.7);border:none;font-size:18px;cursor:pointer;padding:4px 8px;">✕</button>
    `;
  }

  document.body.appendChild(banner);

  function dismissBanner() {
    banner.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(-100%)';
    setTimeout(() => banner.remove(), 400);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  }

  const autoDismissTimer = setTimeout(dismissBanner, 3000);

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    clearTimeout(autoDismissTimer);
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      console.log('[PWA] Resultado:', result.outcome);
      deferredInstallPrompt = null;
    }
    banner.remove();
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    clearTimeout(autoDismissTimer);
    dismissBanner();
  });
}

// ── Offline/Online Banner ────────────────────────

function setupConnectivityBanner() {
  window.addEventListener('premiumbus:connectivity', (e) => {
    if (e.detail.isOnline) {
      showToast('✅ Conexión restaurada', 'success');
      syncOfflinePurchases();
    } else {
      showToast('📴 Sin conexión — modo offline', 'info');
    }
  });
}

async function syncOfflinePurchases() {
  const pendingCount = await OfflineQueue.getPendingCount();
  if (pendingCount === 0) return;

  showToast(`🔄 Sincronizando ${pendingCount} compra(s)...`, 'info');

  const result = await OfflineQueue.syncPendingPurchases(async (purchase) => {
    return DataService.purchaseTicket(purchase.userId, purchase.tripId, purchase.seatNumber);
  });

  if (result.synced > 0) {
    showToast(`✅ ${result.synced} compra(s) sincronizada(s)`, 'success');
  }
  if (result.failed > 0) {
    showToast(`⚠️ ${result.failed} compra(s) fallaron`, 'error');
  }
}

// ── Service Worker Message Handler ───────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_PURCHASES') {
      syncOfflinePurchases();
    }
  });
}

// ── Initialize App ───────────────────────────────

async function initializeApp() {
  const appContainer = document.getElementById('app');

  if (!appContainer) {
    console.error('[PremiumBus] No se encontró el contenedor #app');
    return;
  }

  // Apply Android class before rendering
  applyPlatformClass();

  router.setContainer(appContainer);

  // ── Register Routes ───────────────────────────
  router.addRoute('login', renderLoginPage, { requiresAuth: false });
  router.addRoute('register', renderRegisterPage, { requiresAuth: false });
  router.addRoute('home', renderHomePage, { requiresAuth: true });
  router.addRoute('trips', renderTripsPage, { requiresAuth: true });
  router.addRoute('purchase', renderPurchasePage, { requiresAuth: true });
  router.addRoute('profile', renderProfilePage, { requiresAuth: true });
  router.addRoute('admin', renderAdminPage, { requiresAuth: true, requiresAdmin: true });

  // ── Route Guard ───────────────────────────────
  router.setGuard(async (route) => {
    const isAuthenticated = AuthService.isAuthenticated();
    const isAdmin = AuthService.isAdmin();

    if (!route.requiresAuth && isAuthenticated) {
      const currentHash = window.location.hash.slice(2);
      if (currentHash === 'login' || currentHash === 'register') {
        return { allowed: false, redirect: 'home' };
      }
    }

    if (route.requiresAuth && !isAuthenticated) {
      return { allowed: false, redirect: 'login' };
    }

    if (route.requiresAdmin && !isAdmin) {
      return { allowed: false, redirect: 'home' };
    }

    return { allowed: true };
  });

  // ── Start Router ──────────────────────────────
  router.start();

  // ── Setup offline connectivity banner ─────────
  setupConnectivityBanner();

  // ── iOS Install Banner Check ──────────────────
  if (detectPlatform() === 'ios' && !isInstalledAsPwa()) {
    showInstallBanner();
  }

  // ── Sync pending offline purchases ────────────
  if (OfflineQueue.isOnline()) {
    syncOfflinePurchases();
  }

  // ── Log ───────────────────────────────────────
  const apiUp = await isApiAvailable();
  const platform = detectPlatform();

  console.log(
    '%c🚌 PremiumBus v3.0 — San Luis Potosí',
    'color: #2b5ea7; font-size: 14px; font-weight: bold;'
  );
  console.log(
    `%c📦 Backend: ${apiUp ? 'MySQL (API PHP)' : 'localStorage (Modo Demo)'}`,
    `color: ${apiUp ? '#10b981' : '#f59e0b'}; font-weight: bold;`
  );
  console.log(
    `%c📱 Plataforma: ${platform}${platform === 'android' ? ' (Material Design)' : ''}`,
    'color: #6366f1; font-weight: bold;'
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
