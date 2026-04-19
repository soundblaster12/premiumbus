/**
 * main.js — Application Entry Point
 * Initializes the router, registers all routes with guards,
 * and starts the SPA.
 */

import { router } from './services/Router.js';
import { AuthService } from './services/AuthService.js';
import { isApiAvailable } from './services/ApiClient.js';

// Page imports
import { renderLoginPage } from './pages/LoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderTripsPage } from './pages/TripsPage.js';
import { renderPurchasePage } from './pages/PurchasePage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderAdminPage } from './pages/AdminPage.js';

// ── PWA Install Prompt ──────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  console.log('[PWA] Prompt de instalación disponible');
  showInstallBanner();
});

/**
 * Detecta la plataforma del usuario.
 */
function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Verifica si la app ya está instalada como PWA.
 */
function isInstalledAsPwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/**
 * Muestra un banner en la parte superior invitando a instalar la app.
 * Detecta plataforma para dar instrucciones específicas.
 */
function showInstallBanner() {
  // No mostrar si ya fue descartado en esta sesión o ya es PWA
  if (sessionStorage.getItem('pwa_banner_dismissed')) return;
  if (isInstalledAsPwa()) return;

  const platform = detectPlatform();

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: linear-gradient(135deg, #1a3a6b, #2b5ea7);
    color: white;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: fadeSlideDown 0.4s ease forwards;
  `;

  if (platform === 'ios') {
    // iOS doesn't support beforeinstallprompt — show manual instructions
    banner.innerHTML = `
      <span style="font-size: 24px;">📱</span>
      <div style="flex:1;">
        <strong>Instala PremiumBus</strong>
        <div style="font-size:11px;opacity:0.85;margin-top:2px;">
          Toca <span style="font-size:16px;">⬆️</span> <strong>Compartir</strong> → <strong>"Agregar a pantalla de inicio"</strong>
        </div>
      </div>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: rgba(255,255,255,0.7);
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
      ">✕</button>
    `;
  } else {
    // Android / Desktop — use native prompt
    banner.innerHTML = `
      <span style="font-size: 24px;">📱</span>
      <span style="flex:1;">
        <strong>Instala PremiumBus</strong> en tu ${platform === 'android' ? 'teléfono' : 'dispositivo'}
      </span>
      <button id="pwa-install-btn" style="
        background: white;
        color: #1a3a6b;
        border: none;
        padding: 6px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        font-family: inherit;
      ">Instalar</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: rgba(255,255,255,0.7);
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
      ">✕</button>
    `;
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      console.log('[PWA] Resultado de instalación:', result.outcome);
      deferredInstallPrompt = null;
    }
    banner.remove();
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  });
}

/**
 * For iOS — show install banner on page load if not installed.
 * iOS doesn't trigger 'beforeinstallprompt' event.
 */
function checkIosInstallBanner() {
  const platform = detectPlatform();
  if (platform === 'ios' && !isInstalledAsPwa()) {
    showInstallBanner();
  }
}

/**
 * Initializes the PremiumBus application.
 */
async function initializeApp() {
  const appContainer = document.getElementById('app');

  if (!appContainer) {
    console.error('[PremiumBus] No se encontró el contenedor #app');
    return;
  }

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

    // Redirect authenticated users away from login/register
    if (!route.requiresAuth && isAuthenticated) {
      const currentHash = window.location.hash.slice(2);
      if (currentHash === 'login' || currentHash === 'register') {
        return { allowed: false, redirect: 'home' };
      }
    }

    // Require auth for protected routes
    if (route.requiresAuth && !isAuthenticated) {
      return { allowed: false, redirect: 'login' };
    }

    // Require admin for admin routes
    if (route.requiresAdmin && !isAdmin) {
      return { allowed: false, redirect: 'home' };
    }

    return { allowed: true };
  });

  // ── Start Router ──────────────────────────────
  router.start();

  // ── iOS Install Banner Check ──────────────────
  checkIosInstallBanner();

  // ── Check API/MySQL Connection ────────────────
  const apiUp = await isApiAvailable();

  console.log(
    '%c🚌 PremiumBus v2.0 — San Luis Potosí',
    'color: #2b5ea7; font-size: 14px; font-weight: bold;'
  );
  console.log(
    `%c📦 Backend: ${apiUp ? 'MySQL (API PHP)' : 'localStorage (Modo Demo)'}`,
    `color: ${apiUp ? '#10b981' : '#f59e0b'}; font-weight: bold;`
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
