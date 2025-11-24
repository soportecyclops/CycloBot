// CYCLOPSBOT - Cliente Supabase MEJORADO
console.log('🚀 Inicializando cliente Supabase mejorado...');

const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
async function verificarConexionSupabase() {
    try {
        console.log('🔍 Verificando conexión a Supabase...');
        
        const { data, error } = await supabase
            .from('problemas')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Error de conexión:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Conexión a Supabase establecida correctamente');
        return { success: true, data: data };
        
    } catch (error) {
        console.error('❌ Error crítico de conexión:', error);
        return { success: false, error: error.message };
    }
}

// Obtener categorías desde Supabase
async function obtenerCategorias() {
    try {
        console.log('📂 Obteniendo categorías desde Supabase...');
        
        const { data, error } = await supabase
            .from('problemas')
            .select('categoria')
            .not('categoria', 'is', null);

        if (error) throw error;

        // Filtrar categorías únicas
        const categoriasUnicas = [...new Set(data.map(item => item.categoria))];
        console.log(`✅ ${categoriasUnicas.length} categorías encontradas:`, categoriasUnicas);
        
        return categoriasUnicas;
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        return ['internet', 'software', 'hardware', 'movil', 'seguridad_digital'];
    }
}

// Obtener problemas por categoría
async function obtenerProblemasPorCategoria(categoria) {
    try {
        console.log(`🔍 Buscando problemas para categoría: ${categoria}`);
        
        const { data, error } = await supabase
            .from('problemas')
            .select('*')
            .eq('categoria', categoria)
            .order('nivel')
            .limit(20);

        if (error) throw error;

        console.log(`✅ ${data.length} problemas encontrados para ${categoria}`);
        
        // Procesar datos para asegurar estructura correcta
        return data.map(problema => ({
            ...problema,
            // Asegurar que preguntas sea un array
            preguntas: Array.isArray(problema.preguntas) ? problema.preguntas : 
                      problema.preguntas ? [problema.preguntas] : ['¿Podrías describir el problema?'],
            // Asegurar que respuestas_posibles sea un array
            respuestas_posibles: Array.isArray(problema.respuestas_posibles) ? problema.respuestas_posibles : 
                               problema.respuestas_posibles ? [problema.respuestas_posibles] : 
                               ['Sí', 'No', 'No lo sé'],
            // Valores por defecto
            tipo_pregunta: problema.tipo_pregunta || 'opciones',
            nivel: problema.nivel || 1
        }));
        
    } catch (error) {
        console.error(`❌ Error obteniendo problemas para ${categoria}:`, error);
        return [];
    }
}

// Obtener siguiente pregunta
async function obtenerSiguientePregunta(categoria, preguntaAnteriorId = null) {
    try {
        let query = supabase
            .from('problemas')
            .select('*')
            .eq('categoria', categoria);

        if (preguntaAnteriorId) {
            query = query.eq('pregunta_anterior_id', preguntaAnteriorId);
        } else {
            query = query.eq('nivel', 1);
        }

        const { data, error } = await query.order('nivel').limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const pregunta = data[0];
            // Procesar la pregunta para asegurar estructura correcta
            return {
                ...pregunta,
                preguntas: Array.isArray(pregunta.preguntas) ? pregunta.preguntas : 
                          pregunta.preguntas ? [pregunta.preguntas] : ['¿Podrías describir el problema?'],
                respuestas_posibles: Array.isArray(pregunta.respuestas_posibles) ? pregunta.respuestas_posibles : 
                                   pregunta.respuestas_posibles ? [pregunta.respuestas_posibles] : 
                                   ['Sí', 'No', 'No lo sé'],
                tipo_pregunta: pregunta.tipo_pregunta || 'opciones'
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error obteniendo siguiente pregunta:', error);
        return null;
    }
}

// Buscar diagnóstico final
async function obtenerDiagnosticoFinal(categoria, respuestasUsuario) {
    try {
        const { data, error } = await supabase
            .from('problemas')
            .select('*')
            .eq('categoria', categoria)
            .eq('es_pregunta_final', true)
            .order('id')
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const diagnostico = data[0];
            return {
                ...diagnostico,
                // Asegurar que soluciones sea un array
                soluciones: Array.isArray(diagnostico.soluciones) ? diagnostico.soluciones : 
                           diagnostico.soluciones ? [diagnostico.soluciones] : []
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error obteniendo diagnóstico final:', error);
        return null;
    }
}

// Obtener estadísticas de problemas
async function obtenerEstadisticasProblemas() {
    try {
        const { data, error } = await supabase
            .from('problemas')
            .select('id', { count: 'exact' });

        if (error) throw error;

        return data ? data.length : 0;
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return 0;
    }
}

// Exportar funciones para uso global
window.SupabaseClient = {
    verificarConexionSupabase,
    obtenerCategorias,
    obtenerProblemasPorCategoria,
    obtenerSiguientePregunta,
    obtenerDiagnosticoFinal,
    obtenerEstadisticasProblemas,
    supabase
};

console.log('✅ Cliente Supabase mejorado inicializado y listo');
