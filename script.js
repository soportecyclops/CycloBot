class CyclopsBot {
    constructor() {
        this.knowledgeBase = null;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        this.diagnosisActive = false;
        this.diagnosticsCount = 0;
        
        this.initializeBot();
        this.loadKnowledgeBase();
        this.setupEventListeners();
        this.updateStats();
    }

    async loadKnowledgeBase() {
        try {
            const response = await fetch('knowledge_base.json');
            this.knowledgeBase = await response.json();
            this.updateStats();
            console.log('Base de conocimiento cargada:', this.knowledgeBase);
        } catch (error) {
            console.error('Error cargando la base de conocimiento:', error);
            this.addMessage('bot', 'Error al cargar la base de conocimiento. Por favor, recarga la página.');
        }
    }

    initializeBot() {
        this.addMessage('bot', '¡Hola! Soy CyclopsBot, tu asistente técnico personal.');
        this.addMessage('bot', 'Voy a hacerte algunas preguntas para diagnosticar tu problema. Piensa en el problema que tienes y yo intentaré adivinarlo.');
        this.addMessage('bot', '¿Estás listo para comenzar?');
    }

    setupEventListeners() {
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const quickButtons = document.querySelectorAll('.quick-btn');

        // Enviar mensaje con Enter
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });

        // Enviar mensaje con botón
        sendButton.addEventListener('click', () => {
            this.handleUserInput();
        });

        // Botones rápidos
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleUserInput() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (message === '') return;

        this.addMessage('user', message);
        userInput.value = '';

        if (!this.diagnosisActive) {
            this.startDiagnosis();
        } else {
            this.processAnswer(message);
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'start':
                this.startDiagnosis();
                break;
            case 'reset':
                this.resetBot();
                break;
        }
    }

    startDiagnosis() {
        this.diagnosisActive = true;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        
        this.addMessage('bot', 'Perfecto. Comencemos con el diagnóstico.');
        this.addMessage('bot', 'Por favor, describe brevemente el problema que estás experimentando:');
    }

    processAnswer(answer) {
        if (!this.currentCategory) {
            // Primera respuesta: identificar categoría
            this.identifyCategory(answer);
        } else if (!this.currentProblem) {
            // Segunda respuesta: identificar problema específico
            this.identifyProblem(answer);
        } else {
            // Respuestas a preguntas específicas del problema
            this.processProblemAnswer(answer);
        }
    }

    identifyCategory(userInput) {
        const input = userInput.toLowerCase();
        let matchedCategory = null;
        let bestMatchScore = 0;

        // Buscar coincidencias en categorías
        for (const category in this.knowledgeBase) {
            const categoryKeywords = this.getCategoryKeywords(category);
            let score = 0;

            categoryKeywords.forEach(keyword => {
                if (input.includes(keyword)) {
                    score += 1;
                }
            });

            if (score > bestMatchScore) {
                bestMatchScore = score;
                matchedCategory = category;
            }
        }

        if (matchedCategory) {
            this.currentCategory = matchedCategory;
            this.addMessage('bot', `Entiendo. Parece ser un problema relacionado con ${this.getCategoryDisplayName(matchedCategory)}.`);
            this.presentProblems(matchedCategory);
        } else {
            this.addMessage('bot', 'No estoy seguro de entender el tipo de problema. ¿Podrías ser más específico? Por ejemplo: "problema de WiFi", "falla en el hardware", etc.');
        }
    }

    identifyProblem(userInput) {
        const input = userInput.toLowerCase();
        const problems = this.knowledgeBase[this.currentCategory];
        let matchedProblem = null;
        let bestMatchScore = 0;

        for (const problemKey in problems) {
            const problem = problems[problemKey];
            let score = 0;

            // Buscar en las preguntas y soluciones
            problem.preguntas.forEach(pregunta => {
                if (this.containsKeywords(input, pregunta)) {
                    score += 1;
                }
            });

            if (score > bestMatchScore) {
                bestMatchScore = score;
                matchedProblem = problemKey;
            }
        }

        if (matchedProblem) {
            this.currentProblem = matchedProblem;
            this.currentQuestionIndex = 0;
            this.askNextQuestion();
        } else {
            this.addMessage('bot', 'No logro identificar exactamente el problema. ¿Podrías describirlo de otra manera?');
            this.presentProblems(this.currentCategory);
        }
    }

    processProblemAnswer(answer) {
        const problem = this.knowledgeBase[this.currentCategory][this.currentProblem];
        
        if (this.currentQuestionIndex < problem.preguntas.length - 1) {
            this.currentQuestionIndex++;
            this.askNextQuestion();
        } else {
            this.provideSolution();
        }
    }

    presentProblems(category) {
        const problems = this.knowledgeBase[category];
        let message = `Problemas comunes de ${this.getCategoryDisplayName(category)}:\n\n`;
        
        Object.keys(problems).forEach((problemKey, index) => {
            const problem = problems[problemKey];
            // Usar la primera pregunta como descripción del problema
            const description = problem.preguntas[0].replace('¿', '').replace('?', '');
            message += `${index + 1}. ${description}\n`;
        });
        
        message += '\n¿Cuál de estos problemas se parece más al tuyo? (Responde con el número o descríbelo)';
        this.addMessage('bot', message);
    }

    askNextQuestion() {
        const problem = this.knowledgeBase[this.currentCategory][this.currentProblem];
        const question = problem.preguntas[this.currentQuestionIndex];
        this.addMessage('bot', question);
    }

    provideSolution() {
        const problem = this.knowledgeBase[this.currentCategory][this.currentProblem];
        this.addMessage('bot', '¡Perfecto! Basándome en tus respuestas, aquí están las soluciones recomendadas:');
        
        problem.soluciones.forEach((solucion, index) => {
            this.addMessage('bot', `${index + 1}. ${solucion}`);
        });
        
        this.addMessage('bot', '¿Te fue útil esta solución? Si el problema persiste, puedes reiniciar el diagnóstico.');
        
        // Registrar la consulta
        this.logConsultation(
            `Problema: ${this.currentCategory} - ${this.currentProblem}`,
            problem.soluciones.join(' | ')
        );
        
        this.diagnosticsCount++;
        this.updateStats();
        this.diagnosisActive = false;
    }

    logConsultation(consulta, respuesta) {
        fetch('log_consulta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                consulta: consulta,
                respuesta: respuesta
            })
        }).catch(error => {
            console.error('Error registrando consulta:', error);
        });
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'bot') {
            avatarDiv.innerHTML = '<div class="mini-eye"></div>';
        } else {
            avatarDiv.innerHTML = '👤';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Procesar contenido con saltos de línea
        const paragraphs = content.split('\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() !== '') {
                const p = document.createElement('p');
                p.textContent = paragraph;
                contentDiv.appendChild(p);
            }
        });
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    resetBot() {
        this.diagnosisActive = false;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentQuestionIndex = 0;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.initializeBot();
    }

    updateStats() {
        const problemsCount = document.getElementById('problemsCount');
        const diagnosticsCount = document.getElementById('diagnosticsCount');
        
        if (this.knowledgeBase) {
            let totalProblems = 0;
            for (const category in this.knowledgeBase) {
                totalProblems += Object.keys(this.knowledgeBase[category]).length;
            }
            problemsCount.textContent = totalProblems;
        }
        
        diagnosticsCount.textContent = this.diagnosticsCount;
    }

    // Métodos auxiliares
    getCategoryKeywords(category) {
        const keywordMap = {
            'internet': ['internet', 'wifi', 'red', 'conexión', 'online', 'navegador', 'web'],
            'hardware': ['hardware', 'disco', 'memoria', 'procesador', 'teclado', 'mouse', 'monitor', 'impresora'],
            'software': ['software', 'programa', 'aplicación', 'windows', 'mac', 'linux', 'virus', 'malware'],
            'movil': ['móvil', 'celular', 'teléfono', 'android', 'iphone', 'tablet', 'app']
        };
        
        return keywordMap[category] || [category];
    }

    getCategoryDisplayName(category) {
        const displayNames = {
            'internet': 'Internet y Redes',
            'hardware': 'Hardware',
            'software': 'Software',
            'movil': 'Dispositivos Móviles'
        };
        
        return displayNames[category] || category;
    }

    containsKeywords(text, phrase) {
        const words = phrase.toLowerCase().split(' ');
        return words.some(word => text.includes(word) && word.length > 3);
    }
}

// Inicializar el bot cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CyclopsBot();
});