// supabase-client.js - Conexión SEGURA a Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// USAR API KEY ANÓNIMA (public) no la secret key
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4' // EJEMPLO - REEMPLAZA CON TU ANON KEY

class SupabaseClient {
    constructor() {
        if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
            console.error('❌ CONFIGURA TU API KEY ANÓNIMA en supabase-client.js')
            this.showConfigError()
            return
        }
        
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = false
        this.init()
    }

    async init() {
        try {
            console.log('🔗 Conectando a Supabase...')
            
            // Test de conexión con tabla problemas
            const { data, error } = await this.client
                .from('problemas')
                .select('id, categoria')
                .limit(1)
            
            if (error) {
                console.error('❌ Error de conexión:', error)
                this.handleConnectionError(error)
                return
            }
            
            this.connected = true
            console.log('✅ Conectado a Supabase - Base de datos operativa')
            this.updateStatusIndicator('online')
            this.showConnectionSuccess()
            
        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error)
            this.connected = false
            this.handleConnectionError(error)
        }
    }

    showConfigError() {
        const messagesContainer = document.getElementById('chatMessages')
        if (messagesContainer) {
            const messageDiv = document.createElement('div')
            messageDiv.className = 'message message-system'
            messageDiv.innerHTML = `
                <h4>🔧 Configuración Requerida</h4>
                <p>Para conectar con Supabase necesitas:</p>
                <ol>
                    <li>Ir a <strong>Settings > API</strong> en tu proyecto Supabase</li>
                    <li>Copiar la <strong>anon public</strong> key (no la secret key)</li>
                    <li>Pegarla en <code>supabase-client.js</code> línea 5</li>
                </ol>
                <p><small>La secret key solo debe usarse en servidores, nunca en el navegador.</small></p>
            `
            messagesContainer.appendChild(messageDiv)
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
    }

    handleConnectionError(error) {
        this.updateStatusIndicator('error')
        
        const messagesContainer = document.getElementById('chatMessages')
        if (messagesContainer) {
            let errorMessage = 'Error de conexión con la base de datos'
            
            if (error.message.includes('JWT')) {
                errorMessage = '❌ API Key inválida. Usa la anon public key, no la secret key.'
            } else if (error.message.includes('PGRST')) {
                errorMessage = '❌ Error en la consulta. Verifica que la tabla "problemas" exista.'
            }
            
            const messageDiv = document.createElement('div')
            messageDiv.className = 'message message-system'
            messageDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                ${errorMessage}
                <br><small>Detalle: ${error.message}</small>
            `
            messagesContainer.appendChild(messageDiv)
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
    }

    updateStatusIndicator(status) {
        const indicator = document.getElementById('dbStatus')
        if (indicator) {
            const statusClass = status === 'online' ? 'status-online' : 
                              status === 'error' ? 'status-offline' : 'status-warning'
            indicator.className = `status-dot ${statusClass}`
        }
    }

    showConnectionSuccess() {
        const messagesContainer = document.getElementById('chatMessages')
        if (messagesContainer) {
            const messageDiv = document.createElement('div')
            messageDiv.className = 'message message-system'
            messageDiv.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                ✅ Conectado a base de datos Supabase
                <br><small>URL: ${SUPABASE_URL}</small>
            `
            messagesContainer.appendChild(messageDiv)
            
            // Mostrar categorías después de conectar
            this.showCategories()
        }
    }

    showCategories() {
        const messagesContainer = document.getElementById('chatMessages')
        const categoriesHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Conexión establecida! ¿Qué problema tenés?</p>
                <small>Seleccioná una categoría para empezar el diagnóstico</small>
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
        
        messagesContainer.innerHTML += categoriesHTML
        messagesContainer.scrollTop = messagesContainer.scrollHeight
        
        // Re-attach event listeners
        setTimeout(() => {
            document.querySelectorAll('.option-btn[data-category]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const category = e.currentTarget.getAttribute('data-category')
                    if (window.chatDiagnostic) {
                        window.chatDiagnostic.startCategory(category)
                    }
                })
            })
        }, 100)
    }

    // Obtener problemas por categoría
    async getProblemsByCategory(categoria) {
        if (!this.connected) {
            throw new Error('No hay conexión a la base de datos')
        }

        try {
            console.log(`📥 Cargando problemas para categoría: ${categoria}`)
            
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('categoria', categoria)
                .order('nivel', { ascending: true })

            if (error) {
                console.error('❌ Error en query:', error)
                throw error
            }

            console.log(`📊 Problemas cargados: ${data?.length || 0}`)
            return data || []

        } catch (error) {
            console.error('❌ Error cargando problemas:', error)
            throw error
        }
    }

    // Obtener siguiente problema en el flujo
    async getNextProblem(currentProblemId, nivel) {
        if (!this.connected) {
            throw new Error('No hay conexión a la base de datos')
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
                    return null // No hay más preguntas
                }
                throw error
            }

            return data

        } catch (error) {
            console.error('❌ Error buscando siguiente problema:', error)
            throw error
        }
    }
}

// Exportar para uso global
window.SupabaseClient = SupabaseClient
