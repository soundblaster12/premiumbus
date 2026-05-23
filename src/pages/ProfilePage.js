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
import { ExcelService } from '../services/ExcelService.js';
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

  // Admin: fetch all users, purchases, and trips
  let allUsers = [];
  let allPurchases = [];
  let allTrips = [];
  if (isAdmin) {
    try {
      [allUsers, allPurchases, allTrips] = await Promise.all([
        AuthService.getAllUsers(),
        DataService.getAllPurchases(),
        DataService.getTrips(),
      ]);
    } catch {
      allUsers = [];
      allPurchases = [];
      allTrips = [];
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
      <h1 class="profile-page__name" id="profile-user-name">${user.nombre}</h1>
      <button class="profile-page__edit-name" id="profile-edit-name" title="Cambiar nombre">✏️</button>
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
      ${isAdmin ? renderAdminSection(allUsers, allPurchases, allTrips) : renderUserSection(sortedPurchases, history, now)}

      <!-- Settings (both user and admin) -->
      ${renderSettingsSection(isAdmin)}

      <!-- Logout -->
      <div class="profile-page__logout">
        <button class="btn btn--danger btn--full btn--lg" id="profile-logout">
          <span style="width:18px;height:18px;">${Icons.logout}</span>
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-overlay" id="change-password-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title">🔐 Cambiar Contraseña</h2>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="cp-current-password" placeholder="Contraseña actual" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="cp-new-password" placeholder="Nueva contraseña (mín. 6 caracteres)" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="cp-confirm-password" placeholder="Confirmar nueva contraseña" />
          </div>
        </div>
        <button class="btn btn--primary btn--full btn--lg" id="cp-submit" type="button">Cambiar Contraseña</button>
        <button class="btn btn--secondary btn--full btn--md" id="cp-cancel" type="button" style="margin-top:var(--space-3);">Cancelar</button>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div class="modal-overlay" id="delete-account-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title">⚠️ Eliminar Cuenta</h2>
        <p style="text-align:center;color:var(--color-gray-600);font-size:var(--font-size-sm);margin-bottom:var(--space-4);line-height:1.6;">
          Esta acción es <strong style="color:var(--color-accent-red);">irreversible</strong>. Se eliminarán todos tus datos, viajes e historial de compras.
        </p>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="delete-confirm-password" placeholder="Ingresa tu contraseña para confirmar" />
          </div>
        </div>
        <button class="btn btn--danger btn--full btn--lg" id="delete-confirm-btn" type="button">🗑️ Eliminar mi Cuenta</button>
        <button class="btn btn--secondary btn--full btn--md" id="delete-cancel-btn" type="button" style="margin-top:var(--space-3);">Cancelar</button>
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

/* ── Admin Section: Registered Users + Analytics ── */

function renderAdminSection(allUsers, allPurchases, allTrips) {
  const regularUsers = allUsers.filter(u => u.rol !== 'admin');
  const adminUsers = allUsers.filter(u => u.rol === 'admin');
  const totalRevenue = allPurchases.reduce((s, p) => s + (p.precio || 0), 0);
  const activePurchases = allPurchases.filter(p => p.status === 'active');

  // Top 5 rutas por ventas
  const routeSales = {};
  allPurchases.forEach(p => {
    const name = p.nombreRuta || p.nombre_ruta || 'Desconocida';
    if (!routeSales[name]) routeSales[name] = { count: 0, revenue: 0 };
    routeSales[name].count++;
    routeSales[name].revenue += (p.precio || 0);
  });
  const topRoutes = Object.entries(routeSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Recent purchases (last 5)
  const recentPurchases = [...allPurchases]
    .sort((a, b) => new Date(b.fechaCompra || 0) - new Date(a.fechaCompra || 0))
    .slice(0, 5);

  const userRows = allUsers.length > 0
    ? allUsers.map((u, i) => {
      const currentUser = AuthService.getCurrentUser();
      const isPrincipalAdmin = currentUser?.id === 1;
      const canDelete = isPrincipalAdmin && u.id !== 1;
      return `
      <div class="user-list-card" style="animation: slideInRight 0.2s ease ${i * 0.03}s both;"
           data-user-search="${(u.nombre || '').toLowerCase()} ${(u.correo || '').toLowerCase()}"
           data-user-role="${u.rol}"
           data-user-name="${u.nombre || ''}"
           data-user-email="${u.correo || ''}"
           data-user-id="${u.id}">
        <div class="user-list-card__avatar">
          ${u.nombre?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U'}
        </div>
        <div class="user-list-card__info">
          <span class="user-list-card__name">${u.nombre || 'Sin nombre'}</span>
          <span class="user-list-card__email">${u.correo}</span>
        </div>
        <div class="user-list-card__meta" style="display:flex;align-items:center;gap:var(--space-2);">
          <span class="badge ${u.rol === 'admin' ? 'badge--warning' : 'badge--success'}">${u.rol}</span>
          ${canDelete
            ? `<button class="btn btn--danger btn--sm profile-delete-user-btn" data-user-id="${u.id}" data-user-name="${u.nombre}" style="padding:6px 10px;font-size:12px;">🗑️</button>`
            : ''}
        </div>
      </div>
    `}).join('')
    : `<p style="text-align:center;color:var(--color-gray-400);padding:var(--space-6);">Sin usuarios registrados</p>`;

  return `
    <!-- Admin Quick Actions -->
    <div class="profile-page__quick-actions">
      <button class="profile-page__action-btn" id="admin-go-panel">
        <span class="profile-page__action-icon">⚙️</span>
        Panel Admin
      </button>
      <button class="profile-page__action-btn" id="admin-export-btn">
        <span class="profile-page__action-icon">📤</span>
        Exportar
      </button>
      <button class="profile-page__action-btn" id="admin-refresh-btn">
        <span class="profile-page__action-icon">🔄</span>
        Actualizar
      </button>
    </div>

    <!-- Revenue Analytics -->
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">📊 Resumen de Ingresos</h2>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-3);">
        <div class="stat-card">
          <p class="stat-card__label">Ingresos Totales</p>
          <p class="stat-card__value" style="color:var(--color-accent-green-dark);">$${totalRevenue.toFixed(0)}</p>
          <p class="stat-card__change" style="color:var(--color-accent-green);">MXN</p>
        </div>
        <div class="stat-card">
          <p class="stat-card__label">Boletos Vendidos</p>
          <p class="stat-card__value">${allPurchases.length}</p>
          <p class="stat-card__change" style="color:var(--color-primary-500);">${activePurchases.length} activos</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
        <div class="stat-card">
          <p class="stat-card__label">Usuarios</p>
          <p class="stat-card__value">${regularUsers.length}</p>
          <p class="stat-card__change" style="color:var(--color-accent-green);">Registrados</p>
        </div>
        <div class="stat-card">
          <p class="stat-card__label">Admins</p>
          <p class="stat-card__value">${adminUsers.length}</p>
          <p class="stat-card__change" style="color:var(--color-accent-orange);">Administradores</p>
        </div>
      </div>
    </div>

    <!-- Top Routes -->
    ${topRoutes.length > 0 ? `
      <div class="profile-page__section">
        <div class="section-header">
          <h2 class="section-header__title">🏆 Top Rutas por Ventas</h2>
        </div>
        ${topRoutes.map(([name, data], i) => {
          const maxCount = topRoutes[0][1].count || 1;
          const barPercent = Math.round((data.count / maxCount) * 100);
          return `
            <div style="margin-bottom:var(--space-3);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);color:var(--color-gray-800);">${i + 1}. ${name}</span>
                <span style="font-size:var(--font-size-xs);color:var(--color-gray-500);">${data.count} boletos · $${data.revenue.toFixed(0)}</span>
              </div>
              <div style="height:8px;background:var(--color-gray-100);border-radius:var(--radius-full);overflow:hidden;">
                <div style="height:100%;width:${barPercent}%;background:linear-gradient(90deg,var(--color-primary-400),var(--color-primary-600));border-radius:var(--radius-full);transition:width 0.5s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    <!-- Recent Purchases -->
    ${recentPurchases.length > 0 ? `
      <div class="profile-page__section">
        <div class="section-header">
          <h2 class="section-header__title">🕐 Compras Recientes</h2>
          <span class="profile-page__count-badge">${allPurchases.length} total</span>
        </div>
        ${recentPurchases.map((p, i) => `
          <div class="purchase-history-card" style="animation: slideInRight 0.2s ease ${i * 0.04}s both;">
            <span class="purchase-history-card__status purchase-history-card__status--${p.status === 'active' ? 'active' : 'completed'}">
              ${p.status === 'active' ? '🟢 Activo' : '✅ Completado'}
            </span>
            <div class="purchase-history-card__header">
              <span class="purchase-history-card__route">${p.nombreRuta || p.nombre_ruta || '—'}</span>
              <span class="purchase-history-card__price">$${(p.precio || 0).toFixed(2)}</span>
            </div>
            <div class="purchase-history-card__detail">
              <span class="purchase-history-card__label">Asiento #${p.asiento}</span>
              <span class="purchase-history-card__value">${p.origen || '—'} → ${p.destino || '—'}</span>
            </div>
            <div class="purchase-history-card__footer">
              <span class="purchase-history-card__folio">User ID: ${p.usuarioId}</span>
              <span class="purchase-history-card__date">${formatCompactDate(p.fechaCompra)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Users List with Advanced Search -->
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">👥 Usuarios Registrados</h2>
        <span class="profile-page__count-badge" id="user-search-count">${allUsers.length}</span>
      </div>

      <!-- Advanced Search Bar -->
      <div class="admin-search-box" style="margin-bottom:var(--space-3);">
        <div class="admin-search-box__input-wrapper">
          <span class="admin-search-box__icon">🔍</span>
          <input type="text" class="admin-search-box__input" id="admin-user-search"
                 placeholder="Buscar por nombre, correo o ID..."
                 autocomplete="off" />
          <button class="admin-search-box__clear" id="admin-search-clear" style="display:none;" title="Limpiar búsqueda">✕</button>
        </div>

        <!-- Role Filter Pills -->
        <div class="admin-search-box__filters">
          <button class="admin-search-box__pill admin-search-box__pill--active" data-filter="all">Todos (${allUsers.length})</button>
          <button class="admin-search-box__pill" data-filter="user">👤 Usuarios (${regularUsers.length})</button>
          <button class="admin-search-box__pill" data-filter="admin">⚙️ Admins (${adminUsers.length})</button>
        </div>

        <!-- Search Results Info -->
        <div class="admin-search-box__results" id="search-results-info" style="display:none;">
          <span id="search-results-text"></span>
        </div>
      </div>

      <!-- No Results State -->
      <div class="admin-search-box__empty" id="search-no-results" style="display:none;">
        <span style="font-size:48px;display:block;margin-bottom:var(--space-3);">🔍</span>
        <p style="font-weight:var(--font-weight-bold);color:var(--color-gray-700);margin-bottom:var(--space-1);">Sin resultados</p>
        <p style="font-size:var(--font-size-xs);color:var(--color-gray-500);" id="search-no-results-hint">Intenta con otro término de búsqueda.</p>
      </div>

      <div class="profile-page__users-list" id="users-list">
        ${userRows}
      </div>
    </div>
  `;
}

function formatCompactDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
}

/* ── Settings Section (shared by user & admin) ── */

function renderSettingsSection(isAdmin) {
  return `
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">⚙️ Configuración</h2>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2);">
        <button class="profile-page__action-btn" id="settings-change-password" style="justify-content:flex-start;width:100%;">
          <span class="profile-page__action-icon">🔐</span>
          Cambiar Contraseña
        </button>
        ${!isAdmin ? `
          <button class="profile-page__action-btn" id="settings-delete-account" style="justify-content:flex-start;width:100%;color:var(--color-accent-red-dark);border-color:var(--color-accent-red-light);">
            <span class="profile-page__action-icon">🗑️</span>
            Eliminar Cuenta
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/* ── Export Purchases CSV (Admin) ────────────── */

async function exportPurchasesAsExcel() {
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
      showToast(`📊 Excel exportado: ${result.recordCount} registros.`, 'success');
    } else {
      showToast(result.error || 'Error al exportar Excel.', 'error');
    }
  } catch (error) {
    showToast('Error al exportar datos.', 'error');
    console.error('[Export] Error:', error);
  }
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
      <button class="profile-page__action-btn" id="profile-refresh-btn">
        <span class="profile-page__action-icon">🔄</span>
        Actualizar
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

    <!-- Account Information -->
    <div class="profile-page__section">
      <div class="section-header">
        <h2 class="section-header__title">ℹ️ Información de Cuenta</h2>
      </div>
      <div style="background: var(--color-gray-50); border-radius: var(--radius-lg); padding: var(--space-4); border: 2px solid var(--color-gray-100);">
        <div class="purchase-history-card__detail" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--color-gray-200);">
          <span class="purchase-history-card__label">📅 Miembro desde</span>
          <span class="purchase-history-card__value">${getMemberSinceDate()}</span>
        </div>
        <div class="purchase-history-card__detail" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--color-gray-200);">
          <span class="purchase-history-card__label">🎫 Total de viajes</span>
          <span class="purchase-history-card__value">${sortedPurchases.length + historyItems.length}</span>
        </div>
        <div class="purchase-history-card__detail" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--color-gray-200);">
          <span class="purchase-history-card__label">💰 Total gastado</span>
          <span class="purchase-history-card__value" style="color: var(--color-accent-green-dark); font-weight: 800;">$${([...sortedPurchases, ...historyItems].reduce((s, p) => s + (p.precio || 0), 0)).toFixed(2)} MXN</span>
        </div>
        <div class="purchase-history-card__detail" style="padding: var(--space-2) 0;">
          <span class="purchase-history-card__label">📊 Estado</span>
          <span class="purchase-history-card__value" style="color: var(--color-accent-green); font-weight: 800;">✅ Activa</span>
        </div>
      </div>
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

    // Refresh: reload profile to update trips in real-time
    document.getElementById('profile-refresh-btn')?.addEventListener('click', () => {
      showToast('🔄 Actualizando viajes...', 'info');
      router.navigate('profile');
    });
  }

  // Admin-specific listeners
  if (isAdmin) {
    document.getElementById('admin-go-panel')?.addEventListener('click', () => router.navigate('admin'));
    document.getElementById('admin-refresh-btn')?.addEventListener('click', () => {
      showToast('🔄 Actualizando datos...', 'info');
      router.navigate('profile');
    });

    // Export purchases as Excel
    document.getElementById('admin-export-btn')?.addEventListener('click', async () => {
      await exportPurchasesAsExcel();
    });

    // Delete user buttons (admin only)
    document.querySelectorAll('.profile-delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.userId;
        const userName = btn.dataset.userName;

        const confirmed = confirm(`¿Estás seguro de eliminar a "${userName}"?\n\nEsta acción es irreversible.`);
        if (!confirmed) return;

        btn.disabled = true;
        btn.innerHTML = '⏳';

        const result = await AuthService.deleteUserById(userId);
        if (result.success) {
          showToast(`✅ Usuario "${userName}" eliminado.`, 'success');
          router.navigate('profile');
        } else {
          showToast(result.error || 'Error al eliminar.', 'error');
          btn.disabled = false;
          btn.innerHTML = '🗑️';
        }
      });
    });

    // ── Advanced User Search Algorithm ────────────
    const searchInput = document.getElementById('admin-user-search');
    const searchClear = document.getElementById('admin-search-clear');
    const searchResultsInfo = document.getElementById('search-results-info');
    const searchResultsText = document.getElementById('search-results-text');
    const searchNoResults = document.getElementById('search-no-results');
    const searchNoResultsHint = document.getElementById('search-no-results-hint');
    const searchCountBadge = document.getElementById('user-search-count');
    const userCards = document.querySelectorAll('.user-list-card[data-user-search]');
    let activeRoleFilter = 'all';

    /**
     * Normaliza texto para búsqueda: elimina acentos y convierte a minúsculas.
     * @param {string} text
     * @returns {string}
     */
    function normalizeText(text) {
      return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    /**
     * Algoritmo de búsqueda por tokens con scoring.
     * Cada token del query se busca en nombre, correo e id.
     * Score = suma de coincidencias ponderadas.
     *   - Coincidencia exacta de nombre: +10
     *   - Nombre empieza con token: +7
     *   - Nombre contiene token: +4
     *   - Correo contiene token: +3
     *   - ID coincide: +5
     * @param {string} query
     * @param {{name: string, email: string, id: string}} userData
     * @returns {number} score (0 = no match)
     */
    function computeSearchScore(query, userData) {
      if (!query) return 1; // Sin búsqueda = mostrar todo

      const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return 1;

      const normName = normalizeText(userData.name);
      const normEmail = normalizeText(userData.email);
      const normId = String(userData.id || '');
      let totalScore = 0;

      for (const token of tokens) {
        let tokenScore = 0;

        // Nombre: coincidencia exacta
        if (normName === token) {
          tokenScore += 10;
        } else if (normName.startsWith(token)) {
          tokenScore += 7;
        } else {
          // Buscar en cada palabra del nombre
          const nameWords = normName.split(/\s+/);
          for (const word of nameWords) {
            if (word.startsWith(token)) { tokenScore += 6; break; }
            if (word.includes(token)) { tokenScore += 4; break; }
          }
          if (tokenScore === 0 && normName.includes(token)) {
            tokenScore += 3;
          }
        }

        // Correo
        if (normEmail.includes(token)) {
          tokenScore += 3;
        }

        // ID
        if (normId === token) {
          tokenScore += 5;
        }

        // Si ningún token hace match, no es resultado
        if (tokenScore === 0) return 0;
        totalScore += tokenScore;
      }

      return totalScore;
    }

    /**
     * Resalta el texto que coincide con la búsqueda.
     * @param {string} originalText
     * @param {string} query
     * @returns {string} HTML con <mark> tags
     */
    function highlightMatch(originalText, query) {
      if (!query || !originalText) return originalText;
      const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return originalText;

      let result = originalText;
      for (const token of tokens) {
        const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        result = result.replace(regex, '<mark style="background:#00D4FF33;color:var(--color-primary-700);border-radius:2px;padding:0 2px;">$1</mark>');
      }
      return result;
    }

    /**
     * Ejecuta la búsqueda y actualiza la UI.
     */
    function executeSearch() {
      const query = searchInput?.value || '';
      const normalizedQuery = normalizeText(query);
      let visibleCount = 0;
      const scoredCards = [];

      userCards.forEach(card => {
        const role = card.dataset.userRole || '';
        const name = card.dataset.userName || '';
        const email = card.dataset.userEmail || '';
        const id = card.dataset.userId || '';

        // Filtro de rol
        if (activeRoleFilter !== 'all' && role !== activeRoleFilter) {
          card.style.display = 'none';
          card.style.order = '';
          return;
        }

        // Algoritmo de búsqueda con scoring
        const score = computeSearchScore(query, { name, email, id });

        if (score > 0) {
          card.style.display = 'flex';
          visibleCount++;
          scoredCards.push({ card, score });

          // Resaltar texto coincidente
          const nameEl = card.querySelector('.user-list-card__name');
          const emailEl = card.querySelector('.user-list-card__email');
          if (nameEl) nameEl.innerHTML = highlightMatch(name || 'Sin nombre', query);
          if (emailEl) emailEl.innerHTML = highlightMatch(email, query);
        } else {
          card.style.display = 'none';
          card.style.order = '';
        }
      });

      // Ordenar por relevancia (score más alto primero)
      scoredCards.sort((a, b) => b.score - a.score);
      scoredCards.forEach((item, index) => {
        item.card.style.order = String(index);
      });

      // Actualizar UI de resultados
      if (searchCountBadge) searchCountBadge.textContent = visibleCount;

      if (normalizedQuery) {
        searchClear.style.display = 'flex';
        searchResultsInfo.style.display = 'block';
        searchResultsText.innerHTML = `<strong>${visibleCount}</strong> resultado${visibleCount !== 1 ? 's' : ''} para "<em>${query}</em>"`;
      } else {
        searchClear.style.display = 'none';
        searchResultsInfo.style.display = 'none';

        // Restaurar texto original (sin highlight)
        userCards.forEach(card => {
          const nameEl = card.querySelector('.user-list-card__name');
          const emailEl = card.querySelector('.user-list-card__email');
          if (nameEl) nameEl.textContent = card.dataset.userName || 'Sin nombre';
          if (emailEl) emailEl.textContent = card.dataset.userEmail || '';
          card.style.order = '';
        });
      }

      // Mostrar/ocultar estado vacío
      if (visibleCount === 0 && (normalizedQuery || activeRoleFilter !== 'all')) {
        searchNoResults.style.display = 'block';
        searchNoResultsHint.textContent = normalizedQuery
          ? `No se encontró "${query}" en ${activeRoleFilter === 'all' ? 'ningún usuario' : (activeRoleFilter === 'admin' ? 'administradores' : 'usuarios')}.`
          : 'No hay usuarios en esta categoría.';
        document.getElementById('users-list').style.display = 'none';
      } else {
        searchNoResults.style.display = 'none';
        document.getElementById('users-list').style.display = '';
      }
    }

    // Escuchar input de búsqueda
    searchInput?.addEventListener('input', executeSearch);

    // Botón limpiar búsqueda
    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      executeSearch();
      searchInput?.focus();
    });

    // Filtros de rol
    document.querySelectorAll('.admin-search-box__pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.admin-search-box__pill').forEach(p => p.classList.remove('admin-search-box__pill--active'));
        pill.classList.add('admin-search-box__pill--active');
        activeRoleFilter = pill.dataset.filter;
        executeSearch();
      });
    });
  }

  // ── Settings Listeners ────────────────────────
  // Change Password
  document.getElementById('settings-change-password')?.addEventListener('click', () => {
    document.getElementById('change-password-modal').style.display = 'flex';
  });
  document.getElementById('cp-cancel')?.addEventListener('click', () => {
    document.getElementById('change-password-modal').style.display = 'none';
  });
  document.getElementById('cp-submit')?.addEventListener('click', async () => {
    const current = document.getElementById('cp-current-password')?.value || '';
    const newPw = document.getElementById('cp-new-password')?.value || '';
    const confirm = document.getElementById('cp-confirm-password')?.value || '';

    if (!current) { showToast('Ingresa tu contraseña actual.', 'error'); return; }
    if (newPw.length < 6) { showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error'); return; }
    if (newPw !== confirm) { showToast('Las contraseñas no coinciden.', 'error'); return; }

    // Verify current password
    const users = JSON.parse(localStorage.getItem('premiumbus_users') || '[]');
    const userIdx = users.findIndex(u => u.correo === user.correo);
    if (userIdx === -1 || users[userIdx].password !== current) {
      showToast('La contraseña actual es incorrecta.', 'error');
      return;
    }

    // Update password
    users[userIdx].password = newPw;
    localStorage.setItem('premiumbus_users', JSON.stringify(users));

    document.getElementById('change-password-modal').style.display = 'none';
    showToast('✅ Contraseña actualizada exitosamente.', 'success');
  });

  // Delete Account
  document.getElementById('settings-delete-account')?.addEventListener('click', () => {
    document.getElementById('delete-account-modal').style.display = 'flex';
  });
  document.getElementById('delete-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('delete-account-modal').style.display = 'none';
  });
  document.getElementById('delete-confirm-btn')?.addEventListener('click', async () => {
    const password = document.getElementById('delete-confirm-password')?.value || '';
    if (!password) { showToast('Ingresa tu contraseña para confirmar.', 'error'); return; }

    // Verify password
    const users = JSON.parse(localStorage.getItem('premiumbus_users') || '[]');
    const userIdx = users.findIndex(u => u.correo === user.correo);
    if (userIdx === -1 || users[userIdx].password !== password) {
      showToast('Contraseña incorrecta.', 'error');
      return;
    }

    // Delete user data
    users.splice(userIdx, 1);
    localStorage.setItem('premiumbus_users', JSON.stringify(users));

    // Remove purchases
    const purchases = JSON.parse(localStorage.getItem('premiumbus_purchases') || '[]');
    const filteredPurchases = purchases.filter(p => p.usuarioId != user.id);
    localStorage.setItem('premiumbus_purchases', JSON.stringify(filteredPurchases));

    // Remove history
    const history = JSON.parse(localStorage.getItem('premiumbus_history') || '[]');
    const filteredHistory = history.filter(h => h.usuarioId != user.id);
    localStorage.setItem('premiumbus_history', JSON.stringify(filteredHistory));

    // Remove photo
    try {
      const photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}');
      delete photos[user.id];
      localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
    } catch { /* ignore */ }

    // Logout
    await AuthService.logout();
    showToast('Tu cuenta ha sido eliminada permanentemente.', 'info');
    router.navigate('login');
  });

  // Close modals on overlay click
  ['change-password-modal', 'delete-account-modal'].forEach(modalId => {
    document.getElementById(modalId)?.addEventListener('click', (e) => {
      if (e.target.id === modalId) {
        document.getElementById(modalId).style.display = 'none';
      }
    });
  });

  // Logout
  document.getElementById('profile-logout')?.addEventListener('click', async () => {
    await AuthService.logout();
    showToast('Sesión cerrada.', 'info');
    router.navigate('login');
  });

  // Integration 2: Edit name
  document.getElementById('profile-edit-name')?.addEventListener('click', () => {
    const currentName = user.nombre || '';
    const newName = prompt('Ingresa tu nuevo nombre:', currentName);
    if (!newName || !newName.trim()) return;
    if (newName.trim() === currentName) return;

    // Update in localStorage users list
    const users = JSON.parse(localStorage.getItem('premiumbus_users') || '[]');
    const idx = users.findIndex(u => u.correo === user.correo);
    if (idx !== -1) {
      users[idx].nombre = newName.trim();
      localStorage.setItem('premiumbus_users', JSON.stringify(users));
    }

    // Update current user session
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      currentUser.nombre = newName.trim();
      localStorage.setItem('premiumbus_current_user', JSON.stringify(currentUser));
    }

    // Update visually
    const nameEl = document.getElementById('profile-user-name');
    if (nameEl) nameEl.textContent = newName.trim();

    showToast('Nombre actualizado ✅', 'success');
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

/**
 * Obtiene la fecha de creación de la cuenta del usuario.
 * Busca en la lista de usuarios para encontrar la fecha de registro.
 */
function getMemberSinceDate() {
  try {
    const users = JSON.parse(localStorage.getItem('premiumbus_users') || '[]');
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return 'Desconocido';

    const user = users.find(u => u.correo === currentUser.correo);
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    // Fallback: mostrar mes y año actual
    return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  } catch {
    return 'Mayo 2026';
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
