/**
 * AuthService.js — Authentication Wrapper v4
 * 
 * Estrategia dual:
 *   1. Si la API PHP/MySQL está disponible → usa MySQL
 *   2. Si no → fallback a localStorage (modo demo)
 * 
 * Soporta: email/password, Google OAuth (email+password prompt),
 *          Facebook OAuth, Instagram OAuth, email verification code, password reset.
 * Para cambiar de backend, solo edita este archivo.
 */

import { isApiAvailable, apiPost, apiGet } from './ApiClient.js';

const STORAGE_KEYS = {
  USERS: 'premiumbus_users',
  CURRENT_USER: 'premiumbus_current_user',
  PENDING_VERIFICATION: 'premiumbus_pending_verification',
};

/**
 * @typedef {Object} UserProfile
 * @property {number|string} id
 * @property {string} nombre
 * @property {string} correo
 * @property {string} rol - 'user' | 'admin'
 * @property {string} createdAt
 * @property {string} [authProvider] - 'email' | 'google' | 'facebook' | 'instagram'
 * @property {string} [picture] - Avatar URL (social login)
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
          authProvider: 'email',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          nombre: 'Juan Pérez',
          correo: 'juan@correo.com',
          password: 'usuario123',
          rol: 'user',
          authProvider: 'email',
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
   * Registra un nuevo usuario (paso 1: inicia verificación por email).
   * @param {string} nombre
   * @param {string} correo
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string, pendingVerification?: boolean, code?: string}>}
   */
  async register(nombre, correo, password) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._registerApi(nombre, correo, password);
    }
    return this._registerLocal(nombre, correo, password);
  }

  /**
   * Genera un código de verificación y lo almacena para el email dado.
   * En modo demo, se muestra al usuario directamente.
   * @param {string} correo
   * @returns {Promise<{success: boolean, code: string}>}
   */
  async generateVerificationCode(correo) {
    const code = this._generateSixDigitCode();
    const pendingData = {
      correo: correo.toLowerCase(),
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos de validez
    };
    localStorage.setItem(STORAGE_KEYS.PENDING_VERIFICATION, JSON.stringify(pendingData));

    // En modo real, aquí enviaríamos un email real vía API
    const useApi = await isApiAvailable();
    if (useApi) {
      try {
        await apiPost('send_verification', { correo, code });
      } catch {
        // Fallback: el código ya está guardado localmente
      }
    }

    return { success: true, code };
  }

  /**
   * Verifica el código ingresado por el usuario contra el almacenado.
   * @param {string} correo
   * @param {string} inputCode
   * @returns {boolean}
   */
  verifyCode(correo, inputCode) {
    try {
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_VERIFICATION));
      if (!pending) return false;
      if (pending.correo !== correo.toLowerCase()) return false;
      if (Date.now() > pending.expiresAt) return false;
      return pending.code === inputCode;
    } catch {
      return false;
    }
  }

  /**
   * Completa el registro después de verificar el código.
   * @param {string} nombre
   * @param {string} correo
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string, user?: UserProfile}>}
   */
  async completeRegistration(nombre, correo, password) {
    localStorage.removeItem(STORAGE_KEYS.PENDING_VERIFICATION);

    const useApi = await isApiAvailable();
    if (useApi) {
      return this._registerApi(nombre, correo, password);
    }
    return this._registerLocalDirect(nombre, correo, password);
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
   * Login con proveedor social (Google, Facebook o Instagram).
   * En la versión mejorada, Google pide email+password y genera nombre automático.
   * @param {'google'|'facebook'|'instagram'} provider
   * @param {Object} tokenData
   * @returns {Promise<{success: boolean, error?: string, user?: UserProfile}>}
   */
  async loginWithProvider(provider, tokenData) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._loginWithProviderApi(provider, tokenData);
    }
    return this._loginWithProviderLocal(provider, tokenData);
  }

  /**
   * Genera un nombre de usuario automático a partir de un correo electrónico.
   * Ej: "juan.perez123@gmail.com" → "Juan Perez"
   * @param {string} email
   * @returns {string}
   */
  generateNameFromEmail(email) {
    if (!email) return 'Usuario';
    const localPart = email.split('@')[0] || 'usuario';
    // Reemplaza puntos, guiones y números por espacios
    const cleaned = localPart
      .replace(/[._\-]/g, ' ')
      .replace(/\d+/g, '')
      .trim();

    if (!cleaned) return 'Usuario';

    // Capitalizar cada palabra
    return cleaned
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Resetea la contraseña de un usuario.
   * @param {string} correo
   * @param {string} newPassword
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async resetPassword(correo, newPassword) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._resetPasswordApi(correo, newPassword);
    }
    return this._resetPasswordLocal(correo, newPassword);
  }

  /**
   * Verifica si un correo existe en el sistema.
   * @param {string} correo
   * @returns {Promise<boolean>}
   */
  async emailExists(correo) {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiPost('reset_password', { correo, new_password: 'check_only_dummy' });
        // If it reaches here, email exists — but we sent a dummy password, so this shouldn't happen
        return true;
      } catch {
        // We'll check locally as fallback
      }
    }

    const users = this._getStoredUsers();
    return users.some(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );
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

  async _loginWithProviderApi(provider, tokenData) {
    try {
      const actionMap = {
        google: 'google_login',
        facebook: 'facebook_login',
        instagram: 'instagram_login',
      };
      const action = actionMap[provider] || 'google_login';
      const data = await apiPost(action, tokenData);
      const profile = data.user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async _resetPasswordApi(correo, newPassword) {
    try {
      const data = await apiPost('reset_password', { correo, new_password: newPassword });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVADO — localStorage Fallback
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Registro local que primero genera código de verificación
   * (NO crea el usuario hasta que se verifique).
   */
  async _registerLocal(nombre, correo, password) {
    await this._delay(400);

    const users = this._getStoredUsers();
    const emailExists = users.some(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );

    if (emailExists) {
      return { success: false, error: 'Este correo electrónico ya está registrado.' };
    }

    // Generar código y guardarlo temporalmente
    const codeResult = await this.generateVerificationCode(correo);

    return {
      success: true,
      pendingVerification: true,
      code: codeResult.code,
    };
  }

  /**
   * Registro local directo (después de verificar código).
   */
  async _registerLocalDirect(nombre, correo, password) {
    await this._delay(400);

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
      authProvider: 'email',
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
   * Login social local (fallback):
   * Crea o encuentra un usuario basándose en los datos del proveedor.
   * Como no tenemos un token real para verificar en modo offline,
   * simulamos el flujo creando/encontrando el usuario.
   */
  async _loginWithProviderLocal(provider, tokenData) {
    await this._delay(600);

    // En modo local, los datos del token contienen la información del usuario
    // que fue recolectada del SDK del proveedor en el frontend
    const userData = tokenData._userData || {};
    const correo = (userData.email || '').toLowerCase();
    const nombre = userData.name || `Usuario ${provider}`;

    if (!correo) {
      return { success: false, error: 'No se pudo obtener el correo del proveedor.' };
    }

    const users = this._getStoredUsers();
    let user = users.find((u) => u.correo.toLowerCase() === correo);

    if (!user) {
      // Create new user
      user = {
        id: users.length + 1,
        nombre,
        correo,
        password: crypto.randomUUID?.() || Math.random().toString(36),
        rol: 'user',
        authProvider: provider,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    const profile = this._toProfile(user);
    profile.authProvider = provider;
    profile.picture = userData.picture || '';
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));

    return { success: true, user: profile };
  }

  async _resetPasswordLocal(correo, newPassword) {
    await this._delay(500);

    const users = this._getStoredUsers();
    const userIndex = users.findIndex(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );

    if (userIndex === -1) {
      return { success: false, error: 'No existe una cuenta con ese correo electrónico.' };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return { success: true, message: 'Contraseña actualizada exitosamente.' };
  }

  /**
   * Genera un código numérico de 6 dígitos para verificación.
   * @returns {string}
   */
  _generateSixDigitCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
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
      authProvider: user.authProvider || 'email',
    };
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const AuthService = new AuthServiceWrapper();
