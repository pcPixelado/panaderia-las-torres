// HAMBURGUESA MENU
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
});

// FILTRO DE PRODUCTOS
const filterBtns = document.querySelectorAll('.filter-btn');
const productos = document.querySelectorAll('.producto-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        productos.forEach(producto => {
            if (filter === 'all' || producto.dataset.category === filter) {
                producto.style.display = 'flex';
            } else {
                producto.style.display = 'none';
            }
        });
    });
});

// MODAL DE PRODUCTO
const overlayBtns = document.querySelectorAll('.overlay-btn');
const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');
const modalClose = document.querySelector('.modal-close');

overlayBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
        const producto = btn.closest('.producto-card');
        const img = producto.querySelector('img').src;
        const title = producto.querySelector('h3').innerText;
        const desc = producto.querySelector('.descripcion').innerText;
        const price = producto.querySelector('.precio').innerText;

        modalImg.src = img;
        modalTitle.innerText = title;
        modalDesc.innerText = desc;
        modalPrice.innerText = price;

        modal.classList.add('active');
    });
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', e => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});
