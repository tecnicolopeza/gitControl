# Gestión de Ramas Git v6 🚀

Aplicación web completa para gestionar ramas Git mergeadas por aplicación con persistencia en MySQL.

## 📋 Características

✅ **Gestión de Aplicaciones**
- Crear, editar y eliminar aplicaciones
- Configurar rama principal (MAIN, master, develop, etc.)
- Prefijos JIRA automáticos por aplicación

✅ **Gestión de Ramas**
- Añadir ramas con números de ticket JIRA
- Fechas de mergeo editables
- Ordenamiento automático por fecha más reciente
- Edición de tickets y fechas

✅ **Funcionalidades Avanzadas**
- Búsqueda en tiempo real de aplicaciones
- Subir a PRO individual (resetea ramas por aplicación)
- Edición inline de nombres, ramas principales y prefijos
- Preview de tickets antes de crear
- Validaciones completas

✅ **Diseño Responsive**
- Bootstrap 5 con diseño moderno
- Funciona en móvil, tablet y desktop
- Breakpoints optimizados
- Interfaz intuitiva

✅ **Persistencia MySQL**
- Datos guardados automáticamente en base de datos
- Modo offline si MySQL no está disponible
- Sincronización transparente

## 🛠️ Instalación

### Requisitos
- Servidor web con PHP 7.4+ (Apache, Nginx, XAMPP, WAMP, etc.)
- MySQL 5.7+ o MariaDB 10.3+
- Extensiones PHP: PDO, PDO_MySQL

### Paso 1: Configurar MySQL

1. **Crear la base de datos:**
   ```sql
   CREATE DATABASE git_branches_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Importar el schema:**
   - Ejecutar todo el contenido de `database.sql` en tu MySQL
   - Esto creará las tablas y datos de ejemplo

### Paso 2: Configurar la aplicación

1. **Descargar archivos:**
   - Descomprimir el ZIP en tu directorio web

2. **Configurar base de datos:**
   - Editar `api.php` líneas 11-12:
   ```php
   'username' => 'tu_usuario_mysql',    // ← CAMBIAR
   'password' => 'tu_contraseña_mysql', // ← CAMBIAR
   ```

3. **Permisos (Linux/Mac):**
   ```bash
   chmod 644 *.php *.html *.css *.js *.sql
   ```

### Paso 3: Probar la aplicación

1. **Abrir en navegador:**
   - `http://localhost/git-branch-manager-v6/`
   - O la URL de tu servidor web

2. **Verificar conexión:**
   - Si aparece "✅ Conectado a MySQL" → Todo correcto
   - Si aparece "⚠️ Modo offline" → Revisar configuración MySQL

## 📁 Estructura de Archivos

```
git-branch-manager-v6/
├── index.html      # Interfaz principal HTML
├── styles.css      # Estilos responsive CSS
├── script.js       # Lógica JavaScript v6
├── api.php         # Backend PHP para MySQL
├── database.sql    # Schema de base de datos
└── README.md       # Esta documentación
```

## 🎯 Uso de la Aplicación

### Crear Aplicación
1. Hacer clic en "Añadir Aplicación"
2. Completar: nombre, rama principal, prefijo JIRA (opcional)
3. El prefijo se añade automáticamente a todos los tickets

### Añadir Ramas
1. Hacer clic en "Añadir Rama" en cualquier aplicación
2. Escribir solo el número del ticket (ej: 123)
3. Seleccionar fecha de mergeo
4. El ticket completo se forma automáticamente (ej: DESA0248-123)

### Editar Elementos
- **Nombres/Ramas/Prefijos**: Hacer clic en el texto para editar inline
- **Números de ticket**: Botón lápiz en cada rama
- **Fechas**: Botón calendario en cada rama

### Subir a PRO
- Hacer clic en "Subir a PRO" en cualquier aplicación
- Confirmar la acción
- Se eliminarán TODAS las ramas de esa aplicación específica

### Búsqueda
- Escribir en el buscador para filtrar aplicaciones en tiempo real
- Botón X para limpiar la búsqueda

## 🔧 Configuración Avanzada

### Personalizar Base de Datos
Editar en `api.php`:
```php
$config = [
    'host' => 'localhost',        // Servidor MySQL
    'dbname' => 'git_branches_db', // Nombre de la BD
    'username' => 'root',          // Usuario
    'password' => '',              // Contraseña
];
```

### Datos de Ejemplo
Para eliminar los datos de ejemplo:
```sql
DELETE FROM branches;
DELETE FROM applications;
ALTER TABLE applications AUTO_INCREMENT = 1;
ALTER TABLE branches AUTO_INCREMENT = 1;
```

### Backup de Datos
```bash
mysqldump -u usuario -p git_branches_db > backup.sql
```

## 🐛 Solución de Problemas

### Error: No se puede conectar con MySQL
- Verificar que MySQL esté corriendo
- Verificar credenciales en `api.php`
- Verificar que la base de datos exista
- Verificar permisos del usuario MySQL

### Error: Página en blanco
- Verificar que PHP esté habilitado
- Revisar logs de error del servidor web
- Verificar que todos los archivos estén presentes

### Error: CORS
- La aplicación debe ejecutarse en un servidor web
- No funciona abriendo directamente el archivo HTML

### Modo Offline
- La aplicación funciona sin MySQL pero no guarda datos
- Los datos se resetean al recargar la página
- Configurar MySQL para persistencia completa

## 🔒 Seguridad

- Los datos se validan en frontend y backend
- Queries preparadas para prevenir SQL injection
- Headers CORS configurados
- Manejo seguro de errores

## 🚀 Características Técnicas

### Frontend
- HTML5 semántico
- Bootstrap 5.3.3 responsive
- JavaScript vanilla (ES6+)
- Fetch API para comunicación con backend
- LocalStorage fallback

### Backend
- PHP 7.4+ con PDO
- MySQL con relaciones foreign key
- API REST simple
- Manejo completo de errores
- Validaciones server-side

### Base de Datos
- MySQL con charset utf8mb4
- Índices optimizados
- Restricciones de integridad
- Cascading deletes

## 📱 Compatibilidad

### Navegadores
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Móvil (320px - 767px)

### Servidores
- ✅ Apache 2.4+
- ✅ Nginx 1.18+
- ✅ XAMPP/WAMP/MAMP
- ✅ Hosting compartido con PHP

## 📞 Soporte

Si encuentras algún problema:
1. Revisar la consola del navegador (F12)
2. Verificar logs del servidor web
3. Comprobar configuración de MySQL
4. Verificar permisos de archivos

---

**Versión:** 6.0  
**Última actualización:** Octubre 2025  
**Compatibilidad:** PHP 7.4+, MySQL 5.7+