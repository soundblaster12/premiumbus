-- ============================================================
-- PremiumBus — Base de Datos MySQL v2
-- 30 rutas reales de transporte urbano de SLP
-- ============================================================

DROP DATABASE IF EXISTS premiumbus;
CREATE DATABASE premiumbus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE premiumbus;

-- ── Tabla: usuarios ─────────────────────────────
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_correo (correo),
  INDEX idx_rol (rol)
) ENGINE=InnoDB;

-- ── Tabla: viajes ───────────────────────────────
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
) ENGINE=InnoDB;

-- ── Tabla: compras ──────────────────────────────
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
) ENGINE=InnoDB;

-- ── Usuarios ────────────────────────────────────
INSERT INTO usuarios (nombre, correo, password, rol) VALUES
  ('Administrador', 'admin@premiumbus.com', SHA2('admin123', 256), 'admin'),
  ('Juan Pérez', 'juan@correo.com', SHA2('usuario123', 256), 'user');

-- ── 30 Rutas de Transporte Urbano de SLP ────────
INSERT INTO viajes (nombre_ruta, origen, destino, origen_lat, origen_lng, destino_lat, destino_lng, paradas, fecha_salida, precio) VALUES

-- 1. Ruta 1 — Saucito - Centro
('Ruta 1 - Saucito', 'Col. Saucito', 'Centro Histórico',
 22.1730, -100.9480, 22.1565, -100.9855,
 '[{"nombre":"Col. Saucito","lat":22.173,"lng":-100.948,"tipo":"origen"},{"nombre":"Av. Industrias","lat":22.169,"lng":-100.955,"minutos":4},{"nombre":"Glorieta Juárez","lat":22.1465,"lng":-100.9812,"minutos":10},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 12.50),

-- 2. Ruta 2 — Morales Circuito
('Ruta 2 - Circuito', 'Col. Morales', 'Hospital Central',
 22.1350, -100.9550, 22.1520, -100.9780,
 '[{"nombre":"Col. Morales","lat":22.135,"lng":-100.955,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.965,"minutos":5},{"nombre":"CU UASLP","lat":22.1413,"lng":-100.9756,"minutos":8},{"nombre":"Hospital Central","lat":22.152,"lng":-100.978,"tipo":"destino"}]',
 '2026-04-13 06:15:00', 12.50),

-- 3. Ruta 3 — Soledad
('Ruta 3 - Soledad', 'Fracc. Puerta Real', 'Zona Universitaria',
 22.1850, -100.9280, 22.1413, -100.9756,
 '[{"nombre":"Fracc. Puerta Real","lat":22.185,"lng":-100.928,"tipo":"origen"},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"minutos":6},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":15},{"nombre":"Zona Universitaria","lat":22.1413,"lng":-100.9756,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 12.50),

-- 4. Ruta 4 — Satélite
('Ruta 4 - Satélite', 'Ciudad Satélite', 'Tercera Chica',
 22.1200, -101.0100, 22.1580, -100.9830,
 '[{"nombre":"Ciudad Satélite","lat":22.12,"lng":-101.01,"tipo":"origen"},{"nombre":"Av. Río Españita","lat":22.13,"lng":-101.0,"minutos":5},{"nombre":"Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":10},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":18},{"nombre":"Tercera Chica","lat":22.158,"lng":-100.983,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 12.50),

-- 5. Ruta 5 — Prados
('Ruta 5 - Prados', 'Fracc. Los Prados', 'Centro Histórico',
 22.1280, -100.9980, 22.1565, -100.9855,
 '[{"nombre":"Fracc. Los Prados","lat":22.128,"lng":-100.998,"tipo":"origen"},{"nombre":"Blvd. Río Españita","lat":22.135,"lng":-100.995,"minutos":4},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.978,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:20:00', 12.50),

-- 6. Ruta 7 — Alameda a Tangamanga
('Ruta 7 - Tangamanga', 'Alameda Central', 'Plaza Tangamanga',
 22.1510, -100.9850, 22.1378, -101.0089,
 '[{"nombre":"Alameda Central","lat":22.151,"lng":-100.985,"tipo":"origen"},{"nombre":"Av. Carranza","lat":22.149,"lng":-100.989,"minutos":4},{"nombre":"Col. Las Águilas","lat":22.1435,"lng":-100.998,"minutos":8},{"nombre":"Plaza Tangamanga","lat":22.1378,"lng":-101.0089,"tipo":"destino"}]',
 '2026-04-13 07:00:00', 12.50),

-- 7. Ruta 8 — Industrial
('Ruta 8 - Industrial', 'Zona Industrial', 'Col. Lomas',
 22.1150, -100.9350, 22.1650, -100.9900,
 '[{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"origen"},{"nombre":"Av. Industrial","lat":22.125,"lng":-100.945,"minutos":5},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":12},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":18},{"nombre":"Col. Lomas","lat":22.165,"lng":-100.99,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 12.50),

-- 8. Ruta 9 — La Pila
('Ruta 9 - La Pila', 'Mercado República', 'La Pila',
 22.1540, -100.9820, 22.1120, -100.9150,
 '[{"nombre":"Mercado República","lat":22.154,"lng":-100.982,"tipo":"origen"},{"nombre":"Av. 20 de Noviembre","lat":22.148,"lng":-100.975,"minutos":5},{"nombre":"Col. Morales","lat":22.135,"lng":-100.955,"minutos":12},{"nombre":"Ej. Plan de Ayala","lat":22.123,"lng":-100.935,"minutos":20},{"nombre":"La Pila","lat":22.112,"lng":-100.915,"tipo":"destino"}]',
 '2026-04-13 07:00:00', 15.00),

-- 9. Ruta 10 — Zona Industrial
('Ruta 10 - Z. Industrial', 'Ciudad Satélite', 'Zona Industrial',
 22.1200, -101.0100, 22.1150, -100.9350,
 '[{"nombre":"Ciudad Satélite","lat":22.12,"lng":-101.01,"tipo":"origen"},{"nombre":"Av. Real de Lomas","lat":22.118,"lng":-100.995,"minutos":6},{"nombre":"Pedregal","lat":22.115,"lng":-100.975,"minutos":12},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 14.00),

-- 10. Ruta 12 — UASLP
('Ruta 12 - UASLP', 'Centro Histórico', 'UASLP Zona Universitaria',
 22.1565, -100.9855, 22.1413, -100.9756,
 '[{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"origen"},{"nombre":"Jardín de San Francisco","lat":22.1535,"lng":-100.983,"minutos":3},{"nombre":"Av. Constitución","lat":22.1488,"lng":-100.979,"minutos":7},{"nombre":"UASLP Zona Universitaria","lat":22.1413,"lng":-100.9756,"tipo":"destino"}]',
 '2026-04-13 06:45:00', 12.50),

-- 11. Ruta 14 — Jacarandas
('Ruta 14 - Jacarandas', 'Fracc. Jacarandas', 'Centro Histórico',
 22.1680, -101.0050, 22.1565, -100.9855,
 '[{"nombre":"Fracc. Jacarandas","lat":22.168,"lng":-101.005,"tipo":"origen"},{"nombre":"Col. Del Valle","lat":22.163,"lng":-101.0,"minutos":4},{"nombre":"Av. Muñoz","lat":22.16,"lng":-100.995,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 12.50),

-- 12. Ruta 15 — Damián Carmona
('Ruta 15 - Damián Carmona', 'Damián Carmona', 'Tierra Blanca',
 22.1700, -100.9700, 22.1350, -100.9400,
 '[{"nombre":"Damián Carmona","lat":22.17,"lng":-100.97,"tipo":"origen"},{"nombre":"Calzada de Guadalupe","lat":22.162,"lng":-100.977,"minutos":5},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":10},{"nombre":"Tierra Blanca","lat":22.135,"lng":-100.94,"tipo":"destino"}]',
 '2026-04-13 06:15:00', 12.50),

-- 13. Ruta 16 — Terminal a Soledad
('Ruta 16 - Soledad', 'Terminal Terrestre', 'Soledad de G.S.',
 22.1490, -100.9730, 22.1830, -100.9340,
 '[{"nombre":"Terminal Terrestre","lat":22.149,"lng":-100.973,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":5},{"nombre":"Col. Industrial","lat":22.162,"lng":-100.952,"minutos":12},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"minutos":18},{"nombre":"Soledad de G.S.","lat":22.183,"lng":-100.934,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 14.00),

-- 14. Ruta 18 — Las Águilas
('Ruta 18 - Las Águilas', 'Col. Las Águilas', 'Zona Industrial',
 22.1435, -100.9980, 22.1150, -100.9350,
 '[{"nombre":"Col. Las Águilas","lat":22.1435,"lng":-100.998,"tipo":"origen"},{"nombre":"Av. Salvador Nava","lat":22.14,"lng":-100.978,"minutos":6},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"minutos":14},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 14.00),

-- 15. Ruta 20 — Pedregal
('Ruta 20 - Pedregal', 'Fracc. Pedregal', 'Centro Histórico',
 22.1100, -100.9700, 22.1565, -100.9855,
 '[{"nombre":"Fracc. Pedregal","lat":22.11,"lng":-100.97,"tipo":"origen"},{"nombre":"Blvd. A. Obregón","lat":22.12,"lng":-100.975,"minutos":5},{"nombre":"Col. Moderna","lat":22.135,"lng":-100.98,"minutos":12},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 07:00:00', 12.50),

-- 16. Ruta 22 — Progreso
('Ruta 22 - Progreso', 'Col. Progreso', 'Centro Histórico',
 22.1750, -100.9750, 22.1565, -100.9855,
 '[{"nombre":"Col. Progreso","lat":22.175,"lng":-100.975,"tipo":"origen"},{"nombre":"Av. Himno Nacional 2","lat":22.168,"lng":-100.978,"minutos":4},{"nombre":"Calzada Guadalupe","lat":22.162,"lng":-100.977,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 12.50),

-- 17. Ruta 25 — Plaza Sendero
('Ruta 25 - Sendero', 'Av. Universidad', 'Plaza Sendero',
 22.1413, -100.9756, 22.1633, -101.0215,
 '[{"nombre":"Av. Universidad","lat":22.1413,"lng":-100.9756,"tipo":"origen"},{"nombre":"Glorieta Juárez","lat":22.1465,"lng":-100.9812,"minutos":3},{"nombre":"Alameda Central","lat":22.151,"lng":-100.985,"minutos":6},{"nombre":"Mercado Revolución","lat":22.1558,"lng":-100.992,"minutos":10},{"nombre":"Plaza Sendero","lat":22.1633,"lng":-101.0215,"tipo":"destino"}]',
 '2026-04-13 07:30:00', 14.00),

-- 18. Ruta 26 — Tercera Grande
('Ruta 26 - Tercera Grande', 'Tercera Grande', 'Centro',
 22.1700, -100.9950, 22.1565, -100.9855,
 '[{"nombre":"Tercera Grande","lat":22.17,"lng":-100.995,"tipo":"origen"},{"nombre":"Av. Muñoz","lat":22.165,"lng":-100.99,"minutos":5},{"nombre":"Col. España","lat":22.16,"lng":-100.988,"minutos":8},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 12.50),

-- 19. Ruta 28 — Hacienda de Bravo
('Ruta 28 - Hda. Bravo', 'Hacienda de Bravo', 'Centro Soledad',
 22.1950, -100.9200, 22.1780, -100.9380,
 '[{"nombre":"Hacienda de Bravo","lat":22.195,"lng":-100.92,"tipo":"origen"},{"nombre":"Col. Rancho Pavón","lat":22.19,"lng":-100.928,"minutos":5},{"nombre":"Av. del Sauce","lat":22.185,"lng":-100.933,"minutos":9},{"nombre":"Centro Soledad","lat":22.178,"lng":-100.938,"tipo":"destino"}]',
 '2026-04-13 06:15:00', 12.50),

-- 20. Ruta 30 — Industrial Aviación
('Ruta 30 - Aviación', 'Calzada de Guadalupe', 'Industrial Aviación',
 22.1620, -100.9770, 22.1250, -100.9530,
 '[{"nombre":"Calzada de Guadalupe","lat":22.162,"lng":-100.977,"tipo":"origen"},{"nombre":"Av. Himno Nacional","lat":22.155,"lng":-100.97,"minutos":4},{"nombre":"Plaza de Toros","lat":22.143,"lng":-100.962,"minutos":9},{"nombre":"Industrial Aviación","lat":22.125,"lng":-100.953,"tipo":"destino"}]',
 '2026-04-13 06:45:00', 14.00),

-- 21. Ruta 33 — Santiago
('Ruta 33 - Santiago', 'Col. Santiago', 'Centro Histórico',
 22.1400, -101.0200, 22.1565, -100.9855,
 '[{"nombre":"Col. Santiago","lat":22.14,"lng":-101.02,"tipo":"origen"},{"nombre":"Av. Tangamanga","lat":22.14,"lng":-101.01,"minutos":4},{"nombre":"Parque Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":8},{"nombre":"Centro Histórico","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 12.50),

-- 22. Ruta 35 — Matehuala
('Ruta 35 - Matehuala', 'Col. Matehuala', 'Centro',
 22.1800, -100.9600, 22.1565, -100.9855,
 '[{"nombre":"Col. Matehuala","lat":22.18,"lng":-100.96,"tipo":"origen"},{"nombre":"Av. Nereo Rdz.","lat":22.172,"lng":-100.968,"minutos":5},{"nombre":"Mercado República","lat":22.154,"lng":-100.982,"minutos":14},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 12.50),

-- 23. Ruta 40 — Villa de Pozos
('Ruta 40 - Villa de Pozos', 'Villa de Pozos', 'Centro',
 22.1050, -100.8900, 22.1565, -100.9855,
 '[{"nombre":"Villa de Pozos","lat":22.105,"lng":-100.89,"tipo":"origen"},{"nombre":"Carr. a Rioverde","lat":22.12,"lng":-100.92,"minutos":8},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":18},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 16.00),

-- 24. Ruta 42 — Bocas
('Ruta 42 - Bocas', 'Col. Bocas', 'Terminal Terrestre',
 22.2100, -100.9500, 22.1490, -100.9730,
 '[{"nombre":"Col. Bocas","lat":22.21,"lng":-100.95,"tipo":"origen"},{"nombre":"Carr. 57 Norte","lat":22.195,"lng":-100.955,"minutos":6},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":14},{"nombre":"Terminal Terrestre","lat":22.149,"lng":-100.973,"tipo":"destino"}]',
 '2026-04-13 06:00:00', 18.00),

-- 25. MetroRed L1 — Norte
('MetroRed L1', 'Estación Central', 'Terminal Norte',
 22.1500, -100.9800, 22.1850, -100.9450,
 '[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Av. 5 de Mayo","lat":22.158,"lng":-100.978,"minutos":3},{"nombre":"Glorieta Niños Héroes","lat":22.165,"lng":-100.965,"minutos":7},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":13},{"nombre":"Terminal Norte","lat":22.185,"lng":-100.945,"tipo":"destino"}]',
 '2026-04-13 05:30:00', 12.50),

-- 26. MetroRed L2 — Sur
('MetroRed L2', 'Estación Central', 'Terminal Sur',
 22.1500, -100.9800, 22.1100, -100.9700,
 '[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Av. Universidad","lat":22.1413,"lng":-100.9756,"minutos":5},{"nombre":"Col. Moderna","lat":22.13,"lng":-100.975,"minutos":10},{"nombre":"Terminal Sur","lat":22.11,"lng":-100.97,"tipo":"destino"}]',
 '2026-04-13 05:30:00', 12.50),

-- 27. MetroRed L3 — Oriente
('MetroRed L3', 'Estación Central', 'Zona Industrial',
 22.1500, -100.9800, 22.1150, -100.9350,
 '[{"nombre":"Estación Central","lat":22.15,"lng":-100.98,"tipo":"origen"},{"nombre":"Eje Vial","lat":22.14,"lng":-100.96,"minutos":6},{"nombre":"Av. Industrial","lat":22.128,"lng":-100.945,"minutos":12},{"nombre":"Zona Industrial","lat":22.115,"lng":-100.935,"tipo":"destino"}]',
 '2026-04-13 05:30:00', 12.50),

-- 28. Ruta 50 — Lomas del Sur
('Ruta 50 - Lomas del Sur', 'Lomas del Sur', 'Centro',
 22.1050, -100.9950, 22.1565, -100.9855,
 '[{"nombre":"Lomas del Sur","lat":22.105,"lng":-100.995,"tipo":"origen"},{"nombre":"Pedregal de Sn. Ángel","lat":22.115,"lng":-100.99,"minutos":5},{"nombre":"Tangamanga","lat":22.1378,"lng":-101.0089,"minutos":14},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:30:00', 14.00),

-- 29. Ruta 55 — Rancho Pavón
('Ruta 55 - R. Pavón', 'Rancho Pavón', 'Centro',
 22.1900, -100.9300, 22.1565, -100.9855,
 '[{"nombre":"Rancho Pavón","lat":22.19,"lng":-100.93,"tipo":"origen"},{"nombre":"Soledad Centro","lat":22.178,"lng":-100.938,"minutos":6},{"nombre":"Av. Salvador Nava","lat":22.153,"lng":-100.965,"minutos":16},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:15:00', 14.00),

-- 30. Ruta 60 — Ecosistema
('Ruta 60 - Ecosistema', 'Fracc. Ecosistema', 'Centro',
 22.1750, -101.0200, 22.1565, -100.9855,
 '[{"nombre":"Fracc. Ecosistema","lat":22.175,"lng":-101.02,"tipo":"origen"},{"nombre":"Plaza Sendero","lat":22.1633,"lng":-101.0215,"minutos":5},{"nombre":"Mercado Revolución","lat":22.1558,"lng":-100.992,"minutos":12},{"nombre":"Centro","lat":22.1565,"lng":-100.9855,"tipo":"destino"}]',
 '2026-04-13 06:45:00', 14.00);

-- ============================================================
-- FIN — 30 rutas insertadas
-- ============================================================
