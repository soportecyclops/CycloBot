// diagnostic.js - Sistema de Diagnóstico Inteligente
class DiagnosticSystem {
    constructor() {
        this.currentCategory = null;
        this.currentProblem = null;
        this.answers = [];
        this.problemFlow = [];
        this.currentStep = 0;
        this.init();
    }

    init() {
        this.loadCategories();
        this.setupEventListeners();
        console.log('🔍 Sistema de diagnóstico inicializado');
    }

    setupEventListeners() {
        // Categorías
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-category');
                this.startDiagnostic(category);
            });
        });

        // Botones de control
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartDiagnostic());
        document.getElementById('newDiagnosticBtn').addEventListener('click', () => this.restartDiagnostic());
    }

    async startDiagnostic(category) {
        this.currentCategory = category;
        this.answers = [];
        this.currentStep = 0;
        
        // Ocultar categorías, mostrar diagnóstico
        document.getElementById('categoriesPanel').classList.remove('active');
        document.getElementById('diagnosticFlow').classList.add('active');
        document.getElementById('resultsPanel').classList.remove('active');

        // Cargar problemas de la categoría (simulado por ahora)
        await this.loadProblemsForCategory(category);
        
        // Mostrar primera pregunta
        this.showCurrentQuestion();
    }

    async loadProblemsForCategory(category) {
        // SIMULACIÓN - En producción esto vendría de Supabase
        const problemsDatabase = {
            'celulares_moviles': [
                {
                    id: 701,
                    categoria: 'celulares_moviles',
                    subcategoria: 'bluetooth_problemas',
                    identificador: 'movil_bluetooth_no_enciende',
                    descripcion: 'Problema: Bluetooth no se activa',
                    preguntas: ['¿El Bluetooth no se enciende o se apaga solo?'],
                    respuestas_posibles: ['No enciende', 'Se apaga solo', 'Enciende pero no funciona'],
                    tipo_pregunta: 'opciones',
                    nivel: 1,
                    pregunta_anterior_id: null,
                    es_pregunta_final: false,
                    causa_probable: null,
                    soluciones: [],
                    keywords: ['movil', 'bluetooth', 'enciende', 'activa'],
                    dificultad: 'baja',
                    peso_respuestas: {'No enciende': 0.8, 'Se apaga solo': 0.7, 'Enciende pero no funciona': 0.6}
                },
                {
                    id: 702,
                    categoria: 'celulares_moviles',
                    subcategoria: 'bluetooth_problemas',
                    identificador: 'movil_bluetooth_dispositivos',
                    descripcion: 'Dispositivos emparejados',
                    preguntas: ['¿Tenés muchos dispositivos Bluetooth emparejados?'],
                    respuestas_posibles: ['Sí, varios', 'No, pocos', 'No sé'],
                    tipo_pregunta: 'opciones',
                    nivel: 2,
                    pregunta_anterior_id: 701,
                    es_pregunta_final: false,
                    causa_probable: null,
                    soluciones: [],
                    keywords: ['movil', 'bluetooth', 'dispositivos', 'emparejados'],
                    dificultad: 'baja',
                    peso_respuestas: {'Sí, varios': 0.7, 'No, pocos': 0.4, 'No sé': 0.5}
                },
                {
                    id: 703,
                    categoria: 'celulares_moviles',
                    subcategoria: 'bluetooth_problemas',
                    identificador: 'movil_bluetooth_reinicio',
                    descripcion: 'Reinicio conexiones',
                    preguntas: ['¿Probaste olvidar y re-emparejar los dispositivos?'],
                    respuestas_posibles: ['Sí, mismo problema', 'No probé', 'No sé cómo'],
                    tipo_pregunta: 'opciones',
                    nivel: 3,
                    pregunta_anterior_id: 702,
                    es_pregunta_final: true,
                    causa_probable: 'Software corrupto o límite de dispositivos alcanzado',
                    soluciones: [
                        'Olvidar todos los dispositivos Bluetooth',
                        'Reiniciar el teléfono', 
                        'Actualizar software del sistema'
                    ],
                    keywords: ['movil', 'bluetooth', 'olvidar', 'reinicio'],
                    dificultad: 'media',
                    peso_respuestas: {'Sí, mismo problema': 0.8, 'No probé': 0.7, 'No sé cómo': 0.6}
                }
            ],
            'software': [
                {
                    id: 704,
                    categoria: 'software',
                    subcategoria: 'problemas_correo',
                    identificador: 'correo_no_recibe_emails',
                    descripcion: 'Problema: No recibo correos nuevos',
                    preguntas: ['¿No te llegan correos que esperabas?'],
                    respuestas_posibles: ['Sí, no llegan', 'Llegan algunos', 'Llegan con retraso'],
                    tipo_pregunta: 'opciones',
                    nivel: 1,
                    pregunta_anterior_id: null,
                    es_pregunta_final: false,
                    causa_probable: null,
                    soluciones: [],
                    keywords: ['correo', 'emails', 'recibir', 'llegar'],
                    dificultad: 'media',
                    peso_respuestas: {'Sí, no llegan': 0.8, 'Llegan algunos': 0.6, 'Llegan con retraso': 0.7}
                },
                {
                    id: 705,
                    categoria: 'software', 
                    subcategoria: 'problemas_correo',
                    identificador: 'correo_espacio_buzon',
                    descripcion: 'Espacio en buzón',
                    preguntas: ['¿Tu buzón de correo está lleno?'],
                    respuestas_posibles: ['Sí, está lleno', 'No, tiene espacio', 'No sé'],
                    tipo_pregunta: 'opciones',
                    nivel: 2,
                    pregunta_anterior_id: 704,
                    es_pregunta_final: false,
                    causa_probable: null,
                    soluciones: [],
                    keywords: ['correo', 'buzón', 'espacio', 'lleno'],
                    dificultad: 'baja',
                    peso_respuestas: {'Sí, está lleno': 0.9, 'No, tiene espacio': 0.3, 'No sé': 0.7}
                },
                {
                    id: 706,
                    categoria: 'software',
                    subcategoria: 'problemas_correo', 
                    identificador: 'correo_filtros_configurados',
                    descripcion: 'Filtros activos',
                    preguntas: ['¿Tenés filtros o reglas configuradas?'],
                    respuestas_posibles: ['Sí, varios filtros', 'No, sin filtros', 'No sé'],
                    tipo_pregunta: 'opciones',
                    nivel: 3,
                    pregunta_anterior_id: 705,
                    es_pregunta_final: true,
                    causa_probable: 'Buzón lleno o filtros moviendo correos',
                    soluciones: [
                        'Liberar espacio eliminando correos antiguos',
                        'Revisar carpeta de spam y filtros',
                        'Verificar configuración de reenvío'
                    ],
                    keywords: ['correo', 'filtros', 'espacio', 'buzón'],
                    dificultad: 'media',
                    peso_respuestas: {'Sí, varios filtros': 0.8, 'No, sin filtros': 0.4, 'No sé': 0.6}
                }
            ]
        };

        this.problemFlow = problemsDatabase[category] || [];
        this.currentProblem = this.problemFlow[0]; // Primera pregunta
    }

    showCurrentQuestion() {
        if (!this.currentProblem) {
            this.showNoSolution();
            return;
        }

        const container = document.getElementById('questionContainer');
        const problem = this.currentProblem;

        // Actualizar progreso
        const progress = ((this.currentStep + 1) / (this.problemFlow.length + 1)) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        // Mostrar pregunta actual
        document.getElementById('currentProblem').textContent = problem.descripcion;
        document.getElementById('problemDescription').textContent = problem.preguntas[0];

        // Crear opciones de respuesta
        let optionsHTML = '';
        problem.respuestas_posibles.forEach((option, index) => {
            optionsHTML += `
                <button class="option-btn" data-answer="${option}">
                    <i class="fas fa-arrow-right"></i> ${option}
                </button>
            `;
        });

        container.innerHTML = `
            <div class="question-card">
                <div class="options-grid">
                    ${optionsHTML}
                </div>
            </div>
        `;

        // Agregar event listeners a las opciones
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.currentTarget.getAttribute('data-answer');
                this.handleAnswer(answer);
            });
        });

        // Mostrar/ocultar botón volver
        document.getElementById('backBtn').style.display = this.currentStep > 0 ? 'block' : 'none';
    }

    handleAnswer(answer) {
        // Guardar respuesta
        this.answers.push({
            question: this.currentProblem.descripcion,
            answer: answer,
            problemId: this.currentProblem.id
        });

        // Buscar siguiente pregunta basada en la respuesta
        const nextProblem = this.findNextProblem(answer);
        
        if (nextProblem && !nextProblem.es_pregunta_final) {
            this.currentProblem = nextProblem;
            this.currentStep++;
            this.showCurrentQuestion();
        } else if (nextProblem && nextProblem.es_pregunta_final) {
            // Llegamos a la solución final
            this.showSolution(nextProblem);
        } else {
            // No hay más preguntas, mostrar solución genérica
            this.showGenericSolution();
        }
    }

    findNextProblem(currentAnswer) {
        // Buscar siguiente problema basado en la estructura jerárquica
        const currentLevel = this.currentProblem.nivel;
        const nextLevel = currentLevel + 1;
        
        return this.problemFlow.find(problem => 
            problem.nivel === nextLevel && 
            problem.pregunta_anterior_id === this.currentProblem.id
        );
    }

    showSolution(problem) {
        document.getElementById('diagnosticFlow').classList.remove('active');
        document.getElementById('resultsPanel').classList.add('active');

        const solutionHTML = `
            <div class="solution-card">
                <h3><i class="fas fa-lightbulb"></i> Causa Probable</h3>
                <p>${problem.causa_probable}</p>
                
                <h3><i class="fas fa-wrench"></i> Soluciones Recomendadas</h3>
                <ul>
                    ${problem.soluciones.map(sol => `<li>${sol}</li>`).join('')}
                </ul>
                
                <h3><i class="fas fa-history"></i> Resumen del Diagnóstico</h3>
                <div class="answers-summary">
                    ${this.answers.map((answer, index) => `
                        <p><strong>Pregunta ${index + 1}:</strong> ${answer.question}</p>
                        <p><strong>Tu respuesta:</strong> ${answer.answer}</p>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('solutionContent').innerHTML = solutionHTML;
    }

    showGenericSolution() {
        document.getElementById('diagnosticFlow').classList.remove('active');
        document.getElementById('resultsPanel').classList.add('active');

        document.getElementById('solutionContent').innerHTML = `
            <div class="solution-card">
                <h3><i class="fas fa-info-circle"></i> Diagnóstico Completo</h3>
                <p>Basado en tus respuestas, te recomendamos:</p>
                <ul>
                    <li>Reiniciar el dispositivo</li>
                    <li>Verificar actualizaciones del sistema</li>
                    <li>Contactar soporte técnico si el problema persiste</li>
                </ul>
            </div>
        `;
    }

    showNoSolution() {
        document.getElementById('solutionContent').innerHTML = `
            <div class="solution-card">
                <h3><i class="fas fa-exclamation-triangle"></i> No se encontró solución específica</h3>
                <p>Para este problema, te recomendamos contactar con nuestro soporte técnico.</p>
            </div>
        `;
    }

    goBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.answers.pop(); // Remover última respuesta
            this.currentProblem = this.problemFlow[this.currentStep];
            this.showCurrentQuestion();
        }
    }

    restartDiagnostic() {
        this.currentCategory = null;
        this.currentProblem = null;
        this.answers = [];
        this.problemFlow = [];
        this.currentStep = 0;

        document.getElementById('categoriesPanel').classList.add('active');
        document.getElementById('diagnosticFlow').classList.remove('active');
        document.getElementById('resultsPanel').classList.remove('active');
        document.getElementById('progressFill').style.width = '0%';
    }
}

// Inicializar sistema de diagnóstico
document.addEventListener('DOMContentLoaded', () => {
    window.diagnosticSystem = new DiagnosticSystem();
});
