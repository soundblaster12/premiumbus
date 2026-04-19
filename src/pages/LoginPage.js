/**
 * LoginPage.js — Login Screen v2 (Cartoon/Friendly)
 * Gradient hero, floating bus illustration, emoji-enhanced forms.
 */

import { AuthService } from '../services/AuthService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { showToast } from '../components/Toast.js';

export async function renderLoginPage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'login-page';

  container.innerHTML = `
    <div class="login-page__hero">
      <h1 class="login-page__title">¡Bienvenido! 👋</h1>
      <div class="login-page__illustration" id="login-illustration">
        ${renderBusIllustration()}
      </div>
      <p class="login-page__subtitle">Inicia sesión para continuar</p>
    </div>

    <form class="login-page__form" id="login-form" novalidate>
      <div class="input-group">
        <div class="input-wrapper" id="login-email-wrapper">
          <span class="input-wrapper__icon">${Icons.mail}</span>
          <input
            type="email"
            id="login-email"
            placeholder="Correo Electrónico"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="input-group">
        <div class="input-wrapper" id="login-password-wrapper">
          <span class="input-wrapper__icon">${Icons.lock}</span>
          <input
            type="password"
            id="login-password"
            placeholder="Contraseña"
            autocomplete="current-password"
            required
          />
          <button type="button" class="input-wrapper__action" id="login-toggle-password" aria-label="Mostrar contraseña">
            ${Icons.eye}
          </button>
        </div>
      </div>

      <div class="login-page__forgot">
        <a href="#" id="login-forgot">¿Olvidaste tu contraseña?</a>
      </div>

      <button type="submit" class="btn btn--primary btn--full btn--lg" id="login-submit">
        🚌 Iniciar Sesión
      </button>

      <div class="login-page__divider">O inicia con</div>

      <div style="display:flex;gap:var(--space-3);">
        <button type="button" class="btn btn--secondary btn--full btn--md" id="login-google">
          🔍 Google
        </button>
        <button type="button" class="btn btn--secondary btn--full btn--md" id="login-facebook">
          📘 Facebook
        </button>
      </div>

      <p class="login-page__register">
        ¿Eres nuevo? <a href="#/register" id="login-register-link">Regístrate</a>
      </p>
    </form>
  `;

  setTimeout(() => attachLoginListeners(), 0);
  return container;
}

function attachLoginListeners() {
  const form = document.getElementById('login-form');
  const toggleBtn = document.getElementById('login-toggle-password');
  const passwordInput = document.getElementById('login-password');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? Icons.eyeOff : Icons.eye;
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const correo = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;

      if (!correo) {
        showToast('Ingresa tu correo electrónico.', 'error');
        return;
      }
      if (!password) {
        showToast('Ingresa tu contraseña.', 'error');
        return;
      }

      const submitBtn = document.getElementById('login-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn__spinner"></span> Iniciando...';
      }

      const result = await AuthService.login(correo, password);

      if (result.success) {
        showToast(`¡Bienvenido, ${result.user.nombre}! 🎉`, 'success');
        router.navigate('home');
      } else {
        showToast(result.error, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🚌 Iniciar Sesión';
        }
      }
    });
  }

  document.getElementById('login-google')?.addEventListener('click', () => {
    showToast('Google Auth no disponible en modo demo.', 'info');
  });
  document.getElementById('login-facebook')?.addEventListener('click', () => {
    showToast('Facebook Auth no disponible en modo demo.', 'info');
  });
}

function renderBusIllustration() {
  return `
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#87CEEB" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#E0F0FF" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <rect x="30" y="50" width="25" height="70" rx="2" fill="rgba(255,255,255,0.3)"/>
      <rect x="60" y="35" width="20" height="85" rx="2" fill="rgba(255,255,255,0.25)"/>
      <rect x="150" y="45" width="22" height="75" rx="2" fill="rgba(255,255,255,0.25)"/>
      <rect x="180" y="55" width="28" height="65" rx="2" fill="rgba(255,255,255,0.3)"/>
      <rect x="95" y="25" width="30" height="95" rx="2" fill="rgba(255,255,255,0.4)"/>
      <polygon points="95,25 110,5 125,25" fill="rgba(255,255,255,0.5)"/>
      <circle cx="110" cy="15" r="3" fill="rgba(255,255,200,0.8)"/>
      <rect x="103" y="40" width="6" height="10" rx="3" fill="rgba(26,58,107,0.3)"/>
      <rect x="113" y="40" width="6" height="10" rx="3" fill="rgba(26,58,107,0.3)"/>
      <rect x="103" y="60" width="14" height="8" rx="1" fill="rgba(26,58,107,0.2)"/>
      <rect x="0" y="120" width="240" height="40" fill="rgba(255,255,255,0.15)"/>
      <line x1="0" y1="138" x2="240" y2="138" stroke="rgba(255,255,200,0.4)" stroke-width="2" stroke-dasharray="12 8"/>
      <rect x="55" y="95" width="110" height="40" rx="6" fill="#2ecc71"/>
      <rect x="55" y="95" width="110" height="15" rx="6" fill="#27ae60"/>
      <rect x="63" y="100" width="14" height="12" rx="2" fill="rgba(200,230,255,0.9)"/>
      <rect x="82" y="100" width="14" height="12" rx="2" fill="rgba(200,230,255,0.9)"/>
      <rect x="101" y="100" width="14" height="12" rx="2" fill="rgba(200,230,255,0.9)"/>
      <rect x="120" y="100" width="14" height="12" rx="2" fill="rgba(200,230,255,0.9)"/>
      <rect x="139" y="100" width="14" height="12" rx="2" fill="rgba(200,230,255,0.9)"/>
      <rect x="146" y="98" width="16" height="16" rx="3" fill="rgba(200,230,255,0.9)"/>
      <rect x="55" y="118" width="110" height="4" fill="#219a52"/>
      <text x="85" y="130" fill="white" font-size="7" font-weight="bold" font-family="Inter,sans-serif">PREMIUM BUS</text>
      <circle cx="80" cy="137" r="8" fill="#333" stroke="#555" stroke-width="2"/>
      <circle cx="80" cy="137" r="3" fill="#888"/>
      <circle cx="145" cy="137" r="8" fill="#333" stroke="#555" stroke-width="2"/>
      <circle cx="145" cy="137" r="3" fill="#888"/>
      <ellipse cx="40" cy="20" rx="20" ry="8" fill="rgba(255,255,255,0.4)"/>
      <ellipse cx="190" cy="30" rx="25" ry="9" fill="rgba(255,255,255,0.35)"/>
    </svg>
  `;
}
