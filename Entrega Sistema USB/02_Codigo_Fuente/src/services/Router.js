/**
 * Router.js — SPA Hash Router
 * Handles client-side navigation between pages using hash-based routing.
 * Supports route guards for auth and admin-only pages.
 */

export class Router {
  constructor() {
    this._routes = new Map();
    this._currentRoute = null;
    this._container = null;
    this._guardCallback = null;
  }

  /**
   * Sets the DOM container where pages will be rendered.
   * @param {HTMLElement} container
   */
  setContainer(container) {
    this._container = container;
  }

  /**
   * Registers a route with its page render function and optional guard.
   * @param {string} path - Hash path (e.g., 'login', 'home')
   * @param {Function} renderFunction - Returns HTML string for the page
   * @param {Object} options - { requiresAuth, requiresAdmin }
   */
  addRoute(path, renderFunction, options = {}) {
    this._routes.set(path, {
      render: renderFunction,
      requiresAuth: options.requiresAuth || false,
      requiresAdmin: options.requiresAdmin || false,
    });
  }

  /**
   * Sets the guard callback for checking auth state before route transitions.
   * @param {Function} callback - (route) => { allowed: boolean, redirect: string }
   */
  setGuard(callback) {
    this._guardCallback = callback;
  }

  /**
   * Initializes the router and starts listening for hash changes.
   */
  start() {
    window.addEventListener('hashchange', () => this._handleRouteChange());
    this._handleRouteChange();
  }

  /**
   * Programmatically navigates to a route.
   * @param {string} path
   */
  navigate(path) {
    window.location.hash = `#/${path}`;
  }

  /**
   * Returns the current route path.
   * @returns {string}
   */
  getCurrentRoute() {
    return this._currentRoute;
  }

  /**
   * Internal: handles route changes and renders the appropriate page.
   */
  async _handleRouteChange() {
    const hash = window.location.hash.slice(2) || 'login';
    const route = this._routes.get(hash);

    if (!route) {
      this.navigate('login');
      return;
    }

    // Apply route guards
    if (this._guardCallback) {
      const guardResult = await this._guardCallback(route);
      if (!guardResult.allowed) {
        this.navigate(guardResult.redirect || 'login');
        return;
      }
    }

    this._currentRoute = hash;

    if (this._container) {
      this._container.innerHTML = '';
      const pageContent = await route.render();
      if (typeof pageContent === 'string') {
        this._container.innerHTML = pageContent;
      } else if (pageContent instanceof HTMLElement) {
        this._container.appendChild(pageContent);
      }
    }
  }
}

// Singleton instance
export const router = new Router();
