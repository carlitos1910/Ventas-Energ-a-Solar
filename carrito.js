const cartStorageKey = 'ventasEnergiaSolarCart';
const transfermovilCard = '9212129970219830';
const transfermovilCardDisplay = transfermovilCard.replace(/(\d{4})(?=\d)/g, '$1 ');
const transfermovilQrImage = 'codigo%20QR.jpg';
const vendorWhatsapp = '5356836392';
let toastTimer = 0;
let cartOpenTimer = 0;

function readCart() {
    try {
        return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function productFromCard(card) {
    const priceElement = card.querySelector('.product-price');
    return {
        name: card.querySelector('h3')?.textContent.trim() || 'Producto solar',
        brand: card.querySelector('.product-brand')?.textContent.replace('Marca:', '').trim() || '',
        price: Number(priceElement?.dataset.mn || parseMn(priceElement?.textContent)),
        image: card.querySelector('img')?.getAttribute('src') || ''
    };
}

function parseMn(text) {
    return Number((text || '').replace(/[^0-9.]/g, '')) || 0;
}

function formatMn(value) {
    return `${value.toFixed(2)} MN`;
}

function decorateProducts() {
    document.querySelectorAll('.category-product .primary-button').forEach((button) => {
        if (button.dataset.decorated) return;
        button.dataset.decorated = 'true';
        button.innerHTML = 'Añadir al carrito <span>🛒</span>';
    });

    document.querySelectorAll('.product-price').forEach((price) => {
        if (price.dataset.mn) return;
        const mn = parseMn(price.textContent);
        if (!mn) return;
        price.dataset.mn = mn;
        price.textContent = formatMn(mn);
    });
}

function cartCount(cart) {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function money(value) {
    return formatMn(value);
}

function buildWhatsappLink(cart, totalText) {
    const order = cart.map((item) => `• ${item.quantity}x ${item.name} (${item.brand}) - ${money(item.price * item.quantity)}`).join('\n');
    const message = `Hola, quiero confirmar mi pedido de Ventas Energía Solar:\n\n${order}\n\nTotal: ${totalText}\n\nAdjunto la captura del pago por Transfermóvil para confirmar el pedido.`;
    return `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(message)}`;
}

function updateCheckoutLink() {
    const checkout = document.querySelector('.cart-checkout');
    if (!checkout) return;

    const cart = readCart();
    const total = document.querySelector('#cart-total')?.textContent || '0.00 MN';

    checkout.target = '_blank';
    checkout.rel = 'noopener';
    checkout.innerHTML = 'Enviar pedido por WhatsApp <span>↗</span>';

    if (cart.length === 0) {
        checkout.href = '#cart-drawer';
        checkout.classList.add('is-disabled');
        checkout.setAttribute('aria-disabled', 'true');
        checkout.setAttribute('tabindex', '-1');
        return;
    }

    checkout.href = buildWhatsappLink(cart, total);
    checkout.classList.remove('is-disabled');
    checkout.removeAttribute('tabindex');
    checkout.setAttribute('aria-disabled', 'false');
}

function showToast(message) {
    let toast = document.querySelector('#cart-toast');

    if (!toast) {
        toast = document.createElement('p');
        toast.id = 'cart-toast';
        toast.className = 'cart-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function updateCartButtons(cart) {
    document.querySelectorAll('.cart-button').forEach((button) => {
        let counter = button.querySelector('span');
        if (!counter) {
            button.textContent = '🛒 Carrito ';
            counter = document.createElement('span');
            counter.setAttribute('aria-hidden', 'true');
            button.appendChild(counter);
        }
        counter.textContent = cartCount(cart);
    });
}

function renderCart() {
    const cart = readCart();
    const items = document.querySelector('#cart-items');
    const total = document.querySelector('#cart-total');
    const empty = document.querySelector('#cart-empty');

    if (!items || !total || !empty) return;
    items.innerHTML = '';
    empty.hidden = cart.length > 0;

    cart.forEach((item, index) => {
        const row = document.createElement('article');
        row.className = 'cart-item';
        row.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div><strong>${item.name}</strong><small>${item.brand}</small><span>${money(item.price)}</span></div>
            <div class="cart-quantity"><button type="button" data-cart-action="decrease" data-index="${index}">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" data-index="${index}">+</button></div>
            <button class="cart-remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Eliminar ${item.name}">×</button>
        `;
        items.appendChild(row);
    });

    total.textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    updateCheckoutLink();
    updateCartButtons(cart);
}

function showCart() {
    document.querySelector('#cart-drawer')?.classList.add('is-visible');
    document.querySelector('#cart-drawer')?.setAttribute('aria-hidden', 'false');
    renderCart();
}

function hideCart() {
    document.querySelector('#cart-drawer')?.classList.remove('is-visible');
    document.querySelector('#cart-drawer')?.setAttribute('aria-hidden', 'true');
}

function createCartDrawer() {
    const drawer = document.createElement('aside');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
        <div class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div class="cart-heading"><h2 id="cart-title">Tu carrito</h2><button type="button" data-cart-action="close" aria-label="Cerrar carrito">×</button></div>
            <p id="cart-empty" class="cart-empty">Aún no has agregado productos.</p>
            <div id="cart-items"></div>
            <div class="cart-summary"><span>Total</span><strong id="cart-total">0.00 MN</strong></div>
            <section class="payment-box"><p class="product-type">Método de pago</p><h3>Transfermóvil por QR</h3><p>Escanea el código QR desde Transfermóvil o transfiere el importe exacto a la tarjeta.</p><img class="payment-qr" src="${transfermovilQrImage}" alt="Código QR de Transfermóvil de la tarjeta BPA"><strong class="payment-account">Tarjeta BPA: ${transfermovilCardDisplay}</strong><small>Después de pagar, envía tu pedido y adjunta la captura de la transferencia para confirmarlo.</small></section>
            <a class="primary-button cart-checkout" href="https://wa.me/${vendorWhatsapp}" target="_blank" rel="noopener">Enviar pedido por WhatsApp <span>↗</span></a>
        </div>`;
    document.body.appendChild(drawer);
}

document.addEventListener('click', (event) => {
    const buyButton = event.target.closest('.category-product .primary-button');
    const cartButton = event.target.closest('.cart-button');
    const actionButton = event.target.closest('[data-cart-action]');
    const checkout = event.target.closest('.cart-checkout');

    if (buyButton) {
        event.preventDefault();
        const cart = readCart();
        const product = productFromCard(buyButton.closest('.category-product'));
        const existing = cart.find((item) => item.name === product.name && item.brand === product.brand);
        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        saveCart(cart);
        updateCartButtons(cart);
        renderCart();
        showToast(`${product.name} añadido al carrito `);
        window.clearTimeout(cartOpenTimer);
        cartOpenTimer = window.setTimeout(showCart, 1300);
    }

    if (cartButton) {
        event.preventDefault();
        window.clearTimeout(cartOpenTimer);
        showCart();
    }

    if (actionButton) {
        const action = actionButton.dataset.cartAction;
        const cart = readCart();
        const index = Number(actionButton.dataset.index);
        if (action === 'close') hideCart();
        if (action === 'increase') cart[index].quantity += 1;
        if (action === 'decrease') cart[index].quantity > 1 ? cart[index].quantity -= 1 : cart.splice(index, 1);
        if (action === 'remove') cart.splice(index, 1);
        if (action !== 'close') { saveCart(cart); renderCart(); }
    }

    if (checkout && readCart().length === 0) {
        event.preventDefault();
        showToast('Agrega al menos un producto para enviar tu pedido.');
    }

    if (event.target.id === 'cart-drawer') hideCart();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideCart();
});

createCartDrawer();
decorateProducts();
updateCartButtons(readCart());
