// supabase-client.js - Conexión REAL a tu Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURACIÓN DE TU PROYECTO SUPABASE - KEY REAL
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co'
const SUPABASE_ANON_KEY = 'sb_secret_J4waGKc2XkrFPWtp8U48mA_Q50aVcOI'

class SupabaseClient {
    constructor() {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.connected = false
        this.init()
    }

    async init() {
        try {
            console.log('🔗 Conectando a Supabase...')
            
            // Test de conexión simple
            const { data, error } = await this.client
                .from('problemas')
                .select('id')
                .limit(1)
            
            if (error) {
                console.error('❌ Error de conexión:', error)
                this.updateStatusIndicator('error')
                this.showConnectionError(error)
                return
            }
            
            this.connected = true
            console.log('✅ Conectado a Supabase - Base de datos operativa')
            this.updateStatusIndicator('online')
            this.showConnectionSuccess()
            
        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error)
            this.connected = false
            this.updateStatusIndicator('error')
            this.showConnectionError(error)
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
            const existingMsg = messagesContainer.querySelector('.connection-status')
            if (existingMsg) existingMsg.remove()
            
            const messageDiv = document.createElement('div')
            messageDiv.className = 'message message-system connection-status'
            messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Conectado a base de datos Supabase`
            messagesContainer.appendChild(messageDiv)
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
    }

    showConnectionError(error) {
        const messagesContainer = document.getElementById('chatMessages')
        if (messagesContainer) {
            const messageDiv = document.createElement('div')
            messageDiv.className = 'message message-system connection-status'
            messageDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                ❌ Error de conexión: ${error.message || 'No se pudo conectar a la base de datos'}
            `
            messagesContainer.appendChild(messageDiv)
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
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
                // PGRST116 = no results found (es normal)
                if (error.code === 'PGRST116') {
                    console.log('ℹ️ No hay más preguntas en el flujo')
                    return null
                }
                throw error
            }

            return data

        } catch (error) {
            console.error('❌ Error buscando siguiente problema:', error)
            throw error
        }
    }

    // Obtener problema por ID
    async getProblemById(id) {
        if (!this.connected) {
            throw new Error('No hay conexión a la base de datos')
        }

        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data

        } catch (error) {
            console.error('❌ Error cargando problema:', error)
            throw error
        }
    }

    // Verificar salud de la base de datos
    async healthCheck() {
        try {
            const { data, error } = await this.client
                .from('problemas')
                .select('count')
                .limit(1)

            if (error) throw error
            return { healthy: true, message: 'Base de datos operativa' }
            
        } catch (error) {
            return { healthy: false, message: error.message }
        }
    }
}

// Exportar para uso global
window.SupabaseClient = SupabaseClient
