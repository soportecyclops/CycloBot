    // Sistema de autenticación MEJORADO para CycloBot
    class AuthSystem {
        constructor() {
            this.adminCredentials = {
                username: 'admin',
                password: 'S0p0rt35' // CAMBIAR EN PRODUCCIÓN
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
                // CORRECCIÓN: Usar ruta relativa para GitHub Pages
                const currentPath = window.location.pathname;
                if (currentPath.includes('/admin/')) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = './admin/dashboard.html';
                }
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
    }
    
    // Inicializar sistema de autenticación
    const authSystem = new AuthSystem();
    

