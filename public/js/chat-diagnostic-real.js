// chat-diagnostic-real.js - Manteniendo el nombre actual
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
        this.supabase = new SupabaseClient()
        
        // Esperar conexión
        await new Promise(resolve => {
            const checkConnection = setInterval(() => {
                if (this.supabase.connected !== null) {
                    clearInterval(checkConnection)
                    resolve()
                }
            }, 100)
        })
    }

    async startDiagnostic(category) {
        console.log(`🎯 Iniciando diagnóstico: ${category}`)
        
        if (!this.supabase.connected) {
            this.showMessage('❌ No hay conexión con la base de datos', 'bot')
            return
        }

        this.currentCategory = category
        this.conversation = []
        
        this.showMessage(`Problema de: ${this.formatCategoryName(category)}`, 'user')
        this.showMessage('🔍 Buscando soluciones...', 'system')

        try {
            this.problemFlow = await this.supabase.getProblemsByCategory(category)
            
            if (!this.problemFlow || this.problemFlow.length === 0) {
                this.showMessage('❌ No hay problemas para esta categoría', 'bot')
                return
            }

            this.showMessage(`✅ ${this.problemFlow.length} problemas encontrados`, 'system')
            this.currentProblem = this.problemFlow.find(p => p.nivel === 1) || this.problemFlow[0]
            this.showCurrentQuestion()

        } catch (error) {
            console.error('Error:', error)
            this.showMessage('❌ Error: ' + error.message, 'bot')
        }
    }

    showCurrentQuestion() {
        if (!this.currentProblem) return
        
        const problem = this.currentProblem
        this.showMessage(problem.preguntas[0], 'bot', true)
        this.showOptions(problem.respuestas_posibles)
    }

    showOptions(options) {
        const inputArea = document.getElementById('chatInput')
        const optionsContainer = document.getElementById('optionsContainer')
        
        if (!inputArea || !optionsContainer) return
        
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
        this.showMessage(answer, 'user')
        
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
                setTimeout(() => this.showSolution(nextProblem), 1000)
            } else {
                setTimeout(() => this.showGenericSolution(), 1000)
            }
            
        } catch (error) {
            console.error('Error:', error)
            this.showMessage('❌ Error en el diagnóstico', 'bot')
        }
    }

    showSolution(problem) {
        this.showMessage('✅ ¡Solución encontrada!', 'bot')
        
        setTimeout(() => {
            const solutions = problem.soluciones && problem.soluciones.length > 0 ? 
                `<ol>${problem.soluciones.map(sol => `<li>${sol}</li>`).join('')}</ol>` :
                `<p>${problem.causa_probable || 'Consulta con técnico'}</p>`
            
            const solutionHTML = `
                <div class="solution-box">
                    <h4>🎯 Diagnóstico Finalizado</h4>
                    <p><strong>Causa:</strong> ${problem.causa_probable || 'Identificado'}</p>
                    <h5>Soluciones:</h5>
                    ${solutions}
                    <button class="restart-btn" onclick="window.diagnosticSystem.restart()">
                        <i class="fas fa-redo"></i> Nuevo Diagnóstico
                    </button>
                </div>
            `
            
            this.showMessage(solutionHTML, 'bot')
        }, 1500)
    }

    showGenericSolution() {
        this.showMessage('💡 Recomendaciones generales:', 'bot')
        
        setTimeout(() => {
            const solutionHTML = `
                <div class="solution-box">
                    <h4>🔧 Soluciones Generales</h4>
                    <ul>
                        <li>Reiniciar el dispositivo</li>
                        <li>Verificar actualizaciones</li>
                        <li>Ejecutar diagnóstico del fabricante</li>
                        <li>Contactar soporte técnico</li>
                    </ul>
                    <button class="restart-btn" onclick="window.diagnosticSystem.restart()">
                        <i class="fas fa-redo"></i> Nuevo Diagnóstico
                    </button>
                </div>
            `
            
            this.showMessage(solutionHTML, 'bot')
        }, 1000)
    }

    showMessage(text, type = 'bot', isQuestion = false) {
        const messagesContainer = document.getElementById('chatMessages')
        if (!messagesContainer) return
        
        const messageDiv = document.createElement('div')
        
        switch(type) {
            case 'bot':
                messageDiv.className = 'message message-bot'
                messageDiv.innerHTML = `<strong><i class="fas fa-robot"></i> CycloBot:</strong><p>${text}</p>`
                if (isQuestion) messageDiv.innerHTML += `<small>Esperando tu respuesta...</small>`
                break
            case 'user':
                messageDiv.className = 'message message-user'
                messageDiv.innerHTML = `<strong><i class="fas fa-user"></i> Tú:</strong><p>${text}</p>`
                break
            case 'system':
                messageDiv.className = 'message message-system'
                messageDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`
                break
        }
        
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    formatCategoryName(category) {
        const names = {
            'celulares_moviles': 'Celulares',
            'software': 'Software',
            'hardware': 'Hardware',
            'redes': 'Redes'
        }
        return names[category] || category
    }

    restart() {
        this.currentCategory = null
        this.currentProblem = null
        this.conversation = []
        this.problemFlow = []
        
        const messagesContainer = document.getElementById('chatMessages')
        const inputArea = document.getElementById('chatInput')
        
        if (messagesContainer) messagesContainer.innerHTML = ''
        if (inputArea) inputArea.classList.add('hidden')
        
        // Reconectar
        this.supabase.showConnectionSuccess()
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.diagnosticSystem = new DiagnosticChat()
})
