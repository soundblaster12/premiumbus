/**
 * RegisterPage.js — User Registration Screen
 * Form with name, email, password, confirm password.
 * Validates in real-time and connects to AuthService.
 */

import { AuthService } from '../services/AuthService.js';
import { router } from '../services/Router.js';
import { Icons } from '../components/Icons.js';
import { showToast } from '../components/Toast.js';

export async function renderRegisterPage() {
  const container = document.createElement('div');
  container.className = 'page';
  container.id = 'register-page';

  container.innerHTML = `
    <div class="register-page__header">
      <button class="register-page__back" id="register-back" aria-label="Volver al login">
        <span style="width:20px;height:20px;">${Icons.arrowLeft}</span>
        Volver
      </button>
      <h1 class="register-page__title">📝 Crear Cuenta</h1>
      <p class="register-page__subtitle">Completa tus datos para registrarte</p>
    </div>

    <form class="register-page__form" id="register-form" novalidate>
      <div class="input-group">
        <label class="input-group__label" for="register-name">Nombre completo</label>
        <div class="input-wrapper" id="register-name-wrapper">
          <span class="input-wrapper__icon">${Icons.user}</span>
          <input
            class="input-wrapper__input"
            type="text"
            id="register-name"
            placeholder="Ej. María García López"
            autocomplete="name"
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label class="input-group__label" for="register-email">Correo electrónico</label>
        <div class="input-wrapper" id="register-email-wrapper">
          <span class="input-wrapper__icon">${Icons.mail}</span>
          <input
            class="input-wrapper__input"
            type="email"
            id="register-email"
            placeholder="usuario@gmail.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label class="input-group__label" for="register-password">Contraseña</label>
        <div class="input-wrapper" id="register-password-wrapper">
          <span class="input-wrapper__icon">${Icons.lock}</span>
          <input
            class="input-wrapper__input"
            type="password"
            id="register-password"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            required
          />
          <button type="button" class="input-wrapper__action" id="register-toggle-password" aria-label="Mostrar contraseña">
            ${Icons.eye}
          </button>
        </div>
      </div>

      <div class="input-group">
        <label class="input-group__label" for="register-confirm">Confirmar contraseña</label>
        <div class="input-wrapper" id="register-confirm-wrapper">
          <span class="input-wrapper__icon">${Icons.lock}</span>
          <input
            class="input-wrapper__input"
            type="password"
            id="register-confirm"
            placeholder="Repite tu contraseña"
            autocomplete="new-password"
            required
          />
        </div>
      </div>

      <button type="submit" class="btn btn--primary btn--full btn--lg" id="register-submit">
        ✅ Registrarse
      </button>

      <p class="register-page__login-link">
        ¿Ya tienes cuenta? <a href="#/login" id="register-login-link">Inicia sesión</a>
      </p>
    </form>
  `;

  setTimeout(() => attachRegisterListeners(), 0);

  return container;
}

function attachRegisterListeners() {
  const form = document.getElementById('register-form');
  const toggleBtn = document.getElementById('register-toggle-password');
  const passwordInput = document.getElementById('register-password');
  const backBtn = document.getElementById('register-back');

  // Back navigation
  backBtn?.addEventListener('click', () => router.navigate('login'));

  // Toggle password visibility
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? Icons.eyeOff : Icons.eye;
    });
  }

  // Form submission — Step 1: validate and request verification code
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombre = document.getElementById('register-name')?.value?.trim();
      const correo = document.getElementById('register-email')?.value?.trim();
      const password = document.getElementById('register-password')?.value;
      const confirm = document.getElementById('register-confirm')?.value;

      // Validations with early return
      if (!nombre) { showToast('Ingresa tu nombre completo.', 'error'); return; }
      if (!correo) { showToast('Ingresa tu correo electrónico.', 'error'); return; }
      if (!isValidEmail(correo)) { showToast('Ingresa un correo electrónico válido.', 'error'); return; }
      if (!password || password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres.', 'error'); return; }
      if (password !== confirm) { showToast('Las contraseñas no coinciden.', 'error'); return; }

      // Show loading
      const submitBtn = document.getElementById('register-submit');
      if (submitBtn) {
        submitBtn.classList.add('btn--loading');
        submitBtn.innerHTML = '<span class="btn__spinner"></span> Enviando código...';
      }

      const result = await AuthService.register(nombre, correo, password);

      if (result.pendingVerification) {
        // Feature 2: Show verification code modal
        showToast(`📧 Código de verificación enviado a ${correo}`, 'success');
        // In demo mode, show the code as a Toast for the user
        showToast(`🔑 Tu código es: ${result.code} (modo demo)`, 'info');
        showVerificationModal(nombre, correo, password);
      } else if (result.success) {
        // Direct registration (API mode)
        showToast('¡Cuenta creada exitosamente! 🎉', 'success');
        router.navigate('home');
      } else {
        showToast(result.error, 'error');
      }

      if (submitBtn) {
        submitBtn.classList.remove('btn--loading');
        submitBtn.innerHTML = '✅ Registrarse';
      }
    });
  }
}

/**
 * Feature 2: Modal de verificación con 6 campos de código.
 */
function showVerificationModal(nombre, correo, password) {
  // Remove existing modal if any
  document.getElementById('verification-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'verification-modal';
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__handle"></div>
      <h2 class="modal__title">📧 Verifica tu correo</h2>
      <p style="text-align:center;color:var(--color-gray-500);font-size:var(--font-size-sm);margin-bottom:var(--space-4);">
        Ingresa el código de 6 dígitos enviado a <strong>${correo}</strong>
      </p>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:var(--space-4);">
        <input class="verify-code-input" id="vc-1" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
        <input class="verify-code-input" id="vc-2" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
        <input class="verify-code-input" id="vc-3" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
        <input class="verify-code-input" id="vc-4" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
        <input class="verify-code-input" id="vc-5" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
        <input class="verify-code-input" id="vc-6" type="text" maxlength="1" inputmode="numeric" autocomplete="off" />
      </div>
      <button class="btn btn--primary btn--full btn--lg" id="verify-submit" type="button">
        ✅ Verificar y Crear Cuenta
      </button>
      <button class="btn btn--secondary btn--full btn--md" id="verify-cancel" type="button" style="margin-top:var(--space-3);">
        Cancelar
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Auto-focus first input
  setTimeout(() => document.getElementById('vc-1')?.focus(), 100);

  // Auto-advance between code inputs
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`vc-${i}`);
    input?.addEventListener('input', (e) => {
      if (e.target.value && i < 6) {
        document.getElementById(`vc-${i + 1}`)?.focus();
      }
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 1) {
        document.getElementById(`vc-${i - 1}`)?.focus();
      }
    });
  }

  // Submit verification
  document.getElementById('verify-submit')?.addEventListener('click', async () => {
    let code = '';
    for (let i = 1; i <= 6; i++) {
      code += document.getElementById(`vc-${i}`)?.value || '';
    }

    if (code.length !== 6) {
      showToast('Ingresa el código completo de 6 dígitos.', 'error');
      return;
    }

    const isValid = AuthService.verifyCode(correo, code);
    if (!isValid) {
      showToast('❌ Código incorrecto o expirado. Intenta de nuevo.', 'error');
      return;
    }

    const btn = document.getElementById('verify-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn__spinner"></span> Creando cuenta...'; }

    const result = await AuthService.completeRegistration(nombre, correo, password);
    if (result.success) {
      showToast('¡Cuenta verificada y creada exitosamente! 🎉', 'success');
      overlay.remove();
      router.navigate('home');
    } else {
      showToast(result.error, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '✅ Verificar y Crear Cuenta'; }
    }
  });

  // Cancel
  document.getElementById('verify-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
