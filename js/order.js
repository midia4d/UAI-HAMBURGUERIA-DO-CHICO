// Sistema de pedidos e carrinho
class OrderSystem {
    constructor() {
        this.data = getData();
        this.cart = this.loadCart();
        this.deliveryType = 'delivery'; // 'delivery' ou 'pickup'
        this.deliveryFee = 0;
        this._deliveryFeesList = [];
        this.coupon = null;   // objeto do cupom ativo
        this.discount = 0;      // valor do desconto calculado
        this.init();
    }

    init() {
        this.renderCart();
        this.setupEventListeners();
        this.loadProductFromURL();
    }

    // Carrega carrinho do localStorage
    loadCart() {
        const saved = localStorage.getItem('uaiCart');
        return saved ? JSON.parse(saved) : [];
    }

    // Salva carrinho no localStorage
    saveCart() {
        localStorage.setItem('uaiCart', JSON.stringify(this.cart));
        this.renderCart();
    }

    // Adiciona produto ao carrinho
    addToCart(productId, quantity = 1) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.showNotification(`${product.name} adicionado ao carrinho!`);
    }

    // Remove produto do carrinho
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    // Atualiza quantidade
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
        }
    }

    // Limpa carrinho
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    // Calcula subtotal
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Calcula total (com desconto de cupom se houver)
    getTotal() {
        const base = this.getSubtotal() + this.deliveryFee;
        return Math.max(0, base - this.discount);
    }

    // Calcula taxa de entrega pelo bairro
    calculateDeliveryFee(neighborhood) {
        // Tenta na lista viva primeiro
        const list = this._deliveryFeesList.length > 0
            ? this._deliveryFeesList
            : this.data.deliveryFees;

        const fee = list.find(f =>
            f.neighborhood.toLowerCase() === neighborhood.toLowerCase()
        );
        return fee ? fee.fee : (list.find(f => f.neighborhood === 'Outros')?.fee || 10);
    }

    // Calcula o valor do desconto do cupom ativo
    calcDiscount() {
        if (!this.coupon) return 0;
        const subtotal = this.getSubtotal();

        switch (this.coupon.type) {
            case 'percent':
                return Math.round((subtotal * this.coupon.value / 100) * 100) / 100;
            case 'fixed':
                return Math.min(this.coupon.value, subtotal);
            case 'free_shipping':
                return this.deliveryFee; // desconto = taxa de entrega toda
            default:
                return 0;
        }
    }

    // Aplica cupom digitado pelo cliente
    async applyCoupon() {
        const input = document.getElementById('coupon-code');
        const code = input?.value?.trim()?.toUpperCase();

        if (!code) {
            this.showNotification('Digite o codigo do cupom!', 'error');
            return;
        }

        const applyBtn = document.querySelector('.btn-coupon-apply');
        if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = 'Verificando...'; }

        try {
            const result = await dbManager.validateCoupon(code);

            if (!result.success || !result.data) {
                this.showNotification('Cupom invalido ou expirado!', 'error');
                return;
            }

            const coupon = result.data;

            // Verificar pedido minimo
            if (coupon.min_order > 0 && this.getSubtotal() < coupon.min_order) {
                const min = 'R$ ' + parseFloat(coupon.min_order).toFixed(2).replace('.', ',');
                this.showNotification('Pedido minimo para este cupom: ' + min, 'error');
                return;
            }

            // Verificar limite de usos
            if (coupon.uses_limit !== null && coupon.uses_count >= coupon.uses_limit) {
                this.showNotification('Este cupom atingiu o limite de usos!', 'error');
                return;
            }

            // Aplicar cupom
            this.coupon = coupon;
            this.discount = this.calcDiscount();

            // Se for frete gratis, zeramos a deliveryFee visualmente
            if (coupon.type === 'free_shipping') {
                this.deliveryFee = 0;
            }

            // Atualizar UI
            const codeEl = document.getElementById('coupon-applied-code');
            const descEl = document.getElementById('coupon-applied-desc');
            if (codeEl) codeEl.textContent = coupon.code;
            if (descEl) descEl.textContent = coupon.description || this._couponLabel(coupon);

            document.getElementById('coupon-applied')?.classList.remove('hidden');
            document.getElementById('coupon-input-area')?.classList.add('hidden');

            this.renderCart();
            this.showNotification('Cupom ' + coupon.code + ' aplicado!', 'success');

        } catch (e) {
            this.showNotification('Erro ao validar cupom. Tente novamente.', 'error');
        } finally {
            if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Aplicar'; }
        }
    }

    // Remove o cupom aplicado
    removeCoupon() {
        this.coupon = null;
        this.discount = 0;

        // Restaurar field
        const input = document.getElementById('coupon-code');
        if (input) input.value = '';

        document.getElementById('coupon-applied')?.classList.add('hidden');
        document.getElementById('coupon-input-area')?.classList.remove('hidden');

        // Recarregar taxa de entrega do bairro selecionado
        const bairro = document.getElementById('neighborhood')?.value;
        if (bairro && this.deliveryType === 'delivery') {
            this.deliveryFee = this.calculateDeliveryFee(bairro);
        }

        this.renderCart();
        this.showNotification('Cupom removido.', 'info');
    }

    // Label descritivo do cupom (fallback)
    _couponLabel(coupon) {
        if (coupon.type === 'percent') return coupon.value + '% de desconto';
        if (coupon.type === 'fixed') return 'R$ ' + parseFloat(coupon.value).toFixed(2).replace('.', ',') + ' de desconto';
        if (coupon.type === 'free_shipping') return 'Frete gratis!';
        return '';
    }

    // Define tipo de entrega
    setDeliveryType(type) {
        this.deliveryType = type;
        if (type === 'pickup') this.deliveryFee = 0;
        this.renderCart();
        this.updateDeliveryUI();
    }

    // Atualiza UI de entrega
    updateDeliveryUI() {
        const deliverySection = document.getElementById('delivery-section');
        const pickupSection = document.getElementById('pickup-section');

        if (this.deliveryType === 'delivery') {
            if (deliverySection) deliverySection.classList.remove('hidden');
            if (pickupSection) pickupSection.classList.add('hidden');
        } else {
            if (deliverySection) deliverySection.classList.add('hidden');
            if (pickupSection) pickupSection.classList.remove('hidden');
        }
    }

    // Renderiza carrinho
    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartEmpty = document.getElementById('cart-empty');
        const cartSummary = document.getElementById('cart-summary');

        if (this.cart.length === 0) {
            if (cartItems) cartItems.innerHTML = '';
            if (cartEmpty) cartEmpty.classList.remove('hidden');
            if (cartSummary) cartSummary.classList.add('hidden');
            return;
        }

        if (cartEmpty) cartEmpty.classList.add('hidden');
        if (cartSummary) cartSummary.classList.remove('hidden');

        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p class="cart-item-price">${app.formatPrice(item.price)}</p>
          </div>
          <div class="cart-item-controls">
            <button class="quantity-btn" onclick="orderSystem.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn" onclick="orderSystem.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
            <button class="remove-btn" onclick="orderSystem.removeFromCart('${item.id}')">&#x1F5D1;&#xFE0F;</button>
          </div>
        </div>
      `).join('');
        }

        // Atualiza resumo
        const subtotal = this.getSubtotal();

        // Recalcular desconto (ex: se quantidade mudou)
        if (this.coupon) {
            this.discount = this.calcDiscount();
        }
        const total = this.getTotal();

        document.getElementById('subtotal-value').textContent = app.formatPrice(subtotal);
        document.getElementById('delivery-fee-value').textContent = app.formatPrice(this.deliveryFee);
        document.getElementById('total-value').textContent = app.formatPrice(total);

        // Linha de desconto do cupom
        let discountRow = document.getElementById('discount-row');
        if (this.coupon && this.discount > 0) {
            if (!discountRow) {
                discountRow = document.createElement('div');
                discountRow.id = 'discount-row';
                discountRow.className = 'discount-row';
                // Inserir antes do total
                const totalRow = document.getElementById('total-value')?.closest('.order-total, .summary-row');
                const deliveryRow = document.getElementById('delivery-fee-value')?.parentElement;
                if (deliveryRow) deliveryRow.insertAdjacentElement('afterend', discountRow);
            }
            discountRow.innerHTML = `<span>&#127991; Cupom ${this.coupon.code}</span><span style="color:#10B981;">- ${app.formatPrice(this.discount)}</span>`;
            discountRow.style.display = 'flex';
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        // Verifica entrega gratis
        const freeDeliveryBanner = document.getElementById('free-delivery-banner');
        if (freeDeliveryBanner) {
            if (subtotal >= this.data.config.freeDeliveryMinimum && this.deliveryType === 'delivery') {
                freeDeliveryBanner.classList.remove('hidden');
                this.deliveryFee = 0;
                document.getElementById('delivery-fee-value').textContent = app.formatPrice(0);
                document.getElementById('total-value').textContent = app.formatPrice(this.getTotal());
            } else {
                freeDeliveryBanner.classList.add('hidden');
            }
        }
    }

    // Configura event listeners
    setupEventListeners() {
        // Tipo de entrega
        const deliveryRadios = document.querySelectorAll('input[name="delivery-type"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setDeliveryType(e.target.value);
            });
        });

        // Escuta mudancas no select de bairro
        const neighborhoodSelect = document.getElementById('neighborhood');
        if (neighborhoodSelect) {
            neighborhoodSelect.addEventListener('change', () => {
                const neighborhood = neighborhoodSelect.value;
                if (neighborhood && this.deliveryType === 'delivery') {
                    this.deliveryFee = this.calculateDeliveryFee(neighborhood);
                    this.renderCart();
                }
            });
        }

        // Carrega bairros do Supabase e popula o select
        dbManager.getDeliveryFees(true).then(fees => {
            this._deliveryFeesList = fees || [];
            this._populateNeighborhoodSelect(this._deliveryFeesList);
        }).catch(() => {
            const cached = (typeof cachedData !== 'undefined' && cachedData && cachedData.deliveryFees)
                ? cachedData.deliveryFees : (this.data.deliveryFees || []);
            this._deliveryFeesList = cached;
            this._populateNeighborhoodSelect(cached);
        });
    }

    // Popula o select de bairros com nome + taxa
    _populateNeighborhoodSelect(fees) {
        const sel = document.getElementById('neighborhood');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione seu bairro...</option>' +
            fees.map(f => {
                const taxa = f.fee === 0
                    ? 'Gratis'
                    : 'R$ ' + parseFloat(f.fee).toFixed(2).replace('.', ',');
                return `<option value="${f.neighborhood}">${f.neighborhood} &mdash; ${taxa}</option>`;
            }).join('');
    }

    // Chamado quando o cliente seleciona um bairro no select
    onNeighborhoodChange(selectEl) {
        const neighborhood = selectEl.value;
        const feeCard = document.getElementById('delivery-fee-card');
        const nameEl = document.getElementById('selected-neighborhood-name');
        const feeEl = document.getElementById('selected-fee-value');

        if (!neighborhood) {
            if (feeCard) feeCard.classList.add('hidden');
            this.deliveryFee = 0;
            this.renderCart();
            return;
        }

        if (this.deliveryType === 'delivery') {
            this.deliveryFee = this.calculateDeliveryFee(neighborhood);
            this.renderCart();
        }

        const fee = this.deliveryFee;
        if (nameEl) nameEl.textContent = neighborhood;
        if (feeEl) feeEl.textContent = fee === 0 ? ('Gr\u00e1tis! ' + String.fromCodePoint(127881)) : ('R$ ' + fee.toFixed(2).replace('.', ','));
        if (feeCard) feeCard.classList.remove('hidden');
    }

    // Chamado quando o cliente seleciona a forma de pagamento
    onPaymentChange(radioEl) {
        const method = radioEl.value;

        const trocoSection = document.getElementById('troco-section');
        const pixSection = document.getElementById('pix-section');

        // Mostrar/ocultar campos extras
        if (trocoSection) trocoSection.classList.toggle('hidden', method !== 'dinheiro');
        if (pixSection) pixSection.classList.toggle('hidden', method !== 'pix');

        // Carregar e exibir chave PIX da loja
        if (method === 'pix') {
            const pixDisplay = document.getElementById('pix-key-display');
            if (pixDisplay) {
                // Tenta do config carregado
                const pixKey = this.data?.config?.pixKey
                    || (typeof cachedData !== 'undefined' && cachedData?.config?.pixKey)
                    || null;

                if (pixKey) {
                    pixDisplay.textContent = pixKey;
                } else {
                    // Busca da loja via dbManager
                    dbManager.getStoreInfo().then(info => {
                        pixDisplay.textContent = info?.pixKey || info?.email || 'Consulte o entregador';
                    }).catch(() => {
                        pixDisplay.textContent = 'Consulte o entregador';
                    });
                }
            }
        }
    }

    // Carrega produto da URL
    loadProductFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product');
        if (productId) {
            this.addToCart(productId);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Finaliza pedido
    async finishOrder() {
        if (this.cart.length === 0) {
            this.showNotification('Adicione produtos ao carrinho primeiro!', 'error');
            return;
        }

        // Verifica se pedidos estao habilitados
        const ordersEnabled = this.data?.config?.ordersEnabled ?? true;
        if (!ordersEnabled) {
            this.showNotification('Pedidos desabilitados no momento. Entre em contato!', 'error');
            return;
        }

        // Validacoes de nome e telefone
        const name = document.getElementById('customer-name')?.value?.trim();
        const phone = document.getElementById('customer-phone')?.value?.trim();

        if (!name || !phone) {
            this.showNotification('Preencha seu nome e telefone!', 'error');
            return;
        }

        // Validacao de endereco (delivery)
        let address = null, neighborhood = null, addressComplement = null;
        if (this.deliveryType === 'delivery') {
            address = document.getElementById('address')?.value?.trim();
            neighborhood = document.getElementById('neighborhood')?.value?.trim();

            if (!address || !neighborhood) {
                this.showNotification('Preencha o endereco e selecione o bairro!', 'error');
                return;
            }
            addressComplement = document.getElementById('address-complement')?.value?.trim() || null;
        }

        // Validacao de forma de pagamento
        const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
        if (!paymentRadio) {
            this.showNotification('Selecione a forma de pagamento!', 'error');
            document.querySelector('.payment-options')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const paymentMethod = paymentRadio.value;
        const trocoValor = document.getElementById('troco-valor')?.value?.trim() || null;

        // Desabilitar botao durante processamento
        const btn = document.querySelector('[onclick*="finishOrder"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando pedido...'; }

        // 1. Salvar pedido no Supabase
        let trackingUrl = null;
        try {
            if (typeof dbManager !== 'undefined' && typeof dbManager.createOrder === 'function') {
                const orderData = {
                    customerName: name,
                    customerPhone: phone,
                    deliveryType: this.deliveryType,
                    address,
                    neighborhood,
                    addressComplement,
                    items: this.cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    subtotal: this.getSubtotal(),
                    deliveryFee: this.deliveryFee || 0,
                    total: this.getTotal()
                };

                const result = await dbManager.createOrder(orderData);

                if (result.success) {
                    const orderId = result.data?.id;
                    if (orderId) {
                        trackingUrl = window.location.origin +
                            window.location.pathname.replace('pedido.html', '') +
                            'rastreio.html?id=' + orderId;
                    }
                } else {
                    console.error('Erro ao salvar pedido:', result.error);
                }
            }
        } catch (err) {
            console.error('Excecao ao salvar pedido:', err);
        }

        // 2. Monta mensagem e abre WhatsApp
        const message = this.buildWhatsAppMessage(trackingUrl);
        app.openWhatsApp(message);

        // 3. Restaura botao e limpa carrinho
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Pedido Enviado!';
        }
        this.clearCart();

        // 4. Redireciona para rastreio se disponivel
        if (trackingUrl) {
            setTimeout(() => { window.location.href = trackingUrl; }, 1500);
        } else {
            this.showNotification('Pedido enviado! Aguarde confirmacao no WhatsApp.', 'success');
        }
    }

    // Monta mensagem para WhatsApp
    buildWhatsAppMessage(trackingUrl = null) {
        let message = `*NOVO PEDIDO - ${this.data.storeInfo.name}*\n\n`;

        // Dados do cliente
        const name = document.getElementById('customer-name')?.value;
        const phone = document.getElementById('customer-phone')?.value;
        message += `*Cliente:* ${name}\n`;
        message += `*Telefone:* ${phone}\n\n`;

        // Tipo de entrega
        if (this.deliveryType === 'delivery') {
            message += `*DELIVERY*\n`;
            const address = document.getElementById('address')?.value;
            const bairro = document.getElementById('neighborhood')?.value;
            const complement = document.getElementById('address-complement')?.value;

            message += `*Endereco:* ${address}\n`;
            message += `*Bairro:* ${bairro}\n`;
            if (complement) message += `*Complemento:* ${complement}\n`;
            message += `*Tempo estimado:* ${this.data.config.estimatedDeliveryTime}\n\n`;
        } else {
            message += `*RETIRADA NO LOCAL*\n`;
            message += `${this.data.storeInfo.address}\n`;
            message += `${this.data.storeInfo.addressComplement}\n\n`;
        }

        // Itens do pedido
        message += `*ITENS DO PEDIDO:*\n`;
        this.cart.forEach(item => {
            message += `\n- ${item.quantity}x ${item.name}\n`;
            message += `  ${app.formatPrice(item.price)} cada = ${app.formatPrice(item.price * item.quantity)}\n`;
        });

        // Resumo financeiro
        message += `\n*RESUMO:*\n`;
        message += `Subtotal: ${app.formatPrice(this.getSubtotal())}\n`;

        if (this.deliveryType === 'delivery') {
            if (this.deliveryFee === 0 && this.getSubtotal() >= this.data.config.freeDeliveryMinimum) {
                message += `Taxa de entrega: GRATIS!\n`;
            } else {
                message += `Taxa de entrega: ${app.formatPrice(this.deliveryFee)}\n`;
            }
        }

        message += `*TOTAL: ${app.formatPrice(this.getTotal())}*\n`;

        // Forma de pagamento
        const payRadio = document.querySelector('input[name="payment-method"]:checked');
        if (payRadio) {
            const labels = { dinheiro: 'Dinheiro', pix: 'PIX', credito: 'Cartao de Credito', debito: 'Cartao de Debito' };
            message += `\n*PAGAMENTO:* ${labels[payRadio.value] || payRadio.value}\n`;
            if (payRadio.value === 'dinheiro') {
                const troco = document.getElementById('troco-valor')?.value?.trim();
                if (troco && parseFloat(troco) > 0) {
                    message += `Troco para: R$ ${parseFloat(troco).toFixed(2).replace('.', ',')}\n`;
                } else {
                    message += `Sem troco necessario\n`;
                }
            }
        }

        // Link de rastreio
        if (trackingUrl) {
            message += `\n*RASTREIE SEU PEDIDO:*\n${trackingUrl}\n`;
        }

        return message;
    }

    // Mostra notificacao toast
    showNotification(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: '&#x2705;', error: '&#x274C;', warning: '&#x26A0;&#xFE0F;', info: '&#x2139;&#xFE0F;' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.success}</span>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Inicializa sistema de pedidos
let orderSystem;

window.addEventListener('dataLoaded', () => {
    if (!orderSystem) {
        orderSystem = new OrderSystem();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof cachedData !== 'undefined' && cachedData !== null && !orderSystem) {
        orderSystem = new OrderSystem();
    }
});
