// Sistema de autenticación ÚNICO y CORREGIDO para CycloBot
class AuthSystem {
    constructor() {
        this.basePath = window.location.pathname.includes('/CycloBot') ? '/CycloBot' : '';
        this.adminCredentials = {
            username: 'admin',
            password: 'S0p0rt35'
        };
        this.userCredentials = {
            'usuario': { password: 'user123', role: 'user', name: 'Usuario' }
        };
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.setupEventListeners();
        this.updateUserInterface();
        console.log('🔐 AuthSystem inicializado - Sistema Único');
    }

    checkAdminAccess() {
        const currentPath = window.location.pathname;
        
        // Redirigir si intenta acceder a admin sin estar autenticado
        if (currentPath.includes('/admin/dashboard.html') && !this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/login.html`;
            return;
        }

        // Redirigir si ya está autenticado y va a login
        if (currentPath.includes('/admin/login.html') && this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/dashboard.html`;
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners de auth...');
        
        // Login form en admin
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
            console.log('✅ Login form admin configurado');
        }

        // Botón login en index principal
        const mainLoginBtn = document.getElementById('loginBtn');
        if (mainLoginBtn) {
            mainLoginBtn.addEventListener('click', () => this.handleMainLogin());
            console.log('✅ Botón login principal configurado');
        }

        // Botón submit login en modal
        const submitLoginBtn = document.getElementById('submitLogin');
        if (submitLoginBtn) {
            submitLoginBtn.addEventListener('click', () => this.handleModalLogin());
            console.log('✅ Botón login modal configurado');
        }

        // Configurar logout
        this.setupLogoutListeners();
    }

    setupLogoutListeners() {
        console.log('🔍 Configurando listeners de logout...');
        
        // Buscar botón logout por diferentes selectores
        const logoutSelectors = ['#logoutBtn', '[data-action="logout"]', '.logout-btn'];
        let logoutBtn = null;

        for (const selector of logoutSelectors) {
            logoutBtn = document.querySelector(selector);
            if (logoutBtn) break;
        }

        if (logoutBtn) {
            // Clonar y reemplazar para evitar duplicados
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Ejecutando logout...');
                this.logout();
            });
            
            console.log('✅ Botón logout configurado');
        }
    }

    // Manejo de login desde página principal
    handleMainLogin() {
        if (this.isAuthenticated()) {
            // Si ya está autenticado, redirigir según rol
            if (this.isAdminAuthenticated()) {
                window.location.href = `${this.basePath}/admin/dashboard.html`;
            } else {
                this.showMessage('✅ Ya has iniciado sesión', 'success');
            }
        } else {
            // Mostrar modal de login
            if (window.cycloBotUI && typeof window.cycloBotUI.showLoginModal === 'function') {
                window.cycloBotUI.showLoginModal();
            } else {
                // Fallback: redirigir a login admin
                window.location.href = `${this.basePath}/admin/login.html`;
            }
        }
    }

    // Manejo de login desde modal
    async handleModalLogin() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            this.showMessage('⚠️ Completa todos los campos', 'error');
            return;
        }

        const success = await this.authenticate(username, password);
        
        if (success) {
            this.showMessage('✅ Login exitoso', 'success');
            
            // Ocultar modal
            if (window.cycloBotUI && typeof window.cycloBotUI.hideLoginModal === 'function') {
                window.cycloBotUI.hideLoginModal();
            }
            
            // Actualizar UI
            this.updateUserInterface();
            
            // Redirigir admin a dashboard
            if (this.isAdminAuthenticated()) {
                setTimeout(() => {
                    window.location.href = `${this.basePath}/admin/dashboard.html`;
                }, 1000);
            }
        } else {
            this.showMessage('❌ Credenciales incorrectas', 'error');
        }
    }

    // Sistema de autenticación único
    async authenticate(username, password) {
        // Verificar admin
        if (username === this.adminCredentials.username && password === this.adminCredentials.password) {
            this.setUserSession({
                username: 'Administrador',
                role: 'admin',
                loginTime: new Date().toISOString()
            });
            return true;
        }

        // Verificar usuarios normales
        if (this.userCredentials[username] && this.userCredentials[username].password === password) {
            this.setUserSession({
                username: this.userCredentials[username].name,
                role: this.userCredentials[username].role,
                loginTime: new Date().toISOString()
            });
            return true;
        }

        return false;
    }

    setUserSession(userData) {
        localStorage.setItem('cyclobot_user', JSON.stringify(userData));
        
        if (userData.role === 'admin') {
            localStorage.setItem('cyclobot_admin', 'true');
        }
    }

    // Manejo de login admin (página separada)
    async handleAdminLogin(e) {
        if (e) e.preventDefault();
        
        const username = document.getElementById('adminUsername')?.value;
        const password = document.getElementById('adminPassword')?.value;

        if (!username || !password) {
            this.showMessage('⚠️ Completa todos los campos', 'error');
            return;
        }

        const success = await this.authenticate(username, password);
        
        if (success && this.isAdminAuthenticated()) {
            this.showMessage('✅ Acceso administrativo concedido', 'success');
            
            setTimeout(() => {
                window.location.href = `${this.basePath}/admin/dashboard.html`;
            }, 1500);
        } else {
            this.showMessage('❌ Credenciales administrativas incorrectas', 'error');
        }
    }

    logout() {
        console.log('🔓 Ejecutando logout...');
        
        // Limpiar solo los datos de auth
        localStorage.removeItem('cyclobot_admin');
        localStorage.removeItem('cyclobot_user');
        
        this.showMessage('👋 Sesión cerrada', 'success');
        
        setTimeout(() => {
            window.location.href = `${this.basePath}/index.html`;
        }, 1000);
    }

    // Verificaciones de estado
    isAuthenticated() {
        return localStorage.getItem('cyclobot_user') !== null;
    }

    isAdminAuthenticated() {
        return localStorage.getItem('cyclobot_admin') === 'true';
    }

    getCurrentUser() {
        const userData = localStorage.getItem('cyclobot_user');
        return userData ? JSON.parse(userData) : null;
    }

    // Actualización de interfaz de usuario
    updateUserInterface() {
        const userStatus = document.getElementById('userStatus');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        const currentUser = this.getCurrentUser();
        
        if (userStatus) {
            if (currentUser) {
                userStatus.textContent = `👤 ${currentUser.username}`;
                userStatus.style.color = currentUser.role === 'admin' ? '#60a5fa' : '#94a3b8';
            } else {
                userStatus.textContent = '👤 Invitado';
                userStatus.style.color = '#94a3b8';
            }
        }

        if (loginBtn && logoutBtn) {
            if (currentUser) {
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'block';
                
                if (currentUser.role === 'admin') {
                    loginBtn.innerHTML = '<i class="fas fa-cog"></i> Panel Admin';
                    loginBtn.onclick = () => window.location.href = `${this.basePath}/admin/dashboard.html`;
                }
            } else {
                loginBtn.style.display = 'block';
                logoutBtn.style.display = 'none';
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            }
        }
    }

    // Sistema de mensajes
    showMessage(text, type = 'info') {
        // Buscar contenedor existente
        let messageDiv = document.getElementById('authMessage');
        
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'authMessage';
            Object.assign(messageDiv.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '15px 20px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                zIndex: '10000',
                maxWidth: '300px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
            });
            document.body.appendChild(messageDiv);
        }

        messageDiv.textContent = text;
        messageDiv.style.backgroundColor = this.getMessageColor(type);
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 4000);
    }

    getMessageColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
}

// Inicializar sistema de autenticación
const authSystem = new AuthSystem();

// Funciones globales para debugging
window.cyclopsAuth = {
    checkStatus: () => {
        console.log('🔐 ESTADO DE AUTENTICACIÓN:');
        console.log('• cyclobot_admin:', localStorage.getItem('cyclobot_admin'));
        console.log('• cyclobot_user:', localStorage.getItem('cyclobot_user'));
        console.log('• Autenticado:', authSystem.isAuthenticated());
        console.log('• Es admin:', authSystem.isAdminAuthenticated());
        console.log('• Usuario:', authSystem.getCurrentUser());
    },
    
    forceLogout: () => {
        authSystem.logout();
    },
    
    forceLogin: (role = 'user') => {
        const userData = {
            username: role === 'admin' ? 'Administrador' : 'Usuario',
            role: role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('cyclobot_user', JSON.stringify(userData));
        if (role === 'admin') {
            localStorage.setItem('cyclobot_admin', 'true');
        }
        authSystem.updateUserInterface();
        console.log(`✅ Login forzado como ${role}`);
    }
};

console.log('🚀 AuthSystem ÚNICO cargado correctamente');
