const cartStorageKey = 'ventasEnergiaSolarCart';
const transfermovilAccount = '9244069990180327';
const transfermovilQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`Transfermóvil Cuba - Cuenta: ${transfermovilAccount}`)}`;

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
    return {
        name: card.querySelector('h3')?.textContent.trim() || 'Producto solar',
        brand: card.querySelector('.product-brand')?.textContent.replace('Marca:', '').trim() || '',
        price: Number((card.querySelector('.product-price')?.textContent || '0').replace(/[^0-9.]/g, '')),
        image: card.querySelector('img')?.getAttribute('src') || ''
    };
}

function cartCount(cart) {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function money(value) {
    return `$${value.toLocaleString('en-US')} USD`;
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
    const checkout = document.querySelector('.cart-checkout');
    if (checkout) {
        const order = cart.map((item) => `${item.quantity}x ${item.name} (${item.brand})`).join(', ');
        checkout.href = `mailto:hola@solara.com?subject=Pedido%20de%20Ventas%20Energía%20Solar&body=${encodeURIComponent(`Pedido: ${order}\nTotal: ${total.textContent}`)}`;
    }
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
            <div class="cart-summary"><span>Total</span><strong id="cart-total">$0 USD</strong></div>
            <section class="payment-box"><p class="product-type">Método de pago</p><h3>Transfermóvil por QR</h3><p>Escanea el código QR para preparar la transferencia desde Transfermóvil.</p><img class="payment-qr" src="${transfermovilQrImage}" alt="Código QR de Transfermóvil"><strong class="payment-account">Cuenta: ${transfermovilAccount}</strong><small>Verifica siempre el número y el importe antes de confirmar el pago.</small></section>
            <a class="primary-button cart-checkout" href="mailto:hola@solara.com?subject=Pedido%20de%20Ventas%20Energía%20Solar">Enviar pedido <span>↗</span></a>
        </div>`;
    document.body.appendChild(drawer);
}

document.addEventListener('click', (event) => {
    const buyButton = event.target.closest('.category-product .primary-button');
    const cartButton = event.target.closest('.cart-button');
    const actionButton = event.target.closest('[data-cart-action]');

    if (buyButton) {
        event.preventDefault();
        const cart = readCart();
        const product = productFromCard(buyButton.closest('.category-product'));
        const existing = cart.find((item) => item.name === product.name && item.brand === product.brand);
        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        saveCart(cart);
        updateCartButtons(cart);
        showCart();
    }

    if (cartButton) {
        event.preventDefault();
        showCart();
    }

    if (actionButton) {
        const cart = readCart();
        const index = Number(actionButton.dataset.index);
        const action = actionButton.dataset.cartAction;
        if (action === 'close') hideCart();
        if (action === 'increase') cart[index].quantity += 1;
        if (action === 'decrease') cart[index].quantity > 1 ? cart[index].quantity -= 1 : cart.splice(index, 1);
        if (action === 'remove') cart.splice(index, 1);
        if (action !== 'close') { saveCart(cart); renderCart(); }
    }

    if (event.target.id === 'cart-drawer') hideCart();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideCart();
});

createCartDrawer();
updateCartButtons(readCart());
