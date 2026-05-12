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

      <!-- Payment Method -->
      <div id="purchase-payment-section" style="display: ${currentTrip ? 'block' : 'none'};">
        <div class="input-group">
          <label class="input-group__label">💳 Método de Pago</label>
        </div>
        <div class="payment-method-selector" id="payment-method-selector">
          <button type="button" class="payment-method-card payment-method-card--active" data-method="cash" id="payment-cash">
            <span class="payment-method-card__icon">💵</span>
            <span class="payment-method-card__label">Efectivo</span>
          </button>
          <button type="button" class="payment-method-card" data-method="card" id="payment-card">
            <span class="payment-method-card__icon">💳</span>
            <span class="payment-method-card__label">Tarjeta</span>
          </button>
        </div>

        <!-- Card Form (hidden by default) -->
        <div class="card-form" id="card-form-section" style="display:none;">
          <div class="card-form__title">💳 Datos de Tarjeta</div>
          <div class="card-form__brands">
            <span class="card-form__brand card-form__brand--visa">VISA</span>
            <span class="card-form__brand card-form__brand--mc">MC</span>
            <span class="card-form__brand card-form__brand--amex">AMEX</span>
          </div>
          <div class="card-type-toggle" id="card-type-toggle">
            <button type="button" class="card-type-btn card-type-btn--active" data-card-type="credito" id="card-type-credit">💳 Crédito</button>
            <button type="button" class="card-type-btn" data-card-type="debito" id="card-type-debit">🏦 Débito</button>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <span class="input-wrapper__icon">${Icons.ticket}</span>
              <input type="text" id="card-number" placeholder="Número de tarjeta" maxlength="19" inputmode="numeric" autocomplete="cc-number"/>
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <span class="input-wrapper__icon">${Icons.user}</span>
              <input type="text" id="card-holder" placeholder="Nombre del titular" autocomplete="cc-name"/>
            </div>
          </div>
          <div class="card-form__row">
            <div class="input-group">
              <div class="input-wrapper">
                <span class="input-wrapper__icon">${Icons.calendar}</span>
                <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5" inputmode="numeric" autocomplete="cc-exp"/>
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <span class="input-wrapper__icon">${Icons.lock}</span>
                <input type="password" id="card-cvv" placeholder="CVV" maxlength="4" inputmode="numeric" autocomplete="cc-csc"/>
              </div>
            </div>
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
  let selectedPaymentMethod = 'cash';
  let selectedCardType = 'credito';

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
        document.getElementById('purchase-payment-section').style.display = 'block';
        renderTripDetails(currentTrip);
      } else {
        document.getElementById('purchase-seat-section').style.display = 'none';
        document.getElementById('purchase-summary-section').style.display = 'none';
        document.getElementById('purchase-payment-section').style.display = 'none';
      }

      updateConfirmButton();
    });
  }

  // ── Payment Method Selection ─────────────────
  document.getElementById('payment-cash')?.addEventListener('click', () => {
    selectedPaymentMethod = 'cash';
    document.getElementById('payment-cash').classList.add('payment-method-card--active');
    document.getElementById('payment-card').classList.remove('payment-method-card--active');
    document.getElementById('card-form-section').style.display = 'none';
  });

  document.getElementById('payment-card')?.addEventListener('click', () => {
    selectedPaymentMethod = 'card';
    document.getElementById('payment-card').classList.add('payment-method-card--active');
    document.getElementById('payment-cash').classList.remove('payment-method-card--active');
    document.getElementById('card-form-section').style.display = 'block';
  });

  // ── Card Type Toggle (Crédito / Débito) ──────
  document.getElementById('card-type-credit')?.addEventListener('click', () => {
    selectedCardType = 'credito';
    document.getElementById('card-type-credit').classList.add('card-type-btn--active');
    document.getElementById('card-type-debit').classList.remove('card-type-btn--active');
  });

  document.getElementById('card-type-debit')?.addEventListener('click', () => {
    selectedCardType = 'debito';
    document.getElementById('card-type-debit').classList.add('card-type-btn--active');
    document.getElementById('card-type-credit').classList.remove('card-type-btn--active');
  });

  // ── Card Number Auto-Format (spaces every 4 digits) ──
  document.getElementById('card-number')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    e.target.value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  // ── Expiry Date Auto-Format (MM/AA) ──────────
  document.getElementById('card-expiry')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
  });

  // ── CVV: only numbers ────────────────────────
  document.getElementById('card-cvv')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

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

    // Validate card if card payment selected
    if (selectedPaymentMethod === 'card') {
      const cardValidation = validateCardForm();
      if (!cardValidation.valid) {
        showToast(cardValidation.error, 'error');
        return;
      }
    }

    const confirmBtn = document.getElementById('purchase-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="btn__spinner"></span> Procesando...';
    }

    const result = await DataService.purchaseTicket(user.id, currentTrip.id, selectedSeat);

    if (result.success) {
      // Agregar método de pago a la compra para el modal de confirmación
      result.purchase.paymentMethod = selectedPaymentMethod;
      result.purchase.cardType = selectedPaymentMethod === 'card' ? selectedCardType : null;
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

/**
 * Valida los campos del formulario de tarjeta de crédito/débito.
 */
function validateCardForm() {
  const cardNumber = document.getElementById('card-number')?.value?.replace(/\s/g, '') || '';
  const cardHolder = document.getElementById('card-holder')?.value?.trim() || '';
  const cardExpiry = document.getElementById('card-expiry')?.value?.trim() || '';
  const cardCvv = document.getElementById('card-cvv')?.value?.trim() || '';

  if (!cardNumber || cardNumber.length < 15) {
    return { valid: false, error: 'Ingresa un número de tarjeta válido (15-16 dígitos).' };
  }
  if (!cardHolder || cardHolder.length < 3) {
    return { valid: false, error: 'Ingresa el nombre del titular de la tarjeta.' };
  }
  if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
    return { valid: false, error: 'Ingresa una fecha de vencimiento válida (MM/AA).' };
  }
  const [month] = cardExpiry.split('/').map(Number);
  if (month < 1 || month > 12) {
    return { valid: false, error: 'El mes de vencimiento debe estar entre 01 y 12.' };
  }
  if (!cardCvv || cardCvv.length < 3) {
    return { valid: false, error: 'Ingresa un CVV válido (3-4 dígitos).' };
  }

  return { valid: true };
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

  const purchaseDate = purchase.fechaCompra
    ? new Date(purchase.fechaCompra).toLocaleString('es-MX')
    : new Date().toLocaleString('es-MX');
  const folio = purchase.id || Math.floor(Math.random() * 100000);

  // QR data: folio, seat, route, date
  const qrData = JSON.stringify({
    folio: folio,
    ruta: purchase.nombreRuta || purchase.nombre_ruta,
    asiento: purchase.asiento,
    fecha: purchaseDate,
    origen: purchase.origen,
    destino: purchase.destino,
    precio: purchase.precio,
  });

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
          <span class="confirmation__detail-label">Fecha</span>
          <span class="confirmation__detail-value">${purchaseDate}</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Total</span>
          <span class="confirmation__detail-value" style="color: var(--color-primary-700); font-weight: 800;">$${purchase.precio.toFixed(2)} MXN</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Folio</span>
          <span class="confirmation__detail-value" style="font-size: var(--font-size-xs);">${folio}</span>
        </div>
        <div class="confirmation__detail-row">
          <span class="confirmation__detail-label">Pago</span>
          <span class="confirmation__detail-value">${purchase.paymentMethod === 'card' ? `💳 Tarjeta de ${purchase.cardType === 'debito' ? 'Débito' : 'Crédito'}` : '💵 Efectivo'}</span>
        </div>
      </div>
      <div id="qr-code-container" style="display:flex;justify-content:center;margin:var(--space-4) 0;flex-direction:column;align-items:center;">
        <p style="font-size:var(--font-size-xs);color:var(--color-gray-500);margin-bottom:var(--space-2);">Tu código QR del boleto:</p>
        <canvas id="qr-canvas" style="border-radius:var(--radius-md);border:3px solid var(--color-gray-200);"></canvas>
      </div>
      <button class="btn btn--success btn--full btn--lg" id="confirmation-done">
        🏠 Volver al Inicio
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Generate QR Code on canvas
  generateQROnCanvas('qr-canvas', qrData);

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

/**
 * Generates a QR code on a canvas element using a minimal implementation.
 * No external library needed — uses a simple QR encoding algorithm.
 */
function generateQROnCanvas(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Load qrcode-generator library dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  script.onload = () => {
    if (typeof qrcode === 'undefined') return;

    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = 5;
    const margin = 16;
    const size = moduleCount * cellSize + margin * 2;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // QR modules
    ctx.fillStyle = '#1a3a6b';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            margin + col * cellSize,
            margin + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  };
  script.onerror = () => {
    // Fallback: show text folio if QR fails
    const container = document.getElementById('qr-code-container');
    if (container) {
      container.innerHTML = `<p style="text-align:center;font-size:var(--font-size-sm);color:var(--color-gray-500);">📋 Folio: <strong>${data}</strong></p>`;
    }
  };
  document.head.appendChild(script);
}
