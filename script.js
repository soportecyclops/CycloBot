// script.js - CYCLOPSBOT CON INTERACCIÓN POR BOTONES
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
        this.setupEventListeners();
    }

    async initializeSupabase() {
        if (typeof supabase === 'undefined') {
            await this.loadSupabaseSDK();
        }
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Supabase inicializado');
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
        await this.initializeSupabase();
        this.addMessage('bot', '👁️ **CYCLOPSBOT ACTIVADO** - Sistema de Diagnóstico Técnico');
        this.addMessage('bot', '🔍 **Base de datos conectada** - Motor de IA listo');
        this.addMessage('bot', '🎯 **Selecciona una categoría** para comenzar el diagnóstico:');
        
        await this.mostrarCategorias();
        this.updateStats();
    }

    setupEventListeners() {
        // Eliminar event listeners de texto existentes
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        
        if (userInput) userInput.style.display = 'none';
        if (sendButton) sendButton.style.display = 'none';

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
            const { data: categorias, error } = await this.supabase
                .from('problemas')
                .select('categoria')
                .eq('activo', true)
                .order('categoria');

            if (error) throw error;

            const categoriasUnicas = [...new Set(categorias.map(item => item.categoria))];
            
            this.mostrarBotonesCategoria(categoriasUnicas);

        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.addMessage('bot', '❌ Error al cargar categorías. Intenta recargar la página.');
        }
    }

    mostrarBotonesCategoria(categorias) {
        const buttonContainer = this.crearContenedorBotones();
        
        categorias.forEach(categoria => {
            const boton = this.crearBoton(
                this.getCategoryIcon(categoria) + ' ' + this.getCategoryDisplayName(categoria),
                () => this.seleccionarCategoria(categoria),
                'primary'
            );
            buttonContainer.appendChild(boton);
        });

        // Botón de ayuda
        const ayudaBoton = this.crearBoton(
            '❓ No estoy seguro / Ayuda',
            () => this.mostrarAyuda(),
            'secondary'
        );
        buttonContainer.appendChild(ayudaBoton);
    }

    getCategoryIcon(categoria) {
        const icons = {
            'internet': '🌐',
            'hardware': '💻', 
            'software': '🧩',
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
        this.currentCategory = categoria;
        this.diagnosisActive = true;
        
        this.addMessage('user', `Categoría: ${this.getCategoryDisplayName(categoria)}`);
        this.addMessage('bot', `✅ **${this.getCategoryDisplayName(categoria)}** seleccionado.`);
        
        await this.mostrarProblemasCategoria(categoria);
    }

    async mostrarProblemasCategoria(categoria) {
        try {
            const { data: problemas, error } = await this.supabase
                .from('problemas')
                .select('id, descripcion, identificador')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('prioridad', { ascending: false });

            if (error) throw error;

            if (problemas.length === 0) {
                this.addMessage('bot', '❌ No hay problemas activos en esta categoría.');
                return;
            }

            this.addMessage('bot', '🔍 **Selecciona el problema específico:**');

            const buttonContainer = this.crearContenedorBotones();
            
            problemas.forEach(problema => {
                const boton = this.crearBoton(
                    problema.descripcion,
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
        }
    }

    async seleccionarProblema(problema) {
        this.currentProblem = problema;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('user', `Problema: ${problema.descripcion}`);
        this.addMessage('bot', '🎯 **Iniciando diagnóstico guiado...**');

        // Obtener el problema completo con preguntas
        try {
            const { data: problemaCompleto, error } = await this.supabase
                .from('problemas')
                .select('preguntas')
                .eq('id', problema.id)
                .single();

            if (error) throw error;

            this.currentProblem.preguntas = problemaCompleto.preguntas;
            await this.hacerSiguientePregunta();

        } catch (error) {
            console.error('Error cargando preguntas:', error);
            this.addMessage('bot', '❌ Error al cargar el diagnóstico. Intenta nuevamente.');
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
        this.addMessage('user', `Respuesta: ${this.getRespuestaTexto(respuesta)}`);
        
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
            const { data: problema, error } = await this.supabase
                .from('problemas')
                .select('soluciones, identificador, descripcion')
                .eq('id', this.currentProblem.id)
                .single();

            if (error) throw error;

            this.addMessage('bot', '🎉 **¡Diagnóstico completado!**');
            this.addMessage('bot', '🔧 **Soluciones recomendadas:**');

            problema.soluciones.forEach((solucion, index) => {
                this.addMessage('bot', `${index + 1}. ${solucion}`);
            });

            // Registrar consulta en la base de datos
            await this.registrarConsulta(
                `Problema: ${this.currentCategory} - ${problema.identificador}`,
                problema.soluciones.join(' | ')
            );

            // Actualizar estadísticas
            await this.actualizarEstadisticasProblema(this.currentProblem.id);

            this.mostrarBotonesFinales();

            this.diagnosisActive = false;
            this.updateStats();

        } catch (error) {
            console.error('Error mostrando soluciones:', error);
            this.addMessage('bot', '❌ Error al cargar las soluciones.');
        }
    }

    mostrarBotonesFinales() {
        const buttonContainer = this.crearContenedorBotones();
        
        const botonesFinales = [
            { texto: '🔄 Nuevo diagnóstico', action: () => this.nuevoDiagnostico(), type: 'primary' },
            { texto: '⭐ Solución útil', action: () => this.calificarSolucion('util'), type: 'success' },
            { texto: '👎 No resolvió', action: () => this.calificarSolucion('no_util'), type: 'danger' },
            { texto: '📊 Ver estadísticas', action: () => this.mostrarEstadisticas(), type: 'secondary' }
        ];

        botonesFinales.forEach(boton => {
            const elemento = this.crearBoton(boton.texto, boton.action, boton.type);
            buttonContainer.appendChild(elemento);
        });
    }

    async calificarSolucion(calificacion) {
        this.addMessage('user', `Calificación: ${calificacion === 'util' ? 'Solución útil' : 'No resolvió'}`);
        this.addMessage('bot', calificacion === 'util' ? 
            '✅ ¡Gracias por tu feedback! Me ayuda a mejorar.' : 
            '❌ Lamento que no te haya ayudado. ¿Quieres intentar con otro diagnóstico?'
        );
    }

    async nuevoDiagnostico() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.addMessage('bot', '🔄 **Reiniciando sistema de diagnóstico...**');
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

    // MÉTODOS DE UTILIDAD PARA BOTONES
    crearContenedorBotones() {
        // Eliminar contenedor anterior si existe
        const anterior = document.querySelector('.botones-container');
        if (anterior) anterior.remove();

        const container = document.createElement('div');
        container.className = 'botones-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.marginTop = '15px';
        
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
        boton.style.padding = '12px 20px';
        
        boton.addEventListener('click', onClick);
        return boton;
    }

    // MÉTODOS EXISTENTES (sin cambios)
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
        messageDiv.className = `message ${sender}-message advanced`;
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'bot-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? 
            '<div class="avatar-core"></div><div class="avatar-ring"></div>' : 
            '👤';
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        const senderName = document.createElement('span');
        senderName.className = 'sender-name';
        senderName.textContent = sender === 'bot' ? 'CYCLOPS_AI' : 'USUARIO';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        metaDiv.appendChild(senderName);
        metaDiv.appendChild(timeSpan);
        messageHeader.appendChild(avatarDiv);
        messageHeader.appendChild(metaDiv);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content-advanced';
        
        const paragraphs = content.split('\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const p = document.createElement('p');
                p.innerHTML = paragraph; // Usar innerHTML para permitir formato
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
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
        this.addMessage('bot', 'ℹ️ **CENTRO DE AYUDA CYCLOPSBOT**');
        this.addMessage('bot', '• **Selecciona categorías** → Elige el tipo de problema');
        this.addMessage('bot', '• **Selecciona problema específico** → Identifica tu caso');
        this.addMessage('bot', '• **Responde preguntas** → Guía el diagnóstico con Sí/No/No sé');
        this.addMessage('bot', '• **Obtén soluciones** → Instrucciones paso a paso');
        this.addMessage('bot', '• **Califica resultados** → Ayuda a mejorar el sistema');
    }

    resetBot() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        this.initializeBot();
    }

    mostrarEstadisticas() {
        this.addMessage('bot', '📊 **ESTADÍSTICAS DE LA SESIÓN**');
        this.addMessage('bot', `• Categoría diagnosticada: ${this.currentCategory || 'Ninguna'}`);
        this.addMessage('bot', `• Problema analizado: ${this.currentProblem?.descripcion || 'Ninguno'}`);
        this.addMessage('bot', `• Preguntas realizadas: ${this.currentQuestionIndex}`);
        this.addMessage('bot', `• Respuestas registradas: ${this.userAnswers.length}`);
    }
}

// Inicializar el bot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CyclopsBotAvanzado();
});
