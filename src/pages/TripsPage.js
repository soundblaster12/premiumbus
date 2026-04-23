/**
 * TripsPage.js — Trip Consultation Screen v3
 * Shows active trip prominently, collapsible route list.
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { MapService } from '../services/MapService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { showToast } from '../components/Toast.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';

let currentSimulation = null;
let isLiveMode = false;

const CARD_COLORS = ['color-green', 'color-orange', 'color-cyan', 'color-purple', 'color-red'];

export async function renderTripsPage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'trips-page';

  currentSimulation = null;
  isLiveMode = false;

  let trips = [];
  try {
    trips = await DataService.getTrips();
  } catch {
    trips = [];
  }

  // Check for user's active trip
  const user = AuthService.getCurrentUser();
  let activeTrip = null;
  if (user) {
    try {
      activeTrip = await DataService.getUserActiveTrip(user.id);
    } catch {
      activeTrip = null;
    }
  }

  // The selected trip is the active one if exists, otherwise first
  const selectedTrip = activeTrip || trips[0] || null;

  container.innerHTML = `
    <div class="trips-page__header">
      <button class="trips-page__back" id="trips-back" aria-label="Volver">
        <span style="width:24px;height:24px;">${Icons.arrowLeft}</span>
      </button>
      <h1 class="trips-page__title" id="trips-route-title">
        ${selectedTrip ? `🚌 ${selectedTrip.nombreRuta || selectedTrip.nombre_ruta}` : '🗺️ Viajes Disponibles'}
      </h1>
      <span class="live-badge" id="live-badge" style="display:none;">EN VIVO</span>
    </div>

    ${activeTrip ? `
      <div class="trips-page__active-banner" id="active-trip-banner">
        <div class="trips-page__active-badge">🟢 TU VIAJE ACTIVO</div>
        <div class="trips-page__active-info">
          <span class="trips-page__active-route">${activeTrip.nombreRuta || activeTrip.nombre_ruta}</span>
          <span class="trips-page__active-seat">Asiento #${activeTrip.purchase.asiento}</span>
        </div>
        <div class="trips-page__active-detail">
          ${activeTrip.origen} → ${activeTrip.destino}
        </div>
      </div>
    ` : ''}

    <div class="trips-page__map">
      <div class="map-container" id="trip-map-container">
        <div id="trip-map" style="width:100%;height:100%;"></div>
      </div>
    </div>

    <!-- Live Controls -->
    <div class="trips-page__live-controls">
      <button class="btn btn--danger btn--sm" id="btn-live" style="flex:1;">
        📍 En Vivo
      </button>
      <button class="btn btn--secondary btn--sm" id="btn-my-location" style="flex:1;">
        🧭 Mi Ubicación
      </button>
      ${AuthService.isAdmin() ? '' : `<button class="btn btn--success btn--sm" id="trips-buy-ticket" style="flex:1;">
        🎫 Comprar
      </button>`}
    </div>

    <!-- ETA Panel -->
    <div id="eta-panel-wrapper" style="display:none;">
      <div class="eta-panel">
        <span class="eta-panel__icon">🚌</span>
        <div class="eta-panel__info">
          <p class="eta-panel__title" id="eta-next-stop">Próxima parada: —</p>
          <p class="eta-panel__subtitle" id="eta-route-name">—</p>
        </div>
        <span class="eta-panel__time" id="eta-time">—</span>
      </div>
    </div>

    ${selectedTrip ? renderStopsSection(selectedTrip) : ''}

    <!-- Route Description -->
    ${selectedTrip?.descripcion ? `
      <div class="trips-page__description" id="route-description">
        <h3 class="trips-page__desc-title">📖 Sobre esta Ruta</h3>
        <p class="trips-page__desc-text">${selectedTrip.descripcion}</p>
        ${selectedTrip.datosHistoricos ? `
          <div class="trips-page__history-data">
            <div class="trips-page__history-item">
              <span class="trips-page__history-value">${selectedTrip.datosHistoricos.anioInicio}</span>
              <span class="trips-page__history-label">Año inicio</span>
            </div>
            <div class="trips-page__history-item">
              <span class="trips-page__history-value">${selectedTrip.datosHistoricos.kilometros} km</span>
              <span class="trips-page__history-label">Distancia</span>
            </div>
            <div class="trips-page__history-item">
              <span class="trips-page__history-value">${selectedTrip.datosHistoricos.tiempoPromedioMin}m</span>
              <span class="trips-page__history-label">Tiempo</span>
            </div>
            <div class="trips-page__history-item">
              <span class="trips-page__history-value">${selectedTrip.datosHistoricos.pasajerosDiarios}</span>
              <span class="trips-page__history-label">Pasajeros/día</span>
            </div>
          </div>
        ` : ''}
        ${selectedTrip.conductor ? `
          <div class="trips-page__conductor">
            <span class="trips-page__conductor-icon">🧑‍✈️</span>
            <div>
              <span class="trips-page__conductor-label">Conductor</span>
              <span class="trips-page__conductor-name">${selectedTrip.conductor}</span>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Search -->
    <div class="trips-page__search">
      <input type="text" class="search-input" id="trips-search" placeholder="🔍 Buscar ruta..." />
    </div>

    <!-- Toggle all routes -->
    <div style="padding: 0 var(--space-4);">
      <button class="trips-page__toggle-btn" id="toggle-all-routes">
        <div class="section-header" style="width:100%;">
          <h2 class="section-header__title">🗺️ Todas las Rutas (${trips.length})</h2>
          <span id="toggle-arrow" style="transition: transform 0.3s ease;">▼</span>
        </div>
      </button>
    </div>

    <div class="trips-page__list" id="trips-list" style="display:none;">
      ${trips.map((trip, index) => renderTripListItem(trip, index, selectedTrip?.id)).join('')}
    </div>

    <div style="height: var(--space-4);"></div>

    ${renderNavbar()}
  `;

  setTimeout(() => {
    attachNavbarListeners();
    attachTripsListeners(trips, activeTrip);

    if (selectedTrip) {
      MapService.renderTrip('trip-map', selectedTrip);
    }
  }, 50);

  return container;
}

function renderStopsSection(trip) {
  const stops = trip.paradas || [];

  const stopsHtml = stops
    .map((stop, index) => {
      const isLast = index === stops.length - 1;
      let dotClass = '';
      if (stop.tipo === 'origen') dotClass = 'stop-item__dot--origin';
      else if (stop.tipo === 'destino') dotClass = 'stop-item__dot--destination';

      const timeLabel = stop.minutos ? `⏱ ${stop.minutos} min` : stop.tipo === 'origen' ? '🟢 Inicio' : '🔴 Final';

      return `
        <div class="stop-item">
          <div class="stop-item__indicator">
            <span class="stop-item__dot ${dotClass}"></span>
            ${!isLast ? '<span class="stop-item__line"></span>' : ''}
          </div>
          <div class="stop-item__info">
            <span class="stop-item__name">${stop.nombre}</span>
          </div>
          <span class="stop-item__time">${timeLabel}</span>
        </div>
      `;
    })
    .join('');

  return `
    <div class="trips-page__stops" id="stops-section">
      <h3 class="trips-page__stops-title">📍 Paradas de la Ruta</h3>
      ${stopsHtml}
    </div>
  `;
}

function renderRouteDescription(trip) {
  if (!trip) return '';
  return `
    <div class="trips-page__description" id="route-description">
      <h3 class="trips-page__desc-title">📖 Sobre esta Ruta</h3>
      <p class="trips-page__desc-text">${trip.descripcion || 'Sin descripción disponible.'}</p>
      ${trip.datosHistoricos ? `
        <div class="trips-page__history-data">
          <div class="trips-page__history-item">
            <span class="trips-page__history-value">${trip.datosHistoricos.anioInicio}</span>
            <span class="trips-page__history-label">Año inicio</span>
          </div>
          <div class="trips-page__history-item">
            <span class="trips-page__history-value">${trip.datosHistoricos.kilometros} km</span>
            <span class="trips-page__history-label">Distancia</span>
          </div>
          <div class="trips-page__history-item">
            <span class="trips-page__history-value">${trip.datosHistoricos.tiempoPromedioMin}m</span>
            <span class="trips-page__history-label">Tiempo</span>
          </div>
          <div class="trips-page__history-item">
            <span class="trips-page__history-value">${trip.datosHistoricos.pasajerosDiarios}</span>
            <span class="trips-page__history-label">Pasajeros/día</span>
          </div>
        </div>
      ` : ''}
      ${trip.conductor ? `
        <div class="trips-page__conductor">
          <span class="trips-page__conductor-icon">🧑‍✈️</span>
          <div>
            <span class="trips-page__conductor-label">Conductor</span>
            <span class="trips-page__conductor-name">${trip.conductor}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTripListItem(trip, index, selectedTripId) {
  const isSelected = trip.id === selectedTripId;
  const routeName = trip.nombreRuta || trip.nombre_ruta;
  const colorClass = CARD_COLORS[index % CARD_COLORS.length];
  const available = trip.asientosDisponibles ?? (trip.asientosTotales - (trip.asientosOcupados?.length || 0));

  return `
    <div class="trip-card trip-card--${colorClass} ${isSelected ? 'trip-card--selected' : ''}"
         data-trip-id="${trip.id}"
         id="trip-item-${trip.id}"
         style="animation: slideInRight 0.3s ease ${index * 0.05}s both;">
      <div class="trip-card__header">
        <span class="trip-card__route-name">🚌 ${routeName}</span>
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
        <div class="trip-card__meta">
          ⏰ ${formatDate(trip.fechaSalida || trip.fecha_salida)}
        </div>
        <span class="trip-card__seats ${getSeatClass(available)}">
          ${available} disponibles
        </span>
      </div>
    </div>
  `;
}

function attachTripsListeners(trips, activeTrip) {
  let selectedTrip = activeTrip || trips[0] || null;

  document.getElementById('trips-back')?.addEventListener('click', () => {
    MapService.stopBusSimulation('trip-map');
    router.navigate('home');
  });

  // Toggle all routes list
  let routesVisible = false;
  document.getElementById('toggle-all-routes')?.addEventListener('click', () => {
    routesVisible = !routesVisible;
    const list = document.getElementById('trips-list');
    const arrow = document.getElementById('toggle-arrow');
    if (list) list.style.display = routesVisible ? 'block' : 'none';
    if (arrow) arrow.style.transform = routesVisible ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // Buy ticket
  document.getElementById('trips-buy-ticket')?.addEventListener('click', () => {
    if (selectedTrip) {
      MapService.stopBusSimulation('trip-map');
      router.navigate(`purchase?trip=${selectedTrip.id}`);
    }
  });

  // EN VIVO — Start/stop bus simulation
  document.getElementById('btn-live')?.addEventListener('click', () => {
    if (!selectedTrip) return;

    isLiveMode = !isLiveMode;
    const btn = document.getElementById('btn-live');
    const badge = document.getElementById('live-badge');
    const etaPanel = document.getElementById('eta-panel-wrapper');

    if (isLiveMode) {
      btn.textContent = '⏹ Detener';
      btn.className = 'btn btn--orange btn--sm';
      badge.style.display = 'inline-flex';
      etaPanel.style.display = 'block';

      // Start simulation
      currentSimulation = MapService.startBusSimulation('trip-map', selectedTrip);

      // Update ETA periodically
      const routeName = selectedTrip.nombreRuta || selectedTrip.nombre_ruta;
      document.getElementById('eta-route-name').textContent = routeName;
      updateETA(selectedTrip);
    } else {
      btn.textContent = '📍 En Vivo';
      btn.className = 'btn btn--danger btn--sm';
      badge.style.display = 'none';
      etaPanel.style.display = 'none';
      MapService.stopBusSimulation('trip-map');
      currentSimulation = null;
    }
  });

  // My Location
  document.getElementById('btn-my-location')?.addEventListener('click', () => {
    MapService.showUserPosition('trip-map');
  });

  // Search filter
  document.getElementById('trips-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    // Auto-expand list when searching
    const list = document.getElementById('trips-list');
    const arrow = document.getElementById('toggle-arrow');
    if (query.length > 0 && list) {
      list.style.display = 'block';
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    }

    document.querySelectorAll('.trip-card[data-trip-id]').forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? 'block' : 'none';
    });
  });

  // Trip card selection
  document.querySelectorAll('.trip-card[data-trip-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const tripId = parseInt(card.dataset.tripId);
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;

      selectedTrip = trip;

      // Stop current simulation
      if (isLiveMode) {
        isLiveMode = false;
        MapService.stopBusSimulation('trip-map');
        const btn = document.getElementById('btn-live');
        if (btn) { btn.textContent = '📍 En Vivo'; btn.className = 'btn btn--danger btn--sm'; }
        document.getElementById('live-badge').style.display = 'none';
        document.getElementById('eta-panel-wrapper').style.display = 'none';
      }

      MapService.renderTrip('trip-map', trip);

      const title = document.getElementById('trips-route-title');
      if (title) title.textContent = `🚌 ${trip.nombreRuta || trip.nombre_ruta}`;

      const stopsSection = document.getElementById('stops-section');
      if (stopsSection) {
        stopsSection.outerHTML = renderStopsSection(trip);
      }

      // Update description
      const descSection = document.getElementById('route-description');
      if (descSection) {
        descSection.outerHTML = renderRouteDescription(trip);
      }

      // Visual highlight
      document.querySelectorAll('.trip-card').forEach((c) => c.style.boxShadow = '');
      card.style.boxShadow = '0 0 0 3px var(--color-primary-400)';
    });
  });
}

function updateETA(trip) {
  if (!currentSimulation || !isLiveMode) return;

  const info = currentSimulation.getProgress();
  const nextStop = currentSimulation.getNextStop();

  // Estimated time based on stop's minutos field
  const nextMinutes = nextStop?.minutos || Math.ceil((info.currentIndex + 1) * 3);

  const etaTitle = document.getElementById('eta-next-stop');
  const etaTime = document.getElementById('eta-time');

  if (etaTitle) etaTitle.textContent = `Próxima: ${nextStop?.nombre || '—'}`;
  if (etaTime) etaTime.textContent = `~${nextMinutes}m`;

  setTimeout(() => updateETA(trip), 2000);
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch {
    return '--';
  }
}

function getSeatClass(available) {
  if (available <= 0) return 'trip-card__seats--none';
  if (available <= 10) return 'trip-card__seats--low';
  return 'trip-card__seats--available';
}
