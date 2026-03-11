// ============================================
// SISTEMA DE DADOS - UAI HAMBURGUERIA DO CHICO
// ============================================

// Cache em memória
let cachedData = null;
let dataLoadPromise = null;

const CACHE_KEY = 'uai_data_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ============================================
// CACHE NO LOCALSTORAGE (Stale-While-Revalidate)
// ============================================

function saveToLocalCache(data) {
    try {
        const payload = { data, ts: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) { /* Ignora erros de quota */ }
}

function loadFromLocalCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        // Aceita cache mesmo "stale" para exibir conteúdo rápido
        return payload.data || null;
    } catch (e) {
        return null;
    }
}

function isCacheStale() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return true;
        const payload = JSON.parse(raw);
        return (Date.now() - payload.ts) > CACHE_TTL;
    } catch (e) {
        return true;
    }
}

// ============================================
// FUNÇÃO PRINCIPAL PARA OBTER DADOS
// ============================================
async function loadDataFromSupabase() {
    try {
        if (typeof dbManager === 'undefined') {
            console.error('❌ Cliente Supabase não carregado.');
            return loadFromLocalCache() || getFallbackData();
        }

        console.log('🔄 Carregando dados do Supabase...');
        const data = await dbManager.loadAllData();

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
            addons: data.addons,
            // messages construído a partir dos campos da config no banco
            messages: {
                welcome: data.config?.welcomeMessage || 'Seja bem-vindo!',
                tagline: data.config?.tagline || 'Porque toda história de amor merece um bom começo',
                deliveryBanner: data.config?.deliveryBanner || 'Taxa de entrega GRÁTIS para pedidos acima de R$60,00',
                closedMessage: 'Estamos fechados no momento. Volte em breve!'
            }
        };

        saveToLocalCache(cachedData);
        console.log('✅ Dados carregados com sucesso!');
        return cachedData;
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Supabase:', error);
        return loadFromLocalCache() || getFallbackData();
    }
}

// ============================================
// FUNÇÃO SÍNCRONA COMPATÍVEL COM CÓDIGO EXISTENTE
// ============================================
function getData() {
    // Se tem cache em memória, retorna imediatamente
    if (cachedData) return cachedData;

    // Se tem cache no localStorage, retorna ele imediatamente
    const localCache = loadFromLocalCache();
    if (localCache) {
        cachedData = localCache;
        // Atualiza em background se o cache estiver stale (>5min)
        if (isCacheStale() && !dataLoadPromise) {
            dataLoadPromise = loadDataFromSupabase().then(fresh => {
                cachedData = fresh;
                window.dispatchEvent(new CustomEvent('dataLoaded', { detail: fresh }));
            });
        }
        return cachedData;
    }

    // Sem cache nenhum – inicia carregamento
    if (!dataLoadPromise) {
        dataLoadPromise = loadDataFromSupabase();
    }
    return getFallbackData();
}

// Força recarregamento (chamado pelo admin após salvar)
async function refreshData() {
    console.log('🔄 Forçando recarregamento dos dados...');
    dbManager.clearCache();
    cachedData = null;
    dataLoadPromise = null;
    localStorage.removeItem(CACHE_KEY);
    const fresh = await loadDataFromSupabase();
    // Notifica todas as páginas abertas que os dados mudaram
    window.dispatchEvent(new CustomEvent('dataLoaded', { detail: fresh }));
    return fresh;
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
            name: 'Uai Hamburgueria do Chico',
            address: 'Rua Alagoas, 70B – Cristo Redentor',
            addressComplement: 'Do lado do Hotel Mirian / atrás da rodoviária',
            phone: '(31) 99999-9999',
            email: 'contato@uaihamburgueriadochico.com.br',
            instagram: '@uaihamburgueriadochico',
            hours: {
                weekdays: 'Segunda a Sábado: 16:00 às 03:00',
                sunday: 'Domingo: 20:00 às 03:00'
            }
        },
        categories: [
            { id: 'pizzas', name: 'Pizzas', icon: 'fa-solid fa-pizza-slice', order: 1 },
            { id: 'doces', name: 'Doces', icon: 'fa-solid fa-cake-candles', order: 2 },
            { id: 'bebidas', name: 'Bebidas', icon: 'fa-solid fa-mug-hot', order: 3 },
            { id: 'salgados', name: 'Salgados', icon: 'fa-solid fa-bread-slice', order: 4 }
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
        },
        addons: []
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

// Removido: refreshData duplicado estava aqui e sobrescrevia a versão correta acima.

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
