// CYCLOPSBOT v3.1 - Motor de Diagnóstico Inteligente
// Sistema Akinator-style completamente funcional

class DiagnosticChat {
    constructor() {
        this.currentQuestion = null;
        this.questionHistory = [];
        this.currentCategory = null;
        this.userResponses = [];
        this.diagnosticState = 'category_selection'; // category_selection, in_progress, completed
        this.possibleProblems = [];
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Motor de Diagnóstico v3.1');
        this.setupEventListeners();
        await this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Los eventos se manejan a través del script principal
        console.log('✅ Event listeners configurados');
    }

    async showWelcomeMessage() {
        const messagesContainer = document.getElementById('messages-container');
        const responsesContainer = document.getElementById('responses-container');
        
        // Limpiar contenedores
        messagesContainer.innerHTML = '';
        responsesContainer.innerHTML = '';

        // Mostrar mensaje de bienvenida
        this.addMessage('CycloBot', '¡Sistema listo! Base de datos conectada.', 'bot');
        this.addMessage('CycloBot', '¿En qué puedo ayudarte?', 'bot');
        
        // Cargar y mostrar categorías
        await this.loadAndDisplayCategories();
    }

    async loadAndDisplayCategories() {
        try {
            showLoading('Cargando categorías...');
            
            const { data: categories, error } = await supabase
                .from('problemas')
                .select('categoria')
                .not('categoria', 'is', null);

            if (error) throw error;

            // Obtener categorías únicas
            const uniqueCategories = [...new Set(categories.map(item => item.categoria))];
            
            this.displayCategories(uniqueCategories);
            hideLoading();
            
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.addMessage('CycloBot', '❌ Error cargando categorías. Intentando recuperar...', 'bot');
            hideLoading();
            
            // Fallback a categorías predefinidas
            const fallbackCategories = ['internet', 'celulares_moviles', 'software', 'hardware'];
            this.displayCategories(fallbackCategories);
        }
    }

    displayCategories(categories) {
        const responsesContainer = document.getElementById('responses-container');
        responsesContainer.innerHTML = '';

        // Título de categorías
        const title = document.createElement('div');
        title.className = 'response-section-title';
        title.innerHTML = '<i class="fas fa-folder-open"></i> Selecciona una categoría:';
        responsesContainer.appendChild(title);

        // Botones de categorías
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'cyber-response-button category-button';
            button.innerHTML = `
                <i class="fas fa-folder"></i>
                ${this.formatCategoryName(category)}
            `;
            button.onclick = () => this.startDiagnosticForCategory(category);
            responsesContainer.appendChild(button);
        });

        // Actualizar sidebar
        this.updateCategoriesSidebar(categories);
    }

    updateCategoriesSidebar(categories) {
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = '';

        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-sidebar-item';
            categoryElement.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${this.formatCategoryName(category)}</span>
            `;
            categoryElement.onclick = () => this.startDiagnosticForCategory(category);
            categoriesList.appendChild(categoryElement);
        });
    }

    formatCategoryName(category) {
        return category.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async startDiagnosticForCategory(category) {
        this.currentCategory = category;
        this.diagnosticState = 'in_progress';
        this.questionHistory = [];
        this.userResponses = [];

        this.addMessage('Tú', `Problema de: ${this.formatCategoryName(category)}`, 'user');
        
        await this.loadFirstQuestion(category);
    }

    async loadFirstQuestion(category) {
        try {
            showLoading('Buscando problemas...');
            
            const { data: problems, error } = await supabase
                .from('problemas')
                .select('*')
                .eq('categoria', category)
                .eq('nivel', 1)
                .order('id');

            if (error) throw error;

            this.possibleProblems = problems;
            
            this.addMessage('CycloBot', `🔍 Buscando soluciones...`, 'bot');
            this.addMessage('CycloBot', `✅ ${problems.length} problemas encontrados`, 'bot');

            if (problems.length > 0) {
                // Seleccionar pregunta inicial más común
                const firstQuestion = problems[0];
                await this.displayQuestion(firstQuestion);
            } else {
                this.addMessage('CycloBot', '❌ No se encontraron problemas para esta categoría.', 'bot');
                this.showRestartOption();
            }
            
            hideLoading();
            
        } catch (error) {
            console.error('Error cargando primera pregunta:', error);
            this.addMessage('CycloBot', '❌ Error cargando problemas. Intenta nuevamente.', 'bot');
            hideLoading();
            this.showRestartOption();
        }
    }

    async displayQuestion(question) {
        this.currentQuestion = question;
        this.questionHistory.push(question);

        // Mostrar la pregunta
        this.addMessage('CycloBot', question.preguntas[0], 'bot');

        // Mostrar opciones de respuesta
        this.displayResponseOptions(question);
        
        // Mostrar controles de navegación
        this.showNavigationControls();
    }

    displayResponseOptions(question) {
        const responsesContainer = document.getElementById('responses-container');
        responsesContainer.innerHTML = '';

        // Mostrar tipo de pregunta
        const typeIndicator = document.createElement('div');
        typeIndicator.className = 'question-type-indicator';
        
        let typeText = '';
        let icon = '';
        
        switch(question.tipo_pregunta) {
            case 'booleano':
                typeText = 'Responde Sí o No';
                icon = 'fa-toggle-on';
                break;
            case 'multiple':
                typeText = 'Selección múltiple';
                icon = 'fa-list-check';
                break;
            default:
                typeText = 'Selecciona una opción';
                icon = 'fa-mouse-pointer';
        }
        
        typeIndicator.innerHTML = `<i class="fas ${icon}"></i> ${typeText}`;
        responsesContainer.appendChild(typeIndicator);

        // Mostrar opciones de respuesta
        question.respuestas_posibles.forEach((respuesta, index) => {
            const button = document.createElement('button');
            button.className = 'cyber-response-button';
            
            // Icono basado en el tipo de respuesta
            let icon = 'fa-circle';
            if (question.tipo_pregunta === 'booleano') {
                icon = respuesta.toLowerCase().includes('sí') || respuesta.toLowerCase().includes('si') ? 
                       'fa-check-circle' : 'fa-times-circle';
            }
            
            button.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${respuesta}</span>
            `;
            
            button.onclick = () => this.handleResponse(respuesta, question);
            responsesContainer.appendChild(button);
        });
    }

    async handleResponse(response, question) {
        // Guardar respuesta del usuario
        this.userResponses.push({
            question: question.preguntas[0],
            response: response,
            questionId: question.id
        });

        // Mostrar respuesta del usuario
        this.addMessage('Tú', response, 'user');

        // Buscar siguiente pregunta o diagnóstico
        await this.findNextStep(question, response);
    }

    async findNextStep(currentQuestion, userResponse) {
        try {
            showLoading('Analizando respuesta...');

            if (currentQuestion.es_pregunta_final) {
                // Llegamos a un diagnóstico final
                await this.showDiagnosis(currentQuestion);
                return;
            }

            // Buscar siguiente pregunta basada en la respuesta
            const { data: nextQuestions, error } = await supabase
                .from('problemas')
                .select('*')
                .eq('categoria', this.currentCategory)
                .eq('pregunta_anterior_id', currentQuestion.id)
                .order('nivel');

            if (error) throw error;

            if (nextQuestions && nextQuestions.length > 0) {
                // Mostrar siguiente pregunta
                const nextQuestion = nextQuestions[0];
                setTimeout(() => {
                    this.displayQuestion(nextQuestion);
                    hideLoading();
                }, 1000);
            } else {
                // No hay más preguntas, mostrar diagnóstico basado en respuestas
                await this.findBestDiagnosis();
                hideLoading();
            }

        } catch (error) {
            console.error('Error buscando siguiente paso:', error);
            this.addMessage('CycloBot', '❌ Error procesando respuesta.', 'bot');
            hideLoading();
            this.showRestartOption();
        }
    }

    async findBestDiagnosis() {
        try {
            // Buscar problemas que coincidan con las respuestas
            const { data: possibleDiagnoses, error } = await supabase
                .from('problemas')
                .select('*')
                .eq('categoria', this.currentCategory)
                .eq('es_pregunta_final', true);

            if (error) throw error;

            if (possibleDiagnoses && possibleDiagnoses.length > 0) {
                // Seleccionar el diagnóstico más probable (por ahora el primero)
                const diagnosis = possibleDiagnoses[0];
                await this.showDiagnosis(diagnosis);
            } else {
                this.addMessage('CycloBot', '🔍 No se pudo determinar un diagnóstico específico.', 'bot');
                this.showGeneralSolutions();
            }

        } catch (error) {
            console.error('Error buscando diagnóstico:', error);
            this.showGeneralSolutions();
        }
    }

    async showDiagnosis(diagnosis) {
        this.diagnosticState = 'completed';

        // Mostrar causa probable
        if (diagnosis.causa_probable) {
            this.addMessage('CycloBot', `🎯 **Causa Probable:** ${diagnosis.causa_probable}`, 'bot');
        }

        // Mostrar soluciones
        if (diagnosis.soluciones && diagnosis.soluciones.length > 0) {
            this.addMessage('CycloBot', '🛠️ **Soluciones Recomendadas:**', 'bot');
            
            diagnosis.soluciones.forEach((solucion, index) => {
                this.addMessage('CycloBot', `${index + 1}. ${solucion}`, 'bot');
            });
        }

        // Preguntar si fue útil
        setTimeout(() => {
            this.askForFeedback();
        }, 1500);
    }

    showGeneralSolutions() {
        this.addMessage('CycloBot', '💡 **Soluciones Generales:**', 'bot');
        this.addMessage('CycloBot', '1. Reinicia el dispositivo', 'bot');
        this.addMessage('CycloBot', '2. Verifica las conexiones', 'bot');
        this.addMessage('CycloBot', '3. Actualiza el software', 'bot');
        this.addMessage('CycloBot', '4. Consulta con un técnico especializado', 'bot');
        
        this.askForFeedback();
    }

    askForFeedback() {
        const responsesContainer = document.getElementById('responses-container');
        responsesContainer.innerHTML = '';

        const feedbackTitle = document.createElement('div');
        feedbackTitle.className = 'response-section-title';
        feedbackTitle.innerHTML = '<i class="fas fa-star"></i> ¿Fue útil el diagnóstico?';
        responsesContainer.appendChild(feedbackTitle);

        const feedbackButtons = [
            { text: 'Sí, muy útil', icon: 'fa-face-laugh-beam', value: 'useful' },
            { text: 'Más o menos', icon: 'fa-face-meh', value: 'neutral' },
            { text: 'No fue útil', icon: 'fa-face-frown', value: 'not_useful' }
        ];

        feedbackButtons.forEach(feedback => {
            const button = document.createElement('button');
            button.className = 'cyber-response-button feedback-button';
            button.innerHTML = `
                <i class="fas ${feedback.icon}"></i>
                <span>${feedback.text}</span>
            `;
            button.onclick = () => this.handleFeedback(feedback.value);
            responsesContainer.appendChild(button);
        });

        // Opción para nuevo diagnóstico
        const restartButton = document.createElement('button');
        restartButton.className = 'cyber-response-button restart-button';
        restartButton.innerHTML = `
            <i class="fas fa-rotate-right"></i>
            <span>Realizar nuevo diagnóstico</span>
        `;
        restartButton.onclick = () => this.restartDiagnostic();
        responsesContainer.appendChild(restButton);
    }

    handleFeedback(feedback) {
        this.addMessage('Tú', 
            feedback === 'useful' ? 'Sí, muy útil' : 
            feedback === 'neutral' ? 'Más o menos' : 'No fue útil', 
            'user'
        );

        this.addMessage('CycloBot', '¡Gracias por tu feedback! Me ayuda a mejorar.', 'bot');
        
        setTimeout(() => {
            this.showRestartOption();
        }, 1000);
    }

    showRestartOption() {
        const responsesContainer = document.getElementById('responses-container');
        responsesContainer.innerHTML = '';

        const restartButton = document.createElement('button');
        restartButton.className = 'cyber-response-button primary-button';
        restartButton.innerHTML = `
            <i class="fas fa-play"></i>
            <span>Comenzar nuevo diagnóstico</span>
        `;
        restartButton.onclick = () => this.restartDiagnostic();
        responsesContainer.appendChild(restartButton);
    }

    showNavigationControls() {
        const navContainer = document.getElementById('navigation-controls');
        
        if (this.questionHistory.length > 1) {
            navContainer.style.display = 'flex';
            navContainer.innerHTML = '';

            const backButton = document.createElement('button');
            backButton.className = 'cyber-nav-button';
            backButton.innerHTML = `
                <i class="fas fa-arrow-left"></i>
                <span>Volver a la pregunta anterior</span>
            `;
            backButton.onclick = () => this.goBack();
            navContainer.appendChild(backButton);

            const restartButton = document.createElement('button');
            restartButton.className = 'cyber-nav-button secondary';
            restartButton.innerHTML = `
                <i class="fas fa-rotate-left"></i>
                <span>Reiniciar diagnóstico</span>
            `;
            restartButton.onclick = () => this.restartDiagnostic();
            navContainer.appendChild(restartButton);
        } else {
            navContainer.style.display = 'none';
        }
    }

    goBack() {
        if (this.questionHistory.length > 1) {
            // Remover pregunta actual y respuesta
            this.questionHistory.pop();
            this.userResponses.pop();
            
            const previousQuestion = this.questionHistory[this.questionHistory.length - 1];
            
            // Remover mensajes de la pregunta actual y respuesta
            this.removeLastMessages(2);
            
            // Mostrar pregunta anterior
            this.displayQuestion(previousQuestion);
        }
    }

    removeLastMessages(count) {
        const messagesContainer = document.getElementById('messages-container');
        const messages = messagesContainer.querySelectorAll('.message');
        
        for (let i = 0; i < count && messages.length > 0; i++) {
            messages[messages.length - 1].remove();
        }
    }

    restartDiagnostic() {
        this.currentQuestion = null;
        this.questionHistory = [];
        this.userResponses = [];
        this.diagnosticState = 'category_selection';
        this.possibleProblems = [];

        const messagesContainer = document.getElementById('messages-container');
        const responsesContainer = document.getElementById('responses-container');
        const navContainer = document.getElementById('navigation-controls');

        messagesContainer.innerHTML = '';
        responsesContainer.innerHTML = '';
        navContainer.innerHTML = '';
        navContainer.style.display = 'none';

        this.showWelcomeMessage();
    }

    addMessage(sender, text, type) {
        const messagesContainer = document.getElementById('messages-container');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${sender}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">${this.formatMessageText(text)}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessageText(text) {
        // Convertir **texto** a negrita
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
}

// Funciones de utilidad globales
function showLoading(message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('.loading-text');
    
    text.textContent = message;
    overlay.style.display = 'flex';
    
    // Asegurar que esté sobre todo
    overlay.style.zIndex = '1000';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'none';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.diagnosticChat = new DiagnosticChat();
});

// Exportar para uso global
window.DiagnosticChat = DiagnosticChat;
