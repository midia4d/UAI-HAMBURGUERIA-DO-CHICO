// Sistema de administração
class AdminSystem {
    constructor() {
        this.data = getData();
        this.isAuthenticated = false;

        // Verifica a sessão inicial do Supabase de forma assíncrona
        this.checkAuth().then(isAuth => {
            this.isAuthenticated = isAuth;
            this.init();
        });
    }

    init() {
        this.orders = [];
        this.currentFilter = 'all';
        this.newOrdersCount = 0;
        this.realtimeChannel = null;

        if (!this.isAuthenticated) {
            this.showLogin();
        } else {
            this.showAdmin();
            this.setupEventListeners();
            this.loadDashboard();
            this.initRealtime();
        }
    }

    // Verifica autenticação com Supabase
    async checkAuth() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            return !!session;
        } catch (error) {
            console.error('Erro ao verificar auth:', error);
            return false;
        }
    }

    // Login
    async login(email, password) {
        try {
            const btn = document.querySelector('#login-form button');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            this.isAuthenticated = !!data.session;
            window.location.reload();
            return true;
        } catch (error) {
            alert('Falha no login: Email ou senha incorretos.');
            console.error('Login erro:', error);

            const btn = document.querySelector('#login-form button');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Entrar';
            }
            return false;
        }
    }

    // Logout
    async logout() {
        try {
            await supabaseClient.auth.signOut();
            window.location.reload();
        } catch (e) {
            window.location.reload();
        }
    }

    // Mostra tela de login
    showLogin() {
        document.body.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div style="text-align: center; margin-bottom: var(--spacing-xl);">
            <div style="font-size: 4rem; margin-bottom: var(--spacing-sm);"><i class="fa-solid fa-pizza-slice" style="color:var(--primary);"></i></div>
            <h1>Painel Admin</h1>
            <p style="color: var(--gray);">Uai Hamburgueria do Chico</p>
          </div>
          
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="admin-email">E-mail</label>
              <input type="email" id="admin-email" class="form-control" required placeholder="admin@uaihamburgueria.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="admin-password">Senha</label>
              <input type="password" id="admin-password" class="form-input" placeholder="Digite a senha" required autofocus>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Entrar
            </button>
            
            <div id="login-error" class="alert alert-danger hidden" style="margin-top: var(--spacing-md);">
              Senha incorreta!
            </div>
          </form>
          
          <div style="text-align: center; margin-top: var(--spacing-lg);">
            <a href="index.html" style="color: var(--gray);">← Voltar ao site</a>
          </div>
        </div>
      </div>
    `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;

            const success = await this.login(email, password);
            if (!success) {
                const errDiv = document.getElementById('login-error');
                errDiv.classList.remove('hidden');
                errDiv.textContent = 'Erro ao fazer login com estas credenciais.';
            }
        });
    }

    // Mostra painel admin
    showAdmin() {
        // HTML do painel será carregado do admin.html
    }

    // Configura event listeners
    setupEventListeners() {
        // Navegação entre seções
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Mostra seção
    showSection(sectionId) {
        document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));

        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        document.getElementById(sectionId).classList.add('active');

        // Carrega dados da seção
        switch (sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'delivery':
                this.loadDeliveryFees();
                break;
            case 'coupons':
                this.loadCoupons();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'orders':
                this.loadOrders();
                // Limpa badge ao entrar na aba
                this.newOrdersCount = 0;
                this.updateOrdersBadge();
                break;
            case 'reports':
                this.loadReports(7);
                break;
            case 'history':
                this.loadHistory();
                break;
        }
    }


    // Carrega dashboard
    loadDashboard() {
        const stats = {
            totalProducts: this.data.products.length,
            activeProducts: this.data.products.filter(p => p.available).length,
            categories: this.data.categories.length,
            siteStatus: this.data.config.sitePaused ? 'Pausado' : 'Ativo',
            ordersStatus: this.data.config.ordersEnabled ? 'Habilitados' : 'Desabilitados'
        };

        // Verificar se os elementos existem antes de atualizar
        const totalProductsEl = document.getElementById('total-products');
        const activeProductsEl = document.getElementById('active-products');
        const totalCategoriesEl = document.getElementById('total-categories');
        const siteStatusEl = document.getElementById('site-status');
        const ordersStatusEl = document.getElementById('orders-status');

        if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
        if (activeProductsEl) activeProductsEl.textContent = stats.activeProducts;
        if (totalCategoriesEl) totalCategoriesEl.textContent = stats.categories;
        if (siteStatusEl) siteStatusEl.textContent = stats.siteStatus;
        if (ordersStatusEl) ordersStatusEl.textContent = stats.ordersStatus;
    }

    // Carrega produtos
    loadProducts() {
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = this.data.products.map(product => {
            const category = this.data.categories.find(c => c.id === product.category);
            return `
        <tr>
          <td>${product.name}</td>
          <td>${category ? category.name : '-'}</td>
          <td>${app.formatPrice(product.price)}</td>
          <td>
            <span class="status-badge ${product.available ? 'status-active' : 'status-inactive'}">
              ${product.available ? 'Disponível' : 'Indisponível'}
            </span>
          </td>
          <td>
            <button class="btn btn-small btn-warning" onclick="adminSystem.openProductModal('${product.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="adminSystem.deleteProduct('${product.id}')">Excluir</button>
          </td>
        </tr>
      `;
        }).join('');
    }

    // Adiciona produto
    async addProduct(productData) {
        const newProduct = {
            id: 'product-' + Date.now(),
            category: productData.category,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            image: productData.image || null,
            available: true
        };

        const result = await dbManager.addProduct(newProduct);
        if (result.success) {
            this.data = await loadDataFromSupabase();
            this.loadProducts();
            this.showAlert('Produto adicionado com sucesso!', 'success');
        } else {
            this.showAlert('Erro ao adicionar produto: ' + result.error, 'danger');
        }
    }

    // Edita produto
    async editProduct(productId) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;

        const name = prompt('Nome do produto:', product.name);
        if (!name) return;

        const description = prompt('Descrição:', product.description);
        if (!description) return;

        const price = parseFloat(prompt('Preço:', product.price));
        if (isNaN(price)) return;

        const result = await dbManager.updateProduct(productId, {
            name,
            description,
            price
        });

        if (result.success) {
            this.data = await loadDataFromSupabase();
            this.loadProducts();
            this.showAlert('Produto atualizado com sucesso!', 'success');
        } else {
            this.showAlert('Erro ao atualizar produto: ' + result.error, 'danger');
        }
    }

    // Deleta produto
    async deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        const result = await dbManager.deleteProduct(productId);
        if (result.success) {
            this.data = await loadDataFromSupabase();
            this.loadProducts();
            this.showAlert('Produto excluído com sucesso!', 'success');
        } else {
            this.showAlert('Erro ao excluir produto: ' + result.error, 'danger');
        }
    }

    // ============================================
    // FUNÇÕES DO MODAL DE PRODUTO
    // ============================================

    // Abre modal para adicionar ou editar produto
    openProductModal(productId = null) {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const modalTitle = document.getElementById('modal-title');
        const modalSubmitText = document.getElementById('modal-submit-text');

        form.reset();

        if (productId) {
            // Modo edição
            const product = this.data.products.find(p => p.id === productId);
            if (!product) return;

            modalTitle.textContent = 'Editar Produto';
            modalSubmitText.textContent = 'Salvar Alterações';

            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-available').value = product.available.toString();

            // Preview de imagem na nova UI Box
            const previewImg = document.getElementById('product-image-preview');
            const placeholder = document.getElementById('image-upload-placeholder');
            const removeBtn = document.getElementById('remove-image-btn');
            const urlInput = document.getElementById('product-image-url');

            if (product.image) {
                previewImg.style.display = 'block';
                previewImg.src = product.image;
                urlInput.value = product.image;
                placeholder.style.display = 'none';
                removeBtn.style.display = 'block';
            } else {
                previewImg.style.display = 'none';
                previewImg.src = '';
                urlInput.value = '';
                placeholder.style.display = 'flex';
                removeBtn.style.display = 'none';
            }
        } else {
            // Modo adicionar
            modalTitle.textContent = 'Adicionar Produto';
            modalSubmitText.textContent = 'Adicionar Produto';
            document.getElementById('product-id').value = '';
            document.getElementById('product-available').value = 'true';

            document.getElementById('product-image-preview').style.display = 'none';
            document.getElementById('product-image-preview').src = '';
            document.getElementById('product-image-url').value = '';
            document.getElementById('image-upload-placeholder').style.display = 'flex';
            document.getElementById('remove-image-btn').style.display = 'none';
        }

        document.getElementById('product-image-file').value = '';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Fecha modal
    closeProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('product-image-file').value = '';
    }

    // Preview
    handleImageSelect(event) {
        const file = event.target.files[0];
        const previewImg = document.getElementById('product-image-preview');
        const placeholder = document.getElementById('image-upload-placeholder');
        const removeBtn = document.getElementById('remove-image-btn');

        if (!file) {
            // Se cancelar a janela
            return;
        }

        // Validar tamanho (Max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showAlert('A imagem não pode ultrapassar 2MB!', 'danger');
            event.target.value = '';
            return;
        }

        // Mostrar Preview Local (URL blob)
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
            removeBtn.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }

    // Deleta do form / remove preview
    removeImage(event) {
        if (event) {
            event.stopPropagation();
        }
        document.getElementById('product-image-file').value = '';
        document.getElementById('product-image-url').value = '';
        document.getElementById('product-image-preview').src = '';
        document.getElementById('product-image-preview').style.display = 'none';

        document.getElementById('image-upload-placeholder').style.display = 'flex';
        document.getElementById('remove-image-btn').style.display = 'none';
    }


    // Salva produto (adicionar ou editar)
    async saveProduct() {
        // Obter botão de salvar para indicar loading
        const btnSubmit = document.querySelector('#product-form button[type="submit"]');
        const textSpan = document.getElementById('modal-submit-text');
        const defaultText = textSpan.textContent;
        if (btnSubmit) btnSubmit.disabled = true;
        textSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

        try {
            const productId = document.getElementById('product-id').value;
            const fileInput = document.getElementById('product-image-file');

            let imageUrlUrl = document.getElementById('product-image-url').value || null;

            // Se o usuário selecionou uma nova imagem
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const uploadResult = await dbManager.uploadProductImage(file);
                if (uploadResult.success) {
                    imageUrlUrl = uploadResult.url;
                } else {
                    this.showAlert('Erro ao fazer upload da imagem: ' + uploadResult.error, 'danger');
                    if (btnSubmit) btnSubmit.disabled = false;
                    textSpan.textContent = defaultText;
                    return; // Aborta salvar produto se a img falhar
                }
            }

            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                available: document.getElementById('product-available').value === 'true',
                image: imageUrlUrl
            };

            if (productId) {
                // Editar produto existente
                const result = await dbManager.updateProduct(productId, productData);

                if (result.success) {
                    this.data = await loadDataFromSupabase();
                    this.loadProducts();
                    this.showAlert('Produto atualizado com sucesso!', 'success');
                } else {
                    this.showAlert('Erro ao atualizar produto: ' + result.error, 'danger');
                }
            } else {
                // Adicionar novo produto - AddProduct local e depois chama function do manager
                productData.id = 'product-' + Date.now();
                const result = await dbManager.addProduct(productData);
                if (result.success) {
                    this.data = await loadDataFromSupabase();
                    this.loadProducts();
                    this.showAlert('Produto adicionado com sucesso!', 'success');
                } else {
                    this.showAlert('Erro ao adicionar produto: ' + result.error, 'danger');
                }
            }

            this.closeProductModal();
        } catch (error) {
            console.error(error);
            this.showAlert('Ocorreu um erro ao salvar o produto.', 'danger');
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    }

    // Carrega configurações
    loadSettings() {
        document.getElementById('site-paused').checked = this.data.config.sitePaused;
        document.getElementById('orders-enabled').checked = this.data.config.ordersEnabled;
        document.getElementById('whatsapp-number').value = this.data.config.whatsappNumber;
        document.getElementById('free-delivery-min').value = this.data.config.freeDeliveryMinimum;
        document.getElementById('delivery-time').value = this.data.config.estimatedDeliveryTime;
        document.getElementById('admin-password-input').value = this.data.config.adminPassword;

        // Mensagens
        document.getElementById('welcome-message').value = this.data.config.welcomeMessage || '';
        document.getElementById('tagline').value = this.data.config.tagline || '';
        document.getElementById('delivery-banner').value = this.data.config.deliveryBanner || '';

        // Informações da loja
        document.getElementById('store-phone').value = this.data.storeInfo.phone;
        document.getElementById('store-instagram').value = this.data.storeInfo.instagram;
        document.getElementById('store-address').value = this.data.storeInfo.address;
        document.getElementById('store-complement').value = this.data.storeInfo.addressComplement;
    }

    // Salva configurações
    async saveSettings() {
        // Atualizar dados locais
        this.data.config.sitePaused = document.getElementById('site-paused').checked;
        this.data.config.ordersEnabled = document.getElementById('orders-enabled').checked;
        this.data.config.whatsappNumber = document.getElementById('whatsapp-number').value;
        this.data.config.freeDeliveryMinimum = parseFloat(document.getElementById('free-delivery-min').value);
        this.data.config.estimatedDeliveryTime = document.getElementById('delivery-time').value;
        this.data.config.adminPassword = document.getElementById('admin-password-input').value;

        this.data.config.welcomeMessage = document.getElementById('welcome-message').value;
        this.data.config.tagline = document.getElementById('tagline').value;
        this.data.config.deliveryBanner = document.getElementById('delivery-banner').value;

        this.data.storeInfo.phone = document.getElementById('store-phone').value;
        this.data.storeInfo.instagram = document.getElementById('store-instagram').value;
        this.data.storeInfo.address = document.getElementById('store-address').value;
        this.data.storeInfo.addressComplement = document.getElementById('store-complement').value;

        // Salvar no Supabase
        try {
            await saveData(this.data);

            // Limpar cache para forçar recarregamento
            dbManager.clearCache();
            cachedData = null;

            this.showAlert('Configurações salvas com sucesso! As alterações aparecerão no site.', 'success');
            this.loadDashboard();
        } catch (error) {
            this.showAlert('Erro ao salvar configurações: ' + error.message, 'danger');
        }
    }

    // Carrega taxas de entrega
    loadDeliveryFees() {
        const tbody = document.getElementById('delivery-fees-table-body');
        tbody.innerHTML = this.data.deliveryFees.map((fee, index) => `
      <tr>
        <td>${fee.neighborhood}</td>
        <td>${app.formatPrice(fee.fee)}</td>
        <td>
          <button class="btn btn-small btn-warning" onclick="adminSystem.editDeliveryFee(${index})">Editar</button>
          <button class="btn btn-small btn-danger" onclick="adminSystem.deleteDeliveryFee(${index})">Excluir</button>
        </td>
      </tr>
    `).join('');
    }

    // Adiciona taxa de entrega
    addDeliveryFee() {
        const neighborhood = prompt('Nome do bairro:');
        if (!neighborhood) return;

        const fee = parseFloat(prompt('Taxa de entrega:'));
        if (isNaN(fee)) return;

        this.data.deliveryFees.push({ neighborhood, fee });
        saveData(this.data);
        this.loadDeliveryFees();
        this.showAlert('Taxa adicionada com sucesso!', 'success');
    }

    // Edita taxa de entrega
    editDeliveryFee(index) {
        const deliveryFee = this.data.deliveryFees[index];

        const neighborhood = prompt('Nome do bairro:', deliveryFee.neighborhood);
        if (!neighborhood) return;

        const fee = parseFloat(prompt('Taxa de entrega:', deliveryFee.fee));
        if (isNaN(fee)) return;

        this.data.deliveryFees[index] = { neighborhood, fee };
        saveData(this.data);
        this.loadDeliveryFees();
        this.showAlert('Taxa atualizada com sucesso!', 'success');
    }

    // Deleta taxa de entrega
    deleteDeliveryFee(index) {
        if (!confirm('Tem certeza que deseja excluir esta taxa?')) return;

        this.data.deliveryFees.splice(index, 1);
        saveData(this.data);
        this.loadDeliveryFees();
        this.showAlert('Taxa excluída com sucesso!', 'success');
    }

    // Exporta dados
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `uai-pizzaria-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        this.showAlert('Backup exportado com sucesso!', 'success');
    }

    // Importa dados
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('Tem certeza que deseja importar estes dados? Isso substituirá todos os dados atuais!')) {
                    saveData(importedData);
                    this.data = importedData;
                    this.showAlert('Dados importados com sucesso! Recarregando...', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (error) {
                this.showAlert('Erro ao importar dados. Verifique o arquivo.', 'danger');
            }
        };
        reader.readAsText(file);
    }

    // Mostra alerta
    showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // ============================================
    // PEDIDOS EM TEMPO REAL
    // ============================================

    async loadOrders() {
        const list = document.getElementById('orders-list');
        if (list) list.innerHTML = '<div class="orders-empty"><div style="font-size:2rem;">⏳</div><p>Carregando pedidos...</p></div>';

        const result = await dbManager.getOrders(100);
        if (result.success) {
            this.orders = result.data;
            this.renderOrders();
            this.updatePendingCount();
        } else {
            if (list) list.innerHTML = '<div class="orders-empty"><p>Erro ao carregar pedidos.</p></div>';
        }
    }

    renderOrders() {
        const list = document.getElementById('orders-list');
        if (!list) return;

        let filtered = this.orders;
        if (this.currentFilter !== 'all') {
            filtered = this.orders.filter(o => o.status === this.currentFilter);
        }

        const label = document.getElementById('orders-count-label');
        if (label) label.textContent = `${filtered.length} pedido(s)`;

        if (filtered.length === 0) {
            list.innerHTML = '<div class="orders-empty"><div style="font-size:3rem; color: var(--gray);"><i class="fa-solid fa-clipboard-list"></i></div><p>Nenhum pedido neste filtro</p></div>';
            return;
        }

        list.innerHTML = filtered.map(order => this.renderOrderCard(order)).join('');
    }

    renderOrderCard(order, isNew = false) {
        const statusLabels = {
            pending: '<i class="fa-solid fa-clock"></i> Pendente',
            confirmed: '<i class="fa-solid fa-circle-check"></i> Confirmado',
            preparing: '<i class="fa-solid fa-fire-burner"></i> Em Preparo',
            delivering: '<i class="fa-solid fa-motorcycle"></i> Saiu p/ Entrega',
            completed: '<i class="fa-solid fa-check-double"></i> Entregue',
            cancelled: '<i class="fa-solid fa-circle-xmark"></i> Cancelado'
        };
        const statusBadges = {
            pending: 'badge-pending',
            confirmed: 'badge-preparing',
            preparing: 'badge-preparing',
            delivering: 'badge-delivering',
            completed: 'badge-delivered',
            cancelled: 'badge-cancelled'
        };

        const createdAt = new Date(order.created_at);
        const timeStr = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = createdAt.toLocaleDateString('pt-BR');

        const items = Array.isArray(order.items) ? order.items : [];
        const deliveryInfo = order.delivery_type === 'delivery'
            ? `<i class="fa-solid fa-motorcycle"></i> Delivery &mdash; ${order.neighborhood || ''} &mdash; ${order.address || ''} ${order.address_complement || ''}`
            : `<i class="fa-solid fa-store"></i> Retirada no local`;

        const nextActions = {
            pending: `<button class="btn btn-primary" onclick="adminSystem.changeOrderStatus(${order.id}, 'preparing')"><i class="fa-solid fa-arrow-right"></i> Iniciar Preparo</button>
                        <button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'confirmed')"><i class="fab fa-whatsapp"></i> Confirmar Pedido</button>
                        <button class="btn btn-danger" onclick="adminSystem.changeOrderStatus(${order.id}, 'cancelled')"><i class="fa-solid fa-xmark"></i> Cancelar</button>`,
            confirmed: `<button class="btn btn-primary" onclick="adminSystem.changeOrderStatus(${order.id}, 'preparing')"><i class="fa-solid fa-arrow-right"></i> Iniciar Preparo</button>
                        <button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'confirmed')"><i class="fab fa-whatsapp"></i> Avisar Cliente</button>`,
            preparing: `<button class="btn btn-warning" onclick="adminSystem.changeOrderStatus(${order.id}, 'delivering')"><i class="fa-solid fa-motorcycle"></i> Saiu p/ Entrega</button>
                        <button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'preparing')"><i class="fab fa-whatsapp"></i> Avisar: Em Preparo</button>
                        <button class="btn btn-success" onclick="adminSystem.changeOrderStatus(${order.id}, 'completed')"><i class="fa-solid fa-check"></i> Marcar Entregue</button>`,
            delivering: `<button class="btn btn-success" onclick="adminSystem.changeOrderStatus(${order.id}, 'completed')"><i class="fa-solid fa-check"></i> Confirmar Entrega</button>
                        <button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'delivering')"><i class="fab fa-whatsapp"></i> Avisar: Saiu p/ Entrega</button>`,
            completed: `<button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'completed')"><i class="fab fa-whatsapp"></i> Agradecer Cliente</button>`,
            cancelled: `<button class="btn btn-whatsapp" onclick="adminSystem.notifyCustomer(${order.id}, 'cancelled')"><i class="fab fa-whatsapp"></i> Avisar Cancelamento</button>`
        };

        return `
        <div class="order-card status-${order.status === 'completed' ? 'delivered' : order.status} ${isNew ? 'new-order' : ''}" id="order-card-${order.id}">
            <div class="order-card-header">
                <div>
                    <div class="order-id">#${order.id} &bull; <span class="order-time">${dateStr} às ${timeStr}</span></div>
                    <div class="order-customer">${order.customer_name}</div>
                    <div class="order-phone"><i class="fa-solid fa-phone"></i> ${order.customer_phone}</div>
                </div>
                <span class="order-status-badge ${statusBadges[order.status] || ''}">${statusLabels[order.status] || order.status}</span>
            </div>

            <div class="order-delivery-info">${deliveryInfo}</div>

            <div class="order-items">
                ${items.map(item => `
                    <div class="order-item-row">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                `).join('')}
            </div>

            <div class="order-total">
                <span>TOTAL</span>
                <span>R$ ${parseFloat(order.total).toFixed(2).replace('.', ',')}</span>
            </div>

            <div class="order-actions">
                ${nextActions[order.status] || ''}
                <button class="btn btn-print" onclick="adminSystem.printOrder(${order.id})">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
                <button class="btn btn-tracking" onclick="adminSystem.copyTrackingLink(${order.id}, this)"
                    title="Copiar link de rastreio para o cliente">
                    <i class="fa-solid fa-link"></i> Rastreio
                </button>
            </div>
        </div>`;
    }

    async changeOrderStatus(orderId, newStatus) {
        const result = await dbManager.updateOrderStatus(orderId, newStatus);
        if (result.success) {
            // Atualiza localmente
            const idx = this.orders.findIndex(o => o.id === orderId);
            if (idx !== -1) this.orders[idx].status = newStatus;
            this.renderOrders();
            this.updatePendingCount();
            this.showAlert(`Pedido #${orderId} atualizado!`, 'success');
        } else {
            this.showAlert('Erro ao atualizar pedido: ' + result.error, 'danger');
        }
    }

    notifyCustomer(orderId, status) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const name = order.customer_name?.split(' ')[0] || 'Cliente';
        const phone = order.customer_phone?.replace(/\D/g, '');

        if (!phone) {
            this.showAlert('Número de telefone não disponível!', 'danger');
            return;
        }

        // Garante que o número começa com 55 (Brasil)
        const fullPhone = phone.startsWith('55') ? phone : '55' + phone;

        const messages = {
            confirmed: `Olá ${name}! 🍕\n\nSeu pedido *#${orderId}* foi *confirmado* pela Uai Hamburgueria do Chico!\n\nEstamos preparando tudo com carinho para você. Em breve atualizaremos o status. 😊`,
            preparing: `Olá ${name}! 👨‍🍳\n\nSeu pedido *#${orderId}* está *em preparo* agora!\n\nNossos pizzaiolos estão trabalhando nele. Tempo estimado: *30-40 minutos*. 🔥`,
            delivering: `Olá ${name}! 🛵\n\nSeu pedido *#${orderId}* *saiu para entrega!*\n\nNosso entregador está a caminho. Fique de olho! 📍`,
            completed: `Olá ${name}! ✅\n\nSeu pedido *#${orderId}* foi *entregue!*\n\nObrigado pela preferência! Esperamos que aproveite muito. 🍕❤️\n\nNos avalie no Google e volte sempre!`,
            cancelled: `Olá ${name}. 😔\n\nInfelizmente seu pedido *#${orderId}* foi *cancelado*.\n\nPedimos desculpas pelo inconveniente. Entre em contato para mais informações. 📞`
        };

        const msg = messages[status];
        if (!msg) return;

        const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        this.showAlert(`WhatsApp aberto para ${order.customer_name}!`, 'success');
    }

    // Copia o link de rastreio do pedido para a área de transferência
    copyTrackingLink(orderId, btn) {
        const baseUrl = window.location.origin +
            window.location.pathname.replace('admin.html', '');
        const url = `${baseUrl}rastreio.html?id=${orderId}`;

        navigator.clipboard.writeText(url).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
            btn.style.background = '#10B981';
            btn.style.color = '#fff';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        }).catch(() => {
            // Fallback: prompt com o link
            prompt('Copie o link de rastreio:', url);
        });
    }

    printOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const storeInfo = this.data?.storeInfo || {};
        const storeName = storeInfo.name || 'Uai Hamburgueria do Chico';
        const storeAddress = storeInfo.address || '';
        const storePhone = storeInfo.phone || '';

        const createdAt = new Date(order.created_at);
        const dateStr = createdAt.toLocaleDateString('pt-BR');
        const timeStr = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const items = Array.isArray(order.items) ? order.items : [];

        const statusLabels = {
            pending: 'Pendente',
            confirmed: 'Confirmado',
            preparing: 'Em Preparo',
            delivering: 'Saiu p/ Entrega',
            completed: 'Entregue',
            cancelled: 'Cancelado'
        };

        const deliveryHtml = order.delivery_type === 'delivery'
            ? `<p><strong>Tipo:</strong> Delivery</p>
               <p><strong>Endereço:</strong> ${order.address || ''}, ${order.neighborhood || ''} ${order.address_complement ? '- ' + order.address_complement : ''}</p>`
            : `<p><strong>Tipo:</strong> Retirada no local</p>`;

        const itemsHtml = items.map(item => `
            <tr>
                <td>${item.quantity}x ${item.name}</td>
                <td style="text-align:right;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
            </tr>
        `).join('');

        const subtotal = parseFloat(order.subtotal || 0);
        const deliveryFee = parseFloat(order.delivery_fee || 0);
        const total = parseFloat(order.total || 0);

        const receiptHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Recibo #${order.id} — ${storeName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            color: #111;
            background: #fff;
            padding: 20px;
            max-width: 380px;
            margin: 0 auto;
        }
        .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        .receipt-header h1 {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .receipt-header p { font-size: 11px; color: #444; margin-top: 3px; }
        .receipt-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #aaa;
        }
        .receipt-section h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #555;
            margin-bottom: 4px;
        }
        .receipt-section p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 0; vertical-align: top; }
        .divider { border-top: 1px dashed #aaa; margin: 6px 0; }
        .total-row td {
            font-size: 15px;
            font-weight: 900;
            padding-top: 8px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border: 2px solid #111;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 6px;
            text-transform: uppercase;
        }
        .receipt-footer {
            text-align: center;
            margin-top: 16px;
            font-size: 11px;
            color: #555;
            border-top: 2px dashed #333;
            padding-top: 12px;
        }
        .order-number {
            font-size: 22px;
            font-weight: 900;
            text-align: center;
            margin: 8px 0;
            letter-spacing: 2px;
        }
        @media print {
            body { padding: 0; }
            @page { margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="receipt-header">
        <h1>${storeName}</h1>
        <p>${storeAddress}</p>
        <p>${storePhone}</p>
    </div>

    <div class="order-number">#${order.id}</div>

    <div class="receipt-section">
        <h3>Data &amp; Hora</h3>
        <p>${dateStr} às ${timeStr}</p>
        <div style="margin-top:4px;">
            <span class="status-badge">${statusLabels[order.status] || order.status}</span>
        </div>
    </div>

    <div class="receipt-section">
        <h3>Cliente</h3>
        <p><strong>${order.customer_name}</strong></p>
        <p>Tel: ${order.customer_phone}</p>
    </div>

    <div class="receipt-section">
        <h3>Entrega</h3>
        ${deliveryHtml}
    </div>

    <div class="receipt-section">
        <h3>Itens do Pedido</h3>
        <table>
            ${itemsHtml}
            <tr class="divider"><td colspan="2" style="padding:0;"><hr style="border:none;border-top:1px dashed #aaa;"/></td></tr>
            ${subtotal > 0 ? `<tr><td>Subtotal:</td><td style="text-align:right;">R$ ${subtotal.toFixed(2).replace('.', ',')}</td></tr>` : ''}
            ${deliveryFee > 0 ? `<tr><td>Taxa de entrega:</td><td style="text-align:right;">R$ ${deliveryFee.toFixed(2).replace('.', ',')}</td></tr>` : '<tr><td>Taxa de entrega:</td><td style="text-align:right;">Grátis</td></tr>'}
            <tr class="total-row">
                <td>TOTAL:</td>
                <td style="text-align:right;">R$ ${total.toFixed(2).replace('.', ',')}</td>
            </tr>
        </table>
    </div>

    <div class="receipt-footer">
        <p>Obrigado pela preferência!</p>
        <p style="margin-top:4px;">Volte sempre ❤️</p>
    </div>

    <script>
        window.onload = () => {
            window.print();
        };
    </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=450,height=700');
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
    }

    filterOrders(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.order-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderOrders();
    }

    // ========== HISTÓRICO DE PEDIDOS ==========

    async loadHistory() {
        const tbody = document.getElementById('history-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>';

        try {
            const result = await dbManager.getOrders();
            this._allHistory = result.success ? (result.data || []) : [];
            // Ordena do mais recente para o mais antigo
            this._allHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.filterHistory();
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        }
    }

    filterHistory() {
        if (!this._allHistory) return;

        const search = (document.getElementById('history-search')?.value || '').toLowerCase().trim();
        const dateFrom = document.getElementById('history-date-from')?.value;
        const dateTo = document.getElementById('history-date-to')?.value;
        const statusFilter = document.getElementById('history-status')?.value || 'all';

        let filtered = this._allHistory.filter(order => {
            // Busca por nome ou telefone
            if (search) {
                const name = (order.customer_name || '').toLowerCase();
                const phone = (order.customer_phone || '').toLowerCase();
                if (!name.includes(search) && !phone.includes(search)) return false;
            }

            // Filtro de data de início
            if (dateFrom) {
                const orderDate = order.created_at.substring(0, 10);
                if (orderDate < dateFrom) return false;
            }

            // Filtro de data de fim
            if (dateTo) {
                const orderDate = order.created_at.substring(0, 10);
                if (orderDate > dateTo) return false;
            }

            // Filtro de status
            if (statusFilter !== 'all' && order.status !== statusFilter) return false;

            return true;
        });

        this.renderHistoryTable(filtered);
    }

    renderHistoryTable(orders) {
        const tbody = document.getElementById('history-table-body');
        const empty = document.getElementById('history-empty');
        const summary = document.getElementById('history-summary');
        const count = document.getElementById('history-count');

        const statusLabels = {
            pending: { label: 'Pendente', cls: 'badge-pending' },
            confirmed: { label: 'Confirmado', cls: 'badge-preparing' },
            preparing: { label: 'Em Preparo', cls: 'badge-preparing' },
            delivering: { label: 'Em Entrega', cls: 'badge-delivering' },
            completed: { label: 'Entregue', cls: 'badge-delivered' },
            cancelled: { label: 'Cancelado', cls: 'badge-cancelled' }
        };

        if (orders.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'flex';
            if (summary) summary.innerHTML = '';
            if (count) count.textContent = '';
            return;
        }

        if (empty) empty.style.display = 'none';

        // Resumo
        const totalRevenue = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((s, o) => s + parseFloat(o.total || 0), 0);

        if (summary) {
            summary.innerHTML = `
                <div class="history-stat"><i class="fa-solid fa-receipt"></i><strong>${orders.length}</strong> pedido${orders.length !== 1 ? 's' : ''}</div>
                <div class="history-stat"><i class="fa-solid fa-check-circle" style="color:#10B981;"></i><strong>${orders.filter(o => o.status === 'completed').length}</strong> entregues</div>
                <div class="history-stat"><i class="fa-solid fa-xmark-circle" style="color:#EF4444;"></i><strong>${orders.filter(o => o.status === 'cancelled').length}</strong> cancelados</div>
                <div class="history-stat"><i class="fa-solid fa-dollar-sign" style="color:#10B981;"></i><strong>R$ ${totalRevenue.toFixed(2).replace('.', ',')}</strong> faturamento</div>
            `;
        }

        if (count) count.textContent = `Exibindo ${orders.length} pedido${orders.length !== 1 ? 's' : ''}`;

        // Tabela
        tbody.innerHTML = orders.map(order => {
            const date = new Date(order.created_at);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const items = Array.isArray(order.items) ? order.items : [];
            const itemsSummary = items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')
                + (items.length > 2 ? ` +${items.length - 2}` : '');
            const st = statusLabels[order.status] || { label: order.status, cls: '' };
            const deliveryIcon = order.delivery_type === 'delivery'
                ? '<i class="fa-solid fa-motorcycle" title="Delivery"></i>'
                : '<i class="fa-solid fa-store" title="Retirada"></i>';

            return `<tr>
                <td><strong>#${order.id}</strong></td>
                <td>${dateStr}<br><small style="color:var(--gray);">${timeStr}</small></td>
                <td>${order.customer_name || '-'}</td>
                <td>${order.customer_phone || '-'}</td>
                <td style="text-align:center;">${deliveryIcon}</td>
                <td><small title="${items.map(i => i.quantity + 'x ' + i.name).join(', ')}">${itemsSummary || '-'}</small></td>
                <td><strong>R$ ${parseFloat(order.total || 0).toFixed(2).replace('.', ',')}</strong></td>
                <td><span class="order-badge ${st.cls}">${st.label}</span></td>
                <td>
                    <button class="btn btn-print" style="font-size:0.75rem;padding:4px 10px;"
                        onclick="adminSystem.printOrder(${order.id})">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    clearHistoryFilters() {
        const fields = ['history-search', 'history-date-from', 'history-date-to'];
        fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const status = document.getElementById('history-status');
        if (status) status.value = 'all';
        this.filterHistory();
    }

    exportHistory() {
        if (!this._allHistory || this._allHistory.length === 0) {
            this.showAlert('Nenhum dado para exportar.', 'warning');
            return;
        }

        const headers = ['ID', 'Data', 'Hora', 'Cliente', 'Telefone', 'Tipo', 'Endereço', 'Itens', 'Subtotal', 'Taxa Entrega', 'Total', 'Status'];
        const rows = this._allHistory.map(o => {
            const d = new Date(o.created_at);
            const items = Array.isArray(o.items) ? o.items.map(i => `${i.quantity}x ${i.name}`).join(' | ') : '';
            return [
                o.id,
                d.toLocaleDateString('pt-BR'),
                d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                o.customer_name || '',
                o.customer_phone || '',
                o.delivery_type === 'delivery' ? 'Delivery' : 'Retirada',
                o.delivery_type === 'delivery' ? `${o.address || ''} ${o.neighborhood || ''}`.trim() : '',
                items,
                parseFloat(o.subtotal || 0).toFixed(2),
                parseFloat(o.delivery_fee || 0).toFixed(2),
                parseFloat(o.total || 0).toFixed(2),
                o.status
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().substring(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.showAlert('CSV exportado com sucesso!', 'success');
    }

    updateOrdersBadge() {
        const badge = document.getElementById('orders-badge');
        if (!badge) return;
        if (this.newOrdersCount > 0) {
            badge.textContent = this.newOrdersCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    updatePendingCount() {
        const count = this.orders.filter(o => o.status === 'pending').length;
        const el = document.getElementById('pending-orders-count');
        if (el) el.textContent = count;
    }

    playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Toca 3 bips ascendentes
            [0, 0.15, 0.3].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 600 + i * 200;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.25);
            });
        } catch (e) { /* sem suporte a áudio */ }
    }

    showNewOrderToast(order) {
        const toast = document.createElement('div');
        toast.className = 'new-order-toast';
        toast.innerHTML = `
            <span style="font-size:1.5rem;"><i class="fa-solid fa-bell"></i></span>
            <div>
                <div>Novo Pedido!</div>
                <div style="font-size:0.85rem;font-weight:400;">${order.customer_name} — R$ ${parseFloat(order.total).toFixed(2).replace('.', ',')}</div>
            </div>
        `;
        toast.onclick = () => { this.showSection('orders'); toast.remove(); };
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }

    initRealtime() {
        const statusEl = document.getElementById('realtime-status');

        this.realtimeChannel = supabaseClient
            .channel('orders-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders'
            }, (payload) => {
                console.log('🔔 Novo pedido recebido!', payload.new);
                const newOrder = payload.new;

                // Adiciona no topo da lista
                this.orders.unshift(newOrder);

                // Verifica se está na aba de pedidos
                const ordersSection = document.getElementById('orders');
                if (ordersSection && ordersSection.classList.contains('active')) {
                    const list = document.getElementById('orders-list');
                    if (list) {
                        const cardHtml = this.renderOrderCard(newOrder, true);
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = cardHtml;
                        list.insertBefore(tempDiv.firstElementChild, list.firstChild);
                        // Remove estado vazio se existia
                        const emptyEl = list.querySelector('.orders-empty');
                        if (emptyEl) emptyEl.remove();
                    }
                } else {
                    // Incrementa badge
                    this.newOrdersCount++;
                    this.updateOrdersBadge();
                }

                this.updatePendingCount();
                this.playNotificationSound();
                this.showNewOrderToast(newOrder);
            })
            .subscribe((status) => {
                if (statusEl) {
                    if (status === 'SUBSCRIBED') {
                        statusEl.classList.add('connected');
                        statusEl.innerHTML = '<span class="realtime-dot"></span> Tempo Real Ativo';
                    } else {
                        statusEl.classList.remove('connected');
                        statusEl.innerHTML = '<span class="realtime-dot"></span> Reconectando...';
                    }
                }
            });
    }

    async saveSettings() {
        const btn = document.querySelector('button[onclick="adminSystem.saveSettings()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        }

        try {
            // Objeto de Configuração
            const configData = {
                site_paused: document.getElementById('site-paused').checked,
                orders_enabled: document.getElementById('orders-enabled').checked,
                whatsapp_number: document.getElementById('whatsapp-number').value.replace(/\D/g, ''),
                free_delivery_minimum: parseFloat(document.getElementById('free-delivery-min').value) || 0,
                estimated_delivery_time: document.getElementById('delivery-time').value,
                welcome_message: document.getElementById('welcome-message').value,
                tagline: document.getElementById('tagline').value,
                delivery_banner: document.getElementById('delivery-banner').value,
                pix_key: (document.getElementById('pix-key')?.value || '').trim()
            };

            // Objeto StoreInfo
            const storeInfoData = {
                name: 'Uai Hamburgueria do Chico', // Fixo por enquanto
                address: document.getElementById('store-address').value,
                address_complement: document.getElementById('store-complement').value,
                phone: document.getElementById('store-phone').value,
                instagram: document.getElementById('store-instagram').value,
                // Mantém os horários antigos se não houver edição no form
                hours_weekdays: this.data.storeInfo.hours?.weekdays || 'Segunda a Sábado: 16:00 às 03:00',
                hours_sunday: this.data.storeInfo.hours?.sunday || 'Domingo: 20:00 às 03:00'
            };

            // Chamadas ao dbManager
            const resConfig = await dbManager.updateConfig(configData);
            const resStore = await dbManager.updateStoreInfo(storeInfoData);

            if (resConfig.success && resStore.success) {
                this.showAlert('Configurações salvas com sucesso!', 'success');
                // Força um recarregamento dos dados
                await refreshData();
                this.data = getData();
                if (newPassword && newPassword.trim() !== '') {
                    this.showAlert('Senha alterada. Você precisará logar novamente.', 'warning');
                    setTimeout(() => this.logout(), 2000);
                }
            } else {
                this.showAlert('Erro ao salvar algumas configurações.', 'danger');
                console.error('Erros de salvamento:', resConfig.error, resStore.error);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showAlert('Erro inesperado ao salvar configurações.', 'danger');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Salvar Todas as Configurações';
            }
        }
    }

    // ========== RELATÓRIOS ==========

    async loadReports(days = 7) {
        // Atualiza botões de período
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.days) === days);
        });

        const loading = document.getElementById('reports-loading');
        const empty = document.getElementById('reports-empty');
        if (loading) loading.style.display = 'block';
        if (empty) empty.style.display = 'none';

        try {
            // Busca todos os pedidos
            const result = await dbManager.getOrders();
            const allOrders = result.success ? (result.data || []) : [];

            // Calcula data de corte
            const now = new Date();
            let cutoff;
            if (days === 0) {
                // Este mês
                cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            }

            const filtered = allOrders.filter(o => {
                const d = new Date(o.created_at);
                return d >= cutoff && o.status !== 'cancelled';
            });

            // KPIs
            const totalOrders = filtered.length;
            const revenue = filtered.reduce((s, o) => s + parseFloat(o.total || 0), 0);
            const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;
            const pending = allOrders.filter(o => o.status === 'pending').length;

            document.getElementById('kpi-total-orders').textContent = totalOrders;
            document.getElementById('kpi-revenue').textContent = 'R$ ' + revenue.toFixed(2).replace('.', ',');
            document.getElementById('kpi-avg-ticket').textContent = 'R$ ' + avgTicket.toFixed(2).replace('.', ',');
            document.getElementById('kpi-pending').textContent = pending;

            // Agrupa por dia para os gráficos de série temporal
            const periodDays = days === 0
                ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                : days;

            const labels = [];
            const ordersPerDay = [];
            const revenuePerDay = [];

            for (let i = periodDays - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                labels.push(label);

                const dayStr = d.toISOString().substring(0, 10);
                const dayOrders = filtered.filter(o => o.created_at.substring(0, 10) === dayStr);
                ordersPerDay.push(dayOrders.length);
                revenuePerDay.push(parseFloat(dayOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2)));
            }

            // Por status
            const statusCounts = {
                pending: allOrders.filter(o => o.status === 'pending').length,
                preparing: allOrders.filter(o => o.status === 'preparing').length,
                delivering: allOrders.filter(o => o.status === 'delivering').length,
                completed: allOrders.filter(o => o.status === 'completed').length,
                cancelled: allOrders.filter(o => o.status === 'cancelled').length
            };

            // Delivery vs Retirada (todos os pedidos do período)
            const deliveryCount = filtered.filter(o => o.delivery_type === 'delivery').length;
            const pickupCount = filtered.filter(o => o.delivery_type === 'pickup').length;

            this.buildCharts(labels, ordersPerDay, revenuePerDay, statusCounts, deliveryCount, pickupCount);

            if (loading) loading.style.display = 'none';
            if (totalOrders === 0 && empty) empty.style.display = 'flex';

        } catch (err) {
            console.error('Erro ao carregar relatório:', err);
            if (loading) loading.style.display = 'none';
        }
    }

    buildCharts(labels, ordersData, revenueData, statusCounts, deliveryCount, pickupCount) {
        const primary = '#E63946';
        const secondary = '#F77F00';
        const blue = '#2563EB';
        const green = '#10B981';
        const purple = '#8B5CF6';
        const amber = '#F59E0B';
        const red = '#EF4444';
        const gray = '#6B6B6B';

        const chartDefaults = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        };

        // Destroi gráficos anteriores
        ['chart-orders', 'chart-revenue', 'chart-status', 'chart-delivery-type'].forEach(id => {
            if (this._charts && this._charts[id]) {
                this._charts[id].destroy();
            }
        });
        if (!this._charts) this._charts = {};

        // 1. Pedidos por dia — barras
        this._charts['chart-orders'] = new Chart(
            document.getElementById('chart-orders'),
            {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Pedidos',
                        data: ordersData,
                        backgroundColor: primary + 'CC',
                        borderColor: primary,
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    ...chartDefaults,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            }
        );

        // 2. Faturamento por dia — linha
        this._charts['chart-revenue'] = new Chart(
            document.getElementById('chart-revenue'),
            {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Faturamento (R$)',
                        data: revenueData,
                        borderColor: green,
                        backgroundColor: green + '22',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: green,
                        pointRadius: 4
                    }]
                },
                options: {
                    ...chartDefaults,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: v => 'R$ ' + v.toFixed(2).replace('.', ',')
                            }
                        }
                    }
                }
            }
        );

        // 3. Por status — rosca
        this._charts['chart-status'] = new Chart(
            document.getElementById('chart-status'),
            {
                type: 'doughnut',
                data: {
                    labels: ['Pendente', 'Em Preparo', 'Em Entrega', 'Entregue', 'Cancelado'],
                    datasets: [{
                        data: [
                            statusCounts.pending,
                            statusCounts.preparing,
                            statusCounts.delivering,
                            statusCounts.completed,
                            statusCounts.cancelled
                        ],
                        backgroundColor: [amber, blue, secondary, green, red],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: { ...chartDefaults }
            }
        );

        // 4. Delivery vs Retirada — rosca
        this._charts['chart-delivery-type'] = new Chart(
            document.getElementById('chart-delivery-type'),
            {
                type: 'doughnut',
                data: {
                    labels: ['Delivery', 'Retirada no Local'],
                    datasets: [{
                        data: [deliveryCount, pickupCount],
                        backgroundColor: [primary, purple],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: { ...chartDefaults }
            }
        );
    }

    // ============================================
    // CUPONS DE DESCONTO
    // ============================================

    async loadCoupons() {
        const tbody = document.getElementById('coupons-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--gray);">Carregando...</td></tr>';

        const result = await dbManager.getCoupons();
        if (!result.success || !result.data?.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--gray);">Nenhum cupom cadastrado. Clique em "+ Novo Cupom" para criar.</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(c => this.renderCouponRow(c)).join('');
    }

    renderCouponRow(c) {
        const typeLabel = { percent: 'Percentual', fixed: 'Valor Fixo', free_shipping: 'Frete Gratis' }[c.type] || c.type;
        const valueStr = c.type === 'percent'
            ? c.value + '%'
            : c.type === 'fixed'
                ? 'R$ ' + parseFloat(c.value).toFixed(2).replace('.', ',')
                : '-';
        const minStr = c.min_order > 0 ? 'R$ ' + parseFloat(c.min_order).toFixed(2).replace('.', ',') : '-';
        const usosStr = c.uses_limit ? (c.uses_count + '/' + c.uses_limit) : c.uses_count + ' usos';
        const badge = c.active
            ? '<span style="background:#D1FAE5; color:#065F46; padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:700;">Ativo</span>'
            : '<span style="background:#FEE2E2; color:#991B1B; padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:700;">Inativo</span>';
        const tdStyle = 'padding:10px 12px; border-bottom:1px solid var(--light-gray);';

        return `<tr>
            <td style="${tdStyle} font-weight:800; letter-spacing:.04em; color:var(--primary);">${c.code}</td>
            <td style="${tdStyle}">${typeLabel}</td>
            <td style="${tdStyle} font-weight:700;">${valueStr}</td>
            <td style="${tdStyle}">${minStr}</td>
            <td style="${tdStyle} color:var(--gray);">${usosStr}</td>
            <td style="${tdStyle}">${badge}</td>
            <td style="${tdStyle}">
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn-tracking" style="background:#3B82F6;" onclick="adminSystem.openCouponModal(${c.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-tracking" style="background:${c.active ? '#EF4444' : '#10B981'};"
                        onclick="adminSystem.toggleCouponActive(${c.id}, ${!c.active})">
                        <i class="fa-solid fa-${c.active ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn-tracking" style="background:#6B7280;" onclick="adminSystem.deleteCouponAdmin(${c.id}, '${c.code}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }

    openCouponModal(id = null) {
        const modal = document.getElementById('coupon-modal');
        if (!modal) return;

        // Limpar form
        document.getElementById('coupon-edit-id').value = id || '';
        document.getElementById('coupon-form-code').value = '';
        document.getElementById('coupon-form-type').value = 'percent';
        document.getElementById('coupon-form-value').value = '';
        document.getElementById('coupon-form-min').value = '0';
        document.getElementById('coupon-form-limit').value = '';
        document.getElementById('coupon-form-desc').value = '';
        document.getElementById('coupon-form-active').checked = true;
        document.getElementById('coupon-modal-title').innerHTML = id
            ? '<i class="fa-solid fa-pen"></i> Editar Cupom'
            : '<i class="fa-solid fa-tag"></i> Novo Cupom';
        this.onCouponTypeChange();

        // Carregar dados se edição
        if (id) {
            dbManager.getCoupons().then(r => {
                const c = r.data?.find(x => x.id === id);
                if (!c) return;
                document.getElementById('coupon-form-code').value = c.code;
                document.getElementById('coupon-form-type').value = c.type;
                document.getElementById('coupon-form-value').value = c.value;
                document.getElementById('coupon-form-min').value = c.min_order;
                document.getElementById('coupon-form-limit').value = c.uses_limit || '';
                document.getElementById('coupon-form-desc').value = c.description || '';
                document.getElementById('coupon-form-active').checked = c.active;
                this.onCouponTypeChange();
            });
        }

        modal.classList.add('active');
    }

    closeCouponModal() {
        document.getElementById('coupon-modal')?.classList.remove('active');
    }


    onCouponTypeChange() {
        const type = document.getElementById('coupon-form-type')?.value;
        const group = document.getElementById('coupon-value-group');
        const label = document.getElementById('coupon-value-label');
        if (!group || !label) return;

        if (type === 'free_shipping') {
            group.style.display = 'none';
        } else {
            group.style.display = '';
            label.textContent = type === 'percent' ? 'Valor (%) *' : 'Valor (R$) *';
        }
    }

    async saveCoupon(e) {
        e.preventDefault();
        const id = document.getElementById('coupon-edit-id').value;
        const data = {
            code: document.getElementById('coupon-form-code').value,
            type: document.getElementById('coupon-form-type').value,
            value: parseFloat(document.getElementById('coupon-form-value').value) || 0,
            minOrder: parseFloat(document.getElementById('coupon-form-min').value) || 0,
            usesLimit: parseInt(document.getElementById('coupon-form-limit').value) || null,
            description: document.getElementById('coupon-form-desc').value,
            active: document.getElementById('coupon-form-active').checked
        };

        const btn = document.getElementById('coupon-submit-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        const result = id
            ? await dbManager.updateCoupon(parseInt(id), data)
            : await dbManager.createCoupon(data);

        if (btn) { btn.disabled = false; btn.textContent = 'Salvar Cupom'; }

        if (result.success) {
            this.closeCouponModal();
            this.loadCoupons();
            this.showToast(id ? 'Cupom atualizado!' : 'Cupom criado!', 'success');
        } else {
            this.showToast('Erro: ' + (result.error || 'Falha ao salvar.'), 'error');
        }
    }

    async deleteCouponAdmin(id, code) {
        if (!confirm('Remover o cupom ' + code + '? Esta acao nao pode ser desfeita.')) return;
        const result = await dbManager.deleteCoupon(id);
        if (result.success) {
            this.loadCoupons();
            this.showToast('Cupom removido.', 'success');
        } else {
            this.showToast('Erro ao remover cupom.', 'error');
        }
    }

    async toggleCouponActive(id, active) {
        const result = await dbManager.updateCoupon(id, { active });
        if (result.success) {
            this.loadCoupons();
            this.showToast(active ? 'Cupom ativado!' : 'Cupom desativado.', 'success');
        }
    }

    showToast(msg, type = 'success') {
        // Reutiliza o sistema de toast existente ou cria simples
        const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type] || colors.success};
            color:#fff;padding:12px 20px;border-radius:10px;font-weight:600;z-index:9999;
            box-shadow:0 4px 16px rgba(0,0,0,.2);animation:slideIn .3s ease;`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Inicializa sistema admin
let adminSystem = null;

// Aguardar carregamento dos dados do Supabase
window.addEventListener('dataLoaded', (event) => {
    if (!adminSystem) {
        adminSystem = new AdminSystem();
    }
});

// Fallback caso os dados já estejam carregados
document.addEventListener('DOMContentLoaded', () => {
    if (typeof cachedData !== 'undefined' && cachedData !== null && !adminSystem) {
        adminSystem = new AdminSystem();
    }
});

// ============================================================
// GERENCIAMENTO DE CATEGORIAS
// ============================================================

// Extensão da classe AdminSystem para categorias
AdminSystem.prototype.loadCategories = async function () {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    grid.innerHTML = `<div style="text-align:center;padding:var(--spacing-xl);color:var(--gray);">
        <i class="fa-solid fa-spinner fa-spin"></i> Carregando categorias...
    </div>`;

    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `<div style="text-align:center;padding:var(--spacing-xl);color:var(--gray);">
                <i class="fa-solid fa-tags" style="font-size:2rem;"></i>
                <p style="margin-top:8px;">Nenhuma categoria encontrada. Crie a primeira!</p>
            </div>`;
            return;
        }

        grid.innerHTML = data.map(cat => `
            <div class="card" style="text-align:center; position:relative; transition: all 0.2s;">
                <div style="font-size:2.5rem; color:var(--primary); margin-bottom:var(--spacing-sm);">
                    <i class="${cat.icon}"></i>
                </div>
                <h3 style="font-size:1.1rem; margin-bottom:4px;">${cat.name}</h3>
                <small style="color:var(--gray);">Ordem: ${cat.display_order}</small>
                <small style="display:block; color:var(--gray); font-size:0.75rem; margin-top:4px; font-family:monospace;">${cat.icon}</small>
                <div style="display:flex; gap:8px; justify-content:center; margin-top:var(--spacing-sm);">
                    <button class="btn btn-secondary" style="padding:6px 14px; font-size:0.85rem;"
                        onclick="adminSystem.openCategoryModal('${cat.id}', '${cat.name.replace(/'/g, "\\'")}', '${cat.icon}', ${cat.display_order})">
                        <i class="fa-solid fa-pencil"></i> Editar
                    </button>
                    <button class="btn" style="padding:6px 14px; font-size:0.85rem; background:#FEE2E2; color:#B91C1C; border:none;"
                        onclick="adminSystem.deleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Atualizar select de categoria no formulário de produto
        this.updateProductCategorySelect(data);

    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        grid.innerHTML = `<div style="color:var(--primary);"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar categorias: ${err.message}</div>`;
    }
};

AdminSystem.prototype.updateProductCategorySelect = function (categories) {
    const select = document.getElementById('product-category');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Selecione...</option>' +
        categories.map(c => `<option value="${c.id}"${c.id === current ? ' selected' : ''}>${c.name}</option>`).join('');
};

AdminSystem.prototype.openCategoryModal = function (id = '', name = '', icon = '', order = 1) {
    const overlay = document.getElementById('category-modal-overlay');
    const title = document.getElementById('category-modal-title');
    document.getElementById('category-id').value = id;
    document.getElementById('category-name').value = name;
    document.getElementById('category-icon').value = icon;
    document.getElementById('category-order').value = order;
    title.innerHTML = id
        ? '<i class="fa-solid fa-pencil"></i> Editar Categoria'
        : '<i class="fa-solid fa-plus"></i> Nova Categoria';
    this.previewCategoryIcon(icon || 'fa-solid fa-tag');
    overlay.style.display = 'flex';

    // Submit do form
    const form = document.getElementById('category-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        this.saveCategory();
    };
};

AdminSystem.prototype.closeCategoryModal = function () {
    document.getElementById('category-modal-overlay').style.display = 'none';
};

AdminSystem.prototype.previewCategoryIcon = function (iconClass) {
    const preview = document.getElementById('icon-preview');
    const label = document.getElementById('icon-preview-label');
    if (!preview) return;
    if (iconClass && iconClass.trim()) {
        preview.innerHTML = `<i class="${iconClass.trim()}"></i>`;
        if (label) label.textContent = iconClass.trim();
    } else {
        preview.innerHTML = `<i class="fa-solid fa-tag"></i>`;
        if (label) label.textContent = 'Seu ícone aparecerá aqui';
    }
};

AdminSystem.prototype.selectIcon = function (iconClass) {
    document.getElementById('category-icon').value = iconClass;
    this.previewCategoryIcon(iconClass);
};

AdminSystem.prototype.saveCategory = async function () {
    const id = document.getElementById('category-id').value.trim();
    const name = document.getElementById('category-name').value.trim();
    const icon = document.getElementById('category-icon').value.trim();
    const order = parseInt(document.getElementById('category-order').value) || 1;

    if (!name) return alert('Digite o nome da categoria.');
    if (!icon) return alert('Escolha ou digite um ícone FontAwesome.');

    const btn = document.querySelector('#category-form button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        if (id) {
            // UPDATE
            const { error } = await supabaseClient
                .from('categories')
                .update({ name, icon, display_order: order })
                .eq('id', id);
            if (error) throw error;
        } else {
            // INSERT — gera ID a partir do nome
            const newId = name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            const { error } = await supabaseClient
                .from('categories')
                .insert([{ id: newId, name, icon, display_order: order }]);
            if (error) throw error;
        }

        this.closeCategoryModal();
        this.loadCategories();
        this.showToast(id ? 'Categoria atualizada!' : 'Categoria criada!', 'success');
    } catch (err) {
        console.error('Erro ao salvar categoria:', err);
        alert('Erro ao salvar categoria: ' + (err.message || JSON.stringify(err)));
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Categoria';
    }
};

AdminSystem.prototype.deleteCategory = async function (id, name) {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?\n\nProdutos desta categoria ficarão sem categoria!`)) return;

    try {
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        this.loadCategories();
        this.showToast('Categoria excluída!', 'success');
    } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        alert('Erro ao excluir: ' + err.message);
    }
};
