<?php
/**
 * setup_db.php — Script de configuración automática de la BD
 * 
 * Accede a este archivo desde el navegador:
 *   http://localhost/PremiumBus/setup_db.php
 * 
 * Te pedirá la contraseña de MySQL y creará todo automáticamente.
 */

// Procesar formulario si se envió
$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = trim($_POST['host'] ?? 'localhost');
    $user = trim($_POST['user'] ?? 'root');
    $pass = $_POST['pass'] ?? '';

    try {
        // 1. Conectar a MySQL
        $pdo = new PDO("mysql:host=$host", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        // 2. DROP y recrear base de datos (reset completo)
        $pdo->exec("DROP DATABASE IF EXISTS premiumbus");
        $pdo->exec("CREATE DATABASE premiumbus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE premiumbus");

        // 3. Crear tablas
        $pdo->exec("
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                rol VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_correo (correo),
                INDEX idx_rol (rol)
            ) ENGINE=InnoDB
        ");

        $pdo->exec("
            CREATE TABLE viajes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_ruta VARCHAR(100) NOT NULL,
                origen VARCHAR(100) NOT NULL,
                destino VARCHAR(100) NOT NULL,
                origen_lat DECIMAL(10,7) NOT NULL,
                origen_lng DECIMAL(10,7) NOT NULL,
                destino_lat DECIMAL(10,7) NOT NULL,
                destino_lng DECIMAL(10,7) NOT NULL,
                paradas JSON DEFAULT NULL,
                fecha_salida DATETIME NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                asientos_totales INT DEFAULT 40,
                activo BOOLEAN DEFAULT TRUE,
                INDEX idx_activo (activo),
                INDEX idx_fecha (fecha_salida)
            ) ENGINE=InnoDB
        ");

        $pdo->exec("
            CREATE TABLE compras (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                viaje_id INT NOT NULL,
                nombre_ruta VARCHAR(100) NOT NULL,
                origen VARCHAR(100) NOT NULL,
                destino VARCHAR(100) NOT NULL,
                fecha DATE NOT NULL,
                asiento INT NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_viaje_asiento (viaje_id, asiento),
                INDEX idx_usuario (usuario_id)
            ) ENGINE=InnoDB
        ");

        // 4. Usuarios
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, SHA2(?, 256), ?)");
        $stmt->execute(['Administrador', 'admin@premiumbus.com', 'admin123', 'admin']);
        $stmt->execute(['Juan Pérez', 'juan@correo.com', 'usuario123', 'user']);

        // 5. 30 Rutas de Transporte Urbano de SLP
        $viajes = [
            ['Ruta 1 - Saucito','Col. Saucito','Centro Histórico',22.173,-100.948,22.1565,-100.9855,'[{"nombre":"Col. Saucito","lat":22.173,"lng":-100.948,"tipo":"origen"},{"nombre":"Av. Industrias","lat":22.169,"lng":-100.955,"minutos":4},{"nombre":"Glorieta Juárez","lat":22.1465,"lng":-100.9812,"minutos":10},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:00:00',12.50],
            ['Ruta 2 - Circuito','Col. Morales','Hospital Central',22.135,-100.955,22.152,-100.978,'[{"nombre":"Col. Morales","lat":22.135,"lng":-100.955,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.965,"minutos":5},{"nombre":"CU UASLP","lat":22.1413,"lng":-100.9756,"minutos":8},{"nombre":"Hospital Central","lat":22.152,"lng":-100.978,"tipo":"destino"}]','2026-04-13 06:15:00',12.50],
            ['Ruta 3 - Soledad','Fracc. Puerta Real','Zona Universitaria',22.185,-100.928,22.1413,-100.9756,'[{"nombre":"Fracc. Puerta Real","lat":22.185,"lng":-100.928,"tipo":"origen"},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"minutos":6},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":15},{"nombre":"Zona Universitaria","lat":22.1413,"lng":-100.9756,"tipo":"destino"}]','2026-04-13 06:30:00',12.50],
            ['Ruta 4 - Satélite','Ciudad Satélite','Tercera Chica',22.12,-101.01,22.158,-100.983,'[{"nombre":"Ciudad Satélite","lat":22.12,"lng":-101.01,"tipo":"origen"},{"nombre":"Av. Río Españita","lat":22.13,"lng":-101.0,"minutos":5},{"nombre":"Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":10},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":18},{"nombre":"Tercera Chica","lat":22.158,"lng":-100.983,"tipo":"destino"}]','2026-04-13 06:00:00',12.50],
            ['Ruta 5 - Prados','Fracc. Los Prados','Centro Histórico',22.128,-100.998,22.1565,-100.9855,'[{"nombre":"Fracc. Los Prados","lat":22.128,"lng":-100.998,"tipo":"origen"},{"nombre":"Blvd. Río Españita","lat":22.135,"lng":-100.995,"minutos":4},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.978,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:20:00',12.50],
            ['Ruta 7 - Tangamanga','Alameda Central','Plaza Tangamanga',22.151,-100.985,22.1378,-101.0089,'[{"nombre":"Alameda Central","lat":22.151,"lng":-100.985,"tipo":"origen"},{"nombre":"Av. Carranza","lat":22.149,"lng":-100.989,"minutos":4},{"nombre":"Col. Las Águilas","lat":22.1435,"lng":-100.998,"minutos":8},{"nombre":"Plaza Tangamanga","lat":22.1378,"lng":-101.0089,"tipo":"destino"}]','2026-04-13 07:00:00',12.50],
            ['Ruta 8 - Industrial','Zona Industrial','Col. Lomas',22.115,-100.935,22.165,-100.99,'[{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"origen"},{"nombre":"Av. Industrial","lat":22.125,"lng":-100.945,"minutos":5},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":12},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":18},{"nombre":"Col. Lomas","lat":22.165,"lng":-100.99,"tipo":"destino"}]','2026-04-13 06:30:00',12.50],
            ['Ruta 9 - La Pila','Mercado República','La Pila',22.154,-100.982,22.112,-100.915,'[{"nombre":"Mercado República","lat":22.154,"lng":-100.982,"tipo":"origen"},{"nombre":"Av. 20 de Noviembre","lat":22.148,"lng":-100.975,"minutos":5},{"nombre":"Col. Morales","lat":22.135,"lng":-100.955,"minutos":12},{"nombre":"Ej. Plan de Ayala","lat":22.123,"lng":-100.935,"minutos":20},{"nombre":"La Pila","lat":22.112,"lng":-100.915,"tipo":"destino"}]','2026-04-13 07:00:00',15.00],
            ['Ruta 10 - Z. Industrial','Ciudad Satélite','Zona Industrial',22.12,-101.01,22.115,-100.935,'[{"nombre":"Ciudad Satélite","lat":22.12,"lng":-101.01,"tipo":"origen"},{"nombre":"Av. Real de Lomas","lat":22.118,"lng":-100.995,"minutos":6},{"nombre":"Pedregal","lat":22.115,"lng":-100.975,"minutos":12},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]','2026-04-13 06:00:00',14.00],
            ['Ruta 12 - UASLP','Centro Histórico','UASLP Zona Universitaria',22.1565,-100.9855,22.1413,-100.9756,'[{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"origen"},{"nombre":"Jardín de San Francisco","lat":22.1535,"lng":-100.983,"minutos":3},{"nombre":"Av. Constitución","lat":22.1488,"lng":-100.979,"minutos":7},{"nombre":"UASLP Zona Universitaria","lat":22.1413,"lng":-100.9756,"tipo":"destino"}]','2026-04-13 06:45:00',12.50],
            ['Ruta 14 - Jacarandas','Fracc. Jacarandas','Centro Histórico',22.168,-101.005,22.1565,-100.9855,'[{"nombre":"Fracc. Jacarandas","lat":22.168,"lng":-101.005,"tipo":"origen"},{"nombre":"Col. Del Valle","lat":22.163,"lng":-101.0,"minutos":4},{"nombre":"Av. Muñoz","lat":22.16,"lng":-100.995,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:30:00',12.50],
            ['Ruta 15 - Damián Carmona','Damián Carmona','Tierra Blanca',22.17,-100.97,22.135,-100.94,'[{"nombre":"Damián Carmona","lat":22.17,"lng":-100.97,"tipo":"origen"},{"nombre":"Calzada de Guadalupe","lat":22.162,"lng":-100.977,"minutos":5},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":10},{"nombre":"Tierra Blanca","lat":22.135,"lng":-100.94,"tipo":"destino"}]','2026-04-13 06:15:00',12.50],
            ['Ruta 16 - Soledad','Terminal Terrestre','Soledad de G.S.',22.149,-100.973,22.183,-100.934,'[{"nombre":"Terminal Terrestre","lat":22.149,"lng":-100.973,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":5},{"nombre":"Col. Industrial","lat":22.162,"lng":-100.952,"minutos":12},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"minutos":18},{"nombre":"Soledad de G.S.","lat":22.183,"lng":-100.934,"tipo":"destino"}]','2026-04-13 06:00:00',14.00],
            ['Ruta 18 - Las Águilas','Col. Las Águilas','Zona Industrial',22.1435,-100.998,22.115,-100.935,'[{"nombre":"Col. Las Águilas","lat":22.1435,"lng":-100.998,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.978,"minutos":6},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":14},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]','2026-04-13 06:30:00',14.00],
            ['Ruta 20 - Pedregal','Fracc. Pedregal','Centro Histórico',22.11,-100.97,22.1565,-100.9855,'[{"nombre":"Fracc. Pedregal","lat":22.11,"lng":-100.97,"tipo":"origen"},{"nombre":"Blvd. A. Obregón","lat":22.12,"lng":-100.975,"minutos":5},{"nombre":"Col. Moderna","lat":22.135,"lng":-100.98,"minutos":12},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 07:00:00',12.50],
            ['Ruta 22 - Progreso','Col. Progreso','Centro Histórico',22.175,-100.975,22.1565,-100.9855,'[{"nombre":"Col. Progreso","lat":22.175,"lng":-100.975,"tipo":"origen"},{"nombre":"Av. Himno Nacional 2","lat":22.168,"lng":-100.978,"minutos":4},{"nombre":"Calzada Guadalupe","lat":22.162,"lng":-100.977,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:00:00',12.50],
            ['Ruta 25 - Sendero','Av. Universidad','Plaza Sendero',22.1413,-100.9756,22.1633,-101.0215,'[{"nombre":"Av. Universidad","lat":22.1413,"lng":-100.9756,"tipo":"origen"},{"nombre":"Glorieta Juárez","lat":22.1465,"lng":-100.9812,"minutos":3},{"nombre":"Alameda Central","lat":22.151,"lng":-100.985,"minutos":6},{"nombre":"Mercado Revolución","lat":22.1558,"lng":-100.992,"minutos":10},{"nombre":"Plaza Sendero","lat":22.1633,"lng":-101.0215,"tipo":"destino"}]','2026-04-13 07:30:00',14.00],
            ['Ruta 26 - Tercera Grande','Tercera Grande','Centro',22.17,-100.995,22.1565,-100.9855,'[{"nombre":"Tercera Grande","lat":22.17,"lng":-100.995,"tipo":"origen"},{"nombre":"Av. Muñoz","lat":22.165,"lng":-100.99,"minutos":5},{"nombre":"Col. España","lat":22.16,"lng":-100.988,"minutos":8},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:00:00',12.50],
            ['Ruta 28 - Hda. Bravo','Hacienda de Bravo','Centro Soledad',22.195,-100.92,22.178,-100.938,'[{"nombre":"Hacienda de Bravo","lat":22.195,"lng":-100.92,"tipo":"origen"},{"nombre":"Col. Rancho Pavón","lat":22.19,"lng":-100.928,"minutos":5},{"nombre":"Av. del Sauce","lat":22.185,"lng":-100.933,"minutos":9},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"tipo":"destino"}]','2026-04-13 06:15:00',12.50],
            ['Ruta 30 - Aviación','Calzada de Guadalupe','Industrial Aviación',22.162,-100.977,22.125,-100.953,'[{"nombre":"Calzada de Guadalupe","lat":22.162,"lng":-100.977,"tipo":"origen"},{"nombre":"Av. Himno Nacional","lat":22.155,"lng":-100.97,"minutos":4},{"nombre":"Plaza de Toros","lat":22.143,"lng":-100.962,"minutos":9},{"nombre":"Industrial Aviación","lat":22.125,"lng":-100.953,"tipo":"destino"}]','2026-04-13 06:45:00',14.00],
            ['Ruta 33 - Santiago','Col. Santiago','Centro Histórico',22.14,-101.02,22.1565,-100.9855,'[{"nombre":"Col. Santiago","lat":22.14,"lng":-101.02,"tipo":"origen"},{"nombre":"Av. Tangamanga","lat":22.14,"lng":-101.01,"minutos":4},{"nombre":"Parque Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:00:00',12.50],
            ['Ruta 35 - Matehuala','Col. Matehuala','Centro',22.18,-100.96,22.1565,-100.9855,'[{"nombre":"Col. Matehuala","lat":22.18,"lng":-100.96,"tipo":"origen"},{"nombre":"Av. Nereo Rdz.","lat":22.172,"lng":-100.968,"minutos":5},{"nombre":"Mercado República","lat":22.154,"lng":-100.982,"minutos":14},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:30:00',12.50],
            ['Ruta 40 - Villa de Pozos','Villa de Pozos','Centro',22.105,-100.89,22.1565,-100.9855,'[{"nombre":"Villa de Pozos","lat":22.105,"lng":-100.89,"tipo":"origen"},{"nombre":"Carr. a Rioverde","lat":22.12,"lng":-100.92,"minutos":8},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":18},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:00:00',16.00],
            ['Ruta 42 - Bocas','Col. Bocas','Terminal Terrestre',22.21,-100.95,22.149,-100.973,'[{"nombre":"Col. Bocas","lat":22.21,"lng":-100.95,"tipo":"origen"},{"nombre":"Carr. 57 Norte","lat":22.195,"lng":-100.955,"minutos":6},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":14},{"nombre":"Terminal Terrestre","lat":22.149,"lng":-100.973,"tipo":"destino"}]','2026-04-13 06:00:00',18.00],
            ['MetroRed L1','Estación Central','Terminal Norte',22.15,-100.98,22.185,-100.945,'[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Av. 5 de Mayo","lat":22.158,"lng":-100.978,"minutos":3},{"nombre":"Glorieta Niños Héroes","lat":22.165,"lng":-100.965,"minutos":7},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":13},{"nombre":"Terminal Norte","lat":22.185,"lng":-100.945,"tipo":"destino"}]','2026-04-13 05:30:00',12.50],
            ['MetroRed L2','Estación Central','Terminal Sur',22.15,-100.98,22.11,-100.97,'[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Av. Universidad","lat":22.1413,"lng":-100.9756,"minutos":5},{"nombre":"Col. Moderna","lat":22.13,"lng":-100.975,"minutos":10},{"nombre":"Terminal Sur","lat":22.11,"lng":-100.97,"tipo":"destino"}]','2026-04-13 05:30:00',12.50],
            ['MetroRed L3','Estación Central','Zona Industrial',22.15,-100.98,22.115,-100.935,'[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":6},{"nombre":"Av. Industrial","lat":22.128,"lng":-100.945,"minutos":12},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]','2026-04-13 05:30:00',12.50],
            ['Ruta 50 - Lomas del Sur','Lomas del Sur','Centro',22.105,-100.995,22.1565,-100.9855,'[{"nombre":"Lomas del Sur","lat":22.105,"lng":-100.995,"tipo":"origen"},{"nombre":"Pedregal de Sn. Ángel","lat":22.115,"lng":-100.99,"minutos":5},{"nombre":"Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":14},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:30:00',14.00],
            ['Ruta 55 - R. Pavón','Rancho Pavón','Centro',22.19,-100.93,22.1565,-100.9855,'[{"nombre":"Rancho Pavón","lat":22.19,"lng":-100.93,"tipo":"origen"},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":6},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":16},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:15:00',14.00],
            ['Ruta 60 - Ecosistema','Fracc. Ecosistema','Centro',22.175,-101.02,22.1565,-100.9855,'[{"nombre":"Fracc. Ecosistema","lat":22.175,"lng":-101.02,"tipo":"origen"},{"nombre":"Plaza Sendero","lat":22.1633,"lng":-101.0215,"minutos":5},{"nombre":"Mercado Revolución","lat":22.1558,"lng":-100.992,"minutos":12},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]','2026-04-13 06:45:00',14.00],
        ];

        $stmt = $pdo->prepare("INSERT INTO viajes (nombre_ruta, origen, destino, origen_lat, origen_lng, destino_lat, destino_lng, paradas, fecha_salida, precio) VALUES (?,?,?,?,?,?,?,?,?,?)");
        foreach ($viajes as $v) {
            $stmt->execute($v);
        }

        // 6. Actualizar config.php con las credenciales correctas
        $configPath = __DIR__ . '/api/config.php';
        $configContent = file_get_contents($configPath);
        $configContent = preg_replace("/define\('DB_HOST',\s*'[^']*'\)/", "define('DB_HOST', '$host')", $configContent);
        $configContent = preg_replace("/define\('DB_USER',\s*'[^']*'\)/", "define('DB_USER', '$user')", $configContent);
        $configContent = preg_replace("/define\('DB_PASS',\s*'[^']*'\)/", "define('DB_PASS', '$pass')", $configContent);
        file_put_contents($configPath, $configContent);

        $success = true;
        $message = "✅ ¡Base de datos reseteada con 30 rutas de SLP!";

        // Verificar conteos
        $usuarios = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
        $viajes_count = $pdo->query("SELECT COUNT(*) FROM viajes")->fetchColumn();

        $message .= "\n   • $usuarios usuarios creados";
        $message .= "\n   • $viajes_count rutas de transporte insertadas";
        $message .= "\n   • Credenciales guardadas en api/config.php";

    } catch (PDOException $e) {
        $message = "❌ Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PremiumBus — Configuración de Base de Datos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 32px;
            max-width: 480px;
            width: 100%;
        }
        h1 {
            color: #1a3a6b;
            font-size: 24px;
            margin-bottom: 8px;
        }
        p.sub { color: #737373; font-size: 14px; margin-bottom: 24px; }
        label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #404040;
            margin-bottom: 6px;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e5e5;
            border-radius: 10px;
            font-size: 16px;
            font-family: inherit;
            margin-bottom: 16px;
            transition: border-color 0.2s;
        }
        input:focus { outline: none; border-color: #2b5ea7; }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #1a3a6b, #2b5ea7);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.1s;
        }
        button:hover { transform: translateY(-1px); }
        button:active { transform: scale(0.98); }
        .msg {
            margin-top: 20px;
            padding: 16px;
            border-radius: 10px;
            font-size: 14px;
            white-space: pre-line;
            line-height: 1.6;
        }
        .msg.ok { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .msg.err { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
        .success-actions {
            margin-top: 16px;
            display: flex;
            gap: 12px;
        }
        .success-actions a {
            flex: 1;
            display: block;
            text-align: center;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
        }
        .btn-primary { background: #2b5ea7; color: white; }
        .btn-secondary { background: #f5f5f5; color: #1a3a6b; border: 2px solid #e5e5e5; }
        .hint {
            font-size: 12px;
            color: #a3a3a3;
            margin-top: -12px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚌 PremiumBus</h1>
        <p class="sub">Configuración de Base de Datos MySQL</p>

        <?php if ($success): ?>
            <div class="msg ok"><?= htmlspecialchars($message) ?></div>
            <div class="success-actions">
                <a href="/PremiumBus/" class="btn-primary">🚀 Abrir App</a>
                <a href="/PremiumBus/api/index.php?action=health" class="btn-secondary">🔍 Test API</a>
            </div>
        <?php else: ?>
            <?php if ($message): ?>
                <div class="msg err"><?= htmlspecialchars($message) ?></div>
            <?php endif; ?>

            <form method="POST">
                <label for="host">Host de MySQL</label>
                <input type="text" name="host" id="host" value="localhost" placeholder="localhost">

                <label for="user">Usuario</label>
                <input type="text" name="user" id="user" value="root" placeholder="root">

                <label for="pass">Contraseña</label>
                <input type="password" name="pass" id="pass" placeholder="Tu contraseña de MySQL">
                <p class="hint">Si no la cambiaste, déjala vacía (XAMPP default)</p>

                <button type="submit">⚡ Configurar Base de Datos</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
