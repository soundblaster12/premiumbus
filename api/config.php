<?php
/**
 * config.php — Configuración de conexión a MySQL
 * 
 * IMPORTANTE: Edita estos valores con los datos de tu servidor MySQL.
 * En producción (hosting), cambia los valores según tu panel de control.
 */

// ── Credenciales de MySQL ─────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'premiumbus');
define('DB_USER', 'root');       // Cambiar en producción
define('DB_PASS', '');           // Cambiar en producción
define('DB_CHARSET', 'utf8mb4');

// ── Configuración de la API ───────────────────────
define('API_VERSION', '1.0');
define('CORS_ORIGIN', '*');      // En producción: 'https://tudominio.com'

/**
 * Crea y retorna una conexión PDO a MySQL.
 * Usa PDO para prevenir inyección SQL con prepared statements.
 * 
 * @return PDO
 * @throws PDOException
 */
function getConnection() {
    static $connection = null;
    
    if ($connection === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $connection = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    
    return $connection;
}

/**
 * Envía headers CORS para permitir peticiones desde el frontend.
 */
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    
    // Responder inmediatamente a preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Envía una respuesta JSON estandarizada.
 * 
 * @param mixed $data   Datos a enviar
 * @param int   $status Código HTTP
 */
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Envía una respuesta de error estandarizada.
 * 
 * @param string $message Mensaje de error
 * @param int    $status  Código HTTP
 */
function jsonError($message, $status = 400) {
    jsonResponse(['success' => false, 'error' => $message], $status);
}

/**
 * Lee el body JSON de la petición.
 * 
 * @return array
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}
