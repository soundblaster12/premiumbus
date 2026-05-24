<?php
/**
 * index.php — API REST Principal de PremiumBus
 * 
 * Router centralizado que maneja todos los endpoints.
 * Usa PDO prepared statements para prevenir inyección SQL.
 * 
 * ENDPOINTS:
 *   POST   /api/?action=register      - Registrar usuario
 *   POST   /api/?action=login         - Iniciar sesión
 *   GET    /api/?action=trips         - Obtener viajes
 *   GET    /api/?action=trip&id=X     - Obtener viaje por ID
 *   POST   /api/?action=purchase      - Comprar boleto
 *   GET    /api/?action=user_purchases&user_id=X  - Compras del usuario
 *   GET    /api/?action=all_purchases - Todas las compras (admin)
 *   GET    /api/?action=all_users     - Todos los usuarios (admin)
 *   GET    /api/?action=occupied_seats&trip_id=X   - Asientos ocupados
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/oauth_config.php';

setCorsHeaders();

// ── Router ──────────────────────────────────────
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'register':
            handleRegister();
            break;
        case 'login':
            handleLogin();
            break;
        case 'trips':
            handleGetTrips();
            break;
        case 'trip':
            handleGetTripById();
            break;
        case 'purchase':
            handlePurchase();
            break;
        case 'user_purchases':
            handleGetUserPurchases();
            break;
        case 'all_purchases':
            handleGetAllPurchases();
            break;
        case 'all_users':
            handleGetAllUsers();
            break;
        case 'occupied_seats':
            handleGetOccupiedSeats();
            break;
        case 'google_login':
            handleGoogleLogin();
            break;
        case 'facebook_login':
            handleFacebookLogin();
            break;
        case 'reset_password':
            handleResetPassword();
            break;
        case 'health':
            jsonResponse(['status' => 'ok', 'version' => API_VERSION]);
            break;
        default:
            jsonError('Acción no válida. Usa ?action=health para verificar.', 404);
    }
} catch (PDOException $e) {
    jsonError('Error de base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Error del servidor: ' . $e->getMessage(), 500);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS — Autenticación
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/?action=register
 * Body: { nombre, correo, password }
 */
function handleRegister() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $nombre   = trim($input['nombre'] ?? '');
    $correo   = trim($input['correo'] ?? '');
    $password = $input['password'] ?? '';

    // Validaciones con early return
    if (empty($nombre)) {
        jsonError('El nombre es obligatorio.');
    }
    if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        jsonError('Ingresa un correo electrónico válido.');
    }
    if (empty($password) || strlen($password) < 6) {
        jsonError('La contraseña debe tener al menos 6 caracteres.');
    }

    $db = getConnection();

    // Verificar unicidad de correo
    $stmt = $db->prepare('SELECT id FROM usuarios WHERE correo = ?');
    $stmt->execute([strtolower($correo)]);
    
    if ($stmt->fetch()) {
        jsonError('Este correo electrónico ya está registrado.');
    }

    // Insertar usuario con hash SHA-256
    $hashedPassword = hash('sha256', $password);
    $stmt = $db->prepare(
        'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$nombre, strtolower($correo), $hashedPassword, 'user']);

    $userId = $db->lastInsertId();

    jsonResponse([
        'success' => true,
        'user' => [
            'id'        => (int)$userId,
            'nombre'    => $nombre,
            'correo'    => strtolower($correo),
            'rol'       => 'user',
            'createdAt' => date('c'),
        ],
    ], 201);
}

/**
 * POST /api/?action=login
 * Body: { correo, password }
 */
function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $correo   = trim($input['correo'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($correo) || empty($password)) {
        jsonError('Correo y contraseña son obligatorios.');
    }

    $db = getConnection();
    $hashedPassword = hash('sha256', $password);

    $stmt = $db->prepare(
        'SELECT id, nombre, correo, rol, created_at FROM usuarios WHERE correo = ? AND password = ?'
    );
    $stmt->execute([strtolower($correo), $hashedPassword]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('Correo o contraseña incorrectos.');
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id'        => (int)$user['id'],
            'nombre'    => $user['nombre'],
            'correo'    => $user['correo'],
            'rol'       => $user['rol'],
            'createdAt' => $user['created_at'],
        ],
    ]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS — Viajes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/?action=trips
 */
function handleGetTrips() {
    $db = getConnection();

    $stmt = $db->query(
        'SELECT v.*, 
                v.asientos_totales - COALESCE(
                    (SELECT COUNT(*) FROM compras c WHERE c.viaje_id = v.id), 0
                ) AS asientos_disponibles
         FROM viajes v 
         WHERE v.activo = 1 
         ORDER BY v.fecha_salida ASC'
    );

    $trips = $stmt->fetchAll();

    // Decodificar JSON de paradas y obtener asientos ocupados
    foreach ($trips as &$trip) {
        $trip['paradas'] = json_decode($trip['paradas'], true) ?: [];
        $trip['id'] = (int)$trip['id'];
        $trip['precio'] = (float)$trip['precio'];
        $trip['asientos_totales'] = (int)$trip['asientos_totales'];
        $trip['asientos_disponibles'] = (int)$trip['asientos_disponibles'];
        $trip['origen_lat'] = (float)$trip['origen_lat'];
        $trip['origen_lng'] = (float)$trip['origen_lng'];
        $trip['destino_lat'] = (float)$trip['destino_lat'];
        $trip['destino_lng'] = (float)$trip['destino_lng'];

        // Obtener asientos ocupados para este viaje
        $seatStmt = $db->prepare('SELECT asiento FROM compras WHERE viaje_id = ?');
        $seatStmt->execute([$trip['id']]);
        $trip['asientosOcupados'] = array_map('intval', $seatStmt->fetchAll(PDO::FETCH_COLUMN));
        
        // Renombrar campos para compatibilidad con frontend
        $trip['nombreRuta'] = $trip['nombre_ruta'];
        $trip['origenLat'] = $trip['origen_lat'];
        $trip['origenLng'] = $trip['origen_lng'];
        $trip['destinoLat'] = $trip['destino_lat'];
        $trip['destinoLng'] = $trip['destino_lng'];
        $trip['fechaSalida'] = $trip['fecha_salida'];
        $trip['asientosTotales'] = $trip['asientos_totales'];
        $trip['asientosDisponibles'] = $trip['asientos_disponibles'];
    }

    jsonResponse(['success' => true, 'trips' => $trips]);
}

/**
 * GET /api/?action=trip&id=X
 */
function handleGetTripById() {
    $tripId = (int)($_GET['id'] ?? 0);
    
    if ($tripId <= 0) {
        jsonError('ID de viaje inválido.');
    }

    $db = getConnection();

    $stmt = $db->prepare(
        'SELECT v.*, 
                v.asientos_totales - COALESCE(
                    (SELECT COUNT(*) FROM compras c WHERE c.viaje_id = v.id), 0
                ) AS asientos_disponibles
         FROM viajes v WHERE v.id = ?'
    );
    $stmt->execute([$tripId]);
    $trip = $stmt->fetch();

    if (!$trip) {
        jsonError('Viaje no encontrado.', 404);
    }

    $trip['paradas'] = json_decode($trip['paradas'], true) ?: [];
    $trip['id'] = (int)$trip['id'];
    $trip['precio'] = (float)$trip['precio'];
    $trip['asientos_totales'] = (int)$trip['asientos_totales'];
    $trip['asientos_disponibles'] = (int)$trip['asientos_disponibles'];

    // Asientos ocupados
    $seatStmt = $db->prepare('SELECT asiento FROM compras WHERE viaje_id = ?');
    $seatStmt->execute([$tripId]);
    $trip['asientosOcupados'] = array_map('intval', $seatStmt->fetchAll(PDO::FETCH_COLUMN));

    // Alias para frontend
    $trip['nombreRuta'] = $trip['nombre_ruta'];
    $trip['origenLat'] = (float)$trip['origen_lat'];
    $trip['origenLng'] = (float)$trip['origen_lng'];
    $trip['destinoLat'] = (float)$trip['destino_lat'];
    $trip['destinoLng'] = (float)$trip['destino_lng'];
    $trip['fechaSalida'] = $trip['fecha_salida'];
    $trip['asientosTotales'] = $trip['asientos_totales'];
    $trip['asientosDisponibles'] = $trip['asientos_disponibles'];

    jsonResponse(['success' => true, 'trip' => $trip]);
}

/**
 * GET /api/?action=occupied_seats&trip_id=X
 */
function handleGetOccupiedSeats() {
    $tripId = (int)($_GET['trip_id'] ?? 0);
    
    if ($tripId <= 0) {
        jsonError('ID de viaje inválido.');
    }

    $db = getConnection();
    $stmt = $db->prepare('SELECT asiento FROM compras WHERE viaje_id = ?');
    $stmt->execute([$tripId]);

    jsonResponse([
        'success' => true,
        'occupied' => array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN)),
    ]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS — Compras
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/?action=purchase
 * Body: { usuario_id, viaje_id, asiento }
 */
function handlePurchase() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $usuarioId = (int)($input['usuario_id'] ?? 0);
    $viajeId   = (int)($input['viaje_id'] ?? 0);
    $asiento   = (int)($input['asiento'] ?? 0);

    if ($usuarioId <= 0 || $viajeId <= 0 || $asiento <= 0) {
        jsonError('Datos de compra inválidos.');
    }

    $db = getConnection();

    // Verificar que el viaje existe
    $stmt = $db->prepare('SELECT * FROM viajes WHERE id = ? AND activo = 1');
    $stmt->execute([$viajeId]);
    $viaje = $stmt->fetch();

    if (!$viaje) {
        jsonError('Viaje no encontrado o inactivo.');
    }

    // Verificar que el asiento no esté ocupado
    $stmt = $db->prepare('SELECT id FROM compras WHERE viaje_id = ? AND asiento = ?');
    $stmt->execute([$viajeId, $asiento]);

    if ($stmt->fetch()) {
        jsonError('Este asiento ya está ocupado. Selecciona otro.');
    }

    // Verificar que el asiento esté dentro del rango
    if ($asiento > $viaje['asientos_totales']) {
        jsonError('Número de asiento fuera de rango.');
    }

    // Registrar compra
    $stmt = $db->prepare(
        'INSERT INTO compras (usuario_id, viaje_id, nombre_ruta, origen, destino, fecha, asiento, precio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuarioId,
        $viajeId,
        $viaje['nombre_ruta'],
        $viaje['origen'],
        $viaje['destino'],
        date('Y-m-d', strtotime($viaje['fecha_salida'])),
        $asiento,
        $viaje['precio'],
    ]);

    $purchaseId = $db->lastInsertId();

    jsonResponse([
        'success'  => true,
        'purchase' => [
            'id'          => (int)$purchaseId,
            'usuarioId'   => $usuarioId,
            'viajeId'     => $viajeId,
            'nombreRuta'  => $viaje['nombre_ruta'],
            'origen'      => $viaje['origen'],
            'destino'     => $viaje['destino'],
            'fecha'       => $viaje['fecha_salida'],
            'asiento'     => $asiento,
            'precio'      => (float)$viaje['precio'],
            'fechaCompra' => date('c'),
        ],
    ], 201);
}

/**
 * GET /api/?action=user_purchases&user_id=X
 */
function handleGetUserPurchases() {
    $userId = (int)($_GET['user_id'] ?? 0);

    if ($userId <= 0) {
        jsonError('ID de usuario inválido.');
    }

    $db = getConnection();
    $stmt = $db->prepare(
        'SELECT * FROM compras WHERE usuario_id = ? ORDER BY fecha_compra DESC'
    );
    $stmt->execute([$userId]);
    $purchases = $stmt->fetchAll();

    // Format for frontend
    foreach ($purchases as &$p) {
        $p['id'] = (int)$p['id'];
        $p['usuarioId'] = (int)$p['usuario_id'];
        $p['viajeId'] = (int)$p['viaje_id'];
        $p['nombreRuta'] = $p['nombre_ruta'];
        $p['asiento'] = (int)$p['asiento'];
        $p['precio'] = (float)$p['precio'];
        $p['fechaCompra'] = $p['fecha_compra'];
    }

    jsonResponse(['success' => true, 'purchases' => $purchases]);
}

/**
 * GET /api/?action=all_purchases
 */
function handleGetAllPurchases() {
    $db = getConnection();
    $stmt = $db->query('SELECT * FROM compras ORDER BY fecha_compra DESC');
    $purchases = $stmt->fetchAll();

    foreach ($purchases as &$p) {
        $p['id'] = (int)$p['id'];
        $p['usuarioId'] = (int)$p['usuario_id'];
        $p['viajeId'] = (int)$p['viaje_id'];
        $p['nombreRuta'] = $p['nombre_ruta'];
        $p['asiento'] = (int)$p['asiento'];
        $p['precio'] = (float)$p['precio'];
        $p['fechaCompra'] = $p['fecha_compra'];
    }

    jsonResponse(['success' => true, 'purchases' => $purchases]);
}

/**
 * GET /api/?action=all_users
 */
function handleGetAllUsers() {
    $db = getConnection();
    $stmt = $db->query(
        'SELECT id, nombre, correo, rol, created_at AS createdAt FROM usuarios ORDER BY id'
    );
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['id'] = (int)$u['id'];
    }

    jsonResponse(['success' => true, 'users' => $users]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS — OAuth Social Login
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/?action=google_login
 * Body: { credential } — Google ID token from Google Identity Services
 * Verifies the token with Google, creates/logs in the user.
 */
function handleGoogleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $credential = $input['credential'] ?? '';

    if (empty($credential)) {
        jsonError('Token de Google no proporcionado.');
    }

    // Verify the Google ID token via Google's tokeninfo endpoint
    $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
    $response = @file_get_contents($verifyUrl);

    if ($response === false) {
        jsonError('No se pudo verificar el token de Google.');
    }

    $payload = json_decode($response, true);

    if (!$payload || !isset($payload['email'])) {
        jsonError('Token de Google inválido.');
    }

    // Verify the token was issued for our app
    if (isset($payload['aud']) && $payload['aud'] !== GOOGLE_CLIENT_ID) {
        // Allow in development (when client ID is placeholder)
        if (GOOGLE_CLIENT_ID !== 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            jsonError('Token no corresponde a esta aplicación.');
        }
    }

    $email = strtolower($payload['email']);
    $nombre = $payload['name'] ?? $payload['email'];
    $picture = $payload['picture'] ?? '';

    // Find or create user
    $db = getConnection();
    $stmt = $db->prepare('SELECT id, nombre, correo, rol, created_at FROM usuarios WHERE correo = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Create new user with a random password (social login users don't need one)
        $randomPassword = hash('sha256', bin2hex(random_bytes(16)));
        $stmt = $db->prepare(
            'INSERT INTO usuarios (nombre, correo, password, rol, auth_provider) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$nombre, $email, $randomPassword, 'user', 'google']);

        $user = [
            'id' => (int)$db->lastInsertId(),
            'nombre' => $nombre,
            'correo' => $email,
            'rol' => 'user',
            'created_at' => date('c'),
        ];
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id'        => (int)$user['id'],
            'nombre'    => $user['nombre'],
            'correo'    => $user['correo'],
            'rol'       => $user['rol'],
            'createdAt' => $user['created_at'],
            'authProvider' => 'google',
            'picture'   => $picture,
        ],
    ]);
}

/**
 * POST /api/?action=facebook_login
 * Body: { accessToken, userID } — Facebook access token from Facebook Login SDK
 * Verifies the token with Facebook Graph API, creates/logs in the user.
 */
function handleFacebookLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $accessToken = $input['accessToken'] ?? '';

    if (empty($accessToken)) {
        jsonError('Token de Facebook no proporcionado.');
    }

    // Verify token and get user info from Facebook Graph API
    $graphUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=' . urlencode($accessToken);
    $response = @file_get_contents($graphUrl);

    if ($response === false) {
        jsonError('No se pudo verificar el token de Facebook.');
    }

    $fbUser = json_decode($response, true);

    if (!$fbUser || isset($fbUser['error'])) {
        jsonError('Token de Facebook inválido: ' . ($fbUser['error']['message'] ?? 'error desconocido'));
    }

    $email = strtolower($fbUser['email'] ?? '');
    $nombre = $fbUser['name'] ?? 'Usuario Facebook';
    $picture = $fbUser['picture']['data']['url'] ?? '';

    if (empty($email)) {
        jsonError('No se pudo obtener el correo de Facebook. Asegúrate de haber otorgado permiso de email.');
    }

    // Find or create user
    $db = getConnection();
    $stmt = $db->prepare('SELECT id, nombre, correo, rol, created_at FROM usuarios WHERE correo = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $randomPassword = hash('sha256', bin2hex(random_bytes(16)));
        $stmt = $db->prepare(
            'INSERT INTO usuarios (nombre, correo, password, rol, auth_provider) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$nombre, $email, $randomPassword, 'user', 'facebook']);

        $user = [
            'id' => (int)$db->lastInsertId(),
            'nombre' => $nombre,
            'correo' => $email,
            'rol' => 'user',
            'created_at' => date('c'),
        ];
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id'        => (int)$user['id'],
            'nombre'    => $user['nombre'],
            'correo'    => $user['correo'],
            'rol'       => $user['rol'],
            'createdAt' => $user['created_at'],
            'authProvider' => 'facebook',
            'picture'   => $picture,
        ],
    ]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS — Password Reset
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/?action=reset_password
 * Body: { correo, new_password }
 */
function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Método no permitido.', 405);
    }

    $input = getJsonInput();
    $correo = trim($input['correo'] ?? '');
    $newPassword = $input['new_password'] ?? '';

    if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        jsonError('Ingresa un correo electrónico válido.');
    }
    if (empty($newPassword) || strlen($newPassword) < 6) {
        jsonError('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    $db = getConnection();
    $stmt = $db->prepare('SELECT id FROM usuarios WHERE correo = ?');
    $stmt->execute([strtolower($correo)]);

    if (!$stmt->fetch()) {
        jsonError('No existe una cuenta con ese correo electrónico.');
    }

    $hashedPassword = hash('sha256', $newPassword);
    $stmt = $db->prepare('UPDATE usuarios SET password = ? WHERE correo = ?');
    $stmt->execute([$hashedPassword, strtolower($correo)]);

    jsonResponse([
        'success' => true,
        'message' => 'Contraseña actualizada exitosamente.',
    ]);
}
