// supabase-client.js - Conexión corregida
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURACIÓN
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4'

class SupabaseClient {
    constructor() {
        console.log('🚀 Iniciando Supabase Client')
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = null
        this.init()
    }

    async init() {
        try {
            console.log('🔗 Probando conexión...')
            
            const { data, error } = await this.client
                .from('problemas')
                .select('id, categoria')
                .limit(2)

            if (error) {
                console.error('❌ Error:', error)
                this.handleConnectionError(error)
                return
            }

            this.connected = true
            console.log('✅ Conexión exitosa')
            this.updateStatusIndicator('online')
            this.showConnectionSuccess(data)

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
        
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message message-system'
        messageDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            Error de conexión: ${error.message}
            <br><small>URL: ${SUPABASE_URL}</small>
        `
        messagesContainer.appendChild(messageDiv)
    }

    updateStatusIndicator(status) {
        const indicator = document.getElementById('dbStatus')
        if (indicator) {
            indicator.className = `status-dot status-${status}`
        }
    }

    showConnectionSuccess(data) {
        const messagesContainer = document.getElementById('chatMessages')
        
        const categories = data ? 
            [...new Set(data.map(item => item.categoria))] : 
            ['celulares_moviles', 'software', 'hardware', 'redes']
        
        const successHTML = `
            <div class="message message-bot">
                <strong><i class="fas fa-robot"></i> CycloBot:</strong>
                <p>¡Sistema listo! Base de datos conectada.</p>
                <p>¿En qué puedo ayudarte?</p>
            </div>
            <div class="message message-bot">
                <strong><i class="fas fa-folder"></i> Categorías:</strong>
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
        
        // Agregar event listeners
        setTimeout(() => {
            document.querySelectorAll('.option-btn[data-category]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const category = e.target.getAttribute('data-category')
                    if (window.diagnosticSystem) {
                        window.diagnosticSystem.startDiagnostic(category)
                    }
                })
            })
        }, 100)
    }

    getCategoryIcon(category) {
        const icons = {
            'celulares_moviles': 'mobile-alt',
            'software': 'code',
            'hardware': 'desktop',
            'redes': 'wifi'
        }
        return icons[category] || 'question'
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

    async getProblemsByCategory(categoria) {
        if (!this.connected) {
            throw new Error('Sin conexión')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('categoria', categoria)
                .order('nivel', { ascending: true })

            if (error) throw error
            return data || []

        } catch (error) {
            console.error('Error cargando problemas:', error)
            throw error
        }
    }

    async getNextProblem(currentProblemId, nivel) {
        if (!this.connected) {
            throw new Error('Sin conexión')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('pregunta_anterior_id', currentProblemId)
                .eq('nivel', nivel)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data

        } catch (error) {
            console.error('Error buscando siguiente:', error)
            throw error
        }
    }
}

window.SupabaseClient = SupabaseClient
