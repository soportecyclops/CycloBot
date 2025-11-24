// supabase-client.js - Conexión debuggeada a Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURACIÓN CON TU KEY
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4'

class SupabaseClient {
    constructor() {
        console.log('🚀 Inicializando cliente Supabase...')
        console.log('📋 URL:', SUPABASE_URL)
        console.log('🔑 Key:', SUPABASE_ANON_KEY ? '✅ Presente' : '❌ Faltante')
        
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = false
        this.init()
    }

    async init() {
        try {
            console.log('🔗 Probando conexión con Supabase...')
            
            // Test más simple y robusto
            const { data, error } = await this.client.from('problemas').select('*').limit(1)
            
            console.log('📊 Respuesta de Supabase:', { data, error })
            
            if (error) {
                console.error('❌ Error de Supabase:', error)
                this.handleConnectionError(error)
                return
            }
            
            this.connected = true
            console.log('✅ Conexión exitosa con Supabase')
            this.updateStatusIndicator('online')
            this.showConnectionSuccess()
            
        } catch (error) {
            console.error('💥 Error crítico:', error)
            this.handleConnectionError(error)
        }
    }

    handleConnectionError(error) {
        this.connected = false
        this.updateStatusIndicator('error')
        
        const messagesContainer = document.getElementById('chatMessages')
        if (!messagesContainer) return
        
        let errorMessage = 'Error de conexión'
        let details = ''
        
        if (error.message) {
            if (error.message.includes('JWT')) {
                errorMessage = '❌ Problema con la API Key'
                details = 'Verifica que la key sea válida y no esté expirada'
            } else if (error.message.includes('relation "problemas" does not exist')) {
                errorMessage = '❌ Tabla no encontrada'
                details = 'La tabla "problemas" no existe en tu base de datos'
            } else if (error.message.includes('Network Error')) {
                errorMessage = '❌ Error de red'
                details = 'No se pudo conectar al servidor de Supabase'
            } else {
                details = error.message
            }
        }
        
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message message-system'
        messageDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            <strong>${errorMessage}</strong>
            ${details ? `<br><small>${details}</small>` : ''}
            <br><small>URL: ${SUPABASE_URL}</small>
        `
        messagesContainer.appendChild(messageDiv)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
        
        // Mostrar instrucciones de solución
        this.showTroubleshootingGuide()
    }

    showTroubleshootingGuide() {
        const messagesContainer = document.getElementById('chatMessages')
        const guideHTML = `
            <div class="message message-system">
                <h4>🔧 Guía de Solución de Problemas</h4>
                <ol>
                    <li><strong>Verifica tu tabla:</strong> Asegurate de que la tabla "problemas" existe en Supabase</li>
                    <li><strong>Revisa los permisos:</strong> La tabla debe tener permisos RLS configurados</li>
                    <li><strong>Prueba en Supabase:</strong> Ve al SQL Editor y ejecuta: <code>SELECT * FROM problemas LIMIT 1</code></li>
                    <li><strong>Configura RLS:</strong> Si usas Row Level Security, configura las políticas adecuadas</li>
                </ol>
                <button onclick="window.location.reload()" class="restart-btn">
                    <i class="fas fa-sync"></i> Reintentar Conexión
                </button>
            </div>
        `
        messagesContainer.innerHTML += guideHTML
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    updateStatusIndicator(status) {
        const indicator = document.getElementById('dbStatus')
        if (indicator) {
            indicator.className = `status-dot status-${status}`
            indicator.title = status === 'online' ? 'Conectado' : 'Error de conexión'
        }
    }

    showConnectionSuccess() {
        const messagesContainer = document.getElementById('chatMessages')
        const successHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Sistema listo! Base de datos conectada correctamente.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
            </div>
            <div class="message message-bot">
                <strong><i class="fas fa-folder"></i> Categorías de diagnóstico:</strong>
                <div class="options-grid">
                    <button class="option-btn" data-category="celulares_moviles">
                        <i class="fas fa-mobile-alt"></i> Celulares
                    </button>
                    <button class="option-btn" data-category="software">
                        <i class="fas fa-code"></i> Software  
                    </button>
                    <button class="option-btn" data-category="hardware">
                        <i class="fas fa-desktop"></i> Hardware
                    </button>
                    <button class="option-btn" data-category="redes">
                        <i class="fas fa-wifi"></i> Redes
                    </button>
                </div>
            </div>
        `
        messagesContainer.innerHTML = successHTML
        messagesContainer.scrollTop = messagesContainer.scrollHeight
        
        // Agregar event listeners
        this.attachCategoryListeners()
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

    // Métodos de consulta
    async getProblemsByCategory(categoria) {
        if (!this.connected) {
            throw new Error('No hay conexión con la base de datos')
        }

        try {
            console.log(`📥 Solicitando problemas para: ${categoria}`)
            
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('categoria', categoria)
                .order('nivel', { ascending: true })

            if (error) {
                console.error('❌ Error en consulta:', error)
                throw error
            }

            console.log(`📊 Problemas obtenidos:`, data)
            return data || []

        } catch (error) {
            console.error('❌ Error cargando problemas:', error)
            throw error
        }
    }

    async getNextProblem(currentProblemId, nivel) {
        if (!this.connected) {
            throw new Error('No hay conexión con la base de datos')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('pregunta_anterior_id', currentProblemId)
                .eq('nivel', nivel)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    return null // No hay más resultados
                }
                throw error
            }

            return data

        } catch (error) {
            console.error('❌ Error buscando siguiente problema:', error)
            throw error
        }
    }

    // Método para verificar salud del sistema
    async healthCheck() {
        try {
            const { data, error } = await this.client.from('problemas').select('count').limit(1)
            return { 
                healthy: !error, 
                message: error ? error.message : 'Sistema operativo',
                data: data
            }
        } catch (error) {
            return { healthy: false, message: error.message }
        }
    }
}

window.SupabaseClient = SupabaseClient
