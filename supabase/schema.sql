-- ============================================
-- SCHEMA DO BANCO DE DADOS - UAI HAMBURGUERIA DO CHICO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- URL: https://rsgzhywafuftizmpvuwy.supabase.co

-- ============================================
-- 1. TABELA DE CATEGORIAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhorar performance de busca por categoria
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- ============================================
-- 3. TABELA DE TAXAS DE ENTREGA
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_fees (
    id SERIAL PRIMARY KEY,
    neighborhood TEXT NOT NULL UNIQUE,
    fee DECIMAL(10, 2) NOT NULL CHECK (fee >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABELA DE CONFIGURAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    whatsapp_number TEXT NOT NULL,
    site_paused BOOLEAN DEFAULT false,
    orders_enabled BOOLEAN DEFAULT true,
    free_delivery_minimum DECIMAL(10, 2) DEFAULT 60.00,
    estimated_delivery_time TEXT DEFAULT '45 a 60 minutos',
    admin_password TEXT NOT NULL DEFAULT 'uai2024',
    welcome_message TEXT,
    tagline TEXT,
    delivery_banner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_config CHECK (id = 1)
);

-- ============================================
-- 5. TABELA DE INFORMAÇÕES DA LOJA
-- ============================================
CREATE TABLE IF NOT EXISTS store_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    address_complement TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    instagram TEXT,
    hours_weekdays TEXT,
    hours_sunday TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_store_info CHECK (id = 1)
);

-- ============================================
-- 6. TABELA DE PEDIDOS (HISTÓRICO)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
    address TEXT,
    neighborhood TEXT,
    address_complement TEXT,
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- ============================================
-- 7. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar automaticamente updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_fees_updated_at ON delivery_fees;
CREATE TRIGGER update_delivery_fees_updated_at BEFORE UPDATE ON delivery_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_info_updated_at ON store_info;
CREATE TRIGGER update_store_info_updated_at BEFORE UPDATE ON store_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 8. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas de LEITURA PÚBLICA (qualquer um pode ler)
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON categories;
CREATE POLICY "Permitir leitura pública de categorias" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON products;
CREATE POLICY "Permitir leitura pública de produtos" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de taxas de entrega" ON delivery_fees;
CREATE POLICY "Permitir leitura pública de taxas de entrega" ON delivery_fees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de configurações" ON config;
CREATE POLICY "Permitir leitura pública de configurações" ON config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de informações da loja" ON store_info;
CREATE POLICY "Permitir leitura pública de informações da loja" ON store_info FOR SELECT USING (true);

-- Políticas de ESCRITA PÚBLICA (temporário - para desenvolvimento sem autenticação)
-- IMPORTANTE: Em produção, você deve restringir isso apenas para usuários autenticados como admin
DROP POLICY IF EXISTS "Permitir escrita em categorias" ON categories;
CREATE POLICY "Permitir escrita em categorias" ON categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir escrita em produtos" ON products;
CREATE POLICY "Permitir escrita em produtos" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir escrita em taxas de entrega" ON delivery_fees;
CREATE POLICY "Permitir escrita em taxas de entrega" ON delivery_fees FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir escrita em configurações" ON config;
CREATE POLICY "Permitir escrita em configurações" ON config FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir escrita em informações da loja" ON store_info;
CREATE POLICY "Permitir escrita em informações da loja" ON store_info FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir escrita em pedidos" ON orders;
CREATE POLICY "Permitir escrita em pedidos" ON orders FOR ALL USING (true);


-- ============================================
-- 9. DADOS INICIAIS
-- ============================================

-- Categorias
INSERT INTO categories (id, name, icon, display_order) VALUES
    ('pizzas', 'Pizzas', '🍕', 1),
    ('doces', 'Doces', '🍰', 2),
    ('bebidas', 'Bebidas', '🥤', 3),
    ('salgados', 'Salgados', '🥟', 4)
ON CONFLICT (id) DO NOTHING;

-- Produtos - Pizzas
INSERT INTO products (id, category_id, name, description, price, available) VALUES
    ('pizza-1', 'pizzas', 'Pizza Margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite', 45.00, true),
    ('pizza-2', 'pizzas', 'Pizza Calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', 48.00, true),
    ('pizza-3', 'pizzas', 'Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitonas', 52.00, true),
    ('pizza-4', 'pizzas', 'Pizza Quatro Queijos', 'Mussarela, provolone, gorgonzola e parmesão', 55.00, true)
ON CONFLICT (id) DO NOTHING;

-- Produtos - Doces
INSERT INTO products (id, category_id, name, description, price, available) VALUES
    ('doce-1', 'doces', 'Bolo de Chocolate', 'Bolo de chocolate com cobertura de brigadeiro', 8.00, true),
    ('doce-2', 'doces', 'Torta de Morango', 'Torta cremosa com morangos frescos', 12.00, true),
    ('doce-3', 'doces', 'Brownie', 'Brownie de chocolate com nozes', 10.00, true)
ON CONFLICT (id) DO NOTHING;

-- Produtos - Bebidas
INSERT INTO products (id, category_id, name, description, price, available) VALUES
    ('bebida-1', 'bebidas', 'Refrigerante Lata', 'Coca-Cola, Guaraná, Fanta (350ml)', 5.00, true),
    ('bebida-2', 'bebidas', 'Refrigerante 2L', 'Coca-Cola, Guaraná, Fanta', 12.00, true),
    ('bebida-3', 'bebidas', 'Suco Natural', 'Laranja, Limão ou Maracujá (500ml)', 8.00, true)
ON CONFLICT (id) DO NOTHING;

-- Taxas de Entrega
INSERT INTO delivery_fees (neighborhood, fee) VALUES
    ('Cristo Redentor', 0.00),
    ('Centro', 5.00),
    ('Bela Vista', 7.00),
    ('Santa Efigênia', 8.00),
    ('Outros', 10.00)
ON CONFLICT (neighborhood) DO NOTHING;

-- Configurações
INSERT INTO config (id, whatsapp_number, site_paused, orders_enabled, free_delivery_minimum, 
                    estimated_delivery_time, admin_password, welcome_message, tagline, delivery_banner) 
VALUES (
    1,
    '5531999999999',
    false,
    true,
    60.00,
    '45 a 60 minutos',
    'uai2024',
    'Boa noite, seja bem-vindo',
    'Porque toda história de amor merece um bom começo',
    'Taxa de entrega GRÁTIS para pedidos acima de R$60,00'
)
ON CONFLICT (id) DO NOTHING;

-- Informações da Loja
INSERT INTO store_info (id, name, address, address_complement, phone, email, instagram, hours_weekdays, hours_sunday)
VALUES (
    1,
    'Uai Hamburgueria do Chico',
    'Rua Alagoas, 70B – Cristo Redentor',
    'Do lado do Hotel Mirian / atrás da rodoviária',
    '(31) 99999-9999',
    'contato@uaihamburgueriadochico.com.br',
    '@uaihamburgueriadochico',
    'Segunda a Sábado: 16:00 às 03:00',
    'Domingo: 20:00 às 03:00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, seu banco de dados estará pronto!
-- Próximo passo: configurar o cliente JavaScript

-- ============================================
-- 10. SETUP DO STORAGE DE IMAGENS (BUCKET)
-- ============================================

-- Garante que as policies de storage antigas não conflitem
DROP POLICY IF EXISTS "Imagens de produtos são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload anonimo para products" ON storage.objects;

-- Cria o bucket explicitamente como "publico"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permite todo tipo de select público
CREATE POLICY "Imagens de produtos são publicamente acessíveis"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'products' );

-- Permite Upload universal (qualquer pessoa para demonstração)
CREATE POLICY "Permitir upload anonimo para products"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'products' );

-- Permite deleção/edição pelo banco
DROP POLICY IF EXISTS "Permitir deleção para products" ON storage.objects;
CREATE POLICY "Permitir deleção para products"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'products' );

DROP POLICY IF EXISTS "Permitir update para products" ON storage.objects;
CREATE POLICY "Permitir update para products"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'products' );


-- ============================================
-- 11. TABELA DE CUPONS DE DESCONTO
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    min_order DECIMAL(10,2) DEFAULT 0,
    uses_limit INTEGER DEFAULT NULL,
    uses_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica de cupons" ON coupons;
CREATE POLICY "Leitura publica de cupons" ON coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escrita de cupons" ON coupons;
CREATE POLICY "Escrita de cupons" ON coupons FOR ALL USING (true);


-- Cupons de exemplo
INSERT INTO coupons (code, type, value, active, min_order, description) VALUES
    ('PROMO10', 'percent', 10, true, 0, '10% de desconto'),
    ('FRETE0', 'free_shipping', 0, true, 30, 'Frete gratis acima de R$30')
ON CONFLICT (code) DO NOTHING;

