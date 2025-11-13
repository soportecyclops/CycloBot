// script.js - CYCLOPSBOT CON SUPABASE - VERSIÓN CORREGIDA
class CyclopsBotAvanzado {
    constructor() {
        // CREDENCIALES CORRECTAS
        this.supabaseUrl = 'https://nmpvbcfbrhtcfyovjzul.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4';
        
        this.supabase = null;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        
        this.initializeBot();
    }

    async initializeBot() {
        try {
            // Inicializar Supabase
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Supabase inicializado correctamente');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Mensaje de bienvenida
            this.addMessage('bot', '¡Hola! Soy CyclopsBot, tu asistente técnico inteligente.');
            this.addMessage('bot', 'Sistema conectado a base de datos Supabase.');
            this.addMessage('bot', '¿Qué problema técnico tienes hoy?');
            
            // Actualizar estadísticas
            await this.updateStats();
            
        } catch (error) {
            console.error('❌ Error inicializando bot:', error);
            this.addMessage('bot', '⚠️ Error de conexión. Verificando configuración...');
        }
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    setupEventListeners() {
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const quickButtons = document.querySelectorAll('.cyber-btn');

        // Enter para enviar mensaje
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });

        // Click en botón enviar
        sendButton.addEventListener('click', () => this.handleUserInput());

        // Botones de acción rápida
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        console.log('✅ Event listeners configurados');
    }

    async handleUserInput() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '') return;

        this.addMessage('user', message);
        userInput.value = '';

        // Mostrar indicador de typing
        this.showTypingIndicator();

        if (!this.diagnosisActive) {
            await this.startDiagnosis(message);
        } else {
            await this.processAnswer(message);
        }

        // Ocultar indicador de typing
        this.hideTypingIndicator();
    }

    async startDiagnosis(userMessage) {
        this.diagnosisActive = true;
        
        try {
            // Buscar categoría basada en el mensaje del usuario
            const categoria = await this.predecirCategoria(userMessage);
            
            if (categoria) {
                this.currentCategory = categoria;
                this.addMessage('bot', `🔍 Detecté que tienes un problema de **${this.getCategoryDisplayName(categoria)}**.`);
                await this.presentarProblemasCategoria(categoria);
            } else {
                this.addMessage('bot', '🤔 No logro identificar la categoría específica. ¿Podrías ser más específico?');
                this.addMessage('bot', 'Por ejemplo: "problema de WiFi", "mi computadora no enciende", "el teléfono no tiene señal"...');
                this.diagnosisActive = false;
            }

        } catch (error) {
            console.error('Error en startDiagnosis:', error);
            this.addMessage('bot', '❌ Error al procesar tu solicitud. Intenta nuevamente.');
            this.diagnosisActive = false;
        }
    }

    async predecirCategoria(texto) {
        try {
            console.log('🔍 Buscando categoría para:', texto);
            
            // Buscar en todas las categorías y problemas
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('categoria, keywords, descripcion, identificador')
                .eq('activo', true);

            if (error) {
                console.error('Error en consulta:', error);
                throw error;
            }

            console.log('📊 Problemas encontrados en BD:', problemas);

            const textoLower = texto.toLowerCase();
            let mejorCategoria = null;
            let mejorPuntaje = 0;

            // Buscar coincidencias en keywords, descripción e identificador
            problemas.forEach(problema => {
                let puntaje = 0;
                
                // Buscar en keywords
                if (problema.keywords && Array.isArray(problema.keywords)) {
                    problema.keywords.forEach(keyword => {
                        if (textoLower.includes(keyword.toLowerCase())) {
                            puntaje += 3; // Más peso a keywords
                        }
                    });
                }
                
                // Buscar en descripción
                if (problema.descripcion && textoLower.includes(problema.descripcion.toLowerCase())) {
                    puntaje += 2;
                }
                
                // Buscar en identificador
                if (problema.identificador && textoLower.includes(problema.identificador.toLowerCase())) {
                    puntaje += 2;
                }
                
                // Buscar en nombre de categoría
                if (textoLower.includes(problema.categoria.toLowerCase())) {
                    puntaje += 4; // Máximo peso para categoría directa
                }

                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    mejorCategoria = problema.categoria;
                }
            });

            console.log(`🏆 Categoría seleccionada: ${mejorCategoria} con puntaje: ${mejorPuntaje}`);
            return mejorPuntaje >= 2 ? mejorCategoria : null;

        } catch (error) {
            console.error('❌ Error prediciendo categoría:', error);
            return null;
        }
    }

    async presentarProblemasCategoria(categoria) {
        try {
            console.log(`📂 Cargando problemas para categoría: ${categoria}`);
            
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, identificador, descripcion, prioridad')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('prioridad', { ascending: false });

            if (error) {
                console.error('❌ Error cargando problemas:', error);
                throw error;
            }

            console.log(`📊 Problemas encontrados en ${categoria}:`, problemas);

            if (!problemas || problemas.length === 0) {
                this.addMessage('bot', `❌ No encontré problemas registrados en la categoría ${this.getCategoryDisplayName(categoria)}.`);
                this.diagnosisActive = false;
                return;
            }

            let mensaje = `📝 **Problemas comunes de ${this.getCategoryDisplayName(categoria)}:**\n\n`;
            problemas.forEach((problema, index) => {
                mensaje += `${index + 1}. ${problema.descripcion}\n`;
            });
            
            mensaje += '\n**¿Cuál de estos se parece más a tu problema?** (Responde con el número o describe tu problema)';
            this.addMessage('bot', mensaje);

        } catch (error) {
            console.error('❌ Error presentando problemas:', error);
            this.addMessage('bot', '❌ Error al cargar los problemas. Intenta nuevamente.');
            this.diagnosisActive = false;
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
            console.log('🔍 Procesando selección de problema:', respuestaUsuario);
            
            const numero = parseInt(respuestaUsuario);
            
            if (isNaN(numero)) {
                // Búsqueda por texto
                await this.buscarProblemaPorTexto(respuestaUsuario);
            } else {
                // Selección por número
                await this.seleccionarProblemaPorNumero(numero);
            }

        } catch (error) {
            console.error('❌ Error seleccionando problema:', error);
            this.addMessage('bot', '❌ Error al procesar tu selección. Intenta nuevamente.');
        }
    }

    async buscarProblemaPorTexto(textoBusqueda) {
        try {
            console.log('🔍 Búsqueda textual:', textoBusqueda);
            
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, identificador, descripcion, preguntas, categoria')
                .eq('categoria', this.currentCategory)
                .eq('activo', true)
                .or(`descripcion.ilike.%${textoBusqueda}%,identificador.ilike.%${textoBusqueda}%`);

            if (error) throw error;

            console.log('📊 Resultados búsqueda:', problemas);

            if (problemas && problemas.length > 0) {
                // Usar el primer resultado más relevante
                this.currentProblem = problemas[0];
                this.currentQuestionIndex = 0;
                console.log('✅ Problema seleccionado:', this.currentProblem.descripcion);
                await this.hacerSiguientePregunta();
            } else {
                this.addMessage('bot', '❌ No encontré un problema específico con esa descripción.');
                this.addMessage('bot', '💡 **Sugerencias:**');
                this.addMessage('bot', '- Intenta con palabras más generales');
                this.addMessage('bot', '- Usa los números de la lista anterior');
                this.addMessage('bot', '- Describe el síntoma principal');
                await this.presentarProblemasCategoria(this.currentCategory);
            }

        } catch (error) {
            console.error('❌ Error en búsqueda textual:', error);
            throw error;
        }
    }

    async seleccionarProblemaPorNumero(numero) {
        try {
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
                console.log('✅ Problema seleccionado por número:', this.currentProblem.descripcion);
                await this.hacerSiguientePregunta();
            } else {
                this.addMessage('bot', '❌ Número inválido. Por favor selecciona un número de la lista.');
                await this.presentarProblemasCategoria(this.currentCategory);
            }

        } catch (error) {
            console.error('❌ Error seleccionando por número:', error);
            throw error;
        }
    }

    async hacerSiguientePregunta() {
        // Verificar si el problema tiene preguntas
        if (!this.currentProblem.preguntas || this.currentProblem.preguntas.length === 0) {
            console.log('⚠️ Problema sin preguntas, mostrando soluciones directas');
            await this.mostrarSoluciones();
            return;
        }

        if (this.currentQuestionIndex < this.currentProblem.preguntas.length) {
            const pregunta = this.currentProblem.preguntas[this.currentQuestionIndex];
            this.addMessage('bot', `❓ ${pregunta}`);
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

            this.addMessage('bot', '✅ **¡Diagnóstico completado!** Aquí tienes las soluciones recomendadas:');
            
            if (problema.soluciones && Array.isArray(problema.soluciones)) {
                problema.soluciones.forEach((solucion, index) => {
                    this.addMessage('bot', `${index + 1}. ${solucion}`);
                });
            } else {
                this.addMessage('bot', '⚠️ No hay soluciones específicas registradas para este problema.');
                this.addMessage('bot', '💡 Te recomiendo contactar con soporte técnico especializado.');
            }

            // Registrar la consulta
            await this.registrarConsulta(
                `Problema: ${this.currentCategory} - ${problema.descripcion}`,
                problema.soluciones ? problema.soluciones.join(' | ') : 'Sin soluciones específicas'
            );

            this.addMessage('bot', '---');
            this.addMessage('bot', '¿Te fue útil esta solución? Escribe "reiniciar" para comenzar un nuevo diagnóstico.');
            
            this.diagnosisActive = false;
            await this.updateStats();

        } catch (error) {
            console.error('❌ Error mostrando soluciones:', error);
            this.addMessage('bot', '❌ Error al cargar las soluciones. Intenta nuevamente.');
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
                    preguntas_realizadas: this.currentQuestionIndex,
                    creado_en: new Date().toISOString()
                });

            if (error) throw error;
            console.log('✅ Consulta registrada correctamente');

        } catch (error) {
            console.error('❌ Error registrando consulta:', error);
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
            console.error('❌ Error actualizando stats:', error);
        }
    }

    // MÉTODOS DE INTERFAZ
    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'bot') {
            avatarDiv.innerHTML = '<div class="mini-eye"></div>';
        } else {
            avatarDiv.textContent = '👤';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Procesar contenido con formato básico
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.trim() !== '') {
                const p = document.createElement('p');
                
                // Formato básico para negritas
                let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                p.innerHTML = formattedLine;
                
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <div class="mini-eye"></div>
            </div>
            <div class="message-content">
                <p><em>CyclopsBot está pensando...</em></p>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start':
                this.addMessage('bot', '🚀 **Iniciando diagnóstico...** Por favor, describe tu problema técnico:');
                this.diagnosisActive = true;
                break;
                
            case 'reset':
                this.resetBot();
                break;
                
            case 'help':
                this.mostrarAyuda();
                break;
        }
    }

    mostrarAyuda() {
        this.addMessage('bot', '🆘 **Centro de Ayuda - CyclopsBot**');
        this.addMessage('bot', '**Cómo usar el sistema:**');
        this.addMessage('bot', '1. Describe tu problema técnico');
        this.addMessage('bot', '2. Responde las preguntas del diagnóstico');
        this.addMessage('bot', '3. Sigue las soluciones recomendadas');
        this.addMessage('bot', '4. Escribe "reiniciar" en cualquier momento para comenzar de nuevo');
        this.addMessage('bot', '**Ejemplos:** "Mi WiFi no funciona", "La computadora no enciende", "El teléfono no carga"...');
    }

    resetBot() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.addMessage('bot', '🔄 **Sistema reiniciado**');
        this.addMessage('bot', '¡Hola de nuevo! ¿Qué problema técnico tienes hoy?');
    }

    getCategoryDisplayName(category) {
        const displayNames = {
            'internet': 'Internet y Redes',
            'hardware': 'Hardware',
            'software': 'Software',
            'movil': 'Dispositivos Móviles',
            'redes': 'Redes y Conectividad',
            'sistema': 'Sistema Operativo'
        };
        return displayNames[category] || category;
    }
}

// Inicializar el bot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando CyclopsBot...');
    window.cyclopsBot = new CyclopsBotAvanzado();
});
