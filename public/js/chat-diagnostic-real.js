// CYCLOPSBOT - Motor de Diagnóstico Inteligente con Supabase
class CyclopsBotReal {
    constructor() {
        this.currentCategory = null;
        this.currentQuestion = null;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        this.diagnosticsCount = 0;
        this.problemsCount = 0;
        
        // Estados del sistema
        this.systemStatus = {
            supabase: 'conectando',
            ai: 'inactivo',
            online: 'verificando'
        };

        this.init();
    }

    async init() {
        console.log('🚀 Inicializando CyclopsBot Real...');
        await this.verificarSistema();
        this.setupEventListeners();
        this.mostrarInterfazInicial();
    }

    async verificarSistema() {
        // Verificar conexión a Supabase
        const conexion = await window.SupabaseClient.verificarConexionSupabase();
        
        if (conexion.success) {
            this.systemStatus.supabase = 'conectado';
            this.actualizarEstadoSistema();
            console.log('✅ Sistema verificado - Supabase conectado');
        } else {
            this.systemStatus.supabase = 'error';
            this.actualizarEstadoSistema();
            console.error('❌ Error en conexión Supabase');
        }
    }

    actualizarEstadoSistema() {
        const statusItems = document.querySelectorAll('.status-item');
        
        statusItems.forEach(item => {
            const icon = item.querySelector('i');
            const text = item.querySelector('span');
            
            if (text.textContent === 'BD') {
                if (this.systemStatus.supabase === 'conectado') {
                    item.classList.add('online');
                    icon.style.color = 'var(--success)';
                } else if (this.systemStatus.supabase === 'error') {
                    item.classList.remove('online');
                    icon.style.color = 'var(--danger)';
                }
            }
        });
    }

    setupEventListeners() {
        // Configurar botones de acción rápida
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async mostrarInterfazInicial() {
        this.limpiarChat();
        this.limpiarBotones();
        
        // Mensaje de bienvenida
        this.addMessage('bot', `
            <div class="action-call">
                <h3>🔍 SISTEMA DE DIAGNÓSTICO INTELIGENTE</h3>
                <p>Selecciona una categoría para comenzar el análisis</p>
            </div>
        `);

        // Cargar categorías desde Supabase
        await this.mostrarCategoriasReales();
    }

    async mostrarCategoriasReales() {
        try {
            const categorias = await window.SupabaseClient.obtenerCategorias();
            this.mostrarBotonesCategoria(categorias);
            
            // Actualizar contador de problemas
            await this.actualizarContadorProblemas();
            
        } catch (error) {
            console.error('Error cargando categorías:', error);
            // Fallback a categorías predefinidas
            const categoriasFallback = ['internet', 'celulares_moviles', 'software', 'hardware'];
            this.mostrarBotonesCategoria(categoriasFallback);
        }
    }

    mostrarBotonesCategoria(categorias) {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        const gridContainer = document.createElement('div');
        gridContainer.className = 'botones-grid';
        
        categorias.forEach(categoria => {
            const boton = this.crearBotonCategoria(categoria, () => {
                this.seleccionarCategoria(categoria);
            });
            gridContainer.appendChild(boton);
        });
        
        botonesArea.appendChild(gridContainer);
    }

    crearBotonCategoria(categoria, onClick) {
        const boton = document.createElement('button');
        boton.className = 'cyber-btn primary boton-categoria';
        
        const icono = this.obtenerIconoCategoria(categoria);
        const nombre = this.formatearNombreCategoria(categoria);
        
        boton.innerHTML = `${icono} ${nombre}`;
        boton.addEventListener('click', onClick);
        
        return boton;
    }

    obtenerIconoCategoria(categoria) {
        const iconos = {
            'internet': '🌐',
            'celulares_moviles': '📱',
            'software': '💻',
            'hardware': '🔧',
            'redes': '📡',
            'seguridad': '🛡️'
        };
        return iconos[categoria] || '🔍';
    }

    formatearNombreCategoria(categoria) {
        return categoria.split('_')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(' ');
    }

    async seleccionarCategoria(categoria) {
        this.currentCategory = categoria;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = true;
        
        this.addMessage('user', `📂 ${this.obtenerIconoCategoria(categoria)} ${this.formatearNombreCategoria(categoria)}`);
        
        // Obtener primera pregunta desde Supabase
        await this.obtenerYMostrarSiguientePregunta();
    }

    async obtenerYMostrarSiguientePregunta(preguntaAnteriorId = null) {
        try {
            this.mostrarCargando('Buscando diagnóstico...');
            
            const pregunta = await window.SupabaseClient.obtenerSiguientePregunta(
                this.currentCategory, 
                preguntaAnteriorId
            );

            if (!pregunta) {
                // No hay más preguntas, mostrar diagnóstico final
                await this.mostrarDiagnosticoFinal();
                return;
            }

            this.currentQuestion = pregunta;
            this.questionHistory.push(pregunta);
            
            // Mostrar pregunta al usuario
            this.addMessage('bot', `❓ **${pregunta.preguntas[0]}**`);
            
            // Mostrar opciones de respuesta
            this.mostrarOpcionesRespuesta(pregunta);
            
            this.ocultarCargando();
            
        } catch (error) {
            console.error('Error obteniendo pregunta:', error);
            this.addMessage('bot', '❌ Error cargando la siguiente pregunta. Intenta nuevamente.');
            this.ocultarCargando();
            this.mostrarOpcionesRecuperacion();
        }
    }

    mostrarOpcionesRespuesta(pregunta) {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        const gridContainer = document.createElement('div');
        gridContainer.className = 'botones-grid';
        
        // Mostrar tipo de pregunta
        const tipoIndicator = document.createElement('div');
        tipoIndicator.style.gridColumn = '1 / -1';
        tipoIndicator.style.textAlign = 'center';
        tipoIndicator.style.fontSize = '0.7rem';
        tipoIndicator.style.color = 'var(--text-muted)';
        tipoIndicator.style.marginBottom = '5px';
        tipoIndicator.innerHTML = `💬 ${this.obtenerTextoTipoPregunta(pregunta.tipo_pregunta)}`;
        gridContainer.appendChild(tipoIndicator);

        // Crear botones para cada opción de respuesta
        pregunta.respuestas_posibles.forEach((respuesta, index) => {
            const boton = this.crearBotonRespuesta(respuesta, index, () => {
                this.procesarRespuestaUsuario(respuesta, pregunta);
            });
            gridContainer.appendChild(boton);
        });

        botonesArea.appendChild(gridContainer);

        // Agregar botón para volver atrás si hay historial
        if (this.questionHistory.length > 1) {
            const volverBoton = this.crearBotonVolver();
            botonesArea.appendChild(volverBoton);
        }
    }

    obtenerTextoTipoPregunta(tipo) {
        const textos = {
            'booleano': 'Responde Sí o No',
            'opciones': 'Selecciona una opción',
            'multiple': 'Selección múltiple'
        };
        return textos[tipo] || 'Selecciona una respuesta';
    }

    crearBotonRespuesta(respuesta, index, onClick) {
        const boton = document.createElement('button');
        boton.className = 'cyber-btn primary';
        
        const icono = this.obtenerIconoRespuesta(respuesta, index);
        boton.innerHTML = `${icono} ${respuesta}`;
        boton.addEventListener('click', onClick);
        
        return boton;
    }

    obtenerIconoRespuesta(respuesta, index) {
        // Iconos basados en el contenido de la respuesta
        const texto = respuesta.toLowerCase();
        
        if (texto.includes('sí') || texto.includes('si') || texto.includes('yes')) return '✅';
        if (texto.includes('no') || texto.includes('not')) return '❌';
        if (texto.includes('tal vez') || texto.includes('maybe') || texto.includes('no sé')) return '🤔';
        if (texto.includes('siempre') || texto.includes('always')) return '🔄';
        if (texto.includes('nunca') || texto.includes('never')) return '🚫';
        
        // Iconos numéricos para opciones genéricas
        const iconosNumericos = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
        return iconosNumericos[index] || '🔹';
    }

    crearBotonVolver() {
        const boton = document.createElement('button');
        boton.className = 'cyber-btn secondary back-button';
        boton.innerHTML = '↩️ Volver a la pregunta anterior';
        boton.addEventListener('click', () => this.volverPreguntaAnterior());
        return boton;
    }

    async procesarRespuestaUsuario(respuesta, pregunta) {
        // Guardar respuesta del usuario
        this.userAnswers.push({
            pregunta: pregunta.preguntas[0],
            respuesta: respuesta,
            preguntaId: pregunta.id,
            timestamp: new Date().toISOString()
        });

        // Mostrar respuesta del usuario en el chat
        this.addMessage('user', `💬 ${respuesta}`);

        // Verificar si es pregunta final
        if (pregunta.es_pregunta_final) {
            await this.mostrarDiagnosticoCompleto(pregunta);
            return;
        }

        // Obtener siguiente pregunta basada en la respuesta
        setTimeout(async () => {
            await this.obtenerYMostrarSiguientePregunta(pregunta.id);
        }, 800);
    }

    async mostrarDiagnosticoFinal() {
        try {
            this.mostrarCargando('Analizando respuestas...');
            
            const diagnostico = await window.SupabaseClient.obtenerDiagnosticoFinal(
                this.currentCategory,
                this.userAnswers
            );

            if (diagnostico) {
                await this.mostrarDiagnosticoCompleto(diagnostico);
            } else {
                this.mostrarDiagnosticoGenerico();
            }
            
            this.ocultarCargando();
            
        } catch (error) {
            console.error('Error obteniendo diagnóstico:', error);
            this.mostrarDiagnosticoGenerico();
            this.ocultarCargando();
        }
    }

    async mostrarDiagnosticoCompleto(diagnostico) {
        this.diagnosticsCount++;
        this.actualizarEstadisticas();
        
        this.addMessage('bot', '🎉 **DIAGNÓSTICO COMPLETADO**');
        
        // Mostrar causa probable
        if (diagnostico.causa_probable) {
            this.addMessage('bot', `🔍 **Causa Probable:** ${diagnostico.causa_probable}`);
        }
        
        // Mostrar soluciones
        if (diagnostico.soluciones && diagnostico.soluciones.length > 0) {
            this.addMessage('bot', '🛠️ **Soluciones Recomendadas:**');
            
            diagnostico.soluciones.forEach((solucion, index) => {
                this.addMessage('bot', `${index + 1}. ${solucion}`);
            });
        } else {
            this.mostrarSolucionesGenericas();
        }
        
        this.diagnosisActive = false;
        this.mostrarOpcionesPostDiagnostico();
    }

    mostrarDiagnosticoGenerico() {
        this.addMessage('bot', '🔍 **DIAGNÓSTICO GENERAL**');
        this.addMessage('bot', 'No se pudo determinar un diagnóstico específico basado en las respuestas.');
        this.mostrarSolucionesGenericas();
        this.mostrarOpcionesPostDiagnostico();
    }

    mostrarSolucionesGenericas() {
        this.addMessage('bot', '💡 **Soluciones Generales Recomendadas:**');
        this.addMessage('bot', '1. **Reinicia el dispositivo** - Apaga y enciende nuevamente');
        this.addMessage('bot', '2. **Verifica conexiones** - Cables, WiFi, alimentación');
        this.addMessage('bot', '3. **Actualiza software** - Sistema operativo y controladores');
        this.addMessage('bot', '4. **Ejecuta diagnóstico** - Herramientas del sistema');
        this.addMessage('bot', '5. **Consulta especialista** - Si el problema persiste');
    }

    mostrarOpcionesPostDiagnostico() {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        
        const opciones = [
            {
                texto: '🔄 Nuevo Diagnóstico',
                accion: () => this.nuevoDiagnostico(),
                tipo: 'primary'
            },
            {
                texto: '⭐ Fue Útil',
                accion: () => this.calificarDiagnostico('util'),
                tipo: 'success'
            },
            {
                texto: '📊 Ver Estadísticas',
                accion: () => this.mostrarEstadisticasCompletas(),
                tipo: 'secondary'
            }
        ];
        
        opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.className = `cyber-btn ${opcion.tipo}`;
            boton.innerHTML = opcion.texto;
            boton.addEventListener('click', opcion.accion);
            boton.style.margin = '2px 0';
            botonesArea.appendChild(boton);
        });
    }

    volverPreguntaAnterior() {
        if (this.questionHistory.length > 1) {
            // Remover pregunta actual del historial
            this.questionHistory.pop();
            this.userAnswers.pop();
            
            const preguntaAnterior = this.questionHistory[this.questionHistory.length - 1];
            
            // Remover mensajes de la interacción actual
            this.removerUltimosMensajes(2);
            
            // Restaurar pregunta anterior
            this.currentQuestion = preguntaAnterior;
            this.mostrarOpcionesRespuesta(preguntaAnterior);
        }
    }

    removerUltimosMensajes(cantidad) {
        const chatMessages = document.getElementById('chatMessages');
        const mensajes = chatMessages.querySelectorAll('.message');
        
        for (let i = 0; i < cantidad && mensajes.length > 0; i++) {
            mensajes[mensajes.length - 1].remove();
        }
    }

    async nuevoDiagnostico() {
        this.resetEstado();
        this.addMessage('bot', '🔄 **Iniciando nuevo diagnóstico...**');
        await this.mostrarCategoriasReales();
    }

    resetEstado() {
        this.currentCategory = null;
        this.currentQuestion = null;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = false;
    }

    // MÉTODOS DE UTILIDAD
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll al final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    limpiarChat() {
        document.getElementById('chatMessages').innerHTML = '';
    }

    limpiarBotones() {
        document.getElementById('botonesArea').innerHTML = '';
    }

    mostrarCargando(mensaje = 'Cargando...') {
        // Implementar overlay de carga si es necesario
        console.log('⏳', mensaje);
    }

    ocultarCargando() {
        console.log('✅ Carga completada');
    }

    async actualizarContadorProblemas() {
        try {
            const { data, error } = await window.SupabaseClient.supabase
                .from('problemas')
                .select('id', { count: 'exact' });
                
            if (!error && data) {
                this.problemsCount = data.length;
                this.actualizarEstadisticas();
            }
        } catch (error) {
            console.error('Error contando problemas:', error);
        }
    }

    actualizarEstadisticas() {
        const problemsCountElement = document.getElementById('problemsCount');
        const diagnosticsCountElement = document.getElementById('diagnosticsCount');
        
        if (problemsCountElement) {
            problemsCountElement.textContent = this.problemsCount || '316';
        }
        
        if (diagnosticsCountElement) {
            diagnosticsCountElement.textContent = this.diagnosticsCount;
        }
    }

    mostrarOpcionesRecuperacion() {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        
        const opcionesRecuperacion = [
            {
                texto: '🔄 Reintentar',
                accion: () => this.obtenerYMostrarSiguientePregunta(),
                tipo: 'primary'
            },
            {
                texto: '📂 Cambiar Categoría',
                accion: () => this.nuevoDiagnostico(),
                tipo: 'secondary'
            }
        ];
        
        opcionesRecuperacion.forEach(opcion => {
            const boton = document.createElement('button');
            boton.className = `cyber-btn ${opcion.tipo}`;
            boton.innerHTML = opcion.texto;
            boton.addEventListener('click', opcion.accion);
            botonesArea.appendChild(boton);
        });
    }

    calificarDiagnostico(calificacion) {
        this.addMessage('user', `⭐ Calificación: ${calificacion}`);
        this.addMessage('bot', '¡Gracias por tu feedback! Me ayuda a mejorar.');
        
        setTimeout(() => {
            this.mostrarOpcionesPostDiagnostico();
        }, 1000);
    }

    mostrarEstadisticasCompletas() {
        this.addMessage('bot', '📊 **ESTADÍSTICAS DE LA SESIÓN**');
        this.addMessage('bot', `• Diagnósticos realizados: ${this.diagnosticsCount}`);
        this.addMessage('bot', `• Problemas en base de datos: ${this.problemsCount}`);
        this.addMessage('bot', `• Categoría actual: ${this.currentCategory ? this.formatearNombreCategoria(this.currentCategory) : 'Ninguna'}`);
        this.addMessage('bot', `• Preguntas respondidas: ${this.userAnswers.length}`);
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start':
                this.nuevoDiagnostico();
                break;
            case 'reset':
                this.resetBotCompleto();
                break;
            case 'help':
                this.mostrarAyuda();
                break;
        }
    }

    resetBotCompleto() {
        this.limpiarChat();
        this.limpiarBotones();
        this.resetEstado();
        this.diagnosticsCount = 0;
        this.actualizarEstadisticas();
        this.mostrarInterfazInicial();
    }

    mostrarAyuda() {
        this.addMessage('bot', 'ℹ️ **AYUDA - SISTEMA CYCLOPSBOT**');
        this.addMessage('bot', '1. **Selecciona una categoría** de problema');
        this.addMessage('bot', '2. **Responde las preguntas** que aparecen');
        this.addMessage('bot', '3. **Recibe diagnóstico** y soluciones');
        this.addMessage('bot', '4. **Puedes volver atrás** si te equivocas');
        this.addMessage('bot', '5. **Califica el diagnóstico** para mejorar');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Supabase esté listo
    setTimeout(() => {
        window.cyclopsBot = new CyclopsBotReal();
    }, 1000);
});

// Exportar para uso global
window.CyclopsBotReal = CyclopsBotReal;
