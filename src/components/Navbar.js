/**
 * Navbar.js — Bottom Navigation v3
 * Includes Profile button for users, Admin for admins.
 */

import { router } from '../services/Router.js';
import { AuthService } from '../services/AuthService.js';

export function renderNavbar() {
  const currentHash = window.location.hash.slice(2).split('?')[0] || 'home';
  const isAdmin = AuthService.isAdmin();

  const items = [
    { id: 'nav-home',     route: 'home',     emoji: '🏠', label: 'Inicio' },
    { id: 'nav-trips',    route: 'trips',    emoji: '🗺️', label: 'Viajes' },
    { id: 'nav-purchase', route: 'purchase', emoji: '🎫', label: 'Comprar' },
    { id: 'nav-profile',  route: 'profile',  emoji: '👤', label: 'Perfil' },
  ];

  if (isAdmin) {
    items.push({ id: 'nav-admin', route: 'admin', emoji: '⚙️', label: 'Admin' });
  }

  const navItems = items
    .map(
      (item) => `
      <button class="navbar__item ${currentHash === item.route ? 'navbar__item--active' : ''}"
              id="${item.id}" data-route="${item.route}">
        <span class="emoji-nav">${item.emoji}</span>
        ${item.label}
      </button>
    `
    )
    .join('');

  return `<nav class="navbar" id="main-navbar">${navItems}</nav>`;
}

export function attachNavbarListeners() {
  document.querySelectorAll('.navbar__item[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      router.navigate(btn.dataset.route);
    });
  });
}
