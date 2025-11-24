// supabase-client.js - Debugging completo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURACIÓN
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4'

class SupabaseClient {
    constructor() {
        console.log('🔧 INICIALIZANDO CLIENTE SUPABASE')
        console.log('📍 URL:', SUPABASE_URL)
        console.log('🔑 Key length:', SUPABASE_ANON_KEY?.length || 'No key')
        
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = null // null = pendiente, true = conectado, false = error
        this.init()
    }

    async init() {
        try {
            console.log('🔄 TESTEANDO CONEXIÓN...')
            
            // Test 1: Conexión básica
            console.log('🧪 Test 1: Conexión básica...')
            const { data: test1, error: error1 } = await this.client.from('problemas').select('count').limit(1)
            console.log('Test 1 - Count:', test1, 'Error:', error1)
            
            if (error1) {
                console.error('❌ FALLO Test 1:', error1)
                this.handleConnectionError(error1)
                return
            }

            // Test 2: Verificar datos existentes
            console.log('🧪 Test 2: Verificando datos...')
            const { data: categories, error: error2 } = await this.client
                .from('problemas')
                .select('categoria')
                .limit(5)
            
            console.log('Test 2 - Categorías:', categories, 'Error:', error2)
            
            if (error2) {
                console.error('❌ FALLO Test 2:', error2)
                this.handleConnectionError(error2)
                return
            }

            // Test 3: Verificar estructura de tabla
            console.log('🧪 Test 3: Estructura de datos...')
            const { data: sample, error: error3 } = await this.client
                .from('problemas')
                .select('*')
                .limit(1)
            
            console.log('Test 3 - Muestra:', sample, 'Error:', error3)

            this.connected = true
            console.log('✅ TODOS LOS TESTS PASADOS - SISTEMA OPERATIVO')
            this.updateStatusIndicator('online')
            this.showConnectionSuccess(categories, sample)

        } catch (error) {
            console.error('💥 ERROR CRÍTICO:', error)
            this.handleConnectionError(error)
        }
    }

    handleConnectionError(error) {
        this.connected = false
        this.updateStatusIndicator('error')
        
        const messagesContainer = document.getElementById('chatMessages')
        if (!messagesContainer) return
        
        let errorTitle = '❌ Error de Conexión'
        let errorDetails = ''
        let solutionSteps = []
        
        if (error.message) {
            if (error.message.includes('JWT')) {
                errorTitle = '❌ Problema de Autenticación'
                errorDetails = 'La API Key podría ser inválida o estar expirada'
                solutionSteps = [
                    'Verifica que la API Key sea correcta',
                    'Asegúrate de usar la anon public key (no secret)',
                    'Revisa si la key ha expirado'
                ]
            } else if (error.message.includes('relation "problemas" does not exist')) {
                errorTitle = '❌ Tabla No Encontrada'
                errorDetails = 'La tabla "problemas" no existe en la base de datos'
                solutionSteps = [
                    'Verifica que la tabla se llama exactamente "problemas"',
                    'Crea la tabla si no existe',
                    'Revisa mayúsculas y minúsculas'
                ]
            } else if (error.message.includes('permission denied')) {
                errorTitle = '❌ Permisos Insuficientes'
                errorDetails = 'No tienes permisos para leer la tabla'
                solutionSteps = [
                    'Configura Row Level Security (RLS) en Supabase',
                    'Crea una política que permita SELECT público',
                    'Ve a Authentication > Policies en tu proyecto'
                ]
            } else if (error.message.includes('Network Error')) {
                errorTitle = '❌ Error de Red'
                errorDetails = 'No se puede conectar al servidor'
                solutionSteps = [
                    'Verifica tu conexión a internet',
                    'Revisa si Supabase está en mantenimiento',
                    'Intenta recargar la página'
                ]
            } else {
                errorDetails = error.message
                solutionSteps = ['Revisa la consola para más detalles']
            }
        }
        
        const errorHTML = `
            <div class="message message-system">
                <h4>${errorTitle}</h4>
                ${errorDetails ? `<p>${errorDetails}</p>` : ''}
                ${solutionSteps.length > 0 ? `
                    <h5>🔧 Pasos para solucionar:</h5>
                    <ol>
                        ${solutionSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                ` : ''}
                <div style="margin-top: 1rem;">
                    <button onclick="window.location.reload()" class="cyber-button small">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                    <button onclick="window.runDiagnostics()" class="cyber-button small">
                        <i class="fas fa-bug"></i> Diagnosticar
                    </button>
                </div>
            </div>
        `
        
        messagesContainer.innerHTML += errorHTML
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    updateStatusIndicator(status) {
        const indicator = document.getElementById('dbStatus')
        if (indicator) {
            indicator.className = `status-dot status-${status}`
            indicator.title = status === 'online' ? 'Conectado' : 
                            status === 'error' ? 'Error' : 'Conectando...'
        }
    }

    showConnectionSuccess(categories, sample) {
        const messagesContainer = document.getElementById('chatMessages')
        
        // Obtener categorías únicas para mostrar
        const uniqueCategories = categories ? 
            [...new Set(categories.map(c => c.categoria))].slice(0, 4) : 
            ['celulares_moviles', 'software', 'hardware', 'redes']
        
        const successHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Sistema listo! ✅ Base de datos conectada correctamente.</p>
                <p>He detectado ${categories?.length || 'varias'} categorías disponibles.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
            </div>
            <div class="message message-bot">
                <strong><i class="fas fa-folder"></i> Selecciona una categoría:</strong>
                <div class="options-grid">
                    ${uniqueCategories.map(cat => `
                        <button class="option-btn" data-category="${cat}">
                            <i class="fas fa-${this.getCategoryIcon(cat)}"></i> 
                            ${this.formatCategoryName(cat)}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="message message-system">
                <small>
                    <i class="fas fa-info-circle"></i> 
                    Sistema conectado a: ${SUPABASE_URL}
                    ${sample && sample.length > 0 ? ` | ${sample.length} registro(s) encontrado(s)` : ''}
                </small>
            </div>
        `
        
        messagesContainer.innerHTML = successHTML
        messagesContainer.scrollTop = messagesContainer.scrollHeight
        
        this.attachCategoryListeners()
    }

    getCategoryIcon(category) {
        const icons = {
            'celulares_moviles': 'mobile-alt',
            'software': 'code',
            'hardware': 'desktop', 
            'redes': 'wifi',
            'seguridad': 'shield-alt'
        }
        return icons[category] || 'question'
    }

    formatCategoryName(category) {
        const names = {
            'celulares_moviles': 'Celulares',
            'software': 'Software',
            'hardware': 'Hardware',
            'redes': 'Redes',
            'seguridad': 'Seguridad'
        }
        return names[category] || category
    }

    attachCategoryListeners() {
        setTimeout(() => {
            document.querySelectorAll('.option-btn[data-category]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const category = e.target.getAttribute('data-category')
                    console.log('🎯 Categoría seleccionada:', category)
                    if (window.diagnosticSystem) {
                        window.diagnosticSystem.startDiagnostic(category)
                    }
                })
            })
        }, 100)
    }

    // Métodos de consulta con debugging
    async getProblemsByCategory(categoria) {
        console.log(`📥 SOLICITANDO PROBLEMAS: ${categoria}`)
        
        if (!this.connected) {
            throw new Error('Sistema no conectado a la base de datos')
        }

        try {
            const { data, error, count } = await this.client
                .from('problemas')
                .select('*', { count: 'exact' })
                .eq('categoria', categoria)
                .order('nivel', { ascending: true })

            console.log(`📊 RESPUESTA PARA ${categoria}:`, {
                data: data?.length || 0,
                count: count,
                error: error
            })

            if (error) {
                console.error('❌ ERROR EN CONSULTA:', error)
                throw error
            }

            if (!data || data.length === 0) {
                console.warn(`⚠️ NO HAY DATOS para categoría: ${categoria}`)
                return []
            }

            console.log(`✅ ${data.length} problemas cargados para ${categoria}`)
            return data

        } catch (error) {
            console.error(`💥 ERROR CARGANDO ${categoria}:`, error)
            throw error
        }
    }

    async getNextProblem(currentProblemId, nivel) {
        console.log(`➡️ BUSCANDO SIGUIENTE: problema=${currentProblemId}, nivel=${nivel}`)
        
        if (!this.connected) {
            throw new Error('Sistema no conectado')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('pregunta_anterior_id', currentProblemId)
                .eq('nivel', nivel)
                .single()

            console.log(`🔍 RESULTADO SIGUIENTE:`, { data, error })

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('ℹ️ No hay más preguntas en el flujo')
                    return null
                }
                throw error
            }

            return data

        } catch (error) {
            console.error('❌ ERROR BUSCANDO SIGUIENTE:', error)
            throw error
        }
    }
}

// Funciones globales de debugging
window.runDiagnostics = async function() {
    console.log('🩺 EJECUTANDO DIAGNÓSTICO COMPLETO...')
    
    const client = new SupabaseClient()
    
    // Esperar a que se complete la inicialización
    setTimeout(() => {
        console.log('📋 ESTADO FINAL:', {
            connected: client.connected,
            client: client.client ? '✅ Inicializado' : '❌ No inicializado'
        })
    }, 2000)
}

window.SupabaseClient = SupabaseClient
