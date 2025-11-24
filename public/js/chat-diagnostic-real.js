// CYCLOPSBOT - Motor de Diagnóstico Inteligente FINAL
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
        console.log('🚀 Inicializando CyclopsBot Final...');
        await this.verificarSistema();
        this.setupEventListeners();
        this.mostrarInterfazInicial();
    }

    async verificarSistema() {
        try {
            const conexion = await window.SupabaseClient.verificarConexionSupabase();
            this.actualizarEstadoSistema(conexion.success);
            
            if (conexion.success) {
                // Cargar estadísticas iniciales
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
            const categoriasFallback = ['internet', 'software', 'hardware', 'movil', 'seguridad_digital'];
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
            'seguridad_digital': '🛡️',
            'celulares_moviles': '📱',
            'software_sistema': '⚙️',
            'internet_red': '📡',
            'hardware_pc': '💻',
            'perifericos': '🖱️',
            'almacenamiento_backups': '💾'
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
            this.mostrarCargando('Cargando diagnóstico...');
            
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            
            if (!problemas || problemas.length === 0) {
                this.addMessage('bot', '❌ No se encontraron problemas para esta categoría.');
                this.mostrarOpcionesRecuperacion();
                return;
            }

            // Seleccionar pregunta inicial
            const preguntaInicial = problemas[0];
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
        
        // Obtener opciones (ya procesadas desde Supabase)
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

        // Simular flujo de diagnóstico
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
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            if (problemas && problemas.length > 1) {
                const siguienteIndex = (problemas.findIndex(p => p.id === this.currentQuestion.id) + 1) % problemas.length;
                const siguientePregunta = problemas[siguienteIndex];
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
            this.mostrarCargando('Generando diagnóstico...');
            
            const problemas = await window.SupabaseClient.obtenerProblemasPorCategoria(this.currentCategory);
            const diagnostico = problemas && problemas.length > 0 ? problemas[0] : null;

            if (diagnostico) {
                await this.mostrarDiagnosticoCompleto(diagnostico);
            } else {
                this.mostrarDiagnosticoGenerico();
            }
            
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
        this.mostrarSolucionesGenericas();
        this.mostrarOpcionesPostDiagnostico();
    }

    mostrarSolucionesGenericas() {
        this.addMessage('bot', '💡 **Acciones Recomendadas:**');
        this.addMessage('bot', '1. **Reinicia el dispositivo** - Solución simple pero efectiva');
        this.addMessage('bot', '2. **Verifica conexiones** - Cables, WiFi, alimentación');
        this.addMessage('bot', '3. **Actualiza software** - Sistema y controladores');
        this.addMessage('bot', '4. **Ejecuta herramientas** - Diagnóstico del sistema');
        this.addMessage('bot', '5. **Consulta especialista** - Si persiste el problema');
    }

    mostrarOpcionesPostDiagnostico() {
        this.limpiarBotones();
        
        const botonesArea = document.getElementById('botonesArea');
        
        const opciones = [
            { texto: '🔄 Nuevo Diagnóstico', accion: () => this.nuevoDiagnostico(), tipo: 'primary' },
            { texto: '⭐ Fue Útil', accion: () => this.calificarDiagnostico('util'), tipo: 'success' },
            { texto: '📊 Estadísticas', accion: () => this.mostrarEstadisticas(), tipo: 'secondary' }
        ];
        
        opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.className = `cyber-btn ${opcion.tipo}`;
            boton.innerHTML = opcion.texto;
            boton.addEventListener('click', opcion.accion);
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

    // ... (resto de métodos utilitarios iguales)
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.cyclopsBot = new CyclopsBotReal();
    }, 1000);
});
