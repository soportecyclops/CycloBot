// diagnostic-chat.js - Sistema robusto con manejo de errores
class DiagnosticChat {
    constructor() {
        this.supabase = null
        this.currentCategory = null
        this.currentProblem = null
        this.conversation = []
        this.problemFlow = []
        this.init()
    }

    async init() {
        console.log('💬 Inicializando sistema de chat...')
        await this.initializeSupabase()
    }

    async initializeSupabase() {
        try {
            this.supabase = new SupabaseClient()
            
            // Esperar inicialización
            await new Promise((resolve) => {
                const maxWaitTime = 10000 // 10 segundos
                const startTime = Date.now()
                
                const checkInit = setInterval(() => {
                    if (this.supabase.connected !== null) {
                        clearInterval(checkInit)
                        resolve()
                        return
                    }
                    
                    if (Date.now() - startTime > maxWaitTime) {
                        clearInterval(checkInit)
                        this.showMessage('⏰ Timeout de inicialización', 'system')
                        resolve()
                    }
                }, 100)
            })
            
        } catch (error) {
            console.error('Error en inicialización:', error)
            this.showMessage('❌ Error inicializando el sistema', 'system')
        }
    }

    async startDiagnostic(category) {
        console.log('🎯 Iniciando diagnóstico para:', category)
        
        if (!this.supabase?.connected) {
            this.showMessage('❌ Sistema no conectado. Espera a que se establezca la conexión.', 'bot')
            return
        }

        this.currentCategory = category
        this.conversation = []
        
        const categoryNames = {
            'celulares_moviles': '📱 Celulares y Móviles',
            'software': '💻 Software y Programas',
            'hardware': '🖥️ Hardware y PC', 
            'redes': '🌐 Redes e Internet'
        }
        
        this.showMessage(`Problema de: ${categoryNames[category] || category}`, 'user')
        this.showMessage('🔍 Buscando soluciones en la base de datos...', 'system')

        try {
            this.problemFlow = await this.supabase.getProblemsByCategory(category)
            
            if (!this.problemFlow || this.problemFlow.length === 0) {
                this.showMessage('❌ No se encontraron problemas para esta categoría.', 'bot')
                this.showMessage('💡 Sugerencia: Agrega problemas desde el panel de administración.', 'bot')
                return
            }

            this.showMessage(`✅ Encontrados ${this.problemFlow.length} problemas`, 'system')
            this.currentProblem = this.problemFlow.find(p => p.nivel === 1) || this.problemFlow[0]
            this.showCurrentQuestion()

        } catch (error) {
            console.error('Error cargando problemas:', error)
            this.showMessage('❌ Error al cargar los problemas: ' + error.message, 'bot')
        }
    }

    showCurrentQuestion() {
        if (!this.currentProblem) {
            this.showMessage('No hay preguntas disponibles para mostrar.', 'bot')
            return
        }

        const problem = this.currentProblem
        this.showMessage(problem.preguntas[0], 'bot', true)
        this.showResponseOptions(problem.respuestas_posibles)
    }

    showResponseOptions(options) {
        const inputArea = document.getElementById('chatInput')
        const optionsContainer = document.getElementById('optionsContainer')
        
        if (!inputArea || !optionsContainer) {
            console.error('❌ Elementos del DOM no encontrados')
            return
        }
        
        // Limpiar opciones anteriores
        optionsContainer.innerHTML = ''
        
        // Crear botones de opciones
        options.forEach((option, index) => {
            const button = document.createElement('button')
            button.className = 'option-btn'
            button.innerHTML = `<i class="fas fa-reply"></i> ${option}`
            button.addEventListener('click', () => this.handleUserResponse(option))
            optionsContainer.appendChild(button)
        })
        
        // Mostrar área de input
        inputArea.classList.remove('hidden')
    }

    async handleUserResponse(answer) {
        console.log('👤 Respuesta del usuario:', answer)
        
        this.showMessage(answer, 'user')
        
        // Guardar en historial
        this.conversation.push({
            question: this.currentProblem.preguntas[0],
            answer: answer,
            problemId: this.currentProblem.id,
            timestamp: new Date().toISOString()
        })

        // Ocultar opciones temporalmente
        document.getElementById('chatInput').classList.add('hidden')

        try {
            const nextLevel = this.currentProblem.nivel + 1
            const nextProblem = await this.supabase.getNextProblem(this.currentProblem.id, nextLevel)
            
            console.log('➡️ Siguiente problema:', nextProblem)
            
            if (nextProblem && !nextProblem.es_pregunta_final) {
                this.currentProblem = nextProblem
                setTimeout(() => this.showCurrentQuestion(), 1000)
            } else if (nextProblem && nextProblem.es_pregunta_final) {
                setTimeout(() => this.showFinalSolution(nextProblem), 1000)
            } else {
                setTimeout(() => this.showGenericSolution(), 1000)
            }
            
        } catch (error) {
            console.error('Error en flujo de diagnóstico:', error)
            this.showMessage('❌ Error en el proceso de diagnóstico', 'bot')
            setTimeout(() => this.showGenericSolution(), 1000)
        }
    }

    showFinalSolution(problem) {
        this.showMessage('✅ ¡Perfecto! Encontré la solución a tu problema.', 'bot')
        
        setTimeout(() => {
            let solutionsHTML = ''
            
            if (problem.soluciones && problem.soluciones.length > 0) {
                solutionsHTML = `
                    <h5>🛠️ Pasos a seguir:</h5>
                    <ol>
                        ${problem.soluciones.map((sol, index) => 
                            `<li>${sol}</li>`
                        ).join('')}
                    </ol>
                `
            } else {
                solutionsHTML = `
                    <h5>💡 Recomendación:</h5>
                    <p>${problem.causa_probable || 'Se recomienda contactar con un técnico especializado para este tipo de problema.'}</p>
                `
            }
            
            const solutionHTML = `
                <div class="solution-box">
                    <h4>🎯 Diagnóstico Finalizado</h4>
                    <p><strong>📋 Causa identificada:</strong> ${problem.causa_probable || 'Problema específico del sistema'}</p>
                    ${solutionsHTML}
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155;">
                        <small><i class="fas fa-database"></i> Solución obtenida de la base de datos | </small>
                        <small><i class="fas fa-history"></i> ${this.conversation.length} preguntas realizadas</small>
                    </div>
                    <button class="restart-btn" onclick="window.diagnosticSystem.restartDiagnostic()">
                        <i class="fas fa-redo"></i> Realizar otro diagnóstico
                    </button>
                </div>
            `
            
            this.showMessage(solutionHTML, 'bot')
        }, 1500)
    }

    showGenericSolution() {
        this.showMessage('🔍 Basado en tus respuestas, te recomiendo:', 'bot')
        
        setTimeout(() => {
            const solutionHTML = `
                <div class="solution-box">
                    <h4>💡 Soluciones Generales</h4>
                    <ul>
                        <li>🔄 <strong>Reiniciar el dispositivo</strong> - Soluciona muchos problemas temporales</li>
                        <li>📲 <strong>Verificar actualizaciones</strong> - Asegurate de tener la versión más reciente</li>
                        <li>🔧 <strong>Diagnóstico del fabricante</strong> - Ejecuta las herramientas oficiales</li>
                        <li>👨‍💻 <strong>Contactar soporte técnico</strong> - Para problemas complejos</li>
                    </ul>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155;">
                        <small><i class="fas fa-info-circle"></i> No se encontró una solución específica en la base de datos</small>
                    </div>
                    <button class="restart-btn" onclick="window.diagnosticSystem.restartDiagnostic()">
                        <i class="fas fa-redo"></i> Intentar con otro problema
                    </button>
                </div>
            `
            
            this.showMessage(solutionHTML, 'bot')
        }, 1000)
    }

    showMessage(text, type = 'bot', isQuestion = false) {
        const messagesContainer = document.getElementById('chatMessages')
        if (!messagesContainer) {
            console.error('❌ chatMessages no encontrado')
            return
        }
        
        const messageDiv = document.createElement('div')
        let messageHTML = ''
        
        switch(type) {
            case 'bot':
                messageDiv.className = 'message message-bot'
                messageHTML = `<strong><i class="fas fa-robot"></i> CycloBot:</strong><p>${text}</p>`
                if (isQuestion) {
                    messageHTML += `<small><i class="fas fa-clock"></i> Esperando tu respuesta...</small>`
                }
                break
                
            case 'user':
                messageDiv.className = 'message message-user'
                messageHTML = `<strong><i class="fas fa-user"></i> Tú:</strong><p>${text}</p>`
                break
                
            case 'system':
                messageDiv.className = 'message message-system'
                messageHTML = `<i class="fas fa-cog"></i> ${text}`
                break
        }
        
        messageDiv.innerHTML = messageHTML
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    restartDiagnostic() {
        console.log('🔄 Reiniciando diagnóstico...')
        
        this.currentCategory = null
        this.currentProblem = null
        this.conversation = []
        this.problemFlow = []
        
        const messagesContainer = document.getElementById('chatMessages')
        const inputArea = document.getElementById('chatInput')
        
        if (messagesContainer) messagesContainer.innerHTML = ''
        if (inputArea) inputArea.classList.add('hidden')
        
        // Mostrar categorías nuevamente
        if (this.supabase) {
            this.supabase.showConnectionSuccess()
        }
    }

    // Método para debugging
    getSystemStatus() {
        return {
            supabaseConnected: this.supabase?.connected || false,
            currentCategory: this.currentCategory,
            currentProblem: this.currentProblem?.id || null,
            conversationLength: this.conversation.length,
            problemFlowLength: this.problemFlow.length
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.diagnosticSystem = new DiagnosticChat()
    console.log('🚀 Sistema de diagnóstico cargado')
    
    // Exponer métodos de debug
    window.getDiagnosticStatus = () => window.diagnosticSystem.getSystemStatus()
    window.forceReconnect = () => window.diagnosticSystem.initializeSupabase()
})
