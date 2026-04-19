/**
 * ProfilePage.js — User Profile & Purchase History
 * Shows user info, active trip, and complete purchase history.
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';
import { showToast } from '../components/Toast.js';

export async function renderProfilePage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'profile-page';

  const user = AuthService.getCurrentUser();
  if (!user) {
    router.navigate('login');
    return container;
  }

  const firstName = user.nombre?.split(' ')[0] || 'Usuario';
  const initials = user.nombre
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  let purchases = [];
  try {
    purchases = await DataService.getUserPurchases(user.id);
  } catch {
    purchases = [];
  }

  // Sort purchases by date (most recent first)
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra)
  );

  const totalSpent = purchases.reduce((sum, p) => sum + (p.precio || 0), 0);
  const now = new Date();

  container.innerHTML = `
    <div class="profile-page__header">
      <div class="profile-page__avatar" id="profile-avatar">
        ${initials}
      </div>
      <h1 class="profile-page__name">${user.nombre}</h1>
      <p class="profile-page__email">${user.correo}</p>
      <div class="profile-page__stats-row">
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
          <span class="profile-page__stat-value">${user.rol === 'admin' ? '⚙️' : '👤'}</span>
          <span class="profile-page__stat-label">${user.rol === 'admin' ? 'Admin' : 'Usuario'}</span>
        </div>
      </div>
    </div>

    <div class="profile-page__content">
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

      <!-- Purchase History -->
      <div class="profile-page__section">
        <div class="section-header">
          <h2 class="section-header__title">📋 Historial de Compras</h2>
          <span class="profile-page__count-badge">${purchases.length}</span>
        </div>

        ${sortedPurchases.length === 0
          ? `<div class="profile-page__empty">
              <span class="profile-page__empty-icon">🎫</span>
              <p class="profile-page__empty-title">Sin compras aún</p>
              <p class="profile-page__empty-desc">Tus boletos comprados aparecerán aquí</p>
              <button class="btn btn--primary btn--md" id="profile-first-buy">
                Comprar mi primer boleto
              </button>
            </div>`
          : `<div class="profile-page__history" id="purchase-history-list">
              ${sortedPurchases.map((purchase, index) => {
                const purchaseDate = new Date(purchase.fechaCompra || purchase.fecha_compra);
                const tripDate = new Date(purchase.fecha);
                const isActive = tripDate >= now;
                const statusLabel = isActive ? 'Activo' : 'Completado';
                const statusClass = isActive ? 'active' : 'completed';

                return `
                  <div class="purchase-history-card" style="animation: slideInRight 0.3s ease ${index * 0.05}s both;">
                    <div class="purchase-history-card__status purchase-history-card__status--${statusClass}">
                      ${isActive ? '🟢' : '✅'} ${statusLabel}
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
                    <div class="purchase-history-card__detail">
                      <span class="purchase-history-card__label">Fecha viaje</span>
                      <span class="purchase-history-card__value">${formatFullDate(purchase.fecha)}</span>
                    </div>
                    <div class="purchase-history-card__footer">
                      <span class="purchase-history-card__folio">Folio: ${purchase.id}</span>
                      <span class="purchase-history-card__date">Comprado ${formatRelativeDate(purchaseDate)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
        }
      </div>

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

    document.getElementById('profile-buy-btn')?.addEventListener('click', () => router.navigate('purchase'));
    document.getElementById('profile-routes-btn')?.addEventListener('click', () => router.navigate('trips'));
    document.getElementById('profile-first-buy')?.addEventListener('click', () => router.navigate('purchase'));

    document.getElementById('profile-logout')?.addEventListener('click', async () => {
      await AuthService.logout();
      showToast('Sesión cerrada correctamente.', 'info');
      router.navigate('login');
    });
  }, 0);

  return container;
}

function formatFullDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

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
