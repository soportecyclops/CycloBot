// Sistema de Administración - CycloBot
class AdminSystem {
    constructor() {
        this.currentPanel = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
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
        document.getElementById('logoutBtn').addEventListener('click', () => {
            authSystem.logout();
        });

        // Selector de tabla
        document.getElementById('tableSelector').addEventListener('change', (e) => {
            this.currentTable = e.target.value;
        });
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
        document.getElementById(panelName + 'Panel').classList.add('active');
        
        // Activar botón correspondiente
        document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');

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
        const table = document.getElementById('tableSelector').value;

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
                                <button class="btn-primary small" onclick="editItem(${item.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-danger small" onclick="deleteItem(${item.id})">
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
            alert('🔍 Verificando conexión con Supabase...\n\nNota: Supabase está en mantenimiento hasta el 23/11/2025');
            // Aquí irá la verificación real cuando Supabase esté disponible
        } catch (error) {
            alert('❌ Error verificando base de datos: ' + error.message);
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
            
        } catch (error) {
            alert('❌ Error exportando datos: ' + error.message);
        }
    }

    loadStats() {
        // Simular carga de estadísticas
        const statsPanel = document.getElementById('statsPanel');
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

// Funciones globales para los botones
function showPanel(panelName) {
    window.adminSystem.showPanel(panelName);
}

function checkDatabase() {
    window.adminSystem.checkDatabase();
}

function loadTableData() {
    window.adminSystem.loadTableData();
}

function exportData() {
    window.adminSystem.exportData();
}

function editItem(id) {
    alert(`Editando item #${id}\n\nEsta funcionalidad estará disponible cuando Supabase se recupere.`);
}

function deleteItem(id) {
    if (confirm(`¿Estás seguro de que quieres eliminar el item #${id}?`)) {
        alert(`Item #${id} eliminado (simulación)\n\nEn producción esto eliminaría el registro de la base de datos.`);
        loadTableData(); // Recargar tabla
    }
}

// Inicializar sistema de administración cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});