/**
 * EmailService.js — Wrapper para envío de emails reales via EmailJS
 * 
 * EmailJS permite enviar emails desde el frontend sin backend.
 * Configuración requerida en https://www.emailjs.com/:
 *   1. Crear cuenta gratuita
 *   2. Conectar servicio Gmail (Email Services > Add New Service > Gmail)
 *   3. Crear template con variables: {{to_email}}, {{code}}, {{to_name}}
 *   4. Copiar Service ID, Template ID y Public Key aquí abajo
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN — Reemplaza con tus datos de EmailJS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EMAILJS_CONFIG = {
  publicKey: 'cMCbDTcQu6cFcHbvh',      // EmailJS > Account > API Keys > Public Key
  serviceId: 'service_2gestc9',      // EmailJS > Email Services > Service ID
  templateId: 'template_jjy8tk8',    // EmailJS > Email Templates > Template ID
};

let emailjsLoaded = false;
let emailjsLoadPromise = null;

/**
 * Carga el SDK de EmailJS dinámicamente (solo una vez).
 * @returns {Promise<boolean>}
 */
function loadEmailJSSDK() {
  if (emailjsLoaded) return Promise.resolve(true);
  if (emailjsLoadPromise) return emailjsLoadPromise;

  emailjsLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = () => {
      if (window.emailjs) {
        window.emailjs.init(EMAILJS_CONFIG.publicKey);
        emailjsLoaded = true;
        console.log('[EmailService] SDK cargado correctamente');
        resolve(true);
      } else {
        console.warn('[EmailService] SDK no disponible');
        resolve(false);
      }
    };
    script.onerror = () => {
      console.warn('[EmailService] Error cargando SDK');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return emailjsLoadPromise;
}

/**
 * Verifica si EmailJS está configurado (no tiene valores placeholder).
 * @returns {boolean}
 */
function isEmailJSConfigured() {
  return (
    EMAILJS_CONFIG.publicKey !== 'TU_PUBLIC_KEY' &&
    EMAILJS_CONFIG.serviceId !== 'TU_SERVICE_ID' &&
    EMAILJS_CONFIG.templateId !== 'TU_TEMPLATE_ID'
  );
}

/**
 * Envía el código de verificación al email del usuario.
 * @param {string} toEmail - Correo destino
 * @param {string} toName - Nombre del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendVerificationEmail(toEmail, toName, code) {
  if (!isEmailJSConfigured()) {
    console.warn('[EmailService] No configurado, usando modo demo');
    return { success: false, error: 'EmailJS no configurado' };
  }

  const sdkReady = await loadEmailJSSDK();
  if (!sdkReady) {
    return { success: false, error: 'No se pudo cargar el SDK de EmailJS' };
  }

  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName || 'Usuario',
      code: code,
      app_name: 'PremiumBus',
    };

    const response = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('[EmailService] Email enviado:', response.status);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Error enviando email:', error);
    return { success: false, error: error?.text || 'Error enviando email' };
  }
}

export const EmailService = {
  sendVerificationEmail,
  isConfigured: isEmailJSConfigured,
  loadSDK: loadEmailJSSDK,
};
