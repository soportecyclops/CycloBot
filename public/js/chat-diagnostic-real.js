// chat-diagnostic-real.js - Sistema de diagnóstico con Supabase REAL
class ChatDiagnosticReal {
    constructor() {
        this.supabase = null
        this.currentCategory = null
        this.currentProblem = null
        this.conversation = []
        this.problemFlow = []
        this.init()
    }

    async init() {
        this.setupEventListeners()
        await this.initSupabase()
    }

    async initSupabase() {
        try {
            this.supabase = new SupabaseClient()
            
            // Esperar conexión
            await new Promise((resolve, reject) => {
                const checkConnection = setInterval(() => {
                    if (this.supabase.connected) {
                        clearInterval(checkConnection)
                        resolve()
                    }
                    
                    if (this.supabase.connected === false && this.supabase.client) {
                        clearInterval(checkConnection)
                        reject(new Error('No se pudo conectar a la base de datos'))
                    }
                }, 100)
                
                // Timeout después de 5 segundos
                setTimeout(() => {
                    clearInterval(checkConnection)
                    reject(new Error('Timeout de conexión'))
                }, 5000)
            })
            
        } catch (error) {
            console.error('Error inicializando Supabase:', error)
            this.addSystemMessage('⚠️ ' + error.message)
        }
    }

    setupEventListeners() {
        // Categorías iniciales
        this.attachCategoryListeners()
    }

    attachCategoryListeners() {
        document.querySelectorAll('.option-btn[data-category]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-category')
                this.startCategory(category)
            })
        })
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chatMessages')
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message message-system'
        messageDiv.innerHTML = `<i class="fas fa-database"></i> ${text}`
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    addBotMessage(text, isQuestion = false) {
        const messagesContainer = document.getElementById('chatMessages')
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message message-bot'
        
        let messageHTML = `<strong><i class="fas fa-robot"></i> CycloBot:</strong><p>${text}</p>`
        
        if (isQuestion) {
            messageHTML += `<small><i class="fas fa-clock"></i> Esperando tu respuesta...</small>`
        }
        
        messageDiv.innerHTML = messageHTML
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chatMessages')
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message message-user'
        messageDiv.innerHTML = `<strong><i class="fas fa-user"></i> Tú:</strong><p>${text}</p>`
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    async startCategory(category) {
        if (!this.supabase?.connected) {
            this.addBotMessage('❌ No hay conexión con la base de datos. Verifica la conexión.')
            return
        }

        this.currentCategory = category
        this.conversation = []
        
        const categoryNames = {
            'celulares_moviles': 'Celulares & Móviles',
            'software': 'Software & Programas',
            'hardware': 'Hardware & PC',
            'redes': 'Redes & Internet',
            'seguridad': 'Seguridad & Virus'
        }
        
        this.addUserMessage(`Problema de: ${categoryNames[category] || category}`)

        try {
            this.addSystemMessage('🔍 Consultando base de datos...')
            
            this.problemFlow = await this.supabase.getProblemsByCategory(category)
            
            if (!this.problemFlow || this.problemFlow.length === 0) {
                this.addBotMessage('❌ No hay problemas configurados para esta categoría en la base de datos.')
                this.addBotMessage('💡 Sugerencia: Agrega problemas en tu panel de administración Supabase.')
                return
            }

            this.addSystemMessage(`✅ Base de datos: ${this.problemFlow.length} problemas cargados`)
            this.currentProblem = this.problemFlow.find(p => p.nivel === 1) || this.problemFlow[0]
            this.showCurrentQuestion()

        } catch (error) {
            console.error('Error cargando problemas:', error)
            this.addBotMessage('❌ Error consultando la base de datos: ' + error.message)
        }
    }

    showCurrentQuestion() {
        if (!this.currentProblem) {
            this.addBotMessage('No pude encontrar más preguntas para tu problema.')
            return
        }

        const problem = this.currentProblem
        
        // Mostrar pregunta del bot
        this.addBotMessage(problem.preguntas[0], true)
        
        // Mostrar opciones de respuesta
        this.showOptions(problem.respuestas_posibles)
    }

    showOptions(options) {
        const inputArea = document.getElementById('chatInput')
        const optionsContainer = document.getElementById('optionsContainer')
        
        // Limpiar opciones anteriores
        optionsContainer.innerHTML = ''
        
        // Crear botones de opciones
        options.forEach(option => {
            const button = document.createElement('button')
            button.className = 'option-btn'
            button.innerHTML = `<i class="fas fa-reply"></i> ${option}`
            button.addEventListener('click', () => this.handleAnswer(option))
            optionsContainer.appendChild(button)
        })
        
        // Mostrar área de input
        inputArea.classList.remove('hidden')
    }

    async handleAnswer(answer) {
        // Agregar respuesta del usuario al chat
        this.addUserMessage(answer)
        
        // Guardar en conversación
        this.conversation.push({
            question: this.currentProblem.preguntas[0],
            answer: answer,
            problemId: this.currentProblem.id
        })

        // Ocultar opciones temporalmente
        document.getElementById('chatInput').classList.add('hidden')

        try {
            const nextLevel = this.currentProblem.nivel + 1
            const nextProblem = await this.supabase.getNextProblem(this.currentProblem.id, nextLevel)
            
            if (nextProblem && !nextProblem.es_pregunta_final) {
                this.currentProblem = nextProblem
                setTimeout(() => this.showCurrentQuestion(), 1000)
            } else if (nextProblem && nextProblem.es_pregunta_final) {
                setTimeout(() => this.showFinalSolution(nextProblem), 1000)
            } else {
                setTimeout(() => this.showGenericSolution(), 1000)
            }
            
        } catch (error) {
            console.error('Error en flujo:', error)
            this.addBotMessage('❌ Error en el diagnóstico: ' + error.message)
            setTimeout(() => this.showGenericSolution(), 1000)
        }
    }

    showFinalSolution(problem) {
        this.addBotMessage('✅ ¡Encontré la solución! Analizando tu caso...')
        
        setTimeout(() => {
            let solutionsHTML = ''
            
            if (problem.soluciones && problem.soluciones.length > 0) {
                solutionsHTML = `
                    <h5><i class="fas fa-list-ol"></i> Soluciones paso a paso:</h5>
                    <ol>
                        ${problem.soluciones.map((sol, index) => 
                            `<li>${sol}</li>`
                        ).join('')}
                    </ol>
                `
            } else {
                solutionsHTML = `
                    <h5><i class="fas fa-tools"></i> Solución recomendada:</h5>
                    <p>${problem.causa_probable || 'Consulta con un técnico especializado'}</p>
                `
            }
            
            const solutionHTML = `
                <div class="solution-box">
                    <h4><i class="fas fa-diagnoses"></i> DIAGNÓSTICO FINAL</h4>
                    <p><strong>Causa probable:</strong> ${problem.causa_probable || 'Problema identificado'}</p>
                    
                    ${solutionsHTML}
                    
                    <small><i class="fas fa-database"></i> Solución obtenida de base de datos Supabase</small>
                    
                    <button class="restart-btn" onclick="window.chatDiagnostic.restartChat()">
                        <i class="fas fa-redo"></i> Realizar otro diagnóstico
                    </button>
                </div>
            `
            
            this.addBotMessage(solutionHTML)
        }, 1500)
    }

    showGenericSolution() {
        this.addBotMessage('🔍 Basado en tus respuestas, te recomiendo:')
        
        setTimeout(() => {
            const solutionHTML = `
                <div class="solution-box">
                    <h4><i class="fas fa-tools"></i> SOLUCIONES GENERALES</h4>
                    <ul>
                        <li>Reiniciar el dispositivo</li>
                        <li>Verificar actualizaciones del sistema</li>
                        <li>Ejecutar diagnóstico del fabricante</li>
                        <li>Contactar soporte técnico especializado</li>
                    </ul>
                    
                    <small><i class="fas fa-info-circle"></i> No se encontró una solución específica en la base de datos</small>
                    
                    <button class="restart-btn" onclick="window.chatDiagnostic.restartChat()">
                        <i class="fas fa-redo"></i> Realizar otro diagnóstico
                    </button>
                </div>
            `
            
            this.addBotMessage(solutionHTML)
        }, 1000)
    }

    restartChat() {
        this.currentCategory = null
        this.currentProblem = null
        this.conversation = []
        this.problemFlow = []
        
        const messagesContainer = document.getElementById('chatMessages')
        messagesContainer.innerHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Hola! Soy tu asistente de diagnóstico inteligente. Contame, ¿qué problema tenés?</p>
                <small>Hace clic en una categoría para empezar</small>
            </div>
            <div class="message message-bot">
                <strong><i class="fas fa-folder"></i> Categorías disponibles:</strong>
                <div class="options-grid">
                    <button class="option-btn" data-category="celulares_moviles">
                        <i class="fas fa-mobile-alt"></i> Celulares & Móviles
                    </button>
                    <button class="option-btn" data-category="software">
                        <i class="fas fa-code"></i> Software & Programas
                    </button>
                    <button class="option-btn" data-category="hardware">
                        <i class="fas fa-desktop"></i> Hardware & PC
                    </button>
                    <button class="option-btn" data-category="redes">
                        <i class="fas fa-wifi"></i> Redes & Internet
                    </button>
                    <button class="option-btn" data-category="seguridad">
                        <i class="fas fa-shield-alt"></i> Seguridad
                    </button>
                </div>
            </div>
        `
        
        document.getElementById('chatInput').classList.add('hidden')
        this.attachCategoryListeners()
    }
}

// Inicializar globalmente
let chatDiagnostic

document.addEventListener('DOMContentLoaded', async () => {
    chatDiagnostic = new ChatDiagnosticReal()
    window.chatDiagnostic = chatDiagnostic
})
