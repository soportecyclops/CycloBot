// script.js - CYCLOPSBOT CORREGIDO PARA TU ESTRUCTURA ACTUAL
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
            
            // Test de conexión
            await this.testConnection();
            
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

    async testConnection() {
        try {
            console.log('🔍 Probando conexión y datos...');
            
            // Verificar problemas existentes (sin filtrar por 'activo')
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, categoria, identificador, descripcion')
                .limit(5);

            if (error) {
                console.error('❌ Error en consulta:', error);
                return;
            }

            console.log('📊 Problemas encontrados en BD:', problemas);
            
            if (problemas && problemas.length > 0) {
                console.log('✅ Datos cargados correctamente');
                problemas.forEach(p => {
                    console.log(`   - ${p.categoria}: ${p.descripcion}`);
                });
            } else {
                console.log('❌ No hay problemas en la base de datos');
                this.addMessage('bot', '⚠️ La base de datos está vacía. Contacta al administrador.');
            }

        } catch (error) {
            console.error('💥 Error en testConnection:', error);
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

        // Pequeño delay para mejor UX
        setTimeout(async () => {
            if (!this.diagnosisActive) {
                await this.startDiagnosis(message);
            } else {
                await this.processAnswer(message);
            }
            this.hideTypingIndicator();
        }, 1000);
    }

    async startDiagnosis(userMessage) {
        this.diagnosisActive = true;
        
        try {
            console.log('🔍 Iniciando diagnóstico para:', userMessage);
            
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
            
            // Buscar en todos los problemas (sin filtro de activo)
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('categoria, keywords, descripcion, identificador');

            if (error) {
                console.error('Error en consulta:', error);
                throw error;
            }

            console.log('📊 Total de problemas encontrados:', problemas.length);

            const textoLower = texto.toLowerCase();
            let mejorCategoria = null;
            let mejorPuntaje = 0;

            // Buscar coincidencias en keywords, descripción e identificador
            problemas.forEach(problema => {
                let puntaje = 0;
                
                // Buscar en keywords (si existe el campo)
                if (problema.keywords && Array.isArray(problema.keywords)) {
                    problema.keywords.forEach(keyword => {
                        if (textoLower.includes(keyword.toLowerCase())) {
                            puntaje += 3;
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
                    puntaje += 4;
                }

                // Búsqueda general en todos los campos de texto
                const textoCompleto = [
                    problema.categoria,
                    problema.identificador, 
                    problema.descripcion,
                    ...(problema.keywords || [])
                ].join(' ').toLowerCase();

                if (textoCompleto.includes(textoLower)) {
                    puntaje += 1;
                }

                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    mejorCategoria = problema.categoria;
                }
            });

            console.log(`🏆 Categoría seleccionada: ${mejorCategoria} con puntaje: ${mejorPuntaje}`);
            return mejorPuntaje >= 1 ? mejorCategoria : null;

        } catch (error) {
            console.error('❌ Error prediciendo categoría:', error);
            return null;
        }
    }

    async presentarProblemasCategoria(categoria) {
        try {
            console.log(`📂 Cargando problemas para categoría: ${categoria}`);
            
            // Buscar problemas de esta categoría (sin filtro de activo)
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, identificador, descripcion')
                .eq('categoria', categoria);

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
            
            mensaje += '\n**¿Cuál de estos se parece más a tu problema?** (Responde con el número)';
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
                .or(`descripcion.ilike.%${textoBusqueda}%,identificador.ilike.%${textoBusqueda}%`);

            if (error) throw error;

            console.log('📊 Resultados búsqueda:', problemas);

            if (problemas && problemas.length > 0) {
                this.currentProblem = problemas[0];
                this.currentQuestionIndex = 0;
                console.log('✅ Problema seleccionado:', this.currentProblem.descripcion);
                await this.hacerSiguientePregunta();
            } else {
                this.addMessage('bot', '❌ No encontré un problema específico con esa descripción.');
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
                .eq('categoria', this.currentCategory);

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
            }

            this.addMessage('bot', '---');
            this.addMessage('bot', '¿Te fue útil esta solución? Escribe "reiniciar" para comenzar un nuevo diagnóstico.');
            
            this.diagnosisActive = false;
            await this.updateStats();

        } catch (error) {
            console.error('❌ Error mostrando soluciones:', error);
            this.addMessage('bot', '❌ Error al cargar las soluciones. Intenta nuevamente.');
        }
    }

    async updateStats() {
        try {
            const problemsCount = document.getElementById('problemsCount');
            const diagnosticsCount = document.getElementById('diagnosticsCount');

            // Contar problemas (sin filtro de activo)
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id', { count: 'exact' });

            if (!error && problemas) {
                problemsCount.textContent = problemas.length;
                console.log('📊 Estadísticas actualizadas:', problemas.length, 'problemas');
            }

        } catch (error) {
            console.error('❌ Error actualizando stats:', error);
        }
    }

    // MÉTODOS DE INTERFAZ (sin cambios)
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
        
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.trim() !== '') {
                const p = document.createElement('p');
                let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                p.innerHTML = formattedLine;
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
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
        this.addMessage('bot', '**Cómo usar:** Describe tu problema y responde las preguntas.');
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
            'movil': 'Dispositivos Móviles'
        };
        return displayNames[category] || category;
    }
}

// Inicializar el bot
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando CyclopsBot...');
    window.cyclopsBot = new CyclopsBotAvanzado();
});
