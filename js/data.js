// ============================================
// SISTEMA DE DADOS - UAI PIZZARIA & DOCERIA
// ============================================
// IMPORTANTE: Este arquivo agora usa Supabase como banco de dados
// Os dados não são mais armazenados no localStorage

// Cache local para dados carregados
let cachedData = null;
let dataLoadPromise = null;

// ============================================
// FUNÇÃO PRINCIPAL PARA OBTER DADOS
// ============================================
async function loadDataFromSupabase() {
    try {
        // Verificar se dbManager está disponível
        if (typeof dbManager === 'undefined') {
            console.error('❌ Cliente Supabase não carregado. Certifique-se de incluir supabase-client.js antes de data.js');
            return getFallbackData();
        }

        const data = await dbManager.loadAllData();

        // Formatar dados para compatibilidade com código existente
        cachedData = {
            categories: data.categories.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                order: c.display_order
            })),
            products: data.products,
            deliveryFees: data.deliveryFees,
            config: data.config,
            storeInfo: data.storeInfo,
            messages: data.messages
        };

        return cachedData;
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Supabase:', error);
        return getFallbackData();
    }
}

// ============================================
// FUNÇÃO SÍNCRONA COMPATÍVEL COM CÓDIGO EXISTENTE
// Função para obter dados (compatibilidade com código existente)
function getData() {
    // Se já tem cache, retorna
    if (cachedData) {
        return cachedData;
    }

    // Se ainda não iniciou o carregamento, inicia
    if (!dataLoadPromise) {
        dataLoadPromise = loadDataFromSupabase();
    }

    // Retorna dados de fallback enquanto carrega
    return getFallbackData();
}

// Função para forçar recarregamento dos dados (limpa cache)
async function refreshData() {
    console.log('🔄 Forçando recarregamento dos dados...');
    dbManager.clearCache();
    cachedData = null;
    dataLoadPromise = null;
    return await loadDataFromSupabase();
}

// ============================================
// DADOS DE FALLBACK (caso Supabase não esteja disponível)
// ============================================
function getFallbackData() {
    return {
        config: {
            whatsappNumber: '5531999999999',
            sitePaused: false,
            ordersEnabled: true,
            freeDeliveryMinimum: 60.00,
            estimatedDeliveryTime: '45 a 60 minutos',
            adminPassword: 'uai2024'
        },
        storeInfo: {
            name: 'Uai Pizzaria & Doceria',
            address: 'Rua Alagoas, 70B – Cristo Redentor',
            addressComplement: 'Do lado do Hotel Mirian / atrás da rodoviária',
            phone: '(31) 99999-9999',
            email: 'contato@uaipizzaria.com.br',
            instagram: '@uaipizzaria',
            hours: {
                weekdays: 'Segunda a Sábado: 16:00 às 03:00',
                sunday: 'Domingo: 20:00 às 03:00'
            }
        },
        categories: [
            { id: 'pizzas', name: 'Pizzas', icon: '🍕', order: 1 },
            { id: 'doces', name: 'Doces', icon: '🍰', order: 2 },
            { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 3 },
            { id: 'salgados', name: 'Salgados', icon: '🥟', order: 4 }
        ],
        products: [],
        deliveryFees: [
            { neighborhood: 'Cristo Redentor', fee: 0 },
            { neighborhood: 'Centro', fee: 5.00 },
            { neighborhood: 'Bela Vista', fee: 7.00 },
            { neighborhood: 'Santa Efigênia', fee: 8.00 },
            { neighborhood: 'Outros', fee: 10.00 }
        ],
        messages: {
            welcome: 'Boa noite, seja bem-vindo',
            tagline: 'Porque toda história de amor merece um bom começo',
            deliveryBanner: 'Taxa de entrega GRÁTIS para pedidos acima de R$60,00',
            closedMessage: 'Estamos fechados no momento. Volte em breve!'
        }
    };
}

// ============================================
// FUNÇÕES ASSÍNCRONAS PARA ATUALIZAÇÃO DE DADOS
// ============================================

async function saveData(data) {
    try {
        // Atualizar configurações se fornecidas
        if (data.config) {
            await dbManager.updateConfig(data.config);
        }

        // Atualizar informações da loja se fornecidas
        if (data.storeInfo) {
            await dbManager.updateStoreInfo(data.storeInfo);
        }

        // Recarregar dados
        await loadDataFromSupabase();

        return { success: true };
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        return { success: false, error: error.message };
    }
}

async function refreshData() {
    cachedData = null;
    dataLoadPromise = null;
    return await loadDataFromSupabase();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Carregando dados do Supabase...');
    await loadDataFromSupabase();
    console.log('✅ Dados carregados com sucesso!');

    // Disparar evento customizado para notificar que dados foram carregados
    window.dispatchEvent(new CustomEvent('dataLoaded', { detail: cachedData }));
});

// Função legada para compatibilidade (não faz nada, pois dados vêm do Supabase)
function initializeData() {
    console.log('ℹ️ initializeData() chamada - dados agora vêm do Supabase');
}

// Função legada para compatibilidade (não recomendado usar)
function resetData() {
    console.warn('⚠️ resetData() não é suportado com Supabase. Use o painel admin para gerenciar dados.');
    return getData();
}
