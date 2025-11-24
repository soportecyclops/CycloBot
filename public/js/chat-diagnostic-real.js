// CYCLOPSBOT - Motor de Diagnóstico Inteligente CORREGIDO
class CyclopsBotReal {
    constructor() {
        this.currentCategory = null;
        this.currentQuestion = null;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando CyclopsBot Real Mejorado...');
        await this.verificarSistema();
        this.setupEventListeners();
        this.mostrarInterfazInicial();
    }

    async verificarSistema() {
        try {
            const conexion = await window.SupabaseClient.verificarConexionSupabase();
            this.actualizarEstadoSistema(conexion.success);
        } catch (error) {
            this.actualizarEstadoSistema(false);
        }
    }

    actualizarEstadoSistema(conectado) {
        const dbStatus = document.getElementById('db-status');
        if (dbStatus) {
            if (conectado) {
                dbStatus.classList.add('online');
                dbStatus.querySelector('i').style.color = 'var(--success)';
            } else {
                dbStatus.classList.remove('online');
                dbStatus.querySelector('i').style.color = 'var(--danger)';
            }
        }
    }

    setupEventListeners() {
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
        
        this.addMessage('bot', `
            <div class="action-call">
                <h3>🔍 SISTEMA DE DIAGNÓSTICO INTELIGENTE</h3>
                <p>Selecciona una categoría para comenzar el análisis</p>
            </div>
        `);

        await this.mostrarCategoriasReales();
    }

    async mostrarCategoriasReales() {
        try {
            const categorias = await window.SupabaseClient.obtenerCategorias();
            this.mostrarBotonesCategoria(categorias);
        } catch (error) {
            console.error('Error cargando categorías:', error);
            const categoriasFallback = ['internet', 'software', 'hardware', 'movil', 'seguridad'];
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
            'software': '💻', 
            'hardware': '🔧',
            'movil': '📱',
            'seguridad': '🛡️',
            'redes': '📡'
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
        
        await this.obtenerYMostrarPrimeraPregunta();
    }

    async obtenerYMostrarPrimeraPregunta() {
        try {
            this.mostrarCargando('Buscando problemas...');
            
            // Obtener TODOS los problemas de la categoría para simular flujo
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            
            if (!problemas || problemas.length === 0) {
                this.addMessage('bot', '❌ No se encontraron problemas para esta categoría.');
                this.mostrarOpcionesRecuperacion();
                return;
            }

            // Seleccionar un problema aleatorio para demostración
            const preguntaAleatoria = problemas[Math.floor(Math.random() * problemas.length)];
            await this.mostrarPreguntaConOpciones(preguntaAleatoria);
            
            this.ocultarCargando();
            
        } catch (error) {
            console.error('Error obteniendo pregunta:', error);
            this.addMessage('bot', '❌ Error cargando la pregunta. Intenta nuevamente.');
            this.ocultarCargando();
            this.mostrarOpcionesRecuperacion();
        }
    }

    async mostrarPreguntaConOpciones(pregunta) {
        this.currentQuestion = pregunta;
        this.questionHistory.push(pregunta);
        
        // Obtener la primera pregunta del array
        const textoPregunta = this.obtenerTextoPregunta(pregunta);
        
        this.addMessage('bot', `❓ **${textoPregunta}**`);
        
        // Mostrar opciones de respuesta (generar automáticamente si están vacías)
        this.mostrarOpcionesRespuesta(pregunta);
    }

    obtenerTextoPregunta(pregunta) {
        if (pregunta.preguntas && pregunta.preguntas.length > 0) {
            // Tomar la primera pregunta del array
            return Array.isArray(pregunta.preguntas) 
                ? pregunta.preguntas[0] 
                : pregunta.preguntas;
        }
        return pregunta.descripcion || '¿Podrías describir el problema?';
    }

    mostrarOpcionesRespuesta(pregunta) {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        const gridContainer = document.createElement('div');
        gridContainer.className = 'botones-grid';
        
        // Generar opciones de respuesta automáticamente basadas en el tipo de pregunta
        const opciones = this.generarOpcionesAutomaticas(pregunta);
        
        // Mostrar tipo de pregunta
        const tipoIndicator = document.createElement('div');
        tipoIndicator.style.gridColumn = '1 / -1';
        tipoIndicator.style.textAlign = 'center';
        tipoIndicator.style.fontSize = '0.7rem';
        tipoIndicator.style.color = 'var(--text-muted)';
        tipoIndicator.style.marginBottom = '5px';
        tipoIndicator.innerHTML = `💬 ${this.obtenerTextoTipoPregunta(pregunta.tipo_pregunta)}`;
        gridContainer.appendChild(tipoIndicator);

        // Crear botones para cada opción
        opciones.forEach((opcion, index) => {
            const boton = this.crearBotonRespuesta(opcion.texto, index, () => {
                this.procesarRespuestaUsuario(opcion.valor, pregunta);
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

    generarOpcionesAutomaticas(pregunta) {
        // Si hay respuestas_posibles definidas, usarlas
        if (pregunta.respuestas_posibles && pregunta.respuestas_posibles.length > 0) {
            return pregunta.respuestas_posibles.map((respuesta, index) => ({
                texto: respuesta,
                valor: respuesta
            }));
        }

        // Generar opciones automáticas basadas en el tipo de pregunta y contenido
        const textoPregunta = this.obtenerTextoPregunta(pregunta).toLowerCase();
        
        // Opciones para preguntas booleanas
        if (pregunta.tipo_pregunta === 'booleano' || 
            textoPregunta.includes('sí') || textoPregunta.includes('no') ||
            textoPregunta.includes('has') || textoPregunta.includes('está')) {
            return [
                { texto: '✅ Sí', valor: 'sí' },
                { texto: '❌ No', valor: 'no' },
                { texto: '🤔 No lo sé', valor: 'no_se' }
            ];
        }

        // Opciones para preguntas de frecuencia
        if (textoPregunta.includes('siempre') || textoPregunta.includes('nunca') || 
            textoPregunta.includes('frecuencia') || textoPregunta.includes('a menudo')) {
            return [
                { texto: '🔄 Siempre', valor: 'siempre' },
                { texto: '📅 Frecuentemente', valor: 'frecuentemente' },
                { texto: '⏰ Ocasionalmente', valor: 'ocasionalmente' },
                { texto: '🚫 Nunca', valor: 'nunca' }
            ];
        }

        // Opciones para preguntas de gravedad
        if (textoPregunta.includes('grave') || textoPregunta.includes('leve') ||
            textoPregunta.includes('urgente') || textoPregunta.includes('importante')) {
            return [
                { texto: '🔴 Crítico', valor: 'critico' },
                { texto: '🟡 Moderado', valor: 'moderado' },
                { texto: '🟢 Leve', valor: 'leve' }
            ];
        }

        // Opciones genéricas por defecto
        return [
            { texto: '✅ Sí, exactamente', valor: 'si_exacto' },
            { texto: '🔄 Más o menos', valor: 'mas_o_menos' },
            { texto: '❌ No, es diferente', valor: 'no_diferente' },
            { texto: '🤔 No estoy seguro', valor: 'no_seguro' }
        ];
    }

    obtenerTextoTipoPregunta(tipo) {
        const textos = {
            'booleano': 'Responde Sí o No',
            'opciones': 'Selecciona una opción',
            'multiple': 'Selección múltiple',
            'texto': 'Describe tu respuesta'
        };
        return textos[tipo] || 'Selecciona la respuesta que mejor describa tu situación';
    }

    crearBotonRespuesta(texto, index, onClick) {
        const boton = document.createElement('button');
        boton.className = 'cyber-btn primary';
        boton.innerHTML = texto;
        boton.addEventListener('click', onClick);
        return boton;
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
            pregunta: this.obtenerTextoPregunta(pregunta),
            respuesta: respuesta,
            preguntaId: pregunta.id,
            timestamp: new Date().toISOString()
        });

        // Mostrar respuesta del usuario en el chat
        this.addMessage('user', `💬 ${respuesta}`);

        // Simular siguiente pregunta o diagnóstico final
        setTimeout(async () => {
            if (this.userAnswers.length >= 2) { // Después de 2 respuestas, mostrar diagnóstico
                await this.mostrarDiagnosticoCompleto(pregunta);
            } else {
                // Simular siguiente pregunta
                await this.simularSiguientePregunta();
            }
        }, 800);
    }

    async simularSiguientePregunta() {
        try {
            // Obtener otro problema aleatorio de la misma categoría
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            if (problemas && problemas.length > 0) {
                // Filtrar para no repetir la misma pregunta
                const preguntasDisponibles = problemas.filter(p => 
                    !this.questionHistory.some(q => q.id === p.id)
                );
                
                const siguientePregunta = preguntasDisponibles.length > 0 
                    ? preguntasDisponibles[Math.floor(Math.random() * preguntasDisponibles.length)]
                    : problemas[Math.floor(Math.random() * problemas.length)];
                
                await this.mostrarPreguntaConOpciones(siguientePregunta);
            } else {
                await this.mostrarDiagnosticoFinal();
            }
        } catch (error) {
            await this.mostrarDiagnosticoFinal();
        }
    }

    async mostrarDiagnosticoFinal() {
        try {
            this.mostrarCargando('Analizando respuestas...');
            
            // Obtener un diagnóstico aleatorio de la categoría actual
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            const diagnostico = problemas && problemas.length > 0 
                ? problemas[Math.floor(Math.random() * problemas.length)]
                : null;

            if (diagnostico) {
                await this.mostrarDiagnosticoCompleto(diagnostico);
            } else {
                this.mostrarDiagnosticoGenerico();
            }
            
            // Registrar diagnóstico en estadísticas
            if (window.recordDiagnosis) {
                window.recordDiagnosis();
            }
            
            this.ocultarCargando();
            
        } catch (error) {
            console.error('Error obteniendo diagnóstico:', error);
            this.mostrarDiagnosticoGenerico();
            this.ocultarCargando();
        }
    }

    async mostrarDiagnosticoCompleto(diagnostico) {
        this.addMessage('bot', '🎉 **DIAGNÓSTICO COMPLETADO**');
        
        // Mostrar soluciones si existen
        if (diagnostico.soluciones && diagnostico.soluciones.length > 0) {
            this.addMessage('bot', '🛠️ **Soluciones Recomendadas:**');
            
            diagnostico.soluciones.forEach((solucion, index) => {
                if (solucion && solucion.trim() !== '') {
                    this.addMessage('bot', `${index + 1}. ${solucion}`);
                }
            });
        } else {
            this.mostrarSolucionesGenericas();
        }
        
        this.diagnosisActive = false;
        this.mostrarOpcionesPostDiagnostico();
    }

    mostrarDiagnosticoGenerico() {
        this.addMessage('bot', '🔍 **DIAGNÓSTICO GENERAL**');
        this.addMessage('bot', 'Basado en tus respuestas, aquí tienes algunas soluciones generales:');
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
                accion: () => this.mostrarEstadisticas(),
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

    mostrarOpcionesRecuperacion() {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        
        const opcionesRecuperacion = [
            {
                texto: '🔄 Reintentar Conexión',
                accion: () => this.obtenerYMostrarPrimeraPregunta(),
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

    // MÉTODOS UTILITARIOS
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
        // Puedes implementar un overlay de carga aquí
        console.log('⏳', mensaje);
    }

    ocultarCargando() {
        console.log('✅ Carga completada');
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

    resetBotCompleto() {
        this.limpiarChat();
        this.limpiarBotones();
        this.resetEstado();
        this.mostrarInterfazInicial();
    }

    calificarDiagnostico(calificacion) {
        const mensajes = {
            'util': 'Sí, fue útil',
            'mejora': 'Necesita mejora'
        };
        
        this.addMessage('user', `⭐ ${mensajes[calificacion]}`);
        this.addMessage('bot', '¡Gracias por tu feedback! Me ayuda a mejorar.');
        
        setTimeout(() => {
            this.mostrarOpcionesPostDiagnostico();
        }, 1000);
    }

    mostrarEstadisticas() {
        this.addMessage('bot', '📊 **ESTADÍSTICAS DE LA SESIÓN**');
        this.addMessage('bot', `• Categoría: ${this.formatearNombreCategoria(this.currentCategory)}`);
        this.addMessage('bot', `• Preguntas respondidas: ${this.userAnswers.length}`);
        this.addMessage('bot', `• Tiempo de sesión: ${Math.round((Date.now() - parseInt(this.sessionId.split('_')[2])) / 1000)} segundos`);
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

    mostrarAyuda() {
        this.addMessage('bot', 'ℹ️ **AYUDA - SISTEMA CYCLOPSBOT**');
        this.addMessage('bot', '1. **Selecciona una categoría** de problema');
        this.addMessage('bot', '2. **Responde las preguntas** con los botones');
        this.addMessage('bot', '3. **Puedes volver atrás** si te equivocas');
        this.addMessage('bot', '4. **Recibe diagnóstico** y soluciones específicas');
        this.addMessage('bot', '5. **Califica el resultado** para mejorar el sistema');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.cyclopsBot = new CyclopsBotReal();
    }, 1000);
});
