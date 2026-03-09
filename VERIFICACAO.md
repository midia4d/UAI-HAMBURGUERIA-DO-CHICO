# ✅ Checklist de Verificação - Integração Supabase

## 📋 Status da Integração

### ✅ Arquivos Criados
- [x] `supabase/schema.sql` - Schema do banco de dados
- [x] `js/supabase-client.js` - Cliente Supabase
- [x] `SUPABASE_README.md` - Documentação

### ✅ Arquivos Modificados
- [x] `js/data.js` - Migrado para Supabase
- [x] `index.html` - Scripts adicionados
- [x] `cardapio.html` - Scripts adicionados  
- [x] `pedido.html` - Scripts adicionados ✅ (você fez!)
- [x] `admin.html` - Scripts adicionados

### ⚠️ Pendente
- [ ] **Executar schema SQL no Supabase**
- [ ] **Testar no navegador**

---

## 🧪 Como Testar Agora

### Passo 1: Executar o Schema SQL

1. **Acesse o painel do Supabase:**
   - URL: https://rsgzhywafuftizmpvuwy.supabase.co
   - Faça login se necessário

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New Query**

3. **Execute o schema:**
   - Abra o arquivo `supabase/schema.sql` no seu editor
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   - Cole no SQL Editor do Supabase
   - Clique em **RUN** (ou Ctrl+Enter)

4. **Verifique se executou com sucesso:**
   - Deve aparecer "Success. No rows returned"
   - Se houver erro, copie a mensagem e me envie

### Passo 2: Testar no Navegador

O servidor já está rodando em: **http://localhost:8000**

1. **Abra o navegador:**
   - Chrome, Firefox ou Edge
   - Navegue para: http://localhost:8000

2. **Abra o Console do Desenvolvedor:**
   - Pressione **F12** ou **Ctrl+Shift+I**
   - Vá na aba **Console**

3. **Verifique as mensagens:**
   
   Você DEVE ver estas mensagens:
   ```
   ✅ Conexão com Supabase estabelecida com sucesso!
   🔄 Carregando dados do Supabase...
   ✅ Dados carregados com sucesso!
   ```

4. **Verifique se há erros:**
   - Mensagens em vermelho indicam problemas
   - Se houver erros, copie e me envie

5. **Verifique se os produtos aparecem:**
   - Role a página para baixo
   - Deve aparecer a seção "Nossos Destaques"
   - Devem aparecer produtos (pizzas, doces, bebidas)

### Passo 3: Testar o Cardápio

1. **Clique em "Ver Cardápio Completo"**
2. **Verifique:**
   - [ ] Produtos aparecem organizados por categoria
   - [ ] Preços estão corretos
   - [ ] Botão "Pedir" funciona

### Passo 4: Testar Painel Admin

1. **Navegue para:** http://localhost:8000/admin.html
2. **Faça login:**
   - Senha padrão: `uai2024`
3. **Teste adicionar um produto:**
   - Clique em "+ Adicionar Novo Produto"
   - Preencha os campos
   - Clique em "Adicionar Produto"
4. **Verifique:**
   - [ ] Produto aparece na lista
   - [ ] Produto aparece no cardápio público
   - [ ] Dados persistem ao recarregar a página

---

## 🐛 Possíveis Problemas e Soluções

### ❌ Erro: "relation 'products' does not exist"
**Causa:** Schema SQL não foi executado  
**Solução:** Execute o Passo 1 acima

### ❌ Produtos não aparecem
**Causa:** Dados não foram inseridos ou há erro de conexão  
**Solução:**
1. Verifique o console para erros
2. Confirme que executou o schema SQL completo
3. Vá no Supabase → Table Editor → Verifique se a tabela `products` tem dados

### ❌ Erro de CORS
**Causa:** Acessando via `file://` ao invés de servidor HTTP  
**Solução:** Use http://localhost:8000 (servidor já está rodando)

### ❌ "dbManager is not defined"
**Causa:** Scripts não carregaram na ordem correta  
**Solução:** Verifique se os scripts estão nesta ordem:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/data.js"></script>
```

---

## ✅ Checklist Final

Marque conforme for testando:

### Banco de Dados
- [ ] Schema SQL executado sem erros
- [ ] Tabelas criadas (products, categories, delivery_fees, config, store_info, orders)
- [ ] Dados iniciais inseridos (10 produtos, 4 categorias, etc.)

### Conexão
- [ ] Mensagem "✅ Conexão com Supabase estabelecida" aparece no console
- [ ] Mensagem "✅ Dados carregados com sucesso!" aparece no console
- [ ] Sem erros no console

### Funcionalidades
- [ ] Produtos aparecem na página inicial
- [ ] Cardápio completo funciona
- [ ] Página de pedidos carrega
- [ ] Painel admin carrega
- [ ] Consegue adicionar produto no admin
- [ ] Produto adicionado aparece no site
- [ ] Dados persistem ao recarregar página

---

## 📸 Me Envie

Para eu confirmar que está tudo funcionando, tire prints e me envie:

1. **Console do navegador** mostrando as mensagens de sucesso
2. **Página inicial** com os produtos carregados
3. **Table Editor do Supabase** mostrando a tabela `products` com dados

---

## 🎉 Próximos Passos (Após Verificação)

Quando tudo estiver funcionando:

1. **Atualizar número do WhatsApp:**
   - Painel Admin → Configurações → WhatsApp

2. **Personalizar produtos:**
   - Painel Admin → Produtos → Editar/Adicionar

3. **Configurar taxas de entrega:**
   - Painel Admin → Taxas de Entrega

4. **Deploy (opcional):**
   - Hospedar em Vercel, Netlify ou GitHub Pages
   - Configurar domínio personalizado

---

## 🆘 Precisa de Ajuda?

Se encontrar qualquer problema:
1. Copie a mensagem de erro completa
2. Tire um print do console
3. Me envie e eu te ajudo!
