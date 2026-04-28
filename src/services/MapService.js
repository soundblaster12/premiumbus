/**
 * MapService.js — Leaflet/OSM Map Wrapper v3
 * 
 * Incluye:
 * - Renderizado de rutas con polylines
 * - Simulación de bus en tiempo real
 * - Geolocalización del usuario (Android/iOS compatible)
 * - Manejo completo de permisos y errores GPS
 */

import { showToast } from '../components/Toast.js';

let mapInstances = {};
let busAnimationTimers = {};
let userMarkers = {};

class MapServiceWrapper {
  /**
   * Destruye una instancia de mapa existente.
   */
  destroyMap(containerId) {
    if (mapInstances[containerId]) {
      mapInstances[containerId].remove();
      delete mapInstances[containerId];
    }
    this.stopBusSimulation(containerId);
  }

  /**
   * Renderiza un viaje en el mapa con ruta y paradas.
   */
  renderTrip(containerId, trip) {
    this.destroyMap(containerId);

    const container = document.getElementById(containerId);
    if (!container || typeof L === 'undefined') return;

    const originLat = trip.origenLat || trip.origen_lat;
    const originLng = trip.origenLng || trip.origen_lng;
    const destLat = trip.destinoLat || trip.destino_lat;
    const destLng = trip.destinoLng || trip.destino_lng;

    const centerLat = (originLat + destLat) / 2;
    const centerLng = (originLng + destLng) / 2;

    const map = L.map(containerId, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstances[containerId] = map;

    // Draw route polyline
    const stops = trip.paradas || [];
    if (stops.length > 0) {
      const routeCoords = stops.map((s) => [s.lat, s.lng]);

      L.polyline(routeCoords, {
        color: '#2b6dd6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
        dashArray: null,
      }).addTo(map);

      // Add stop markers
      stops.forEach((stop, index) => {
        const isOrigin = stop.tipo === 'origen';
        const isDestination = stop.tipo === 'destino';

        let iconHtml;
        if (isOrigin) {
          iconHtml = '<div style="background:#34c759;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🟢</div>';
        } else if (isDestination) {
          iconHtml = '<div style="background:#ff3b30;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🔴</div>';
        } else {
          iconHtml = `<div style="background:#2b6dd6;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${index + 1}</div>`;
        }

        const icon = L.divIcon({
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: '',
        });

        L.marker([stop.lat, stop.lng], { icon })
          .bindPopup(
            `<b>${stop.nombre}</b><br>${
              isOrigin ? '📍 Origen' : isDestination ? '🏁 Destino' : `⏱ A ${stop.minutos || '?'} min`
            }`
          )
          .addTo(map);
      });

      map.fitBounds(routeCoords, { padding: [30, 30] });
    }

    setTimeout(() => map.invalidateSize(), 200);
  }

  /**
   * Feature 3/5: Simulación de bus estilo Uber.
   * Genera puntos intermedios densos entre paradas para movimiento fluido,
   * el mapa sigue al bus automáticamente y se muestra un trail de progreso.
   */
  startBusSimulation(containerId, trip) {
    const map = mapInstances[containerId];
    if (!map) return null;

    const stops = trip.paradas || [];
    if (stops.length < 2) return null;

    // Generar ruta densa interpolada (puntos cada ~50m para suavidad)
    const denseRoute = this._generateDenseRoute(stops);

    // Crear marcador de bus con estilo premium
    const busIcon = L.divIcon({
      html: `<div class="bus-marker bus-marker--uber">
               <div class="bus-marker__pulse"></div>
               <span>🚌</span>
             </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      className: '',
    });

    const busMarker = L.marker(denseRoute[0], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);

    // Trail polyline (línea recorrida en verde)
    const trailLine = L.polyline([], {
      color: '#34c759',
      weight: 6,
      opacity: 0.9,
    }).addTo(map);

    // Remaining route (gris tenue)
    const remainingLine = L.polyline(denseRoute, {
      color: '#aaa',
      weight: 4,
      opacity: 0.4,
      dashArray: '8 6',
    }).addTo(map);

    let pointIndex = 0;
    let currentStopIndex = 0;
    const trailCoords = [];
    const FRAME_DELAY = 60; // ms entre frames (velocidad simulada)

    // Mapear qué índice en denseRoute corresponde a cada parada
    const stopIndices = this._mapStopsToDenseIndices(stops, denseRoute);

    const animateBus = () => {
      if (pointIndex >= denseRoute.length) {
        pointIndex = 0; // Loop
        trailCoords.length = 0;
        trailLine.setLatLngs([]);
        currentStopIndex = 0;
      }

      const pos = denseRoute[pointIndex];
      busMarker.setLatLng(pos);

      // Actualizar trail
      trailCoords.push(pos);
      trailLine.setLatLngs(trailCoords);

      // Seguir al bus con el mapa (estilo Uber: suave, sin saltos)
      map.panTo(pos, { animate: true, duration: 0.3, noMoveStart: true });

      // Detectar en qué parada estamos
      for (let i = currentStopIndex; i < stopIndices.length; i++) {
        if (pointIndex >= stopIndices[i]) {
          currentStopIndex = i;
        }
      }

      pointIndex++;
      busAnimationTimers[containerId] = setTimeout(animateBus, FRAME_DELAY);
    };

    busAnimationTimers[containerId] = setTimeout(animateBus, FRAME_DELAY);

    return {
      busMarker,
      getCurrentStop: () => stops[Math.min(currentStopIndex, stops.length - 1)],
      getNextStop: () => stops[Math.min(currentStopIndex + 1, stops.length - 1)],
      getProgress: () => ({
        currentIndex: currentStopIndex,
        total: stops.length,
        fraction: pointIndex / denseRoute.length,
      }),
      isFinished: () => pointIndex >= denseRoute.length - 1,
    };
  }

  /**
   * Genera puntos intermedios densos entre paradas para movimiento suave.
   */
  _generateDenseRoute(stops) {
    const dense = [];
    const POINTS_PER_SEGMENT = 80; // puntos entre cada par de paradas

    for (let i = 0; i < stops.length - 1; i++) {
      const from = [stops[i].lat, stops[i].lng];
      const to = [stops[i + 1].lat, stops[i + 1].lng];

      for (let j = 0; j <= POINTS_PER_SEGMENT; j++) {
        const t = j / POINTS_PER_SEGMENT;
        dense.push([
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t,
        ]);
      }
    }
    return dense;
  }

  /**
   * Mapea cada parada a su índice aproximado en la ruta densa.
   */
  _mapStopsToDenseIndices(stops, denseRoute) {
    return stops.map((stop) => {
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < denseRoute.length; i++) {
        const dx = denseRoute[i][0] - stop.lat;
        const dy = denseRoute[i][1] - stop.lng;
        const dist = dx * dx + dy * dy;
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      return closestIdx;
    });
  }

  /**
   * Detiene la simulación del bus.
   */
  stopBusSimulation(containerId) {
    if (busAnimationTimers[containerId]) {
      clearTimeout(busAnimationTimers[containerId]);
      delete busAnimationTimers[containerId];
    }
  }

  /**
   * Muestra la posición GPS real del usuario en el mapa.
   * Compatible con Android (Chrome/WebView) e iOS (Safari/WKWebView).
   * Maneja permisos, errores, y muestra feedback visual al usuario.
   */
  showUserPosition(containerId) {
    const map = mapInstances[containerId];
    if (!map) {
      showToast('Mapa no disponible.', 'error');
      return;
    }

    // Check if Geolocation API exists
    if (!('geolocation' in navigator)) {
      showToast('Tu dispositivo no soporta GPS.', 'error');
      return;
    }

    showToast('📍 Obteniendo ubicación...', 'info');

    // Request geolocation with mobile-optimized options
    navigator.geolocation.getCurrentPosition(
      (position) => this._handlePositionSuccess(containerId, position),
      (error) => this._handlePositionError(error),
      {
        enableHighAccuracy: true,  // Use GPS on mobile (not just WiFi)
        timeout: 15000,            // 15s timeout (mobile GPS can be slow)
        maximumAge: 30000,         // Accept cached position up to 30s old
      }
    );
  }

  /**
   * Inicia tracking continuo de la ubicación (watchPosition).
   * Ideal para Android/iOS donde el usuario se está moviendo.
   */
  startLocationTracking(containerId) {
    const map = mapInstances[containerId];
    if (!map || !('geolocation' in navigator)) return null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => this._handlePositionSuccess(containerId, position),
      (error) => this._handlePositionError(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return watchId;
  }

  /**
   * Detiene el tracking de ubicación.
   */
  stopLocationTracking(watchId) {
    if (watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /* ── Geolocation Handlers (Private) ────────── */

  _handlePositionSuccess(containerId, position) {
    const map = mapInstances[containerId];
    if (!map) return;

    const { latitude, longitude, accuracy } = position.coords;

    // Remove previous user marker if exists
    if (userMarkers[containerId]) {
      map.removeLayer(userMarkers[containerId].marker);
      if (userMarkers[containerId].circle) {
        map.removeLayer(userMarkers[containerId].circle);
      }
    }

    // Create pulsing user marker
    const userIcon = L.divIcon({
      html: `<div class="user-marker-pulse">
               <div class="user-marker"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: '',
    });

    const marker = L.marker([latitude, longitude], {
      icon: userIcon,
      zIndexOffset: 500,
    })
      .bindPopup(`📍 Tu ubicación<br><small>Precisión: ~${Math.round(accuracy)}m</small>`)
      .addTo(map);

    // Accuracy circle
    const circle = L.circle([latitude, longitude], {
      radius: Math.min(accuracy, 500),
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(map);

    userMarkers[containerId] = { marker, circle };

    // Pan to user position with zoom
    map.flyTo([latitude, longitude], 15, { duration: 1 });

    showToast('📍 Ubicación encontrada', 'success');
  }

  _handlePositionError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        showToast('⚠️ Activa los permisos de ubicación en tu dispositivo.', 'error');
        break;
      case error.POSITION_UNAVAILABLE:
        showToast('📡 No se pudo obtener la señal GPS.', 'error');
        break;
      case error.TIMEOUT:
        showToast('⏱️ La ubicación tardó demasiado. Intenta de nuevo.', 'error');
        break;
      default:
        showToast('Error al obtener ubicación.', 'error');
        break;
    }
  }
}

export const MapService = new MapServiceWrapper();
