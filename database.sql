-- database.sql - Schema para Gestión de Ramas Git v6
-- Ejecutar este script en tu servidor MySQL

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gitcontroldb 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE gitcontroldb;

-- Tabla de aplicaciones
CREATE TABLE IF NOT EXISTS applications (
    id INT(11) NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    rama_principal VARCHAR(100) NOT NULL DEFAULT 'MAIN',
    prefijo_jira VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY unique_nombre (nombre),
    INDEX idx_nombre (nombre),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de ramas
CREATE TABLE IF NOT EXISTS branches (
    id INT(11) NOT NULL AUTO_INCREMENT,
    application_id INT(11) NOT NULL,
    numero_ticket VARCHAR(50) NOT NULL,
    ticket_completo VARCHAR(100) NOT NULL,
    fecha_mergeo DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_ticket_per_app (application_id, numero_ticket),
    INDEX idx_application_id (application_id),
    INDEX idx_fecha_mergeo (fecha_mergeo),
    INDEX idx_ticket_completo (ticket_completo),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de ejemplo (opcional - puedes eliminar esta sección si no quieres datos de prueba)
INSERT INTO applications (id, nombre, rama_principal, prefijo_jira) VALUES 
(1, 'Sistema Facturación', 'MAIN', 'DESA0248-'),
(2, 'Portal Cliente', 'master', 'XPRO-'),
(3, 'API Servicios', 'develop', ''),
(4, 'Dashboard Admin', 'MAIN', 'ADMIN-');

INSERT INTO branches (application_id, numero_ticket, ticket_completo, fecha_mergeo) VALUES
-- Ramas para Sistema Facturación
(1, '123', 'DESA0248-123', '2025-10-15'),
(1, '124', 'DESA0248-124', '2025-10-16'),
(1, '125', 'DESA0248-125', '2025-10-16'),

-- Ramas para Portal Cliente  
(2, '2001', 'XPRO-2001', '2025-10-14'),
(2, '2002', 'XPRO-2002', '2025-10-15'),

-- Ramas para API Servicios (sin prefijo)
(3, '3001', '3001', '2025-10-16'),
(3, '3002', '3002', '2025-10-14'),

-- Ramas para Dashboard Admin
(4, '100', 'ADMIN-100', '2025-10-13'),
(4, '101', 'ADMIN-101', '2025-10-16');

-- Reiniciar AUTO_INCREMENT para tener IDs consistentes
ALTER TABLE applications AUTO_INCREMENT = 5;
ALTER TABLE branches AUTO_INCREMENT = 10;

-- Mostrar información de las tablas creadas
SELECT 'Aplicaciones creadas:' AS info;
SELECT id, nombre, rama_principal, prefijo_jira FROM applications ORDER BY id;

SELECT 'Ramas creadas:' AS info;
SELECT 
    b.id, 
    a.nombre AS aplicacion,
    b.ticket_completo, 
    b.fecha_mergeo
FROM branches b 
JOIN applications a ON b.application_id = a.id 
ORDER BY a.nombre, b.fecha_mergeo DESC;

-- Verificación de la estructura
SELECT 'Estructura verificada correctamente' AS resultado;