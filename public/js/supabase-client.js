// supabase-client.js - CORREGIDO - Sin validación incorrecta
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURACIÓN - TU KEY ES VÁLIDA
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4'

class SupabaseClient {
    constructor() {
        console.log('🚀 INICIANDO CONEXIÓN SUPABASE')
        console.log('✅ API Key válida detectada')
        
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = null
        this.init()
    }

    async init() {
        try {
            console.log('🔗 Conectando con Supabase...')
            
            // Test directo y simple
            const { data, error } = await this.client
                .from('problemas')
                .select('id, categoria, descripcion')
                .limit(3)

            console.log('📊 Resultado conexión:', { data, error })

            if (error) {
                console.error('❌ Error de Supabase:', error)
                this.handleConnectionError(error)
                return
            }

            this.connected = true
            console.log('✅ CONEXIÓN EXITOSA - Datos encontrados:', data?.length || 0)
            this.updateStatusIndicator('online')
            this.showConnectionSuccess(data)

        } catch (error) {
            console.error('💥 Error inesperado:', error)
            this.handleConnectionError(error)
        }
    }

    handleConnectionError(error) {
        this.connected = false
        this.updateStatusIndicator('error')
        
        const messagesContainer = document.getElementById('chatMessages')
        if (!messagesContainer) return
        
        const errorHTML = `
            <div class="message message-system">
                <h4>❌ Error de Conexión</h4>
                <p>${error.message || 'No se pudo conectar a la base de datos'}</p>
                <small>URL: ${SUPABASE_URL}</small>
                <div style="margin-top: 1rem;">
                    <button onclick="window.location.reload()" class="cyber-button small">
                        <i class="fas fa-sync"></i> Reintentar
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
        }
    }

    showConnectionSuccess(data) {
        const messagesContainer = document.getElementById('chatMessages')
        
        // Obtener categorías únicas de los datos reales
        const categories = data ? 
            [...new Set(data.map(item => item.categoria))] : 
            ['celulares_moviles', 'software', 'hardware', 'redes']
        
        const successHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Sistema listo! ✅ Base de datos conectada correctamente.</p>
                <p>Encontré ${data?.length || 'varios'} problemas en la base de datos.</p>
                <p>¿Qué problema tenés?</p>
            </div>
            <div class="message message-bot">
                <strong><i class="fas fa-folder"></i> Categorías disponibles:</strong>
                <div class="options-grid">
                    ${categories.map(cat => `
                        <button class="option-btn" data-category="${cat}">
                            <i class="fas fa-${this.getCategoryIcon(cat)}"></i> 
                            ${this.formatCategoryName(cat)}
                        </button>
                    `).join('')}
                </div>
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

    async getProblemsByCategory(categoria) {
        console.log(`📥 Cargando problemas para: ${categoria}`)
        
        if (!this.connected) {
            throw new Error('No hay conexión con la base de datos')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('categoria', categoria)
                .order('nivel', { ascending: true })

            if (error) throw error

            console.log(`✅ ${data?.length || 0} problemas cargados`)
            return data || []

        } catch (error) {
            console.error('❌ Error cargando problemas:', error)
            throw error
        }
    }

    async getNextProblem(currentProblemId, nivel) {
        console.log(`➡️ Buscando siguiente problema...`)
        
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
                if (error.code === 'PGRST116') return null
                throw error
            }

            return data

        } catch (error) {
            console.error('❌ Error buscando siguiente problema:', error)
            throw error
        }
    }
}

window.SupabaseClient = SupabaseClient
