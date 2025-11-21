// script.js - Versión optimizada para la nueva interfaz

class CycloBot {
    constructor() {
        this.currentTheme = 'cyber-blue';
        this.currentUser = { role: 'guest', username: 'Invitado' };
        this.init();
    }

    init() {
        this.loadTheme();
        this.initEventListeners();
        this.updateUserInterface();
    }

    // Sistema de autenticación simple (luego se integra con Supabase)
    async authenticate(username, password) {
        const users = {
            'admin': { password: 'S0p0rt35', role: 'admin', name: 'Administrador' },
            'usuario': { password: 'user123', role: 'user', name: 'Usuario' }
        };

        if (users[username] && users[username].password === password) {
            this.currentUser = {
                username: users[username].name,
                role: users[username].role,
                loginTime: new Date()
            };
            localStorage.setItem('cyclobot_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = { role: 'guest', username: 'Invitado' };
        localStorage.removeItem('cyclobot_user');
        this.updateUserInterface();
    }

    updateUserInterface() {
        const userStatus = document.getElementById('userStatus');
        const loginBtn = document.getElementById('loginBtn');
        
        if (userStatus && loginBtn) {
            userStatus.textContent = `👤 ${this.currentUser.username}`;
            
            if (this.currentUser.role === 'admin') {
                loginBtn.innerHTML = '<i class="fas fa-cog"></i> Panel Admin';
                loginBtn.onclick = () => window.location.href = 'admin.html';
            } else if (this.currentUser.role === 'user') {
                loginBtn.innerHTML = '<i class="fas fa-user"></i> Mi Cuenta';
                loginBtn.onclick = () => this.showUserPanel();
            } else {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
                loginBtn.onclick = () => this.showLoginModal();
            }
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (await this.authenticate(username, password)) {
            this.hideLoginModal();
            this.updateUserInterface();
            
            if (this.currentUser.role === 'admin') {
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
        } else {
            alert('Credenciales incorrectas');
        }
    }

    // El resto de métodos para la interfaz principal...
    initEventListeners() {
        // Categorías principales
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                this.handleCategorySelection(category);
            });
        });

        // Botones rápidos
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const problem = btn.getAttribute('data-problem');
                this.handleQuickProblem(problem);
            });
        });

        // Modal de login
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideLoginModal());
        });

        document.getElementById('submitLogin')?.addEventListener('click', () => this.handleLogin());

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('loginModal')) {
                this.hideLoginModal();
            }
        });
    }

    handleCategorySelection(category) {
        // Aquí irá la lógica cuando Supabase esté disponible
        alert(`Categoría seleccionada: ${category}\n\nEsta funcionalidad estará disponible cuando Supabase se recupere.`);
    }

    handleQuickProblem(problem) {
        alert(`Problema rápido: ${problem}\n\nEsta funcionalidad estará disponible cuando Supabase se recupere.`);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('cyclobot-theme') || 'cyber-blue';
        this.setTheme(savedTheme);
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('cyclobot-theme', themeName);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.cycloBot = new CycloBot();
});
