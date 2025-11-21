// Sistema de autenticación MEJORADO para CycloBot - RUTAS CORREGIDAS
class AuthSystem {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: 'S0p0rt35' // CAMBIAR EN PRODUCCIÓN
        };
        this.basePath = '/CycloBot'; // RUTA BASE PARA GITHUB PAGES
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
            window.location.href = `${this.basePath}/admin/login.html`;
            return;
        }

        // Si está en login ya autenticado, redirigir a dashboard
        if (currentPath.includes('/admin/login.html') && 
            this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/dashboard.html`;
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
                userStatus.innerHTML = '👨‍💼 Administrador';
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
            this.showMessage('⚠️ Por favor completa todos los campos', 'error');
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
                    // REDIRECCIÓN CORREGIDA - Siempre usa la ruta completa
                    window.location.href = `${this.basePath}/admin/dashboard.html`;
                }, 1500);
            } else {
                this.showMessage('❌ Credenciales incorrectas', 'error');
            }
        }, 1000);
    }

    redirectToAdminLogin() {
        // REDIRECCIÓN CORREGIDA
        window.location.href = `${this.basePath}/admin/login.html`;
    }

    logout() {
        localStorage.removeItem('cyclobot_admin');
        localStorage.removeItem('cyclobot_user');
        this.showMessage('👋 Sesión cerrada. Redirigiendo...', 'success');
        
        setTimeout(() => {
            // REDIRECCIÓN CORREGIDA
            window.location.href = `${this.basePath}/index.html`;
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
            
            // Aplicar estilos correctamente
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '20px';
            messageDiv.style.right = '20px';
            messageDiv.style.padding = '15px 20px';
            messageDiv.style.borderRadius = '8px';
            messageDiv.style.color = 'white';
            messageDiv.style.fontWeight = '600';
            messageDiv.style.zIndex = '10000';
            messageDiv.style.maxWidth = '300px';
            messageDiv.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            messageDiv.style.transition = 'all 0.3s ease';
            
            document.body.appendChild(messageDiv);
        }

        messageDiv.textContent = text;
        messageDiv.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 4000);
    }

    // Método auxiliar para obtener ruta completa
    getFullPath(path) {
        return `${this.basePath}${path}`;
    }
}

// Inicializar sistema de autenticación
const authSystem = new AuthSystem();

// Helper functions globales para debugging
window.cyclopsAuth = {
    checkStatus: () => {
        console.log('🔐 Estado de autenticación:');
        console.log('• cyclobot_admin:', localStorage.getItem('cyclobot_admin'));
        console.log('• cyclobot_user:', localStorage.getItem('cyclobot_user'));
        console.log('• Base Path:', authSystem.basePath);
    },
    
    forceLogin: () => {
        localStorage.setItem('cyclobot_admin', 'true');
        localStorage.setItem('cyclobot_user', 'admin');
        console.log('✅ Login forzado. Usa: window.location.href = "/CycloBot/admin/dashboard.html"');
    },
    
    navigateTo: (page) => {
        const pages = {
            index: '/CycloBot/index.html',
            login: '/CycloBot/admin/login.html',
            dashboard: '/CycloBot/admin/dashboard.html'
        };
        
        if (pages[page]) {
            window.location.href = pages[page];
        } else {
            console.log('❌ Página no válida. Opciones: index, login, dashboard');
        }
    }
};

console.log('🚀 AuthSystem inicializado con rutas corregidas para GitHub Pages');
console.log('📁 Ruta base:', '/CycloBot');
console.log('💡 Usa cyclopsAuth.checkStatus() para ver estado de autenticación');
