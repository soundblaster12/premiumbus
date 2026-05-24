/**
 * ApiClient.js — HTTP Client Wrapper
 * Centralizes all HTTP calls to the PHP REST API.
 * Handles errors uniformly and provides fallback detection.
 * 
 * Si la API no está disponible (no hay servidor PHP/MySQL arriba),
 * los servicios usan localStorage como fallback automático.
 */

// ── Configuración ───────────────────────────────
// Cambia esta URL cuando subas a producción (hosting)
const API_BASE_URL = detectApiBaseUrl();

let _apiAvailable = null; // null = no probado, true/false = resultado

/**
 * Detecta la URL base de la API automáticamente.
 * En desarrollo local: mismo origen + /api/
 * En producción: ajustar según hosting.
 */
function detectApiBaseUrl() {
  const origin = window.location.origin;
  return `${origin}/api/index.php`;
}

/**
 * Verifica si la API PHP/MySQL está disponible.
 * Se cachea el resultado para no hacer health checks repetidos.
 * @returns {Promise<boolean>}
 */
export async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;

  try {
    const response = await fetch(`${API_BASE_URL}?action=health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
    });
    const data = await response.json();
    _apiAvailable = data.status === 'ok';
  } catch {
    _apiAvailable = false;
  }

  if (_apiAvailable) {
    console.log('%c✅ API MySQL conectada', 'color: #10b981; font-weight: bold;');
  } else {
    console.log(
      '%c⚠️ API MySQL no disponible — usando localStorage (modo demo)',
      'color: #f59e0b; font-weight: bold;'
    );
  }

  return _apiAvailable;
}

/**
 * Resetea el cache de disponibilidad de la API.
 * Útil para reintentar la conexión.
 */
export function resetApiCache() {
  _apiAvailable = null;
}

/**
 * Realiza una petición GET a la API.
 * @param {string} action - Nombre de la acción (ej: 'trips')
 * @param {Object} params - Query params adicionales
 * @returns {Promise<Object>} Respuesta parseada
 * @throws {Error} Si la petición falla
 */
export async function apiGet(action, params = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Error en la petición.');
  }

  return data;
}

/**
 * Realiza una petición POST a la API.
 * @param {string} action - Nombre de la acción (ej: 'register')
 * @param {Object} body - Cuerpo de la petición
 * @returns {Promise<Object>} Respuesta parseada
 * @throws {Error} Si la petición falla
 */
export async function apiPost(action, body = {}) {
  const url = `${API_BASE_URL}?action=${encodeURIComponent(action)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Error en la petición.');
  }

  return data;
}
