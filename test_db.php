<?php
// Test de conexión a MySQL
echo "=== PremiumBus - Test de Conexión MySQL ===\n\n";

try {
    $pdo = new PDO('mysql:host=localhost;port=3306', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    echo "✅ CONEXIÓN EXITOSA\n";
    echo "   Versión MySQL: $version\n\n";

    // Verificar si la base de datos premiumbus existe
    $dbs = $pdo->query("SHOW DATABASES LIKE 'premiumbus'")->fetchAll();
    if (count($dbs) > 0) {
        echo "✅ Base de datos 'premiumbus' YA EXISTE\n";

        $pdo->exec('USE premiumbus');
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "   Tablas: " . implode(', ', $tables) . "\n";
    } else {
        echo "⚠️ Base de datos 'premiumbus' NO EXISTE — se creará ahora...\n\n";

        // Ejecutar setup.sql
        $sqlFile = __DIR__ . '/api/setup.sql';
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            $pdo->exec($sql);
            echo "✅ Base de datos creada exitosamente\n";
            echo "✅ Tablas y datos seed insertados\n";
        } else {
            echo "❌ No se encontró setup.sql en " . $sqlFile . "\n";
        }
    }
} catch (PDOException $e) {
    echo "❌ ERROR DE CONEXIÓN: " . $e->getMessage() . "\n";
    echo "\n   Posibles soluciones:\n";
    echo "   1. Asegúrate de que MySQL esté corriendo en XAMPP\n";
    echo "   2. Verifica el usuario/contraseña en api/config.php\n";
}
