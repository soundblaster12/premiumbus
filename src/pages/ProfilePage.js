/**
 * ProfilePage.js — User/Admin Profile v2
 * Features:
 *   - Profile photo upload from gallery (stored in localStorage as base64)
 *   - Admin: see all registered users
 *   - Admin: no purchase buttons
 *   - User: purchase history + quick actions
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';
import { showToast } from '../components/Toast.js';

const PHOTO_STORAGE_KEY = 'premiumbus_profile_photos';

export async function renderProfilePage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'profile-page';

  const user = AuthService.getCurrentUser();
  if (!user) {
    router.navigate('login');
    return container;
  }

  const isAdmin = AuthService.isAdmin();
  const firstName = user.nombre?.split(' ')[0] || 'Usuario';
  const initials = user.nombre
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const profilePhoto = getProfilePhoto(user.id);

  let purchases = [];
  let history = [];
  if (!isAdmin) {
    try {
      purchases = await DataService.getUserPurchases(user.id);
    } catch { purchases = []; }
    try {
      history = await DataService.getUserHistory(user.id);
    } catch { history = []; }
  }

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra)
  );
  const totalSpent = [...purchases, ...history].reduce((sum, p) => sum + (p.precio || 0), 0);
  const now = new Date();

  // Admin: fetch all users
  let allUsers = [];
  if (isAdmin) {
    try {
      allUsers = await AuthService.getAllUsers();
    } catch {
      allUsers = [];
    }
  }

  container.innerHTML = `
    <div class="profile-page__header">
      <div class="profile-page__avatar-wrapper" id="profile-avatar-wrapper">
        ${profilePhoto
          ? `<img class="profile-page__avatar-img" id="profile-avatar-img" src="${profilePhoto}" alt="Foto de perfil"/>`
          : `<div class="profile-page__avatar" id="profile-avatar">${initials}</div>`
        }
        <button class="profile-page__avatar-edit" id="profile-photo-btn" title="Cambiar foto">
          📷
        </button>
        <input type="file" id="profile-photo-input" accept="image/*" style="display:none;" />
      </div>
      <h1 class="profile-page__name">${user.nombre}</h1>
      <p class="profile-page__email">${user.correo}</p>
      <div class="profile-page__stats-row">
        ${isAdmin ? `
          <div class="profile-page__stat">
            <span class="profile-page__stat-value">${allUsers.length}</span>
            <span class="profile-page__stat-label">Usuarios</span>
          </div>
          <div class="profile-page__stat-divider"></div>
          <div class="profile-page__stat">
            <span class="profile-page__stat-value">⚙️</span>
            <span class="profile-page__stat-label">Admin</span>
          </div>
        ` : `
          <div class="profile-page__stat">
            <span class="profile-page__stat-value">${purchases.length}</span>
            <span class="profile-page__stat-label">Viajes</span>
          </div>
          <div class="profile-page__stat-divider"></div>
          <div class="profile-page__stat">
            <span class="profile-page__stat-value">$${totalSpent.toFixed(0)}</span>
            <span class="profile-page__stat-label">Gastado</span>
          </div>
          <div class="profile-page__stat-divider"></div>
          <div class="profile-page__stat">
            <span class="profile-page__stat-value">👤</span>
            <span class="profile-page__stat-label">Usuario</span>
          </div>
        `}
      </div>
    </div>

    <div class="profile-page__content">
      ${isAdmin ? renderAdminSection(allUsers) : renderUserSection(sortedPurchases, history, now)}

      <!-- Logout -->
      <div class="profile-page__logout">
        <button class="btn btn--danger btn--full btn--lg" id="profile-logout">
          <span style="width:18px;height:18px;">${Icons.logout}</span>
          Cerrar Sesión
        </button>
      </div>
    </div>

    ${renderNavbar()}
  `;

  setTimeout(() => {
    attachNavbarListeners();
    attachProfileListeners(user, isAdmin);
  }, 0);

  return container;
}

/* ── Admin Section: Registered Users ──────────── */

function renderAdminSection(allUsers) {
  const userRows = allUsers.length > 0
    ? allUsers.map((u, i) => `
      <div class="user-list-card" style="animation: slideInRight 0.2s ease ${i * 0.03}s both;">
        <div class="user-list-card__avatar">
          ${u.nombre?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U'}
        </div>
        <div class="user-list-card__info">
          <span class="user-list-card__name">${u.nombre || 'Sin nombre'}</span>
          <span class="user-list-card__email">${u.correo}</span>
        </div>
        <div class="user-list-card__meta">
          <span class="badge ${u.rol === 'admin' ? 'badge--warning' : 'badge--success'}">${u.rol}</span>
        </div>
      </div>
    `).join('')
    : `<p style="text-align:center;color:var(--color-gray-400);padding:var(--space-6);">Sin usuarios registrados</p>`;

  return `
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">👥 Usuarios Registrados</h2>
        <span class="profile-page__count-badge">${allUsers.length}</span>
      </div>
      <div class="profile-page__users-list" id="users-list">
        ${userRows}
      </div>
    </div>
  `;
}

/* ── User Section: Quick Actions + Purchase History ── */

function renderUserSection(sortedPurchases, historyItems, now) {
  return `
    <!-- Quick Actions -->
    <div class="profile-page__quick-actions">
      <button class="profile-page__action-btn" id="profile-buy-btn">
        <span class="profile-page__action-icon">🎫</span>
        Comprar Boleto
      </button>
      <button class="profile-page__action-btn" id="profile-routes-btn">
        <span class="profile-page__action-icon">🗺️</span>
        Ver Rutas
      </button>
    </div>

    <!-- Active Purchases -->
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">🎫 Viajes Activos</h2>
        <span class="profile-page__count-badge">${sortedPurchases.length}</span>
      </div>

      ${sortedPurchases.length === 0
        ? `<div class="profile-page__empty">
            <span class="profile-page__empty-icon">🎫</span>
            <p class="profile-page__empty-title">Sin viajes activos</p>
            <p class="profile-page__empty-desc">Compra un boleto para comenzar tu viaje</p>
            <button class="btn btn--primary btn--md" id="profile-first-buy">
              Comprar mi primer boleto
            </button>
          </div>`
        : `<div class="profile-page__history" id="purchase-history-list">
            ${sortedPurchases.map((purchase, index) => {
              return `
                <div class="purchase-history-card" style="animation: slideInRight 0.3s ease ${index * 0.05}s both;">
                  <div class="purchase-history-card__status purchase-history-card__status--active">
                    🟢 En Curso
                  </div>
                  <div class="purchase-history-card__header">
                    <span class="purchase-history-card__route">🚌 ${purchase.nombreRuta || purchase.nombre_ruta}</span>
                    <span class="purchase-history-card__price">$${purchase.precio.toFixed(2)}</span>
                  </div>
                  <div class="purchase-history-card__detail">
                    <span class="purchase-history-card__label">Trayecto</span>
                    <span class="purchase-history-card__value">${purchase.origen} → ${purchase.destino}</span>
                  </div>
                  <div class="purchase-history-card__detail">
                    <span class="purchase-history-card__label">Asiento</span>
                    <span class="purchase-history-card__value">#${purchase.asiento}</span>
                  </div>
                  <div class="purchase-history-card__footer">
                    <span class="purchase-history-card__folio">Folio: ${purchase.id}</span>
                    <span class="purchase-history-card__date">Comprado ${formatRelativeDate(new Date(purchase.fechaCompra || purchase.fecha_compra))}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
      }
    </div>

    <!-- Feature 7: Trip History (Completed) -->
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">📜 Historial de Viajes</h2>
        <span class="profile-page__count-badge">${historyItems.length}</span>
      </div>

      ${historyItems.length === 0
        ? `<div class="profile-page__empty">
            <span class="profile-page__empty-icon">📜</span>
            <p class="profile-page__empty-title">Sin historial</p>
            <p class="profile-page__empty-desc">Tus viajes completados aparecerán aquí</p>
          </div>`
        : `<div id="history-list">
            ${historyItems.map((item, index) => `
              <div class="history-card" style="animation: slideInRight 0.3s ease ${index * 0.05}s both;">
                <div class="history-card__header">
                  <span class="history-card__route">✅ ${item.nombreRuta || item.nombre_ruta}</span>
                  <span class="history-card__badge">Completado</span>
                </div>
                <div class="history-card__detail">
                  ${item.origen} → ${item.destino} | Asiento #${item.asiento} | $${item.precio.toFixed(2)}
                </div>
                <div class="history-card__detail">
                  Finalizado: ${new Date(item.finishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            `).join('')}
          </div>`
      }
    </div>
  `;
}

/* ── Listeners ────────────────────────────────── */

function attachProfileListeners(user, isAdmin) {
  // Photo upload
  const photoBtn = document.getElementById('profile-photo-btn');
  const photoInput = document.getElementById('profile-photo-input');

  photoBtn?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selecciona una imagen válida.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe exceder 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      saveProfilePhoto(user.id, base64);

      // Update avatar visually
      const wrapper = document.getElementById('profile-avatar-wrapper');
      if (wrapper) {
        const existingImg = wrapper.querySelector('.profile-page__avatar-img');
        const existingDiv = wrapper.querySelector('.profile-page__avatar');

        if (existingImg) {
          existingImg.src = base64;
        } else if (existingDiv) {
          const img = document.createElement('img');
          img.className = 'profile-page__avatar-img';
          img.id = 'profile-avatar-img';
          img.src = base64;
          img.alt = 'Foto de perfil';
          existingDiv.replaceWith(img);
        }
      }

      showToast('Foto actualizada ✅', 'success');
    };
    reader.readAsDataURL(file);
  });

  // Navigation buttons (only for non-admin)
  if (!isAdmin) {
    document.getElementById('profile-buy-btn')?.addEventListener('click', () => router.navigate('purchase'));
    document.getElementById('profile-routes-btn')?.addEventListener('click', () => router.navigate('trips'));
    document.getElementById('profile-first-buy')?.addEventListener('click', () => router.navigate('purchase'));
  }

  // Logout
  document.getElementById('profile-logout')?.addEventListener('click', async () => {
    await AuthService.logout();
    showToast('Sesión cerrada.', 'info');
    router.navigate('login');
  });
}

/* ── Photo Storage (localStorage) ────────────── */

function getProfilePhoto(userId) {
  try {
    const photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}');
    return photos[userId] || null;
  } catch {
    return null;
  }
}

function saveProfilePhoto(userId, base64Data) {
  try {
    const photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}');
    photos[userId] = base64Data;
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
  } catch (error) {
    console.warn('[Profile] Error saving photo:', error);
  }
}

/* ── Helpers ──────────────────────────────────── */

function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;

  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
