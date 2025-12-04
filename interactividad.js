document.addEventListener('DOMContentLoaded', function() {
    // =====================
    // NAVEGACIÓN INTERACTIVA
    // =====================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // =====================
    // FILTRO DE PRODUCTOS - FUNCIONAL
    // =====================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.producto-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            console.log('Filtro activado:', filter); // Debug

            // Remover active de todos los botones
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Animar y mostrar/ocultar productos
            productCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;
                
                if (shouldShow) {
                    // Mostrar tarjeta
                    card.style.display = 'block';
                    card.style.animation = 'none';
                    setTimeout(() => {
                        card.style.animation = 'slideIn 0.6s ease forwards';
                        card.style.opacity = '1';
                    }, 10);
                } else {
                    // Ocultar tarjeta
                    card.style.animation = 'slideOut 0.4s ease forwards';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400);
                }
            });
        });
    });

    // =====================
    // MODAL DE DETALLES - FUNCIONAL
    // =====================
    const modal = document.getElementById('productModal');
    const modalClose = document.querySelector('.modal-close');
    const overlayButtons = document.querySelectorAll('.overlay-btn');

    overlayButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.producto-card');
            const title = card.querySelector('h3').textContent;
            const desc = card.querySelector('.descripcion').textContent;
            const price = card.querySelector('.precio').textContent;
            const img = card.querySelector('img').src;

            // Llenar modal con datos del producto
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalDesc').textContent = desc;
            document.getElementById('modalPrice').textContent = 'Precio: ' + price;
            document.getElementById('modalImg').src = img;

            // Mostrar modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Cerrar modal
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // =====================
    // ANIMACIONES SCROLL
    // =====================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.valor-card, .contacto-card').forEach(el => {
        observer.observe(el);
    });

    // =====================
    // FORMULARIO CONTACTO
    // =====================
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = '✓ Enviado correctamente';
            btn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';

            setTimeout(() => {
                this.reset();
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
    }

    // =====================
    // ACTUALIZAR NAV ACTIVA AL SCROLL
    // =====================
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // =====================
    // ANIMACIÓN SLIDEOUT
    // =====================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            to {
                opacity: 0;
                transform: translateX(-20px);
            }
        }
    `;
    document.head.appendChild(style);
});