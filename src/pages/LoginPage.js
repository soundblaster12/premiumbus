/**
 * LoginPage.js — Login Screen with OAuth + Password Reset
 * Supports: email/password, Google Sign-In, Facebook Login, password recovery.
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

      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
        <button type="button" class="btn btn--secondary btn--full btn--md" id="login-google" style="flex:1;min-width:80px;">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button type="button" class="btn btn--secondary btn--full btn--md" id="login-facebook" style="flex:1;min-width:80px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
        <button type="button" class="btn btn--secondary btn--full btn--md" id="login-instagram" style="flex:1;min-width:80px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:white;border:none;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Instagram
        </button>
      </div>

      <p class="login-page__register">
        ¿Eres nuevo? <a href="#/register" id="login-register-link">Regístrate</a>
      </p>
    </form>

    <!-- Modal: Social Login (Email + Password) -->
    <div class="modal-overlay" id="social-login-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title" id="social-modal-title">🔐 Iniciar con Google</h2>
        <p style="text-align:center;color:var(--color-gray-500);font-size:var(--font-size-sm);margin-bottom:var(--space-4);">
          Ingresa tu correo y contraseña para continuar.
        </p>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.mail}</span>
            <input type="email" id="social-email" placeholder="tu@correo.com" autocomplete="email"/>
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="social-password" placeholder="Contraseña" autocomplete="current-password"/>
          </div>
        </div>
        <p style="text-align:center;font-size:var(--font-size-xs);color:var(--color-gray-400);margin-bottom:var(--space-3);" id="social-auto-name"></p>
        <button class="btn btn--primary btn--full btn--lg" id="social-submit" type="button">
          Iniciar Sesión
        </button>
        <button class="btn btn--secondary btn--full btn--md" id="social-cancel" type="button" style="margin-top:var(--space-3);">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Modal: Forgot Password Step 1 (Email) -->
    <div class="modal-overlay" id="forgot-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title">🔑 Recuperar Contraseña</h2>
        <p style="text-align:center;color:var(--color-gray-500);font-size:var(--font-size-sm);margin-bottom:var(--space-4);">
          Ingresa tu correo electrónico para restablecer tu contraseña.
        </p>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.mail}</span>
            <input type="email" id="forgot-email" placeholder="tu@correo.com" autocomplete="email"/>
          </div>
        </div>
        <button class="btn btn--primary btn--full btn--lg" id="forgot-submit" type="button">
          Verificar correo
        </button>
        <button class="btn btn--secondary btn--full btn--md" id="forgot-cancel" type="button" style="margin-top:var(--space-3);">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Modal: Forgot Password Step 2 (New Password) -->
    <div class="modal-overlay" id="reset-modal" style="display:none;">
      <div class="modal">
        <div class="modal__handle"></div>
        <h2 class="modal__title">🔒 Nueva Contraseña</h2>
        <p style="text-align:center;color:var(--color-gray-500);font-size:var(--font-size-sm);margin-bottom:var(--space-4);" id="reset-email-display"></p>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="reset-new-password" placeholder="Nueva contraseña (mín. 6 caracteres)"/>
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <span class="input-wrapper__icon">${Icons.lock}</span>
            <input type="password" id="reset-confirm-password" placeholder="Confirmar nueva contraseña"/>
          </div>
        </div>
        <button class="btn btn--primary btn--full btn--lg" id="reset-submit" type="button">
          Cambiar contraseña
        </button>
        <button class="btn btn--secondary btn--full btn--md" id="reset-cancel" type="button" style="margin-top:var(--space-3);">
          Cancelar
        </button>
      </div>
    </div>
  `;

  setTimeout(() => attachLoginListeners(), 0);
  return container;
}

/* ── Listeners ─────────────────────────────────── */

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

  // Email/Password Login
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const correo = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;

      if (!correo) { showToast('Ingresa tu correo electrónico.', 'error'); return; }
      if (!password) { showToast('Ingresa tu contraseña.', 'error'); return; }

      const submitBtn = document.getElementById('login-submit');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span class="btn__spinner"></span> Iniciando...'; }

      const result = await AuthService.login(correo, password);
      if (result.success) {
        showToast(`¡Bienvenido, ${result.user.nombre}! 🎉`, 'success');
        router.navigate('home');
      } else {
        showToast(result.error, 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '🚌 Iniciar Sesión'; }
      }
    });
  }

  // Google Sign-In → opens email/password modal
  document.getElementById('login-google')?.addEventListener('click', () => openSocialLoginModal('google'));

  // Facebook Login → opens email/password modal
  document.getElementById('login-facebook')?.addEventListener('click', () => openSocialLoginModal('facebook'));

  // Instagram Login → opens email/password modal
  document.getElementById('login-instagram')?.addEventListener('click', () => openSocialLoginModal('instagram'));

  // Social login modal listeners
  attachSocialLoginModalListeners();

  // Forgot Password
  attachForgotPasswordListeners();
}

/* ── Social Login Modal (Feature 1 & 4) ───────── */

let currentSocialProvider = 'google';

function openSocialLoginModal(provider) {
  currentSocialProvider = provider;
  const providerNames = { google: 'Google', facebook: 'Facebook', instagram: 'Instagram' };
  const providerEmojis = { google: '🔍', facebook: '📘', instagram: '📸' };

  const modal = document.getElementById('social-login-modal');
  const title = document.getElementById('social-modal-title');
  if (modal) modal.style.display = 'flex';
  if (title) title.textContent = `${providerEmojis[provider]} Iniciar con ${providerNames[provider]}`;

  // Reset fields
  const emailInput = document.getElementById('social-email');
  const passInput = document.getElementById('social-password');
  if (emailInput) { emailInput.value = ''; emailInput.focus(); }
  if (passInput) passInput.value = '';
  const autoName = document.getElementById('social-auto-name');
  if (autoName) autoName.textContent = '';
}

function attachSocialLoginModalListeners() {
  // Auto-generate name preview as user types email
  document.getElementById('social-email')?.addEventListener('input', (e) => {
    const email = e.target.value.trim();
    const autoName = document.getElementById('social-auto-name');
    if (autoName && email) {
      const generatedName = AuthService.generateNameFromEmail(email);
      autoName.textContent = `👤 Tu nombre de usuario será: ${generatedName}`;
    } else if (autoName) {
      autoName.textContent = '';
    }
  });

  // Submit social login
  document.getElementById('social-submit')?.addEventListener('click', async () => {
    const email = document.getElementById('social-email')?.value?.trim();
    const password = document.getElementById('social-password')?.value;

    if (!email) { showToast('Ingresa tu correo electrónico.', 'error'); return; }
    if (!password) { showToast('Ingresa tu contraseña.', 'error'); return; }

    const btn = document.getElementById('social-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn__spinner"></span> Verificando...'; }

    // Feature 1: Genera nombre automático a partir del correo
    const autoGeneratedName = AuthService.generateNameFromEmail(email);

    // Intentar encontrar usuario existente o crear uno nuevo
    const result = await AuthService.loginWithProvider(currentSocialProvider, {
      _userData: { email, name: autoGeneratedName, picture: '' },
    });

    // Si el usuario es nuevo, actualizar su contraseña en localStorage
    if (result.success) {
      const users = JSON.parse(localStorage.getItem('premiumbus_users') || '[]');
      const userIdx = users.findIndex(u => u.correo === email.toLowerCase());
      if (userIdx !== -1) {
        users[userIdx].password = password;
        localStorage.setItem('premiumbus_users', JSON.stringify(users));
      }

      showToast(`¡Bienvenido con ${currentSocialProvider === 'google' ? 'Google' : currentSocialProvider === 'facebook' ? 'Facebook' : 'Instagram'}, ${result.user.nombre}! 🎉`, 'success');
      document.getElementById('social-login-modal').style.display = 'none';
      router.navigate('home');
    } else {
      showToast(result.error, 'error');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = 'Iniciar Sesión'; }
  });

  // Cancel
  document.getElementById('social-cancel')?.addEventListener('click', () => {
    document.getElementById('social-login-modal').style.display = 'none';
  });

  // Close on overlay click
  document.getElementById('social-login-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'social-login-modal') {
      document.getElementById('social-login-modal').style.display = 'none';
    }
  });
}

/* ── Forgot Password ──────────────────────────── */

function attachForgotPasswordListeners() {
  let resetEmail = '';

  document.getElementById('login-forgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgot-modal').style.display = 'flex';
    document.getElementById('forgot-email').value = document.getElementById('login-email')?.value || '';
    document.getElementById('forgot-email')?.focus();
  });

  document.getElementById('forgot-cancel')?.addEventListener('click', () => {
    document.getElementById('forgot-modal').style.display = 'none';
  });

  document.getElementById('forgot-submit')?.addEventListener('click', async () => {
    const email = document.getElementById('forgot-email')?.value?.trim();
    if (!email) { showToast('Ingresa tu correo.', 'error'); return; }

    const btn = document.getElementById('forgot-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn__spinner"></span> Verificando...'; }

    const exists = await AuthService.emailExists(email);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Verificar correo'; }

    if (!exists) {
      showToast('No existe una cuenta con ese correo.', 'error');
      return;
    }

    resetEmail = email;
    document.getElementById('forgot-modal').style.display = 'none';
    document.getElementById('reset-modal').style.display = 'flex';
    document.getElementById('reset-email-display').textContent = `Cambiar contraseña para: ${email}`;
    document.getElementById('reset-new-password')?.focus();
  });

  document.getElementById('reset-cancel')?.addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'none';
  });

  document.getElementById('reset-submit')?.addEventListener('click', async () => {
    const newPass = document.getElementById('reset-new-password')?.value;
    const confirmPass = document.getElementById('reset-confirm-password')?.value;

    if (!newPass || newPass.length < 6) { showToast('Mínimo 6 caracteres.', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Las contraseñas no coinciden.', 'error'); return; }

    const btn = document.getElementById('reset-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn__spinner"></span> Cambiando...'; }

    const result = await AuthService.resetPassword(resetEmail, newPass);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Cambiar contraseña'; }

    if (result.success) {
      showToast('¡Contraseña actualizada! Inicia sesión.', 'success');
      document.getElementById('reset-modal').style.display = 'none';
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = resetEmail;
    } else {
      showToast(result.error, 'error');
    }
  });

  // Close modals on overlay click
  ['forgot-modal', 'reset-modal'].forEach((modalId) => {
    document.getElementById(modalId)?.addEventListener('click', (e) => {
      if (e.target.id === modalId) {
        document.getElementById(modalId).style.display = 'none';
      }
    });
  });
}

/* ── Bus Illustration ─────────────────────────── */

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
