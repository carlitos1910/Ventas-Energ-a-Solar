document.addEventListener('click', function (event) {
    const header = document.querySelector('.product-header');
    const button = document.querySelector('.product-menu-button');
    const menu = document.querySelector('#product-navigation');

    if (header && button && menu && !header.contains(event.target)) {
        button.classList.remove('is-open');
        menu.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
    }
});

document.addEventListener('keydown', function (event) {
    const button = document.querySelector('.product-menu-button');

    if (event.key === 'Escape' && button?.classList.contains('is-open')) {
        button.click();
    }
});
