<?php
/**
 * oauth_config.php — Configuración OAuth para Google y Facebook
 * 
 * INSTRUCCIONES:
 * 1. Google: Ve a https://console.cloud.google.com/
 *    - Crea un proyecto → APIs y servicios → Credenciales
 *    - Crear ID de cliente OAuth 2.0 (tipo "Aplicación web")
 *    - Agrega tu dominio en "Orígenes autorizados de JavaScript"
 *    - Copia el Client ID aquí
 * 
 * 2. Facebook: Ve a https://developers.facebook.com/
 *    - Crea una app → Configuración → Básica
 *    - Copia el App ID y App Secret aquí
 */

// ── Google OAuth ─────────────────────────────────
define('GOOGLE_CLIENT_ID', 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com');

// ── Facebook OAuth ───────────────────────────────
define('FACEBOOK_APP_ID', 'TU_FACEBOOK_APP_ID');
define('FACEBOOK_APP_SECRET', 'TU_FACEBOOK_APP_SECRET');
