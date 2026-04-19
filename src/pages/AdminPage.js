/**
 * AdminPage.js — Administrative Panel v2
 * Only accessible to users with role 'admin'.
 * Shows stats, user list, purchase history, and route management.
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { renderNavbar, attachNavbarListeners } from '../components/Navbar.js';
import { showToast } from '../components/Toast.js';

let activeTab = 'routes';

export async function renderAdminPage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'admin-page';

  activeTab = 'routes';

  // Fetch data in parallel
  const [users, purchases, trips] = await Promise.all([
    AuthService.getAllUsers(),
    DataService.getAllPurchases(),
    DataService.getTrips(),
  ]);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.precio, 0);
  const totalSeatsAvailable = trips.reduce((sum, t) => sum + (t.asientosDisponibles || 0), 0);
  const totalSeatsOccupied = trips.reduce((sum, t) => {
    const occupied = t.asientosOcupados?.length || 0;
    return sum + occupied;
  }, 0);

  container.innerHTML = `
    <div class="admin-page__header">
      <h1 class="admin-page__title">⚙️ Panel de Administración</h1>
      <p class="admin-page__subtitle">Gestión y supervisión del sistema PremiumBus</p>
    </div>

    <div class="admin-page__stats">
      <div class="stat-card" id="stat-users">
        <p class="stat-card__label">Usuarios</p>
        <p class="stat-card__value">${users.length}</p>
        <p class="stat-card__change" style="color: var(--color-success-500);">Registrados</p>
      </div>
      <div class="stat-card" id="stat-purchases">
        <p class="stat-card__label">Compras</p>
        <p class="stat-card__value">${purchases.length}</p>
        <p class="stat-card__change" style="color: var(--color-primary-500);">Boletos vendidos</p>
      </div>
      <div class="stat-card" id="stat-revenue">
        <p class="stat-card__label">Ingresos</p>
        <p class="stat-card__value">$${totalRevenue.toFixed(0)}</p>
        <p class="stat-card__change" style="color: var(--color-success-500);">MXN Total</p>
      </div>
      <div class="stat-card" id="stat-seats">
        <p class="stat-card__label">Ocupación</p>
        <p class="stat-card__value">${totalSeatsOccupied}/${totalSeatsOccupied + totalSeatsAvailable}</p>
        <p class="stat-card__change" style="color: var(--color-warning-500);">Asientos totales</p>
      </div>
    </div>

    <div class="admin-page__tabs">
      <button class="admin-page__tab admin-page__tab--active" data-tab="routes" id="tab-routes">
        🚌 Rutas
      </button>
      <button class="admin-page__tab" data-tab="users" id="tab-users">
        👥 Usuarios
      </button>
      <button class="admin-page__tab" data-tab="purchases" id="tab-purchases">
        🎫 Compras
      </button>
    </div>

    <div class="admin-page__table-wrapper" id="admin-table-wrapper">
      ${renderRoutesPanel(trips)}
    </div>

    <div class="admin-page__logout">
      <button class="btn btn--danger btn--full" id="admin-logout">
        <span style="width:18px;height:18px;">${Icons.logout}</span>
        Cerrar Sesión
      </button>
    </div>

    ${renderNavbar()}
  `;

  setTimeout(() => {
    attachNavbarListeners();
    attachAdminListeners(users, purchases, trips);
  }, 0);

  return container;
}

function renderRoutesPanel(trips) {
  if (trips.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state__title">Sin rutas</p>
        <p class="empty-state__description">No hay rutas registradas.</p>
      </div>
    `;
  }

  return trips.map((trip, index) => {
    const routeName = trip.nombreRuta || trip.nombre_ruta;
    const totalSeats = trip.asientosTotales || 40;
    const occupiedCount = trip.asientosOcupados?.length || 0;
    const availableCount = totalSeats - occupiedCount;
    const occupancyPercent = Math.round((occupiedCount / totalSeats) * 100);
    const conductor = trip.conductor || 'Sin asignar';
    const descripcion = trip.descripcion || 'Sin descripción.';
    const datos = trip.datosHistoricos || {};

    // Color based on occupancy
    let barColor = 'var(--color-accent-green)';
    if (occupancyPercent > 70) barColor = 'var(--color-accent-red)';
    else if (occupancyPercent > 40) barColor = 'var(--color-accent-orange)';

    return `
      <div class="admin-route-card" style="animation: slideInRight 0.3s ease ${index * 0.04}s both;">
        <div class="admin-route-card__header">
          <span class="admin-route-card__name">🚌 ${routeName}</span>
          <span class="admin-route-card__price">$${trip.precio.toFixed(2)}</span>
        </div>

        <p class="admin-route-card__desc">${descripcion}</p>

        <div class="admin-route-card__conductor">
          <span class="admin-route-card__conductor-icon">🧑‍✈️</span>
          <span class="admin-route-card__conductor-name">${conductor}</span>
        </div>

        <div class="admin-route-card__seats">
          <div class="admin-route-card__seats-header">
            <span class="admin-route-card__seats-label">Asientos</span>
            <span class="admin-route-card__seats-count">
              <span style="color: var(--color-accent-green-dark);">${availableCount} libres</span>
              · <span style="color: var(--color-accent-red-dark);">${occupiedCount} ocupados</span>
              · ${totalSeats} total
            </span>
          </div>
          <div class="admin-route-card__progress-bar">
            <div class="admin-route-card__progress-fill" style="width:${occupancyPercent}%; background:${barColor};"></div>
          </div>
          <span class="admin-route-card__occupancy">${occupancyPercent}% ocupación</span>
        </div>

        ${datos.anioInicio ? `
          <div class="admin-route-card__history">
            <span class="admin-route-card__history-pill">📅 Desde ${datos.anioInicio}</span>
            <span class="admin-route-card__history-pill">📏 ${datos.kilometros || '—'} km</span>
            <span class="admin-route-card__history-pill">⏱ ${datos.tiempoPromedioMin || '—'} min</span>
            <span class="admin-route-card__history-pill">👥 ${datos.pasajerosDiarios || '—'}/día</span>
          </div>
        ` : ''}

        <div class="admin-route-card__route-line">
          <span class="admin-route-card__origin">📍 ${trip.origen}</span>
          <span class="admin-route-card__arrow">→</span>
          <span class="admin-route-card__destination">🏁 ${trip.destino}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderUsersTable(users) {
  if (users.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state__title">Sin usuarios</p>
        <p class="empty-state__description">No hay usuarios registrados aún.</p>
      </div>
    `;
  }

  const rows = users
    .map(
      (user) => `
      <tr>
        <td style="font-weight: var(--font-weight-semibold);">${user.nombre}</td>
        <td>${user.correo}</td>
        <td>
          <span class="badge ${user.rol === 'admin' ? 'badge--primary' : 'badge--success'}">
            ${user.rol === 'admin' ? '⚙️ Admin' : '👤 Usuario'}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <table class="data-table" id="admin-data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderPurchasesTable(purchases) {
  if (purchases.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state__title">Sin compras</p>
        <p class="empty-state__description">No se han realizado compras aún.</p>
      </div>
    `;
  }

  const rows = purchases
    .map(
      (purchase) => `
      <tr>
        <td style="font-weight: var(--font-weight-semibold);">${purchase.nombreRuta || purchase.nombre_ruta}</td>
        <td>${purchase.origen} → ${purchase.destino}</td>
        <td>#${purchase.asiento}</td>
        <td style="font-weight: var(--font-weight-bold); color: var(--color-primary-700);">$${purchase.precio.toFixed(2)}</td>
        <td>${formatPurchaseDate(purchase.fechaCompra || purchase.fecha_compra)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <table class="data-table" id="admin-data-table">
      <thead>
        <tr>
          <th>Ruta</th>
          <th>Trayecto</th>
          <th>Asiento</th>
          <th>Precio</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function attachAdminListeners(users, purchases, trips) {
  // Tab switching
  document.querySelectorAll('.admin-page__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      if (tabName === activeTab) return;

      activeTab = tabName;

      // Update tab styles
      document.querySelectorAll('.admin-page__tab').forEach((t) => {
        t.classList.remove('admin-page__tab--active');
      });
      tab.classList.add('admin-page__tab--active');

      // Update content
      const wrapper = document.getElementById('admin-table-wrapper');
      if (wrapper) {
        if (tabName === 'routes') {
          wrapper.innerHTML = renderRoutesPanel(trips);
        } else if (tabName === 'users') {
          wrapper.innerHTML = renderUsersTable(users);
        } else {
          wrapper.innerHTML = renderPurchasesTable(purchases);
        }
      }
    });
  });

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await AuthService.logout();
    showToast('Sesión de administrador cerrada.', 'info');
    router.navigate('login');
  });
}

function formatPurchaseDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '--';
  }
}
