// CYCLOPSBOT - Script de Integración
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Inicializando CyclopsBot Integration...');
    
    // Inicializar efectos visuales
    inicializarEfectosVisuales();
    
    // Configurar tema por defecto
    aplicarTema('cyber-blue');
    
    // Verificar que todos los elementos estén presentes
    verificarElementosDOM();
});

function inicializarEfectosVisuales() {
    // Crear partículas dinámicas
    crearParticulasDinamicas();
    
    // Efectos de hover para botones
    configurarEfectosHover();
    
    // Animaciones de estado del sistema
    configurarAnimacionesEstado();
}

function crearParticulasDinamicas() {
    const container = document.querySelector('.particles-background');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 8) + 's';
        container.appendChild(particle);
    }
}

function configurarEfectosHover() {
    // Efectos para botones cyber
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('cyber-btn')) {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
            e.target.style.transition = 'all 0.3s ease';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('cyber-btn')) {
            e.target.style.transform = 'translateY(0) scale(1)';
        }
    });
}

function configurarAnimacionesEstado() {
    // Animación para indicadores de estado
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(item => {
        item.addEventListener('animationend', function() {
            this.style.animation = 'none';
        });
    });
}

function aplicarTema(tema) {
    const root = document.documentElement;
    
    const temas = {
        'cyber-blue': {
            '--primary': '#00f3ff',
            '--primary-glow': '#00f3ffaa',
            '--secondary': '#ff00ff',
            '--accent': '#00ff88'
        },
        'cyber-green': {
            '--primary': '#00ff88',
            '--primary-glow': '#00ff88aa',
            '--secondary': '#ffaa00',
            '--accent': '#00f3ff'
        },
        'cyber-purple': {
            '--primary': '#aa00ff',
            '--primary-glow': '#aa00ffaa',
            '--secondary': '#00f3ff',
            '--accent': '#ff00aa'
        },
        'cyber-red': {
            '--primary': '#ff0066',
            '--primary-glow': '#ff0066aa',
            '--secondary': '#00f3ff',
            '--accent': '#ffaa00'
        }
    };
    
    const colores = temas[tema] || temas['cyber-blue'];
    
    Object.entries(colores).forEach(([prop, valor]) => {
        root.style.setProperty(prop, valor);
    });
    
    // Guardar tema preferido
    localStorage.setItem('cyberbot-theme', tema);
}

function verificarElementosDOM() {
    const elementosRequeridos = [
        'chatMessages',
        'botonesArea',
        'problemsCount',
        'diagnosticsCount'
    ];
    
    elementosRequeridos.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.warn(`⚠️ Elemento requerido no encontrado: #${id}`);
        } else {
            console.log(`✅ Elemento encontrado: #${id}`);
        }
    });
}

// Utilidades globales
window.CyberBotUtils = {
    aplicarTema,
    crearParticulasDinamicas,
    verificarElementosDOM
};

console.log('✅ CyclopsBot Integration cargado correctamente');
