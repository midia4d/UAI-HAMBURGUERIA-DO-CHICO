// ============================================================
// RASTREIO DE PEDIDO — UAI HAMBURGUERIA DO CHICO
// Busca o pedido pelo ID da URL e atualiza a cada 15s
// ============================================================

const REFRESH_INTERVAL = 15000; // 15 segundos

const STATUS_CONFIG = {
    pending: {
        step: 0,
        label: 'Aguardando Confirmação',
        desc: 'Seu pedido foi recebido e está aguardando confirmação da pizzaria.',
        banner: null
    },
    confirmed: {
        step: 1,
        label: 'Confirmado',
        desc: 'Pedido confirmado! Em breve começará a ser preparado.',
        banner: null
    },
    preparing: {
        step: 1,
        label: 'Em Preparo',
        desc: 'Sua pizza está sendo feita com carinho! 🍕',
        banner: null
    },
    delivering: {
        step: 2,
        label: 'Saiu para Entrega',
        desc: 'Seu pedido está a caminho! 🛵 Aguarde em casa.',
        banner: null
    },
    completed: {
        step: 3,
        label: 'Entregue!',
        desc: 'Pedido entregue com sucesso. Bom apetite! 🎉',
        banner: 'completed'
    },
    cancelled: {
        step: -1,
        label: 'Cancelado',
        desc: 'Este pedido foi cancelado. Entre em contato caso tenha alguma dúvida.',
        banner: 'cancelled'
    }
};

const STEPS = [
    { icon: 'fa-clock', label: 'Pedido Recebido', desc: 'Aguardando confirmação da pizzaria' },
    { icon: 'fa-fire-burner', label: 'Em Preparo', desc: 'Sua pizza está sendo preparada' },
    { icon: 'fa-motorcycle', label: 'Saiu para Entrega', desc: 'O entregador está a caminho' },
    { icon: 'fa-circle-check', label: 'Entregue', desc: 'Pedido entregue!' }
];

// ── Utilidades ──────────────────────────────────────────────

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(val) {
    return 'R$ ' + parseFloat(val || 0).toFixed(2).replace('.', ',');
}

function getOrderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ── Renderização ────────────────────────────────────────────

function renderTracking(order) {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const items = Array.isArray(order.items) ? order.items : [];
    const main = document.getElementById('main-content');

    // Stepper HTML
    const stepperHTML = STEPS.map((s, i) => {
        let cls = 'pending';
        if (i < cfg.step) cls = 'done';
        if (i === cfg.step) cls = 'active';
        if (order.status === 'cancelled') cls = 'pending';

        return `
        <div class="stepper-item ${cls}">
            <div class="stepper-icon"><i class="fa-solid ${s.icon}"></i></div>
            <div class="stepper-label">${s.label}</div>
            <div class="stepper-desc">${i === cfg.step && order.status !== 'cancelled' ? cfg.desc : s.desc}</div>
        </div>`;
    }).join('');

    // Banner especial
    let bannerHTML = '';
    if (cfg.banner === 'cancelled') {
        bannerHTML = `<div class="status-banner cancelled">
            <i class="fa-solid fa-circle-xmark fa-lg"></i>
            <div>
                <div>Pedido Cancelado</div>
                <div style="font-weight:400;font-size:0.82rem;">${cfg.desc}</div>
            </div>
        </div>`;
    } else if (cfg.banner === 'completed') {
        bannerHTML = `<div class="status-banner completed">
            <i class="fa-solid fa-party-horn fa-lg"></i>
            <div>
                <div>Pedido Entregue!</div>
                <div style="font-weight:400;font-size:0.82rem;">Obrigado pela preferência! Volte sempre 🍕</div>
            </div>
        </div>`;
    }

    // Itens
    const itemsHTML = items.map(it => `
        <div class="item-row">
            <div><span class="item-qty">${it.quantity}x</span>${it.name}</div>
            <div class="item-price">${formatPrice(it.price * it.quantity)}</div>
        </div>`).join('');

    // Endereço
    let addressHTML = '';
    if (order.delivery_type === 'delivery') {
        const addr = [order.address, order.neighborhood, order.address_complement].filter(Boolean).join(', ');
        addressHTML = `
        <div class="address-box">
            <i class="fa-solid fa-location-dot"></i>
            <div>
                <div style="font-weight:700;margin-bottom:2px;">Endereço de entrega</div>
                <div>${addr}</div>
            </div>
        </div>`;
    } else {
        addressHTML = `
        <div class="address-box">
            <i class="fa-solid fa-store"></i>
            <div>
                <div style="font-weight:700;margin-bottom:2px;">Retirada no local</div>
                <div>O pedido será retirado na pizzaria</div>
            </div>
        </div>`;
    }

    main.innerHTML = `
        <!-- Card de status e stepper -->
        <div class="card">
            <div class="order-header">
                <div class="order-id">Pedido #${order.id}</div>
                <div class="order-title">${cfg.label}</div>
                <div class="order-date">${formatDate(order.created_at)}</div>
            </div>

            ${bannerHTML}

            ${order.status !== 'cancelled' ? `<div class="stepper">${stepperHTML}</div>` : ''}
        </div>

        <!-- Detalhes do pedido -->
        <div class="card">
            <div class="section-title"><i class="fa-solid fa-receipt"></i> Itens do Pedido</div>
            ${itemsHTML}

            <div style="margin-top:16px;">
                <div class="totals-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(order.subtotal)}</span>
                </div>
                <div class="totals-row">
                    <span>Taxa de entrega</span>
                    <span>${parseFloat(order.delivery_fee || 0) === 0 ? '<span style="color:#10B981;font-weight:700;">Grátis</span>' : formatPrice(order.delivery_fee)}</span>
                </div>
                <div class="totals-row total">
                    <span>Total</span>
                    <span>${formatPrice(order.total)}</span>
                </div>
            </div>
        </div>

        <!-- Endereço -->
        <div class="card">
            <div class="section-title"><i class="fa-solid fa-map-pin"></i> Entrega</div>
            ${addressHTML}
        </div>

        <!-- Contato -->
        <div class="card">
            <div class="section-title"><i class="fa-brands fa-whatsapp"></i> Alguma dúvida?</div>
            <p style="font-size:0.88rem;color:#6B7280;margin-bottom:12px;">
                Fale com a gente pelo WhatsApp — respondemos rapidinho!
            </p>
            <a id="whatsapp-link" href="#" class="btn-whatsapp" target="_blank" rel="noopener">
                <i class="fa-brands fa-whatsapp fa-lg"></i>
                Falar com a Pizzaria
            </a>
        </div>
    `;

    // Preencher link WhatsApp após renderizar
    loadStorePhone();
}

function renderError(msg) {
    document.getElementById('main-content').innerHTML = `
        <div class="center-screen">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h2>Pedido não encontrado</h2>
            <p>${msg || 'O link pode estar incorreto ou o pedido foi removido.'}</p>
            <a href="pedido.html" style="color:#fff;font-weight:600;margin-top:8px;">← Fazer novo pedido</a>
        </div>`;
}

// ── Telefone da loja ─────────────────────────────────────────

async function loadStorePhone() {
    try {
        if (typeof dbManager !== 'undefined' && dbManager.getStoreInfo) {
            const info = await dbManager.getStoreInfo();
            const phone = (info?.phone || '').replace(/\D/g, '');
            if (phone) {
                const link = document.getElementById('whatsapp-link');
                if (link) link.href = `https://wa.me/55${phone}`;
            }
        }
    } catch (e) { /* silencioso */ }
}

// ── Refresh ──────────────────────────────────────────────────

let lastStatus = null;
let countdown = REFRESH_INTERVAL / 1000;
let countTimer = null;

function updateRefreshLabel(secs) {
    const el = document.getElementById('refresh-label');
    if (el) el.textContent = `Atualiza em ${secs}s`;
}

async function fetchOrder(orderId) {
    try {
        const result = await dbManager.getOrderById(orderId);
        if (result.success && result.data) {
            const order = result.data;

            // Pisca levemente se o status mudou
            if (lastStatus && lastStatus !== order.status) {
                document.getElementById('main-content').style.opacity = '0.5';
                setTimeout(() => {
                    document.getElementById('main-content').style.opacity = '1';
                }, 300);
            }
            lastStatus = order.status;

            renderTracking(order);

            // Para de atualizar se pedido finalizado
            if (order.status === 'completed' || order.status === 'cancelled') {
                clearInterval(refreshTimer);
                clearInterval(countTimer);
                const el = document.getElementById('refresh-label');
                if (el) el.textContent = 'Pedido finalizado';
            }
        } else {
            renderError('Pedido não encontrado.');
        }
    } catch (e) {
        console.error('Erro ao buscar pedido:', e);
    }
}

// ── Init ─────────────────────────────────────────────────────

let refreshTimer = null;

async function init() {
    const orderId = getOrderId();

    if (!orderId) {
        renderError('Nenhum ID de pedido informado na URL.');
        return;
    }

    // Busca inicial
    await fetchOrder(orderId);

    // Countdown
    updateRefreshLabel(countdown);
    countTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) countdown = REFRESH_INTERVAL / 1000;
        updateRefreshLabel(countdown);
    }, 1000);

    // Auto-refresh
    refreshTimer = setInterval(async () => {
        countdown = REFRESH_INTERVAL / 1000;
        await fetchOrder(orderId);
    }, REFRESH_INTERVAL);
}

// Aguarda Supabase estar disponível
function waitForSupabase() {
    if (typeof dbManager !== 'undefined' && dbManager.getOrderById) {
        init();
    } else {
        setTimeout(waitForSupabase, 100);
    }
}

document.addEventListener('DOMContentLoaded', waitForSupabase);
