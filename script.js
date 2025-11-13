// script.js - CYCLOPSBOT CON SUPABASE
class CyclopsBotAvanzado {
    constructor() {
        this.supabaseUrl = 'https://mapvbc.fbr.tkcf.psyj.xtl_supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4';
        
        this.supabase = null;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        
        this.initializeBot();
        this.setupEventListeners();
    }

    async initializeSupabase() {
        // Cargar Supabase desde CDN dinámicamente
        if (typeof supabase === 'undefined') {
            await this.loadSupabaseSDK();
        }
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        console.log('Supabase inicializado');
    }

    loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
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
        await this.initializeSupabase();
        this.addMessage('bot', '¡Hola! Soy CyclopsBot, tu asistente técnico inteligente.');
        this.addMessage('bot', 'Ahora con base de datos en la nube y aprendizaje automático.');
        this.addMessage('bot', '¿Estás listo para diagnosticar tu problema técnico?');
        this.updateStats();
    }

    setupEventListeners() {
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const quickButtons = document.querySelectorAll('.quick-btn');

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });

        sendButton.addEventListener('click', () => this.handleUserInput());

        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async handleUserInput() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '') return;

        this.addMessage('user', message);
        userInput.value = '';

        if (!this.diagnosisActive) {
            this.startDiagnosis(message);
        } else {
            this.processAnswer(message);
        }
    }

    async startDiagnosis(userMessage) {
        this.diagnosisActive = true;
        
        // Buscar en la base de datos
        const categoria = await this.predecirCategoria(userMessage);
        
        if (categoria) {
            this.currentCategory = categoria;
            this.addMessage('bot', `Veo que tienes un problema de ${this.getCategoryDisplayName(categoria)}.`);
            await this.presentarProblemasCategoria(categoria);
        } else {
            this.addMessage('bot', 'No logro identificar la categoría. ¿Podrías ser más específico? Por ejemplo: "problema de WiFi", "falla en hardware", etc.');
        }
    }

    async predecirCategoria(texto) {
        try {
            // Buscar coincidencias en la base de datos
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('categoria, keywords')
                .eq('activo', true);

            if (error) throw error;

            const textoLower = texto.toLowerCase();
            let mejorCategoria = null;
            let mejorPuntaje = 0;

            problemas.forEach(problema => {
                let puntaje = 0;
                
                // Buscar en keywords
                if (problema.keywords) {
                    problema.keywords.forEach(keyword => {
                        if (textoLower.includes(keyword.toLowerCase())) {
                            puntaje += 2;
                        }
                    });
                }
                
                // Buscar en nombre de categoría
                if (textoLower.includes(problema.categoria.toLowerCase())) {
                    puntaje += 3;
                }

                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    mejorCategoria = problema.categoria;
                }
            });

            return mejorPuntaje > 2 ? mejorCategoria : null;

        } catch (error) {
            console.error('Error prediciendo categoría:', error);
            return null;
        }
    }

    async presentarProblemasCategoria(categoria) {
        try {
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, identificador, descripcion')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('prioridad', { ascending: false });

            if (error) throw error;

            if (problemas.length === 0) {
                this.addMessage('bot', 'No encontré problemas en esta categoría.');
                return;
            }

            let mensaje = `Problemas comunes de ${this.getCategoryDisplayName(categoria)}:\n\n`;
            problemas.forEach((problema, index) => {
                mensaje += `${index + 1}. ${problema.descripcion}\n`;
            });
            
            mensaje += '\n¿Cuál de estos se parece más a tu problema? (Responde con el número)';
            this.addMessage('bot', mensaje);

        } catch (error) {
            console.error('Error cargando problemas:', error);
            this.addMessage('bot', 'Error al cargar los problemas. Intenta nuevamente.');
        }
    }

    async processAnswer(answer) {
        if (!this.currentProblem) {
            await this.seleccionarProblema(answer);
        } else {
            await this.procesarRespuestaProblema(answer);
        }
    }

    async seleccionarProblema(respuestaUsuario) {
        try {
            const numero = parseInt(respuestaUsuario);
            
            if (isNaN(numero)) {
                // Búsqueda por texto
                const { data: problemas, error } = await this.supabase
                    .from('problemas')
                    .select('id, identificador, descripcion, preguntas')
                    .eq('categoria', this.currentCategory)
                    .eq('activo', true)
                    .ilike('descripcion', `%${respuestaUsuario}%`);

                if (error) throw error;

                if (problemas.length === 1) {
                    this.currentProblem = problemas[0];
                    this.currentQuestionIndex = 0;
                    await this.hacerSiguientePregunta();
                } else {
                    this.addMessage('bot', 'No encontré un problema específico. ¿Podrías seleccionar por número o describirlo mejor?');
                    await this.presentarProblemasCategoria(this.currentCategory);
                }
            } else {
                // Selección por número
                const { data: problemas, error } = await this.supabase
                    .from('problemas')
                    .select('id, identificador, descripcion, preguntas')
                    .eq('categoria', this.currentCategory)
                    .eq('activo', true)
                    .order('prioridad', { ascending: false });

                if (error) throw error;

                if (numero > 0 && numero <= problemas.length) {
                    this.currentProblem = problemas[numero - 1];
                    this.currentQuestionIndex = 0;
                    await this.hacerSiguientePregunta();
                } else {
                    this.addMessage('bot', 'Número inválido. Por favor selecciona un número de la lista.');
                    await this.presentarProblemasCategoria(this.currentCategory);
                }
            }

        } catch (error) {
            console.error('Error seleccionando problema:', error);
            this.addMessage('bot', 'Error al procesar tu selección. Intenta nuevamente.');
        }
    }

    async hacerSiguientePregunta() {
        if (!this.currentProblem.preguntas || this.currentProblem.preguntas.length === 0) {
            await this.mostrarSoluciones();
            return;
        }

        if (this.currentQuestionIndex < this.currentProblem.preguntas.length) {
            const pregunta = this.currentProblem.preguntas[this.currentQuestionIndex];
            this.addMessage('bot', pregunta);
        } else {
            await this.mostrarSoluciones();
        }
    }

    async procesarRespuestaProblema(respuesta) {
        this.currentQuestionIndex++;
        await this.hacerSiguientePregunta();
    }

    async mostrarSoluciones() {
        try {
            // Obtener el problema completo con soluciones
            const { data: problema, error } = await this.supabase
                .from('problemas')
                .select('soluciones, identificador, descripcion')
                .eq('id', this.currentProblem.id)
                .single();

            if (error) throw error;

            this.addMessage('bot', '✅ Basándome en tus respuestas, aquí están las soluciones recomendadas:');
            
            problema.soluciones.forEach((solucion, index) => {
                this.addMessage('bot', `${index + 1}. ${solucion}`);
            });

            // Registrar la consulta
            await this.registrarConsulta(
                `Problema: ${this.currentCategory} - ${problema.identificador}`,
                problema.soluciones.join(' | ')
            );

            // Actualizar estadísticas del problema
            await this.actualizarEstadisticasProblema(this.currentProblem.id);

            this.addMessage('bot', '¿Te fue útil esta solución? Puedes calificarla o reiniciar el diagnóstico.');
            
            this.diagnosisActive = false;
            this.updateStats();

        } catch (error) {
            console.error('Error mostrando soluciones:', error);
            this.addMessage('bot', 'Error al cargar las soluciones. Intenta nuevamente.');
        }
    }

    async registrarConsulta(consulta, respuesta) {
        try {
            const { error } = await this.supabase
                .from('consultas_usuarios')
                .insert({
                    session_id: this.sessionId,
                    pregunta_usuario: consulta,
                    respuesta_bot: respuesta,
                    categoria_detectada: this.currentCategory,
                    problema_id: this.currentProblem.id,
                    preguntas_realizadas: this.currentQuestionIndex
                });

            if (error) throw error;

        } catch (error) {
            console.error('Error registrando consulta:', error);
        }
    }

    async actualizarEstadisticasProblema(problemaId) {
        try {
            const { error } = await this.supabase
                .rpc('incrementar_consultas', { 
                    problema_id: problemaId 
                });

            if (error) throw error;

        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    async updateStats() {
        try {
            const problemsCount = document.getElementById('problemsCount');
            const diagnosticsCount = document.getElementById('diagnosticsCount');

            // Contar problemas activos
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id', { count: 'exact' })
                .eq('activo', true);

            if (!error && problemas) {
                problemsCount.textContent = problemas.length;
            }

            // Contar consultas en esta sesión
            const { data: consultas, error: errorConsultas } = await this.supabase
                .from('consultas_usuarios')
                .select('id', { count: 'exact' })
                .eq('session_id', this.sessionId);

            if (!errorConsultas && consultas) {
                diagnosticsCount.textContent = consultas.length;
            }

        } catch (error) {
            console.error('Error actualizando stats:', error);
        }
    }

    // Métodos auxiliares (sin cambios)
    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<div class="mini-eye"></div>' : '👤';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const paragraphs = content.split('\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const p = document.createElement('p');
                p.textContent = paragraph;
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start':
                this.addMessage('bot', 'Por favor, describe tu problema técnico:');
                this.diagnosisActive = true;
                break;
            case 'reset':
                this.resetBot();
                break;
        }
    }

    resetBot() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.initializeBot();
    }

    getCategoryDisplayName(category) {
        const displayNames = {
            'internet': 'Internet y Redes',
            'hardware': 'Hardware',
            'software': 'Software',
            'movil': 'Dispositivos Móviles'
        };
        return displayNames[category] || category;
    }
}

// Inicializar el bot
document.addEventListener('DOMContentLoaded', () => {
    new CyclopsBotAvanzado();
});
