// Sistema de Administración CycloBot - CORREGIDO
class AdminSystem {
    constructor() {
        this.currentPanel = 'dashboard';
        this.basePath = window.location.pathname.includes('/CycloBot') ? '/CycloBot' : '';
        this.init();
    }

    init() {
        this.checkAccess();
        this.setupEventListeners();
        this.loadDashboardData();
        console.log('🛠️ AdminSystem inicializado');
    }

    checkAccess() {
        if (!this.isAdminAuthenticated()) {
            window.location.href = `${this.basePath}/admin/login.html`;
            return;
        }
    }

    isAdminAuthenticated() {
        return localStorage.getItem('cyclobot_admin') === 'true';
    }

    setupEventListeners() {
        // Navegación entre paneles
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.getAttribute('data-panel');
                this.showPanel(panel);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Selector de tabla
        const tableSelector = document.getElementById('tableSelector');
        if (tableSelector) {
            tableSelector.addEventListener('change', (e) => {
                this.currentTable = e.target.value;
                this.loadTableData();
            });
        }

        // Botones de acción
        const checkDbBtn = document.getElementById('checkDbBtn');
        if (checkDbBtn) {
            checkDbBtn.addEventListener('click', () => this.checkDatabase());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    showPanel(panelName) {
        // Ocultar todos los paneles
        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Remover activo de todos los botones
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar panel seleccionado
        const targetPanel = document.getElementById(panelName + 'Panel');
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // Activar botón correspondiente
        const targetBtn = document.querySelector(`[data-panel="${panelName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        this.currentPanel = panelName;

        // Cargar datos específicos del panel
        if (panelName === 'database') {
            this.loadTableData();
        } else if (panelName === 'stats') {
            this.loadStats();
        }
    }

    async loadDashboardData() {
        try {
            // Simular carga de datos del dashboard
            document.getElementById('totalProblems').textContent = '700+';
            document.getElementById('effectiveness').textContent = '85%';
            document.getElementById('dbStatus').textContent = 'Conectada';
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    async loadTableData() {
        const tableBody = document.getElementById('tableBody');
        const tableSelector = document.getElementById('tableSelector');
        
        if (!tableBody || !tableSelector) return;

        const table = tableSelector.value;

        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Cargando datos...</td></tr>';

        try {
            // Simular datos de ejemplo
            setTimeout(() => {
                const sampleData = {
                    problems: [
                        { id: 1, name: 'PC no enciende', category: 'Hardware', status: 'Activo' },
                        { id: 2, name: 'Internet lento', category: 'Redes', status: 'Activo' },
                        { id: 3, name: 'Error Windows', category: 'Software', status: 'Activo' }
                    ],
                    categories: [
                        { id: 1, name: 'Hardware', category: 'Sistema', status: 'Activo' },
                        { id: 2, name: 'Software', category: 'Sistema', status: 'Activo' },
                        { id: 3, name: 'Redes', category: 'Conectividad', status: 'Activo' }
                    ],
                    users: [
                        { id: 1, name: 'Administrador', category: 'Admin', status: 'Activo' },
                        { id: 2, name: 'Usuario Demo', category: 'User', status: 'Activo' }
                    ]
                };

                const data = sampleData[table] || [];
                
                tableBody.innerHTML = '';
                data.forEach(item => {
                    const row = `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td><span class="status-ok">${item.status}</span></td>
                            <td>
                                <button class="btn-primary small" onclick="adminSystem.editItem(${item.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-danger small" onclick="adminSystem.deleteItem(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });

            }, 1000);

        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error cargando datos</td></tr>';
        }
    }

    async checkDatabase() {
        try {
            this.showMessage('🔍 Verificando conexión con Supabase...', 'info');
            
            setTimeout(() => {
                this.showMessage('⚠️ Supabase en mantenimiento hasta el 23/11/2025', 'warning');
            }, 2000);
            
        } catch (error) {
            this.showMessage('❌ Error verificando base de datos', 'error');
        }
    }

    async exportData() {
        try {
            // Simular exportación
            const data = {
                timestamp: new Date().toISOString(),
                problems: 700,
                categories: 6,
                message: "Datos de CycloBot - Exportación simulada"
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cyclobot-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showMessage('✅ Datos exportados correctamente', 'success');
            
        } catch (error) {
            this.showMessage('❌ Error exportando datos', 'error');
        }
    }

    loadStats() {
        const statsPanel = document.getElementById('statsPanel');
        if (statsPanel) {
            statsPanel.querySelector('.stats-content').innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">1,250</div>
                        <div class="stat-label">Consultas Totales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">85%</div>
                        <div class="stat-label">Tasa de Éxito</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">6</div>
                        <div class="stat-label">Categorías Activas</div>
                    </div>
                </div>
            `;
        }
    }

    editItem(id) {
        this.showMessage(`✏️ Editando item #${id}`, 'info');
        // Aquí irá la lógica de edición cuando Supabase esté disponible
    }

    deleteItem(id) {
        if (confirm(`¿Estás seguro de que quieres eliminar el item #${id}?`)) {
            this.showMessage(`🗑️ Item #${id} eliminado (simulación)`, 'success');
            this.loadTableData(); // Recargar tabla
        }
    }

    logout() {
        // Limpiar auth
        localStorage.removeItem('cyclobot_admin');
        localStorage.removeItem('cyclobot_user');
        
        this.showMessage('👋 Sesión administrativa cerrada', 'success');
        
        setTimeout(() => {
            window.location.href = `${this.basePath}/index.html`;
        }, 1000);
    }

    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
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
            backgroundColor: this.getMessageColor(type)
        });
        
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
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

// Inicializar sistema de administración
document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});

// Funciones globales para compatibilidad
window.showPanel = (panelName) => {
    if (window.adminSystem) {
        window.adminSystem.showPanel(panelName);
    }
};

window.checkDatabase = () => {
    if (window.adminSystem) {
        window.adminSystem.checkDatabase();
    }
};

window.exportData = () => {
    if (window.adminSystem) {
        window.adminSystem.exportData();
    }
};
