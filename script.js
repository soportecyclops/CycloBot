// script.js - CYCLOPSBOT CON INTERACCIÓN POR BOTONES - CORREGIDO
class CyclopsBotAvanzado {
    constructor() {
        // CREDENCIALES SUPABASE
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
            console.log('✅ Supabase inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
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
        try {
            await this.initializeSupabase();
            this.limpiarChat();
            this.addMessage('bot', '👁️ **CYCLOPSBOT ACTIVADO**');
            this.addMessage('bot', '🔍 **Selecciona una categoría para comenzar:**');
            
            await this.mostrarCategorias();
            this.setupEventListeners();
            this.updateStats();
            
        } catch (error) {
            console.error('Error inicializando bot:', error);
            this.addMessage('bot', '❌ Error de conexión. Recarga la página.');
        }
    }

    setupEventListeners() {
        // Configurar botones de acción rápida
        document.querySelectorAll('.cyber-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.cyber-btn').dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async mostrarCategorias() {
        try {
            console.log('🔄 Cargando categorías...');
            const { data: categorias, error } = await this.supabase
                .from('problemas')
                .select('categoria')
                .eq('activo', true);

            if (error) {
                console.error('Error Supabase:', error);
                throw error;
            }

            const categoriasUnicas = [...new Set(categorias.map(item => item.categoria))];
            console.log('📊 Categorías encontradas:', categoriasUnicas);
            
            this.mostrarBotonesCategoria(categoriasUnicas);

        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.addMessage('bot', '❌ Error al cargar categorías. Usando categorías predeterminadas.');
            
            // Categorías de respaldo
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

        console.log('✅ Botones de categorías mostrados');
    }

    getCategoryIcon(categoria) {
        const icons = {
            'internet': '🌐',
            'hardware': '💻', 
            'software': '🖥️',
            'movil': '📱',
            'redes': '📡',
            'sistema': '⚙️'
        };
        return icons[categoria] || '🔧';
    }

    getCategoryDisplayName(categoria) {
        const displayNames = {
            'internet': 'Internet & Redes',
            'hardware': 'Hardware & PC',
            'software': 'Software & Sistema',
            'movil': 'Dispositivos Móviles',
            'redes': 'Redes & Conectividad',
            'sistema': 'Sistema Operativo'
        };
        return displayNames[categoria] || categoria;
    }

    async seleccionarCategoria(categoria) {
        console.log('🎯 Categoría seleccionada:', categoria);
        
        this.currentCategory = categoria;
        this.diagnosisActive = true;
        
        this.addMessage('user', `📂 ${this.getCategoryDisplayName(categoria)}`);
        this.addMessage('bot', `✅ **${this.getCategoryDisplayName(categoria)}** seleccionado.`);
        
        await this.mostrarProblemasCategoria(categoria);
    }

    async mostrarProblemasCategoria(categoria) {
        try {
            console.log('🔄 Cargando problemas para:', categoria);
            
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, descripcion, identificador')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('prioridad', { ascending: false });

            if (error) {
                console.error('Error Supabase problemas:', error);
                throw error;
            }

            console.log('📊 Problemas encontrados:', problemas);

            if (!problemas || problemas.length === 0) {
                this.addMessage('bot', '❌ No hay problemas activos en esta categoría.');
                this.mostrarCategorias();
                return;
            }

            this.addMessage('bot', '🔍 **Selecciona el problema específico:**');

            const buttonContainer = this.crearContenedorBotones();
            
            problemas.forEach(problema => {
                const boton = this.crearBoton(
                    `🔧 ${problema.descripcion}`,
                    () => this.seleccionarProblema(problema),
                    'primary'
                );
                buttonContainer.appendChild(boton);
            });

            // Botón para volver atrás
            const volverBoton = this.crearBoton(
                '↩️ Volver a categorías',
                () => this.volverACategorias(),
                'secondary'
            );
            buttonContainer.appendChild(volverBoton);

        } catch (error) {
            console.error('Error cargando problemas:', error);
            this.addMessage('bot', '❌ Error al cargar problemas. Intenta nuevamente.');
            this.mostrarCategorias();
        }
    }

    async seleccionarProblema(problema) {
        console.log('🎯 Problema seleccionado:', problema);
        
        this.currentProblem = problema;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('user', `❓ ${problema.descripcion}`);
        this.addMessage('bot', '🎯 **Iniciando diagnóstico guiado...**');

        // Obtener el problema completo con preguntas
        try {
            const { data: problemaCompleto, error } = await this.supabase
                .from('problemas')
                .select('preguntas, soluciones')
                .eq('id', problema.id)
                .single();

            if (error) throw error;

            this.currentProblem.preguntas = problemaCompleto.preguntas;
            this.currentProblem.soluciones = problemaCompleto.soluciones;
            
            await this.hacerSiguientePregunta();

        } catch (error) {
            console.error('Error cargando preguntas:', error);
            this.addMessage('bot', '❌ Error al cargar el diagnóstico. Intenta con otro problema.');
            await this.mostrarProblemasCategoria(this.currentCategory);
        }
    }

    async hacerSiguientePregunta() {
        if (!this.currentProblem.preguntas || this.currentQuestionIndex >= this.currentProblem.preguntas.length) {
            await this.mostrarSoluciones();
            return;
        }

        const pregunta = this.currentProblem.preguntas[this.currentQuestionIndex];
        this.addMessage('bot', `❓ **Pregunta ${this.currentQuestionIndex + 1}/${this.currentProblem.preguntas.length}:**\n${pregunta}`);
        
        this.mostrarBotonesRespuesta();
    }

    mostrarBotonesRespuesta() {
        const buttonContainer = this.crearContenedorBotones();
        
        const respuestas = [
            { texto: '✅ Sí', valor: 'sí' },
            { texto: '❌ No', valor: 'no' },
            { texto: '🤔 No estoy seguro', valor: 'no_se' }
        ];

        respuestas.forEach(respuesta => {
            const boton = this.crearBoton(
                respuesta.texto,
                () => this.procesarRespuesta(respuesta.valor),
                respuesta.valor === 'sí' ? 'success' : 
                respuesta.valor === 'no' ? 'danger' : 'secondary'
            );
            buttonContainer.appendChild(boton);
        });
    }

    async procesarRespuesta(respuesta) {
        this.userAnswers.push(respuesta);
        this.addMessage('user', `💬 ${this.getRespuestaTexto(respuesta)}`);
        
        this.currentQuestionIndex++;
        await this.hacerSiguientePregunta();
    }

    getRespuestaTexto(respuesta) {
        const textos = {
            'sí': 'Sí',
            'no': 'No', 
            'no_se': 'No estoy seguro'
        };
        return textos[respuesta] || respuesta;
    }

    async mostrarSoluciones() {
        try {
            this.addMessage('bot', '🎉 **¡Diagnóstico completado!**');
            this.addMessage('bot', '🔧 **Soluciones recomendadas:**');

            if (this.currentProblem.soluciones && this.currentProblem.soluciones.length > 0) {
                this.currentProblem.soluciones.forEach((solucion, index) => {
                    this.addMessage('bot', `${index + 1}. ${solucion}`);
                });
            } else {
                this.addMessage('bot', '⚠️ No hay soluciones específicas para este problema.');
            }

            // Registrar consulta en la base de datos
            await this.registrarConsulta(
                `Problema: ${this.currentCategory} - ${this.currentProblem.identificador}`,
                this.currentProblem.soluciones ? this.currentProblem.soluciones.join(' | ') : 'Sin soluciones'
            );

            // Actualizar estadísticas
            await this.actualizarEstadisticasProblema(this.currentProblem.id);

            this.mostrarBotonesFinales();

            this.diagnosisActive = false;
            this.updateStats();

        } catch (error) {
            console.error('Error mostrando soluciones:', error);
            this.addMessage('bot', '❌ Error al cargar las soluciones.');
            this.mostrarBotonesFinales();
        }
    }

    mostrarBotonesFinales() {
        const buttonContainer = this.crearContenedorBotones();
        
        const botonesFinales = [
            { texto: '🔄 Nuevo diagnóstico', action: () => this.nuevoDiagnostico(), type: 'primary' },
            { texto: '⭐ Calificar útil', action: () => this.calificarSolucion('util'), type: 'success' },
            { texto: '📊 Ver estadísticas', action: () => this.mostrarEstadisticas(), type: 'secondary' }
        ];

        botonesFinales.forEach(boton => {
            const elemento = this.crearBoton(boton.texto, boton.action, boton.type);
            buttonContainer.appendChild(elemento);
        });
    }

    async calificarSolucion(calificacion) {
        this.addMessage('user', `⭐ ${calificacion === 'util' ? 'Solución útil' : 'No resolvió'}`);
        this.addMessage('bot', calificacion === 'util' ? 
            '✅ ¡Gracias por tu feedback!' : 
            '❌ Lamento que no te haya ayudado.'
        );
    }

    async nuevoDiagnostico() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('bot', '🔄 **Iniciando nuevo diagnóstico...**');
        await this.mostrarCategorias();
    }

    volverACategorias() {
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('bot', '↩️ **Volviendo a categorías principales...**');
        this.mostrarCategorias();
    }

    // MÉTODOS DE UTILIDAD
    crearContenedorBotones() {
        const anterior = document.querySelector('.botones-container');
        if (anterior) anterior.remove();

        const container = document.createElement('div');
        container.className = 'botones-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        container.style.marginTop = '10px';
        container.style.maxHeight = '200px';
        container.style.overflowY = 'auto';
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(container);
        
        return container;
    }

    crearBoton(texto, onClick, tipo = 'primary') {
        const boton = document.createElement('button');
        boton.className = `cyber-btn ${tipo}`;
        boton.innerHTML = texto;
        boton.style.width = '100%';
        boton.style.justifyContent = 'flex-start';
        boton.style.padding = '12px 15px';
        boton.style.fontSize = '0.85rem';
        boton.style.marginBottom = '0';
        boton.style.textAlign = 'left';
        
        boton.addEventListener('click', onClick);
        return boton;
    }

    limpiarChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
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

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.style.marginBottom = '10px';
        messageDiv.style.padding = '10px 15px';
        messageDiv.style.background = sender === 'bot' ? 'rgba(0, 243, 255, 0.05)' : 'rgba(255, 0, 255, 0.05)';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.border = `1px solid ${sender === 'bot' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 0, 255, 0.2)'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.fontSize = '0.9rem';
        contentDiv.style.lineHeight = '1.4';
        
        const paragraphs = content.split('\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const p = document.createElement('p');
                p.innerHTML = paragraph;
                p.style.margin = '4px 0';
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll automático
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start':
                this.nuevoDiagnostico();
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
        this.addMessage('bot', 'ℹ️ **AYUDA CYCLOPSBOT**');
        this.addMessage('bot', '1. **Selecciona categoría** → Elige el tipo de problema');
        this.addMessage('bot', '2. **Selecciona problema** → Identifica tu caso específico');
        this.addMessage('bot', '3. **Responde preguntas** → Guía el diagnóstico con Sí/No/No sé');
        this.addMessage('bot', '4. **Obtén soluciones** → Sigue las instrucciones paso a paso');
    }

    resetBot() {
        this.limpiarChat();
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.initializeBot();
    }

    mostrarEstadisticas() {
        this.addMessage('bot', '📊 **ESTADÍSTICAS DE LA SESIÓN**');
        this.addMessage('bot', `• Categoría: ${this.currentCategory || 'Ninguna'}`);
        this.addMessage('bot', `• Problema: ${this.currentProblem?.descripcion || 'Ninguno'}`);
        this.addMessage('bot', `• Preguntas realizadas: ${this.currentQuestionIndex}`);
        this.addMessage('bot', `• Respuestas: ${this.userAnswers.length}`);
    }
}

// Inicializar el bot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CyclopsBotAvanzado();
});
