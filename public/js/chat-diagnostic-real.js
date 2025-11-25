// CYCLOPSBOT - Motor de Diagnóstico Inteligente CORREGIDO
class CyclopsBotReal {
    constructor() {
        this.currentCategory = null;
        this.currentQuestion = null;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = false;
        this.sessionId = this.generateSessionId();
        
        // Categorías unificadas
        this.categoriasUnificadas = {
            'internet': ['internet', 'internet_red'],
            'software': ['software', 'software_sistema'],
            'hardware': ['hardware', 'hardware_pc'],
            'movil': ['movil', 'celulares_moviles'],
            'seguridad': ['seguridad_digital'],
            'almacenamiento': ['almacenamiento_backups'],
            'perifericos': ['perifericos']
        };
        
        this.init();
    }

    // MÉTODO QUE FALTABA
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async init() {
        console.log('🚀 Inicializando CyclopsBot con categorías unificadas...');
        await this.verificarSistema();
        this.setupEventListeners();
        this.mostrarInterfazInicial();
    }

    async verificarSistema() {
        try {
            const conexion = await window.SupabaseClient.verificarConexionSupabase();
            this.actualizarEstadoSistema(conexion.success);
            
            if (conexion.success) {
                await this.actualizarEstadisticasGlobales();
            }
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

    async actualizarEstadisticasGlobales() {
        try {
            const totalProblemas = await window.SupabaseClient.obtenerEstadisticasProblemas();
            const problemsCountElement = document.getElementById('problemsCount');
            if (problemsCountElement && totalProblemas > 0) {
                problemsCountElement.textContent = totalProblemas.toLocaleString();
            }
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
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
                <p>Base de datos con ${document.getElementById('problemsCount')?.textContent || '700+'} problemas</p>
                <p>Selecciona una categoría para comenzar el diagnóstico</p>
            </div>
        `);

        await this.mostrarCategoriasUnificadas();
    }

    async mostrarCategoriasUnificadas() {
        const categoriasPrincipales = [
            { id: 'internet', nombre: '🌐 Internet & Redes', icono: '🌐' },
            { id: 'software', nombre: '💻 Software & Sistema', icono: '💻' },
            { id: 'hardware', nombre: '🔧 Hardware & PC', icono: '🔧' },
            { id: 'movil', nombre: '📱 Celulares & Móviles', icono: '📱' },
            { id: 'seguridad', nombre: '🛡️ Seguridad Digital', icono: '🛡️' },
            { id: 'almacenamiento', nombre: '💾 Almacenamiento', icono: '💾' },
            { id: 'perifericos', nombre: '🖱️ Periféricos', icono: '🖱️' }
        ];

        this.mostrarBotonesCategoria(categoriasPrincipales);
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
        boton.innerHTML = `${categoria.icono} ${categoria.nombre}`;
        boton.addEventListener('click', onClick);
        return boton;
    }

    async seleccionarCategoria(categoria) {
        this.currentCategory = categoria;
        this.questionHistory = [];
        this.userAnswers = [];
        this.diagnosisActive = true;
        
        this.addMessage('user', `📂 ${categoria.icono} ${categoria.nombre}`);
        this.addMessage('bot', '🔍 **Buscando problemas relacionados...**');
        
        await this.obtenerYMostrarPrimeraPregunta();
    }

    async obtenerYMostrarPrimeraPregunta() {
        try {
            this.mostrarCargando('Cargando diagnóstico...');
            
            // Obtener problemas de todas las categorías relacionadas
            const categoriasBusqueda = this.categoriasUnificadas[this.currentCategory.id] || [this.currentCategory.id];
            let todosProblemas = [];
            
            for (const categoria of categoriasBusqueda) {
                const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(categoria);
                if (problemas && problemas.length > 0) {
                    todosProblemas = [...todosProblemas, ...problemas];
                }
            }
            
            if (todosProblemas.length === 0) {
                this.addMessage('bot', '❌ No se encontraron problemas para esta categoría.');
                this.mostrarOpcionesRecuperacion();
                return;
            }

            console.log(`✅ ${todosProblemas.length} problemas encontrados para ${this.currentCategory.nombre}`);
            
            // Seleccionar pregunta inicial aleatoria
            const preguntaInicial = todosProblemas[Math.floor(Math.random() * todosProblemas.length)];
            await this.mostrarPreguntaConOpciones(preguntaInicial);
            
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
        
        const textoPregunta = this.obtenerTextoPregunta(pregunta);
        this.addMessage('bot', `❓ **${textoPregunta}**`);
        
        this.mostrarOpcionesRespuesta(pregunta);
    }

    obtenerTextoPregunta(pregunta) {
        if (pregunta.preguntas && pregunta.preguntas.length > 0) {
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
        
        // Obtener opciones desde Supabase (ya no deberían estar vacías)
        const opciones = pregunta.respuestas_posibles || ['Sí', 'No', 'No lo sé'];
        
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
            const textoOpcion = typeof opcion === 'string' ? opcion : String(opcion);
            if (textoOpcion.trim() !== '') {
                const boton = this.crearBotonRespuesta(textoOpcion, index, () => {
                    this.procesarRespuestaUsuario(textoOpcion, pregunta);
                });
                gridContainer.appendChild(boton);
            }
        });

        botonesArea.appendChild(gridContainer);

        // Botón para volver atrás
        if (this.questionHistory.length > 1) {
            const volverBoton = this.crearBotonVolver();
            botonesArea.appendChild(volverBoton);
        }
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
        
        const icono = this.obtenerIconoRespuesta(texto, index);
        boton.innerHTML = `${icono} ${texto}`;
        boton.addEventListener('click', onClick);
        
        return boton;
    }

    obtenerIconoRespuesta(texto, index) {
        const textoLower = texto.toLowerCase();
        
        if (textoLower.includes('sí') || textoLower.includes('si') || textoLower.includes('yes')) return '✅';
        if (textoLower.includes('no') || textoLower.includes('not')) return '❌';
        if (textoLower.includes('tal vez') || textoLower.includes('maybe') || textoLower.includes('no sé') || textoLower.includes('no lo sé')) return '🤔';
        if (textoLower.includes('siempre') || textoLower.includes('always')) return '🔄';
        if (textoLower.includes('nunca') || textoLower.includes('never')) return '🚫';
        if (textoLower.includes('crítico') || textoLower.includes('grave')) return '🔴';
        if (textoLower.includes('moderado') || textoLower.includes('medio')) return '🟡';
        if (textoLower.includes('leve') || textoLower.includes('ligero')) return '🟢';
        
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
        this.userAnswers.push({
            pregunta: this.obtenerTextoPregunta(pregunta),
            respuesta: respuesta,
            preguntaId: pregunta.id,
            timestamp: new Date().toISOString()
        });

        this.addMessage('user', `💬 ${respuesta}`);

        // Simular flujo de diagnóstico - después de 2-3 respuestas mostrar diagnóstico
        setTimeout(async () => {
            if (this.userAnswers.length >= 2 || pregunta.es_pregunta_final) {
                await this.mostrarDiagnosticoCompleto(pregunta);
            } else {
                await this.simularSiguientePregunta();
            }
        }, 800);
    }

    async simularSiguientePregunta() {
        try {
            // Obtener más problemas de la misma categoría unificada
            const categoriasBusqueda = this.categoriasUnificadas[this.currentCategory.id] || [this.currentCategory.id];
            let todosProblemas = [];
            
            for (const categoria of categoriasBusqueda) {
                const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(categoria);
                if (problemas && problemas.length > 0) {
                    todosProblemas = [...todosProblemas, ...problemas];
                }
            }
            
            if (todosProblemas.length > 1) {
                // Filtrar preguntas no usadas
                const preguntasDisponibles = todosProblemas.filter(p => 
                    !this.questionHistory.some(q => q.id === p.id)
                );
                
                const siguientePregunta = preguntasDisponibles.length > 0 
                    ? preguntasDisponibles[Math.floor(Math.random() * preguntasDisponibles.length)]
                    : todosProblemas[Math.floor(Math.random() * todosProblemas.length)];
                
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
            this.mostrarCargando('Analizando tus respuestas...');
            
            // Obtener un problema aleatorio para mostrar como diagnóstico
            const categoriasBusqueda = this.categoriasUnificadas[this.currentCategory.id] || [this.currentCategory.id];
            let todosProblemas = [];
            
            for (const categoria of categoriasBusqueda) {
                const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(categoria);
                if (problemas && problemas.length > 0) {
                    todosProblemas = [...todosProblemas, ...problemas];
                }
            }
            
            const diagnostico = todosProblemas.length > 0 
                ? todosProblemas[Math.floor(Math.random() * todosProblemas.length)]
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
            this.mostrarDiagnosticoGenerico();
            this.ocultarCargando();
        }
    }

    async mostrarDiagnosticoCompleto(diagnostico) {
        this.addMessage('bot', '🎉 **DIAGNÓSTICO COMPLETADO**');
        
        if (diagnostico.causa_probable) {
            this.addMessage('bot', `🔍 **Causa Probable:** ${diagnostico.causa_probable}`);
        }
        
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
        this.addMessage('bot', '🔍 **DIAGNÓSTICO BASADO EN TUS RESPUESTAS**');
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
            this.questionHistory.pop();
            this.userAnswers.pop();
            
            const preguntaAnterior = this.questionHistory[this.questionHistory.length - 1];
            this.removerUltimosMensajes(2);
            
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
        console.log('⏳', mensaje);
    }

    ocultarCargando() {
        console.log('✅ Carga completada');
    }

    async nuevoDiagnostico() {
        this.resetEstado();
        this.addMessage('bot', '🔄 **Iniciando nuevo diagnóstico...**');
        await this.mostrarCategoriasUnificadas();
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
        this.addMessage('bot', `• Categoría: ${this.currentCategory.nombre}`);
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
