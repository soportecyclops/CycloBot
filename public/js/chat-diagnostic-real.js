// CYCLOPSBOT - Motor de Diagnóstico Inteligente con Supabase CORREGIDO
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
        console.log('🚀 Inicializando CyclopsBot Real Corregido...');
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
            const categoriasFallback = ['internet', 'software', 'hardware', 'seguridad'];
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
            'seguridad': '🛡️',
            'celulares_moviles': '📱',
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
            
            const pregunta = await window.SupabaseClient.obtenerSiguientePregunta(this.currentCategory);
            
            if (!pregunta) {
                this.addMessage('bot', '❌ No se encontraron preguntas para esta categoría.');
                this.mostrarOpcionesRecuperacion();
                return;
            }

            await this.mostrarPreguntaConOpciones(pregunta);
            
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
        
        // Mostrar la pregunta
        const textoPregunta = pregunta.preguntas && pregunta.preguntas.length > 0 
            ? pregunta.preguntas[0] 
            : '¿Podrías describir el problema?';
        
        this.addMessage('bot', `❓ **${textoPregunta}**`);
        
        // Mostrar opciones de respuesta
        this.mostrarOpcionesRespuesta(pregunta);
    }

    mostrarOpcionesRespuesta(pregunta) {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        
        // Verificar si hay respuestas posibles
        if (!pregunta.respuestas_posibles || pregunta.respuestas_posibles.length === 0) {
            this.addMessage('bot', '💬 No hay opciones de respuesta definidas para esta pregunta.');
            this.mostrarOpcionesGenericas();
            return;
        }

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
            // Validar que la respuesta no esté vacía
            if (respuesta && respuesta.trim() !== '') {
                const boton = this.crearBotonRespuesta(respuesta, index, () => {
                    this.procesarRespuestaUsuario(respuesta, pregunta);
                });
                gridContainer.appendChild(boton);
            }
        });

        botonesArea.appendChild(gridContainer);

        // Agregar botón para volver atrás si hay historial
        if (this.questionHistory.length > 1) {
            const volverBoton = this.crearBotonVolver();
            botonesArea.appendChild(volverBoton);
        }
    }

    mostrarOpcionesGenericas() {
        const botonesArea = document.getElementById('botonesArea');
        const gridContainer = document.createElement('div');
        gridContainer.className = 'botones-grid';
        
        const opcionesGenericas = [
            { texto: '✅ Sí', valor: 'sí' },
            { texto: '❌ No', valor: 'no' },
            { texto: '🤔 No lo sé', valor: 'no_se' },
            { texto: '🔄 A veces', valor: 'a_veces' }
        ];

        opcionesGenericas.forEach((opcion, index) => {
            const boton = this.crearBotonRespuesta(opcion.texto, index, () => {
                this.procesarRespuestaUsuario(opcion.valor, this.currentQuestion);
            });
            gridContainer.appendChild(boton);
        });

        botonesArea.appendChild(gridContainer);
    }

    obtenerTextoTipoPregunta(tipo) {
        const textos = {
            'booleano': 'Responde Sí o No',
            'opciones': 'Selecciona una opción',
            'multiple': 'Selección múltiple',
            'texto': 'Describe tu respuesta'
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
        const texto = respuesta.toLowerCase();
        
        if (texto.includes('sí') || texto.includes('si') || texto.includes('yes') || texto.includes('true')) return '✅';
        if (texto.includes('no') || texto.includes('not') || texto.includes('false')) return '❌';
        if (texto.includes('tal vez') || texto.includes('maybe') || texto.includes('no sé') || texto.includes('no lo sé')) return '🤔';
        if (texto.includes('siempre') || texto.includes('always')) return '🔄';
        if (texto.includes('nunca') || texto.includes('never')) return '🚫';
        
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

        // Obtener siguiente pregunta basada en la respuesta actual
        setTimeout(async () => {
            await this.obtenerYMostrarSiguientePregunta(pregunta.id);
        }, 800);
    }

    async obtenerYMostrarSiguientePregunta(preguntaAnteriorId = null) {
        try {
            this.mostrarCargando('Buscando siguiente pregunta...');
            
            const siguientePregunta = await window.SupabaseClient.obtenerSiguientePregunta(
                this.currentCategory, 
                preguntaAnteriorId
            );

            if (!siguientePregunta) {
                // No hay más preguntas, mostrar diagnóstico final
                await this.mostrarDiagnosticoFinal();
                return;
            }

            await this.mostrarPreguntaConOpciones(siguientePregunta);
            
            this.ocultarCargando();
            
        } catch (error) {
            console.error('Error obteniendo siguiente pregunta:', error);
            this.addMessage('bot', '❌ Error cargando la siguiente pregunta.');
            this.ocultarCargando();
            this.mostrarOpcionesRecuperacion();
        }
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
        
        // Mostrar causa probable
        if (diagnostico.causa_probable) {
            this.addMessage('bot', `🔍 **Causa Probable:** ${diagnostico.causa_probable}`);
        }
        
        // Mostrar soluciones
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
                texto: '💬 Necesita Mejora', 
                accion: () => this.calificarDiagnostico('mejora'),
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
            },
            {
                texto: '🏠 Volver al Inicio',
                accion: () => this.resetBotCompleto(),
                tipo: 'tertiary'
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
    // Esperar a que Supabase esté listo
    setTimeout(() => {
        window.cyclopsBot = new CyclopsBotReal();
    }, 1000);
});
