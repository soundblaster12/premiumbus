/**
 * HomePage.js — Home Screen v2 (Cartoon/Friendly)
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { router } from '../services/Router.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';

export async function renderHomePage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'home-page';

  const user = AuthService.getCurrentUser();
  const firstName = user?.nombre?.split(' ')[0] || 'Usuario';

  let trips = [];
  try {
    trips = await DataService.getTrips();
  } catch {
    trips = [];
  }

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

  container.innerHTML = `
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

    ${activeTrip ? `
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
    ` : ''}

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

  setTimeout(() => {
    attachNavbarListeners();

    document.getElementById('action-trips')?.addEventListener('click', () => router.navigate('trips'));
    document.getElementById('action-buy')?.addEventListener('click', () => router.navigate('purchase'));
    document.getElementById('action-live')?.addEventListener('click', () => router.navigate('trips'));
    document.getElementById('action-history')?.addEventListener('click', () => router.navigate('profile'));
    document.getElementById('view-all-trips')?.addEventListener('click', () => router.navigate('trips'));

    document.getElementById('active-trip-card')?.addEventListener('click', () => {
      router.navigate('trips');
    });

    document.querySelectorAll('.trip-card[data-trip-id]').forEach((card) => {
      card.addEventListener('click', () => {
        router.navigate(`purchase?trip=${card.dataset.tripId}`);
      });
    });
  }, 0);

  return container;
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch {
    return '--';
  }
}
