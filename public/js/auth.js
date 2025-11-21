// Sistema de autenticación MEJORADO para CycloBot - LOGOUT FIXED
class AuthSystem {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: 'S0p0rt35'
        };
        this.basePath = '/CycloBot';
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.setupEventListeners();
        this.updateUserInterface();
        console.log('🔐 AuthSystem inicializado');
    }

    checkAdminAccess() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/admin/dashboard.html') && !this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/login.html`;
            return;
        }

        if (currentPath.includes('/admin/login.html') && this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/dashboard.html`;
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Login form en admin
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
            console.log('✅ Login form listener agregado');
        }

        // Botón login en index principal (MÚLTIPLES FORMAS)
        const mainLoginBtn = document.getElementById('loginBtn');
        if (mainLoginBtn) {
            mainLoginBtn.addEventListener('click', () => this.redirectToAdminLogin());
            console.log('✅ Botón login principal listener agregado');
        }

        // BOTÓN LOGOUT - BÚSQUEDA MÁS FLEXIBLE
        this.setupLogoutListeners();
    }

    setupLogoutListeners() {
        console.log('🔍 Buscando botones de logout...');
        
        // Diferentes posibles IDs y clases para logout
        const logoutSelectors = [
            '#logoutBtn',
            '.logout-btn',
            '[data-action="logout"]',
            'button[onclick*="logout"]',
            'button:contains("Cerrar sesión")',
            'button:contains("Salir")',
            'button:contains("Logout")'
        ];

        // Buscar por ID
        let logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) {
            // Buscar por atributos data
            logoutBtn = document.querySelector('[data-action="logout"]');
        }
        if (!logoutBtn) {
            // Buscar por texto (approximación)
            const buttons = document.querySelectorAll('button');
            logoutBtn = Array.from(buttons).find(btn => 
                btn.textContent.includes('Cerrar') || 
                btn.textContent.includes('Salir') ||
                btn.textContent.includes('Logout')
            );
        }

        if (logoutBtn) {
            // Remover listeners antiguos para evitar duplicados
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Botón logout clickeado');
                this.logout();
            });
            
            console.log('✅ Botón logout configurado:', newLogoutBtn);
        } else {
            console.log('⚠️ No se encontró botón logout, creando uno global...');
            this.createGlobalLogout();
        }
    }

    createGlobalLogout() {
        // Crear botón logout global si no existe
        if (!document.getElementById('globalLogoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'globalLogoutBtn';
            logoutBtn.innerHTML = '🚪 Cerrar Sesión';
            logoutBtn.style.position = 'fixed';
            logoutBtn.style.top = '10px';
            logoutBtn.style.right = '10px';
            logoutBtn.style.zIndex = '10000';
            logoutBtn.style.padding = '10px 15px';
            logoutBtn.style.background = '#ef4444';
            logoutBtn.style.color = 'white';
            logoutBtn.style.border = 'none';
            logoutBtn.style.borderRadius = '5px';
            logoutBtn.style.cursor = 'pointer';
            
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
            
            document.body.appendChild(logoutBtn);
            console.log('✅ Botón logout global creado');
        }
    }

    updateUserInterface() {
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            if (this.isAdminAuthenticated()) {
                userStatus.innerHTML = '👨‍💼 Administrador';
                userStatus.style.color = '#60a5fa';
                
                // Asegurar que el botón logout sea visible
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.style.display = 'block';
                }
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

        if (!username || !password) {
            this.showMessage('⚠️ Por favor completa todos los campos', 'error');
            return;
        }

        setTimeout(() => {
            if (username === this.adminCredentials.username && 
                password === this.adminCredentials.password) {
                
                localStorage.setItem('cyclobot_admin', 'true');
                localStorage.setItem('cyclobot_user', username);
                
                this.showMessage('✅ Acceso concedido. Redirigiendo...', 'success');
                
                setTimeout(() => {
                    window.location.href = `${this.basePath}/admin/dashboard.html`;
                }, 1500);
            } else {
                this.showMessage('❌ Credenciales incorrectas', 'error');
            }
        }, 1000);
    }

    redirectToAdminLogin() {
        window.location.href = `${this.basePath}/admin/login.html`;
    }

    logout() {
        console.log('🔓 Ejecutando logout...');
        
        // Limpiar TODOS los datos de autenticación
        localStorage.removeItem('cyclobot_admin');
        localStorage.removeItem('cyclobot_user');
        localStorage.removeItem('cyberUser');
        
        this.showMessage('👋 Sesión cerrada. Redirigiendo...', 'success');
        
        console.log('🔄 Redirigiendo a página principal...');
        
        setTimeout(() => {
            window.location.href = `${this.basePath}/index.html`;
        }, 1000);
    }

    isAdminAuthenticated() {
        return localStorage.getItem('cyclobot_admin') === 'true';
    }

    showMessage(text, type) {
        let messageDiv = document.getElementById('authMessage');
        
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'authMessage';
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

// FUNCIONES GLOBALES PARA DEBUGGING Y CONTROL MANUAL
window.cyclopsAuth = {
    // Ver estado actual
    checkStatus: () => {
        console.log('🔐 ESTADO DE AUTENTICACIÓN:');
        console.log('• cyclobot_admin:', localStorage.getItem('cyclobot_admin'));
        console.log('• cyclobot_user:', localStorage.getItem('cyclobot_user'));
        console.log('• cyberUser:', localStorage.getItem('cyberUser'));
        console.log('• Autenticado:', authSystem.isAdminAuthenticated());
    },
    
    // Forzar logout manualmente
    forceLogout: () => {
        console.log('🔄 Forzando logout...');
        localStorage.clear();
        window.location.href = '/CycloBot/index.html';
    },
    
    // Forzar login manualmente
    forceLogin: () => {
        localStorage.setItem('cyclobot_admin', 'true');
        localStorage.setItem('cyclobot_user', 'admin');
        console.log('✅ Login forzado. Recarga la página.');
    },
    
    // Navegación rápida
    goTo: (page) => {
        const routes = {
            home: '/CycloBot/index.html',
            login: '/CycloBot/admin/login.html',
            dashboard: '/CycloBot/admin/dashboard.html'
        };
        
        if (routes[page]) {
            window.location.href = routes[page];
        } else {
            console.log('❌ Ruta no válida. Usa: home, login, dashboard');
        }
    },
    
    // Probar logout manualmente
    testLogout: () => {
        authSystem.logout();
    }
};

console.log('🚀 AuthSystem cargado con soporte mejorado para logout');
console.log('💡 Usa cyclopsAuth.forceLogout() si el botón no funciona');
