/**
 * OfflineQueue.js — Offline Purchase Queue
 * 
 * Stores pending purchases in IndexedDB when offline.
 * Syncs to server/localStorage when connection is restored.
 * Follows agnostic wrapper pattern for storage abstraction.
 */

const DB_NAME = 'premiumbus_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_purchases';

class OfflineQueueService {
  constructor() {
    this._db = null;
    this._syncInProgress = false;
    this._setupConnectivityListeners();
  }

  /**
   * Opens IndexedDB connection (lazy initialization).
   * @returns {Promise<IDBDatabase>}
   */
  async _getDatabase() {
    if (this._db) return this._db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'queueId', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve(this._db);
      };

      request.onerror = () => {
        console.warn('[OfflineQueue] IndexedDB no disponible, usando fallback.');
        reject(request.error);
      };
    });
  }

  /**
   * Agrega una compra a la cola offline.
   * @param {Object} purchaseData - { userId, tripId, seatNumber, tripSnapshot }
   * @returns {Promise<{success: boolean, queueId?: number}>}
   */
  async addToQueue(purchaseData) {
    try {
      const db = await this._getDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
          ...purchaseData,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        const request = store.add(record);
        request.onsuccess = () => resolve({ success: true, queueId: request.result });
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage
      return this._addToQueueFallback(purchaseData);
    }
  }

  /**
   * Obtiene todas las compras pendientes.
   * @returns {Promise<Array>}
   */
  async getPendingPurchases() {
    try {
      const db = await this._getDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result.filter((r) => r.status === 'pending'));
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this._getPendingFallback();
    }
  }

  /**
   * Marca una compra como sincronizada.
   * @param {number} queueId
   */
  async markAsSynced(queueId) {
    try {
      const db = await this._getDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const getRequest = store.get(queueId);
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          if (record) {
            record.status = 'synced';
            record.syncedAt = new Date().toISOString();
            store.put(record);
          }
          resolve();
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch {
      // Silently ignore — non-critical
    }
  }

  /**
   * Elimina un item de la cola.
   * @param {number} queueId
   */
  async removeFromQueue(queueId) {
    try {
      const db = await this._getDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(queueId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Silently ignore
    }
  }

  /**
   * Verifica si hay compras pendientes de sincronizar.
   * @returns {Promise<number>}
   */
  async getPendingCount() {
    const pending = await this.getPendingPurchases();
    return pending.length;
  }

  /**
   * Sincroniza compras pendientes con el backend.
   * Se llama automáticamente al detectar conexión.
   * @param {Function} purchaseHandler - (purchaseData) => Promise<{success}>
   * @returns {Promise<{synced: number, failed: number}>}
   */
  async syncPendingPurchases(purchaseHandler) {
    if (this._syncInProgress) return { synced: 0, failed: 0 };
    this._syncInProgress = true;

    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingPurchases();

      for (const purchase of pending) {
        try {
          const result = await purchaseHandler(purchase);
          if (result.success) {
            await this.markAsSynced(purchase.queueId);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    } catch (error) {
      console.warn('[OfflineQueue] Error al sincronizar:', error);
    } finally {
      this._syncInProgress = false;
    }

    return { synced, failed };
  }

  /**
   * Verifica si el dispositivo está online.
   * @returns {boolean}
   */
  isOnline() {
    return navigator.onLine;
  }

  // ── Listeners de conectividad ───────────────────

  _setupConnectivityListeners() {
    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Conexión restaurada — sincronizando...');
      this._notifyOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineQueue] Sin conexión — modo offline activo.');
      this._notifyOnlineStatus(false);
    });
  }

  _notifyOnlineStatus(isOnline) {
    window.dispatchEvent(new CustomEvent('premiumbus:connectivity', {
      detail: { isOnline },
    }));
  }

  // ── Fallback localStorage ──────────────────────

  _addToQueueFallback(purchaseData) {
    try {
      const queue = JSON.parse(localStorage.getItem('premiumbus_offline_queue') || '[]');
      const record = {
        ...purchaseData,
        queueId: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      queue.push(record);
      localStorage.setItem('premiumbus_offline_queue', JSON.stringify(queue));
      return { success: true, queueId: record.queueId };
    } catch {
      return { success: false };
    }
  }

  _getPendingFallback() {
    try {
      const queue = JSON.parse(localStorage.getItem('premiumbus_offline_queue') || '[]');
      return queue.filter((r) => r.status === 'pending');
    } catch {
      return [];
    }
  }
}

export const OfflineQueue = new OfflineQueueService();
