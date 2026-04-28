/**
 * PurchasePage.js — Ticket Purchase Screen
 * Trip selection, visual seat selector, price summary, and purchase confirmation.
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';
import { showToast } from '../components/Toast.js';

let selectedSeat = null;
let currentTrip = null;

export async function renderPurchasePage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'purchase-page';

  selectedSeat = null;
  currentTrip = null;

  // Check for pre-selected trip from URL
  const hash = window.location.hash;
  const tripIdMatch = hash.match(/trip=(\d+)/);
  const preSelectedTripId = tripIdMatch ? parseInt(tripIdMatch[1]) : null;

  // Feature 6: Check if user already has an active route
  const user = AuthService.getCurrentUser();
  let hasActiveRoute = false;
  if (user) {
    try {
      hasActiveRoute = await DataService.userHasActiveRoute(user.id);
    } catch { hasActiveRoute = false; }
  }

  let trips = [];
  try {
    trips = await DataService.getTrips();
  } catch {
    trips = [];
  }

  if (preSelectedTripId) {
    currentTrip = trips.find((t) => t.id === preSelectedTripId) || null;
  }

  const tripOptionsHtml = trips
    .map(
      (trip) =>
        `<option value="${trip.id}" ${trip.id === preSelectedTripId ? 'selected' : ''}>
          ${trip.nombreRuta || trip.nombre_ruta} — ${trip.origen} → ${trip.destino} ($${trip.precio.toFixed(2)})
        </option>`
    )
    .join('');

  container.innerHTML = `
    <div class="purchase-page__header">
      <button class="purchase-page__back" id="purchase-back" aria-label="Volver">
        <span style="width:24px;height:24px;">${Icons.arrowLeft}</span>
      </button>
      <h1 class="purchase-page__title">🎫 Comprar Boleto</h1>
    </div>

    <div class="purchase-page__content">
      ${hasActiveRoute ? `
        <div class="active-route-warning">
          <span class="active-route-warning__icon">⚠️</span>
          <div>
            <strong>Ya tienes un viaje en curso.</strong><br>
            Debes finalizar tu ruta actual antes de comprar otro boleto. Ve a <a href="#/trips" style="color:var(--color-primary-600);font-weight:bold;">Viajes</a> para finalizar.
          </div>
        </div>
      ` : ''}
      <!-- Trip Selection -->
      <div class="input-group">
        <label class="input-group__label">🚌 Selecciona tu viaje</label>
        <div class="select-wrapper">
          <span class="select-wrapper__icon" style="width:20px;height:20px;">${Icons.bus}</span>
          <select id="purchase-trip-select">
            <option value="">— Elige un viaje —</option>
            ${tripOptionsHtml}
          </select>
          <span class="select-wrapper__arrow" style="width:16px;height:16px;">${Icons.chevronDown}</span>
        </div>
      </div>

      <!-- Seat Selector -->
      <div id="purchase-seat-section" style="display: ${currentTrip ? 'block' : 'none'};">
        <div class="input-group">
          <label class="input-group__label">💺 Selecciona tu asiento</label>
        </div>
        <div class="seat-selector" id="seat-selector">
          <div class="seat-selector__header">
            <div class="seat-selector__legend">
              <span class="seat-selector__legend-dot seat-selector__legend-dot--available"></span>
              Disponible
            </div>
            <div class="seat-selector__legend">
              <span class="seat-selector__legend-dot seat-selector__legend-dot--selected"></span>
              Seleccionado
            </div>
            <div class="seat-selector__legend">
              <span class="seat-selector__legend-dot seat-selector__legend-dot--occupied"></span>
              Ocupado
            </div>
          </div>
          <div class="seat-selector__bus">
            <div class="seat-selector__front">🚌 Frente del autobús</div>
            <div class="seat-selector__grid" id="seat-grid">
              <!-- Seats rendered dynamically -->
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase Summary -->
      <div id="purchase-summary-section" style="display: ${currentTrip ? 'block' : 'none'};">
        <div class="purchase-page__summary" id="purchase-summary">
          <div class="purchase-page__summary-row">
            <span class="purchase-page__summary-label">Ruta</span>
            <span class="purchase-page__summary-value" id="summary-route">—</span>
          </div>
          <div class="purchase-page__summary-row">
            <span class="purchase-page__summary-label">Origen → Destino</span>
            <span class="purchase-page__summary-value" id="summary-route-detail">—</span>
          </div>
          <div class="purchase-page__summary-row">
            <span class="purchase-page__summary-label">Fecha</span>
            <span class="purchase-page__summary-value" id="summary-date">—</span>
          </div>
          <div class="purchase-page__summary-row">
            <span class="purchase-page__summary-label">Asiento</span>
            <span class="purchase-page__summary-value" id="summary-seat">No seleccionado</span>
          </div>
          <div class="purchase-page__summary-row">
            <span class="purchase-page__summary-label">Total</span>
            <span class="purchase-page__total" id="summary-total">$0.00</span>
          </div>
        </div>
      </div>

      <button class="btn btn--primary btn--full btn--lg" id="purchase-confirm" disabled>
        <span style="width:20px;height:20px;">${Icons.ticket}</span>
        Confirmar Compra
      </button>
    </div>

    ${renderNavbar()}
  `;

  setTimeout(() => {
    attachNavbarListeners();
    attachPurchaseListeners(trips);

    // If pre-selected trip, render it
    if (currentTrip) {
      renderTripDetails(currentTrip);
    }
  }, 0);

  return container;
}

function attachPurchaseListeners(trips) {
  document.getElementById('purchase-back')?.addEventListener('click', () => router.navigate('home'));

  // Trip selection change
  const tripSelect = document.getElementById('purchase-trip-select');
  if (tripSelect) {
    tripSelect.addEventListener('change', () => {
      const tripId = parseInt(tripSelect.value);
      currentTrip = trips.find((t) => t.id === tripId) || null;
      selectedSeat = null;

      if (currentTrip) {
        document.getElementById('purchase-seat-section').style.display = 'block';
        document.getElementById('purchase-summary-section').style.display = 'block';
        renderTripDetails(currentTrip);
      } else {
        document.getElementById('purchase-seat-section').style.display = 'none';
        document.getElementById('purchase-summary-section').style.display = 'none';
      }

      updateConfirmButton();
    });
  }

  // Confirm purchase
  document.getElementById('purchase-confirm')?.addEventListener('click', async () => {
    if (!currentTrip || !selectedSeat) {
      showToast('Selecciona un viaje y un asiento.', 'error');
      return;
    }

    const user = AuthService.getCurrentUser();
    if (!user) {
      showToast('Debes iniciar sesión.', 'error');
      router.navigate('login');
      return;
    }

    const confirmBtn = document.getElementById('purchase-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="btn__spinner"></span> Procesando...';
    }

    const result = await DataService.purchaseTicket(user.id, currentTrip.id, selectedSeat);

    if (result.success) {
      showConfirmationModal(result.purchase);
    } else {
      showToast(result.error, 'error');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span style="width:20px;height:20px;">${Icons.ticket}</span> Confirmar Compra`;
      }
    }
  });
}

function renderTripDetails(trip) {
  // Update summary
  const summaryRoute = document.getElementById('summary-route');
  const summaryRouteDetail = document.getElementById('summary-route-detail');
  const summaryDate = document.getElementById('summary-date');
  const summaryTotal = document.getElementById('summary-total');

  if (summaryRoute) summaryRoute.textContent = trip.nombreRuta || trip.nombre_ruta;
  if (summaryRouteDetail) summaryRouteDetail.textContent = `${trip.origen} → ${trip.destino}`;
  if (summaryDate) {
    try {
      summaryDate.textContent = new Date(trip.fechaSalida).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      summaryDate.textContent = trip.fechaSalida;
    }
  }
  if (summaryTotal) summaryTotal.textContent = `$${trip.precio.toFixed(2)} MXN`;

  // Render seat grid
  renderSeatGrid(trip);
}

function renderSeatGrid(trip) {
  const grid = document.getElementById('seat-grid');
  if (!grid) return;

  const occupiedSeats = trip.asientosOcupados || [];
  let seatsHtml = '';

  for (let seatNumber = 1; seatNumber <= trip.asientosTotales; seatNumber++) {
    const isOccupied = occupiedSeats.includes(seatNumber);
    const isSelected = selectedSeat === seatNumber;

    let seatClass = 'seat-selector__seat';
    if (isOccupied) seatClass += ' seat-selector__seat--occupied';
    if (isSelected) seatClass += ' seat-selector__seat--selected';

    seatsHtml += `
      <button
        class="${seatClass}"
        data-seat="${seatNumber}"
        ${isOccupied ? 'disabled aria-disabled="true"' : ''}
        aria-label="Asiento ${seatNumber} ${isOccupied ? '(ocupado)' : '(disponible)'}"
      >
        ${seatNumber}
      </button>
    `;
  }

  grid.innerHTML = seatsHtml;

  // Attach seat click handlers
  grid.querySelectorAll('.seat-selector__seat:not(.seat-selector__seat--occupied)').forEach((btn) => {
    btn.addEventListener('click', () => {
      const seatNum = parseInt(btn.dataset.seat);

      // Deselect previous
      grid.querySelectorAll('.seat-selector__seat--selected').forEach((s) => {
        s.classList.remove('seat-selector__seat--selected');
      });

      // Select new
      btn.classList.add('seat-selector__seat--selected');
      selectedSeat = seatNum;

      // Update summary
      const summarySeat = document.getElementById('summary-seat');
      if (summarySeat) summarySeat.textContent = `Asiento #${seatNum}`;

      updateConfirmButton();
    });
  });
}

function updateConfirmButton() {
  const btn = document.getElementById('purchase-confirm');
  if (btn) {
    btn.disabled = !currentTrip || !selectedSeat;
  }
}

function showConfirmationModal(purchase) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'confirmation-modal';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__handle"></div>
      <div class="confirmation__icon">
        <span style="width:32px;height:32px;">${Icons.check}</span>
      </div>
      <h2 class="modal__title">🎉 ¡Compra Exitosa!</h2>
      <div class="confirmation__details">
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Ruta</span>
          <span class="confirmation__detail-value">${purchase.nombreRuta || purchase.nombre_ruta}</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Trayecto</span>
          <span class="confirmation__detail-value">${purchase.origen} → ${purchase.destino}</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Asiento</span>
          <span class="confirmation__detail-value">#${purchase.asiento}</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Total</span>
          <span class="confirmation__detail-value" style="color: var(--color-primary-700); font-weight: 800;">$${purchase.precio.toFixed(2)} MXN</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Folio</span>
          <span class="confirmation__detail-value" style="font-size: var(--font-size-xs);">${purchase.id}</span>
        </div>
      </div>
      <button class="btn btn--success btn--full btn--lg" id="confirmation-done">
        🏠 Volver al Inicio
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('confirmation-done')?.addEventListener('click', () => {
    overlay.remove();
    router.navigate('home');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      router.navigate('home');
    }
  });
}
