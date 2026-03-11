// ============================================
// CLIENTE SUPABASE - UAI HAMBURGUERIA DO CHICO
// ============================================

// Configuração do Supabase
const SUPABASE_URL = 'https://rsgzhywafuftizmpvuwy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZ3poeXdhZnVmdGl6bXB2dXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTAwMzgsImV4cCI6MjA4NjU4NjAzOH0.krJIYACLYKBO9x4vGrhCmPMpsUO2IUZoD-0U9qD9uvk';

// Inicializar cliente Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ============================================
// CLASSE DE GERENCIAMENTO DE DADOS
// ============================================
class SupabaseDataManager {
    constructor() {
        this.cache = {
            products: null,
            categories: null,
            deliveryFees: null,
            config: null,
            storeInfo: null,
            lastUpdate: null
        };
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // ============================================
    // MÉTODOS DE CACHE
    // ============================================

    isCacheValid() {
        if (!this.cache.lastUpdate) return false;
        return (Date.now() - this.cache.lastUpdate) < this.cacheTimeout;
    }

    clearCache() {
        this.cache = {
            products: null,
            categories: null,
            deliveryFees: null,
            config: null,
            storeInfo: null,
            lastUpdate: null
        };
    }

    // ============================================
    // CATEGORIAS
    // ============================================

    async getCategories(forceRefresh = false) {
        if (!forceRefresh && this.cache.categories && this.isCacheValid()) {
            return this.cache.categories;
        }

        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            this.cache.categories = data;
            this.cache.lastUpdate = Date.now();
            return data;
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return this.cache.categories || [];
        }
    }

    // ============================================
    // PRODUTOS
    // ============================================

    async getProducts(forceRefresh = false) {
        if (!forceRefresh && this.cache.products && this.isCacheValid()) {
            return this.cache.products;
        }

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            // Converter para formato compatível com código existente
            const formattedProducts = data.map(p => ({
                id: p.id,
                category: p.category_id,
                name: p.name,
                description: p.description,
                price: parseFloat(p.price),
                image: p.image_url,
                available: p.available
            }));

            this.cache.products = formattedProducts;
            this.cache.lastUpdate = Date.now();
            return formattedProducts;
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return this.cache.products || [];
        }
    }

    async getProductsByCategory(categoryId) {
        const products = await this.getProducts();
        return products.filter(p => p.category === categoryId && p.available);
    }

    async addProduct(product) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .insert([{
                    id: product.id || `product-${Date.now()}`,
                    category_id: product.category,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image_url: product.image || null,
                    available: product.available !== undefined ? product.available : true
                }])
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(productId, updates) {
        try {
            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.category !== undefined) dbUpdates.category_id = updates.category;
            if (updates.available !== undefined) dbUpdates.available = updates.available;
            if (updates.image !== undefined) dbUpdates.image_url = updates.image;

            const { data, error } = await supabaseClient
                .from('products')
                .update(dbUpdates)
                .eq('id', productId)
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(productId) {
        try {
            const { error } = await supabaseClient
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            this.clearCache();
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // TAXAS DE ENTREGA
    // ============================================

    async getDeliveryFees(forceRefresh = false) {
        if (!forceRefresh && this.cache.deliveryFees && this.isCacheValid()) {
            return this.cache.deliveryFees;
        }

        try {
            const { data, error } = await supabaseClient
                .from('delivery_fees')
                .select('*')
                .order('neighborhood', { ascending: true });

            if (error) throw error;

            const formattedFees = data.map(f => ({
                id: f.id,
                neighborhood: f.neighborhood,
                fee: parseFloat(f.fee)
            }));

            this.cache.deliveryFees = formattedFees;
            this.cache.lastUpdate = Date.now();
            return formattedFees;
        } catch (error) {
            console.error('Erro ao buscar taxas de entrega:', error);
            return this.cache.deliveryFees || [];
        }
    }

    async addDeliveryFee(neighborhood, fee) {
        try {
            const { data, error } = await supabaseClient
                .from('delivery_fees')
                .insert([{ neighborhood, fee }])
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao adicionar taxa de entrega:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDeliveryFee(id, neighborhood, fee) {
        try {
            const { data, error } = await supabaseClient
                .from('delivery_fees')
                .update({ neighborhood, fee })
                .eq('id', id)
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar taxa de entrega:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteDeliveryFee(id) {
        try {
            const { error } = await supabaseClient
                .from('delivery_fees')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.clearCache();
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar taxa de entrega:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // ADICIONAIS (ADD-ONS)
    // ============================================

    async getAddons(forceRefresh = false) {
        if (!forceRefresh && this.cache.addons && this.isCacheValid()) {
            return this.cache.addons;
        }

        try {
            const { data, error } = await supabaseClient
                .from('addons')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            const formattedAddons = data.map(a => ({
                id: a.id,
                name: a.name,
                price: parseFloat(a.price),
                categoryId: a.category_id,
                active: a.active
            }));

            this.cache.addons = formattedAddons;
            this.cache.lastUpdate = Date.now();
            return formattedAddons;
        } catch (error) {
            console.error('Erro ao buscar adicionais:', error);
            return this.cache.addons || [];
        }
    }

    async addAddon(addon) {
        try {
            const dbAddon = {
                name: addon.name,
                price: addon.price,
                category_id: addon.categoryId || null,
                active: addon.active !== undefined ? addon.active : true
            };

            const { data, error } = await supabaseClient
                .from('addons')
                .insert([dbAddon])
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao adicionar extra/adicional:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAddon(id, addon) {
        try {
            const dbUpdates = {};
            if (addon.name !== undefined) dbUpdates.name = addon.name;
            if (addon.price !== undefined) dbUpdates.price = addon.price;
            if (addon.categoryId !== undefined) dbUpdates.category_id = addon.categoryId || null;
            if (addon.active !== undefined) dbUpdates.active = addon.active;

            const { data, error } = await supabaseClient
                .from('addons')
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar adicional:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAddon(id) {
        try {
            const { error } = await supabaseClient
                .from('addons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.clearCache();
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar adicional:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // CONFIGURAÇÕES
    // ============================================

    async getConfig(forceRefresh = false) {
        if (!forceRefresh && this.cache.config && this.isCacheValid()) {
            return this.cache.config;
        }

        try {
            const { data, error } = await supabaseClient
                .from('config')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;

            const formattedConfig = {
                whatsappNumber: data.whatsapp_number,
                sitePaused: data.site_paused,
                ordersEnabled: data.orders_enabled,
                freeDeliveryMinimum: parseFloat(data.free_delivery_minimum),
                estimatedDeliveryTime: data.estimated_delivery_time,
                adminPassword: data.admin_password,
                welcomeMessage: data.welcome_message,
                tagline: data.tagline,
                deliveryBanner: data.delivery_banner,
                pixKey: data.pix_key
            };

            this.cache.config = formattedConfig;
            this.cache.lastUpdate = Date.now();
            return formattedConfig;
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            return this.cache.config || {};
        }
    }

    async updateConfig(updates) {
        try {
            const dbUpdates = {};
            if (updates.whatsappNumber !== undefined) dbUpdates.whatsapp_number = updates.whatsappNumber;
            if (updates.sitePaused !== undefined) dbUpdates.site_paused = updates.sitePaused;
            if (updates.ordersEnabled !== undefined) dbUpdates.orders_enabled = updates.ordersEnabled;
            if (updates.freeDeliveryMinimum !== undefined) dbUpdates.free_delivery_minimum = updates.freeDeliveryMinimum;
            if (updates.estimatedDeliveryTime !== undefined) dbUpdates.estimated_delivery_time = updates.estimatedDeliveryTime;
            if (updates.adminPassword !== undefined) dbUpdates.admin_password = updates.adminPassword;
            if (updates.welcomeMessage !== undefined) dbUpdates.welcome_message = updates.welcomeMessage;
            if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
            if (updates.deliveryBanner !== undefined) dbUpdates.delivery_banner = updates.deliveryBanner;
            if (updates.pixKey !== undefined) dbUpdates.pix_key = updates.pixKey;

            if (Object.keys(dbUpdates).length === 0) return { success: true };

            const { data, error } = await supabaseClient
                .from('config')
                .update(dbUpdates)
                .eq('id', 1)
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data?.[0] };
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // INFORMAÇÕES DA LOJA
    // ============================================

    async getStoreInfo(forceRefresh = false) {
        if (!forceRefresh && this.cache.storeInfo && this.isCacheValid()) {
            return this.cache.storeInfo;
        }

        try {
            const { data, error } = await supabaseClient
                .from('store_info')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;

            const formattedInfo = {
                name: data.name,
                address: data.address,
                addressComplement: data.address_complement,
                phone: data.phone,
                email: data.email,
                instagram: data.instagram,
                hours: {
                    weekdays: data.hours_weekdays,
                    sunday: data.hours_sunday
                }
            };

            this.cache.storeInfo = formattedInfo;
            this.cache.lastUpdate = Date.now();
            return formattedInfo;
        } catch (error) {
            console.error('Erro ao buscar informações da loja:', error);
            return this.cache.storeInfo || {};
        }
    }

    async updateStoreInfo(updates) {
        try {
            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            // Aceita tanto camelCase quanto snake_case
            if (updates.addressComplement !== undefined) dbUpdates.address_complement = updates.addressComplement;
            if (updates.address_complement !== undefined) dbUpdates.address_complement = updates.address_complement;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;
            // Aceita tanto aninhado (hours.weekdays) quanto flat (hours_weekdays)
            if (updates.hours?.weekdays !== undefined) dbUpdates.hours_weekdays = updates.hours.weekdays;
            if (updates.hours?.sunday !== undefined) dbUpdates.hours_sunday = updates.hours.sunday;
            if (updates.hours_weekdays !== undefined) dbUpdates.hours_weekdays = updates.hours_weekdays;
            if (updates.hours_sunday !== undefined) dbUpdates.hours_sunday = updates.hours_sunday;

            if (Object.keys(dbUpdates).length === 0) return { success: true };

            const { data, error } = await supabaseClient
                .from('store_info')
                .update(dbUpdates)
                .eq('id', 1)
                .select();

            if (error) throw error;

            this.clearCache();
            return { success: true, data: data?.[0] };
        } catch (error) {
            console.error('Erro ao atualizar informações da loja:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // PEDIDOS
    // ============================================

    async createOrder(orderData) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([{
                    customer_name: orderData.customerName,
                    customer_phone: orderData.customerPhone,
                    delivery_type: orderData.deliveryType,
                    address: orderData.address || null,
                    neighborhood: orderData.neighborhood || null,
                    address_complement: orderData.addressComplement || null,
                    items: orderData.items,
                    subtotal: orderData.subtotal,
                    delivery_fee: orderData.deliveryFee,
                    total: orderData.total,
                    status: 'pending',
                    notes: orderData.notes || null
                }])
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrders(limit = 50) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrderById(orderId) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar pedido por ID:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // CUPONS DE DESCONTO
    // ============================================

    async getCoupons() {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar cupons:', error);
            return { success: false, error: error.message };
        }
    }

    async validateCoupon(code) {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .select('*')
                .ilike('code', code.trim())
                .eq('active', true)
                .single();
            if (error) return { success: false, error: 'Cupom nao encontrado' };
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createCoupon(couponData) {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .insert([{
                    code: couponData.code.toUpperCase().trim(),
                    type: couponData.type,
                    value: couponData.value || 0,
                    active: couponData.active ?? true,
                    min_order: couponData.minOrder || 0,
                    uses_limit: couponData.usesLimit || null,
                    description: couponData.description || null
                }])
                .select();
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao criar cupom:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCoupon(id, couponData) {
        try {
            const updates = {};
            if (couponData.code !== undefined) updates.code = couponData.code.toUpperCase().trim();
            if (couponData.type !== undefined) updates.type = couponData.type;
            if (couponData.value !== undefined) updates.value = couponData.value;
            if (couponData.active !== undefined) updates.active = couponData.active;
            if (couponData.minOrder !== undefined) updates.min_order = couponData.minOrder;
            if (couponData.usesLimit !== undefined) updates.uses_limit = couponData.usesLimit;
            if (couponData.description !== undefined) updates.description = couponData.description;

            const { data, error } = await supabaseClient
                .from('coupons')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar cupom:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCoupon(id) {
        try {
            const { error } = await supabaseClient
                .from('coupons')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar cupom:', error);
            return { success: false, error: error.message };
        }
    }


    async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // STORAGE - UPLOAD DE IMAGEM
    // ============================================
    async uploadProductImage(file) {
        try {
            if (!file) return { success: false, error: 'Nenhum arquivo providenciado' };

            // Gerar um nome único
            const fileExt = file.name.split('.').pop();
            const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

            // Em casos onde RLS buga o supabase.storage SDK, um POST REST resolve forçadamente:
            const uploadUrl = `${SUPABASE_URL}/storage/v1/object/products/${fileName}`;

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_PUBLISHABLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                    'Content-Type': file.type,
                    'cache-control': '3600'
                },
                body: file
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro Fetch Upload:", errorData);
                throw new Error(errorData.message || errorData.error || 'Erro na requisição');
            }

            // O endpoint de URL público é predeterminado no Supabase (se o bucket é publico)
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;

            return { success: true, url: publicUrl };
        } catch (error) {
            console.error('Erro ao fazer upload de imagem:', error);
            let errorMsg = error.message;
            if (errorMsg.includes('The resource was not found') || errorMsg.includes('Bucket not found')) {
                errorMsg = 'O bucket "products" não existe no Supabase Storage ou a permissão ainda está bloqueando.';
            }
            return { success: false, error: errorMsg };
        }
    }

    // ============================================
    // MÉTODO PARA CARREGAR TODOS OS DADOS
    // ============================================

    async loadAllData() {
        try {
            const [categories, products, deliveryFees, config, storeInfo, addons] = await Promise.all([
                this.getCategories(true),
                this.getProducts(true),
                this.getDeliveryFees(true),
                this.getConfig(true),
                this.getStoreInfo(true),
                this.getAddons(true)
            ]);

            return {
                categories,
                products,
                deliveryFees,
                config,
                storeInfo,
                addons,
                messages: {
                    welcome: config.welcomeMessage,
                    tagline: config.tagline,
                    deliveryBanner: config.deliveryBanner
                }
            };
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            throw error;
        }
    }

    // ============================================
    // TESTE DE CONEXÃO
    // ============================================

    async testConnection() {
        try {
            const { data, error } = await supabaseClient
                .from('config')
                .select('id')
                .limit(1);

            if (error) throw error;

            console.log('✅ Conexão com Supabase estabelecida com sucesso!');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao conectar com Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // PEDIDOS
    // ============================================

    async createOrder(orderData) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([{
                    customer_name: orderData.customerName,
                    customer_phone: orderData.customerPhone,
                    delivery_type: orderData.deliveryType,
                    address: orderData.address || null,
                    neighborhood: orderData.neighborhood || null,
                    address_complement: orderData.addressComplement || null,
                    items: orderData.items,
                    subtotal: orderData.subtotal,
                    delivery_fee: orderData.deliveryFee || 0,
                    total: orderData.total,
                    status: 'pending',
                    notes: orderData.notes || null
                }])
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrders(limit = 100) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            return { success: false, error: error.message };
        }
    }
}

// Instância global do gerenciador de dados
const dbManager = new SupabaseDataManager();

// Testar conexão ao carregar
dbManager.testConnection();
