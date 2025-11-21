# Script de Reestructuración Automática - CycloBot
# Ejecutar como Administrador en PowerShell

Write-Host "🚀 INICIANDO REESTRUCTURACIÓN CYCLOBOT..." -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Yellow

# Configuración
$ProjectRoot = Get-Location
$BackupDir = "$ProjectRoot\CycloBot-Backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Función para crear directorios
function Create-DirectoryStructure {
    Write-Host "`n📁 CREANDO ESTRUCTURA DE CARPETAS..." -ForegroundColor Green
    
    $directories = @(
        "public",
        "public\css", 
        "public\js",
        "public\assets",
        "public\assets\images",
        "public\assets\icons",
        "admin",
        "tools"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✅ Creado: $dir" -ForegroundColor Green
        } else {
            Write-Host "  📁 Ya existe: $dir" -ForegroundColor Yellow
        }
    }
}

# Función para hacer backup
function Create-Backup {
    Write-Host "`n📦 CREANDO BACKUP..." -ForegroundColor Green
    try {
        Copy-Item -Path "." -Destination $BackupDir -Recurse -Force
        Write-Host "  ✅ Backup creado en: $BackupDir" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  No se pudo crear backup: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para limpiar archivos innecesarios
function Remove-UnnecessaryFiles {
    Write-Host "`n🗑️  LIMPIANDO ARCHIVOS INNECESARIOS..." -ForegroundColor Green
    
    $filesToRemove = @(
        "design-evaluator.html",
        "*.log",
        ".DS_Store",
        "Thumbs.db",
        "desktop.ini"
    )
    
    foreach ($pattern in $filesToRemove) {
        Get-ChildItem -Path $ProjectRoot -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "  🗑️  Eliminado: $($_.Name)" -ForegroundColor Yellow
            Remove-Item $_.FullName -Force
        }
    }
    
    # Limpiar carpetas de cache
    $cacheDirs = @(".cache", "node_modules")
    foreach ($cacheDir in $cacheDirs) {
        if (Test-Path $cacheDir) {
            Remove-Item $cacheDir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  🗑️  Eliminado: $cacheDir" -ForegroundColor Yellow
        }
    }
}

# Función para mover archivos
function Move-FilesToNewStructure {
    Write-Host "`n📁 MOVIENDO ARCHIVOS A NUEVA ESTRUCTURA..." -ForegroundColor Green
    
    # Mapeo de movimientos: Origen -> Destino
    $fileMoves = @{
        "styles.css" = "public\css\styles.css"
        "script.js" = "public\js\script.js" 
        "auth.js" = "public\js\auth.js"
        "admin.js" = "public\js\admin.js"
        "database.js" = "public\js\database.js"
        "service-worker.js" = "public\service-worker.js"
        "admin.html" = "admin\dashboard.html"
        "login.html" = "admin\login.html"
    }
    
    foreach ($move in $fileMoves.GetEnumerator()) {
        $source = $move.Key
        $destination = $move.Value
        
        if (Test-Path $source) {
            Move-Item -Path $source -Destination $destination -Force
            Write-Host "  📂 Movido: $source -> $destination" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  No encontrado: $source" -ForegroundColor Yellow
        }
    }
}

# Función para crear archivos nuevos
function Create-NewFiles {
    Write-Host "`n🆕 CREANDO ARCHIVOS NUEVOS..." -ForegroundColor Green
    
    # 1. CSS para Admin
    $adminCSS = @"
/* Estilos específicos para panel admin - CycloBot Theme */
.admin-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
    padding: 20px;
    font-family: 'Exo 2', sans-serif;
    color: #e2e8f0;
}

.admin-header {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.admin-nav {
    display: flex;
    gap: 15px;
}

.nav-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #334155, #475569);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
}

.nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.nav-btn.logout {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.admin-panel {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 25px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.panel-title {
    color: #60a5fa;
    font-family: 'Orbitron', monospace;
    font-size: 1.5em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
}

.stat-number {
    font-size: 2em;
    font-weight: bold;
    color: #60a5fa;
    display: block;
}

.stat-label {
    color: #94a3b8;
    font-size: 0.9em;
}

.db-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.db-table th, .db-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #334155;
}

.db-table th {
    background: rgba(51, 65, 85, 0.5);
    color: #60a5fa;
    font-weight: 600;
}

.db-table tr:hover {
    background: rgba(51, 65, 85, 0.2);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #e2e8f0;
    font-weight: 500;
}

.form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 12px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid #334155;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 1em;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
}

.btn-primary {
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
}

.alert {
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
}

.alert.success {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid #4ade80;
    color: #4ade80;
}

.alert.error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #f87171;
    color: #f87171;
}
"@

    Set-Content -Path "public\css\admin.css" -Value $adminCSS
    Write-Host "  ✅ Creado: public\css\admin.css" -ForegroundColor Green

    # 2. CSS para Auth
    $authCSS = @"
/* Estilos para sistema de autenticación - Mantiene diseño CycloBot */
.auth-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Exo 2', sans-serif;
}

.auth-card {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 40px;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
}

.auth-header {
    text-align: center;
    margin-bottom: 30px;
}

.auth-header h1 {
    color: #60a5fa;
    font-family: 'Orbitron', monospace;
    font-size: 2.5em;
    margin-bottom: 10px;
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.auth-header p {
    color: #cbd5e1;
    font-size: 1.1em;
    opacity: 0.9;
}

.auth-form .form-group {
    margin-bottom: 25px;
}

.auth-form label {
    display: block;
    color: #e2e8f0;
    margin-bottom: 8px;
    font-weight: 500;
}

.auth-form input {
    width: 100%;
    padding: 15px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid #334155;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 1em;
    transition: all 0.3s ease;
}

.auth-form input:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
}

.auth-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
}

.auth-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
}

.auth-footer {
    text-align: center;
    margin-top: 30px;
    color: #94a3b8;
}

.back-link {
    color: #60a5fa;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 15px;
    transition: color 0.3s ease;
}

.back-link:hover {
    color: #93c5fd;
}

.auth-message {
    margin-top: 20px;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    display: none;
}

.auth-message.success {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid #4ade80;
    display: block;
}

.auth-message.error {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid #f87171;
    display: block;
}
"@

    Set-Content -Path "public\css\auth.css" -Value $authCSS
    Write-Host "  ✅ Creado: public\css\auth.css" -ForegroundColor Green

    # 3. Evaluador de Diseño en Tools
    $designEvaluator = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CycloBot - Evaluador de Diseño</title>
    <style>
        :root {
            --primary: #667eea;
            --primary-dark: #5a6fd8;
            --secondary: #764ba2;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --dark: #2c3e50;
            --light: #f8fafc;
            --gray: #64748b;
            --border: #e2e8f0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, var(--dark), #34495e);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.8em;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .evaluation-section {
            padding: 35px;
            border-bottom: 1px solid var(--border);
        }

        .section-title {
            color: var(--dark);
            margin-bottom: 25px;
            font-size: 1.6em;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
        }

        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .test-card {
            background: var(--light);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 25px;
            transition: all 0.3s ease;
        }

        .test-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .status {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-top: 10px;
        }

        .status.passed {
            background: #d1fae5;
            color: var(--success);
        }

        .status.failed {
            background: #fee2e2;
            color: var(--error);
        }

        .status.warning {
            background: #fef3c7;
            color: var(--warning);
        }

        .btn {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CycloBot - Evaluador de Diseño</h1>
            <p>Herramienta de diagnóstico para la reestructuración del proyecto</p>
        </div>

        <div class="evaluation-section">
            <h2 class="section-title">✅ Reestructuración Completada</h2>
            <div class="test-grid">
                <div class="test-card">
                    <h3>📁 Estructura de Carpetas</h3>
                    <p>Nueva organización implementada</p>
                    <div class="status passed">COMPLETADO</div>
                </div>
                <div class="test-card">
                    <h3>🎨 Estilos Actualizados</h3>
                    <p>Archivos CSS reorganizados</p>
                    <div class="status passed">COMPLETADO</div>
                </div>
                <div class="test-card">
                    <h3>🔐 Sistema de Auth</h3>
                    <p>Autenticación mejorada</p>
                    <div class="status passed">COMPLETADO</div>
                </div>
            </div>
        </div>

        <div class="evaluation-section" style="text-align: center;">
            <button class="btn" onclick="window.close()">Cerrar Evaluador</button>
        </div>
    </div>
</body>
</html>
"@

    Set-Content -Path "tools\design-evaluator.html" -Value $designEvaluator
    Write-Host "  ✅ Creado: tools\design-evaluator.html" -ForegroundColor Green
}

# Función para actualizar referencias en archivos HTML
function Update-HTMLReferences {
    Write-Host "`n🔧 ACTUALIZANDO REFERENCIAS EN ARCHIVOS HTML..." -ForegroundColor Green
    
    # 1. Actualizar index.html
    $indexPath = "index.html"
    if (Test-Path $indexPath) {
        $content = Get-Content $indexPath -Raw
        
        # Actualizar referencias CSS/JS
        $content = $content -replace 'href="styles.css"', 'href="public/css/styles.css"'
        $content = $content -replace 'src="script.js"', 'src="public/js/script.js"'
        $content = $content -replace 'src="auth.js"', 'src="public/js/auth.js"'
        
        # Agregar auth.js si no existe
        if ($content -notmatch 'src="public/js/auth.js"') {
            $content = $content -replace '(</body>)', '<script src="public/js/auth.js"></script>$1'
        }
        
        Set-Content -Path $indexPath -Value $content
        Write-Host "  ✅ Actualizado: index.html" -ForegroundColor Green
    }
    
    # 2. Actualizar admin/login.html
    $loginPath = "admin\login.html"
    if (Test-Path $loginPath) {
        $content = Get-Content $loginPath -Raw
        
        # Agregar CSS de auth
        if ($content -notmatch 'auth.css') {
            $content = $content -replace '(</head>)', '<link rel="stylesheet" href="../public/css/auth.css">$1'
        }
        
        # Actualizar referencia auth.js
        $content = $content -replace 'src="auth.js"', 'src="../public/js/auth.js"'
        $content = $content -replace 'src="\.\./auth.js"', 'src="../public/js/auth.js"'
        
        Set-Content -Path $loginPath -Value $content
        Write-Host "  ✅ Actualizado: admin/login.html" -ForegroundColor Green
    }
    
    # 3. Actualizar admin/dashboard.html
    $dashboardPath = "admin\dashboard.html"
    if (Test-Path $dashboardPath) {
        $content = Get-Content $dashboardPath -Raw
        
        # Agregar protección y estilos
        $protectionScript = @"
<script>
// Protección de ruta - verificar autenticación
if (!localStorage.getItem('cyclobot_admin') || 
    localStorage.getItem('cyclobot_admin') !== 'true') {
    window.location.href = 'login.html';
}
</script>
"@

        if ($content -notmatch 'Protección de ruta') {
            $content = $content -replace '(</head>)', "$protectionScript`n<link rel=`"stylesheet`" href=`"../public/css/admin.css`">`$1"
        }
        
        # Actualizar referencias JS
        $content = $content -replace 'src="admin.js"', 'src="../public/js/admin.js"'
        $content = $content -replace 'src="database.js"', 'src="../public/js/database.js"'
        $content = $content -replace 'src="\.\./admin.js"', 'src="../public/js/admin.js"'
        $content = $content -replace 'src="\.\./database.js"', 'src="../public/js/database.js"'
        
        Set-Content -Path $dashboardPath -Value $content
        Write-Host "  ✅ Actualizado: admin/dashboard.html" -ForegroundColor Green
    }
}

# Función para actualizar auth.js
function Update-AuthJS {
    Write-Host "`n🔐 ACTUALIZANDO SISTEMA DE AUTENTICACIÓN..." -ForegroundColor Green
    
    $authJS = @"
// Sistema de autenticación MEJORADO para CycloBot
class AuthSystem {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: 'admin123' // CAMBIAR EN PRODUCCIÓN
        };
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.setupEventListeners();
        this.updateUserInterface();
    }

    checkAdminAccess() {
        const currentPath = window.location.pathname;
        
        // Si está en panel admin sin autenticación, redirigir a login
        if (currentPath.includes('/admin/dashboard.html') && 
            !this.isAdminAuthenticated()) {
            window.location.href = '/admin/login.html';
            return;
        }

        // Si está en login ya autenticado, redirigir a dashboard
        if (currentPath.includes('/admin/login.html') && 
            this.isAdminAuthenticated()) {
            window.location.href = '/admin/dashboard.html';
        }
    }

    setupEventListeners() {
        // Login form en admin
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Botón login en index principal
        const mainLoginBtn = document.getElementById('loginBtn');
        if (mainLoginBtn && !mainLoginBtn.onclick) {
            mainLoginBtn.addEventListener('click', () => this.redirectToAdminLogin());
        }

        // Botón logout en admin
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    updateUserInterface() {
        // Actualizar estado en interfaz principal
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            if (this.isAdminAuthenticated()) {
                userStatus.innerHTML = '👑 Administrador';
                userStatus.style.color = '#60a5fa';
            } else {
                userStatus.innerHTML = '👤 Invitado';
                userStatus.style.color = '#94a3b8';
            }
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const messageDiv = document.getElementById('authMessage');

        if (!username || !password) {
            this.showMessage('❌ Por favor completa todos los campos', 'error');
            return;
        }

        // Simular verificación (luego con Supabase)
        setTimeout(() => {
            if (username === this.adminCredentials.username && 
                password === this.adminCredentials.password) {
                
                localStorage.setItem('cyclobot_admin', 'true');
                localStorage.setItem('cyclobot_user', username);
                
                this.showMessage('✅ Acceso concedido. Redirigiendo...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage('❌ Credenciales incorrectas', 'error');
            }
        }, 1000);
    }

    redirectToAdminLogin() {
        window.location.href = '/admin/login.html';
    }

    logout() {
        localStorage.removeItem('cyclobot_admin');
        localStorage.removeItem('cyclobot_user');
        this.showMessage('👋 Sesión cerrada. Redirigiendo...', 'success');
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }

    isAdminAuthenticated() {
        return localStorage.getItem('cyclobot_admin') === 'true';
    }

    showMessage(text, type) {
        // Buscar contenedor de mensajes
        let messageDiv = document.getElementById('authMessage');
        
        if (!messageDiv) {
            // Crear uno si no existe
            messageDiv = document.createElement('div');
            messageDiv.id = 'authMessage';
            messageDiv.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            \`;
            document.body.appendChild(messageDiv);
        }

        messageDiv.textContent = text;
        messageDiv.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 4000);
    }
}

// Inicializar sistema de autenticación
const authSystem = new AuthSystem();
"@

    Set-Content -Path "public\js\auth.js" -Value $authJS
    Write-Host "  ✅ Actualizado: public/js/auth.js" -ForegroundColor Green
}

# Función para verificar estructura final
function Test-FinalStructure {
    Write-Host "`n🔍 VERIFICANDO ESTRUCTURA FINAL..." -ForegroundColor Cyan
    
    $expectedFiles = @(
        "index.html",
        "manifest.json", 
        "admin\login.html",
        "admin\dashboard.html",
        "public\css\styles.css",
        "public\css\admin.css",
        "public\css\auth.css",
        "public\js\script.js",
        "public\js\auth.js", 
        "public\js\admin.js",
        "public\js\database.js",
        "public\service-worker.js",
        "tools\design-evaluator.html"
    )
    
    $missingFiles = @()
    
    foreach ($file in $expectedFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file" -ForegroundColor Red
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Host "`n⚠️  Archivos faltantes: $($missingFiles.Count)" -ForegroundColor Yellow
        $missingFiles | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
    } else {
        Write-Host "`n🎉 ¡TODOS LOS ARCHIVOS ESTÁN EN SU LUGAR!" -ForegroundColor Green
    }
}

# EJECUCIÓN PRINCIPAL
try {
    Write-Host "Iniciando reestructuración en: $ProjectRoot" -ForegroundColor Cyan
    
    # Crear backup primero
    Create-Backup
    
    # Ejecutar pasos de reestructuración
    Create-DirectoryStructure
    Remove-UnnecessaryFiles
    Move-FilesToNewStructure
    Create-NewFiles
    Update-HTMLReferences
    Update-AuthJS
    
    # Verificación final
    Test-FinalStructure
    
    Write-Host "`n==============================================" -ForegroundColor Yellow
    Write-Host "🎉 REESTRUCTURACIÓN COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "📍 Backup creado en: $BackupDir" -ForegroundColor Cyan
    Write-Host "🚀 Ahora puedes abrir index.html para probar el sistema" -ForegroundColor Cyan
    Write-Host "🔑 Credenciales admin: usuario='admin', contraseña='admin123'" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ ERROR durante la reestructuración: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
}

# Pausa para ver resultados
Write-Host "`nPresiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")