// script.js - CYCLOPSBOT MEJORADO - FLUJO AUTOMÁTICO
class CyclopsBotAvanzado {
    constructor() {
        this.supabaseUrl = 'https://nmpvbcfbrhtcfyovjzul.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4';
        
        this.supabase = null;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        
        this.initializeBot();
    }

    async initializeSupabase() {
        try {
            if (typeof supabase === 'undefined') {
                await this.loadSupabaseSDK();
            }
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            return true;
        } catch (error) {
            console.error('Error Supabase:', error);
            return false;
        }
    }

    loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof supabase !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async initializeBot() {
        const supabaseOk = await this.initializeSupabase();
        
        this.limpiarChat();
        this.addMessage('bot', '👁️ **CYCLOPSBOT ACTIVADO**');
        this.addMessage('bot', '🔍 **Selecciona una categoría:**');
        
        // Iniciar inmediatamente con categorías
        await this.mostrarCategorias();
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        document.querySelectorAll('.cyber-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.cyber-btn').dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async mostrarCategorias() {
        try {
            const { data: categorias, error } = await this.supabase
                .from('problemas')
                .select('categoria')
                .eq('activo', true);

            if (error) throw error;

            const categoriasUnicas = [...new Set(categorias.map(item => item.categoria))];
            this.mostrarBotonesCategoria(categoriasUnicas);

        } catch (error) {
            console.error('Error cargando categorías:', error);
            // Categorías predeterminadas
            const categoriasRespaldo = ['internet', 'hardware', 'software', 'movil'];
            this.mostrarBotonesCategoria(categoriasRespaldo);
        }
    }

    mostrarBotonesCategoria(categorias) {
        const buttonContainer = this.crearContenedorBotones();
        
        categorias.forEach(categoria => {
            const boton = this.crearBoton(
                `${this.getCategoryIcon(categoria)} ${this.getCategoryDisplayName(categoria)}`,
                () => this.seleccionarCategoria(categoria),
                'primary'
            );
            buttonContainer.appendChild(boton);
        });
    }

    getCategoryIcon(categoria) {
        const icons = {
            'internet': '🌐',
            'hardware': '💻', 
            'software': '🖥️',
            'movil': '📱'
        };
        return icons[categoria] || '🔧';
    }

    getCategoryDisplayName(categoria) {
        const displayNames = {
            'internet': 'Internet & Redes',
            'hardware': 'Hardware & PC',
            'software': 'Software & Sistema',
            'movil': 'Dispositivos Móviles'
        };
        return displayNames[categoria] || categoria;
    }

    async seleccionarCategoria(categoria) {
        this.currentCategory = categoria;
        this.diagnosisActive = true;
        
        this.addMessage('user', `📂 ${this.getCategoryDisplayName(categoria)}`);
        this.addMessage('bot', `✅ **${this.getCategoryDisplayName(categoria)}** seleccionado.`);
        
        await this.mostrarProblemasCategoria(categoria);
    }

    async mostrarProblemasCategoria(categoria) {
        try {
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, descripcion, identificador, preguntas, soluciones')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('prioridad', { ascending: false });

            if (error) throw error;

            if (!problemas || problemas.length === 0) {
                this.addMessage('bot', '❌ No hay problemas en esta categoría.');
                this.mostrarCategorias();
                return;
            }

            this.addMessage('bot', '🔍 **Selecciona el problema:**');

            const buttonContainer = this.crearContenedorBotones();
            
            problemas.forEach(problema => {
                const boton = this.crearBoton(
                    `🔧 ${problema.descripcion}`,
                    () => this.seleccionarProblema(problema),
                    'primary'
                );
                buttonContainer.appendChild(boton);
            });

            const volverBoton = this.crearBoton(
                '↩️ Volver a categorías',
                () => this.volverACategorias(),
                'secondary'
            );
            buttonContainer.appendChild(volverBoton);

        } catch (error) {
            console.error('Error cargando problemas:', error);
            this.addMessage('bot', '❌ Error al cargar problemas.');
            this.mostrarCategorias();
        }
    }

    async seleccionarProblema(problema) {
        this.currentProblem = problema;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('user', `❓ ${problema.descripcion}`);
        this.addMessage('bot', '🎯 **Diagnóstico iniciado...**');

        if (problema.preguntas && problema.preguntas.length > 0) {
            await this.hacerSiguientePregunta();
        } else {
            await this.mostrarSoluciones();
        }
    }

    async hacerSiguientePregunta() {
        if (!this.currentProblem.preguntas || this.currentQuestionIndex >= this.currentProblem.preguntas.length) {
            await this.mostrarSoluciones();
            return;
        }

        const pregunta = this.currentProblem.preguntas[this.currentQuestionIndex];
        this.addMessage('bot', `❓ **Pregunta ${this.currentQuestionIndex + 1}:** ${pregunta}`);
        
        this.mostrarBotonesRespuesta();
    }

    mostrarBotonesRespuesta() {
        const buttonContainer = this.crearContenedorBotones();
        
        const respuestas = [
            { texto: '✅ Sí', valor: 'sí' },
            { texto: '❌ No', valor: 'no' },
            { texto: '🤔 No sé', valor: 'no_se' }
        ];

        respuestas.forEach(respuesta => {
            const boton = this.crearBoton(
                respuesta.texto,
                () => this.procesarRespuesta(respuesta.valor),
                respuesta.valor === 'sí' ? 'success' : 'danger'
            );
            buttonContainer.appendChild(boton);
        });
    }

    async procesarRespuesta(respuesta) {
        this.userAnswers.push(respuesta);
        this.addMessage('user', `💬 ${respuesta === 'sí' ? 'Sí' : respuesta === 'no' ? 'No' : 'No sé'}`);
        
        this.currentQuestionIndex++;
        await this.hacerSiguientePregunta();
    }

    async mostrarSoluciones() {
        this.addMessage('bot', '🎉 **¡Diagnóstico completado!**');
        this.addMessage('bot', '🔧 **Soluciones recomendadas:**');

        if (this.currentProblem.soluciones && this.currentProblem.soluciones.length > 0) {
            this.currentProblem.soluciones.forEach((solucion, index) => {
                this.addMessage('bot', `${index + 1}. ${solucion}`);
            });
        } else {
            this.addMessage('bot', '⚠️ No hay soluciones específicas disponibles.');
        }

        await this.registrarConsulta();
        await this.actualizarEstadisticasProblema(this.currentProblem.id);
        this.mostrarBotonesFinales();
        this.diagnosisActive = false;
        this.updateStats();
    }

    mostrarBotonesFinales() {
        const buttonContainer = this.crearContenedorBotones();
        
        const botones = [
            { texto: '🔄 Nuevo diagnóstico', action: () => this.nuevoDiagnostico(), type: 'primary' },
            { texto: '⭐ Útil', action: () => this.calificarSolucion('util'), type: 'success' }
        ];

        botones.forEach(boton => {
            const elemento = this.crearBoton(boton.texto, boton.action, boton.type);
            buttonContainer.appendChild(elemento);
        });
    }

    async calificarSolucion(calificacion) {
        this.addMessage('user', `⭐ ${calificacion === 'util' ? 'Útil' : 'No útil'}`);
        this.addMessage('bot', '✅ ¡Gracias por tu feedback!');
    }

    async nuevoDiagnostico() {
        this.resetEstado();
        this.addMessage('bot', '🔄 **Nuevo diagnóstico...**');
        await this.mostrarCategorias();
    }

    volverACategorias() {
        this.resetEstado();
        this.addMessage('bot', '↩️ **Volviendo a categorías...**');
        this.mostrarCategorias();
    }

    resetEstado() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
    }

    // MÉTODOS UTILITARIOS
    crearContenedorBotones() {
        const anterior = document.querySelector('.botones-container');
        if (anterior) anterior.remove();

        const container = document.createElement('div');
        container.className = 'botones-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '4px';
        container.style.marginTop = '6px';
        container.style.maxHeight = '120px';
        container.style.overflowY = 'auto';
        
        document.getElementById('chatMessages').appendChild(container);
        return container;
    }

    crearBoton(texto, onClick, tipo = 'primary') {
        const boton = document.createElement('button');
        boton.className = `cyber-btn ${tipo}`;
        boton.innerHTML = texto;
        boton.style.width = '100%';
        boton.style.padding = '8px 10px';
        boton.style.fontSize = '0.8rem';
        boton.style.textAlign = 'left';
        boton.addEventListener('click', onClick);
        return boton;
    }

    limpiarChat() {
        document.getElementById('chatMessages').innerHTML = '';
    }

    async registrarConsulta() {
        try {
            await this.supabase
                .from('consultas_usuarios')
                .insert({
                    session_id: this.sessionId,
                    pregunta_usuario: `Problema: ${this.currentCategory} - ${this.currentProblem.identificador}`,
                    respuesta_bot: this.currentProblem.soluciones ? this.currentProblem.soluciones.join(' | ') : 'Sin soluciones',
                    categoria_detectada: this.currentCategory,
                    problema_id: this.currentProblem.id,
                    preguntas_realizadas: this.currentQuestionIndex
                });
        } catch (error) {
            console.error('Error registrando consulta:', error);
        }
    }

    async actualizarEstadisticasProblema(problemaId) {
        try {
            await this.supabase
                .rpc('incrementar_consultas', { problema_id: problemaId });
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    async updateStats() {
        try {
            const problemsCount = document.getElementById('problemsCount');
            const diagnosticsCount = document.getElementById('diagnosticsCount');

            const { data: problemas } = await this.supabase
                .from('problemas')
                .select('id', { count: 'exact' })
                .eq('activo', true);

            const { data: consultas } = await this.supabase
                .from('consultas_usuarios')
                .select('id', { count: 'exact' })
                .eq('session_id', this.sessionId);

            if (problemas) problemsCount.textContent = problemas.length;
            if (consultas) diagnosticsCount.textContent = consultas.length;

        } catch (error) {
            console.error('Error actualizando stats:', error);
        }
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.style.marginBottom = '6px';
        messageDiv.style.padding = '6px 10px';
        messageDiv.style.background = sender === 'bot' ? 'rgba(0, 243, 255, 0.05)' : 'rgba(255, 0, 255, 0.05)';
        messageDiv.style.borderRadius = '6px';
        messageDiv.style.border = `1px solid ${sender === 'bot' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 0, 255, 0.2)'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.fontSize = '0.85rem';
        contentDiv.style.lineHeight = '1.3';
        
        content.split('\n').forEach(paragraph => {
            if (paragraph.trim()) {
                const p = document.createElement('p');
                p.innerHTML = paragraph;
                p.style.margin = '2px 0';
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start': this.nuevoDiagnostico(); break;
            case 'reset': this.resetBot(); break;
            case 'help': this.mostrarAyuda(); break;
        }
    }

    mostrarAyuda() {
        this.addMessage('bot', 'ℹ️ **AYUDA RÁPIDA**');
        this.addMessage('bot', '1. Selecciona categoría');
        this.addMessage('bot', '2. Elige problema específico');
        this.addMessage('bot', '3. Responde preguntas (Sí/No/No sé)');
        this.addMessage('bot', '4. Sigue las soluciones');
    }

    resetBot() {
        this.limpiarChat();
        this.resetEstado();
        this.initializeBot();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    new CyclopsBotAvanzado();
});
