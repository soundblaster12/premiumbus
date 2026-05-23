/**
 * HomePage.js — Home Screen v3
 * Admin: shows only "Conductores en Servicio" quick action + driver list.
 * User: shows Ver Rutas, Comprar, En Vivo, Mi Perfil + popular routes.
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { ExcelService } from '../services/ExcelService.js';
import { router } from '../services/Router.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';
import { showToast } from '../components/Toast.js';

export async function renderHomePage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'home-page';

  const user = AuthService.getCurrentUser();
  const firstName = user?.nombre?.split(' ')[0] || 'Usuario';
  const isAdmin = AuthService.isAdmin();

  let trips = [];
  try {
    trips = await DataService.getTrips();
  } catch {
    trips = [];
  }

  // Admin: show driver-focused home
  if (isAdmin) {
    container.innerHTML = renderAdminHome(firstName, trips);
  } else {
    container.innerHTML = await renderUserHome(firstName, trips, user);
  }

  setTimeout(() => {
    attachNavbarListeners();
    attachHomeListeners(isAdmin, trips);
  }, 0);

  return container;
}

/* ── Admin Home: Only drivers in service ──────── */

function renderAdminHome(firstName, trips) {
  const activeDrivers = trips
    .filter((t) => t.activo !== false)
    .map((t) => ({
      conductor: t.conductor || 'Sin asignar',
      ruta: t.nombreRuta || t.nombre_ruta,
      origen: t.origen,
      destino: t.destino,
    }));

  const driverCards = activeDrivers.length > 0
    ? activeDrivers.map((d, i) => `
      <div class="driver-card" style="animation: slideInRight 0.3s ease ${i * 0.04}s both;">
        <div class="driver-card__header">
          <span class="driver-card__icon">🧑‍✈️</span>
          <div class="driver-card__info">
            <span class="driver-card__name">${d.conductor}</span>
            <span class="driver-card__route">🚌 ${d.ruta}</span>
          </div>
          <span class="live-badge">EN SERVICIO</span>
        </div>
        <div class="driver-card__route-line">
          <span>📍 ${d.origen}</span>
          <span style="color:var(--color-gray-400);">→</span>
          <span>🏁 ${d.destino}</span>
        </div>
      </div>
    `).join('')
    : `<div class="empty-state">
         <p class="empty-state__title">Sin conductores activos</p>
         <p class="empty-state__description">No hay conductores en servicio en este momento.</p>
       </div>`;

  return `
    <div class="home-page__header">
      <p class="home-page__greeting">👋 ¡Hola, Admin!</p>
      <h1 class="home-page__user-name">${firstName}</h1>
      <p class="home-page__tagline">Panel de supervisión 🛡️</p>
    </div>

    <div class="home-page__actions">
      <div class="quick-action quick-action--green" id="action-drivers" style="flex:1;">
        <div class="quick-action__icon">🧑‍✈️</div>
        <span class="quick-action__label">Conductores</span>
      </div>
      <div class="quick-action quick-action--blue" id="action-admin-panel" style="flex:1;">
        <div class="quick-action__icon">⚙️</div>
        <span class="quick-action__label">Panel Admin</span>
      </div>
      <div class="quick-action quick-action--orange" id="action-admin-export" style="flex:1;">
        <div class="quick-action__icon">📤</div>
        <span class="quick-action__label">Exportar</span>
      </div>
      <div class="quick-action quick-action--purple" id="action-admin-profile" style="flex:1;">
        <div class="quick-action__icon">👤</div>
        <span class="quick-action__label">Mi Perfil</span>
      </div>
    </div>

    <div class="home-page__content">
      <div style="padding: 0 var(--space-5);">
        <div class="section-header">
          <h2 class="section-header__title">🟢 Conductores en Servicio</h2>
          <span class="badge badge--success">${activeDrivers.length} activos</span>
        </div>
      </div>

      <div style="padding: 0 var(--space-4);">
        ${driverCards}
      </div>

      <div style="padding: var(--space-3) var(--space-5);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          <div class="stat-card">
            <p class="stat-card__label">Conductores</p>
            <p class="stat-card__value">${activeDrivers.length}</p>
            <p class="stat-card__change" style="color:var(--color-accent-green);">Activos</p>
          </div>
          <div class="stat-card">
            <p class="stat-card__label">Rutas</p>
            <p class="stat-card__value">${trips.length}</p>
            <p class="stat-card__change" style="color:var(--color-accent-orange);">En operación</p>
          </div>
        </div>
      </div>

      <div style="padding: var(--space-3) var(--space-5);">
        <div class="section-header">
          <h2 class="section-header__title">💰 Resumen Financiero</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          <div class="stat-card">
            <p class="stat-card__label">Ingresos</p>
            <p class="stat-card__value" style="color:var(--color-accent-green-dark);">$${getAdminRevenue()}</p>
            <p class="stat-card__change" style="color:var(--color-accent-green);">MXN Total</p>
          </div>
          <div class="stat-card">
            <p class="stat-card__label">Boletos</p>
            <p class="stat-card__value">${getAdminPurchaseCount()}</p>
            <p class="stat-card__change" style="color:var(--color-primary-500);">Vendidos</p>
          </div>
        </div>
      </div>

      <div style="padding: 0 var(--space-5);">
        <div class="section-header">
          <h2 class="section-header__title">🖥️ Estado del Sistema</h2>
        </div>
        <div style="background: var(--color-gray-50); border-radius: var(--radius-lg); padding: var(--space-4); border: 2px solid var(--color-gray-100); margin-bottom: var(--space-3);">
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-gray-200);">
            <span style="font-size:var(--font-size-xs);color:var(--color-gray-500);">🟢 Backend</span>
            <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--color-accent-green);">localStorage (Demo)</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-gray-200);">
            <span style="font-size:var(--font-size-xs);color:var(--color-gray-500);">📱 Plataforma</span>
            <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--color-primary-700);">PWA v4.0</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;">
            <span style="font-size:var(--font-size-xs);color:var(--color-gray-500);">📊 Usuarios</span>
            <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--color-gray-800);">${getAdminUserCount()} registrados</span>
          </div>
        </div>
      </div>
    </div>

    ${renderNavbar()}
  `;
}

/* ── User Home: standard view ────────────────── */

async function renderUserHome(firstName, trips, user) {
  // Check for user's active trip
  let activeTrip = null;
  if (user) {
    try {
      activeTrip = await DataService.getUserActiveTrip(user.id);
    } catch {
      activeTrip = null;
    }
  }

  const featuredTrips = trips.slice(0, 4);

  return `
    <div class="home-page__header">
      <p class="home-page__greeting">👋 ¡Hola!</p>
      <h1 class="home-page__user-name">${firstName}</h1>
      <p class="home-page__tagline">¿A dónde vamos hoy? 🚌</p>
    </div>

    <div class="home-page__actions">
      <div class="quick-action quick-action--blue" id="action-trips">
        <div class="quick-action__icon">🗺️</div>
        <span class="quick-action__label">Ver Rutas</span>
      </div>
      <div class="quick-action quick-action--green" id="action-buy">
        <div class="quick-action__icon">🎫</div>
        <span class="quick-action__label">Comprar</span>
      </div>
      <div class="quick-action quick-action--orange" id="action-live">
        <div class="quick-action__icon">📍</div>
        <span class="quick-action__label">En Vivo</span>
      </div>
      <div class="quick-action quick-action--purple" id="action-history">
        <div class="quick-action__icon">👤</div>
        <span class="quick-action__label">Mi Perfil</span>
      </div>
    </div>

    ${activeTrip ? renderActiveTripBanner(activeTrip) : ''}

    <div class="home-page__content">
      <div style="padding: 0 var(--space-5);">
        <div class="section-header">
          <h2 class="section-header__title">🔥 Rutas Populares</h2>
        </div>
      </div>

      ${featuredTrips
        .map(
          (trip, i) => `
        <div class="trip-card trip-card--color-${['green','orange','cyan','purple'][i % 4]}"
             data-trip-id="${trip.id}"
             style="animation: slideInRight 0.3s ease ${i * 0.1}s both;">
          <div class="trip-card__header">
            <span class="trip-card__route-name">🚌 ${trip.nombreRuta || trip.nombre_ruta}</span>
            <span class="trip-card__price">$${trip.precio.toFixed(0)}</span>
          </div>
          <div class="trip-card__route-info">
            <div class="trip-card__stop">
              <span class="trip-card__stop-dot trip-card__stop-dot--origin"></span>
              ${trip.origen}
            </div>
            <div style="margin-left:4px;"><div class="trip-card__stop-line"></div></div>
            <div class="trip-card__stop">
              <span class="trip-card__stop-dot trip-card__stop-dot--destination"></span>
              ${trip.destino}
            </div>
          </div>
          <div class="trip-card__footer">
            <div class="trip-card__meta">⏰ ${formatDate(trip.fechaSalida || trip.fecha_salida)}</div>
            <span class="trip-card__seats trip-card__seats--available">${trip.asientosDisponibles ?? '—'} libres</span>
          </div>
        </div>
      `
        )
        .join('')}

      <div style="padding: var(--space-3) var(--space-5);">
        <button class="btn btn--primary btn--full btn--lg" id="view-all-trips">
          🗺️ Ver las ${trips.length} rutas disponibles
        </button>
      </div>

      <div style="padding: var(--space-3) var(--space-5);">
        <div class="section-header">
          <h2 class="section-header__title">📊 Estadísticas</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          <div class="stat-card">
            <p class="stat-card__label">Rutas</p>
            <p class="stat-card__value">${trips.length}</p>
            <p class="stat-card__change" style="color:var(--color-accent-green);">Activas</p>
          </div>
          <div class="stat-card">
            <p class="stat-card__label">Tarifa</p>
            <p class="stat-card__value">$13.50</p>
            <p class="stat-card__change" style="color:var(--color-accent-orange);">Base</p>
          </div>
        </div>
      </div>
    </div>

    ${renderNavbar()}
  `;
}

function renderActiveTripBanner(activeTrip) {
  return `
    <div style="padding: 0 var(--space-5);">
      <div class="section-header">
        <h2 class="section-header__title">🟢 Tu Viaje Activo</h2>
      </div>
    </div>
    <div class="active-trip-banner" id="active-trip-card" data-trip-id="${activeTrip.id}">
      <div class="active-trip-banner__badge">EN CURSO</div>
      <div class="active-trip-banner__header">
        <span class="active-trip-banner__route">🚌 ${activeTrip.nombreRuta || activeTrip.nombre_ruta}</span>
        <span class="active-trip-banner__seat">Asiento #${activeTrip.purchase.asiento}</span>
      </div>
      <div class="active-trip-banner__route-info">
        <div class="trip-card__stop">
          <span class="trip-card__stop-dot trip-card__stop-dot--origin"></span>
          ${activeTrip.origen}
        </div>
        <div style="margin-left:4px;"><div class="trip-card__stop-line"></div></div>
        <div class="trip-card__stop">
          <span class="trip-card__stop-dot trip-card__stop-dot--destination"></span>
          ${activeTrip.destino}
        </div>
      </div>
      <div class="active-trip-banner__footer">
        <span>⏰ ${formatDate(activeTrip.fechaSalida || activeTrip.fecha_salida)}</span>
        <span class="btn btn--success btn--sm">📍 Ver en Mapa</span>
      </div>
    </div>
  `;
}

function attachHomeListeners(isAdmin, trips) {
  if (isAdmin) {
    document.getElementById('action-drivers')?.addEventListener('click', () => router.navigate('admin'));
    document.getElementById('action-admin-panel')?.addEventListener('click', () => router.navigate('admin'));
    document.getElementById('action-admin-profile')?.addEventListener('click', () => router.navigate('profile'));
    document.getElementById('action-admin-export')?.addEventListener('click', async () => {
      await exportAdminExcel();
    });
    return;
  }

  document.getElementById('action-trips')?.addEventListener('click', () => router.navigate('trips'));
  document.getElementById('action-buy')?.addEventListener('click', () => router.navigate('purchase'));
  document.getElementById('action-live')?.addEventListener('click', () => router.navigate('trips?live=1'));
  document.getElementById('action-history')?.addEventListener('click', () => router.navigate('profile'));
  document.getElementById('view-all-trips')?.addEventListener('click', () => router.navigate('trips'));
  document.getElementById('active-trip-card')?.addEventListener('click', () => router.navigate('trips'));

  document.querySelectorAll('.trip-card[data-trip-id]').forEach((card) => {
    card.addEventListener('click', () => {
      router.navigate(`purchase?trip=${card.dataset.tripId}`);
    });
  });
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch {
    return '--';
  }
}

/* ── Admin Data Helpers ──────────────────────── */

function getAdminRevenue() {
  try {
    const purchases = JSON.parse(localStorage.getItem('premiumbus_purchases') || '[]');
    const history = JSON.parse(localStorage.getItem('premiumbus_history') || '[]');
    const total = [...purchases, ...history].reduce((s, p) => s + (p.precio || 0), 0);
    return total.toFixed(0);
  } catch { return '0'; }
}

function getAdminPurchaseCount() {
  try {
    const purchases = JSON.parse(localStorage.getItem('premiumbus_purchases') || '[]');
    const history = JSON.parse(localStorage.getItem('premiumbus_history') || '[]');
    return purchases.length + history.length;
  } catch { return 0; }
}

function getAdminUserCount() {
  try {
    return JSON.parse(localStorage.getItem('premiumbus_users') || '[]').length;
  } catch { return 0; }
}

async function exportAdminExcel() {
  try {
    const [users, purchases, trips, drivers] = await Promise.all([
      AuthService.getAllUsers(),
      DataService.getAllPurchases(),
      DataService.getTrips(),
      DataService.getDrivers(),
    ]);
    const history = JSON.parse(localStorage.getItem('premiumbus_history') || '[]');

    showToast('📊 Generando reporte Excel...', 'info');

    const result = await ExcelService.exportAuditReport({
      purchases,
      history,
      users,
      trips,
      drivers,
    });

    if (result.success) {
      showToast(`📊 Excel exportado: ${result.recordCount} registros en 6 hojas.`, 'success');
    } else {
      showToast(result.error || 'Error al exportar Excel.', 'error');
    }
  } catch (error) {
    showToast('Error al exportar datos.', 'error');
    console.error('[Export] Error:', error);
  }
}
