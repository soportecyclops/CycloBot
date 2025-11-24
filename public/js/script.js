// script.js - Versión CORREGIDA - Solo interfaz de usuario
class CycloBot {
    constructor() {
        this.currentTheme = 'cyber-blue';
        this.init();
    }

    init() {
        this.loadTheme();
        this.initEventListeners();
        console.log('🎯 CycloBot UI inicializado');
    }

    // Sistema de temas
    loadTheme() {
        const savedTheme = localStorage.getItem('cyclobot-theme') || 'cyber-blue';
        this.setTheme(savedTheme);
        
        // Actualizar selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = savedTheme;
        }
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('cyclobot-theme', themeName);
    }

    // Manejadores de eventos de UI
    initEventListeners() {
        console.log('🔧 Configurando event listeners de UI...');
        
        // Selector de temas
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

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

        // Modal de login (delegado a auth.js)
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideLoginModal());
        });

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('loginModal')) {
                this.hideLoginModal();
            }
        });
    }

    // Manejo de categorías (placeholder para futura implementación)
    handleCategorySelection(category) {
        console.log(`🎯 Categoría seleccionada: ${category}`);
        
        // Mostrar mensaje temporal
        this.showTempMessage(`🔧 Iniciando diagnóstico de ${category}...`, 'info');
        
        // Aquí irá la lógica cuando Supabase esté disponible
        setTimeout(() => {
            this.showTempMessage('⏳ Sistema de diagnóstico en desarrollo...', 'warning');
        }, 1500);
    }

    handleQuickProblem(problem) {
        console.log(`⚡ Problema rápido: ${problem}`);
        
        const problemNames = {
            'pc-no-enciende': 'PC no enciende',
            'internet-lento': 'Internet lento', 
            'pantalla-azul': 'Pantalla azul',
            'virus': 'Problemas con virus'
        };
        
        const problemName = problemNames[problem] || problem;
        this.showTempMessage(`🔍 Analizando: ${problemName}...`, 'info');
        
        setTimeout(() => {
            this.showTempMessage('🔄 Conectando con base de datos...', 'warning');
        }, 2000);
    }

    // Utilidades de UI
    showTempMessage(text, type = 'info') {
        // Crear elemento de mensaje temporal
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            ${text}
        `;
        
        // Estilos del mensaje
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            backgroundColor: this.getMessageColor(type)
        });
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    getMessageIcon(type) {
        const icons = {
            'info': 'info-circle',
            'warning': 'exclamation-triangle', 
            'success': 'check-circle',
            'error': 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    getMessageColor(type) {
        const colors = {
            'info': '#3b82f6',
            'warning': '#f59e0b',
            'success': '#10b981', 
            'error': '#ef4444'
        };
        return colors[type] || '#3b82f6';
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Método para mostrar modal de login (llamado desde auth.js)
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
}

// Inicializar solo UI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.cycloBotUI = new CycloBot();
    console.log('✅ Interfaz de usuario CycloBot cargada');
});

// Exportar para uso global
window.CycloBotUI = CycloBot;
