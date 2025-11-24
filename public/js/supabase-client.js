// CYCLOPSBOT - Cliente Supabase
console.log('🚀 Inicializando cliente Supabase...');

// Configuración de Supabase
const SUPABASE_URL = 'https://nmpvbcfbrhtcfyovjzul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcHZiY2Zicmh0Y2Z5b3ZqenVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQ0NjAsImV4cCI6MjA3ODYwMDQ2MH0.9-FalpRfqQmD_72ZDbVnBbN7EU7lwgzsX2zNWz8er_4';

// Inicializar cliente Supabase
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
        // Fallback a categorías predefinidas
        return ['internet', 'celulares_moviles', 'software', 'hardware'];
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
            .order('nivel');

        if (error) throw error;

        console.log(`✅ ${data.length} problemas encontrados para ${categoria}`);
        return data;
        
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

        return data && data.length > 0 ? data[0] : null;
        
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

        return data && data.length > 0 ? data[0] : null;
        
    } catch (error) {
        console.error('❌ Error obteniendo diagnóstico final:', error);
        return null;
    }
}

// Exportar funciones para uso global
window.SupabaseClient = {
    verificarConexionSupabase,
    obtenerCategorias,
    obtenerProblemasPorCategoria,
    obtenerSiguientePregunta,
    obtenerDiagnosticoFinal,
    supabase
};

console.log('✅ Cliente Supabase inicializado y listo');
