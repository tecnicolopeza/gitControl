<?php
// api.php - API simple para Gestión de Ramas Git v6

// Configurar headers CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de la base de datos MySQL
$config = [
    'host' => 'localhost',
    'dbname' => 'gitcontroldb',
    'username' => 'root',          // CAMBIAR por tu usuario MySQL
    'password' => '',              // CAMBIAR por tu contraseña MySQL
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];

// Función para conectar a la base de datos
function getDBConnection($config) {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
            $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        } catch (PDOException $e) {
            throw new Exception('Error de conexión a MySQL: ' . $e->getMessage());
        }
    }

    return $pdo;
}

// Función para responder con JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Función para manejar errores
function handleError($message, $statusCode = 500) {
    jsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}

try {
    // Obtener conexión a la base de datos
    $pdo = getDBConnection($config);

    // Determinar método HTTP y acción
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    if ($method === 'GET') {
        // GET: Obtener todas las aplicaciones con sus ramas
        try {
            $query = "
                SELECT 
                    a.id,
                    a.nombre,
                    a.rama_principal as ramaPrincipal,
                    a.prefijo_jira as prefijoJira,
                    b.id as rama_id,
                    b.numero_ticket as numeroTicket,
                    b.ticket_completo as ticketCompleto,
                    b.fecha_mergeo as fechaMergeo
                FROM applications a
                LEFT JOIN branches b ON a.id = b.application_id
                ORDER BY a.nombre ASC, b.fecha_mergeo DESC, b.created_at DESC
            ";

            $stmt = $pdo->query($query);
            $results = $stmt->fetchAll();

            // Agrupar resultados por aplicación
            $apps = [];

            foreach ($results as $row) {
                $appId = $row['id'];

                // Crear aplicación si no existe
                if (!isset($apps[$appId])) {
                    $apps[$appId] = [
                        'id' => (int)$appId,
                        'nombre' => $row['nombre'],
                        'ramaPrincipal' => $row['ramaPrincipal'],
                        'prefijoJira' => $row['prefijoJira'] ?: '',
                        'ramasMergeadas' => []
                    ];
                }

                // Añadir rama si existe
                if ($row['rama_id']) {
                    $apps[$appId]['ramasMergeadas'][] = [
                        'id' => (int)$row['rama_id'],
                        'numeroTicket' => $row['numeroTicket'],
                        'ticketCompleto' => $row['ticketCompleto'],
                        'fechaMergeo' => $row['fechaMergeo'],
                        'fechaCreacion' => $row['fechaMergeo'] // Para compatibilidad
                    ];
                }
            }

            // Convertir a array indexado
            $response = array_values($apps);

            jsonResponse($response);

        } catch (Exception $e) {
            handleError('Error al obtener aplicaciones: ' . $e->getMessage());
        }

    } elseif ($method === 'POST' && isset($input['action'])) {
        // POST: Manejar diferentes acciones
        $action = $input['action'];

        switch ($action) {
            case 'create_app':
                try {
                    // Validaciones
                    if (empty($input['nombre']) || empty($input['ramaPrincipal'])) {
                        handleError('Nombre y rama principal son obligatorios', 400);
                    }

                    // Verificar nombre único
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE LOWER(nombre) = LOWER(?)");
                    $checkStmt->execute([$input['nombre']]);

                    if ($checkStmt->fetchColumn() > 0) {
                        handleError('Ya existe una aplicación con ese nombre', 400);
                    }

                    // Insertar aplicación
                    $stmt = $pdo->prepare("
                        INSERT INTO applications (nombre, rama_principal, prefijo_jira) 
                        VALUES (?, ?, ?)
                    ");

                    $stmt->execute([
                        trim($input['nombre']),
                        trim($input['ramaPrincipal']),
                        trim($input['prefijoJira'] ?? '')
                    ]);

                    $newId = $pdo->lastInsertId();

                    jsonResponse([
                        'success' => true,
                        'id' => (int)$newId,
                        'message' => 'Aplicación creada exitosamente'
                    ]);

                } catch (Exception $e) {
                    handleError('Error al crear aplicación: ' . $e->getMessage());
                }
                break;

            case 'update_app':
                try {
                    if (empty($input['id'])) {
                        handleError('ID de aplicación requerido', 400);
                    }

                    // Verificar que la aplicación existe
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE id = ?");
                    $checkStmt->execute([$input['id']]);

                    if ($checkStmt->fetchColumn() == 0) {
                        handleError('Aplicación no encontrada', 404);
                    }

                    // Verificar nombre único (excluyendo el actual)
                    if (!empty($input['nombre'])) {
                        $checkStmt = $pdo->prepare("
                            SELECT COUNT(*) FROM applications 
                            WHERE LOWER(nombre) = LOWER(?) AND id != ?
                        ");
                        $checkStmt->execute([$input['nombre'], $input['id']]);

                        if ($checkStmt->fetchColumn() > 0) {
                            handleError('Ya existe una aplicación con ese nombre', 400);
                        }
                    }

                    // Actualizar aplicación
                    $stmt = $pdo->prepare("
                        UPDATE applications 
                        SET nombre = ?, rama_principal = ?, prefijo_jira = ?
                        WHERE id = ?
                    ");

                    $stmt->execute([
                        trim($input['nombre']),
                        trim($input['ramaPrincipal']),
                        trim($input['prefijoJira'] ?? ''),
                        $input['id']
                    ]);

                    jsonResponse([
                        'success' => true,
                        'message' => 'Aplicación actualizada exitosamente'
                    ]);

                } catch (Exception $e) {
                    handleError('Error al actualizar aplicación: ' . $e->getMessage());
                }
                break;

            case 'create_branch':
                try {
                    // Validaciones
                    if (empty($input['applicationId']) || empty($input['numeroTicket']) || empty($input['fechaMergeo'])) {
                        handleError('ID de aplicación, número de ticket y fecha son obligatorios', 400);
                    }

                    // Verificar que la aplicación existe
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE id = ?");
                    $checkStmt->execute([$input['applicationId']]);

                    if ($checkStmt->fetchColumn() == 0) {
                        handleError('Aplicación no encontrada', 404);
                    }

                    // Verificar ticket único en la aplicación
                    $checkStmt = $pdo->prepare("
                        SELECT COUNT(*) FROM branches 
                        WHERE application_id = ? AND numero_ticket = ?
                    ");
                    $checkStmt->execute([$input['applicationId'], $input['numeroTicket']]);

                    if ($checkStmt->fetchColumn() > 0) {
                        handleError('Ya existe una rama con ese número de ticket en esta aplicación', 400);
                    }

                    // Insertar rama
                    $stmt = $pdo->prepare("
                        INSERT INTO branches (application_id, numero_ticket, ticket_completo, fecha_mergeo) 
                        VALUES (?, ?, ?, ?)
                    ");

                    $stmt->execute([
                        $input['applicationId'],
                        trim($input['numeroTicket']),
                        trim($input['ticketCompleto']),
                        $input['fechaMergeo']
                    ]);

                    $newId = $pdo->lastInsertId();

                    jsonResponse([
                        'success' => true,
                        'id' => (int)$newId,
                        'message' => 'Rama creada exitosamente'
                    ]);

                } catch (Exception $e) {
                    handleError('Error al crear rama: ' . $e->getMessage());
                }
                break;

            case 'update_branch':
                try {
                    if (empty($input['id'])) {
                        handleError('ID de rama requerido', 400);
                    }

                    // Verificar que la rama existe y obtener application_id
                    $checkStmt = $pdo->prepare("SELECT application_id FROM branches WHERE id = ?");
                    $checkStmt->execute([$input['id']]);
                    $branchData = $checkStmt->fetch();

                    if (!$branchData) {
                        handleError('Rama no encontrada', 404);
                    }

                    // Verificar ticket único (excluyendo el actual)
                    if (!empty($input['numeroTicket'])) {
                        $checkStmt = $pdo->prepare("
                            SELECT COUNT(*) FROM branches 
                            WHERE application_id = ? AND numero_ticket = ? AND id != ?
                        ");
                        $checkStmt->execute([
                            $branchData['application_id'],
                            $input['numeroTicket'],
                            $input['id']
                        ]);

                        if ($checkStmt->fetchColumn() > 0) {
                            handleError('Ya existe una rama con ese número de ticket en esta aplicación', 400);
                        }
                    }

                    // Actualizar rama
                    $stmt = $pdo->prepare("
                        UPDATE branches 
                        SET numero_ticket = ?, ticket_completo = ?, fecha_mergeo = ?
                        WHERE id = ?
                    ");

                    $stmt->execute([
                        trim($input['numeroTicket']),
                        trim($input['ticketCompleto']),
                        $input['fechaMergeo'],
                        $input['id']
                    ]);

                    jsonResponse([
                        'success' => true,
                        'message' => 'Rama actualizada exitosamente'
                    ]);

                } catch (Exception $e) {
                    handleError('Error al actualizar rama: ' . $e->getMessage());
                }
                break;

            case 'delete_branch':
                try {
                    if (empty($input['id'])) {
                        handleError('ID de rama requerido', 400);
                    }

                    // Eliminar rama
                    $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
                    $stmt->execute([$input['id']]);

                    if ($stmt->rowCount() == 0) {
                        handleError('Rama no encontrada', 404);
                    }

                    jsonResponse([
                        'success' => true,
                        'message' => 'Rama eliminada exitosamente'
                    ]);

                } catch (Exception $e) {
                    handleError('Error al eliminar rama: ' . $e->getMessage());
                }
                break;

            case 'deploy_to_pro':
                try {
                    if (empty($input['applicationId'])) {
                        handleError('ID de aplicación requerido', 400);
                    }

                    // Verificar que la aplicación existe
                    $checkStmt = $pdo->prepare("SELECT nombre FROM applications WHERE id = ?");
                    $checkStmt->execute([$input['applicationId']]);
                    $appData = $checkStmt->fetch();

                    if (!$appData) {
                        handleError('Aplicación no encontrada', 404);
                    }

                    // Eliminar todas las ramas de la aplicación
                    $stmt = $pdo->prepare("DELETE FROM branches WHERE application_id = ?");
                    $stmt->execute([$input['applicationId']]);

                    $deletedCount = $stmt->rowCount();

                    jsonResponse([
                        'success' => true,
                        'message' => "Aplicación '{$appData['nombre']}' subida a PRO exitosamente",
                        'ramas_eliminadas' => $deletedCount
                    ]);

                } catch (Exception $e) {
                    handleError('Error al subir aplicación a PRO: ' . $e->getMessage());
                }
                break;

            default:
                handleError('Acción no válida', 400);
        }

    } else {
        handleError('Método HTTP no permitido', 405);
    }

} catch (Exception $e) {
    handleError('Error del servidor: ' . $e->getMessage());
}
?>