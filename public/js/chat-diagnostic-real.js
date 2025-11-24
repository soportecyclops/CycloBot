// chat-diagnostic-real.js - Sistema optimizado
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
        await this.initSupabase()
        this.setupEventListeners()
    }

    async initSupabase() {
        try {
            this.supabase = new SupabaseClient()
            
            // Esperar conexión
            await new Promise((resolve, reject) => {
                const maxWaitTime = 10000 // 10 segundos máximo
                const startTime = Date.now()
                
                const checkConnection = setInterval(() => {
                    if (this.supabase.connected) {
                        clearInterval(checkConnection)
                        resolve()
                        return
                    }
                    
                    if (this.supabase.connected === false || (Date.now() - startTime) > maxWaitTime) {
                        clearInterval(checkConnection)
                        reject(new Error('No se pudo conectar a la base de datos'))
                    }
                }, 100)
            })
            
        } catch (error) {
            console.error('Error inicializando Supabase:', error)
            // El mensaje de error ya lo muestra SupabaseClient
        }
    }

    setupEventListeners() {
        // Los listeners se agregan dinámicamente después de la conexión
    }

    addSystemMessage(text) {
        this.addMessage(text, 'system')
    }

    addBotMessage(text, isQuestion = false) {
        this.addMessage(text, 'bot', isQuestion)
    }

    addUserMessage(text) {
        this.addMessage(text, 'user')
    }

    addMessage(text, type = 'bot', isQuestion = false) {
        const messagesContainer = document.getElementById('chatMessages')
        const messageDiv = document.createElement('div')
        
        let messageHTML = ''
        
        switch(type) {
            case 'bot':
                messageHTML = `<strong><i class="fas fa-robot"></i> CycloBot:</strong><p>${text}</p>`
                if (isQuestion) {
                    messageHTML += `<small><i class="fas fa-clock"></i> Esperando tu respuesta...</small>`
                }
                messageDiv.className = 'message message-bot'
                break
                
            case 'user':
                messageHTML = `<strong><i class="fas fa-user"></i> Tú:</strong><p>${text}</p>`
                messageDiv.className = 'message message-user'
                break
                
            case 'system':
                messageHTML = `<i class="fas fa-database"></i> ${text}`
                messageDiv.className = 'message message-system'
                break
        }
        
        messageDiv.innerHTML = messageHTML
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    async startCategory(category) {
        if (!this.supabase?.connected) {
            this.addBotMessage('❌ No hay conexión con la base de datos.')
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
                this.addBotMessage('❌ No hay problemas configurados para esta categoría.')
                return
            }

            this.addSystemMessage(`✅ ${this.problemFlow.length} problemas cargados`)
            this.currentProblem = this.problemFlow.find(p => p.nivel === 1) || this.problemFlow[0]
            this.showCurrentQuestion()

        } catch (error) {
            console.error('Error cargando problemas:', error)
            this.addBotMessage('❌ Error: ' + error.message)
        }
    }

    showCurrentQuestion() {
        if (!this.currentProblem) {
            this.addBotMessage('No hay más preguntas para tu problema.')
            return
        }

        const problem = this.currentProblem
        this.addBotMessage(problem.preguntas[0], true)
        this.showOptions(problem.respuestas_posibles)
    }

    showOptions(options) {
        const inputArea = document.getElementById('chatInput')
        const optionsContainer = document.getElementById('optionsContainer')
        
        optionsContainer.innerHTML = ''
        
        options.forEach(option => {
            const button = document.createElement('button')
            button.className = 'option-btn'
            button.innerHTML = `<i class="fas fa-reply"></i> ${option}`
            button.addEventListener('click', () => this.handleAnswer(option))
            optionsContainer.appendChild(button)
        })
        
        inputArea.classList.remove('hidden')
    }

    async handleAnswer(answer) {
        this.addUserMessage(answer)
        
        this.conversation.push({
            question: this.currentProblem.preguntas[0],
            answer: answer,
            problemId: this.currentProblem.id
        })

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
            this.addBotMessage('❌ Error: ' + error.message)
        }
    }

    showFinalSolution(problem) {
        this.addBotMessage('✅ ¡Solución encontrada!')
        
        setTimeout(() => {
            const solutionsHTML = problem.soluciones && problem.soluciones.length > 0 ? 
                `<ol>${problem.soluciones.map(sol => `<li>${sol}</li>`).join('')}</ol>` :
                `<p>${problem.causa_probable || 'Consulta con técnico especializado'}</p>`
            
            const solutionHTML = `
                <div class="solution-box">
                    <h4><i class="fas fa-diagnoses"></i> DIAGNÓSTICO FINAL</h4>
                    <p><strong>Causa:</strong> ${problem.causa_probable || 'Identificado'}</p>
                    <h5>Soluciones:</h5>
                    ${solutionsHTML}
                    <small><i class="fas fa-database"></i> Desde Supabase</small>
                    <button class="restart-btn" onclick="window.chatDiagnostic.restartChat()">
                        <i class="fas fa-redo"></i> Nuevo diagnóstico
                    </button>
                </div>
            `
            
            this.addBotMessage(solutionHTML)
        }, 1500)
    }

    showGenericSolution() {
        this.addBotMessage('🔍 Recomendaciones generales:')
        
        setTimeout(() => {
            const solutionHTML = `
                <div class="solution-box">
                    <h4><i class="fas fa-tools"></i> SOLUCIONES GENERALES</h4>
                    <ul>
                        <li>Reiniciar el dispositivo</li>
                        <li>Verificar actualizaciones</li>
                        <li>Diagnóstico del fabricante</li>
                        <li>Contactar soporte técnico</li>
                    </ul>
                    <button class="restart-btn" onclick="window.chatDiagnostic.restartChat()">
                        <i class="fas fa-redo"></i> Nuevo diagnóstico
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
        
        document.getElementById('chatMessages').innerHTML = ''
        document.getElementById('chatInput').classList.add('hidden')
        
        // Reconectar y mostrar categorías
        this.initSupabase()
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.chatDiagnostic = new ChatDiagnosticReal()
})
