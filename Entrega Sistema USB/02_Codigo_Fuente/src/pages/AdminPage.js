/**
 * AdminPage.js — Administrative Panel v3
 * Only accessible to users with role 'admin'.
 * Shows stats, user list with delete, purchase history, route management,
 * and full CRUD for conductores (drivers).
 */

import { AuthService } from '../services/AuthService.js';
import { DataService } from '../services/DataService.js';
import { ExcelService } from '../services/ExcelService.js';
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
  const [users, purchases, trips, drivers] = await Promise.all([
    AuthService.getAllUsers(),
    DataService.getAllPurchases(),
    DataService.getTrips(),
    DataService.getDrivers(),
  ]);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.precio, 0);
  const totalSeatsAvailable = trips.reduce((sum, t) => sum + (t.asientosDisponibles || 0), 0);
  const totalSeatsOccupied = trips.reduce((sum, t) => {
    const occupied = t.asientosOcupados?.length || 0;
    return sum + occupied;
  }, 0);

  const currentUser = AuthService.getCurrentUser();
  const isPrincipalAdmin = currentUser?.id === 1;

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
      <button class="admin-page__tab" data-tab="drivers" id="tab-drivers">
        🧑‍✈️ Conductores
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

    <!-- Export Excel Button -->
    <div style="padding: 0 var(--space-5); margin-bottom: var(--space-3);">
      <button class="btn btn--success btn--full btn--lg" id="admin-export-excel">
        📊 Exportar Reporte Excel (.xlsx)
      </button>
    </div>

    <div class="admin-page__logout">
      <button class="btn btn--danger btn--full" id="admin-logout">
        <span style="width:18px;height:18px;">${Icons.logout}</span>
        Cerrar Sesión
      </button>
    </div>

    <!-- Add Driver Modal -->
    <div class="modal-overlay" id="add-driver-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title">🧑‍✈️ Nuevo Conductor</h2>
        <div class="input-group">
          <label class="input-group__label">Nombre completo</label>
          <div class="input-wrapper">
            <span class="input-wrapper__icon">👤</span>
            <input type="text" id="driver-name-input" placeholder="Nombre del conductor" />
          </div>
        </div>
        <div class="input-group">
          <label class="input-group__label">Teléfono</label>
          <div class="input-wrapper">
            <span class="input-wrapper__icon">📞</span>
            <input type="tel" id="driver-phone-input" placeholder="444-123-4567" />
          </div>
        </div>
        <div class="input-group">
          <label class="input-group__label">Licencia</label>
          <div class="input-wrapper">
            <span class="input-wrapper__icon">🪪</span>
            <input type="text" id="driver-license-input" placeholder="SLP-0001" />
          </div>
        </div>
        <button class="btn btn--primary btn--full btn--lg" id="driver-save-btn" type="button">
          ✅ Guardar Conductor
        </button>
        <button class="btn btn--secondary btn--full btn--md" id="driver-cancel-btn" type="button" style="margin-top:var(--space-3);">
          Cancelar
        </button>
      </div>
    </div>

    ${renderNavbar()}
  `;

  setTimeout(() => {
    attachNavbarListeners();
    attachAdminListeners(users, purchases, trips, drivers, isPrincipalAdmin);
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

/* ── Drivers Panel ──────────────────────────────── */

function renderDriversPanel(drivers) {
  const addButton = `
    <div style="padding: 0 0 var(--space-3);">
      <button class="btn btn--primary btn--full btn--md" id="btn-add-driver">
        ➕ Agregar Conductor
      </button>
    </div>
  `;

  if (drivers.length === 0) {
    return `
      ${addButton}
      <div class="empty-state">
        <p class="empty-state__title">Sin conductores</p>
        <p class="empty-state__description">No hay conductores registrados aún.</p>
      </div>
    `;
  }

  const driverCards = drivers.map((driver, index) => {
    const statusBadge = driver.activo
      ? '<span class="live-badge" style="font-size:10px;">EN SERVICIO</span>'
      : '<span class="badge badge--warning" style="font-size:10px;">DISPONIBLE</span>';

    return `
      <div class="driver-card" style="animation: slideInRight 0.3s ease ${index * 0.04}s both;" data-driver-id="${driver.id}">
        <div class="driver-card__header">
          <span class="driver-card__icon">🧑‍✈️</span>
          <div class="driver-card__info">
            <span class="driver-card__name">${driver.nombre}</span>
            <span class="driver-card__route">🚌 ${driver.rutaAsignada || 'Sin asignar'}</span>
          </div>
          ${statusBadge}
        </div>
        <div class="driver-card__route-line">
          <span>📞 ${driver.telefono || 'Sin teléfono'}</span>
          <span style="color:var(--color-gray-400);">·</span>
          <span>🪪 ${driver.licencia || 'Sin licencia'}</span>
        </div>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);">
          <button class="btn btn--danger btn--sm driver-delete-btn" data-driver-id="${driver.id}" style="flex:1;">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');

  return addButton + driverCards;
}

/* ── Users Table with Delete ────────────────────── */

function renderUsersTable(users, isPrincipalAdmin) {
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
        <td>
          ${isPrincipalAdmin && user.id !== 1
            ? `<button class="btn btn--danger btn--sm admin-delete-user-btn" data-user-id="${user.id}" data-user-name="${user.nombre}">
                 🗑️
               </button>`
            : (user.id === 1 ? '<span style="font-size:var(--font-size-xs);color:var(--color-gray-400);">Principal</span>' : '')
          }
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
          <th>Acciones</th>
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

function attachAdminListeners(users, purchases, trips, drivers, isPrincipalAdmin) {
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
        } else if (tabName === 'drivers') {
          wrapper.innerHTML = renderDriversPanel(drivers);
          attachDriverListeners(drivers);
        } else if (tabName === 'users') {
          wrapper.innerHTML = renderUsersTable(users, isPrincipalAdmin);
          attachDeleteUserListeners(users, purchases, trips, drivers, isPrincipalAdmin);
        } else {
          wrapper.innerHTML = renderPurchasesTable(purchases);
        }
      }
    });
  });

  // Export Excel
  document.getElementById('admin-export-excel')?.addEventListener('click', async () => {
    const btn = document.getElementById('admin-export-excel');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn__spinner"></span> Generando...'; }

    const history = JSON.parse(localStorage.getItem('premiumbus_history') || '[]');

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

    if (btn) { btn.disabled = false; btn.innerHTML = '📊 Exportar Reporte Excel (.xlsx)'; }
  });

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await AuthService.logout();
    showToast('Sesión de administrador cerrada.', 'info');
    router.navigate('login');
  });
}

/* ── Delete User Listeners ──────────────────────── */

function attachDeleteUserListeners(users, purchases, trips, drivers, isPrincipalAdmin) {
  document.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.userId;
      const userName = btn.dataset.userName;

      const confirmed = confirm(`¿Estás seguro de eliminar a "${userName}"?\n\nEsta acción es irreversible. Se eliminarán todos sus datos, compras e historial.`);
      if (!confirmed) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="btn__spinner"></span>';

      const result = await AuthService.deleteUserById(userId);

      if (result.success) {
        showToast(`✅ Usuario "${userName}" eliminado correctamente.`, 'success');
        // Refresh the admin page
        router.navigate('admin');
      } else {
        showToast(result.error || 'Error al eliminar usuario.', 'error');
        btn.disabled = false;
        btn.innerHTML = '🗑️';
      }
    });
  });
}

/* ── Driver Listeners ───────────────────────────── */

function attachDriverListeners(drivers) {
  // Add driver button
  document.getElementById('btn-add-driver')?.addEventListener('click', () => {
    document.getElementById('add-driver-modal').style.display = 'flex';
  });

  // Cancel driver modal
  document.getElementById('driver-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('add-driver-modal').style.display = 'none';
  });

  // Close modal on overlay click
  document.getElementById('add-driver-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-driver-modal') {
      document.getElementById('add-driver-modal').style.display = 'none';
    }
  });

  // Save driver
  document.getElementById('driver-save-btn')?.addEventListener('click', async () => {
    const nombre = document.getElementById('driver-name-input')?.value || '';
    const telefono = document.getElementById('driver-phone-input')?.value || '';
    const licencia = document.getElementById('driver-license-input')?.value || '';

    if (!nombre.trim()) {
      showToast('El nombre es obligatorio.', 'error');
      return;
    }

    const saveBtn = document.getElementById('driver-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="btn__spinner"></span> Guardando...'; }

    const result = await DataService.addDriver({ nombre, telefono, licencia });

    if (result.success) {
      showToast(`✅ Conductor "${nombre}" agregado.`, 'success');
      document.getElementById('add-driver-modal').style.display = 'none';
      // Refresh the page
      router.navigate('admin');
    } else {
      showToast(result.error || 'Error al agregar conductor.', 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '✅ Guardar Conductor'; }
    }
  });

  // Delete driver buttons
  document.querySelectorAll('.driver-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const driverId = btn.dataset.driverId;
      const driverCard = btn.closest('.driver-card');
      const driverName = driverCard?.querySelector('.driver-card__name')?.textContent || 'conductor';

      const confirmed = confirm(`¿Eliminar al conductor "${driverName}"?\n\nSi tiene una ruta asignada, quedará sin conductor.`);
      if (!confirmed) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="btn__spinner"></span>';

      const result = await DataService.deleteDriver(driverId);

      if (result.success) {
        showToast(`✅ Conductor "${driverName}" eliminado.`, 'success');
        router.navigate('admin');
      } else {
        showToast(result.error || 'Error al eliminar conductor.', 'error');
        btn.disabled = false;
        btn.innerHTML = '🗑️ Eliminar';
      }
    });
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
