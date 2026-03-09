# 🍕 Integração Supabase - Uai Pizzaria & Doceria

## ✅ O que foi feito

A integração do Supabase foi concluída com sucesso! Agora o sistema usa um banco de dados real na nuvem ao invés do localStorage.

## 📋 Próximos Passos

### 1. Executar o Schema SQL no Supabase

1. Acesse o painel do Supabase: https://rsgzhywafuftizmpvuwy.supabase.co
2. Vá em **SQL Editor** no menu lateral
3. Abra o arquivo `supabase/schema.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** para executar

Isso irá criar:
- ✅ Todas as tabelas necessárias
- ✅ Políticas de segurança (RLS)
- ✅ Dados iniciais (produtos, categorias, configurações)

### 2. Testar o Sistema

Após executar o schema SQL:

1. Abra o site localmente
2. Verifique o console do navegador (F12)
3. Você deve ver: `✅ Conexão com Supabase estabelecida com sucesso!`
4. Os produtos devem carregar automaticamente do banco de dados

### 3. Verificar Dados no Supabase

No painel do Supabase:
1. Vá em **Table Editor**
2. Verifique as tabelas:
   - `products` - deve ter 10 produtos
   - `categories` - deve ter 4 categorias
   - `delivery_fees` - deve ter 5 bairros
   - `config` - deve ter 1 registro
   - `store_info` - deve ter 1 registro

## 🔧 O que mudou

### Arquivos Criados
- `js/supabase-client.js` - Cliente Supabase com todas as funções de banco de dados
- `supabase/schema.sql` - Schema completo do banco de dados

### Arquivos Modificados
- `js/data.js` - Agora carrega dados do Supabase ao invés do localStorage
- `index.html` - Adicionado scripts do Supabase
- `cardapio.html` - Adicionado scripts do Supabase
- `admin.html` - Adicionado scripts do Supabase
- `pedido.html` - Precisa adicionar scripts do Supabase manualmente (veja abaixo)

### ⚠️ Ação Manual Necessária: pedido.html

Adicione estas linhas no arquivo `pedido.html` ANTES da linha `<!-- Scripts -->` (linha 391):

```html
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-client.js"></script>
```

## 📊 Funcionalidades

### Painel Administrativo
Agora todas as alterações feitas no painel admin são salvas no Supabase:
- ✅ Adicionar/editar/remover produtos
- ✅ Gerenciar taxas de entrega
- ✅ Atualizar configurações
- ✅ Modificar informações da loja

### Sistema de Pedidos
- ✅ Carrinho continua no localStorage (dados temporários)
- ✅ Produtos carregados do Supabase
- ✅ Histórico de pedidos salvo no banco (novo recurso!)

### Cache Inteligente
- ✅ Dados são cacheados localmente por 5 minutos
- ✅ Reduz chamadas à API
- ✅ Melhora performance

## 🔐 Segurança

- ✅ Apenas a chave pública (PUBLISHABLE KEY) é usada no frontend
- ✅ Políticas RLS configuradas para leitura pública
- ✅ Escrita temporariamente pública (para desenvolvimento)

> **⚠️ IMPORTANTE**: Em produção, você deve configurar autenticação real e restringir as políticas de escrita apenas para usuários admin autenticados.

## 🐛 Solução de Problemas

### Produtos não aparecem
1. Verifique o console do navegador (F12)
2. Confirme que o schema SQL foi executado
3. Verifique se há dados nas tabelas do Supabase

### Erro de conexão
1. Verifique se as credenciais estão corretas em `js/supabase-client.js`
2. Confirme que o projeto Supabase está ativo
3. Verifique sua conexão com a internet

### Dados antigos do localStorage
- Os dados antigos do localStorage não interferem
- O sistema agora usa apenas o Supabase
- Você pode limpar o localStorage se desejar

## 📝 Notas Técnicas

### Compatibilidade
- ✅ Código existente continua funcionando
- ✅ Funções `getData()` e `saveData()` mantidas
- ✅ Evento `dataLoaded` para sincronização

### Performance
- Cache local de 5 minutos
- Carregamento assíncrono de dados
- Fallback para dados padrão se Supabase estiver offline

## 🎉 Benefícios

1. **Dados Persistentes**: Não se perdem ao limpar o navegador
2. **Sincronização**: Mesmos dados em todos os dispositivos
3. **Escalabilidade**: Suporta múltiplos usuários simultâneos
4. **Backup Automático**: Supabase faz backup dos dados
5. **Histórico**: Todos os pedidos são salvos para análise
