// Funções principais do site
class UaiPizzaria {
    constructor() {
        this.data = getData();
        this.init();
    }

    init() {
        this.checkSiteStatus();
        this.checkBusinessHours();
        this.initNavigation();
        this.initWhatsAppButton();
        this.initScrollAnimations();
    }

    // Verifica se o site está pausado
    checkSiteStatus() {
        if (this.data.config.sitePaused) {
            this.showClosedMessage();
        }
    }

    // Verifica horário de funcionamento
    checkBusinessHours() {
        const now = new Date();
        const day = now.getDay(); // 0 = Domingo, 1-6 = Segunda-Sábado
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = hour * 60 + minute;

        let isOpen = false;

        if (day === 0) { // Domingo
            // 20:00 até 03:00 (próximo dia)
            isOpen = currentTime >= 20 * 60 || currentTime < 3 * 60;
        } else { // Segunda a Sábado
            // 16:00 até 03:00 (próximo dia)
            isOpen = currentTime >= 16 * 60 || currentTime < 3 * 60;
        }

        if (!isOpen && !this.data.config.sitePaused) {
            this.updateGreeting('Estamos fechados no momento');
            this.showBusinessHoursInfo();
        } else if (isOpen) {
            this.updateGreeting();
        }
    }

    // Atualiza saudação baseada no horário
    updateGreeting(customMessage = null) {
        const greetingElement = document.querySelector('.hero-greeting');
        if (!greetingElement) return;

        if (customMessage) {
            greetingElement.textContent = customMessage;
            return;
        }

        const hour = new Date().getHours();
        let greeting = 'Olá, seja bem-vindo';

        if (hour >= 5 && hour < 12) {
            greeting = 'Bom dia, seja bem-vindo';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Boa tarde, seja bem-vindo';
        } else {
            greeting = 'Boa noite, seja bem-vindo';
        }

        greetingElement.textContent = greeting;
    }

    // Mostra mensagem de fechado
    showClosedMessage() {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.innerHTML = `
        <div class="closed-message fade-in">
          <h1 class="hero-title">😴 ${this.data.messages.closedMessage}</h1>
          <div class="hero-banner">
            <p class="hero-banner-text">
              Segunda a Sábado: ${this.data.storeInfo.hours.weekdays}<br>
              ${this.data.storeInfo.hours.sunday}
            </p>
          </div>
        </div>
      `;
        }
    }

    // Mostra informações de horário
    showBusinessHoursInfo() {
        const banner = document.querySelector('.hero-banner');
        if (banner) {
            banner.innerHTML = `
        <p class="hero-banner-text">
          📍 ${this.data.storeInfo.hours.weekdays}<br>
          ${this.data.storeInfo.hours.sunday}
        </p>
      `;
        }
    }

    // Inicializa navegação mobile
    initNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
            });

            // Fecha menu ao clicar em link
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }

        // Marca link ativo
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        // Header scroll effect
        const header = document.querySelector('.header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    }

    // Inicializa botão flutuante do WhatsApp
    initWhatsAppButton() {
        const whatsappButton = document.querySelector('.whatsapp-float');
        if (whatsappButton) {
            whatsappButton.addEventListener('click', () => {
                this.openWhatsApp('Olá! Gostaria de fazer um pedido.');
            });
        }
    }

    // Abre WhatsApp com mensagem
    openWhatsApp(message = '') {
        const phone = this.data.config.whatsappNumber;
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    }

    // Formata preço
    formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }

    // Animações ao scroll
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.card, .section-title').forEach(el => {
            observer.observe(el);
        });
    }

    // Carrega produtos por categoria
    getProductsByCategory(categoryId) {
        return this.data.products.filter(p => p.category === categoryId && p.available);
    }

    // Obtém categoria por ID
    getCategoryById(categoryId) {
        return this.data.categories.find(c => c.id === categoryId);
    }

    // Renderiza produtos
    renderProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum produto disponível no momento.</p>';
            return;
        }

        container.innerHTML = products.map(product => `
      <div class="card">
        <div class="card-image" style="background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem;">
          ${this.getCategoryIcon(product.category)}
        </div>
        <h3 class="card-title">${product.name}</h3>
        <p class="card-description">${product.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-price">${this.formatPrice(product.price)}</span>
          <button class="btn btn-primary" onclick="window.location.href='pedido.html?product=${product.id}'">
            <span class="btn-icon">🛒</span>
            Adicionar
          </button>
        </div>
      </div>
    `).join('');
    }

    // Obtém ícone da categoria
    getCategoryIcon(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.icon : '🍽️';
    }

    // Adiciona ao pedido e redireciona para página de pedido
    addToOrder(productId) {
        // Salva o produto no localStorage para ser adicionado na página de pedido
        localStorage.setItem('pendingProduct', productId);
        // Redireciona para página de pedido
        window.location.href = 'pedido.html?product=' + productId;
    }
}

// Inicializa aplicação
window.app = null;
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UaiPizzaria();
});
