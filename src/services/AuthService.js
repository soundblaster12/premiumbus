/**
 * AuthService.js — Authentication Wrapper
 * 
 * Estrategia dual:
 *   1. Si la API PHP/MySQL está disponible → usa MySQL
 *   2. Si no → fallback a localStorage (modo demo)
 * 
 * Para cambiar de backend, solo edita este archivo.
 */

import { isApiAvailable, apiPost, apiGet } from './ApiClient.js';

const STORAGE_KEYS = {
  USERS: 'premiumbus_users',
  CURRENT_USER: 'premiumbus_current_user',
};

/**
 * @typedef {Object} UserProfile
 * @property {number|string} id
 * @property {string} nombre
 * @property {string} correo
 * @property {string} rol - 'user' | 'admin'
 * @property {string} createdAt
 */

class AuthServiceWrapper {
  constructor() {
    this._initializeDefaultUsers();
  }

  /**
   * Seeds default users in localStorage (fallback mode only).
   */
  _initializeDefaultUsers() {
    const existingUsers = this._getStoredUsers();
    if (existingUsers.length === 0) {
      const defaultUsers = [
        {
          id: 1,
          nombre: 'Administrador',
          correo: 'admin@premiumbus.com',
          password: 'admin123',
          rol: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          nombre: 'Juan Pérez',
          correo: 'juan@correo.com',
          password: 'usuario123',
          rol: 'user',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
  }

  _getStoredUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    } catch {
      return [];
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PÚBLICO — Métodos que los componentes usan
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Registra un nuevo usuario.
   * @param {string} nombre
   * @param {string} correo
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string, user?: UserProfile}>}
   */
  async register(nombre, correo, password) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._registerApi(nombre, correo, password);
    }
    return this._registerLocal(nombre, correo, password);
  }

  /**
   * Autenticación con credenciales.
   * @param {string} correo
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string, user?: UserProfile}>}
   */
  async login(correo, password) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._loginApi(correo, password);
    }
    return this._loginLocal(correo, password);
  }

  /**
   * Cierra sesión del usuario actual.
   */
  async logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /**
   * Retorna el usuario logueado, o null.
   * @returns {UserProfile|null}
   */
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el usuario actual es admin.
   * @returns {boolean}
   */
  isAdmin() {
    return this.getCurrentUser()?.rol === 'admin';
  }

  /**
   * Verifica si hay sesión activa.
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Obtiene todos los usuarios (admin only).
   * @returns {Promise<Array<UserProfile>>}
   */
  async getAllUsers() {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiGet('all_users');
        return data.users || [];
      } catch {
        return this._getStoredUsers().map(this._toProfile);
      }
    }

    await this._delay(300);
    return this._getStoredUsers().map(this._toProfile);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVADO — API MySQL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async _registerApi(nombre, correo, password) {
    try {
      const data = await apiPost('register', { nombre, correo, password });
      const profile = data.user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async _loginApi(correo, password) {
    try {
      const data = await apiPost('login', { correo, password });
      const profile = data.user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVADO — localStorage Fallback
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async _registerLocal(nombre, correo, password) {
    await this._delay(600);

    const users = this._getStoredUsers();
    const emailExists = users.some(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );

    if (emailExists) {
      return { success: false, error: 'Este correo electrónico ya está registrado.' };
    }

    const newUser = {
      id: users.length + 1,
      nombre,
      correo: correo.toLowerCase(),
      password,
      rol: 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const profile = this._toProfile(newUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));

    return { success: true, user: profile };
  }

  async _loginLocal(correo, password) {
    await this._delay(500);

    const users = this._getStoredUsers();
    const user = users.find(
      (u) =>
        u.correo.toLowerCase() === correo.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    const profile = this._toProfile(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));

    return { success: true, user: profile };
  }

  /**
   * Strips password from user object.
   */
  _toProfile(user) {
    return {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      createdAt: user.createdAt,
    };
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const AuthService = new AuthServiceWrapper();
