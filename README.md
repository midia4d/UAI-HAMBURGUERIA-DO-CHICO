# Uai Pizzaria & Doceria - Website

Site completo e moderno para a **Uai Pizzaria & Doceria**, otimizado para pedidos no local e delivery.

## 🚀 Características

- ✅ Design moderno, responsivo e otimizado para celular
- ✅ Sistema de cardápio editável por categorias
- ✅ Carrinho de compras com cálculo de entrega
- ✅ Integração direta com WhatsApp
- ✅ Painel administrativo completo (no-code)
- ✅ Controle de horário de funcionamento
- ✅ Sistema de taxas de entrega por bairro
- ✅ PWA (Progressive Web App)

## 📱 Como Usar

### Para Clientes

1. Acesse o site pelo navegador
2. Navegue pelo cardápio
3. Adicione produtos ao carrinho
4. Escolha entre delivery ou retirada
5. Finalize o pedido pelo WhatsApp

### Para Administradores

#### Acessar o Painel Admin

1. Acesse: `admin.html`
2. Senha padrão: `uai2024`
3. **IMPORTANTE:** Altere a senha imediatamente nas configurações!

#### Gerenciar Produtos

1. Vá em "Produtos" no menu
2. Clique em "+ Adicionar Novo Produto"
3. Preencha: nome, categoria, descrição e preço
4. Para editar: clique em "Editar" na linha do produto
5. Para excluir: clique em "Excluir"

#### Configurar Taxas de Entrega

1. Vá em "Taxas de Entrega"
2. Clique em "+ Adicionar Bairro"
3. Digite o nome do bairro e o valor da taxa
4. Para editar/excluir: use os botões na tabela

#### Configurações Gerais

**Controles do Site:**
- **Pausar Site:** Mostra mensagem de fechado para clientes
- **Habilitar Pedidos:** Liga/desliga a funcionalidade de pedidos

**WhatsApp:**
- Configure o número no formato: `5531999999999` (código do país + DDD + número)

**Delivery:**
- Defina o valor mínimo para entrega grátis
- Configure o tempo estimado de entrega

**Mensagens:**
- Personalize a mensagem de boas-vindas
- Edite a frase de destaque
- Altere o banner de entrega grátis

**Informações da Loja:**
- Atualize telefone, Instagram, endereço

#### Fazer Backup

1. Vá em "Backup"
2. Clique em "Exportar Backup"
3. Salve o arquivo JSON em local seguro
4. Para restaurar: clique em "Importar Backup" e selecione o arquivo

**⚠️ IMPORTANTE:** Faça backup regularmente! Os dados ficam salvos no navegador (localStorage).

## 🔧 Configuração Inicial

### 1. Número do WhatsApp

Edite em `js/data.js` ou no painel admin:

```javascript
whatsappNumber: '5531999999999' // Seu número aqui
```

### 2. Informações da Loja

Atualize no painel admin ou em `js/data.js`:
- Endereço
- Telefone
- Instagram
- Horário de funcionamento

### 3. Produtos Iniciais

O sistema vem com produtos de exemplo. Você pode:
- Editar os produtos existentes
- Adicionar novos produtos
- Excluir produtos de exemplo

### 4. Taxas de Entrega

Configure os bairros atendidos e suas taxas no painel admin.

## 📂 Estrutura de Arquivos

```
📁 SISTEMA UAI PIZZARIA & DOCERIA/
├── 📄 index.html          # Página principal
├── 📄 cardapio.html       # Cardápio completo
├── 📄 pedido.html         # Página de pedidos
├── 📄 info.html           # Informações da loja
├── 📄 admin.html          # Painel administrativo
├── 📄 manifest.json       # PWA manifest
├── 📄 README.md           # Este arquivo
├── 📁 css/
│   ├── styles.css         # Estilos principais
│   └── admin.css          # Estilos do admin
├── 📁 js/
│   ├── data.js            # Dados e configurações
│   ├── main.js            # Funções principais
│   ├── order.js           # Sistema de pedidos
│   └── admin.js           # Sistema administrativo
└── 📁 images/
    └── favicon.png        # Ícone do site
```

## 🌐 Hospedagem

### Opções Gratuitas

1. **Netlify** (Recomendado)
   - Arraste a pasta para netlify.com/drop
   - Domínio grátis: `seusite.netlify.app`

2. **Vercel**
   - Conecte com GitHub
   - Deploy automático

3. **GitHub Pages**
   - Faça upload para repositório
   - Ative Pages nas configurações

### Domínio Próprio

Após hospedar, você pode conectar um domínio próprio (ex: `uaipizzaria.com.br`) nas configurações da plataforma escolhida.

## 📱 Instalação como App

O site pode ser instalado como aplicativo no celular:

1. Abra o site no navegador
2. No menu do navegador, selecione "Adicionar à tela inicial"
3. O site funcionará como um app nativo!

## 🔒 Segurança

- **Altere a senha do admin imediatamente**
- Faça backups regulares
- Não compartilhe a senha do admin
- Os dados ficam salvos localmente no navegador

## ⚠️ Limitações

- Dados salvos no localStorage (navegador)
- Sem sincronização entre dispositivos
- Backup manual necessário
- Não processa pagamentos online

## 🆙 Melhorias Futuras

Para uma solução mais robusta, considere:
- Backend com banco de dados (Firebase, Supabase)
- Sistema de pagamento online
- Painel de pedidos em tempo real
- Notificações push
- Sincronização multi-dispositivo

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Confira os comentários no código
3. Entre em contato com o desenvolvedor

## 📄 Licença

Este projeto foi desenvolvido especialmente para a Uai Pizzaria & Doceria.

---

**Desenvolvido com ❤️ para a Uai Pizzaria & Doceria**

*"Porque toda história de amor merece um bom começo"* 🍕
